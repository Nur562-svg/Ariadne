/**
 * T87 机械抽出：原 lib/chapter-quality-rollup.ts build 分区（私有 uniqueCardIds ·
 * buildChapterQualityRollup）整段迁此——只拼装零重算：传 null 保留未检、citeMiss 去重
 * 上限、samplePages slice 上限，拼装口径零改。
 * 常量与类型自 types；跨 lib 仅 type-only（CiteQuality / ParseCoverage /
 * ExtractPageCoverage / ExtractPageDensity）。
 * 无 "use client" / 无 fs / 无 process.env / 无 Date / 无网络 / 无 LLM。
 * 铁合同 header 与消费者入口仍在 @/lib/chapter-quality-rollup（barrel）。
 */

import type { CiteQuality } from "@/lib/cite-ocr-quality";
import type { ParseCoverage } from "@/lib/parse-ocr-coverage";
import type { ExtractPageCoverage } from "@/lib/extract-page-coverage";
import type { ExtractPageDensity } from "@/lib/extract-page-density";
import {
  ROLLUP_MISS_CARD_SAMPLE,
  ROLLUP_PAGE_SAMPLE,
  type ChapterQualityRollup,
} from "./chapter-quality-rollup-types.ts";

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
