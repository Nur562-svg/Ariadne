/**
 * T85 机械抽出：原 lib/clew-answer-audit.ts core 分区（numList / idList / buildAuditBasis /
 * classPage / auditClewAnswer / safeAuditClewAnswer / isCount / coerceClewAnswerAudit /
 * isAuditUnavailable）整段迁此——fail-closed · clean 口径 · 页码/id 分类零改。
 * isPrintedPage 与形状 types 自 clew-answer-audit-types import；extractAnswerRefs 自
 * clew-answer-audit-extract import。纯函数；无 fs / 无 process.env / 无 "use client"。
 * 铁合同五条与消费者入口仍在 @/lib/clew-answer-audit（barrel）。
 */

import {
  CLEW_ANSWER_AUDIT_VERSION,
  isPrintedPage,
  type ClewAnswerAudit,
  type ClewAuditBasis,
  type ClewAuditCounts,
  type ClewAuditRef,
  type ClewAuditUnavailable,
  type ClewPageClass,
  type ExtractedPageRef,
} from "./clew-answer-audit-types.ts";
import { extractAnswerRefs } from "./clew-answer-audit-extract.ts";

function numList(...groups: (readonly number[] | number | null | undefined)[]): number[] {
  const out: number[] = [];
  const push = (n: number) => {
    if (isPrintedPage(n) && !out.includes(n)) out.push(n);
  };
  for (const g of groups) {
    if (typeof g === "number") push(g);
    else if (g) for (const n of g) if (typeof n === "number") push(n);
  }
  return out.sort((a, b) => a - b);
}

function idList(...groups: (readonly string[] | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const v of groups) {
    if (!v) continue;
    for (const s of v) {
      if (typeof s !== "string") continue;
      const t = s.trim();
      if (!t || out.includes(t)) continue;
      out.push(t);
    }
  }
  return out;
}

/** 把 route / 客户端手头的页与 id 收成 basis。非法值丢弃。精确 id，不模糊。 */
export function buildAuditBasis(input: {
  groundPages?: readonly number[] | null;
  contextPages?: readonly number[] | null;
  contextPage?: number | null;
  citePages?: readonly number[] | null;
  cardCitePages?: readonly number[] | null;
  atomIds?: readonly string[] | null;
  entityIds?: readonly string[] | null;
  /** 线上 meta.auditBasis 用的键名（与 atomIds / entityIds 同义，精确合并）。 */
  knownAtomIds?: readonly string[] | null;
  knownEntityIds?: readonly string[] | null;
}): ClewAuditBasis {
  return {
    groundPages: numList(input.groundPages),
    contextPages: numList(input.contextPages, input.contextPage, input.citePages),
    cardCitePages: numList(input.cardCitePages),
    knownAtomIds: idList(input.atomIds, input.knownAtomIds),
    knownEntityIds: idList(input.entityIds, input.knownEntityIds),
  };
}

function classPage(ref: ExtractedPageRef, ground: Set<number>, context: Set<number>): ClewPageClass {
  // 过宽区间不是「窗内」。自标则 self_marked，否则整段越窗未标。
  if (ref.rangeTooWide) return ref.selfMarked ? "self_marked" : "unmarked_out";
  if (ground.has(ref.page)) return "grounded";
  if (context.has(ref.page)) return "context";
  if (ref.selfMarked) return "self_marked";
  return "unmarked_out";
}

/**
 * 页码四类 + id 两类。去重键：(kind, 值)，保留最先出现的 index。
 * clean = unmarked_out = 0 且 unknown = 0（自标越窗仍 clean——已按系统提示标明）。
 * 过宽区间计入 range_too_wide，并按其自标与否落入 self_marked 或 unmarked_out。
 */
