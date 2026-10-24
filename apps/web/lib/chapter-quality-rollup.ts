/**
 * T63 A：章级质量 rollup 纯聚合（纯函数，无 fs、无 "use client"——server 页与 client 岛
 * 共用；ChapterQualityCockpit 等客户端组件可直接 import 类型与 helper）。
 *
 * consume-only 合同（写死 · 任何改动不得触碰）：
 * 1. **零新质量算法**——本模块只拼装既有返回值：cite-ocr-quality（scoreChapter /
 *    cardCiteMisses）、parse-ocr-coverage（scoreParseChapter）、extract-page-coverage
 *    （scoreExtractPageCoverage）、extract-page-density（scoreExtractPageDensity）、
 *    T55 incomplete 口径（atomIncomplete / scoreCard.incompleteAtoms）、T62 draft
 *    （client 用 listDraftedCardIds / cardDraftCount 后填）。禁止复制第二套阈值
 *    （SPARSE_CHAR_THR / SHALLOW_* / bigram 0.6）或另算任何分叉。
 * 2. **六概念分列**：cite 未见 ≠ parse 空/稀 ≠ 暗 ≠ 浅 ≠ incomplete ≠ draft——
 *    类型按信号分字段，缺信号用 null=未检；禁止合成单一「健康分 / 掌握% / 圆环」。
 * 3. **永不 verified:true**——rollup 没有 verified 语义；报告不得含 verified→true 指令。
 *    机检 ≠ seed 抽查 verified。
 * 4. **永不 auto PATCH / fs / fetch 写** data/cards/*.entities.json / blocks / 任何 seed。
 *    data/qa/<ch>.quality-rollup.json 是**报告非真源**（与既有 cite-ocr.json 同族）。
 * 5. **永不** Clew LLM 真写 / invent 原子补浅补暗；**永不**第四书架徽列 densify——
 *    cockpit 是书库效用区另一面，不塞进 shelf cite|parse|暗 三分列骨架。
 *
 * 孪生：scripts/chapter-quality-check.mjs（CLI `pnpm qa-check`）用 scripts/lib 同真算法
 * 拼同一形状（draft 字段 CLI 不可见——浏览器本机草稿）；server 装载见
 * apps/web/lib/chapter-quality-rollup-server.ts。
 */

import type { CiteQuality } from "@/lib/cite-ocr-quality";
import type { ParseCoverage } from "@/lib/parse-ocr-coverage";
import type { ExtractPageCoverage } from "@/lib/extract-page-coverage";
import type { ExtractPageDensity } from "@/lib/extract-page-density";

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

/** 去重取前 n 个卡 id（保持首次出现顺序；cardCiteMisses 同卡多 miss 只点名一次）。 */
function uniqueCardIds(entries: { cardId: string }[] | undefined, n: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const e of entries ?? []) {
    if (!e.cardId || seen.has(e.cardId)) continue;
    seen.add(e.cardId);
    out.push(e.cardId);
    if (out.length >= n) break;
  }
  return out;
}

/**
 * 只拼装（零重算）：把四个既有机检返回值 + T55 incomplete 卡枚举折成 rollup。
 * - cite / parse / dark / shallow 传 null 或省略 = 未检（原样保留 null，不造 0）。
 * - citeMisses 传 cardCiteMisses 的返回（或其子集）——只取 cardId 去重作样例。
 * - incompleteCardIds 由调用方按 T55 口径枚举（server: atomIncomplete；CLI: scoreCard）。
 */
export function buildChapterQualityRollup(input: {
  chapterId: string;
  cite?: CiteQuality | null;
  citeMisses?: { cardId: string }[];
  parse?: ParseCoverage | null;
  dark?: ExtractPageCoverage | null;
  shallow?: ExtractPageDensity | null;
  incompleteCardIds?: string[];
}): ChapterQualityRollup {
  const cite = input.cite ?? null;
  const parse = input.parse ?? null;
  const dark = input.dark ?? null;
  const shallow = input.shallow ?? null;
  return {
    chapterId: input.chapterId,
    cite: cite
      ? {
          cards: cite.cards,
          atoms: cite.atoms,
          cites: cite.cites,
          nullPage: cite.nullPage,
          ocrMiss: cite.ocrMiss,
          missRate: cite.missRate,
          zeroAtomCards: cite.zeroAtomCards,
        }
      : null,
    citeMissCardIds: cite ? uniqueCardIds(input.citeMisses, ROLLUP_MISS_CARD_SAMPLE) : [],
    parse: parse
      ? {
          expectedPages: parse.expectedPages,
          pagesPresent: parse.pagesPresent,
          emptyPages: parse.emptyPages,
          sparsePages: parse.sparsePages,
          coverageRate: parse.coverageRate,
          weak: parse.weak,
        }
      : null,
    dark: dark
      ? {
          darkCount: dark.darkCount,
          darkRate: dark.darkRate,
          substantialPages: dark.substantialPages,
          samplePages: dark.darkPages.slice(0, ROLLUP_PAGE_SAMPLE).map((d) => d.page),
        }
      : null,
    shallow: shallow
      ? {
          shallowCount: shallow.shallowCount,
          shallowRate: shallow.shallowRate,
          substantialPages: shallow.substantialPages,
          samplePages: shallow.shallowPages.slice(0, ROLLUP_PAGE_SAMPLE).map((s) => s.page),
        }
      : null,
    incompleteAtoms: cite?.incompleteAtoms ?? 0,
    incompleteCardIds: cite ? [...(input.incompleteCardIds ?? [])] : [],
  };
}

// ---- 只读派生 helper（UI / CLI 共用；不产生新口径，只读各信号自带的 weak / 计数） ----

