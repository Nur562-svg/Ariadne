/**
 * T106b：实体卡页「OCR 原文栏」纯函数模型（server/client 通用 · 零 JSX · 无 "use client" · 无 fs / 网络 / LLM）。
 * 只依赖相对 .ts import（同 lib/cite-ocr-quality-*.ts：Node 原生 type-strip 可直载，便于一次性自检）。
 *
 * 红线：
 * - 合并硬换行只加/删空白，**不改字**（不变量：去掉全部空白后合并前后逐字相同）。
 * - 引文定位 = 严格归一化子串（normalizeText 后）；不用 quoteInOcr(bigram≥0.6)。命中只是「在这页文字里找到」，
 *   **不等于 verified**，永不写 verified:true。
 */
import { normalizeText } from "./cite-ocr-quality-match.ts";

/** 去掉全部空白（Unicode \s）——合并不变量的度量。 */
export function stripAllWhitespace(s: string): string {
  return s.replace(/\s+/g, "");
}

const SENT_END = /[。，；：、）”]$/; // 参考 mockup：行末无这些符号的短行视为独占一段的标题行
const TERMINAL = /。$/;

/**
 * 把 OCR 的硬换行（版面折行）合并成段落——仅显示用。
 * 规则（沿用 C′ mockup reflow）：
 *  1. 空行 = 段落边界（flush），本身不输出。
 *  2. 当前无缓冲且该行 <30 字且不以 。，；：、）” 结尾 → 视为标题/图注行，独占一段。
 *  3. 否则并入缓冲；若缓冲末尾与本行开头都是拉丁字母 → 先补一个空格（中英交界/英文断行）。
 *  4. 本行以「。」结尾且 <33 字（版面末行）→ 收段。
 * 不变量：stripAllWhitespace(paras.join("")) === stripAllWhitespace(text)。
 */
export function mergeOcrHardBreaks(text: string): string[] {
  const paras: string[] = [];
  let buf = "";
  const flush = () => {
    if (buf) {
      paras.push(buf);
      buf = "";
    }
  };
  for (const raw of text.split("\n")) {
    const ln = raw.trim();
    if (ln === "") {
      flush();
      continue;
    }
    const shortHead = ln.length < 30 && !SENT_END.test(ln);
    if (!buf && shortHead) {
      paras.push(ln);
      continue;
    }
    if (buf && /[A-Za-z]$/.test(buf) && /^[A-Za-z]/.test(ln)) buf += " ";
    buf += ln;
    if (ln.length < 33 && TERMINAL.test(ln)) flush();
  }
  flush();
  return paras;
}

/** 一段内的高亮区间（半开 [start,end)，按原段落字符串的 UTF-16 下标）。 */
export type QuoteSegment = { para: number; start: number; end: number };

/**
 * 在合并后的段落里严格定位引文（可跨段）。
 * - needle = normalizeText(quote)；空 → null。
 * - haystack = 全部段落逐字符 normalizeText 后拼接，并记下每个保留字符在原文的 (para, idx)。
 * - 取**首次**出现；命中返回每段一个区间（首尾原字符之间的标点/空白一并包含，使 <mark> 连续）。
 * - 未命中 → null（fail-closed：无高亮、无连线）。
 */
export function locateQuote(paras: string[], quote: string | undefined | null): QuoteSegment[] | null {
  const needle = normalizeText(quote ?? "");
  if (needle.length === 0) return null;
  let hay = "";
  const where: { para: number; idx: number }[] = [];
  for (let p = 0; p < paras.length; p++) {
    const s = paras[p];
    for (let i = 0; i < s.length; ) {
      const cp = s.codePointAt(i) as number;
      const ch = String.fromCodePoint(cp);
      const n = normalizeText(ch);
      for (let k = 0; k < n.length; k++) where.push({ para: p, idx: i });
      hay += n;
      i += ch.length;
    }
  }
  const at = hay.indexOf(needle);
  if (at < 0) return null;
  const a = where[at];
  const b = where[at + needle.length - 1];
  const endIdxChar = String.fromCodePoint(paras[b.para].codePointAt(b.idx) as number).length;
  const segs: QuoteSegment[] = [];
  for (let p = a.para; p <= b.para; p++) {
    segs.push({
      para: p,
      start: p === a.para ? a.idx : 0,
      end: p === b.para ? b.idx + endIdxChar : paras[p].length,
    });
  }
  return segs;
}

/** 按「段内区间」把段落切成 [{text, mark}]，供渲染 <mark>（同段至多一个区间）。 */
export function splitParaByMark(
  para: string,
  seg: { start: number; end: number } | undefined,
): { text: string; mark: boolean }[] {
  if (!seg || seg.end <= seg.start) return [{ text: para, mark: false }];
  const out: { text: string; mark: boolean }[] = [];
  if (seg.start > 0) out.push({ text: para.slice(0, seg.start), mark: false });
  out.push({ text: para.slice(seg.start, seg.end), mark: true });
  if (seg.end < para.length) out.push({ text: para.slice(seg.end), mark: false });
  return out;
}

/** 左栏一页（RSC 装配后下传）：paras 已合并硬换行。 */
export type SourcePage = {
  /** 印刷页码（非 null；page == null 的 OCR 页不进左栏）。 */
  page: number;
  /** PDF 物理页。 */
  physicalPage: number;
  paras: string[];
};

/** 该页「引用本页的卡」一行（来自 cardsCitingPage 的轻量映射）。 */
export type CitingCardRow = { cardId: string; nameZh: string; hitCount: number };

/** 字段 cite 的最小形状（供默认选中 / 定位用）。 */
export type FieldCiteLite = { page: number | null; quote?: string };

/**
 * 默认选中字段：第一个「有页且该页在左栏页集内」的字段；没有 → null。
 * （只要求该页有 OCR，不要求引文严格命中——命中与否由 locateQuote 另行决定。）
 */
export function defaultActiveField(
  fieldCites: (FieldCiteLite | undefined | null)[],
  pageSet: ReadonlySet<number>,
): number | null {
  for (let i = 0; i < fieldCites.length; i++) {
    const p = fieldCites[i]?.page;
    if (p != null && pageSet.has(p)) return i;
  }
  return null;
}

/** 上/下页（只在左栏页集内走；到头 → null；不跨章）。pages 升序。 */
export function neighborPages(pages: number[], cur: number): { prev: number | null; next: number | null; index: number } {
  const index = pages.indexOf(cur);
  if (index < 0) return { prev: null, next: null, index: -1 };
  return {
    prev: index > 0 ? pages[index - 1] : null,
    next: index < pages.length - 1 ? pages[index + 1] : null,
    index,
  };
}
