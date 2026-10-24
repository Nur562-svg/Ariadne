/**
 * T58 A：学习环可考覆盖薄适配（纯函数，无 fs、无 "use client"）——**消费** T57
 * extract-page-coverage 的暗页信号，**禁止**复制第二套暗页算法 / 漂移 SPARSE_CHAR_THR /
 * 改 cite-ocr（T54）与 parse-ocr（T56）口径。fs 版装配在
 * apps/web/lib/examinable-coverage-server.ts（scopeExaminableCoverage /
 * loadPageExaminable）——client 组件只 import 本纯函数版。
 *
 * 只读：绝不写 entities / verified；不改 deriveMaterialStage；不自动发明 cite 填暗页。
 */
import { SPARSE_CHAR_THR } from "./parse-ocr-coverage";
import type { DarkPage, ExtractPageCoverage } from "./extract-page-coverage";

/** scope（书/章/全库）级可考覆盖汇总——多章折叠（与书架 bookExtractPage 合计同口径）。 */
export type ExaminableCoverage = {
  /** 实质页合计（chars ≥ SPARSE_CHAR_THR）。 */
  substantialPages: number;
  /** 已 cite 页合计（实有页 ∩ 引用集；与 T57 page-check「已cite」同源同数）。 */
  citedPages: number;
  /** 暗页合计 = sum(darkCount)。 */
  darkCount: number;
  /** 暗页有序样例（页码升序，≤8——供琥珀点名，勿无限铺）。 */
  darkPages: DarkPage[];
  /**
   * 可考覆盖率 = (substantial − dark) / substantial ≡ 实质页中被 cite 的比例（= 1 −
   * darkRate，与 T57 零漂移）。substantial=0 → **null**（无实质页可评＝未检意义，
   * 不装 rate=1 完美，也不装 0 假稀——调用方按 null 不出覆盖条）。
   */
  examinableRate: number | null;
  /** weak 口径（文档化）：darkCount > 0——任一实质页未进可练池即点名；警告不阻断。 */
  weak: boolean;
};

/** 单页可考性 hint（orphan 分型 / HeYe orphan 旁挂用）。 */
export type PageExaminableHint = "dark" | "sparse" | "ok" | "unchecked";

/**
 * 多章折叠：null（该章未检）章如实跳过；全部未检 → null（整 scope 未检，不装完美）。
 * 与书架 bookExtractPage 的合计口径一致（substantial/cited/dark 求和、任暗即 weak）。
 */
export function foldExaminableCoverages(
  covs: (ExtractPageCoverage | null)[],
): ExaminableCoverage | null {
  const checked = covs.filter((c): c is ExtractPageCoverage => c != null);
  if (checked.length === 0) return null;
  let substantialPages = 0;
  let citedPages = 0;
  let darkCount = 0;
  const darkPages: DarkPage[] = [];
  for (const c of checked) {
    substantialPages += c.substantialPages;
    citedPages += c.citedPages;
    darkCount += c.darkCount;
    darkPages.push(...c.darkPages);
  }
  darkPages.sort((a, b) => a.page - b.page);
  return {
    substantialPages,
    citedPages,
    darkCount,
    darkPages: darkPages.slice(0, 8),
    examinableRate: substantialPages > 0 ? (substantialPages - darkCount) / substantialPages : null,
    weak: darkCount > 0,
  };
}

/**
 * 单页可考性：chars < SPARSE_CHAR_THR → 'sparse'（空/稀归 T56 口径，不冒充暗页）；
 * chars ≥ 阈值且页 ∉ citedSet → 'dark'（实质 OCR 未抽出 cite）；∈ citedSet → 'ok'。
 * 缺 citedSet / 页文本 / 页码 → 'unchecked'（未检不点名，不抬假阳也不装满暗）。
 */
export function pageExaminableHint(input: {
  page: number | null;
  pageText?: string | null;
  citedSet?: Set<number> | null;
}): PageExaminableHint {
  if (input.page == null || input.citedSet == null || input.pageText == null) return "unchecked";
  const chars = (input.pageText ?? "").trim().length;
  if (chars < SPARSE_CHAR_THR) return "sparse";
  return input.citedSet.has(input.page) ? "ok" : "dark";
}
