import type { PageCitingCard, PageDoc } from "@/lib/entities";

/**
 * T76 机械抽出：原 ChapterPageReader.tsx 模块层常量/纯函数（KIND_ZH / hitSummary /
 * NeighborChapter / pagesByChapter 索引 / firstPageOf / lastPageOf / 邻章扫描 /
 * readerValidPages flatMap）整段迁此——函数体零改（闭包参用的 pagesByChapter/chapters
 * 显式化为参数），仅换文件。ChapterPageReader / ChapterPageStickyChrome /
 * ChapterPageCardRail 共用同一份，不出现第二套章索引或邻章口径。
 */

export const KIND_ZH: Record<string, string> = {
  concept: "概念",
  structure: "结构",
  process: "过程",
  molecule: "分子",
  pathogen: "病原",
  cell: "细胞",
  disease: "疾病",
};

/** 命中短摘（来源标签 + quote 截断），保证卡轨扫视密度，不堆长引文。 */
export function hitSummary(h: PageCitingCard["hits"][number]): string {
  const q = (h.quote ?? "").replace(/\s+/g, " ").trim();
  const tail = q ? ` · “${q.length > 34 ? `${q.slice(0, 34)}…` : q}”` : "";
  return `${h.label}${tail}`;
}

/** 邻章扫描结果：章 id + 落点页（上一章取末页，下一章取首页）。 */
export type NeighborChapter = { id: string; title: string; page: number };

/**
 * 章内页索引（review-fix-integrity G4）：全书 pages 的 filter+sort 收进一处，
 * 按 chapterId 建索引——chPages / 章首页末页 / 邻章扫描全走 Map，
 * 跳页输入每敲一键、翻页重渲染不再 O(章×页) 重复排序。
 */
export function buildPagesByChapter(pages: PageDoc[]): Map<string, PageDoc[]> {
  const m = new Map<string, PageDoc[]>();
  for (const p of pages) {
    if (p.page == null || p.chapterId == null) continue;
    const arr = m.get(p.chapterId);
    if (arr) arr.push(p);
    else m.set(p.chapterId, [p]);
  }
  for (const arr of m.values()) arr.sort((a, b) => (a.page ?? 0) - (b.page ?? 0));
  return m;
}

/** 本书已解析印刷页表（轨上 CitePeek / CiteChip「在书桌打开」的鬼页门禁用）。 */
export function validPagesOf(pages: PageDoc[]): number[] {
  return pages.flatMap((p) => (p.page != null ? [p.page as number] : []));
}

/** 章首页（按索引 O(1)；无页章返回 null）。 */
export function firstPageOf(pagesByChapter: Map<string, PageDoc[]>, chId: string): number | null {
  return pagesByChapter.get(chId)?.[0]?.page ?? null;
}

/** 章末页（按索引 O(1)；无页章返回 null）。 */
export function lastPageOf(pagesByChapter: Map<string, PageDoc[]>, chId: string): number | null {
  const arr = pagesByChapter.get(chId);
  return arr != null && arr.length > 0 ? (arr[arr.length - 1].page as number) : null;
}

/**
 * 邻章扫描（后向）：从当前章向前找最近一个「有 OCR 页」的章（跳过无页章——
 * 落到无页章只会再撞空态）。后向取末页。
 */
export function findPrevReadable(
  chapters: { id: string; title: string }[],
  pagesByChapter: Map<string, PageDoc[]>,
  chIndex: number,
): NeighborChapter | null {
  for (let i = chIndex - 1; i >= 0; i--) {
    const last = lastPageOf(pagesByChapter, chapters[i].id);
    if (last != null) return { id: chapters[i].id, title: chapters[i].title, page: last };
  }
  return null;
}

/** 邻章扫描（前向）：从当前章向后找最近一个「有 OCR 页」的章，取首页。 */
export function findNextReadable(
  chapters: { id: string; title: string }[],
  pagesByChapter: Map<string, PageDoc[]>,
  chIndex: number,
): NeighborChapter | null {
  for (let i = chIndex + 1; i < chapters.length; i++) {
    const first = firstPageOf(pagesByChapter, chapters[i].id);
    if (first != null) return { id: chapters[i].id, title: chapters[i].title, page: first };
  }
  return null;
}
