/**
 * T85 机械抽出：原 lib/clew-answer-audit.ts surface 分区（formatAuditTakeawayLine ·
 * AnswerSegment · segmentAnswerRefs · relatedCardAtoms · existingStudyHrefForCard ·
 * clewCitedPageHref）整段迁此——带走行 / 分段 / 深链零改。AnswerSegment 仅本区用，随 surface。
 * types 自 clew-answer-audit-types；extractAnswerRefs 自 extract；isAuditUnavailable 自 core。
 * 纯函数；无 fs / 无 process.env / 无 "use client"。
 * 铁合同五条与消费者入口仍在 @/lib/clew-answer-audit（barrel）。
 */

import {
  type ClewAnswerAudit,
  type ClewAuditUnavailable,
  type ClewCardAtomRef,
  type ClewPageClass,
  type ExtractedPageRef,
} from "./clew-answer-audit-types.ts";
import { extractAnswerRefs } from "./clew-answer-audit-extract.ts";
import { isAuditUnavailable } from "./clew-answer-audit-core.ts";

/**
 * 剪贴板核账行。无审计 / 失败 → 「核账：不可用」。
 * 数字来自 counts，不改答文字符。
 */
export function formatAuditTakeawayLine(
  audit: ClewAnswerAudit | ClewAuditUnavailable | undefined | null,
): string {
  if (!audit || isAuditUnavailable(audit)) return "核账：不可用";
  const c = audit.counts;
  if (!c) return "核账：不可用";
  return `核账：接地 ${c.grounded} · 越窗未标 ${c.unmarked_out} · 无此原子 ${c.unknown}（≠ 内容已核）`;
}

export type AnswerSegment =
  | { type: "text"; text: string }
  | {
      type: "page";
      /** 原文切片，与答文逐字相同。⚠ 由 UI 另加，不写进 text。 */
      text: string;
      page: number;
      class: ClewPageClass;
      /** grounded / context 可点；越窗（含过宽）不可点。 */
      linkable: boolean;
      rangeTooWide?: boolean;
    };

/**
 * 把答文切成「原文文本段 + 页码段」。拼接 text 必须等于入参（不改字符）。
 * 类别只认 audit.refs；audit 里没有的页不包（fail-closed，不就地涂绿）。
 */
export function segmentAnswerRefs(text: string, audit: ClewAnswerAudit): AnswerSegment[] {
  if (typeof text !== "string" || !text) return [{ type: "text", text: text ?? "" }];
  const classByPage = new Map<number, ClewPageClass>();
  const wideByRaw = new Map<string, ClewPageClass>();
  for (const r of audit.refs) {
    if (r.kind !== "page") continue;
    if (r.rangeTooWide) wideByRaw.set(r.raw, r.class);
    else classByPage.set(r.page, r.class);
  }
  const extracted = extractAnswerRefs(text);
  type Span = { start: number; end: number; page: number; class: ClewPageClass; linkable: boolean; rangeTooWide?: boolean };
  const spans: Span[] = [];
  const seenStart = new Set<number>();
  const groups = new Map<number, ExtractedPageRef[]>();
  for (const p of extracted.pageRefs) {
    const arr = groups.get(p.index) ?? [];
    arr.push(p);
    groups.set(p.index, arr);
  }
  for (const [index, group] of groups) {
    if (seenStart.has(index)) continue;
    const raw = group[0]!.raw;
    if (text.slice(index, index + raw.length) !== raw) continue;
    const wide = group.some((g) => g.rangeTooWide);
    if (wide) {
      const cls = wideByRaw.get(raw);
      if (!cls) continue;
      spans.push({ start: index, end: index + raw.length, page: group[0]!.page, class: cls, linkable: false, rangeTooWide: true });
      seenStart.add(index);
      continue;
    }
    const classes = group.map((g) => classByPage.get(g.page));
    if (classes.some((c) => c == null)) continue;
    const linkable = classes.every((c) => c === "grounded" || c === "context");
    const cls = (classes.find((c) => c === "unmarked_out") ??
      classes.find((c) => c === "self_marked") ??
      classes[0]) as ClewPageClass;
    spans.push({ start: index, end: index + raw.length, page: group[0]!.page, class: cls, linkable });
    seenStart.add(index);
  }
  spans.sort((a, b) => a.start - b.start);
  const out: AnswerSegment[] = [];
  let cursor = 0;
  for (const s of spans) {
    if (s.start < cursor) continue;
    if (s.start > cursor) out.push({ type: "text", text: text.slice(cursor, s.start) });
    out.push({
      type: "page",
      text: text.slice(s.start, s.end),
      page: s.page,
      class: s.class,
      linkable: s.linkable,
      ...(s.rangeTooWide ? { rangeTooWide: true } : {}),
    });
    cursor = s.end;
  }
  if (cursor < text.length) out.push({ type: "text", text: text.slice(cursor) });
  if (out.length === 0) out.push({ type: "text", text });
  return out;
}

/**
 * 当前卡原子里，cite.page 落在答文「接地 ∪ 上下文」页引用上的，至多 limit 条。
 * 精确页码；不把邻页算进来；不新建 id。
 */
export function relatedCardAtoms(
  atoms: readonly ClewCardAtomRef[],
  audit: ClewAnswerAudit,
  limit = 6,
): { id: string; citePage: number }[] {
  const pages = new Set<number>();
  for (const r of audit.refs) {
    if (r.kind === "page" && !r.rangeTooWide && (r.class === "grounded" || r.class === "context")) {
      pages.add(r.page);
    }
  }
  const out: { id: string; citePage: number }[] = [];
  const seen = new Set<string>();
  for (const a of atoms) {
    if (out.length >= limit) break;
    if (!a || typeof a.id !== "string" || !a.id || seen.has(a.id)) continue;
    if (typeof a.citePage !== "number" || !pages.has(a.citePage)) continue;
    seen.add(a.id);
    out.push({ id: a.id, citePage: a.citePage });
  }
  return out;
}

/** 既有学习环入口。无 cardId → null（调用方纯文本，不新建路由）。 */
export function existingStudyHrefForCard(cardId: string | undefined, bookId: string | undefined): string | null {
  if (!cardId) return null;
  const book = bookId ? `&book=${encodeURIComponent(bookId)}` : "";
  return `/study?card=${encodeURIComponent(cardId)}${book}&mode=all`;
}

/** 既有页深链：有书 → 书桌 `?book=&page=`（与 Clew pageHref 同形）；无书 → /viewer/N。 */
export function clewCitedPageHref(bookId: string | undefined, page: number): string {
  if (bookId) return `/desk?book=${encodeURIComponent(bookId)}&page=${page}`;
  return `/viewer/${page}`;
}
