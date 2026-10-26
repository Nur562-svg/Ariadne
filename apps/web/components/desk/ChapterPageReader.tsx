"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PageCitingCard, PageDoc } from "@/lib/entities";
import CitePeek from "@/components/CitePeek";
import PageCardRailMarks from "@/components/desk/PageCardRailMarks";
import SessionKeyHint from "@/components/SessionKeyHint";
import { isEditableTarget, isPeekOpen } from "@/lib/keyboard";
import { saveReturn } from "@/lib/return-stack";
import { SPARSE_CHAR_THR } from "@/lib/parse-ocr-coverage";
import { SHALLOW_ATOM_MAX, SHALLOW_CHARS_PER_ATOM } from "@/lib/extract-page-density";

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
  pendingByCard,
  citedPages,
  atomCountByPage,
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
  /**
   * T48 C：cardId → 本书待核 cite 数（DocumentPane 由书级 heyePool 派生，与卡瓷砖「核」/
   * 卡枢纽 collectCiteQueue({cardId}) 同池族）——轨卡级「核」空池门禁：0 → muted 纯文，
   * 不进空 open 池；缺省当 0（fail-closed）。非第二套「待核」定义（非 Due、非本机核页标记）。
   */
  pendingByCard?: Record<string, number>;
  /**
   * T57 H/I：当前章已 cite 印刷页集合（DocumentPane 用 collectCitedPages 从**章内**
   * cards 派生下传——与 pnpm page-check 章口径同真）——当前页 OCR 实质（chars≥
   * SPARSE_CHAR_THR=40）且 ∉ 集合 → 暗页提示一行。缺省（未装配＝章内无卡，未抽出）
   * 不点名；chars<40 只走 T56 稀页提示，不双吵（两条件按 chars 阈值天然互斥）。
   */
  citedPages?: Set<number>;
  /**
   * T59 H/I：当前章页 → 可考原子数表（DocumentPane 用 collectAtomCountByPage 从**章内**
   * cards 派生下传——与 pnpm density-check 章口径同真，只计 atoms[].cite.page）——
   * 当前页 OCR 实质（chars≥SPARSE_CHAR_THR=40）∧ 1≤atomCount≤SHALLOW_ATOM_MAX(2) ∧
   * chars/atomCount≥SHALLOW_CHARS_PER_ATOM(400) → 浅页提示一行。优先序：稀页（T56，
   * chars<40）> 暗页（T57，零 cite）> 浅页（本刀）——atomCount≥1 蕴含已 cite，与暗页
   * 天然互斥不双吵；chars<40 只走 T56 稀页提示。缺省（未装配＝章内无卡）不点名。
   */
  atomCountByPage?: Map<number, number>;
  /** 无页章次级「回概览」：DocumentPane 切回概览段（可选，避免组件耦合段状态）。 */
  onOpenOverview?: () => void;
  /** sticky 工具带贴合方式：full = 章页整宽模式（吃掉中栏 px-8）；column = 分栏右列（吃掉 pl-6）。 */
  variant?: "full" | "column";
}) {
  /**
   * 章内页索引（review-fix-integrity G4）：全书 pages 的 filter+sort 收进 useMemo，
   * 按 chapterId 一处建索引——chPages / 章首页末页 / 邻章扫描全走 Map，
   * 跳页输入每敲一键、翻页重渲染不再 O(章×页) 重复排序。
   */
  const pagesByChapter = useMemo(() => {
    const m = new Map<string, PageDoc[]>();
    for (const p of pages) {
      if (p.page == null || p.chapterId == null) continue;
      const arr = m.get(p.chapterId);
      if (arr) arr.push(p);
      else m.set(p.chapterId, [p]);
    }
    for (const arr of m.values()) arr.sort((a, b) => (a.page ?? 0) - (b.page ?? 0));
    return m;
  }, [pages]);
  const chPages = pagesByChapter.get(chapterId) ?? [];
  const idx = chPages.findIndex((p) => p.page === pageNo);
  const pg = idx >= 0 ? chPages[idx] : chPages[0];
  const prev = idx > 0 ? chPages[idx - 1] : undefined;
  const next = idx >= 0 && idx < chPages.length - 1 ? chPages[idx + 1] : undefined;
  const curPage = pg?.page ?? null;
  /**
   * T35 A：核本页显式 mode=open——「打开可见待核池」入口写出默认档，挡住 StickyModeGate
   * 在无 ?mode= 时把本标签 sticky 的 checked/doubt 空档回补回来（与 DocumentPane
   * stripReviewHref / Shelf 核本页同族）。
   */
  const reviewPageHref =
    bookId && curPage != null
      ? `/review?book=${encodeURIComponent(bookId)}&page=${curPage}&mode=open`
      : undefined;
  /**
   * 练本页（T27 B）：M = 本页 citing 卡 atoms 合计——与 collectStudyAtoms({page}) /
   * DocumentPane pageAtoms 同池同口径（卡/字段/原子 cite 任一命中即整卡入池）。
   * 链接带 book+chapter+page（page 属当前章）；M=0 诚实 muted，不造假链。
   * T28 C：显式 &mode=all（保留 book/chapter/page）——从书桌进练本页不被
   * StickyModeGate restore 成 unknown 空队列，落页即看得见池。
   */
  const pageAtomCount = (citingCards ?? []).reduce((n, c) => n + c.atomCount, 0);
  const studyPageHref =
    bookId && curPage != null
      ? `/study?book=${encodeURIComponent(bookId)}&chapter=${encodeURIComponent(chapterId)}&page=${curPage}&mode=all`
      : undefined;
  /**
   * T53 I：本书已解析印刷页表（props pages 即该书真印刷页全集）——轨上 CitePeek /
   * 内部 CiteChip「在书桌打开」的鬼页门禁（共享 helper；宿主能取到才传，缺省不门禁）。
   */
  const readerValidPages = useMemo(
    () => pages.flatMap((p) => (p.page != null ? [p.page as number] : [])),
    [pages],
  );

  /** 薄跳页（T26 A）：输入印刷页号；未命中琥珀提示，不改当前页。 */
  const [jumpDraft, setJumpDraft] = useState("");
  const [jumpError, setJumpError] = useState<string | null>(null);
  const jumpInputRef = useRef<HTMLInputElement | null>(null);

  /** 章切换（芯片 / COP / 邻章）清掉跳页琥珀错，避免跨章残留。 */
  // T71 DEFER: derived — 非 uSES（UI 派生 reset，留 effect）。
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
    const first = pagesByChapter.get(id)?.[0];
    onChapterChange(id, first?.page ?? null);
  }

  /** 章首页 / 章末页（按索引 O(1)；无页章返回 null）。 */
  function firstPageOf(chId: string): number | null {
    return pagesByChapter.get(chId)?.[0]?.page ?? null;
  }
  function lastPageOf(chId: string): number | null {
    const arr = pagesByChapter.get(chId);
    return arr != null && arr.length > 0 ? (arr[arr.length - 1].page as number) : null;
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
      // 「摘」浮层开着（含卡轨上的 CitePeek）：纸面键让路——不翻页、不切章、不抢跳页焦点
      // （review-fix-integrity E）；关掉浮层即恢复。
      if (isPeekOpen()) return;
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
                aria-keyshortcuts="g /"
                className="w-14 rounded-lg border border-line bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
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
              {/* T56 H：稀页提示——当前页 OCR 正文 trim 后 0 < N < SPARSE_CHAR_THR（40，
                  与 parse-check / 书架徽同一口径）→ 琥珀一行点名；正常页不吵；
                  无 text 走既有缺页分支，不出此提示。 */}
              {(() => {
                const chars = (pg.text ?? "").trim().length;
                if (chars === 0 || chars >= SPARSE_CHAR_THR) return null;
                return (
                  <span
                    title="本页 OCR 正文不足 40 字——常为分隔页/图版页或 OCR 漏扫；pnpm parse-check 可复核"
                    className="ml-2 rounded border border-amber-300 bg-status-warn-bg px-1.5 py-0.5 text-[10px] font-normal text-status-warn"
                  >
                    本页 OCR 偏稀（{chars} 字）
                  </span>
                );
              })()}
            </h3>
            <nav
              className="flex items-baseline gap-3 text-sm"
              aria-label="翻页"
              title="键盘：←/→ 翻页（章界自动跨章）· [ ] 切章 · g / 跳页"
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
        {/* T26 B：纸面键说明（与练/核 SessionKeyHint 同族：muted 小字 + mono 键帽）。
            T43 C：跳页键帽与 onKey 同真——环认 g 与 / 两键都列出，不只写 g。 */}
        {pg ? (
          <SessionKeyHint
            className="mt-2"
            keys={[
              ["←→", "翻页"],
              ["[ ]", "切章"],
              ["g /", "跳页"],
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
        <>
          {/* T57 H：暗页提示——当前页 OCR 实质（chars≥SPARSE_CHAR_THR=40）且不在本书
              citedSet（宿主下传；未装配不点名）→ 琥珀一行；chars<40 只走上方 T56 稀页
              提示（阈值天然互斥，不双吵）；已 cite 页不吵。禁 OCR canvas / CitePeek 改动。
              T59 H：浅页提示（优先序 稀>T56 > 暗>T57 > 浅>本刀）——同一块内先暗后浅：
              暗 = 零 cite（citedSet 判定）；浅 = atomCount≥1（蕴含已 cite，与暗互斥）
              且 1≤atomCount≤2 且 chars/atomCount≥400。atomCount=0∩已 cite（仅卡级/
              字段 cite，无原子）既非暗也非浅，不提示——四概念分列不伪装。 */}
          {pg.page != null &&
            (() => {
              const chars = (pg.text ?? "").trim().length;
              if (chars < SPARSE_CHAR_THR) return null; // 空/稀页归 T56 口径
              if (citedPages != null && !citedPages.has(pg.page)) {
                return (
                  <p className="mt-3 text-xs leading-6 text-status-warn">
                    本页 OCR 实质（{chars} 字）但无抽出 cite · 可能未覆盖进原子（暗页；pnpm page-check 可复核）。
                  </p>
                );
              }
              if (atomCountByPage == null) return null; // 未装配（章内无卡）不点名
              const atomCount = atomCountByPage.get(pg.page) ?? 0;
              if (atomCount < 1 || atomCount > SHALLOW_ATOM_MAX) return null;
              if (chars / atomCount < SHALLOW_CHARS_PER_ATOM) return null;
              return (
                <p className="mt-3 text-xs leading-6 text-status-warn">
                  本页已抽出但原子偏稀（{atomCount} 原子 · {chars} 字）· 可考密度不足（pnpm density-check 可复核）。
                </p>
              );
            })()}
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
            <span className="flex flex-wrap items-baseline gap-3">
              {/* T27 B：练本页对称核本页（同族次级文字链；出发写 return 与核本页一致）。 */}
              {studyPageHref && citingCards.length > 0 ? (
                pageAtomCount > 0 ? (
                  <Link
                    href={studyPageHref}
                    onClick={rememberDeskReturn}
                    className="text-xs text-cinnabar no-underline hover:underline underline-offset-4"
                  >
                    练本页（{pageAtomCount}）→
                  </Link>
                ) : (
                  <span className="text-xs text-muted">本页暂无可练原子</span>
                )
              ) : null}
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
            </span>
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
                      {/* T42 A：轨行卡名开卡点前 rememberDeskReturn——与同轨「练」「核」/
                          RailMarks 同函数（有阅读页→书桌 p.N），开卡旁路不再单向。 */}
                      <Link
                        href={`/desk/card/${encodeURIComponent(c.cardId)}`}
                        onClick={rememberDeskReturn}
                        className="text-sm font-medium text-foreground no-underline hover:text-cinnabar"
                      >
                        {c.nameZh}
                      </Link>
                      {/* T35 A/B：轨行「练」「核」写出默认档（练 mode=all · 核 mode=open）——
                          从轨进卡范围落可见池，不被 sticky 非默认空档撒谎。
                          T48 C：核侧空池门禁（与卡瓷砖/卡枢纽同池同真）——本卡 pending
                          （pendingByCard 由 DocumentPane heyePool 派生）===0 降 muted 纯文
                          「暂无待核」，不装有待核可点进 /review?card=&mode=open 空池。 */}
                      {c.atomCount > 0 && bookId ? (
                        <Link
                          href={`/study?card=${encodeURIComponent(c.cardId)}&book=${encodeURIComponent(bookId)}&mode=all`}
                          onClick={rememberDeskReturn}
                          className="ml-2 text-xs text-cinnabar no-underline hover:underline underline-offset-4"
                        >
                          练
                        </Link>
                      ) : null}
                      {bookId ? (
                        (pendingByCard?.[c.cardId] ?? 0) > 0 ? (
                          <Link
                            href={`/review?card=${encodeURIComponent(c.cardId)}&book=${encodeURIComponent(bookId)}&mode=open`}
                            onClick={rememberDeskReturn}
                            className="ml-2 text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                            title={`核《${c.nameZh}》的 cite`}
                          >
                            核
                          </Link>
                        ) : (
                          <span
                            className="ml-2 text-xs text-muted"
                            title={`《${c.nameZh}》暂无待核 cite`}
                          >
                            暂无待核
                          </span>
                        )
                      ) : null}
                      {/* T24 B：本机练/核薄计数（只读 study/heye 桶；无掌握% / 色环 / Due）。
                          T34 E：分段计数可点进该卡对应档（bookId + 点前写 return，同轨「练/核」口径）。 */}
                      <PageCardRailMarks
                        cardId={c.cardId}
                        atomCount={c.atomCount}
                        bookId={bookId}
                        rememberReturn={rememberDeskReturn}
                      />
                      {c.hits.slice(0, 2).map((h, i) => (
                        <div key={`${h.source}:${h.label}:${i}`} className="mt-0.5 flex items-center gap-1">
                          <span className="min-w-0 truncate text-xs text-muted">
                            {hitSummary(h)}
                          </span>
                          {/* T19：轨上 Peek——cite 由 hit 原样字段构造（page/verified 不编造）。
                              T49 E：下传 T48 同源三数——本页原子（pageAtomCount，轨顶「练本页」同 reduce）·
                              本页待核（pendingPageCount，页顶「核本页」同表）· 本卡待核
                              （pendingByCard，轨「核」门禁同表）——浮层 CTA 与轨顶/枢纽同真不进空池。
                              T53 I：再传该书 validPages——CiteChip/「在书桌打开」鬼页门禁同真。 */}
                          <CitePeek
                            cite={{
                              page: h.page,
                              quote: h.quote,
                              verified: h.verified,
                            }}
                            deskBookId={bookId}
                            cardId={c.cardId}
                            bookValidPages={readerValidPages}
                            pageAtomCount={pageAtomCount}
                            pendingPageCount={pendingPageCount}
                            pendingCiteCount={pendingByCard?.[c.cardId] ?? 0}
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
