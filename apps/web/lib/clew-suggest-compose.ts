/**
 * T84 机械抽出：原 lib/clew-suggest.ts 系统提示 + T67 D/E 补丁指令·白名单·解析 + 上下文拼装 +
 * buildPrompt + F 剪贴板带走·补丁信封 + T67 C 流事件编码整段迁此——系统提示文案 / 补丁白名单 /
 * 带走句 / 流事件公开投影零改。formatAuditTakeawayLine（原形状区私有）随入（唯一调用点
 * buildTakeawayText）；CLEW_HONESTY_FOOTNOTE 自 clew-suggest-grounding import。
 * 纯函数；无 fs / 无 process.env / 无 "use client"；流事件永不携带 apiKey / baseURL。
 * 铁合同七条与消费者入口仍在 @/lib/clew-suggest（barrel）。
 */

import {
  LONG_TOTAL_CHARS_MAX,
  PAGE_TEXT_MAX_CHARS,
  PATCH_AFTER_MAX_CHARS,
  PATCH_ENTRIES_MAX,
  SEED_BEFORE_MAX_CHARS,
  type ClewAnswerAuditWire,
  type ClewAnswerMeta,
  type ClewAuditBasisWire,
  type ClewCardAtomWire,
  type ClewGrounding,
  type ClewSeedBefore,
  type ClewSuggestContext,
  type SuggestPatchEntry,
} from "./clew-suggest-types.ts";
import { CLEW_HONESTY_FOOTNOTE } from "./clew-suggest-grounding.ts";

/** 与 formatAuditTakeawayLine 同句。无审计 / 失败 → 「核账：不可用」。 */
function formatAuditTakeawayLine(audit: ClewAnswerAuditWire | undefined): string {
  if (!audit || !("counts" in audit)) return "核账：不可用";
  const c = audit.counts;
  return `核账：接地 ${c.grounded} · 越窗未标 ${c.unmarked_out} · 无此原子 ${c.unknown}（≠ 内容已核）`;
}

// ---- 系统提示 ----

/**
 * 系统提示（铁）：不做诊断 · 只引给定页 · 回答≠已核 · 无写入权限 · 跟问答语言 · 小窗诚实。
 * 永不出现「写入 seed / verified:true / 自动补丁」之类指令。
 */
export const CLEW_SYSTEM_PROMPT = `你是 Ariadne 书桌右栏「Clew」的只读复习助手，服务一名正在考前复习医学教材的学生。

铁规则（逐条遵守）：
1. 不做医疗诊断、不给用药或治疗处置建议；问到临床处置一律引回教材概念层面作答。
2. 只能引用「本次请求给出」的书/章/当前页/实体卡与页面小窗；可引用时写成 p.N。没有给出的页码一律不要编造；若你推测某内容在别页，必须写「（未核验：推测在 p.?）」。
3. 你的回答不是核对结论：不要出现「已核」「已确认」「verified」之类措辞；教材印刷页才是唯一权威，你的回答只是复习提示。
4. 你没有写入权限：不要生成或建议「写入 seed / entities / blocks / 置 verified:true / 自动补丁」的指令；学生要改卡会自己到草稿编辑器里改。
5. 用学生提问的语言回答（中文问中文答）；简洁、分点、面向复习与易混辨析；专业术语保留中英对照；默认不超过约 300 字，学生明确要求再展开。
6. 页面小窗若已截断，可说明「本页小窗只有前 N 字」；小窗为空或没有页上下文时，直说「本次没有页面原文可对照」，再按概念层面作答。
7. 若上下文末尾带「结构化补丁规则」块：按该块在回答**末尾**追加一个 \`\`\`json 围栏（形如该块所示）；没有该块就不要输出任何围栏，也不要输出 entries。`;

// ---- T67 D/E：不完备 grounding → 补丁指令 + target 白名单 + 解析校验 ----

/** grounding 允许的结构化 target 集（仅既有原子 id / 字段下标；无 grounding → 空集=全拒）。 */
export function incompleteTargets(g?: ClewGrounding): string[] {
  if (!g?.incomplete) return [];
  const out: string[] = [];
  for (const a of g.incomplete.atoms) out.push(`atom:${a.id}`);
  for (const f of g.incomplete.fields) out.push(`field:${f.index}`);
  return out;
}

/**
 * 补丁指令块（拼在 prompt 末尾；无不完备 grounding → 空串，模型不输出围栏）。
 * 铁规则写死：只可填所列既有 target；禁止发明 id；禁止 verified；无可填直接不输出。
 */
