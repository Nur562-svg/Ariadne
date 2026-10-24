/**
 * T58 A：fs 版可考覆盖装配（**server 专用**——含 node:fs 间接依赖，勿从 client 组件
 * import；client 用纯函数版 @/lib/examinable-coverage）。**消费** T57
 * loadExtractPageCoverage / collectCitedPages（勿重写暗页算法）。
 *
 * 只读：绝不写 entities / blocks / verified；不改 deriveMaterialStage。
 */
import { loadAllChapterPages, loadCards } from "@/lib/entities";
import { loadExtractPageCoverage } from "@/lib/extract-page-coverage-server";
import { collectCitedPages } from "@/lib/extract-page-coverage";
import {
  foldExaminableCoverages,
  pageExaminableHint,
  type ExaminableCoverage,
  type PageExaminableHint,
} from "@/lib/examinable-coverage";

/**
 * scope 可考覆盖：逐章 loadExtractPageCoverage（缺 blocks/entities 章＝未检如实跳过）
 * → fold；整 scope 全未检 → null（不装 examinableRate 完美）。数字与 T57 pnpm
 * page-check 同源同真（已cite/实质/暗页合计零漂移）。
 */
export function scopeExaminableCoverage(chapterIds: string[]): ExaminableCoverage | null {
  return foldExaminableCoverages(chapterIds.map((id) => loadExtractPageCoverage(id)));
}

/**
 * 单页可考性（study orphan 分型 / HeYe orphan 旁挂用）：按印刷页反查 OCR 页与其所在章，
 * 章内 cards 的 cite 并集为 citedSet → pageExaminableHint。章未抽出（无卡）或页不在
 * OCR（ghost）→ hint 'unchecked'（未检不点名暗，不装满暗假象）。返回 chars 供正文
 * 点名「实质 N 字」。
 */
export function loadPageExaminable(
  pageNum: number | null,
): { hint: PageExaminableHint; chars: number } | null {
  if (pageNum == null) return null;
  const pg = loadAllChapterPages().find((p) => p.page === pageNum);
  if (!pg || pg.chapterId == null) return null; // ghost 页：未检
  const chars = (pg.text ?? "").trim().length;
  const chCards = loadCards({ chapterId: pg.chapterId });
  if (chCards.length === 0) return { hint: "unchecked", chars }; // 章未抽出：未检
  const citedSet = collectCitedPages(chCards);
  return {
    hint: pageExaminableHint({ page: pg.page, pageText: pg.text, citedSet }),
    chars,
  };
}
