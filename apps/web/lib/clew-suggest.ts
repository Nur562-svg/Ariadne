/**
 * T66 C / T67 C·D·E / T69 A·B·C·D / T70 D·F：Clew 只读建议——请求体校验 + 系统提示 + 书桌上下文拼装 +
 * 按档 grounding 策略（long-context 同章有界多页；全超顶仍报 pagesOmitted）+ 剪贴板带走 +
 * 流事件编码 + 结构化补丁解析（before 从 seed 只读对齐）（纯函数）。
 * 无 "use client"、无 import、无 fs、无 process.env：服务端 route 与客户端 ClewPane 共用形状，
 * scripts/clew-suggest-check.mjs 直接 import 本 .ts（Node ≥ 23.6 原生剥类型）。
 * 核账纯函数在 clew-answer-audit.ts；本文件只留与它对齐的带走行，避免给本文件加 import。
 *
 * 铁合同（本文件每个函数都遵守；route.ts / ClewPane 同守）：
 *   1. 只读答：只产出提示串与文本；永不指示模型或调用方写 entities / blocks / verified:true / PATCH。
 *   2. 永不 bulk：一次请求 = 一问 + 当前书桌上下文；chapters[] / pages[] / questions[] /
 *      extract·parse·ingest 作业形一律 4xx 拒收（parseSuggestBody）。
 *   3. 不做诊断：系统提示写死；回答 ≠ seed verified ≠ heye 已对 ≠ study 已练。
 *   4. 页码只采信请求上下文：模型自造页码须标「未核验」；系统提示明示只能引用给定页。
 *   5. 钥不经此文件：不读 env、不碰 key；流事件（encodeClewStreamEvent）只携带公开投影
 *      （provider 名 + 模型名），永不携带 apiKey / baseURL。
 *   6. T67 结构化补丁：仅可对**服务端 grounding 列出的既有原子/字段**建议填空；解析侧
 *      （parseSuggestPatchEntries）target 白名单过滤——发明 id / 未知 field / verified 意图
 *      一律丢弃；进本机草稿永远要用户显式粘贴或点击（G），发送回调永不静默 setAtomDraft。
 *   7. T69 Long-context 有界铁顶：接地扩窗**同章 only**（LONG_PAGES_MAX 页 / LONG_TOTAL_CHARS_MAX
 *      字，常量写死）；单页仍 truncate；缺章/缺 blocks 诚实降级单页；fast/reasoning 恒单页。
 *      扩窗是服务端自取，**不是**客户端作业——pages[] 作业形仍 422（铁合同 2）。
 */

// ---- 形状 ----

/**
 * 与 clew-answer-audit.ts 的 ClewAnswerAudit / 失败形同构（本文件不 import 它）。
 * 带走文本与流事件只透传，不在这里重算。
 */
export type ClewAnswerAuditWire =
  | {
      version: "clew-answer-audit.v1";
      clean: boolean;
      counts: {
        grounded: number;
        context: number;
        self_marked: number;
        unmarked_out: number;
        known: number;
        unknown: number;
        range_too_wide: number;
      };
      refs: unknown[];
    }
  | { error: "audit_unavailable" };

/** 与 clew-answer-audit ClewAuditBasis 同构。 */
export type ClewAuditBasisWire = {
  groundPages: number[];
  contextPages: number[];
  cardCitePages: number[];
  knownAtomIds: string[];
  knownEntityIds: string[];
};

/** 与 clew-answer-audit ClewCardAtomRef 同构。 */
export type ClewCardAtomWire = { id: string; citePage: number | null };

/** 与 formatAuditTakeawayLine 同句。无审计 / 失败 → 「核账：不可用」。 */
function formatAuditTakeawayLine(audit: ClewAnswerAuditWire | undefined): string {
  if (!audit || !("counts" in audit)) return "核账：不可用";
  const c = audit.counts;
  return `核账：接地 ${c.grounded} · 越窗未标 ${c.unmarked_out} · 无此原子 ${c.unknown}（≠ 内容已核）`;
}

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
  /**
   * T69 B：long-context 同章有界附加窗（fast/reasoning 无此键）。逐页 truncate +
   * 总字顶装窗；只含除当前页外的同章页；缺章/缺 blocks → 不写（诚实降级单页）。
   */
  extraWindows?: { page: number; text: string; chars: number; truncated: boolean; source: "server" }[];
  /**
   * T69 C：接地策略实况（仅 long-context 真装成多页时写；prompt 标注与流 meta 同源）。
   * pages 含当前页（升序）；pagesOmitted = 选出但因总字顶未装的页数（如实报，不装完整）。
   */
  ground?: {
    mode: "chapter-bounded";
    pages: number[];
    totalChars: number;
    maxPages: number;
    maxTotalChars: number;
    pagesOmitted: number;
  };
  cardSummary?: {
    id: string;
    name_zh: string;
    name_en?: string;
    one_liner?: string;
    citePages: number[];
  };
  /** T67 D：当前卡 seed 口径不完备清单（仅既有 id / 下标；无卡或不完备=0 → undefined）。 */
  incomplete?: ClewIncompleteGrounding;
  /** T69 D：白名单 target 的 seed 现值（补丁 before 对齐用；服务端只读导出，空 → null）。 */
  seedBefore?: ClewSeedBefore;
  /**
   * T70 C：当前卡既有原子 / 实体 id 与 cite 页投影（loadCard 已读到的，不另开读盘）。
   * 只给答面核账 basis，不进 prompt。
   */
  knownAtomIds?: string[];
  knownEntityIds?: string[];
  cardAtoms?: ClewCardAtomWire[];
};