export function buildPatchInstructionBlock(g?: ClewGrounding): string {
  const inc = g?.incomplete;
  if (!inc || (inc.atoms.length === 0 && inc.fields.length === 0)) return "";
  const lines: string[] = ["【结构化补丁规则 · 只可对下列既有目标建议填空】"];
  lines.push(
    "若你的回答能帮当前卡补上列空字段，在回答最末尾追加一个 ```json 围栏，形如：",
    '```json',
    '{"patch":{"entries":[{"target":"atom:<所列原子id>","field":"prompt","after":"建议填入的文本"}]}}',
    "```",
    "规则：target 只能取下方所列；field ∈ prompt|answer|citeQuote（原子）或 value（字段）；",
    "after 是建议填空文本（中文、简洁、仅教材概念层面）；禁止发明新原子 id / 新字段下标；",
    "禁止输出 verified / 页码 / 任何写入指令；没有可填的就**不要**输出围栏。",
    "",
    "可建议填空的既有目标：",
  );
  for (const a of inc.atoms) {
    const empties = [
      a.emptyPrompt ? "prompt" : null,
      a.emptyAnswer ? "answer" : null,
      a.emptyCiteQuote ? "citeQuote" : null,
    ].filter(Boolean);
    const given = [
      a.prompt ? `已有 prompt：${a.prompt}` : null,
      a.answer ? `已有 answer：${a.answer}` : null,
    ].filter(Boolean);
    lines.push(`- atom:${a.id}（空：${empties.join("、")}${given.length ? ` · ${given.join(" · ")}` : ""}）`);
  }
  for (const f of inc.fields) {
    lines.push(`- field:${f.index}（字段「${f.label}」value 为空）`);
  }
  return lines.join("\n");
}

// ---- 上下文拼装 ----

const SURFACE_ZH: Record<string, string> = {
  desk: "书桌（中栏章页/实体卡）",
  card: "本卡",
  study: "学习环",
  review: "核页工作台",
  library: "书架",
};

/** 书桌上下文块（只读）：书/章/页/cite 页/可见实体/当前卡/表面 + 可选页小窗。无页小窗时如实写明。 */
export function buildContextBlock(ctx: ClewSuggestContext, g?: ClewGrounding): string {
  const lines: string[] = ["【书桌上下文 · 只读 · 由本次请求给出】"];
  lines.push(
    ctx.book
      ? `书：《${ctx.book.title}》（id ${ctx.book.id}）`
      : "书：（无 · 书库为空或未打开书）",
  );
  if (ctx.chapter) lines.push(`章：${ctx.chapter.title}（${ctx.chapter.id}）`);
  if (ctx.page != null) lines.push(`当前印刷页：p.${ctx.page}`);
  if (ctx.citePages?.length) {
    lines.push(`可见实体卡 cite 页：${ctx.citePages.map((p) => `p.${p}`).join("、")}`);
  }
  if (ctx.visibleEntityName) lines.push(`可见实体：${ctx.visibleEntityName}`);
  if (g?.cardSummary) {
    const c = g.cardSummary;
    lines.push(
      `当前卡：${c.name_zh}${c.name_en ? ` / ${c.name_en}` : ""}` +
        `${c.one_liner ? ` —— ${c.one_liner}` : ""}` +
        `${c.citePages.length ? `（卡 cite p.${c.citePages.join("、p.")}）` : ""}`,
    );
  } else if (ctx.card) {
    lines.push(`当前卡：${ctx.card.name_zh}`);
  }
  if (ctx.surface) lines.push(`表面：${SURFACE_ZH[ctx.surface] ?? ctx.surface}`);

  if (g?.pageWindow) {
    const w = g.pageWindow;
    lines.push("");
    lines.push(
      `【p.${w.page} OCR 小窗 · ${w.source === "server" ? "服务端自 blocks.json 取" : "客户端传入"} · ` +
        `${w.truncated ? `原文 ${w.chars} 字，只取前 ${PAGE_TEXT_MAX_CHARS} 字` : `${w.chars} 字`}】`,
    );
    lines.push(w.text);
    // T69 C：long-context 同章有界附加窗——标注接地页 / 总字对顶 / 非全书；因字顶未装的页如实报数。
    if (g.extraWindows?.length) {
      const gr = g.ground;
      const pages = (gr?.pages ?? [w.page, ...g.extraWindows.map((x) => x.page)]).slice().sort((a, b) => a - b);
      lines.push("");
      lines.push(
        `【同章有界多页接地 · 非全书 · 页 p.${pages.join("、p.")} · 共 ${gr?.totalChars ?? "？"} 字 / 顶 ${gr?.maxTotalChars ?? LONG_TOTAL_CHARS_MAX} 字` +
          `${gr && gr.pagesOmitted > 0 ? ` · 另有 ${gr.pagesOmitted} 页因总字顶未装` : ""}】`,
      );
      for (const x of g.extraWindows) {
        lines.push(
          `【p.${x.page} OCR 小窗 · 服务端自 blocks.json 取 · ` +
            `${x.truncated ? `原文 ${x.chars} 字，只取前 ${PAGE_TEXT_MAX_CHARS} 字` : `${x.chars} 字`}】`,
        );
        lines.push(x.text);
      }
    } else if (g.ground && g.ground.pagesOmitted > 0) {
      // T70 D：扩页全因总字顶未装（extras=0, omitted>0）——仍诚实报数，不装成「只读了这一页所以没事」。
      const gr = g.ground;
      lines.push("");
      lines.push(
        `【同章有界 · 非全书 · 本次装入 p.${gr.pages.join("、p.")} · 另有 ${gr.pagesOmitted} 页因总字顶未装】`,
      );
    }
  } else {
    lines.push("（本次没有页面原文小窗：只能按概念层面作答，不要编造页码）");
  }
  return lines.join("\n");
}

