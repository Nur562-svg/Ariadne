/**
 * T54 A + T55 A（孪生）：cite quote ↔ OCR 机检算法——与 apps/web/lib/cite-ocr-quality.ts
 * **逐函数同真**（normalizeText / bigramCoverage / quoteInOcr / citeOcrMiss /
 * enumerateCardCites / scoreCard / scoreChapter / cardCiteMisses / ocrNeighborhood /
 * suggestQuoteFromOcr）。改任何一处必须同步另一处（keep in sync）；
 * 判定口径只有这一份（bigram ≥0.6，与 data/qa 抽查同族），禁止 substring-only 分叉。
 *
 * 只读：绝不把结果写回 data/cards 的 verified / entities——「OCR 未见」与建议摘录都是
 * 供人核的机检信号（建议 · 人核后再贴）。供 scripts/cite-ocr-check.mjs 与
 * extract_cards.mjs（后置）使用。
 */

export function normalizeText(s) {
  return (s ?? "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

export function bigramCoverage(quote, pageText) {
  const q = normalizeText(quote);
  const t = normalizeText(pageText);
  if (q.length === 0) return 1;
  if (q.length === 1) return t.includes(q) ? 1 : 0;
  if (t.length === 0) return 0;
  const pageGrams = new Set();
  for (let i = 0; i < t.length - 1; i++) pageGrams.add(t.slice(i, i + 2));
  const grams = new Set();
  for (let i = 0; i < q.length - 1; i++) grams.add(q.slice(i, i + 2));
  let hit = 0;
  for (const g of grams) if (pageGrams.has(g)) hit++;
  return hit / grams.size;
}

export function quoteInOcr(quote, pageText, thr = 0.6) {
  if (pageText == null) return true; // 未检不抬假阳 miss
  return bigramCoverage(quote, pageText) >= thr;
}

export function citeOcrMiss(cite, pageTextByPage) {
  if (!cite || cite.page == null) return false;
  if (normalizeText(cite.quote ?? "").length === 0) return false;
  if (pageTextByPage == null || pageTextByPage[cite.page] == null) return false;
  return !quoteInOcr(cite.quote, pageTextByPage[cite.page]);
}

export function enumerateCardCites(card) {
  const seen = new Set();
  const out = [];
  const push = (c) => {
    if (!c) return;
    const quote = c.quote ?? "";
    const key = `${c.page ?? "?"}|${c.verified ? 1 : 0}|${normalizeText(quote).slice(0, 60)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ page: c.page ?? null, quote });
  };
  for (const c of card.cites ?? []) push(c);
  for (const f of card.fields ?? []) push(f.cite);
  for (const a of card.atoms ?? []) push(a.cite);
  return out;
}

function emptyQuality() {
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
 * T55 A：引文在页 OCR 中的「附近窗」——归一化页文本中命中引文 bigram 的位置聚成
 * 最稠密簇，返回原始文本坐标下的窗。只读，绝不编造原文；空页/空引文/零命中 → null。
 */
function normalizeWithMap(s) {
  const rawIdx = [];
  let norm = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (/[^\p{L}\p{N}]/u.test(ch)) continue;
    norm += ch.toLowerCase();
    rawIdx.push(i);
  }
  return { norm, rawIdx };
}

export function ocrNeighborhood(quote, pageText, radius = 40) {
  const q = normalizeText(quote);
  const page = normalizeWithMap(pageText ?? "");
  if (q.length < 2 || page.norm.length < 2) return null;
  const qGrams = new Set();
  for (let i = 0; i < q.length - 1; i++) qGrams.add(q.slice(i, i + 2));
  const hits = [];
  for (let i = 0; i < page.norm.length - 1; i++) {
    if (qGrams.has(page.norm.slice(i, i + 2))) hits.push(i);
  }
  if (hits.length === 0) return null;
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
 * T55 A：启发式建议摘录（禁 LLM）——以最稠密簇为中心向两侧扩到句读边界（≤60 字），
 * ≤120 字。无命中簇 → null。只是建议：调用方文案必须注明人核后再用，
 * 绝不自动写回 entities / verified。
 */
export function suggestQuoteFromOcr(quote, pageText) {
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

export function scoreCard(card, pageTextByPage) {
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

export function scoreChapter(cards, pageTextByPage) {
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

export function cardCiteMisses(card, pageTextByPage, thr = 0.6) {
  const out = [];
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
