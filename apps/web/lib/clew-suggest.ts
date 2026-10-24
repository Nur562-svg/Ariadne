/**
 * T66 C：Clew 只读建议——请求体校验 + 系统提示 + 书桌上下文拼装 + 剪贴板带走文本（纯函数）。
 * 无 "use client"、无 import、无 fs、无 process.env：服务端 route 与客户端 ClewPane 共用形状，
 * scripts/clew-suggest-check.mjs 直接 import 本 .ts 单测（Node ≥ 23.6 原生剥类型）。
 *
 * 铁合同（本文件每个函数都遵守；route.ts / ClewPane 同守）：
 *   1. 只读答：只产出提示串与文本；永不指示模型或调用方写 entities / blocks / verified:true / PATCH。
 *   2. 永不 bulk：一次请求 = 一问 + 当前书桌上下文；chapters[] / pages[] / questions[] /
 *      extract·parse·ingest 作业形一律 4xx 拒收（parseSuggestBody）。
 *   3. 不做诊断：系统提示写死；回答 ≠ seed verified ≠ heye 已对 ≠ study 已练。
 *   4. 页码只采信请求上下文：模型自造页码须标「未核验」；系统提示明示只能引用给定页。
 *   5. 钥不经此文件：不读 env、不碰 key；provider 解析在 lib/clew-provider.ts，调用在 route。
 */

// ---- 形状 ----

/** 客户端可发的书桌上下文子集：DeskContext ClewContextData 的只读投影（不含 progress* 池）。 */
export type ClewSuggestContext = {
  book?: { id: string; title: string };
  chapter?: { id: string; title: string };
  /** 当前印刷页（正整数）；无则不发。 */
  page?: number | null;
  /** 可见实体卡 cite 印刷页示例（≤ CITE_PAGES_MAX）。 */
  citePages?: number[];
  visibleEntityName?: string;
  card?: { id: string; name_zh: string };
  surface?: string;
  /** 可选：客户端传入的当前页 OCR 小窗；服务端仍截断，且服务端自取（blocks.json）优先。 */
  pageText?: string;
};

export type ClewSuggestRequest = { question: string; context: ClewSuggestContext };

/** 服务端只读自取的 grounding（route 填）：当前页 OCR 截断小窗 + 当前卡一行摘要。 */
export type ClewGrounding = {
  pageWindow?: {
    page: number;
    text: string;
    /** 原文总字数（截断前）。 */
    chars: number;
    truncated: boolean;
    source: "server" | "client";
  };
  cardSummary?: {
    id: string;
    name_zh: string;
    name_en?: string;
    one_liner?: string;
    citePages: number[];
  };
};

/** 答面元信息（UI 短标 / 带走文本用）。 */
export type ClewAnswerMeta = {
  mode: "live" | "stub";
  provider?: string;
  model?: string;
  pageWindow?: { page: number; chars: number; truncated: boolean };
};

export const QUESTION_MAX_CHARS = 2000;
export const PAGE_TEXT_MAX_CHARS = 3000;
export const CITE_PAGES_MAX = 8;
/** 单答输出上限（小能力 · 复习提示，不是长文）。 */
export const ANSWER_MAX_OUTPUT_TOKENS = 700;
/** 上游超时（ms）；超时 → 502 可见错 + 保留原问可重试。 */
export const UPSTREAM_TIMEOUT_MS = 30_000;

/** G：诚实脚注——ClewPane 底栏与 docs 同源一句（保留既有「以教材页码为准」口径）。 */
export const CLEW_HONESTY_FOOTNOTE =
  "不做诊断 · 回答≠已核 · 永不写 seed · 页码以印刷页为准 · 小能力只读";

// ---- 请求体校验（拒 bulk / 作业形） ----

export type ParseResult =
  | { ok: true; value: ClewSuggestRequest }
  | { ok: false; status: 400 | 413 | 422; error: string; message: string };

