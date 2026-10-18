"use client";

import type { PageDoc } from "@/lib/entities";

/**
 * 章页 OCR 阅读器（DeskShell 中栏内）：
 * 数据来自 loadAllChapterPages() 按书过滤的真印刷页；选章 → 该章页码范围；上/下页。
 * 禁止编造段落——正文只有 OCR 原文。
 */
export default function ChapterPageReader({
  pages,
  chapters,
  chapterId,
  pageNo,
  onChapterChange,
  onPageChange,
}: {
  /** 当前书全部印刷页（page != null，带 chapterId）。 */
  pages: PageDoc[];
  /** 当前书章节（config/chapter.json 派生）。 */
  chapters: { id: string; title: string }[];
  chapterId: string;
  pageNo: number | null;
  onChapterChange: (chapterId: string, pageNo: number | null) => void;
  onPageChange: (pageNo: number) => void;
}) {
  const chPages = pages
    .filter((p) => p.chapterId === chapterId && p.page != null)
    .sort((a, b) => (a.page ?? 0) - (b.page ?? 0));
  const idx = chPages.findIndex((p) => p.page === pageNo);
  const pg = idx >= 0 ? chPages[idx] : chPages[0];
  const prev = idx > 0 ? chPages[idx - 1] : undefined;
  const next = idx >= 0 && idx < chPages.length - 1 ? chPages[idx + 1] : undefined;

  function switchChapter(id: string) {
    const first = pages
      .filter((p) => p.chapterId === id && p.page != null)
      .sort((a, b) => (a.page ?? 0) - (b.page ?? 0))[0];
    onChapterChange(id, first?.page ?? null);
  }

  return (
    <section aria-label="章页阅读">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-muted">章页（OCR 原文）</h2>
        <label className="flex items-baseline gap-2 text-sm text-muted">
          章节
          <select
            value={chapterId}
            onChange={(e) => switchChapter(e.target.value)}
            className="rounded-lg border border-line bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-cinnabar"
          >
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} · {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!pg ? (
        <p className="mt-4 text-sm text-muted">这一章还没有解析出的印刷页。</p>
      ) : (
        <>
          <header className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-xl font-bold">
              印刷页 p.{pg.page}
              <span className="ml-3 text-sm font-normal text-muted">
                PDF 物理页 {pg.physicalPage} · {pg.chapterId}
              </span>
            </h3>
            <nav className="flex gap-3 text-sm" aria-label="翻页">
              {prev ? (
                <button
                  onClick={() => onPageChange(prev.page as number)}
                  className="text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                >
                  ← p.{prev.page}
                </button>
              ) : null}
              <span className="text-muted">
                {idx >= 0 ? idx + 1 : 0}/{chPages.length} 页
              </span>
              {next ? (
                <button
                  onClick={() => onPageChange(next.page as number)}
                  className="text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                >
                  p.{next.page} →
                </button>
              ) : null}
            </nav>
          </header>
          <article className="mt-4 whitespace-pre-wrap rounded-lg border border-line bg-card p-6 text-[15px] leading-9">
            {pg.text}
          </article>
        </>
      )}
    </section>
  );
}