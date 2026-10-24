/**
 * T54 A（孪生）：cite quote ↔ OCR 机检算法——与 apps/web/lib/cite-ocr-quality.ts
 * **逐函数同真**（normalizeText / bigramCoverage / quoteInOcr / enumerateCardCites /
 * scoreCard / scoreChapter / cardCiteMisses）。改任何一处必须同步另一处（keep in sync）；
 * 判定口径只有这一份（bigram ≥0.6，与 data/qa 抽查同族），禁止 substring-only 分叉。
 *
 * 只读：绝不把结果写回 data/cards 的 verified——「OCR 未见」是与 seed 抽查 verified
 * 分列的机检信号。供 scripts/cite-ocr-check.mjs（CLI）与 extract_cards.mjs（后置）使用。
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
  return { cards: 0, atoms: 0, cites: 0, nullPage: 0, ocrMiss: 0, zeroAtomCards: 0, missRate: 0 };
}

export function scoreCard(card, pageTextByPage) {
  const q = emptyQuality();
  q.cards = 1;
  q.atoms = (card.atoms ?? []).length;
  if (q.atoms === 0) q.zeroAtomCards = 1;
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
      });
    }
  }
  return out;
}