/**
 * 作业形键：出现在 body 顶层或 context 内即 422 拒——哪怕是空数组。
 * 本路只收「一问 + 当前书桌上下文」；整章/多章/全书 parse·extract·ingest 与任何写意图不走这里。
 */
export const JOB_SHAPE_KEYS = [
  "chapters",
  "pages",
  "questions",
  "items",
  "batch",
  "jobs",
  "extract",
  "parse",
  "ingest",
  "cards",
  "blocks",
  "entities",
  "write",
  "apply",
  "patch",
  "verified",
] as const;

const SURFACES = new Set(["desk", "card", "study", "review", "library"]);

function isPrintedPage(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v > 0 && v < 100_000;
}

function idTitle(v: unknown): { id: string; title: string } | undefined {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id.trim() || typeof o.title !== "string") return undefined;
  return { id: o.id.trim().slice(0, 128), title: o.title.trim().slice(0, 200) };
}

function findJobShapeKey(o: Record<string, unknown>): string | null {
  for (const k of JOB_SHAPE_KEYS) if (k in o) return k;
  return null;
}

/** 白名单投影：未知键一律丢弃；非法值丢弃（不抛）。pageText 只收字符串，截断交给 truncatePageText。 */
export function sanitizeContext(raw: unknown): ClewSuggestContext {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const c = raw as Record<string, unknown>;
  const out: ClewSuggestContext = {};
  const book = idTitle(c.book);
  if (book) out.book = book;
  const chapter = idTitle(c.chapter);
  if (chapter) out.chapter = chapter;
  if (isPrintedPage(c.page)) out.page = c.page;
  if (Array.isArray(c.citePages)) {
    const ps = [...new Set(c.citePages.filter(isPrintedPage))].slice(0, CITE_PAGES_MAX);
    if (ps.length) out.citePages = ps;
  }
  if (typeof c.visibleEntityName === "string" && c.visibleEntityName.trim()) {
    out.visibleEntityName = c.visibleEntityName.trim().slice(0, 80);
  }
  const card = c.card;
  if (card !== null && typeof card === "object" && !Array.isArray(card)) {
    const k = card as Record<string, unknown>;
    if (typeof k.id === "string" && k.id.trim() && typeof k.name_zh === "string") {
      out.card = { id: k.id.trim().slice(0, 128), name_zh: k.name_zh.trim().slice(0, 80) };
    }
  }
  if (typeof c.surface === "string" && SURFACES.has(c.surface)) out.surface = c.surface;
  if (typeof c.pageText === "string" && c.pageText.trim()) out.pageText = c.pageText;
  return out;
}

/**
 * 解析 POST body：对象 + question 字符串（非空、≤ QUESTION_MAX_CHARS）+ 可选 context。
 * 顶层或 context 内含作业形键 → 422 bulk_rejected（永不 bulk）。
 */
export function parseSuggestBody(raw: unknown): ParseResult {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, status: 400, error: "bad_body", message: "请求体须是 JSON 对象" };
  }
  const o = raw as Record<string, unknown>;
  const topJob = findJobShapeKey(o);
  if (topJob) {
    return {
      ok: false,
      status: 422,
      error: "bulk_rejected",
      message: `本路只收单问 + 当前书桌上下文；不接「${topJob}」作业形（整章/多章/写入一律拒）`,
    };
  }
  if (o.context !== undefined && o.context !== null && typeof o.context === "object" && !Array.isArray(o.context)) {
    const ctxJob = findJobShapeKey(o.context as Record<string, unknown>);
    if (ctxJob) {
      return {
        ok: false,
        status: 422,
        error: "bulk_rejected",
        message: `context 内不接「${ctxJob}」作业形；只收书/章/页/卡/表面/citePages`,
      };
    }
  }
  const q = o.question;
  if (typeof q !== "string") {
    return { ok: false, status: 400, error: "missing_question", message: "缺 question（字符串）" };
  }
  const question = q.trim();
  if (!question) {
    return { ok: false, status: 400, error: "empty_question", message: "question 为空" };
  }
  if (question.length > QUESTION_MAX_CHARS) {
    return {
      ok: false,
      status: 413,
      error: "question_too_long",
      message: `question 超过 ${QUESTION_MAX_CHARS} 字`,
    };
  }
  return { ok: true, value: { question, context: sanitizeContext(o.context) } };
}

