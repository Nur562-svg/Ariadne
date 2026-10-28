/**
 * T86 机械抽出：原 lib/cite-ocr-quality.ts score 分区（scoreCard / scoreChapter / cardCiteMisses）
 * 整段迁此——incompleteAtoms 与 zeroAtomCards 互斥不双计 / missRate 按合计重算不平均各卡率 /
 * 缺页文本不计 / 未命中条目 coverage 三位小数 · quote 截 30 · ocrSnippet · suggestQuote
 * （只读建议供人核，绝不自动写回 entities）行为零改。
 * enumerateCardCites · normalizeText · quoteInOcr · bigramCoverage · QualityCardLike 自 match；
 * emptyQuality · ocrNeighborhood · suggestQuoteFromOcr · CiteQuality 自 neighborhood。
 * 无 "use client" / 无 fs / 无 process.env / 无 Date / 无网络 / 无 LLM。
 * 铁合同 header 与消费者入口仍在 @/lib/cite-ocr-quality（barrel）；孪生 .mjs 算法体不变。
 */

import {
  bigramCoverage,
  enumerateCardCites,
  normalizeText,
  quoteInOcr,
  type QualityCardLike,
} from "./cite-ocr-quality-match.ts";
import {
  emptyQuality,
  ocrNeighborhood,
  suggestQuoteFromOcr,
  type CiteQuality,
} from "./cite-ocr-quality-neighborhood.ts";

/** 单卡质量（形状与章级一致，CLI / 卡详可分别消费）。 */
export function scoreCard(
  card: QualityCardLike,
  pageTextByPage: Record<number, string>,
): CiteQuality {
  const q = emptyQuality();
  q.cards = 1;
  q.atoms = (card.atoms ?? []).length;
  if (q.atoms === 0) q.zeroAtomCards = 1;
  // T55 A：原子完备计数（零原子卡无 atoms 可数——与 zeroAtomCards 口径互斥不双计）。
  for (const a of card.atoms ?? []) {
    const emptyP = (a.prompt ?? "").trim().length === 0;
    const emptyA = (a.answer ?? "").trim().length === 0;
    if (emptyP) q.emptyPromptAtoms++;
    if (emptyA) q.emptyAnswerAtoms++;
    if (emptyP || emptyA) q.incompleteAtoms++;
  }
  for (const c of enumerateCardCites(card)) {
    if (c.page == null) {
      q.nullPage++;
      continue;
    }
    q.cites++;
    if (
      normalizeText(c.quote).length > 0 &&
      pageTextByPage[c.page] != null &&
      !quoteInOcr(c.quote, pageTextByPage[c.page])
    ) {
      q.ocrMiss++;
    }
  }
  q.missRate = q.cites > 0 ? q.ocrMiss / q.cites : 0;
  return q;
}

/** 章级质量：多卡折叠（missRate 按合计重算，不平均各卡率）。 */
export function scoreChapter(
  cards: QualityCardLike[],
  pageTextByPage: Record<number, string>,
): CiteQuality {
  const q = emptyQuality();
  for (const card of cards) {
    const one = scoreCard(card, pageTextByPage);
    q.cards += one.cards;
    q.atoms += one.atoms;
    q.cites += one.cites;
    q.nullPage += one.nullPage;
    q.ocrMiss += one.ocrMiss;
    q.zeroAtomCards += one.zeroAtomCards;
    q.emptyPromptAtoms += one.emptyPromptAtoms;
    q.emptyAnswerAtoms += one.emptyAnswerAtoms;
    q.incompleteAtoms += one.incompleteAtoms;
  }
  q.missRate = q.cites > 0 ? q.ocrMiss / q.cites : 0;
  return q;
}

/**
 * 未命中明细（CLI 报告样例 / 补救面板用）：有页 + 有引文 + 页文本在 → 覆盖 < 0.6 的条目，
 * 含 cardId / page / coverage / 截断 quote / ocrSnippet（附近 OCR 窗）/ suggestQuote
 * （启发式建议摘录，≤120）。缺页文本不计（不抬假阳）。只读——建议摘录供人核后手贴，
 * 绝不自动写回 entities。
 */
export function cardCiteMisses(
  card: QualityCardLike,
  pageTextByPage: Record<number, string>,
  thr = 0.6,
): {
  cardId: string;
  page: number;
  coverage: number;
  quote: string;
  ocrSnippet?: string;
  suggestQuote?: string;
}[] {
  const out: {
    cardId: string;
    page: number;
    coverage: number;
    quote: string;
    ocrSnippet?: string;
    suggestQuote?: string;
  }[] = [];
  for (const c of enumerateCardCites(card)) {
    if (c.page == null) continue;
    if (normalizeText(c.quote).length === 0) continue;
    const text = pageTextByPage[c.page];
    if (text == null) continue;
    const cov = bigramCoverage(c.quote, text);
    if (cov < thr) {
      out.push({
        cardId: card.id ?? "?",
        page: c.page,
        coverage: Math.round(cov * 1000) / 1000,
        quote: c.quote.length > 30 ? `${c.quote.slice(0, 30)}…` : c.quote,
        ocrSnippet: ocrNeighborhood(c.quote, text)?.snippet ?? undefined,
        suggestQuote: suggestQuoteFromOcr(c.quote, text) ?? undefined,
      });
    }
  }
  return out;
}