/** 答面元信息（UI 短标 / 带走文本用）。 */
export type ClewAnswerMeta = {
  mode: "live" | "stub";
  provider?: string;
  model?: string;
  pageWindow?: { page: number; chars: number; truncated: boolean };
  /** T69 C：本次接地页平铺（>1 页 = long-context 同章有界；UI 次级标可选）。 */
  groundPages?: number[];
  /** T70 D：选出但因总字顶未装的页数。0 / 缺省 = 没有这回事（fast/reasoning 不写）。 */
  pagesOmitted?: number;
  /**
   * T70 C·F：服务端权威核账，或失败形。缺省 = 带走文本写「核账：不可用」。
   * 审计 ≠ 核验；不改答文字符。
   */
  audit?: ClewAnswerAuditWire;
};

/**
 * T67 D：服务端只读 grounding 的不完备清单——仅**既有**原子 id / 字段下标；
 * 既有非空字段值只读截断（GROUND_VALUE_MAX_CHARS）供模型参照，空字段只标空不给值。
 */
export type ClewIncompleteGrounding = {
  atoms: {
    id: string;
    emptyPrompt: boolean;
    emptyAnswer: boolean;
    emptyCiteQuote: boolean;
    /** 既有非空值只读截断（无则不发）。 */
    prompt?: string;
    answer?: string;
  }[];
  fields: { index: number; label: string }[];
};

export const QUESTION_MAX_CHARS = 2000;
export const PAGE_TEXT_MAX_CHARS = 3000;
export const CITE_PAGES_MAX = 8;
/** 单答输出上限（小能力 · 复习提示 + 可选结构化补丁尾块）。 */
export const ANSWER_MAX_OUTPUT_TOKENS = 900;
/** 流式 chunk 间空闲超时（ms）——超过按上游中断处理（error 事件 + 客户端可重试）。 */
export const STREAM_INACTIVITY_TIMEOUT_MS = 25_000;
/** 流式总时长上限（ms）。 */
export const STREAM_OVERALL_TIMEOUT_MS = 90_000;
/** 非流兼容枝（stream:false）上游超时（ms）。 */
export const UPSTREAM_TIMEOUT_MS = 30_000;
/** grounding 既有值只读截断（字符）。 */
export const GROUND_VALUE_MAX_CHARS = 80;
/** grounding 列表上限（prompt 体积护栏；超出如实标注「还有 N 个未列」。 */
export const GROUND_ATOMS_MAX = 6;
export const GROUND_FIELDS_MAX = 4;
/** 结构化补丁：单条 after 截断 / 条数上限。 */
export const PATCH_AFTER_MAX_CHARS = 500;
export const PATCH_ENTRIES_MAX = 20;
/**
 * T69 A：Long-context 同章有界铁顶（常量写死，可微调）——接地扩窗**至多** 5 页、
 * 总字数至多 ~12000（截断后计）；同章 only，永不整章全书塞 prompt。
 */
export const LONG_PAGES_MAX = 5;
export const LONG_TOTAL_CHARS_MAX = 12_000;
/** T69 D：补丁 before（seed 现值）截断——人核对照够读即可，不搬整段原文。 */
export const SEED_BEFORE_MAX_CHARS = 200;

// ---- T69 A：按档 grounding 策略（纯函数；route 与 clew-check 共用） ----

export type GroundingPolicy = {
  /** single = 三档同 tip 单页小窗；chapter-bounded = long-context 同章有界多页。 */
  mode: "single" | "chapter-bounded";
  maxPages: number;
  maxTotalChars: number;
};

