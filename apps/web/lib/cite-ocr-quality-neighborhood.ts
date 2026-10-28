/**
 * T86 机械抽出：原 lib/cite-ocr-quality.ts neighborhood 分区（CiteQuality / emptyQuality /
 * OcrNeighborhood / normalizeWithMap / ocrNeighborhood / suggestQuoteFromOcr）整段迁此——
 * 最稠密簇窗（win = 引文归一长 1.5 倍 · 下限 8）/ snippet·suggest ≤120 / 句读边界扩展 /
 * 只读 pageText 绝不编造原文 / 禁 LLM 行为零改。normalizeWithMap 仍私有。
 * emptyQuality（原 score 区调用方私有零值构造）为 score 双调用点（scoreCard / scoreChapter）
 * 所需，加 export（T84/T85 isPrintedPage 同款；不复制分叉）；normalizeText 自 match import。
 * 无 "use client" / 无 fs / 无 process.env / 无 Date / 无网络 / 无 LLM。
 * 铁合同 header 与消费者入口仍在 @/lib/cite-ocr-quality（barrel）；孪生 .mjs 算法体不变。
 */

import { normalizeText } from "./cite-ocr-quality-match.ts";

/** 章/卡级质量汇总（scoreCard = 单卡；scoreChapter = 多卡折叠，同一形状）。 */
export type CiteQuality = {
  /** 卡数。 */
  cards: number;
  /** 原子总数。 */
  atoms: number;
  /** 有页 cite 数（去重后）。 */
  cites: number;
  /** 无页 p.? cite 数（去重后）。 */
  nullPage: number;
  /** OCR 未见：有页 + 有引文 + 该页 OCR 文本在 → bigram < 0.6（缺文本不计，不抬假阳）。 */
  ocrMiss: number;
  /** 零原子卡数（卡在、atoms 为空——练池污染源）。 */
  zeroAtomCards: number;
  /** ocrMiss / cites（cites=0 → 0）。 */
  missRate: number;
  /**
   * T55 A：原子完备计数——空 prompt / 空 answer / 二者其一为空（incomplete = 空 prompt ∨
   * 空 answer，按**原子**计）。与 zeroAtomCards（整卡无 atoms）口径互斥：零原子卡没有
   * atoms 可数，不会重复计入 incomplete——不双计。
   */
  emptyPromptAtoms: number;
  emptyAnswerAtoms: number;
  incompleteAtoms: number;
};

export function emptyQuality(): CiteQuality {
  return {
    cards: 0,
    atoms: 0,
    cites: 0,
    nullPage: 0,
    ocrMiss: 0,
    zeroAtomCards: 0,
    missRate: 0,
    emptyPromptAtoms: 0,
    emptyAnswerAtoms: 0,
    incompleteAtoms: 0,
  };
}

/**
 * T55 A：引文在页 OCR 中的「附近窗」——把归一化页文本中命中引文 bigram 的位置聚成
 * 最稠密簇，返回**原始**文本坐标下的窗（snippet 截断合理长度，approxStart/End 为簇的
 * 原始下标）。只读 pageText，绝不编造原文；空页 / 空引文 / 一个 bigram 都不命中 → null。
 */
export type OcrNeighborhood = {
  snippet: string;
  approxStart: number | null;
  approxEnd: number | null;
};

/** 归一化时保留 raw 下标映射（\p{L}\p{N} 白名单同 normalizeText）。 */
function normalizeWithMap(s: string): { norm: string; rawIdx: number[] } {
  const rawIdx: number[] = [];
  let norm = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (/[^\p{L}\p{N}]/u.test(ch)) continue;
    norm += ch.toLowerCase();
    rawIdx.push(i);
  }
  return { norm, rawIdx };
}

export function ocrNeighborhood(
  quote: string,
  pageText: string,
  radius = 40,
): OcrNeighborhood | null {
  const q = normalizeText(quote);
  const page = normalizeWithMap(pageText ?? "");
  if (q.length < 2 || page.norm.length < 2) return null;
  // 引文 bigram → 页内归一化下标表（一次扫描）。
  const qGrams = new Set<string>();
  for (let i = 0; i < q.length - 1; i++) qGrams.add(q.slice(i, i + 2));
  const hits: number[] = [];
  for (let i = 0; i < page.norm.length - 1; i++) {
    if (qGrams.has(page.norm.slice(i, i + 2))) hits.push(i);
  }
  if (hits.length === 0) return null;
  // 最稠密簇：窗长 = 引文归一长度的 1.5 倍（下限 8）——滑动取命中数最多的窗
  // （bestLeftIdx/bestRightIdx 是 hits 数组下标，供簇首/簇末映射回原始下标）。
  const win = Math.max(8, Math.ceil(q.length * 1.5));
  let bestCount = 0;
  let bestLeftIdx = 0;
  let bestRightIdx = 0;
  let left = 0;
  for (let right = 0; right < hits.length; right++) {
    while (hits[right] - hits[left] > win) left++;
    const count = right - left + 1;
    if (count > bestCount) {
      bestCount = count;
      bestLeftIdx = left;
      bestRightIdx = right;
    }
  }
  const firstHit = hits[bestLeftIdx];
  const lastHit = hits[bestRightIdx];
  const rawLo = Math.max(0, (page.rawIdx[firstHit] ?? 0) - Math.ceil(radius / 2));
  const rawHi = Math.min((page.rawIdx[lastHit] ?? 0) + radius, (pageText ?? "").length);
  const snippet = (pageText ?? "")
    .slice(rawLo, rawHi)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return {
    snippet,
    approxStart: page.rawIdx[firstHit] ?? null,
    approxEnd: page.rawIdx[lastHit] ?? null,
  };
}

/**
 * T55 A：启发式建议摘录（禁 LLM）——以最稠密簇为中心，向两侧扩到句读边界
 *（。；？！或换行，最多再 60 字），得到一段「可直接贴回 seed 的人核候选」。
 * 无命中簇 → null。≤120 字。**只是建议**：调用方文案必须注明人核后再用，
 * 绝不自动写回 entities / verified。
 */
export function suggestQuoteFromOcr(quote: string, pageText: string): string | null {
  const text = pageText ?? "";
  const nb = ocrNeighborhood(quote, text, 40);
  if (!nb || nb.approxStart == null) return null;
  const center = nb.approxStart;
  const SENT = "。；？！!?\n";
  let start = center;
  let back = 0;
  while (start > 0 && back < 60) {
    start--;
    back++;
    if (SENT.includes(text[start])) {
      start++;
      break;
    }
  }
  let end = (nb.approxEnd ?? center) + 1;
  let fwd = 0;
  while (end < text.length && fwd < 60) {
    if (SENT.includes(text[end])) {
      end++;
      break;
    }
    end++;
    fwd++;
  }
  const s = text
    .slice(start, end)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return s.length > 0 ? s : null;
}
