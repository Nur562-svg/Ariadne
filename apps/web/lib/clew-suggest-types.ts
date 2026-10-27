/**
 * T84 机械抽出：原 lib/clew-suggest.ts 形状分区（wire 同构类型 / 书桌上下文 / grounding /
 * 答面 meta / 不完备清单 + 全量常量）整段迁此——值 / 文案零改。本件是四件 DAG 的根：无 import。
 * 与 clew-answer-audit 的同构类型**仍是字面声明**（不 import 它，保 Node 直载无 audit 依赖）。
 * 为保「types 为根」且不复制分叉，三个声明自原其他分区迁入：SuggestPatchEntry /
 * ClewSeedBefore（原 F 带走区；ClewGrounding.seedBefore 引用）与 isPrintedPage（原校验区私有；
 * grounding 与 parse 双用，加 export）。铁合同七条与消费者入口仍在 @/lib/clew-suggest（barrel）。
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

/** 印刷页号守卫（正整数且 < 100000）；grounding 选页与请求体校验共用。 */
export function isPrintedPage(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v > 0 && v < 100_000;
}