/** route 用：system + prompt 一对（generateText/streamText 入参形）；有不完备 grounding 时拼补丁指令块。 */
export function buildPrompt(
  question: string,
  ctx: ClewSuggestContext,
  g?: ClewGrounding,
): { system: string; prompt: string } {
  const patchBlock = buildPatchInstructionBlock(g);
  return {
    system: CLEW_SYSTEM_PROMPT,
    prompt:
      `${buildContextBlock(ctx, g)}\n\n【学生问】\n${question}` +
      (patchBlock ? `\n\n${patchBlock}` : ""),
  };
}

// ---- F：剪贴板带走（只生成字符串；永不写 store / 仓库） ----

function cutSeedBefore(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t ? t.slice(0, SEED_BEFORE_MAX_CHARS) : null;
}

/**
 * 从当前卡 seed 只读导出白名单 target 的 before 值（T69 D）：atom → prompt/answer/citeQuote
 * （cite.quote），field:<i> → value；空 → null；超长截断。发明 / 越界 target 不在白名单 →
 * 不入 map（parseSuggestPatchEntries 回查不到 → null，且这类 target 本就整条丢弃）。
 * 只读：不改卡、不写盘、不碰 verified。
 */
export function buildSeedBeforeMap(
  card:
    | {
        atoms?: { id: string; prompt?: string; answer?: string; cite?: { quote?: string } }[];
        fields?: { value?: string }[];
      }
    | undefined
    | null,
  allowedTargets: readonly string[],
): ClewSeedBefore {
  const out: ClewSeedBefore = {};
  if (!card) return out;
  for (const t of allowedTargets) {
    if (t.startsWith("atom:")) {
      const a = (card.atoms ?? []).find((x) => x.id === t.slice(5));
      if (a) out[t] = { prompt: cutSeedBefore(a.prompt), answer: cutSeedBefore(a.answer), citeQuote: cutSeedBefore(a.cite?.quote) };
    } else if (t.startsWith("field:")) {
      const i = Number(t.slice(6));
      const f = Number.isInteger(i) && i >= 0 ? (card.fields ?? [])[i] : undefined;
      if (f) out[t] = { value: cutSeedBefore(f.value) };
    }
  }
  return out;
}

const SUGGEST_PATCH_FIELDS = new Set(["prompt", "answer", "citeQuote", "value"]);

/**
 * 校验模型/粘贴给出的 entries：只留 target ∈ allowedTargets、field 合法枚举、after 为非空
 * 字符串、无 verified/写入意图键的条目；after 截 PATCH_AFTER_MAX_CHARS；最多 PATCH_ENTRIES_MAX
 * 条（超出丢弃——宁少勿造）。allowedTargets 为空 → 全拒（无 grounding 就没有合法 target）。
 * T69 D：before **只认** beforeByTarget（服务端 seed 只读导出）——模型自报的 before 键不读
 * 不透传；查不到（含新增候选）→ null。永不影响 target 白名单与丢弃规则。
 */