/**
 * 按档接地策略：fast / reasoning 恒 single（1 页 / PAGE_TEXT_MAX_CHARS，与 T66–T68 完全一致）；
 * long-context = chapter-bounded（LONG_PAGES_MAX 页 / LONG_TOTAL_CHARS_MAX 字）。
 * 档 id 非法 → 按 single（不因未知档放宽顶）。
 */
export function groundingPolicyForTier(tier: string): GroundingPolicy {
  return tier === "long-context"
    ? { mode: "chapter-bounded", maxPages: LONG_PAGES_MAX, maxTotalChars: LONG_TOTAL_CHARS_MAX }
    : { mode: "single", maxPages: 1, maxTotalChars: PAGE_TEXT_MAX_CHARS };
}

/**
 * 选接地页（T69 A·B）：候选 = chapterPages（该章 blocks 里**有文本**的印刷页，服务端自取），
 * 优先序 = 当前页 → 请求上下文 cite 页（须同章，跨章 cite 不采）→ 同章近邻补齐（按与当前页
 * 距离，平手取低页）。去重后按 maxPages 硬顶，返回**升序阅读序**（优先序只决定谁入选）。
 * chapterPages 空 / maxPages ≤ 0 → 空数组（缺章缺 blocks 诚实降级，不编页）。
 */
export function selectGroundPages(opts: {
  currentPage?: number | null;
  citePages?: readonly number[];
  chapterPages: readonly number[];
  maxPages: number;
}): number[] {
  const eligible = [...new Set(opts.chapterPages.filter((p) => isPrintedPage(p)))].sort((a, b) => a - b);
  if (eligible.length === 0 || opts.maxPages <= 0) return [];
  const chosen: number[] = [];
  const take = (p: number) => {
    if (chosen.length < opts.maxPages && !chosen.includes(p)) chosen.push(p);
  };
  const anchor =
    opts.currentPage != null && eligible.includes(opts.currentPage) ? opts.currentPage : eligible[0];
  if (anchor === opts.currentPage) take(anchor);
  for (const p of new Set(opts.citePages ?? [])) {
    if (eligible.includes(p)) take(p);
  }
  const rest = eligible
    .filter((p) => !chosen.includes(p))
    .sort((a, b) => Math.abs(a - anchor) - Math.abs(b - anchor) || a - b);
  for (const p of rest) take(p);
  return [...chosen].sort((a, b) => a - b);
}

/** 流 meta / 非流响应用的接地页平铺（含当前页；无任何窗 → 空数组）。 */
export function groundPagesOf(g?: ClewGrounding): number[] {
  if (!g) return [];
  if (g.ground) return g.ground.pages;
  return g.pageWindow ? [g.pageWindow.page] : [];
}

/**
 * T70 D：long-context 装窗收口。
 * - 有附加窗 → ground（pages = 当前页 + 已装附加页，pagesOmitted 如实）。
 * - 附加窗为空但 omitted>0 → **仍设** ground：pages=[当前页]，pagesOmitted=omitted。
 *   选出的扩页全因总字顶未装时，不得把 omitted 丢成「没扩」。
 * - 两者都没有 → undefined（单页，不写 ground；fast/reasoning 不调用本函数）。
 */
export function assembleChapterGround(opts: {
  currentPage: number;
  extraPages: readonly number[];
  omitted: number;
  totalChars: number;
  maxPages: number;
  maxTotalChars: number;
}): NonNullable<ClewGrounding["ground"]> | undefined {
  const extras = opts.extraPages.filter((p) => isPrintedPage(p) && p !== opts.currentPage);
  if (extras.length === 0 && opts.omitted <= 0) return undefined;
  const pages = [...new Set([opts.currentPage, ...extras])].filter((p) => isPrintedPage(p)).sort((a, b) => a - b);
  return {
    mode: "chapter-bounded",
    pages,
    totalChars: opts.totalChars,
    maxPages: opts.maxPages,
    maxTotalChars: opts.maxTotalChars,
    pagesOmitted: opts.omitted > 0 ? opts.omitted : 0,
  };
}

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

/**
 * T67 E / T69 D：模型建议的结构化补丁条目（形状与 lib/atom-draft.ts DraftPatchEntry 兼容）；
 * before 从**当前卡 seed 只读**对齐（buildSeedBeforeMap 导出、parseSuggestPatchEntries 回填），
 * 空字段为 null——建议仍只是建议，人核后才进草稿。永不含 verified。
 */
export type SuggestPatchEntry = {
  target: string;
  field: "prompt" | "answer" | "citeQuote" | "value";
  before: string | null;
  after: string;
};

/** T69 D：白名单 target → 各可补字段的 seed 现值（空 → null；截 SEED_BEFORE_MAX_CHARS）。 */
export type ClewSeedBefore = Record<string, Partial<Record<SuggestPatchEntry["field"], string | null>>>;

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
