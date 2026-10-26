/**
 * T70 A·B：Clew 答面事后核账（纯函数）。
 * 无 "use client"、无 fs、无 process.env、无 Date、无网络：服务端 route 与客户端 ClewPane
 * 同源 import；scripts/clew-suggest-check.mjs 直接 import 本 .ts。
 *
 * 铁合同（本文件每个函数都遵守）：
 *   1. 只标注，不改写：不修改入参文本的任何字符；不写 entities / blocks / verified / PATCH。
 *   2. 审计 ≠ 核验：grounded 只表示该页在本次给模型的窗内。文案与返回值禁用
 *      「已核 / 正确 / verified:true」。
 *   3. 永不 bulk：只看本次答文 + 调用方给的 basis。不扫全书、不跨章、不调 LLM。
 *   4. 原子 / 实体只认既有 id 的精确相等：不新建、不大小写折叠、不前缀/模糊匹配到别的 id。
 *   5. fail-closed：safeAuditClewAnswer / coerceClewAnswerAudit 遇异常或坏形 →
 *      { error: "audit_unavailable" }，绝不默认全绿。
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

function isPrintedPage(n: number): boolean {
  return Number.isInteger(n) && n > 0 && n < PAGE_MAX;
}

/** 全角数字 / 拉丁 / 页码标点 → 半角。一字符对一字符，下标与原文对齐。不改 。！？ */
function normChar(ch: string): string {
  const c = ch.charCodeAt(0);
  if (c >= 0xff10 && c <= 0xff19) return String.fromCharCode(c - 0xff10 + 0x30);
  if (c >= 0xff21 && c <= 0xff3a) return String.fromCharCode(c - 0xff21 + 0x41);
  if (c >= 0xff41 && c <= 0xff5a) return String.fromCharCode(c - 0xff41 + 0x61);
  if (ch === "．") return ".";
  if (ch === "：" || ch === "﹕") return ":";
  if (ch === "－" || ch === "–" || ch === "—" || ch === "~" || ch === "～" || ch === "−") return "-";
  if (ch === "　") return " ";
  return ch;
}

/** 按 UTF-16 码元走，保证下标与原文 String#slice 对齐（全角字符都在 BMP）。 */
function normalize(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) out += normChar(text[i]!);
  return out;
}

/** ``` 围栏（含未闭合、含补丁 ```json）。围栏内的页码 / atom: 归补丁或代码，不进核账。 */
function fenceSpans(s: string): [number, number][] {
  const spans: [number, number][] = [];
  let i = 0;
  while (i < s.length) {
    const start = s.indexOf("```", i);
    if (start < 0) break;
    const end = s.indexOf("```", start + 3);
    if (end < 0) {
      spans.push([start, s.length]);
      break;
    }
    spans.push([start, end + 3]);
    i = end + 3;
  }
  return spans;
}

function inSpans(spans: [number, number][], idx: number): boolean {
  for (const [a, b] of spans) if (idx >= a && idx < b) return true;
  return false;
}

function overlaps(spans: [number, number][], start: number, end: number): boolean {
  for (const [a, b] of spans) if (start < b && end > a) return true;
  return false;
}

const SENT_BREAK = new Set(["\n", "。", "！", "？", "!", "?"]);

/**
 * 自标：同句含「未核验」或「推测」，或页码紧邻的括号里有这两个词
 * （中间只允许空白 / 句号）。不把上一句的括号算到下一处页码上。
 */
function isSelfMarked(norm: string, start: number, end: number): boolean {
  let left = 0;
  for (let i = start - 1; i >= 0; i--) {
    if (SENT_BREAK.has(norm[i]!)) {
      left = i + 1;
      break;
    }
  }
  let right = norm.length;
  for (let i = end; i < norm.length; i++) {
    if (SENT_BREAK.has(norm[i]!)) {
      right = i;
      break;
    }
  }
  const sentence = norm.slice(left, right);
  if (sentence.includes("未核验") || sentence.includes("推测")) return true;
  const before = norm.slice(Math.max(0, start - 24), start);
  const after = norm.slice(end, Math.min(norm.length, end + 24));
  if (/[（(][^）)\n]{0,20}?(?:未核验|推测)[^）)\n]{0,12}[）)]\s*$/.test(before)) return true;
  if (/^[。．.!！?？\s]{0,4}[（(][^）)\n]{0,20}?(?:未核验|推测)/.test(after)) return true;
  return false;
}

