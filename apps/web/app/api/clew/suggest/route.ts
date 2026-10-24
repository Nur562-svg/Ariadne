import { NextResponse } from "next/server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { loadBooks, loadCard, loadChapterPages } from "@/lib/entities";
import { publicProviderInfo, resolveClewProvider } from "@/lib/clew-provider";
import {
  ANSWER_MAX_OUTPUT_TOKENS,
  UPSTREAM_TIMEOUT_MS,
  buildPrompt,
  parseSuggestBody,
  truncatePageText,
  type ClewGrounding,
  type ClewSuggestContext,
} from "@/lib/clew-suggest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * T66 A：Clew 只读建议 API——**POST only**。一问 + 当前书桌上下文 → live 文本（或诚实错）。
 *
 * 五禁（铁 · 本文件每行遵守）：
 *   1. 不写 entities：本路**零 fs 写**——不碰 data/cards/*.entities.json / blocks.json / config / data/。
 *      只读 loadBooks / loadChapterPages / loadCard 取当前页 OCR 小窗与当前卡一行摘要。
 *   2. 不 verified：永不置 verified:true；响应只是复习提示，不是核对结论。
 *   3. 不 PATCH：不调 /api/entities 写路径、不调 /api/ingest 与 register；不落 atom-draft 仓。
 *   4. 不 bulk：chapters[] / pages[] / questions[] / extract·parse·ingest 作业形 → 4xx（parseSuggestBody）。
 *   5. 钥不入客户端：ZHIPU_API_KEY / MINIMAX_API_KEY 只在服务端 env；响应体只回 provider name + model；
 *      上游错误消息经 redact 去钥 + 截断。缺钥 → 503 no_provider（不静默空 200 假成功）。
 *
 * 不做诊断 / 回答 ≠ 已核 / 页码只采信请求上下文：见 lib/clew-suggest.ts 系统提示。
 * DEFER（不在本刀）：流式、三档选择器、配额、Auto 路由、BYOK。
 */

type Json = Record<string, unknown>;

function reply(status: number, body: Json, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/** 上游错误 → 可见短讯：去掉 apiKey 原文、截断、不带 responseBody 全文。 */
function redactError(e: unknown, apiKey: string): { detail: string; statusCode?: number } {
  const o = (e !== null && typeof e === "object" ? e : {}) as Record<string, unknown>;
  const statusCode = typeof o.statusCode === "number" ? o.statusCode : undefined;
  let msg = e instanceof Error ? e.message : String(e);
  if (apiKey) msg = msg.split(apiKey).join("[redacted]");
  msg = msg.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, "Bearer [redacted]");
  return { detail: msg.slice(0, 300), ...(statusCode != null ? { statusCode } : {}) };
}

/**
 * 服务端只读 grounding：
 *  - 当前页 OCR 小窗：有 chapter → 该章 blocks.json；无 chapter 但有 book+page → 遍该书章文件找同页
 *    （仍是单页查找，不是整章抽取）；都找不到才用客户端 pageText；全部 truncatePageText。
 *  - 当前卡一行摘要：loadCard(id) 取 name/one_liner + 卡内 cite 页去重 ≤ 8。
 * 任何读盘失败 → 该项缺省（答面如实写「本次没有页面原文小窗」），不抛不假。
 */
