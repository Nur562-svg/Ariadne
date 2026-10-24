/**
 * T58 A + T60 A：fs 版可考覆盖装配（**server 专用**——含 node:fs 间接依赖，勿从 client
 * 组件 import；client 用纯函数版 @/lib/examinable-coverage）。**消费** T57
 * loadExtractPageCoverage / collectCitedPages + T59 loadExtractPageDensity /
 * collectAtomCountByPage（勿重写暗/浅算法，勿漂移 SHALLOW_* 常量）。
 *
 * 只读：绝不写 entities / blocks / verified；不改 deriveMaterialStage。
 */
import { loadAllChapterPages, loadCards } from "@/lib/entities";
import { loadExtractPageCoverage } from "@/lib/extract-page-coverage-server";
import { collectCitedPages } from "@/lib/extract-page-coverage";
import { loadExtractPageDensity } from "@/lib/extract-page-density-server";
import { collectAtomCountByPage } from "@/lib/extract-page-density";
import {
  foldExaminableCoverages,
  pageExaminableHint,
  type ExaminableCoverage,
  type PageExaminableHint,
} from "@/lib/examinable-coverage";

/**
 * scope 可考覆盖：逐章 loadExtractPageCoverage + loadExtractPageDensity（缺
 * blocks/entities 章＝未检如实跳过；缺 density 章浅未检跳过，勿装 0 完美）→ fold；
 * 整 scope 全未检 → null（不装 examinableRate 完美）。数字与 T57 pnpm page-check /
 * T59 pnpm density-check 同源同真（已cite/实质/暗/浅合计零漂移）。
 */
export function scopeExaminableCoverage(chapterIds: string[]): ExaminableCoverage | null {
  return foldExaminableCoverages(
    chapterIds.map((id) => ({
      coverage: loadExtractPageCoverage(id),
      density: loadExtractPageDensity(id),
    })),
  );
}

/**
 * 单页可考性（study orphan 分型 / 本页浅旁挂 / HeYe 旁挂用）：按印刷页反查 OCR 页与
 * 其所在章，章内 cards 的 cite 并集为 citedSet、atoms[].cite.page 计数为
 * atomCountByPage（collectAtomCountByPage——浅判定与 density-check 同口径，勿用 card
 * cites 膨胀）→ pageExaminableHint（sparse > dark > shallow > ok）。章未抽出（无卡）或
 * 页不在 OCR（ghost）→ hint 'unchecked'（未检不点名暗，不装满暗假象）。返回 chars /
 * atomCount 供正文点名「实质 N 字 · M 原子」（atomCount 只计 atoms[].cite.page）。
 */
export function loadPageExaminable(
  pageNum: number | null,
): { hint: PageExaminableHint; chars: number; atomCount: number } | null {
  if (pageNum == null) return null;
  const pg = loadAllChapterPages().find((p) => p.page === pageNum);
  if (!pg || pg.page == null || pg.chapterId == null) return null; // ghost 页：未检
  const chars = (pg.text ?? "").trim().length;
  const chCards = loadCards({ chapterId: pg.chapterId });
  if (chCards.length === 0) return { hint: "unchecked", chars, atomCount: 0 }; // 章未抽出：未检
  const citedSet = collectCitedPages(chCards);
  const atomCountByPage = collectAtomCountByPage(chCards);
  return {
    hint: pageExaminableHint({ page: pg.page, pageText: pg.text, citedSet, atomCountByPage }),
    chars,
    atomCount: atomCountByPage.get(pg.page) ?? 0,
  };
}
