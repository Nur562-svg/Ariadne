import { NextResponse } from "next/server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, streamText } from "ai";
import { loadBooks, loadCard, loadChapterPages, type EntityCard } from "@/lib/entities";
import { publicProviderInfo, resolveClewProvider } from "@/lib/clew-provider";
import {
  ANSWER_MAX_OUTPUT_TOKENS,
  GROUND_ATOMS_MAX,
  GROUND_FIELDS_MAX,
  GROUND_VALUE_MAX_CHARS,
  STREAM_INACTIVITY_TIMEOUT_MS,
  STREAM_OVERALL_TIMEOUT_MS,
  UPSTREAM_TIMEOUT_MS,
  buildPrompt,
  encodeClewStreamEvent,
  incompleteTargets,
  parseSuggestBody,
  truncatePageText,
  type ClewGrounding,
  type ClewIncompleteGrounding,
  type ClewSuggestContext,
} from "@/lib/clew-suggest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * T66 A / T67 A：Clew 只读建议 API——**POST only**。一问 + 当前书桌上下文 → 流式 live 文本
 * （NDJSON：meta → delta* → done｜error）或诚实错；`"stream": false` 走非流兼容枝（T66 JSON 形）。
 *
 * 五禁（铁 · 本文件每行遵守；流式不改变任何一条）：
 *   1. 不写 entities：本路**零 fs 写**——不碰 data/cards/*.entities.json / blocks.json / config / data/。
 *      只读 loadBooks / loadChapterPages / loadCard 取当前页 OCR 小窗、当前卡一行摘要与
 *      **既有**不完备原子清单（T67 D grounding；只列 id/空标记，永不代写）。
 *   2. 不 verified：永不置 verified:true；响应只是复习提示，不是核对结论。
 *   3. 不 PATCH：不调 /api/entities 写路径、不调 /api/ingest 与 register；不落 atom-draft 仓
 *      ——结构化补丁只随流事件/JSON 交给**用户**，粘贴或点击导入永远发生在用户侧（G）。
 *   4. 不 bulk：chapters[] / pages[] / questions[] / extract·parse·ingest 作业形 → 4xx（parseSuggestBody）。
 *   5. 钥不入客户端：ZHIPU_API_KEY / MINIMAX_API_KEY 只在服务端 env；流事件与 JSON 只回
 *      provider name + model；上游错误经 redact 去钥 + 截断。缺钥 → 503 no_provider。
 *
 * 不做诊断 / 回答 ≠ 已核 / 页码只采信请求上下文：见 lib/clew-suggest.ts 系统提示。
 * fail-closed 流式：鉴权/上游错在首 chunk 前抛 → 502 JSON；中途断 → error 事件行，
 * 客户端保留已收文本 + 可重试。DEFER（不在本刀）：三档选择器、配额、Auto 路由、BYOK。
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

function cut(s: string | undefined, max = GROUND_VALUE_MAX_CHARS): string | undefined {
  const t = (s ?? "").trim();
  return t ? t.slice(0, max) : undefined;
}

/**
 * T67 D：当前卡 seed 口径不完备 grounding——与 T55 incompleteAtoms 同口径（trim 空 prompt/answer）
 * 加空 citeQuote；**仅既有 id**；既有非空值只读截断；列表封顶（超出如实标注）。零不完备 → undefined
 * （上下文无补丁指令块，模型不输出围栏，客户端 entries 诚实 []）。
 */
function buildIncompleteGrounding(card: EntityCard): ClewIncompleteGrounding | undefined {
  const atoms: ClewIncompleteGrounding["atoms"] = [];
  let overflow = 0;
  for (const a of card.atoms ?? []) {
    const emptyPrompt = !(a.prompt ?? "").trim();
    const emptyAnswer = !(a.answer ?? "").trim();
    const emptyCiteQuote = !(a.cite?.quote ?? "").trim();
    if (!emptyPrompt && !emptyAnswer && !emptyCiteQuote) continue;
    if (atoms.length >= GROUND_ATOMS_MAX) {
      overflow++;
      continue;
    }
    atoms.push({
      id: a.id,
      emptyPrompt,
      emptyAnswer,
      emptyCiteQuote,
      ...(emptyPrompt ? {} : { prompt: cut(a.prompt) }),
      ...(emptyAnswer ? {} : { answer: cut(a.answer) }),
    });
  }
  const fields: ClewIncompleteGrounding["fields"] = [];
  (card.fields ?? []).forEach((f, i) => {
    if (fields.length >= GROUND_FIELDS_MAX) return;
    if (!(f.value ?? "").trim()) fields.push({ index: i, label: (f.label ?? `字段${i}`).slice(0, 40) });
  });
  if (atoms.length === 0 && fields.length === 0) return undefined;
  if (overflow > 0) {
    atoms.push({ id: `（还有 ${overflow} 个不完备原子未列——超出 grounding 上限）`, emptyPrompt: true, emptyAnswer: true, emptyCiteQuote: true });
  }
  return { atoms, fields };
}

