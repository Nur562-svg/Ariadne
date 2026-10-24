/**
 * T54 A：cite quote ↔ OCR 原文机检质量算法（bigram 覆盖 ≥0.6，与 data/qa 抽查口径同族）。
 * 无 "use client"——server 页与 client 岛共用；不 import 任何含 fs 的模块（类型 import
 * 编译期擦除），故 HeYeSession / DocumentPane 等客户端组件可直接引用。
 *
 * 只读：绝不把结果写回 data/cards 的 verified——「OCR 未见」是与 seed 抽查 verified
 * **分列**的机检信号（可能 OCR 误差，也可能抽取出错），两个概念互不写入。
 *
 * 孪生实现：scripts/lib/cite-ocr-quality.mjs（CLI / extract 后置用，纯 JS 同算法）——
 * **两处必须同步改**（keep in sync）；判定口径只有这一份，禁止 substring-only 分叉。
 */

/** 与打分相关的最小 cite 形状（结构兼容 lib/entities 的 Cite；不 import 含 fs 的模块）。 */
export type CiteLike = { page?: number | null; quote?: string; verified?: boolean };
/** 与打分相关的最小卡形状（结构兼容 EntityCard；atoms 只需可数与 cite 枚举）。 */
export type QualityCardLike = {
  id?: string;
  atoms?: { cite?: CiteLike }[];
  fields?: { cite?: CiteLike }[];
  cites?: CiteLike[];
};

/**
 * 归一化：小写 + 去全部非字母数字字符（空白、中英标点、引号）——OCR 常见标点漂移
 * 不应制造假「未见」；只留 CJK / 字母 / 数字后做 bigram。
 */
export function normalizeText(s: string): string {
  return (s ?? "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * 引文对页文本的 bigram 覆盖率 [0,1]：引文去重 2-gram 中命中页文本 2-gram 集的比例。
 * 空引文（归一后 0 字）→ 1（无可检内容，vacuous 命中，不制造假 miss）；
 * 单字引文 → 包含判定；页文本空 → 0。
 */
export function bigramCoverage(quote: string, pageText: string): number {
  const q = normalizeText(quote);
  const t = normalizeText(pageText);
  if (q.length === 0) return 1;
  if (q.length === 1) return t.includes(q) ? 1 : 0;
  if (t.length === 0) return 0;
  const pageGrams = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) pageGrams.add(t.slice(i, i + 2));
  const grams = new Set<string>();
  for (let i = 0; i < q.length - 1; i++) grams.add(q.slice(i, i + 2));
  let hit = 0;
  for (const g of grams) if (pageGrams.has(g)) hit++;
  return hit / grams.size;
}

/**
 * 引文是否在该页 OCR 中命中（覆盖 ≥ thr，默认 0.6）。
 * pageText 缺省（undefined/null）→ true：**未检不抬假阳 miss**——调用方拿不到该页
 * OCR 文本时不得点名「未见」（I.5 fail-closed on missing text）。
 */
export function quoteInOcr(
  quote: string,
  pageText: string | null | undefined,
  thr = 0.6,
): boolean {
  if (pageText == null) return true;
  return bigramCoverage(quote, pageText) >= thr;
}

/**
 * 单 cite 机检便捷判定（宿主 per-cite 点名用）：有页 + 有引文 + 页文本在 → 覆盖 <0.6；
 * 缺页 / 无引文 / 页文本缺 → false（未检不抬假阳）。
 */
export function citeOcrMiss(
  cite: CiteLike | undefined,
  pageTextByPage: Record<number, string> | undefined,
): boolean {
  if (!cite || cite.page == null) return false;
  if (normalizeText(cite.quote ?? "").length === 0) return false;
  if (pageTextByPage == null || pageTextByPage[cite.page] == null) return false;
  return !quoteInOcr(cite.quote as string, pageTextByPage[cite.page]);
}

/** 卡的全部 cite 来源（cites + fields[].cite + atoms[].cite），按 page|verified|quote 归一去重。 */
export function enumerateCardCites(card: QualityCardLike): { page: number | null; quote: string }[] {
  const seen = new Set<string>();
  const out: { page: number | null; quote: string }[] = [];
  const push = (c?: CiteLike) => {
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
};

function emptyQuality(): CiteQuality {
  return { cards: 0, atoms: 0, cites: 0, nullPage: 0, ocrMiss: 0, zeroAtomCards: 0, missRate: 0 };
}

/** 单卡质量（形状与章级一致，CLI / 卡详可分别消费）。 */
export function scoreCard(
  card: QualityCardLike,
  pageTextByPage: Record<number, string>,
): CiteQuality {
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
  }
  q.missRate = q.cites > 0 ? q.ocrMiss / q.cites : 0;
  return q;
}

/**
 * 未命中明细（CLI 报告样例用）：有页 + 有引文 + 页文本在 → 覆盖 < 0.6 的条目，
 * 含 cardId / page / coverage / 截断 quote。缺页文本不计（不抬假阳）。
 */
export function cardCiteMisses(
  card: QualityCardLike,
  pageTextByPage: Record<number, string>,
  thr = 0.6,
): { cardId: string; page: number; coverage: number; quote: string }[] {
  const out: { cardId: string; page: number; coverage: number; quote: string }[] = [];
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
