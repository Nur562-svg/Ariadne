"use client";

import { useEffect, useMemo, useState } from "react";
import type { BookConfig, ChapterConfig, EntityCard, PageCitingCard, PageDoc } from "@/lib/entities";
import type { SectionId } from "@/components/desk/SectionToc";
import type { BookSwitcherBook } from "@/components/desk/BookSwitcher";
import { filterCards, firstPageOf, type Mode } from "@/components/desk/document-pane-helpers";
import {
  healOpenedIfDirty,
  loadLastOpened,
  loadRecentBooks,
  touchLastOpened,
} from "@/lib/last-opened";
import { loadViewMode, saveViewMode, type DeskViewMode } from "@/lib/view-continuity";
import { useClientOnce } from "@/lib/use-client-once";
import { useDeskContext } from "@/components/desk/DeskContext";
import { useDocumentPaneScope } from "@/components/desk/use-document-pane-scope";
import DocumentPaneChrome from "@/components/desk/DocumentPaneChrome";
import DocumentPaneBody from "@/components/desk/DocumentPaneBody";

/**
 * DocumentPane：/desk 中栏编排（客户端）。
 * 模式：实体卡 | 章页 | 分栏；六段 TOC 驱动真过滤/面板；状态经 DeskContext 同步给 Clew。
 * T73 机械拆分：helpers / CardCard / OverviewPanel / QuizPanel / SectionCards 已整段迁至
 * desk/ 同级文件（document-pane-helpers.ts · DocumentCardTile.tsx · OverviewPanel.tsx ·
 * DocumentQuizPanel.tsx · SectionCards.tsx），此处只留编排——props 与行为同拆分前。
 * T96 further 机械拆分：作用域派生 + Clew 同步迁 use-document-pane-scope.ts；书头 chrome 迁
 * DocumentPaneChrome.tsx；内容区迁 DocumentPaneBody.tsx——此处只留 T72 状态机、URL/续开/
 * scrub effects 与装配，props 与行为仍同拆分前（desk/page.tsx 零改动）。
 */