/** 六信号各自是否「弱」（未检 = false，不抬假阳；draft 不是缺陷，不入弱）。 */
export type RollupWeakFlags = {
  cite: boolean;
  parse: boolean;
  dark: boolean;
  shallow: boolean;
  incomplete: boolean;
};

export function rollupWeakFlags(r: ChapterQualityRollup): RollupWeakFlags {
  return {
    // T55 书架徽同口径：OCR未见 / 零原子卡 任一 >0（不完备单列）。
    cite: r.cite != null && (r.cite.ocrMiss > 0 || r.cite.zeroAtomCards > 0),
    parse: r.parse != null && r.parse.weak,
    dark: r.dark != null && r.dark.darkCount > 0,
    shallow: r.shallow != null && r.shallow.shallowCount > 0,
    incomplete: r.cite != null && r.incompleteAtoms > 0,
  };
}

/** 任一信号弱 → 弱章（draft 不计——草稿是待办状态不是机检缺陷）。 */
export function rollupIsWeak(r: ChapterQualityRollup): boolean {
  const f = rollupWeakFlags(r);
  return f.cite || f.parse || f.dark || f.shallow || f.incomplete;
}

/** 五个机检信号是否全部未检（无 blocks 也无 entities——整章只能诚实「未检」）。 */
export function rollupAllUnchecked(r: ChapterQualityRollup): boolean {
  return r.cite == null && r.parse == null && r.dark == null && r.shallow == null;
}

/**
 * 多章折叠（书级旁注 / CLI --book 一行）：计数求和、率按合计重算（不平均各章率）；
 * 任一章某信号未检 → 该信号 uncheckedChapters 计数，不装 0。
 */
export type RollupFold = {
  chapters: number;
  weakChapters: number;
  cite: { ocrMiss: number; cites: number; missRate: number; zeroAtomCards: number; unchecked: number };
  parse: { emptyPages: number; sparsePages: number; weak: number; unchecked: number };
  dark: { darkCount: number; substantialPages: number; darkRate: number; unchecked: number };
  shallow: { shallowCount: number; substantialPages: number; shallowRate: number; unchecked: number };
  incompleteAtoms: number;
  draft?: RollupDraft;
};

export function foldChapterRollups(rollups: ChapterQualityRollup[]): RollupFold {
  const f: RollupFold = {
    chapters: rollups.length,
    weakChapters: 0,
    cite: { ocrMiss: 0, cites: 0, missRate: 0, zeroAtomCards: 0, unchecked: 0 },
    parse: { emptyPages: 0, sparsePages: 0, weak: 0, unchecked: 0 },
    dark: { darkCount: 0, substantialPages: 0, darkRate: 0, unchecked: 0 },
    shallow: { shallowCount: 0, substantialPages: 0, shallowRate: 0, unchecked: 0 },
    incompleteAtoms: 0,
  };
  let anyDraft = false;
  const draft: RollupDraft = { draftedCardCount: 0, draftEntryCount: 0 };
  for (const r of rollups) {
    if (rollupIsWeak(r)) f.weakChapters++;
    if (r.cite) {
      f.cite.ocrMiss += r.cite.ocrMiss;
      f.cite.cites += r.cite.cites;
      f.cite.zeroAtomCards += r.cite.zeroAtomCards;
      f.incompleteAtoms += r.incompleteAtoms;
    } else f.cite.unchecked++;
    if (r.parse) {
      f.parse.emptyPages += r.parse.emptyPages;
      f.parse.sparsePages += r.parse.sparsePages;
      if (r.parse.weak) f.parse.weak++;
    } else f.parse.unchecked++;
    if (r.dark) {
      f.dark.darkCount += r.dark.darkCount;
      f.dark.substantialPages += r.dark.substantialPages;
    } else f.dark.unchecked++;
    if (r.shallow) {
      f.shallow.shallowCount += r.shallow.shallowCount;
      f.shallow.substantialPages += r.shallow.substantialPages;
    } else f.shallow.unchecked++;
    if (r.draft) {
      anyDraft = true;
      draft.draftedCardCount += r.draft.draftedCardCount;
      draft.draftEntryCount += r.draft.draftEntryCount;
    }
  }
  f.cite.missRate = f.cite.cites > 0 ? f.cite.ocrMiss / f.cite.cites : 0;
  f.dark.darkRate = f.dark.substantialPages > 0 ? f.dark.darkCount / f.dark.substantialPages : 0;
  f.shallow.shallowRate =
    f.shallow.substantialPages > 0 ? f.shallow.shallowCount / f.shallow.substantialPages : 0;
  if (anyDraft) f.draft = draft;
  return f;
}

/**
 * 弱章可复制 CLI 命令（F）：按弱信号给对应既有 check 命令 + 恒带 qa-check 孪生。
 * 只给**只读机检**命令（cite/parse/page/density/qa-check）——不给「一键重抽写回」。
 */
export function rollupCliCommands(r: ChapterQualityRollup): { label: string; command: string }[] {
  const f = rollupWeakFlags(r);
  const out: { label: string; command: string }[] = [];
  if (f.cite || f.incomplete) {
    out.push({ label: "OCR 未见 / 不完备逐条明细", command: `pnpm cite-check -- --misses ${r.chapterId}` });
  }
  if (f.parse) out.push({ label: "空页 / 稀页明细", command: `pnpm parse-check -- --sparse ${r.chapterId}` });
  if (f.dark) out.push({ label: "暗页明细", command: `pnpm page-check -- --dark ${r.chapterId}` });
  if (f.shallow) out.push({ label: "浅页明细", command: `pnpm density-check -- --shallow ${r.chapterId}` });
  out.push({ label: "六信号汇总（写 data/qa 报告，非 seed）", command: `pnpm qa-check -- ${r.chapterId}` });
  return out;
}
