/**
 * T85 机械抽出：原 lib/clew-answer-audit.ts 形状 / 常量分区（VERSION · PAGE_RANGE_MAX ·
 * ClewPageClass/IdClass · Extracted* · ClewAuditBasis/Ref/Counts · ClewAnswerAudit ·
 * ClewAuditUnavailable · ClewCardAtomRef · PAGE_MAX）整段迁此——值 / 文案零改。
 * 本件是四件 DAG 的根：无 import。为保「types 为根」且不复制分叉，原 extract 区私有
 * isPrintedPage（extract 页码识别与 core numList 双用）随 PAGE_MAX 入此并加 export。
 * 铁合同五条与消费者入口仍在 @/lib/clew-answer-audit（barrel）。
 */

export const CLEW_ANSWER_AUDIT_VERSION = "clew-answer-audit.v1" as const;

/** pp.N–M 展开上限（含端点）。超出不展开，整段标 rangeTooWide。 */
export const PAGE_RANGE_MAX = 20;

export type ClewPageClass = "grounded" | "context" | "self_marked" | "unmarked_out";
export type ClewIdClass = "known" | "unknown";

/** extractAnswerRefs 的页码命中（区间展开后每页一条；过宽区间只一条）。 */
export type ExtractedPageRef = {
  page: number;
  /** 命中在原文中的起始下标（区间展开的每一页共享同一 index / raw）。 */
  index: number;
  /** 原文切片（全角归一只用于识别，raw 仍是原字符）。 */
  raw: string;
  /** 同句，或紧邻括号，含「未核验」或「推测」。 */
  selfMarked: boolean;
  /** 区间宽于 PAGE_RANGE_MAX（或终点小于起点）：不展开。 */
  rangeTooWide?: boolean;
  rangeEnd?: number;
};

export type ExtractedIdRef = {
  kind: "atom" | "entity";
  id: string;
  index: number;
  raw: string;
};

export type ClewAuditBasis = {
  /** 本次真装进模型窗的印刷页（groundPagesOf）。 */
  groundPages: number[];
  /** 请求上下文：当前页 + citePages。 */
  contextPages: number[];
  /** 当前卡 cite 页（不在窗内时算 context，不算 grounded）。 */
  cardCitePages: number[];
  /** 当前卡既有原子 id。精确匹配。 */
  knownAtomIds: string[];
  /** 当前卡 / 可见实体 id。精确匹配。没有的 id 不得编进来。 */
  knownEntityIds: string[];
};

export type ClewAuditRef =
  | {
      kind: "page";
      page: number;
      index: number;
      raw: string;
      selfMarked: boolean;
      class: ClewPageClass;
      rangeTooWide?: boolean;
    }
  | {
      kind: "atom" | "entity";
      id: string;
      index: number;
      raw: string;
      class: ClewIdClass;
    };

export type ClewAuditCounts = {
  grounded: number;
  context: number;
  self_marked: number;
  unmarked_out: number;
  known: number;
  /** 原子 + 实体里精确匹配失败的条数（去重后）。芯片「无此原子」用这个数。 */
  unknown: number;
  range_too_wide: number;
};

export type ClewAnswerAudit = {
  refs: ClewAuditRef[];
  counts: ClewAuditCounts;
  /** unmarked_out = 0 且 unknown = 0。自标越窗不计入这两项。 */
  clean: boolean;
  version: typeof CLEW_ANSWER_AUDIT_VERSION;
};

export type ClewAuditUnavailable = { error: "audit_unavailable" };

export type ClewCardAtomRef = { id: string; citePage: number | null };

const PAGE_MAX = 100_000;

export function isPrintedPage(n: number): boolean {
  return Number.isInteger(n) && n > 0 && n < PAGE_MAX;
}
