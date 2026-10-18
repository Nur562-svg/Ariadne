"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { PageCitingCard, PageDoc } from "@/lib/entities";
import { isEditableTarget } from "@/lib/keyboard";

const KIND_ZH: Record<string, string> = {
  concept: "概念",
  structure: "结构",
  process: "过程",
  molecule: "分子",
  pathogen: "病原",
  cell: "细胞",
  disease: "疾病",
};

/** 命中短摘（来源标签 + quote 截断），保证卡轨扫视密度，不堆长引文。 */
function hitSummary(h: PageCitingCard["hits"][number]): string {
  const q = (h.quote ?? "").replace(/\s+/g, " ").trim();
  const tail = q ? ` · “${q.length > 34 ? `${q.slice(0, 34)}…` : q}”` : "";
  return `${h.label}${tail}`;
}

/**
 * 章页 OCR 阅读器（DeskShell 中栏内）：
 * 数据来自 loadAllChapterPages() 按书过滤的真印刷页；选章 → 该章页码范围；上/下页。
 * 禁止编造段落——正文只有 OCR 原文。
 * desk-page-card-loop（T15）：正文下加「本页相关实体卡」次级扫视轨（页 → 卡闭环），
 * 轨顶「核本页」入口 /review?book=&page=；翻页时 DocumentPane 按 pageNo 换轨内容。
 */
export default function ChapterPageReader({
  pages,
  chapters,
  chapterId,
  pageNo,
  onChapterChange,
  onPageChange,
  bookId,
  citingCards,
  pendingPageCount,
}: {
  /** 当前书全部印刷页（page != null，带 chapterId）。 */
  pages: PageDoc[];
  /** 当前书章节（config/chapter.json 派生）。 */
  chapters: { id: string; title: string }[];
  chapterId: string;
  pageNo: number | null;
  onChapterChange: (chapterId: string, pageNo: number | null) => void;
  onPageChange: (pageNo: number) => void;
  /** 当前书 id：「练」「核本页」深链携带 book=。 */
  bookId?: string;
  /** 当前印刷页引用到的实体卡（服务端 cardsCitingPage 索引；随 pageNo 传入）。 */
  citingCards?: PageCitingCard[];
  /** 当前印刷页的待核 cite 数（0 → 「核本页」诚实禁用）。 */
  pendingPageCount?: number;
}) {
  const chPages = pages
    .filter((p) => p.chapterId === chapterId && p.page != null)
    .sort((a, b) => (a.page ?? 0) - (b.page ?? 0));
  const idx = chPages.findIndex((p) => p.page === pageNo);
  const pg = idx >= 0 ? chPages[idx] : chPages[0];
  const prev = idx > 0 ? chPages[idx - 1] : undefined;
  const next = idx >= 0 && idx < chPages.length - 1 ? chPages[idx + 1] : undefined;
  const curPage = pg?.page ?? null;
  const reviewPageHref =
    bookId && curPage != null
      ? `/review?book=${encodeURIComponent(bookId)}&page=${curPage}`
      : undefined;

  function switchChapter(id: string) {
    const first = pages
      .filter((p) => p.chapterId === id && p.page != null)
      .sort((a, b) => (a.page ?? 0) - (b.page ?? 0))[0];
    onChapterChange(id, first?.page ?? null);
  }

  /** 可编辑目标静默（输入框/文本域/下拉/富文本不拦截键盘）。 */
  function silentKeyTarget(target: EventTarget | null): boolean {
    return isEditableTarget(target);
  }

  /** 键盘翻页（T18）：← 上一页 · → 下一页；无 prev/next 时忽略。 */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (silentKeyTarget(e.target)) return;
      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        onPageChange(prev.page as number);
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        onPageChange(next.page as number);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prev?.page, next?.page, onPageChange]);

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
            <nav className="flex gap-3 text-sm" aria-label="翻页" title="键盘：←/→ 翻页">
              {prev ? (
                <button
                  onClick={() => onPageChange(prev.page as number)}
                  aria-keyshortcuts="ArrowLeft"
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
                  aria-keyshortcuts="ArrowRight"
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

      {/* 本页相关实体卡轨（次级扫视面：页 → 卡 → 枢纽；空态诚实，不造假卡）。 */}
      {pg && citingCards != null ? (
        <section
          aria-label="本页相关实体卡"
          className="mt-6 rounded-lg border border-line bg-card px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h4 className="text-xs font-semibold tracking-wider text-muted">
              本页相关实体卡 · {citingCards.length}
            </h4>
            {reviewPageHref ? (
              pendingPageCount != null && pendingPageCount > 0 ? (
                <Link
                  href={reviewPageHref}
                  className="text-xs text-cinnabar no-underline hover:underline underline-offset-4"
                >
                  核本页（{pendingPageCount}）→
                </Link>
              ) : (
                <span className="text-xs text-muted">本页暂无待核 cite</span>
              )
            ) : null}
          </div>
          {citingCards.length === 0 ? (
            <p className="mt-2 text-xs leading-6 text-muted">
              本页暂无 seed 卡引用本印刷页。
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {citingCards.map((c) => (
                <li
                  key={c.cardId}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-t border-line pt-2 first:border-t-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/desk/card/${encodeURIComponent(c.cardId)}`}
                      className="text-sm font-medium text-foreground no-underline hover:text-cinnabar"
                    >
                      {c.nameZh}
                    </Link>
                    {c.atomCount > 0 && bookId ? (
                      <Link
                        href={`/study?card=${encodeURIComponent(c.cardId)}&book=${encodeURIComponent(bookId)}`}
                        className="ml-2 text-xs text-cinnabar no-underline hover:underline underline-offset-4"
                      >
                        练
                      </Link>
                    ) : null}
                    {c.hits[0] ? (
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {hitSummary(c.hits[0])}
                      </p>
                    ) : null}
                  </div>
                  <span className="mono shrink-0 text-[11px] text-muted">
                    {KIND_ZH[c.kind] ?? c.kind}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </section>
  );
}