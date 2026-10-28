/**
 * T87 机械抽出：原 lib/chapter-quality-rollup.ts helpers 分区（RollupWeakFlags /
 * rollupWeakFlags · rollupIsWeak · rollupAllUnchecked · RollupFold / foldChapterRollups ·
 * rollupCliCommands）整段迁此——draft 不计弱、未检不抬假阳、fold 按合计重算率不平均
 * 各章率、CLI 只给只读机检命令，行为零改。
 * ChapterQualityRollup / RollupDraft 自 types。
 * 无 "use client" / 无 fs / 无 process.env / 无 Date / 无网络 / 无 LLM。
 * 铁合同 header 与消费者入口仍在 @/lib/chapter-quality-rollup（barrel）。
 */

import type { ChapterQualityRollup, RollupDraft } from "./chapter-quality-rollup-types.ts";

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