function collect(re: RegExp, s: string): RegExpExecArray[] {
  re.lastIndex = 0;
  const out: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    out.push(m);
    if (m[0].length === 0) re.lastIndex++;
  }
  return out;
}

/**
 * 从答文抽出页码与 atom:/entity: id。
 * 页码形：p.N / p. N / P.N / 第N页 / pp.N–M（展开 ≤ PAGE_RANGE_MAX，超出整段 rangeTooWide）。
 * 不读盘、不改 text。
 */
export function extractAnswerRefs(text: string): { pageRefs: ExtractedPageRef[]; idRefs: ExtractedIdRef[] } {
  const pageRefs: ExtractedPageRef[] = [];
  const idRefs: ExtractedIdRef[] = [];
  if (typeof text !== "string" || !text) return { pageRefs, idRefs };
  const norm = normalize(text);
  const fences = fenceSpans(norm);
  const occupied: [number, number][] = [];

  for (const m of collect(/(^|[^\w])(pp\.\s*(\d+)\s*-\s*(\d+))/gi, norm)) {
    const lead = m[1]!.length;
    const rawStart = m.index + lead;
    const rawNorm = m[2]!;
    const rawEnd = rawStart + rawNorm.length;
    if (inSpans(fences, rawStart)) continue;
    const startN = Number(m[3]);
    const endN = Number(m[4]);
    const raw = text.slice(rawStart, rawEnd);
    const selfMarked = isSelfMarked(norm, rawStart, rawEnd);
    const width = endN - startN + 1;
    if (!isPrintedPage(startN) || !isPrintedPage(endN) || endN < startN || width > PAGE_RANGE_MAX) {
      if (isPrintedPage(startN)) {
        pageRefs.push({
          page: startN,
          index: rawStart,
          raw,
          selfMarked,
          rangeTooWide: true,
          ...(isPrintedPage(endN) ? { rangeEnd: endN } : {}),
        });
        occupied.push([rawStart, rawEnd]);
      }
      continue;
    }
    for (let p = startN; p <= endN; p++) {
      pageRefs.push({ page: p, index: rawStart, raw, selfMarked });
    }
    occupied.push([rawStart, rawEnd]);
  }

  for (const m of collect(/(^|[^\w])(p\.\s*(\d+))/gi, norm)) {
    const lead = m[1]!.length;
    const rawStart = m.index + lead;
    const rawEnd = rawStart + m[2]!.length;
    if (inSpans(fences, rawStart) || overlaps(occupied, rawStart, rawEnd)) continue;
    const page = Number(m[3]);
    if (!isPrintedPage(page)) continue;
    pageRefs.push({
      page,
      index: rawStart,
      raw: text.slice(rawStart, rawEnd),
      selfMarked: isSelfMarked(norm, rawStart, rawEnd),
    });
    occupied.push([rawStart, rawEnd]);
  }

  for (const m of collect(/第\s*(\d+)\s*页/g, norm)) {
    const rawStart = m.index;
    const rawEnd = rawStart + m[0].length;
    if (inSpans(fences, rawStart) || overlaps(occupied, rawStart, rawEnd)) continue;
    const page = Number(m[1]);
    if (!isPrintedPage(page)) continue;
    pageRefs.push({
      page,
      index: rawStart,
      raw: text.slice(rawStart, rawEnd),
      selfMarked: isSelfMarked(norm, rawStart, rawEnd),
    });
    occupied.push([rawStart, rawEnd]);
  }

  for (const m of collect(/(^|[^A-Za-z0-9_])((atom|entity):([A-Za-z0-9][A-Za-z0-9_:\-]{0,120}))/gi, norm)) {
    const lead = m[1]!.length;
    const rawStart = m.index + lead;
    const rawEnd = rawStart + m[2]!.length;
    if (inSpans(fences, rawStart)) continue;
    const kind = m[3]!.toLowerCase() === "entity" ? "entity" : "atom";
    const id = m[4]!;
    if (!id) continue;
    idRefs.push({ kind, id, index: rawStart, raw: text.slice(rawStart, rawEnd) });
  }

  return { pageRefs, idRefs };
}

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