export default function DocumentPane({
  book,
  books,
  chapters,
  cards,
  pages,
  invalidBook,
  badBookId,
  initialPage,
  initialMode,
  citingByPage,
  pendingByPage,
  heyePool,
  bookValidPages,
}: {
  book: BookConfig;
  /** 全部已注册书（T23 换书用）；书名旁 ≥2 本时显示「换书 ▾」。 */
  books?: BookSwitcherBook[];
  chapters: ChapterConfig[];
  cards: EntityCard[];
  pages: PageDoc[];
  invalidBook: boolean;
  badBookId?: string;
  /** 深链 ?page=N（CiteChip / 核页「在书桌打开」）：挂载即切章页并定位。 */
  initialPage?: number | null;
  /** 深链可选 ?mode=pages|split；有 page 未给 mode 时默认章页。 */
  initialMode?: Mode;
  /** 服务端预计算：页 → 引用该页的实体卡（轻量摘要；T15 本页卡轨）。 */
  citingByPage?: Record<number, PageCitingCard[]>;
  /** 服务端预计算：页 → 本页待核 cite 数（T15「核本页」诚实入口）。 */
  pendingByPage?: Record<number, number>;
  /** 本书核池轻量项（服务端 collectCiteQueue({bookId})；带 cardId/page 供客户端按章/页过滤）。 */
  heyePool?: { key: string; cardId: string; page: number }[];
  /** T31 C：bookId → 已解析印刷页[]（服务端装配）——BookSwitcher 换书读侧幽灵页消毒。 */
  bookValidPages?: Record<string, number[]>;
}) {
  const { setClew } = useDeskContext();

  /** 深链页是否落在本书已解析页里；不在 → 诚实横幅，不伪造定位。 */
  const deepPage =
    initialPage != null ? pages.find((p) => p.page === initialPage) : undefined;
  const invalidPage = initialPage != null && !deepPage;

  // T72：模式拆「显式选择 pickedMode」（URL 深链 / 用户点击）+「一次性续住 adoptedMode」
  // （无 URL 深链时读 view.v1，URL 胜出——T24 口径不变）。noop-uSES：SSR/水合首帧恒
  // null（mode 回落 cards，与服务端 HTML 一致不水合错位），水合后读一次（sessionStorage
  // 每标签页续住）；props 变化重渲染即以新闭包重采。
  const [pickedMode, setPickedMode] = useState<Mode | null>(
    deepPage ? (initialMode ?? "pages") : (initialMode ?? null),
  );
  const adoptedMode = useClientOnce<DeskViewMode | null>(
    () => (deepPage || initialMode ? null : loadViewMode()),
    null,
  );
  const mode: Mode = pickedMode ?? adoptedMode ?? "cards";
  const [section, setSection] = useState<SectionId>("map");
  const [chapterId, setChapterId] = useState<string>(
    deepPage?.chapterId ?? chapters[0]?.id ?? "",
  );
  // T72：pageNo lazy 初值——深链页 ?? 当前章首页（pages/chapters 均服务端 props，
  // 确定性求值，SSR/客户端同值不水合错位；旧挂载 effect 的补位改由下方渲染期调整承担）。
  const [pageNo, setPageNo] = useState<number | null>(() =>
    deepPage?.page != null
      ? deepPage.page
      : firstPageOf(pages, deepPage?.chapterId ?? chapters[0]?.id ?? ""),
  );
  // T72：章变化渲染期调整——pageNo 空时补章首页（替 [chapterId] effect；章芯片 /
  // COP / 阅读器 onChapterChange(chId, null) 等一切章切换路径都覆盖，React 官方
  // 「prop/state 变化时渲染期调整」形）。
  const [prevChapterId, setPrevChapterId] = useState(chapterId);
  if (prevChapterId !== chapterId) {
    setPrevChapterId(chapterId);
    if (pageNo == null) setPageNo(firstPageOf(pages, chapterId));
  }

  /**
   * 模式变化即写回 view.v1（独立桶，与 session/return 分界）。T72：挂载首遍的
   * 默认值（未选未采纳 mode=cards）不写回——避免在续住值采纳完成前把它冲掉；
   * 采纳翻转或用户点击后照旧写回。
   */
  useEffect(() => {
    if (pickedMode == null && adoptedMode == null) return;
    saveViewMode(mode);
  }, [pickedMode, adoptedMode, mode]);

  const visibleCards = useMemo(() => filterCards(section, cards), [section, cards]);
  const activeChapter = chapters.find((c) => c.id === chapterId);
  const readingPage = mode === "pages" || mode === "split" ? pageNo : null;

  /**
   * 翻页 URL 同步（T15）：章页/分栏模式下当前印刷页变化时，
   * 用 history.replaceState 把地址更新为 /desk?book=&page=（保留 mode=）。
   * 不整页刷新、不打断滚动；?page= 深链（T12）进页行为不变。
   */
  useEffect(() => {
    if (readingPage == null) return;
    const params = new URLSearchParams();
    params.set("book", book.id);
    params.set("page", String(readingPage));
    if (mode === "split" || mode === "pages") params.set("mode", mode);
    const url = `/desk?${params.toString()}`;
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [readingPage, mode, book.id]);

  /**
   * T22 D：翻页时把当前停留页写进续开/最近栈（换书后再回来能回原位，被换下书 entry 保留）。
   * 只写本机 localStorage（touchLastOpened），不写 seed / 不写 verified；非法 book 回落时不写。
   */
  useEffect(() => {
    if (invalidBook || readingPage == null) return;
    touchLastOpened(book.id, {
      deskHref: `/desk?book=${encodeURIComponent(book.id)}`,
      page: readingPage,
    });
  }, [readingPage, book.id, invalidBook]);

  /**
   * T32 C：invalidPage 挂载 scrub（desk/page.tsx 以 `${book.id}:${page}` key 重挂载，一次导航
   * 只跑一遍）——深链 ?page=999（不在本书已解析页）时：
   * 1) 该书 last-opened / recent 条目单条 heal 剥脏 page（盘内 peel；cards 模 readingPage==null
   *    也 scrub，不依赖翻页 touchLastOpened 兜底）；
   * 2) URL 仍带着该非法 page= 时 replaceState 剥至书级 /desk?book=（不整页刷新、不伪造落在
   *    某合法页；String(initialPage) 精确比对，不误伤翻页同步刚写回的合法 page）。
   * 琥珀横幅保留；合法翻页 touchLastOpened 写点不回退；不清整栈、不动其它书条目。
   */
  useEffect(() => {
    if (!invalidPage) return;
    const validPages =
      bookValidPages?.[book.id] ??
      pages.flatMap((p) => (p.page != null ? [p.page as number] : []));
    const lo = loadLastOpened();
    if (lo?.bookId === book.id) healOpenedIfDirty(lo, validPages);
    for (const e of loadRecentBooks()) {
      if (e.bookId === book.id) healOpenedIfDirty(e, validPages);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("page") === String(initialPage)) {
      params.delete("page");
      const qs = params.toString();
      window.history.replaceState(window.history.state, "", `/desk${qs ? `?${qs}` : ""}`);
    }
    // 挂载一次即够：heal 幂等（干净原引用不写盘），URL 剥除只认本次深链的非法 page。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // T96：作用域派生 + setClew 同步 + deskReturnPayload 单一来源整段在 scope hook
  // （use-document-pane-scope.ts）——Chrome/Body 与上方 URL/续开 effects 同池消费。
  const {
    pageCitingCards,
    pagePendingCount,
    chapterAtoms,
    pendingByCard,
    studyPageScope,
    reviewPageScope,
    stripAtoms,
    stripItems,
    sectionCounts,
    pageTextByBook,
    chapterCitedPages,
    chapterAtomCountByPage,
    bookAtomCount,
    chapterSideLabel,
    stripScopeLabel,
    stripStudyHref,
    stripReviewHref,
    deskReturnPayload,
    rememberDeskCardReturn,
  } = useDocumentPaneScope({
    book,
    cards,
    pages,
    chapterId,
    readingPage,
    visibleCards,
    activeChapter,
    citingByPage,
    pendingByPage,
    heyePool,
    setClew,
  });

  return (
    <DocumentPaneChrome
      book={book}
      books={books}
      invalidBook={invalidBook}
      badBookId={badBookId}
      cards={cards}
      pages={pages}
      bookValidPages={bookValidPages}
      invalidPage={invalidPage}
      initialPage={initialPage}
      chapterId={chapterId}
      chapterAtoms={chapterAtoms}
      chapterSideLabel={chapterSideLabel}
      studyPageScope={studyPageScope}
      reviewPageScope={reviewPageScope}
      readingPage={readingPage}
      stripAtoms={stripAtoms}
      stripItems={stripItems}
      stripScopeLabel={stripScopeLabel}
      stripStudyHref={stripStudyHref}
      stripReviewHref={stripReviewHref}
      deskReturnPayload={deskReturnPayload}
      rememberDeskCardReturn={rememberDeskCardReturn}
      mode={mode}
      setPickedMode={setPickedMode}
      section={section}
      setSection={setSection}
      sectionCounts={sectionCounts}
    >
      <DocumentPaneBody
        section={section}
        mode={mode}
        book={book}
        chapters={chapters}
        cards={cards}
        pages={pages}
        chapterId={chapterId}
        setChapterId={setChapterId}
        pageNo={pageNo}
        setPageNo={setPageNo}
        setPickedMode={setPickedMode}
        setSection={setSection}
        visibleCards={visibleCards}
        pendingByCard={pendingByCard}
        pendingByPage={pendingByPage}
        bookValidPages={bookValidPages}
        pageTextByBook={pageTextByBook}
        chapterCitedPages={chapterCitedPages}
        chapterAtomCountByPage={chapterAtomCountByPage}
        pageCitingCards={pageCitingCards}
        pagePendingCount={pagePendingCount}
        stripAtoms={stripAtoms}
        stripItems={stripItems}
        bookAtomCount={bookAtomCount}
        stripStudyHref={stripStudyHref}
        stripReviewHref={stripReviewHref}
        stripScopeLabel={stripScopeLabel}
        rememberDeskCardReturn={rememberDeskCardReturn}
        deskReturnPayload={deskReturnPayload}
      />
    </DocumentPaneChrome>
  );
}
