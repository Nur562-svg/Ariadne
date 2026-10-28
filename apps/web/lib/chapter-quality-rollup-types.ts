/**
 * T87 机械抽出：原 lib/chapter-quality-rollup.ts types 分区（ROLLUP_MISS_CARD_SAMPLE /
 * ROLLUP_PAGE_SAMPLE · RollupCite/Parse/Dark/Shallow/Draft · ChapterQualityRollup）
 * 整段迁此——六分列类型形状零改、null=未检语义零改。
 * 本件是三件 DAG 的根：跨 lib 仅 type-only import（cite-ocr-quality / parse-ocr-coverage）。
 * 无 "use client" / 无 fs / 无 process.env / 无 Date / 无网络 / 无 LLM。
 * 铁合同 header 与消费者入口仍在 @/lib/chapter-quality-rollup（barrel）。
 */

import type { CiteQuality } from "@/lib/cite-ocr-quality";
import type { ParseCoverage } from "@/lib/parse-ocr-coverage";

/** OCR 未见样例卡 id 上限（对齐 ingest 补救面板 miss 样例 ≤8）。 */
export const ROLLUP_MISS_CARD_SAMPLE = 8;
/** 暗/浅样例页上限（对齐 ingest 暗页/浅页样例 ≤6）。 */
export const ROLLUP_PAGE_SAMPLE = 6;

/** cite↔OCR 机检子集（T54/T55 CiteQuality；incompleteAtoms 单列成顶层信号，不在此重复）。 */
export type RollupCite = Pick<
  CiteQuality,
  "cards" | "atoms" | "cites" | "nullPage" | "ocrMiss" | "missRate" | "zeroAtomCards"
>;

/** parse/OCR 阶段覆盖子集（T56 ParseCoverage）。 */
export type RollupParse = Pick<
  ParseCoverage,
  "expectedPages" | "pagesPresent" | "emptyPages" | "sparsePages" | "coverageRate" | "weak"
>;

/** 抽出后暗页子集（T57）：计数 + 率 + 样例页码（深链 viewer 用）。 */
export type RollupDark = {
  darkCount: number;
  darkRate: number;
  substantialPages: number;
  samplePages: number[];
};

/** 抽出后浅页子集（T59）：计数 + 率 + 样例页码（深链 viewer 用）。 */
export type RollupShallow = {
  shallowCount: number;
  shallowRate: number;
  substantialPages: number;
  samplePages: number[];
};

/** 本机草稿交叉（T62；仅 client 可填——CLI / server 永远拿不到浏览器 localStorage）。 */
export type RollupDraft = {
  /** 本章有草稿的卡数（listDraftedCardIds ∩ 本章卡）。 */
  draftedCardCount: number;
  /** 本章草稿条目总数（cardDraftCount 求和；含与 seed 无差异的空转条目）。 */
  draftEntryCount: number;
};

/**
 * 章级质量 rollup：六信号分列。null = 未检（缺 blocks / entities，fail-closed，不装完美 0）。
 * 无 verified 字段、无健康分、无掌握%——每个信号各自说话。
 */
export type ChapterQualityRollup = {
  chapterId: string;
  /** T54/T55 cite↔OCR 机检（缺 entities → null=未检；缺 OCR 文本的 cite 不计 miss，不抬假阳）。 */
  cite: RollupCite | null;
  /** OCR 未见样例卡 id（去重 ≤ROLLUP_MISS_CARD_SAMPLE；深链 /desk/card/<id>；来自 cardCiteMisses 不重算）。 */
  citeMissCardIds: string[];
  /** T56 parse 覆盖（缺 blocks → null=未检）。 */
  parse: RollupParse | null;
  /** T57 暗页（缺 blocks 或 entities → null=未检）。 */
  dark: RollupDark | null;
  /** T59 浅页（缺 blocks 或 entities → null=未检）。 */
  shallow: RollupShallow | null;
  /** T55 seed 口径不完备原子数（空 prompt ∨ 空 answer，按原子计；cite 为 null 时 0 且 UI 须显「未检」）。 */
  incompleteAtoms: number;
  /** 含不完备原子的卡 id（T55 同口径；深链 /desk/card/<id> 开本机草稿）。 */
  incompleteCardIds: string[];
  /** T62 本机草稿交叉——只在 client 后填；server / CLI 省略（不装 0 假「无草稿」）。 */
  draft?: RollupDraft;
  /**
   * 上次 CLI 机检戳（data/qa/<ch>.*.json 的 generatedAt 取最新；缺文件 null）。
   * **旁注**：报告 ≠ 真源，戳只说明 CLI 何时跑过，不代表 seed 已核。server 装载时填。
   */
  lastCliCheckAt?: string | null;
};
