/**
 * T86 机械抽出：原 lib/cite-ocr-quality.ts match 分区（CiteLike / QualityCardLike / normalizeText /
 * bigramCoverage / quoteInOcr / citeOcrMiss / enumerateCardCites）整段迁此——bigram 覆盖 ≥0.6（thr 默认
 * 0.6）/ 缺文本未检不抬假阳 / 空引文 vacuous 命中 / 去重键 page|verified|quote 行为零改。
 * 本件是三件 DAG 的根：无 import。无 "use client" / 无 fs / 无 process.env / 无 Date / 无网络 / 无 LLM。
 * 铁合同 header 与消费者入口仍在 @/lib/cite-ocr-quality（barrel）；孪生 scripts/lib/cite-ocr-quality.mjs
 * 算法体不变（keep in sync 合同不受本刀影响）。
 */

/** 与打分相关的最小 cite 形状（结构兼容 lib/entities 的 Cite；不 import 含 fs 的模块）。 */
export type CiteLike = { page?: number | null; quote?: string; verified?: boolean };
/** 与打分相关的最小卡形状（结构兼容 EntityCard；atoms 只需可数与 cite 枚举）。 */
export type QualityCardLike = {
  id?: string;
  atoms?: { prompt?: string; answer?: string; cite?: CiteLike }[];
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
