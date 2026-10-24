/**
 * T58 A + T60 A：学习环可考覆盖薄适配（纯函数，无 fs、无 "use client"）——**消费** T57
 * extract-page-coverage 的暗页信号 + T59 extract-page-density 的浅密度信号，**禁止**复制
 * 第二套暗/浅算法 / 漂移 SPARSE_CHAR_THR / SHALLOW_* / 改 cite-ocr（T54）与 parse-ocr
 * （T56）口径。fs 版装配在 apps/web/lib/examinable-coverage-server.ts
 * （scopeExaminableCoverage / loadPageExaminable）——client 组件只 import 本纯函数版。
 *
 * 只读：绝不写 entities / verified；不改 deriveMaterialStage；不自动发明 cite 填暗页，
 * 也不发明原子「补浅」。四概念分列：暗（零 cite）≠ 浅（已 cite 原子极稀）≠ 稀（chars<40）
 * ≠ cite↔OCR miss——浅**不**并进 darkCount，暗也**不**伪装成浅。
 */
import { SPARSE_CHAR_THR } from "./parse-ocr-coverage";
import type { DarkPage, ExtractPageCoverage } from "./extract-page-coverage";
import {
  SHALLOW_ATOM_MAX,
  SHALLOW_CHARS_PER_ATOM,
  type ExtractPageDensity,
  type ShallowPage,
} from "./extract-page-density";

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
  /**
   * T60 A：浅页合计 = sum(density.shallowCount)——**只**累加有 density 报告的章
   * （缺 density 章浅未检跳过，勿装 0 完美）；浅不进 darkCount。
   */
  shallowCount: number;
  /** 浅页有序样例（页码升序，≤8；来自 T59 ShallowPage——页码/原子数/字数/预览）。 */
  shallowPages: ShallowPage[];
  /** 有原子页合计（density.citedAtomPages 求和，仅 density-checked 章——「已抽出且可考」）。 */
  atomPages: number;
  /** 是否至少一章有 density 报告（全缺 → false：浅未检，调用方勿当「浅 0 = 完美」）。 */
  densityChecked: boolean;
  /** densityWeak 口径（文档化）：shallowCount > 0——任一已 cite 实质页原子极稀即点名。 */
  densityWeak: boolean;
};

/** 逐章信号对（T60 A：T57 覆盖 + T59 密度同时 fold；各自 null = 该章该面未检）。 */
export type ExaminableChapterSignals = {
  coverage: ExtractPageCoverage | null;
  density: ExtractPageDensity | null;
};

/** 单页可考性 hint（orphan 分型 / HeYe orphan 旁挂 / 本页浅旁挂用）。 */
export type PageExaminableHint = "dark" | "sparse" | "shallow" | "ok" | "unchecked";

/**
 * 多章折叠：null（该章未检）章如实跳过；coverage 全未检 → null（整 scope 未检，不装完美）。
 * 与书架 bookExtractPage 的合计口径一致（substantial/cited/dark 求和、任暗即 weak）；
 * 浅侧只累加有 density 报告的章（缺 density 章跳过浅——浅未检 ≠ 浅 0），任浅即 densityWeak。
 */
export function foldExaminableCoverages(
  chapters: ExaminableChapterSignals[],
): ExaminableCoverage | null {
  const checkedCov = chapters.filter((c): c is ExaminableChapterSignals & { coverage: ExtractPageCoverage } => c.coverage != null);
  if (checkedCov.length === 0) return null;
  let substantialPages = 0;
  let citedPages = 0;
  let darkCount = 0;
  const darkPages: DarkPage[] = [];
  for (const c of checkedCov) {
    substantialPages += c.coverage.substantialPages;
    citedPages += c.coverage.citedPages;
    darkCount += c.coverage.darkCount;
    darkPages.push(...c.coverage.darkPages);
  }
  darkPages.sort((a, b) => a.page - b.page);
  let shallowCount = 0;
  let atomPages = 0;
  let densityChecked = false;
  const shallowPages: ShallowPage[] = [];
  for (const c of chapters) {
    if (c.density == null) continue; // 缺 density 章：浅未检跳过，勿装 0 完美
    densityChecked = true;
    shallowCount += c.density.shallowCount;
    atomPages += c.density.citedAtomPages;
    shallowPages.push(...c.density.shallowPages);
  }
  shallowPages.sort((a, b) => a.page - b.page);
  return {
    substantialPages,
    citedPages,
    darkCount,
    darkPages: darkPages.slice(0, 8),
    examinableRate: substantialPages > 0 ? (substantialPages - darkCount) / substantialPages : null,
    weak: darkCount > 0,
    shallowCount,
    shallowPages: shallowPages.slice(0, 8),
    atomPages,
    densityChecked,
    densityWeak: shallowCount > 0,
  };
}

/**
 * 单页可考性（T60 A 扩展，优先序 sparse > dark > shallow > ok，缺数据 → unchecked）：
 * - chars < SPARSE_CHAR_THR → 'sparse'（空/稀归 T56 口径，不冒充暗页）；
 * - chars ≥ 阈值且页 ∉ citedSet → 'dark'（实质 OCR 未抽出 cite）；
 * - ∈ citedSet 且浅定义命中 → 'shallow'——判定**只**用 atomCountByPage 的
 *   atoms[].cite.page 计数（collectAtomCountByPage，与 T59 density-check 同口径；禁止
 *   card cites / fields[].cite 单独膨胀），复用 SHALLOW_ATOM_MAX / SHALLOW_CHARS_PER_ATOM
 *   常量（勿漂移）：1 ≤ atomCount ≤ 2 ∧ chars/atomCount ≥ 400；
 * - ∈ citedSet 且非浅 → 'ok'（含「card 级 cite 但零原子」页——cited 非 dark，也不装浅）。
 * 缺 citedSet / 页文本 / 页码 → 'unchecked'（未检不点名）；缺 atomCountByPage 同样
 * 无法判浅 → cited 页只判 'ok'（不装浅假阳）。
 */
export function pageExaminableHint(input: {
  page: number | null;
  pageText?: string | null;
  citedSet?: Set<number> | null;
  /** T60 A：页 → 可考原子数（collectAtomCountByPage，只计 atoms[].cite.page）——浅判定用。 */
  atomCountByPage?: Map<number, number> | null;
}): PageExaminableHint {
  if (input.page == null || input.citedSet == null || input.pageText == null) return "unchecked";
  const chars = (input.pageText ?? "").trim().length;
  if (chars < SPARSE_CHAR_THR) return "sparse";
  if (!input.citedSet.has(input.page)) return "dark";
  const atomCount = input.atomCountByPage?.get(input.page) ?? 0;
  if (
    atomCount >= 1 &&
    atomCount <= SHALLOW_ATOM_MAX &&
    chars / atomCount >= SHALLOW_CHARS_PER_ATOM
  ) {
    return "shallow";
  }
  return "ok";
}