export function parseSuggestPatchEntries(
  raw: unknown,
  allowedTargets: readonly string[],
  beforeByTarget?: ClewSeedBefore | null,
): SuggestPatchEntry[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(allowedTargets);
  const out: SuggestPatchEntry[] = [];
  for (const item of raw) {
    if (out.length >= PATCH_ENTRIES_MAX) break;
    if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    if ("verified" in o || "write" in o || "apply" in o) continue; // 写入意图整条丢弃
    const target = o.target;
    const field = o.field;
    const after = o.after;
    if (typeof target !== "string" || !allowed.has(target)) continue; // 发明/未知 target 丢弃
    if (typeof field !== "string" || !SUGGEST_PATCH_FIELDS.has(field)) continue;
    if (typeof after !== "string" || !after.trim()) continue;
    out.push({
      target,
      field: field as SuggestPatchEntry["field"],
      before: beforeByTarget?.[target]?.[field as SuggestPatchEntry["field"]] ?? null,
      after: after.slice(0, PATCH_AFTER_MAX_CHARS),
    });
  }
  return out;
}

/** 从答案全文剥**尾随**最后一个 ```json 围栏（中段围栏不剥——那是正文代码示例）；before 对齐同 parseSuggestPatchEntries（T69 D）。 */
export function splitStructuredPatch(
  fullText: string,
  allowedTargets: readonly string[],
  beforeByTarget?: ClewSeedBefore | null,
): { answer: string; entries: SuggestPatchEntry[] } {
  const m = fullText.match(/```json\s*([\s\S]*?)\s*```\s*$/);
  if (!m) return { answer: fullText.trimEnd(), entries: [] };
  const answer = fullText.slice(0, m.index ?? 0).trimEnd();
  let entries: SuggestPatchEntry[] = [];
  try {
    const parsed: unknown = JSON.parse(m[1]);
    const o = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
    const rawEntries = Array.isArray(o.entries)
      ? o.entries
      : o.patch !== null && typeof o.patch === "object" && !Array.isArray(o.patch) &&
          Array.isArray((o.patch as Record<string, unknown>).entries)
        ? (o.patch as Record<string, unknown>).entries
        : null;
    entries = parseSuggestPatchEntries(rawEntries, allowedTargets, beforeByTarget);
  } catch {
    entries = []; // 坏 JSON → 诚实无补丁（答案仍展示），不抛
  }
  return { answer, entries };
}