function buildGrounding(ctx: ClewSuggestContext): ClewGrounding {
  const g: ClewGrounding = {};
  try {
    if (ctx.page != null) {
      const book = ctx.book ? loadBooks().find((b) => b.id === ctx.book!.id) : undefined;
      let chapterIds: string[] = [];
      if (ctx.chapter) {
        // 书给了但章不属于书 → 不信该章（上下文不自洽，不拿它当页文本来源）。
        if (!book || book.chapterIds.includes(ctx.chapter.id)) chapterIds = [ctx.chapter.id];
      } else if (book) {
        chapterIds = book.chapterIds;
      }
      for (const chId of chapterIds) {
        const hit = loadChapterPages(chId).find((p) => p.page === ctx.page && p.text.trim());
        if (hit) {
          const t = truncatePageText(hit.text);
          g.pageWindow = { page: ctx.page, text: t.text, chars: t.chars, truncated: t.truncated, source: "server" };
          break;
        }
      }
      if (!g.pageWindow && ctx.pageText) {
        const t = truncatePageText(ctx.pageText);
        if (t.text) {
          g.pageWindow = { page: ctx.page, text: t.text, chars: t.chars, truncated: t.truncated, source: "client" };
        }
      }
    }
  } catch {
    // 读盘失败：无小窗（诚实）。
  }
  try {
    if (ctx.card?.id) {
      const card = loadCard(ctx.card.id);
      if (card) {
        const pages = new Set<number>();
        for (const c of card.cites) if (c.page != null) pages.add(c.page);
        for (const f of card.fields) if (f.cite?.page != null) pages.add(f.cite.page);
        for (const a of card.atoms) if (a.cite?.page != null) pages.add(a.cite.page);
        g.cardSummary = {
          id: card.id,
          name_zh: card.name_zh,
          ...(card.name_en ? { name_en: card.name_en } : {}),
          ...(card.one_liner ? { one_liner: card.one_liner } : {}),
          citePages: [...pages].sort((a, b) => a - b).slice(0, 8),
        };
      }
    }
  } catch {
    // 卡读取失败：退回 ctx.card 名（buildContextBlock 已处理）。
  }
  return g;
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return reply(400, { ok: false, mode: "stub", error: "bad_json", message: "请求体不是合法 JSON" });
  }
  const parsed = parseSuggestBody(raw);
  if (!parsed.ok) {
    return reply(parsed.status, { ok: false, mode: "stub", error: parsed.error, message: parsed.message });
  }

  const provider = resolveClewProvider(process.env);
  if (!provider) {
    // fail-closed：缺钥明确 503，不装成功；ClewPane 据此降诚实 stub。
    return reply(503, {
      ok: false,
      mode: "stub",
      error: "no_provider",
      message: "服务端未配置 ZHIPU_API_KEY / MINIMAX_API_KEY——本面板降为诚实 stub（未接模型）",
    });
  }

  const { question, context } = parsed.value;
  const g = buildGrounding(context);
  const { system, prompt } = buildPrompt(question, context, g);
  const info = publicProviderInfo(provider)!;

  const client = createOpenAICompatible({
    name: provider.name,
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
  });
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const result = await generateText({
      model: client(provider.model),
      system,
      prompt,
      temperature: 0.2,
      maxOutputTokens: ANSWER_MAX_OUTPUT_TOKENS,
      abortSignal: ac.signal,
    });
    const text = result.text.trim();
    if (!text) {
      return reply(502, { ok: false, mode: "stub", error: "empty_answer", message: "上游返回空文本" });
    }
    return reply(200, {
      ok: true,
      mode: "live",
      text,
      provider: info.name,
      model: info.model,
      pageWindow: g.pageWindow
        ? { page: g.pageWindow.page, chars: g.pageWindow.chars, truncated: g.pageWindow.truncated, source: g.pageWindow.source }
        : null,
      cardSummary: g.cardSummary ? { id: g.cardSummary.id, name_zh: g.cardSummary.name_zh } : null,
      finishReason: result.finishReason,
      usage: {
        inputTokens: result.usage?.inputTokens ?? null,
        outputTokens: result.usage?.outputTokens ?? null,
      },
      readonly: true,
    });
  } catch (e) {
    const aborted = ac.signal.aborted;
    const r = redactError(e, provider.apiKey);
    return reply(502, {
      ok: false,
      mode: "stub",
      error: aborted ? "upstream_timeout" : "upstream_error",
      message: aborted
        ? `上游超时（${Math.round(UPSTREAM_TIMEOUT_MS / 1000)}s）——原问已保留，可重试`
        : "上游调用失败——原问已保留，可重试",
      provider: info.name,
      model: info.model,
      ...r,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** POST only：GET / 其它方法 405（不接 ?q= 查询式触发模型）。 */
export async function GET() {
  return reply(
    405,
    { ok: false, error: "method_not_allowed", message: "POST only（JSON：{ question, context }）" },
    { Allow: "POST" },
  );
}