/**
 * 服务端只读 grounding：
 *  - 当前页 OCR 小窗：有 chapter → 该章 blocks.json；无 chapter 但有 book+page → 遍该书章文件找同页
 *    （仍是单页查找，不是整章抽取）；都找不到才用客户端 pageText；全部 truncatePageText。
 *  - 当前卡一行摘要 + T67 不完备清单：loadCard(id) 取 name/one_liner + 卡内 cite 页去重 ≤ 8。
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
        const inc = buildIncompleteGrounding(card);
        if (inc) g.incomplete = inc;
      }
    }
  } catch {
    // 卡读取失败：退回 ctx.card 名（buildContextBlock 已处理）。
  }
  return g;
}

/** body 顶层可选 "stream": false → 非流兼容枝（默认流式主路径）。 */
function wantsNonStream(raw: unknown): boolean {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw)
    && (raw as Record<string, unknown>).stream === false;
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
  const targets = incompleteTargets(g);

  const client = createOpenAICompatible({
    name: provider.name,
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
  });

  // ---- 非流兼容枝（T66 形；curl/脚本消费者用；流式才是主路径） ----
  if (wantsNonStream(raw)) {
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
        incompleteTargets: targets,
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

  // ---- 流式主路径（NDJSON：meta → delta* → done｜error） ----
  const ac = new AbortController();
  let inactivity: ReturnType<typeof setTimeout> | null = null;
  let overall = setTimeout(() => ac.abort(), STREAM_OVERALL_TIMEOUT_MS);
  const bumpInactivity = () => {
    if (inactivity) clearTimeout(inactivity);
    inactivity = setTimeout(() => ac.abort(), STREAM_INACTIVITY_TIMEOUT_MS);
  };
  /**
   * 错误面：ai v5 里上游错（如 401）以内部 promise 的形式发生，textStream/fullStream 迭代器
   * 可能**不抛**而静默 done——唯一可靠观察口是 onError 回调（d.ts 明示）。记首个错误，
   * pre-flight 无 delta / done 后都按它归因，绝不把上游错装成 empty_answer 或假 done。
   */
  let streamErr: unknown = null;
  const result = streamText({
    model: client(provider.model),
    system,
    prompt,
    temperature: 0.2,
    maxOutputTokens: ANSWER_MAX_OUTPUT_TOKENS,
    abortSignal: ac.signal,
    onError: (e) => {
      if (streamErr == null) streamErr = e;
    },
  });

  // Pre-flight（fullStream）：拉到首个文本 delta 之前，鉴权/连线上游错误以 error part 显式出现
  // （textStream 会把 401 吞成静默结束——归因不诚实）→ 此处还能回真状态码 502，不装流式假 200。
  const parts = result.fullStream[Symbol.asyncIterator]();
  let firstDelta: string | null = null;
  let preflightError: string | null = null;
  bumpInactivity();
  try {
    while (firstDelta == null && preflightError == null) {
      const r = await parts.next();
      if (r.done) break;
      const p = r.value;
      if (p.type === "text-delta" && p.text) firstDelta = p.text;
      else if (p.type === "error") preflightError = p.error instanceof Error ? p.error.message : String(p.error ?? "上游流错误");
      // 其它 part（text-start 等）继续拉
    }
  } catch (e) {
    clearTimeout(overall);
    if (inactivity) clearTimeout(inactivity);
    const r = redactError(e, provider.apiKey);
    return reply(502, {
      ok: false,
      mode: "stub",
      error: "upstream_error",
      message: "上游调用失败——原问已保留，可重试",
      provider: info.name,
      model: info.model,
      ...r,
    });
  }
  clearTimeout(overall);
  if (inactivity) clearTimeout(inactivity);
  if (preflightError != null) {
    return reply(502, {
      ok: false,
      mode: "stub",
      error: "upstream_error",
      message: "上游调用失败——原问已保留，可重试",
      provider: info.name,
      model: info.model,
      detail: preflightError.split(provider.apiKey).join("[redacted]").slice(0, 300),
    });
  }
  if (firstDelta == null) {
    if (streamErr != null) {
      const r = redactError(streamErr, provider.apiKey);
      return reply(502, {
        ok: false,
        mode: "stub",
        error: "upstream_error",
        message: "上游调用失败——原问已保留，可重试",
        provider: info.name,
        model: info.model,
        ...r,
      });
    }
    return reply(502, { ok: false, mode: "stub", error: "empty_answer", message: "上游返回空文本" });
  }
  // 成功起流：总时长闸从现在重开（inactivity 由 bump 管）。
  overall = setTimeout(() => ac.abort(), STREAM_OVERALL_TIMEOUT_MS);

  const metaEvent = {
    type: "meta",
    provider: info.name,
    model: info.model,
    pageWindow: g.pageWindow
      ? { page: g.pageWindow.page, chars: g.pageWindow.chars, truncated: g.pageWindow.truncated, source: g.pageWindow.source }
      : null,
    cardSummary: g.cardSummary ? { id: g.cardSummary.id, name_zh: g.cardSummary.name_zh } : null,
    incompleteTargets: targets,
    readonly: true,
  } as const;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (e: Parameters<typeof encodeClewStreamEvent>[0]) => controller.enqueue(enc.encode(encodeClewStreamEvent(e)));
      try {
        send(metaEvent);
        send({ type: "delta", text: firstDelta });
        bumpInactivity();
        for (;;) {
          const r = await parts.next();
          if (r.done) break;
          const p = r.value;
          if (p.type === "text-delta" && p.text) {
            send({ type: "delta", text: p.text });
            bumpInactivity();
          } else if (p.type === "error") {
            throw p.error instanceof Error ? p.error : new Error(String(p.error ?? "上游流错误"));
          }
          // 其它 part（text-start/end、finish 等）不外发
        }
        // best-effort 收尾元信息（abort 时可能 reject——catch 兜底）
        let finishReason: string | undefined;
        let usage: { inputTokens?: number | null; outputTokens?: number | null } | undefined;
        try {
          const [fr, u] = await Promise.all([result.finishReason, result.usage]);
          finishReason = fr;
          usage = { inputTokens: u?.inputTokens ?? null, outputTokens: u?.outputTokens ?? null };
        } catch {
          /* 尾信息缺省，不影响答文本 */
        }
        // onError 记到错（迭代器静默 done 的中途上游错）→ 发 error 行不发假 done：已收文本保留可重试。
        if (streamErr != null) {
          const r = redactError(streamErr, provider.apiKey);
          send({
            type: "error",
            message: `上游流中断——已收文本保留，可重试（${r.detail || "无详情"}${r.statusCode != null ? ` · 上游 ${r.statusCode}` : ""}）`,
          });
        } else {
          send({ type: "done", ...(finishReason != null ? { finishReason } : {}), ...(usage ? { usage } : {}) });
        }
      } catch (e) {
        const r = redactError(e, provider.apiKey);
        try {
          send({
            type: "error",
            message: ac.signal.aborted
              ? `上游流中断（超时/中止）——已收文本保留，可重试${r.statusCode != null ? `（上游 ${r.statusCode}）` : ""}`
              : `上游流中断——已收文本保留，可重试（${r.detail || "无详情"}）`,
          });
        } catch {
          /* controller 已关（客户端断开）：无需再发 */
        }
      } finally {
        clearTimeout(overall);
        if (inactivity) clearTimeout(inactivity);
        try {
          controller.close();
        } catch {
          /* 已关 */
        }
      }
    },
    cancel() {
      ac.abort(); // 客户端停止 → 上游一并中止（只读，无副作用）
      clearTimeout(overall);
      if (inactivity) clearTimeout(inactivity);
    },
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

/** POST only：GET / 其它方法 405（不接 ?q= 查询式触发模型）。 */
export async function GET() {
  return reply(
    405,
    { ok: false, error: "method_not_allowed", message: "POST only（JSON：{ question, context, stream? }）" },
    { Allow: "POST" },
  );
}