// ---- 截断 ----

/** 页 OCR 小窗截断：统一换行、trim、超 max 取前 max 字并标注；chars 报截断前总字数。 */
export function truncatePageText(
  text: string,
  max: number = PAGE_TEXT_MAX_CHARS,
): { text: string; chars: number; truncated: boolean } {
  const t = text.replace(/\r\n?/g, "\n").trim();
  if (t.length <= max) return { text: t, chars: t.length, truncated: false };
  return { text: `${t.slice(0, max)}\n…（小窗已截断）`, chars: t.length, truncated: true };
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
6. 页面小窗若已截断，可说明「本页小窗只有前 N 字」；小窗为空或没有页上下文时，直说「本次没有页面原文可对照」，再按概念层面作答。`;

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
  } else {
    lines.push("（本次没有页面原文小窗：只能按概念层面作答，不要编造页码）");
  }
  return lines.join("\n");
}

/** route 用：system + prompt 一对（generateText 入参形）。 */
export function buildPrompt(
  question: string,
  ctx: ClewSuggestContext,
  g?: ClewGrounding,
): { system: string; prompt: string } {
  return {
    system: CLEW_SYSTEM_PROMPT,
    prompt: `${buildContextBlock(ctx, g)}\n\n【学生问】\n${question}`,
  };
}

// ---- F：剪贴板带走（只生成字符串；永不写 store / 仓库） ----

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
    meta.pageWindow != null
      ? `对照小窗：p.${meta.pageWindow.page}（${meta.pageWindow.truncated ? `前 ${PAGE_TEXT_MAX_CHARS} 字 / 共 ${meta.pageWindow.chars} 字` : `${meta.pageWindow.chars} 字`}）`
      : "对照小窗：无";
  const where = contextLine(ctx);
  return [
    `【Clew 只读建议 · ${src} · 未核】`,
    where ? `上下文：${where}` : "上下文：书架 / 无书",
    win,
    "",
    `问：${question}`,
    "",
    `答：${answer}`,
    "",
    `— ${CLEW_HONESTY_FOOTNOTE} —`,
  ].join("\n");
}

/**
 * 「复制为草稿补丁形」：对齐 lib/atom-draft.ts 的 `ariadne.atom-draft-patch.v1`
 * （schema / cardId / chapterId? / note / entries）。**entries 恒为空数组**——Clew 只给文字建议，
 * 不发明原子 / 字段改动；问答放 note，人核后自己到 AtomDraftEditor 手填。无当前卡 → null。
 * 本函数只组字符串；永不 setAtomDraft / PATCH / writeFile。
 */
export type ClewPatchEnvelope = {
  schema: "ariadne.atom-draft-patch.v1";
  cardId: string;
  chapterId?: string;
  note: string;
  entries: never[];
};

export function buildSuggestPatchEnvelope(
  question: string,
  answer: string,
  ctx: ClewSuggestContext,
  meta: ClewAnswerMeta,
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
      `问：${question}\n答：${answer}\n` +
      "entries 为空：Clew 不发明原子/字段改动；要改 seed 请人核后在草稿编辑器手填。",
    entries: [],
  };
  return doc;
}

export function buildSuggestPatchText(
  question: string,
  answer: string,
  ctx: ClewSuggestContext,
  meta: ClewAnswerMeta,
): string | null {
  const doc = buildSuggestPatchEnvelope(question, answer, ctx, meta);
  return doc ? JSON.stringify(doc, null, 2) : null;
}
