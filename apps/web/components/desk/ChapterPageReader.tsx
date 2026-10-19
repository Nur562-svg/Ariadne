"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PageCitingCard, PageDoc } from "@/lib/entities";
import CitePeek from "@/components/CitePeek";
import PageCardRailMarks from "@/components/desk/PageCardRailMarks";
import SessionKeyHint from "@/components/SessionKeyHint";
import { isEditableTarget } from "@/lib/keyboard";
import { saveReturn } from "@/lib/return-stack";

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

/** 邻章扫描结果：章 id + 落点页（上一章取末页，下一章取首页）。 */
type NeighborChapter = { id: string; title: string; page: number };

/**
 * 章页 OCR 阅读器（DeskShell 中栏内）：
 * 数据来自 loadAllChapterPages() 按书过滤的真印刷页；选章 → 该章页码范围；上/下页。
 * 禁止编造段落——正文只有 OCR 原文。
 * desk-page-card-loop（T15）：正文下加「本页相关实体卡」次级扫视轨（页 → 卡闭环），
 * 轨顶「核本页」入口 /review?book=&page=；翻页时 DocumentPane 按 pageNo 换轨内容。
 * paper-rail-progress-port（T24 A/B）：
 * - 章/页/翻页收进 sticky 实底工具带（bg-card + border-b，与 T21 study/review 工具带同族），
 *   长 OCR 滚动时页铬仍在；T18 ←/→ 键盘翻页与可编辑目标静默逻辑不变。
 * - 卡轨每卡在「练」旁补薄「核」链 /review?card=&book=，出发写 T23 return 短链；
 * - 每卡挂 PageCardRailMarks 本机练/核薄计数；命中摘要最多 2 条（CitePeek 旁路不变）。
 * paper-jump-crosslink（T26 A/B/D）：
 * - sticky 章芯片行扫视（当前章朱红 + aria-current）替代原生 select；薄跳页输入按本书
 *   pages 精确命中印刷页（跨章合法），未命中琥珀提示且不动当前页——不编造页。
 * - ←/→ 章界自动跨章（末页→上一章末页 / 首页→下一章首页，跳过无 OCR 页的章）；
 *   [ / ] 显式切章；g 或 / 聚焦跳页输入（Esc 失焦）；底栏 SessionKeyHint 与练/核同族。
 * - 无页章诚实：主 CTA「下一有页章 →」（前向扫描，无则后向次级）+ 次级「回概览」。
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
  onOpenOverview,
  variant = "full",
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
  /** 无页章次级「回概览」：DocumentPane 切回概览段（可选，避免组件耦合段状态）。 */
  onOpenOverview?: () => void;
  /** sticky 工具带贴合方式：full = 章页整宽模式（吃掉中栏 px-8）；column = 分栏右列（吃掉 pl-6）。 */
  variant?: "full" | "column";
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

  /** 薄跳页（T26 A）：输入印刷页号；未命中琥珀提示，不改当前页。 */
  const [jumpDraft, setJumpDraft] = useState("");
  const [jumpError, setJumpError] = useState<string | null>(null);
  const jumpInputRef = useRef<HTMLInputElement | null>(null);

  /** 章切换（芯片 / COP / 邻章）清掉跳页琥珀错，避免跨章残留。 */
  useEffect(() => {
    setJumpError(null);
  }, [chapterId]);

  /** 出发进练/核前写 return 短链（回当前书桌章页，带印刷页）。 */
  const deskReturnHref =
    bookId && curPage != null
      ? `/desk?book=${encodeURIComponent(bookId)}&page=${curPage}`
      : bookId
        ? `/desk?book=${encodeURIComponent(bookId)}`
        : "/desk";
  function rememberDeskReturn() {
    saveReturn({
      href: deskReturnHref,
      label: curPage != null ? `书桌 p.${curPage}` : "书桌",
      at: Date.now(),
    });
  }

  function switchChapter(id: string) {
    setJumpError(null);
    const first = pages
      .filter((p) => p.chapterId === id && p.page != null)
      .sort((a, b) => (a.page ?? 0) - (b.page ?? 0))[0];
    onChapterChange(id, first?.page ?? null);
  }

  /** 章首页 / 章末页（按本书 pages 真数据；无页章返回 null）。 */
  function firstPageOf(chId: string): number | null {
    const p = pages
      .filter((x) => x.chapterId === chId && x.page != null)
      .sort((a, b) => (a.page ?? 0) - (b.page ?? 0))[0];
    return p?.page ?? null;
  }
  function lastPageOf(chId: string): number | null {
    const arr = pages
      .filter((x) => x.chapterId === chId && x.page != null)
      .sort((a, b) => (a.page ?? 0) - (b.page ?? 0));
    return arr.length > 0 ? (arr[arr.length - 1].page as number) : null;
  }

  /**
   * 邻章扫描：从当前章向前/向后找最近一个「有 OCR 页」的章（跳过无页章——
   * 落到无页章只会再撞空态）。前向取首页，后向取末页。
   */
  const chIndex = chapters.findIndex((c) => c.id === chapterId);
  const prevReadable: NeighborChapter | null = (() => {
    for (let i = chIndex - 1; i >= 0; i--) {
      const last = lastPageOf(chapters[i].id);
      if (last != null) return { id: chapters[i].id, title: chapters[i].title, page: last };
    }
    return null;
  })();
  const nextReadable: NeighborChapter | null = (() => {
    for (let i = chIndex + 1; i < chapters.length; i++) {
      const first = firstPageOf(chapters[i].id);
      if (first != null) return { id: chapters[i].id, title: chapters[i].title, page: first };
    }
    return null;
  })();

  /** 跳页提交：按本书 pages 精确找 page==N；命中跨章落位，未命中琥珀不动位。 */
  function submitJump(e: React.FormEvent) {
    e.preventDefault();
    const raw = jumpDraft.trim();
    const n = /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (Number.isNaN(n) || n <= 0) {
      setJumpError("页码需为正整数");
      return;
    }
    const hit = pages.find((p) => p.page === n);
    if (!hit || hit.page == null) {
      setJumpError(`本书 OCR 无 p.${n}`);
      return;
    }
    setJumpError(null);
    setJumpDraft("");
    onChapterChange(hit.chapterId ?? chapterId, hit.page);
    onPageChange(hit.page);
  }

  /** 可编辑目标静默（输入框/文本域/下拉/富文本不拦截键盘）。 */
  function silentKeyTarget(target: EventTarget | null): boolean {
    return isEditableTarget(target);
  }

  /**
   * 键盘翻页与跳章（T18 基础 + T26 B）：
   * ←/→ 章内翻页；章界自动跨章（← 上一有页章末页 / → 下一有页章首页；全书尽头 no-op）；
   * [ / ] 显式切章（上章末 / 下章首，同样跳过无页章）；g 或 / 聚焦跳页输入（preventScroll）。
   * 可编辑目标静默不变；跳页输入自身的 Esc 失焦在输入 onKeyDown 上处理。
   */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (silentKeyTarget(e.target)) return;
      if (e.key === "ArrowLeft") {
        if (prev) {
          e.preventDefault();
          onPageChange(prev.page as number);
        } else if (prevReadable) {
          e.preventDefault();
          onChapterChange(prevReadable.id, prevReadable.page);
        }
      } else if (e.key === "ArrowRight") {
        if (next) {
          e.preventDefault();
          onPageChange(next.page as number);
        } else if (nextReadable) {
          e.preventDefault();
          onChapterChange(nextReadable.id, nextReadable.page);
        }
      } else if (e.key === "[") {
        if (prevReadable) {
          e.preventDefault();
          onChapterChange(prevReadable.id, prevReadable.page);
        }
      } else if (e.key === "]") {
        if (nextReadable) {
          e.preventDefault();
          onChapterChange(nextReadable.id, nextReadable.page);
        }
      } else if (e.key === "g" || e.key === "/") {
        // g// 聚焦跳页输入（/ 须拦截，避免宿主快速查找）；输入内再按由 isEditableTarget 静默。
        e.preventDefault();
        jumpInputRef.current?.focus({ preventScroll: true });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    prev?.page,
    next?.page,
    prevReadable?.id,
    prevReadable?.page,
    nextReadable?.id,
    nextReadable?.page,
    onPageChange,
    onChapterChange,
  ]);

  return (
    <section aria-label="章页阅读">
      {/* T24 A：sticky 页铬（实底 bg-card + border-b，与 T21 study/review 工具带同族，不做第三套 chrome）。
          full 模式吃掉中栏 px-8 撑满整宽；column 模式吃掉分栏右列 pl-6。长 OCR 滚动时章/页/翻页仍在。
          T26 A：章控件区 = 可点章芯片行（扫视优先，select 退役）；右侧薄跳页输入贴同一页铬。 */}
      <div
        className={`sticky top-0 z-10 border-b border-line bg-card py-3 ${
          variant === "column" ? "-ml-6 pl-6 pr-1" : "-mx-8 px-8"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 className="text-sm font-semibold text-muted">章页（OCR 原文）</h2>
          {pages.length > 0 ? (
            <form
              onSubmit={submitJump}
              aria-label="跳到印刷页"
              className="flex items-center gap-1.5"
            >
              <input
                ref={jumpInputRef}
                value={jumpDraft}
                onChange={(e) => setJumpDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") e.currentTarget.blur();
                }}
                inputMode="numeric"
                placeholder="页号"
                aria-label="印刷页号（回车跳页）"
                aria-keyshortcuts="g"
                className="w-14 rounded-lg border border-line bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-cinnabar"
              />
              <button
                type="submit"
                className="rounded-lg border border-line px-2 py-1 text-xs text-muted transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
              >
                跳
              </button>
              {jumpError ? (
                <span role="status" className="text-xs text-status-warn">
                  {jumpError}
                </span>
              ) : null}
            </form>
          ) : null}
        </div>
        {/* 章芯片行（对齐 study/review 档位芯片同族：圆角 pill + 当前朱红 soft）；章多允许 wrap。 */}
        {chapters.length > 0 ? (
          <nav aria-label="切换章节" className="mt-2 flex flex-wrap items-center gap-1.5">
            {chapters.map((c) => {
              const isCur = c.id === chapterId;
              return (
                <button
                  key={c.id}
                  onClick={() => switchChapter(c.id)}
                  aria-current={isCur ? "page" : undefined}
                  title={`${c.id} · ${c.title}`}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                    isCur
                      ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                      : "border-line text-muted hover:border-cinnabar hover:text-cinnabar"
                  }`}
                >
                  {c.id}
                </button>
              );
            })}
          </nav>
        ) : null}
        {pg ? (
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-base font-bold">
              印刷页 p.{pg.page}
              <span className="ml-3 text-xs font-normal text-muted">
                PDF 物理页 {pg.physicalPage} · {pg.chapterId}
              </span>
            </h3>
            <nav
              className="flex items-baseline gap-3 text-sm"
              aria-label="翻页"
              title="键盘：←/→ 翻页（章界自动跨章）· [ ] 切章 · g 跳页"
            >
              {prev ? (
                <button
                  onClick={() => onPageChange(prev.page as number)}
                  aria-keyshortcuts="ArrowLeft"
                  className="text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                >
                  ← p.{prev.page}
                </button>
              ) : prevReadable ? (
                <button
                  onClick={() => onChapterChange(prevReadable.id, prevReadable.page)}
                  aria-keyshortcuts="ArrowLeft"
                  title={`上一章 ${prevReadable.id} 末页 p.${prevReadable.page}`}
                  className="text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                >
                  ← {prevReadable.id} p.{prevReadable.page}
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
              ) : nextReadable ? (
                <button
                  onClick={() => onChapterChange(nextReadable.id, nextReadable.page)}
                  aria-keyshortcuts="ArrowRight"
                  title={`下一章 ${nextReadable.id} 首页 p.${nextReadable.page}`}
                  className="text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                >
                  {nextReadable.id} p.{nextReadable.page} →
                </button>
              ) : null}
            </nav>
          </div>
        ) : null}
        {/* T26 B：纸面键说明（与练/核 SessionKeyHint 同族：muted 小字 + mono 键帽）。 */}
        {pg ? (
          <SessionKeyHint
            className="mt-2"
            keys={[
              ["←→", "翻页"],
              ["[ ]", "切章"],
              ["g", "跳页"],
            ]}
          />
        ) : null}
      </div>

      {!pg ? (
        <div className="mt-4">
          <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
            这一章（{chapterId}）还没有解析出的印刷页——OCR 未覆盖或解析未完成，
            纸面暂读不了；先去别的章，或回概览看各章卡数。
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {nextReadable ? (
              <button
                onClick={() => switchChapter(nextReadable.id)}
                title={`下一章 ${nextReadable.id} · ${nextReadable.title}（首页 p.${nextReadable.page}）`}
                className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline transition-opacity hover:opacity-90 motion-reduce:transition-none"
              >
                下一有页章 {nextReadable.id} →
              </button>
            ) : prevReadable ? (
              /* 前向无页、后向有：同一颗主 CTA，标签如实说「上一」。 */
              <button
                onClick={() => switchChapter(prevReadable.id)}
                title={`上一章 ${prevReadable.id} · ${prevReadable.title}（末页 p.${prevReadable.page}）`}
                className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline transition-opacity hover:opacity-90 motion-reduce:transition-none"
              >
                上一有页章 {prevReadable.id} →
              </button>
            ) : (
              <span className="text-sm text-muted">本书目前没有任何章解析出印刷页。</span>
            )}
            {onOpenOverview ? (
              <button
                onClick={onOpenOverview}
                className="text-sm text-muted no-underline transition-colors hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
              >
                回概览 →
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <article className="mt-4 whitespace-pre-wrap rounded-lg border border-line bg-card p-6 text-[15px] leading-9">
          {pg.text}
        </article>
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
                  onClick={rememberDeskReturn}
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
            <>
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
                          onClick={rememberDeskReturn}
                          className="ml-2 text-xs text-cinnabar no-underline hover:underline underline-offset-4"
                        >
                          练
                        </Link>
                      ) : null}
                      {bookId ? (
                        <Link
                          href={`/review?card=${encodeURIComponent(c.cardId)}&book=${encodeURIComponent(bookId)}`}
                          onClick={rememberDeskReturn}
                          className="ml-2 text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                          title={`核《${c.nameZh}》的 cite`}
                        >
                          核
                        </Link>
                      ) : null}
                      {/* T24 B：本机练/核薄计数（只读 study/heye 桶；无掌握% / 色环 / Due）。 */}
                      <PageCardRailMarks cardId={c.cardId} atomCount={c.atomCount} />
                      {c.hits.slice(0, 2).map((h, i) => (
                        <div key={`${h.source}:${h.label}:${i}`} className="mt-0.5 flex items-center gap-1">
                          <span className="min-w-0 truncate text-xs text-muted">
                            {hitSummary(h)}
                          </span>
                          {/* T19：轨上 Peek——cite 由 hit 原样字段构造（page/verified 不编造）。 */}
                          <CitePeek
                            cite={{
                              page: h.page,
                              quote: h.quote,
                              verified: h.verified,
                            }}
                            deskBookId={bookId}
                            cardId={c.cardId}
                          />
                        </div>
                      ))}
                    </div>
                    <span className="mono shrink-0 text-[11px] text-muted">
                      {KIND_ZH[c.kind] ?? c.kind}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-5 text-muted">
                「摘」可浮层看 quote 与抽查状态；「核」进核本卡、「核本页」逐条对本印刷页；练/核计数仅本浏览器记录。
              </p>
            </>
          )}
        </section>
      ) : null}
    </section>
  );
}
