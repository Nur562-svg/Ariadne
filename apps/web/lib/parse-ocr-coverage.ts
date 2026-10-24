/**
 * T56 A：parse/OCR 阶段覆盖机检（纯函数，无 fs、无 "use client"——server 页与 client 岛
 * 共用；ChapterPageReader / DocumentPane 等客户端组件可直接 import 值）。
 *
 * 孪生实现：scripts/lib/parse-ocr-coverage.mjs（含 fs 版 loadParseCoverage，CLI /
 * extract 用）+ apps/web/lib/parse-ocr-coverage-server.ts（web server 页用的 fs 版
 * loadParseCoverage）——**三处算法必须同步改**（keep in sync）；口径只有这一份。
 *
 * 只读：绝不写回 data/chapters/*.blocks.json / entities；也**不改** deriveMaterialStage
 * 的二元推进（uploaded→parsed 只看「有无 blocks」，稀页只在此暴露、不假回退）。
 */

/**
 * 稀页阈值：页 OCR 正文（trim 后）低于该字数视为「偏稀」（常为分隔页 / 目录页 /
 * OCR 漏扫）。40 与 QA 抽查口径同族；调用方可传 opts 覆盖（勿各处私设第二套阈值）。
 */
export const SPARSE_CHAR_THR = 40;

/** 与打分相关的最小页形状（结构兼容 lib/entities 的 PageDoc）。 */
export type ParsePageLike = { page: number | null; text: string };
/** 与打分相关的最小块形状（blocks.json 的 region 字段：main | sidebar | header | footer）。 */
export type ParseBlockLike = { region?: string };

/** 单页覆盖：chars = trim 后字数；empty = 0 字；sparse = 0 < chars < 阈值。 */
export function scorePageText(
  text: string,
  thr: number = SPARSE_CHAR_THR,
): { chars: number; empty: boolean; sparse: boolean } {
  const chars = (text ?? "").trim().length;
  return { chars, empty: chars === 0, sparse: chars > 0 && chars < thr };
}

/** 章/文件级覆盖汇总。 */
export type ParseCoverage = {
  /** 期望印刷页数（优先 blocks.json chapter.pages.book 闭区间长度；缺省 = 实有页数）。 */
  expectedPages: number;
  /** 实有页条目数。 */
  pagesPresent: number;
  /** 空页（OCR 正文 0 字）。 */
  emptyPages: number;
  /** 稀页（0 < 字数 < SPARSE_CHAR_THR）。 */
  sparsePages: number;
  /** blocks 总数（缺省未传 = 0，不装假数）。 */
  blockCount: number;
  /** main 区块数（正文列；sidebar/header/footer 之外）。 */
  mainBlocks: number;
  /**
   * 覆盖率 = (实有 − 空页) / 期望，clamp ≤1（期望缺省=实有时只反映空页占比；
   * 期望来自书页区间时 additionally 反映漏扫页）。期望 0 → 1（无期望可欠）。
   */
  coverageRate: number;
  /** 稀页率 = sparsePages / pagesPresent（实有 0 → 0）。 */
  sparseRate: number;
  /**
   * weak 口径（文档化，勿私改）：emptyPages > 0 || sparsePages > 0 || coverageRate < 0.85
   * ——空页/稀页任一出现，或漏扫+空页合计拉低覆盖到 85% 以下。只作「点名/警告」信号，
   * 不参与 deriveMaterialStage 的二元推进。
   */
  weak: boolean;
};

/** 章级覆盖评分（server 页从 blocks.json 读入后传入；client 可只传 pages 走期望缺省）。 */
export function scoreParseChapter(input: {
  expectedPages?: number;
  pages: ParsePageLike[];
  blocks?: ParseBlockLike[];
}): ParseCoverage {
  const pages = input.pages ?? [];
  const pagesPresent = pages.length;
  let emptyPages = 0;
  let sparsePages = 0;
  for (const p of pages) {
    const s = scorePageText(p.text ?? "");
    if (s.empty) emptyPages++;
    if (s.sparse) sparsePages++;
  }
  const expectedPages = input.expectedPages ?? pagesPresent;
  const nonEmpty = pagesPresent - emptyPages;
  const coverageRate =
    expectedPages > 0 ? Math.min(1, nonEmpty / expectedPages) : 1;
  const sparseRate = pagesPresent > 0 ? sparsePages / pagesPresent : 0;
  const blockCount = input.blocks?.length ?? 0;
  const mainBlocks = (input.blocks ?? []).filter((b) => b.region === "main").length;
  return {
    expectedPages,
    pagesPresent,
    emptyPages,
    sparsePages,
    blockCount,
    mainBlocks,
    coverageRate,
    sparseRate,
    weak: emptyPages > 0 || sparsePages > 0 || coverageRate < 0.85,
  };
}
