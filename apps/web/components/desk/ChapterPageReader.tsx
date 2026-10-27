"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PageCitingCard, PageDoc } from "@/lib/entities";
import ChapterPageCardRail from "@/components/desk/ChapterPageCardRail";
import ChapterPageEmptyChapter from "@/components/desk/ChapterPageEmptyChapter";
import ChapterPageStickyChrome from "@/components/desk/ChapterPageStickyChrome";
import {
  buildPagesByChapter,
  findNextReadable,
  findPrevReadable,
  validPagesOf,
} from "@/components/desk/chapter-page-reader-helpers";
import { isEditableTarget, isPeekOpen } from "@/lib/keyboard";
import { saveReturn } from "@/lib/return-stack";
import { SPARSE_CHAR_THR } from "@/lib/parse-ocr-coverage";
import { SHALLOW_ATOM_MAX, SHALLOW_CHARS_PER_ATOM } from "@/lib/extract-page-density";

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
 * T76 mega-split：sticky 页铬 / 无页章空态 / 本页卡轨 / 模块层纯函数机械抽出
 * （ChapterPageStickyChrome · ChapterPageEmptyChapter · ChapterPageCardRail ·
 * chapter-page-reader-helpers）——编排器只留索引/跳页态 + 键盘 effect + 暗浅提示 +
 * OCR article + 组装；props 契约与行为零改。
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
   * 章内页索引（review-fix-integrity G4）：全书 pages 的 filter+sort 收进 useMemo
   * （buildPagesByChapter，T76 抽至 chapter-page-reader-helpers），按 chapterId 一处建
   * 索引——chPages / 章首页末页 / 邻章扫描全走 Map，跳页输入每敲一键、翻页重渲染
   * 不再 O(章×页) 重复排序。
   */
  const pagesByChapter = useMemo(() => buildPagesByChapter(pages), [pages]);
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
  const readerValidPages = useMemo(() => validPagesOf(pages), [pages]);

  /** 薄跳页（T26 A）：输入印刷页号；未命中琥珀提示，不改当前页。 */
  const [jumpDraft, setJumpDraft] = useState("");
  const [jumpError, setJumpError] = useState<string | null>(null);
  const jumpInputRef = useRef<HTMLInputElement | null>(null);

  /** 章切换（芯片 / COP / 邻章）清掉跳页琥珀错，避免跨章残留。 */
  // T72：prop 变化渲染期调整（React「You Might Not Need an Effect」形）——任何
  // chapterId 变化路径（含父层直改章）都会清错；switchChapter 内的清错保留为等价防线。
  const [prevJumpChapter, setPrevJumpChapter] = useState(chapterId);
  if (prevJumpChapter !== chapterId) {
    setPrevJumpChapter(chapterId);
    setJumpError(null);
  }

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

  /**
   * 邻章扫描（T76 抽至 chapter-page-reader-helpers findPrev/NextReadable）：从当前章
   * 向前/向后找最近一个「有 OCR 页」的章（跳过无页章——落到无页章只会再撞空态）。
   * 前向取首页，后向取末页。
   */
  const chIndex = chapters.findIndex((c) => c.id === chapterId);
  const prevReadable = findPrevReadable(chapters, pagesByChapter, chIndex);
  const nextReadable = findNextReadable(chapters, pagesByChapter, chIndex);

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
      {/* sticky 页铬（T76 抽至 ChapterPageStickyChrome）：跳页表单/章芯片/页头/翻页/键说明；
          跳页输入态留编排器（键盘 g// 聚焦同源）。 */}
      <ChapterPageStickyChrome
        variant={variant}
        hasPages={pages.length > 0}
        chapters={chapters}
        chapterId={chapterId}
        onSwitchChapter={switchChapter}
        jumpDraft={jumpDraft}
        onJumpDraftChange={setJumpDraft}
        jumpError={jumpError}
        jumpInputRef={jumpInputRef}
        onSubmitJump={submitJump}
        pg={pg}
        pagePos={idx}
        pageTotal={chPages.length}
        prev={prev}
        next={next}
        prevReadable={prevReadable}
        nextReadable={nextReadable}
        onPageChange={onPageChange}
        onChapterChange={onChapterChange}
      />

      {!pg ? (
        /* 无页章空态（T76 抽至 ChapterPageEmptyChapter）：主 CTA 下一/上一有页章 + 回概览。 */
        <ChapterPageEmptyChapter
          chapterId={chapterId}
          nextReadable={nextReadable}
          prevReadable={prevReadable}
          onSwitchChapter={switchChapter}
          onOpenOverview={onOpenOverview}
        />
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

      {/* 本页相关实体卡轨（T76 抽至 ChapterPageCardRail；次级扫视面：页 → 卡 → 枢纽；
          空态诚实，不造假卡）。 */}
      {pg && citingCards != null ? (
        <ChapterPageCardRail
          citingCards={citingCards}
          bookId={bookId}
          studyPageHref={studyPageHref}
          pageAtomCount={pageAtomCount}
          reviewPageHref={reviewPageHref}
          pendingPageCount={pendingPageCount}
          pendingByCard={pendingByCard}
          readerValidPages={readerValidPages}
          rememberDeskReturn={rememberDeskReturn}
        />
      ) : null}
    </section>
  );
}