function contextLine(ctx: ClewSuggestContext): string {
  return [
    ctx.book ? `《${ctx.book.title}》` : null,
    ctx.chapter ? ctx.chapter.title : null,
    ctx.page != null ? `p.${ctx.page}` : null,
    ctx.card ? `卡「${ctx.card.name_zh}」` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** 答面「复制纯文本」：带来源行与诚实尾注的问答块（live/stub 都如实标）。 */
export function buildTakeawayText(
  question: string,
  answer: string,
  ctx: ClewSuggestContext,
  meta: ClewAnswerMeta,
): string {
  const src =
    meta.mode === "live"
      ? `live · ${meta.provider ?? "?"}${meta.model ? ` / ${meta.model}` : ""}`
      : "stub · 未接模型";
  const win =
    meta.groundPages != null && meta.groundPages.length > 1
      ? `对照小窗：p.${meta.groundPages.join("、p.")}（同章有界 · 非全书）`
      : meta.pageWindow != null
        ? `对照小窗：p.${meta.pageWindow.page}（${meta.pageWindow.truncated ? `前 ${PAGE_TEXT_MAX_CHARS} 字 / 共 ${meta.pageWindow.chars} 字` : `${meta.pageWindow.chars} 字`}）`
        : "对照小窗：无";
  const omitted =
    meta.pagesOmitted != null && meta.pagesOmitted > 0 ? `另有 ${meta.pagesOmitted} 页因总字顶未装` : null;
  const where = contextLine(ctx);
  return [
    `【Clew 只读建议 · ${src} · 未核】`,
    where ? `上下文：${where}` : "上下文：书架 / 无书",
    win,
    ...(omitted ? [omitted] : []),
    formatAuditTakeawayLine(meta.audit),
    "",
    `问：${question}`,
    "",
    `答：${answer}`,
    "",
    `— ${CLEW_HONESTY_FOOTNOTE} —`,
  ].join("\n");
}

/**
 * 「复制为草稿补丁」：对齐 lib/atom-draft.ts 的 `ariadne.atom-draft-patch.v1`
 * （schema / cardId / chapterId? / note / entries）。entries 可非空——但每条都出自
 * parseSuggestPatchEntries 白名单（仅既有 target，模型建议填空），不是发明的原子/字段改动；
 * T69 D 起 before = 当前卡 seed 现值（空字段 null；截 SEED_BEFORE_MAX_CHARS）——人核时
 * before→after 一眼可比；永不含 verified 翻改。问答在 note；用户自行粘贴到 DraftInbox
 * 导入或卡详编辑器。无当前卡 → null。本函数只组字符串；永不 setAtomDraft / PATCH / writeFile。
 */
export type ClewPatchEnvelope = {
  schema: "ariadne.atom-draft-patch.v1";
  cardId: string;
  chapterId?: string;
  note: string;
  entries: SuggestPatchEntry[];
};

export function buildSuggestPatchEnvelope(
  question: string,
  answer: string,
  ctx: ClewSuggestContext,
  meta: ClewAnswerMeta,
  entries: SuggestPatchEntry[] = [],
): ClewPatchEnvelope | null {
  if (!ctx.card) return null;
  const src = meta.mode === "live" ? `${meta.provider ?? "?"}${meta.model ? `/${meta.model}` : ""}` : "stub";
  const doc: ClewPatchEnvelope = {
    schema: "ariadne.atom-draft-patch.v1",
    cardId: ctx.card.id,
    ...(ctx.chapter ? { chapterId: ctx.chapter.id } : {}),
    note:
      `Clew 只读建议（${src} · 未核 · 本浏览器不会写回仓库 · 不含 verified 翻改）` +
      `${ctx.page != null ? ` · 对照 p.${ctx.page}` : ""}\n` +
      `问：${question}\n答：${answer}` +
      (entries.length > 0
        ? `\nentries：模型建议填空 ${entries.length} 条（仅既有原子/字段，人核后粘贴导入或手抄；before=当前卡 seed 现值，空字段为 null）`
        : "\nentries 为空：无可建议填空的既有目标；要改 seed 请人核后在草稿编辑器手填"),
    entries,
  };
  return doc;
}

export function buildSuggestPatchText(
  question: string,
  answer: string,
  ctx: ClewSuggestContext,
  meta: ClewAnswerMeta,
  entries: SuggestPatchEntry[] = [],
): string | null {
  const doc = buildSuggestPatchEnvelope(question, answer, ctx, meta, entries);
  return doc ? JSON.stringify(doc, null, 2) : null;
}

// ---- T67 C：流式事件（NDJSON 行；只携带公开投影，永不携带 apiKey / baseURL） ----

export type ClewStreamEvent =
  | {
      type: "meta";
      /** T68：本次调用的档（fast|reasoning|long-context）。 */
      tier: string;
      provider: string;
      model: string;
      pageWindow: { page: number; chars: number; truncated: boolean; source: "server" | "client" } | null;
      cardSummary: { id: string; name_zh: string } | null;
      /** 补丁 target 白名单（服务端 grounding 实算；空数组=本次无结构化目标）。 */
      incompleteTargets: string[];
      /** T69 C：本次接地页平铺（含当前页；long-context 多页=同章有界；无窗 → 空数组）。 */
      groundPages?: number[];
      /** T70 D：全超顶 / 部分超顶未装页数（0 不写）。 */
      pagesOmitted?: number;
      /** T69 D：白名单 target 的 seed 现值（before 对齐；无卡/无目标 → null）。 */
      seedBefore?: ClewSeedBefore | null;
      /** T70：流式预览用的 basis（与 done.meta.audit 同源；可选，旧客户端忽略）。 */
      auditBasis?: ClewAuditBasisWire;
      /** T70：当前卡原子 id + cite 页（只读投影；答面「涉及的原子」用，不写草稿）。 */
      cardAtoms?: ClewCardAtomWire[];
      readonly: true;
    }
  | { type: "delta"; text: string }
  | {
      type: "done";
      finishReason?: string;
      usage?: { inputTokens?: number | null; outputTokens?: number | null };
      /**
       * T70 C：权威核账。可选键——旧 done 事件没有 meta，客户端当作「核账不可用」，
       * 不涂绿。失败形 meta.audit = { error: "audit_unavailable" }，HTTP 状态不因此改变。
       */
      meta?: { audit: ClewAnswerAuditWire };
    }
  | { type: "error"; message: string };

/** 一行 NDJSON（结尾 \n）；ClewPane 按行 JSON.parse。 */
export function encodeClewStreamEvent(e: ClewStreamEvent): string {
  return `${JSON.stringify(e)}\n`;
}
