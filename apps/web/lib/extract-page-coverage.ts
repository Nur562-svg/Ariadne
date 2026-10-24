/**
 * T57 A：抽出后页→原子覆盖机检（纯函数，无 fs、无 "use client"——server 页与 client 岛
 * 共用；DocumentPane / ChapterPageReader 等客户端组件可直接 import 值）。
 *
 * 孪生实现：scripts/lib/extract-page-coverage.mjs（含 fs 版 loadExtractPageCoverage，
 * CLI / extract 用）+ apps/web/lib/extract-page-coverage-server.ts（web server 页用的
 * fs 版）——**三处算法必须同步改**（keep in sync）；口径只有这一份。
 *
 * 暗页（DARK）定义（文档化，勿私改）：页 OCR 正文 trim 后 chars ≥ SPARSE_CHAR_THR
 * （复用 T56 parse-ocr-coverage 的 40，同口径不漂移）且该页在 cards 的
 * cites / fields[].cite / atoms[].cite 中零次出现（page 精确匹配）。空/稀页
 * （chars < 40）归 T56 空/稀口径，**不**进暗页（不抬假阳）。
 *
 * 只读：绝不写回 data/cards/*.entities.json / blocks.json；不自动发明 cite/原子填暗页；
 * 不改 deriveMaterialStage；也不把暗页写进 cite-ocr-quality 的 miss（两概念分列）。
 */
import { SPARSE_CHAR_THR } from "./parse-ocr-coverage";

/** 与打分相关的最小页形状（结构兼容 lib/entities 的 PageDoc）。 */
export type ExtractPageLike = { page: number | null; text: string };
/** 与打分相关的最小卡形状（cite 枚举只需 page；结构兼容 EntityCard）。 */
export type ExtractPageCardLike = {
  cites?: { page?: number | null }[];
  fields?: { cite?: { page?: number | null } }[];
  atoms?: { cite?: { page?: number | null } }[];
};

/** 单个暗页（有序列表元素）：页码 + trim 字数 + 截断预览（人读定位用）。 */
export type DarkPage = { page: number; chars: number; preview: string };

/**
 * 卡集合引用到的全部印刷页（cites · fields[].cite · atoms[].cite 的非空 page 并集）。
 */
export function collectCitedPages(cards: ExtractPageCardLike[]): Set<number> {
  const out = new Set<number>();
  const push = (c?: { page?: number | null }) => {
    if (c && typeof c.page === "number") out.add(c.page);
  };
  for (const card of cards ?? []) {
    for (const x of card.cites ?? []) push(x);
    for (const f of card.fields ?? []) push(f.cite);
    for (const a of card.atoms ?? []) push(a.cite);
  }
  return out;
}

/** 章/文件级抽出页覆盖汇总。 */
export type ExtractPageCoverage = {
  /** 实有页条目数（含空/稀/null 页——口径与 parse-ocr pagesPresent 一致）。 */
  pagesPresent: number;
  /** 实质页数（chars ≥ SPARSE_CHAR_THR）。 */
  substantialPages: number;
  /** 已 cite 页数（实有页 ∩ 引用集；引用到不存在页的鬼页 cite 不计入）。 */
  citedPages: number;
  /** 暗页（实质 ∩ ¬cited，按页码升序）。 */
  darkPages: DarkPage[];
  /** 暗页数 = darkPages.length。 */
  darkCount: number;
  /** 暗页率 = darkCount / substantialPages（substantial=0 → 0，无实质页可暗）。 */
  darkRate: number;
  /**
   * weak 口径（文档化，勿私改）：darkCount > 0——任一实质页未被抽出覆盖即点名。
   * 扉页/小结/跨章扉可能「合理暗」，仍 weak——警告不阻断（extract --strict 才在
   * darkRate≥0.35 或 darkCount≥5 时拒写，见 scripts/extract_cards.mjs C）。
   */
  weak: boolean;
};

/** 章级抽出页覆盖评分（server 页从 blocks/entities 读入后传入；client 从 props 派生）。 */
export function scoreExtractPageCoverage(input: {
  pages: ExtractPageLike[];
  cards: ExtractPageCardLike[];
}): ExtractPageCoverage {
  const pages = input.pages ?? [];
  const cited = collectCitedPages(input.cards ?? []);
  let substantialPages = 0;
  let citedPages = 0;
  const darkPages: DarkPage[] = [];
  for (const p of pages) {
    if (p.page == null) continue;
    if (cited.has(p.page)) citedPages++;
    const chars = (p.text ?? "").trim().length;
    if (chars < SPARSE_CHAR_THR) continue; // 空/稀页归 T56 口径，不进暗页
    substantialPages++;
    if (cited.has(p.page)) continue;
    darkPages.push({
      page: p.page,
      chars,
      preview: (p.text ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
    });
  }
  darkPages.sort((a, b) => a.page - b.page);
  const darkCount = darkPages.length;
  const darkRate = substantialPages > 0 ? darkCount / substantialPages : 0;
  return {
    pagesPresent: pages.length,
    substantialPages,
    citedPages,
    darkPages,
    darkCount,
    darkRate,
    weak: darkCount > 0,
  };
}