export function auditClewAnswer(text: string, basis: ClewAuditBasis): ClewAnswerAudit {
  const extracted = extractAnswerRefs(text);
  const ground = new Set(basis.groundPages);
  const context = new Set<number>([...basis.contextPages, ...basis.cardCitePages]);
  const knownAtoms = new Set(basis.knownAtomIds);
  const knownEntities = new Set(basis.knownEntityIds);

  type Tagged = { index: number; ref: ClewAuditRef; key: string; bucket: keyof ClewAuditCounts };
  const primary: Tagged[] = [];
  const wides: Tagged[] = [];

  for (const p of extracted.pageRefs) {
    const cls = classPage(p, ground, context);
    const ref: ClewAuditRef = {
      kind: "page",
      page: p.page,
      index: p.index,
      raw: p.raw,
      selfMarked: p.selfMarked,
      class: cls,
      ...(p.rangeTooWide ? { rangeTooWide: true } : {}),
    };
    const key = p.rangeTooWide ? `wide:${p.raw}` : `page:${p.page}`;
    const bucket: keyof ClewAuditCounts = cls;
    primary.push({ index: p.index, ref, key, bucket });
    if (p.rangeTooWide) wides.push({ index: p.index, ref, key: `range:${p.raw}`, bucket: "range_too_wide" });
  }

  for (const id of extracted.idRefs) {
    const known = id.kind === "atom" ? knownAtoms.has(id.id) : knownEntities.has(id.id);
    primary.push({
      index: id.index,
      ref: { kind: id.kind, id: id.id, index: id.index, raw: id.raw, class: known ? "known" : "unknown" },
      key: `${id.kind}:${id.id}`,
      bucket: known ? "known" : "unknown",
    });
  }

  const ordered = [...primary].sort((a, b) => a.index - b.index || a.key.localeCompare(b.key));
  const seen = new Set<string>();
  const refs: ClewAuditRef[] = [];
  const counts: ClewAuditCounts = {
    grounded: 0,
    context: 0,
    self_marked: 0,
    unmarked_out: 0,
    known: 0,
    unknown: 0,
    range_too_wide: 0,
  };
  for (const t of ordered) {
    if (seen.has(t.key)) continue;
    seen.add(t.key);
    refs.push(t.ref);
    counts[t.bucket]++;
  }
  const seenWide = new Set<string>();
  for (const t of wides) {
    if (seenWide.has(t.key)) continue;
    seenWide.add(t.key);
    counts.range_too_wide++;
  }

  return {
    refs,
    counts,
    clean: counts.unmarked_out === 0 && counts.unknown === 0,
    version: CLEW_ANSWER_AUDIT_VERSION,
  };
}

/** 审计抛错 → 不可用。禁止把异常吞成全绿。 */
export function safeAuditClewAnswer(text: string, basis: ClewAuditBasis): ClewAnswerAudit | ClewAuditUnavailable {
  try {
    if (typeof text !== "string") throw new Error("text");
    return auditClewAnswer(text, basis);
  } catch {
    return { error: "audit_unavailable" };
  }
}

function isCount(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

/** 服务端 meta.audit 入客户端：坏形 / 错版本 → 不可用，不当作 clean。 */
export function coerceClewAnswerAudit(raw: unknown): ClewAnswerAudit | ClewAuditUnavailable {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return { error: "audit_unavailable" };
  const o = raw as Record<string, unknown>;
  if (o.error === "audit_unavailable") return { error: "audit_unavailable" };
  if (o.version !== CLEW_ANSWER_AUDIT_VERSION) return { error: "audit_unavailable" };
  if (typeof o.clean !== "boolean" || !Array.isArray(o.refs)) return { error: "audit_unavailable" };
  const c = o.counts;
  if (c === null || typeof c !== "object" || Array.isArray(c)) return { error: "audit_unavailable" };
  const counts = c as Record<string, unknown>;
  for (const k of ["grounded", "context", "self_marked", "unmarked_out", "known", "unknown", "range_too_wide"] as const) {
    if (!isCount(counts[k])) return { error: "audit_unavailable" };
  }
  return raw as ClewAnswerAudit;
}

export function isAuditUnavailable(
  a: ClewAnswerAudit | ClewAuditUnavailable | undefined | null,
): a is ClewAuditUnavailable {
  return a != null && typeof a === "object" && "error" in a && a.error === "audit_unavailable";
}
