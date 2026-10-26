"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BookConfig, ChapterConfig, EntityCard, PageCitingCard, PageDoc } from "@/lib/entities";
import SectionToc, { SECTIONS } from "@/components/desk/SectionToc";
import type { SectionId } from "@/components/desk/SectionToc";
import ChapterPageReader from "@/components/desk/ChapterPageReader";
import BookSwitcher, { type BookSwitcherBook } from "@/components/desk/BookSwitcher";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import { withQsMode } from "@/lib/qs-mode";
import { useDeskContext } from "@/components/desk/DeskContext";
import OverviewPanel from "@/components/desk/OverviewPanel";
import QuizPanel from "@/components/desk/DocumentQuizPanel";
import SectionCards from "@/components/desk/SectionCards";
import { filterCards, firstPageOf, type Mode } from "@/components/desk/document-pane-helpers";
import {
  healOpenedIfDirty,
  loadLastOpened,
  loadRecentBooks,
  touchLastOpened,
} from "@/lib/last-opened";
import { loadViewMode, saveViewMode, type DeskViewMode } from "@/lib/view-continuity";
import { useClientOnce } from "@/lib/use-client-once";
import { saveReturn } from "@/lib/return-stack";
import { collectCitedPages } from "@/lib/extract-page-coverage";
import { collectAtomCountByPage } from "@/lib/extract-page-density";

/**
 * DocumentPane：/desk 中栏编排（客户端）。
 * 模式：实体卡 | 章页 | 分栏；六段 TOC 驱动真过滤/面板；状态经 DeskContext 同步给 Clew。
 * T73 机械拆分：helpers / CardCard / OverviewPanel / QuizPanel / SectionCards 已整段迁至
 * desk/ 同级文件（document-pane-helpers.ts · DocumentCardTile.tsx · OverviewPanel.tsx ·
 * DocumentQuizPanel.tsx · SectionCards.tsx），此处只留编排——props 与行为同拆分前。
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

  /** 当前页的 citing 卡与待核数（服务端索引表按 pageNo 查；翻页随动）。
      T72：包 useMemo 稳引用（空档的 [] 不再逐渲染新建，下游 useMemo 依赖不漂移）。 */
  const pageCitingCards = useMemo(
    () => (readingPage != null && citingByPage ? (citingByPage[readingPage] ?? []) : []),
    [readingPage, citingByPage],
  );
  const pagePendingCount =
    readingPage != null && pendingByPage ? (pendingByPage[readingPage] ?? 0) : 0;

  /**
   * 作用域本机进度（T18）：默认「本章」池；章页/分栏下改「本页」池
   * （citing 卡原子 + 本页 heye）；本页元引用则回落本章并诚实小字。
   * 客户端按 cards 的 chapterId 归属过滤（不 import fs）。
   */
  const chapterCards = useMemo(
    () => cards.filter((c) => c.chapterId === chapterId),
    [cards, chapterId],
  );
  const chapterAtoms = useMemo(
    () =>
      chapterCards.flatMap((c) => c.atoms.map((a) => ({ cardId: c.id, atomId: a.id }))),
    [chapterCards],
  );
  const chapterHeYe = useMemo(() => {
    const ids = new Set(chapterCards.map((c) => c.id));
    return (heyePool ?? []).filter((it) => ids.has(it.cardId));
  }, [heyePool, chapterCards]);

  /**
   * T48 A/C/F：cardId → 本书待核 cite 数（heyePool 按 cardId 累加；与
   * CardHubReturnLinks pendingCiteCount / collectCiteQueue({cardId}) 同池族）——
   * 卡瓷砖「核」/ 章页轨卡级「核」/ Overview 章行「核本章」三处共用同一张表，
   * 不出现第二套「待核」定义（非 Due、非本机核页标记）。heyePool 缺省 → 空表全 0
   * （fail-closed，不假装有待核）。
   */
  const pendingByCard = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of heyePool ?? []) m[it.cardId] = (m[it.cardId] ?? 0) + 1;
    return m;
  }, [heyePool]);

  const pageCitingIds = useMemo(
    () => new Set(pageCitingCards.map((c) => c.cardId)),
    [pageCitingCards],
  );
  const pageAtoms = useMemo(
    () =>
      cards
        .filter((c) => pageCitingIds.has(c.id))
        .flatMap((c) => c.atoms.map((a) => ({ cardId: c.id, atomId: a.id }))),
    [cards, pageCitingIds],
  );
  const pageHeYe = useMemo(
    () => (heyePool ?? []).filter((it) => it.page === readingPage),
    [heyePool, readingPage],
  );

  /**
   * T28 B：练/核本页作用域拆开——本页有可练原子（citing 卡 atoms，与 collectStudyAtoms({page})
   * 同口径）才算「练本页」；本页有待核 cite 才算「核本页」。heye-only 页不再把空练池标成「本页」。
   * strip 池 / 标签 / href 三处同口径（Clew progress* 同步走这套）。
   */
  const studyPageScope = readingPage != null && pageAtoms.length > 0;
  const reviewPageScope = readingPage != null && pageHeYe.length > 0;
  const stripAtoms = studyPageScope ? pageAtoms : chapterAtoms;
  const stripItems = reviewPageScope ? pageHeYe : chapterHeYe;
  /**
   * T47 B：六段 TOC 过滤计数——map/process/confusions/case 用既有 filterCards(section, cards)
   * （与 SectionCards 同池）；quiz = stripAtoms.length（与 T45 QuizPanel atomCount 同池同真）；
   * overview 不传（恒可点，不因 0 卡禁用）。
   */
  const sectionCounts: Partial<Record<SectionId, number>> = {
    map: filterCards("map", cards).length,
    process: filterCards("process", cards).length,
    confusions: filterCards("confusions", cards).length,
    case: filterCards("case", cards).length,
    quiz: stripAtoms.length,
  };
  /**
   * T54 I：本书 page→OCR 原文（pages prop 即该书真印刷页，含 text）——卡瓷砖主 cite
   * 机检「OCR 未见」点名用（citeOcrMiss 同真；缺页文本不抬假阳）。纯客户端派生。
   */
  const pageTextByBook = useMemo(() => {
    const m: Record<number, string> = {};
    for (const p of pages) if (p.page != null) m[p.page] = p.text;
    return m;
  }, [pages]);
  /**
   * T57 H/I：当前章已 cite 印刷页集合（章内 cards 的 cites/fields[].cite/atoms[].cite
   * 并集——collectCitedPages 与 pnpm page-check 章口径同真）——下传 ChapterPageReader
   * 做暗页提示（当前页实质 chars≥40 且 ∉ citedSet）。章内无卡 → undefined（未抽出＝
   * 未装配，不点名暗页，不装满暗假象）；换章随 chapterCards 重算。
   */
  const chapterCitedPages = useMemo(
    () => (chapterCards.length > 0 ? collectCitedPages(chapterCards) : undefined),
    [chapterCards],
  );
  /**
   * T59 H/I：当前章页 → 可考原子数表（章内 cards 的 atoms[].cite.page 计数——
   * collectAtomCountByPage 与 pnpm density-check 章口径同真）——下传 ChapterPageReader
   * 做浅页提示（当前页 chars≥40 ∧ 1≤atomCount≤2 ∧ chars/atomCount≥400）。章内无卡 →
   * undefined（未抽出＝未装配，不点名浅页）；换章随 chapterCards 重算。
   */
  const chapterAtomCountByPage = useMemo(
    () => (chapterCards.length > 0 ? collectAtomCountByPage(chapterCards) : undefined),
    [chapterCards],
  );
  /**
   * T52 A/I：本书可练原子数——与书头「N 个知识原子」同一 reduce（cards 即本书卡
   * loadCards({bookId})，等于 collectStudyAtoms({bookId}).length 同池）；下传 QuizPanel
   * 做「放宽到本书」书空门禁：本章 0 且本书 0 → 纯文「本书暂无原子」，不再链放宽。
   */
  const bookAtomCount = cards.reduce((n, c) => n + c.atoms.length, 0);
  const chapterSideLabel = activeChapter ? `本章 ${activeChapter.id}` : "本书";
  const stripScopeLabel =
    studyPageScope && reviewPageScope
      ? `本页 p.${readingPage}`
      : reviewPageScope
        ? `练${chapterSideLabel} · 核 p.${readingPage}`
        : studyPageScope
          ? `练 p.${readingPage} · 核${chapterSideLabel}`
          : chapterSideLabel;
  // T27 B + T28 C：练侧深链显式 mode=all（保留 book/chapter[/page]）——从书桌进练不会被
  // StickyModeGate restore 成 unknown 空队列；核侧仅 reviewPageScope 时带 page（heye-only 练不带页）。
  const stripStudyHref = `/study?book=${encodeURIComponent(book.id)}&chapter=${encodeURIComponent(chapterId)}${
    studyPageScope ? `&page=${readingPage}` : ""
  }&mode=all`;
  const stripReviewHref = `/review?book=${encodeURIComponent(book.id)}&chapter=${encodeURIComponent(chapterId)}&mode=open${
    reviewPageScope ? `&page=${readingPage}` : ""
  }`;

  /** 同步 Clew 上下文（书/章/当前页/可见卡名/示例 cite 页/表面/当前卡 + T19 章/页进度池）。 */
  useEffect(() => {
    const citePages = [
      ...new Set(
        visibleCards
          .slice(0, 3)
          .flatMap((c) => c.cites.filter((x) => x.page != null).map((x) => x.page as number)),
      ),
    ].slice(0, 3);
    const firstCard = visibleCards[0];
    setClew({
      book: { id: book.id, title: book.title },
      chapter: activeChapter ? { id: activeChapter.id, title: activeChapter.title } : undefined,
      page: readingPage,
      citePages,
      visibleEntityName: firstCard?.name_zh,
      // 书桌面：card = 当前过滤后第一张可见卡（会话条可点回跳；非精确「当前强调」）。
      card: firstCard ? { id: firstCard.id, name_zh: firstCard.name_zh } : undefined,
      surface: "desk",
      // T19：把与中栏 Strip 同一章/页键集写进上下文——Clew compact 随翻章/翻页收窄，
      // 数字与中栏一致且明显小于全书全局计数。
      progressAtoms: stripAtoms,
      progressItems: stripItems.map((it) => ({ key: it.key })),
      progressScopeLabel: stripScopeLabel,
      progressStudyHref: stripStudyHref,
      progressReviewHref: stripReviewHref,
    });
  }, [
    book,
    activeChapter,
    readingPage,
    visibleCards,
    setClew,
    stripAtoms,
    stripItems,
    stripScopeLabel,
    stripStudyHref,
    stripReviewHref,
  ]);

  /**
   * T34 A：卡瓷砖练/核出发写 return 短链——回当前书桌：章页/分栏有阅读页写「书桌 p.N」，
   * 实体卡模式（readingPage==null）写书级。与 ChapterPageReader.rememberDeskReturn 同口径
   * （key 仍 ariadne.desk.return.v1），练/核完成态「回到刚才」能回书桌原位。
   * T39 E：payload 抽成单一来源 deskReturnPayload——书头/自测 QuizPanel 内嵌
   * LocalProgressStrip 的 returnTo 与卡瓷砖/自测 CTA 的写点共用同一份，不出现第二套口径。
   */
  const deskReturnPayload = {
    href:
      readingPage != null
        ? `/desk?book=${encodeURIComponent(book.id)}&page=${readingPage}`
        : `/desk?book=${encodeURIComponent(book.id)}`,
    label: readingPage != null ? `书桌 p.${readingPage}` : `书桌《${book.title}》`,
  };
  function rememberDeskCardReturn() {
    saveReturn({ ...deskReturnPayload, at: Date.now() });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      <header>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="brand-rule pb-2 text-3xl font-bold">{book.title}</h1>
          {books ? (
            <BookSwitcher
              books={books}
              currentBookId={book.id}
              bookValidPages={bookValidPages}
            />
          ) : null}
        </div>
        {invalidBook ? (
          <p className="mt-2 text-sm text-status-warn">
            书库中没有 book id「{badBookId}」——已回落到第一本书。可从书架打开正确书目。
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm text-muted">
            {book.chapterIds.length} 章 · {cards.length} 张实体卡 ·{" "}
            {cards.reduce((n, c) => n + c.atoms.length, 0)} 个知识原子 ·{" "}
            {pages.length > 0 ? `${pages.length} OCR 印刷页` : "无 OCR 印刷页"}
          </p>
          {/* T27 B + T28 B：书头学习链至少带章（不裸 /study?book= 丢章）；仅 studyPageScope
              （本页有可练原子）才并列「练本页」深链——heye-only 页练走本章，不出这条链。
              T35 B：「学习环 · 自评」显式 mode=all（对齐同页 stripStudyHref）——本标签 sticky
              停在 unknown/ungraded 空档时点书头入口仍落可见全部池。
              T42 A：两链点前 rememberDeskCardReturn——与旁边 Strip returnTo={deskReturnPayload}
              同一函数/payload（有阅读页→书桌 p.N，否则书级），书头入口与 Strip 条末同真回程。
              T51 F：「学习环 · 自评」章空池门禁——chapterAtoms===0（对齐 Overview 章行 chAtoms /
              T48 F，href 即章作用域）降 muted 纯文「本章暂无原子」不可点；>0 保持链。「练本页」只回归。 */}
          <span className="flex flex-wrap items-baseline gap-4">
            {chapterAtoms.length > 0 ? (
              <Link
                href={`/study?book=${encodeURIComponent(book.id)}&chapter=${encodeURIComponent(chapterId)}&mode=all`}
                onClick={rememberDeskCardReturn}
                className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
              >
                学习环 · 自评 →
              </Link>
            ) : (
              <span
                className="text-sm text-muted"
                title="本章实体卡均未萃取出知识原子"
              >
                本章暂无原子
              </span>
            )}
            {studyPageScope ? (
              <Link
                href={stripStudyHref}
                onClick={rememberDeskCardReturn}
                className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
              >
                练本页 p.{readingPage} →
              </Link>
            ) : null}
          </span>
        </div>
        {/* 作用域本机进度：练/核各自判本页（T28 B）；可点进同范围练核。
            T36 C：池分段可点——三档 href 从条末 stripStudyHref/stripReviewHref 派生
            （withQsMode 只换 mode；book/chapter[/page] 范围与条末完全同池同真）。
            T39 E：returnTo=deskReturnPayload——条末练/核与 N>0 分段点前写 return
            （有阅读页→书桌 p.N，否则书级），与卡瓷砖/自测 CTA 同一 payload。 */}
        <LocalProgressStrip
          atoms={stripAtoms}
          items={stripItems}
          scopeLabel={stripScopeLabel}
          studyHref={stripStudyHref}
          reviewHref={stripReviewHref}
          returnTo={deskReturnPayload}
          studyModeHrefs={{
            all: withQsMode(stripStudyHref, "all"),
            unknown: withQsMode(stripStudyHref, "unknown"),
            ungraded: withQsMode(stripStudyHref, "ungraded"),
          }}
          heyeModeHrefs={{
            open: withQsMode(stripReviewHref, "open"),
            checked: withQsMode(stripReviewHref, "checked"),
            doubt: withQsMode(stripReviewHref, "doubt"),
          }}
        />
        {/* T28 B：heye-only / 单侧本页的诚实说明（muted，不加新强调色）。 */}
        {reviewPageScope && !studyPageScope ? (
          <p className="text-xs text-muted">
            本页有待核 cite、无可练原子——练走{chapterSideLabel}，核走本页。
          </p>
        ) : null}
        {studyPageScope && !reviewPageScope ? (
          <p className="text-xs text-muted">
            本页暂无待核 cite——核侧按{chapterSideLabel} 统计。
          </p>
        ) : null}
        {readingPage != null && !studyPageScope && !reviewPageScope ? (
          <p className="text-xs text-muted">本页暂无引用卡 · 显示本章进度。</p>
        ) : null}
        <p className="mt-1 text-sm text-muted">
          过渡文档 · 六段讲义生成管线未接入；章页是 OCR 原文，不是萃取讲义。
        </p>
        {/* T26 D：稀疏注册书诚实条——已注册但尚无卡/尚无 OCR 页；次级 /ingest 链，
            不阻断概览与模式切换（琥珀 = 稀疏/存疑族，不与朱砂动作色混用）。 */}
        {cards.length === 0 || pages.length === 0 ? (
          <p className="mt-3 rounded-lg border border-amber-300 bg-status-warn-bg px-4 py-3 text-sm leading-7 text-status-warn">
            {cards.length === 0 ? <>这本书已注册，但还没有萃取出的实体卡——各段会显示为空。</> : null}
            {pages.length === 0 ? <>这本书还没有解析出 OCR 印刷页——章页 / 分栏暂读不了。</> : null}
            可到 <Link href="/ingest" className="underline underline-offset-4">/ingest</Link> 上传并解析教材。
          </p>
        ) : null}
        {invalidPage ? (
          <p className="mt-3 rounded-lg border border-amber-300 bg-status-warn-bg px-4 py-3 text-sm leading-7 text-status-warn">
            本书已解析的 OCR 里没有印刷页 p.{initialPage}——可能该页未解析或不属于本书。
            已从第一章开始；可换页码或用「章页」模式翻页。
          </p>
        ) : null}
      </header>

      {/* 模式切换：实体卡 | 章页 | 分栏（朱砂只标当前模式）。
          分段控件留呼吸感：段间 gap + 段内横向 padding，inactive 不贴 active 朱红 pill。
          T46 E：本书无 OCR 印刷页时「章页」「分栏」诚实降级——disabled + aria-disabled +
          title 说明（与 T26 稀疏琥珀条同真，不另起文案体系）；「实体卡」恒可点；
          深链已落在 pages/split 时保留 aria-selected 指示，但不假装有可读正文。 */}
      <div
        role="tablist"
        aria-label="中栏模式"
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line bg-card p-1.5"
      >
        {(
          [
            ["cards", "实体卡"],
            ["pages", "章页"],
            ["split", "分栏"],
          ] as [Mode, string][]
        ).map(([m, label]) => {
          const unusable = pages.length === 0 && (m === "pages" || m === "split");
          return (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              aria-disabled={unusable || undefined}
              disabled={unusable}
              onClick={() => setPickedMode(m)}
              title={unusable ? "本书尚无 OCR 印刷页——章页/分栏暂读不了；可看概览与实体卡" : undefined}
              className={`rounded-md px-5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                unusable ? "cursor-not-allowed opacity-50 " : ""
              }${
                mode === m
                  ? "bg-cinnabar text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <SectionToc
        active={section}
        onSelect={(s) => {
          /* T47 B：空过滤段/零原子自测 no-op——不进空面板装作有内容（SectionToc 侧已 disabled +
             title，这里双保险程序调用路径）；overview 恒可切。 */
          if (s !== "overview" && sectionCounts[s] === 0) return;
          setSection(s);
          if (s === "overview" || s === "quiz") setPickedMode("cards");
        }}
        counts={sectionCounts}
      />

      {/* 内容区：TOC 段 + 模式组合驱动 */}
      {section === "overview" ? (
        <OverviewPanel
          book={book}
          chapters={chapters}
          cards={cards}
          pages={pages}
          pendingByCard={pendingByCard}
          onOpenChapter={(chId) => {
            setChapterId(chId);
            setPageNo(firstPageOf(pages, chId));
            setPickedMode("pages");
          }}
          rememberReturn={rememberDeskCardReturn}
        />
      ) : section === "quiz" ? (
        <QuizPanel
          bookId={book.id}
          atomCount={stripAtoms.length}
          bookAtomCount={bookAtomCount}
          studyHref={stripStudyHref}
          reviewHref={stripReviewHref}
          atoms={stripAtoms}
          items={stripItems}
          scopeLabel={stripScopeLabel}
          rememberReturn={rememberDeskCardReturn}
          returnTo={deskReturnPayload}
        />
      ) : mode === "pages" ? (
        <div className="mt-8">
          <ChapterPageReader
            pages={pages}
            chapters={chapters}
            chapterId={chapterId}
            pageNo={pageNo}
            onChapterChange={(chId, p) => {
              setChapterId(chId);
              setPageNo(p);
            }}
            onPageChange={setPageNo}
            bookId={book.id}
            citingCards={pageCitingCards}
            pendingPageCount={pagePendingCount}
            pendingByCard={pendingByCard}
            citedPages={chapterCitedPages}
            atomCountByPage={chapterAtomCountByPage}
            onOpenOverview={() => setSection("overview")}
            variant="full"
          />
          <p className="mt-4 text-xs text-muted">
            当前段「{SECTIONS.find((s) => s.id === section)?.label}」已按规则过滤实体卡（{visibleCards.length} 张）；
            想边看卡边读页可用「分栏」。
          </p>
        </div>
      ) : mode === "split" ? (
        // 分栏：左卡列表 + 右章页。grid 轨道必须 minmax(0,1fr)——OCR 中文长段落 min-content 很大，
        // 默认 auto 轨道会把它列撑宽、把卡列表列压到 0 宽。
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <SectionCards
              section={section}
              cards={visibleCards}
              compact
              bookId={book.id}
              rememberReturn={rememberDeskCardReturn}
              pendingByCard={pendingByCard}
              pendingByPage={pendingByPage}
              bookValidPages={bookValidPages?.[book.id]}
              pageTextByPage={pageTextByBook}
            />
          </div>
          <div className="min-w-0 border-l border-line pl-6 max-xl:border-l-0 max-xl:pl-0">
            <ChapterPageReader
              pages={pages}
              chapters={chapters}
              chapterId={chapterId}
              pageNo={pageNo}
              onChapterChange={(chId, p) => {
                setChapterId(chId);
                setPageNo(p);
              }}
              onPageChange={setPageNo}
              bookId={book.id}
              citingCards={pageCitingCards}
              pendingPageCount={pagePendingCount}
              pendingByCard={pendingByCard}
              citedPages={chapterCitedPages}
              atomCountByPage={chapterAtomCountByPage}
              onOpenOverview={() => setSection("overview")}
              variant="column"
            />
          </div>
        </div>
      ) : (
        <SectionCards
          section={section}
          cards={visibleCards}
          bookId={book.id}
          rememberReturn={rememberDeskCardReturn}
          pendingByCard={pendingByCard}
          pendingByPage={pendingByPage}
          bookValidPages={bookValidPages?.[book.id]}
          pageTextByPage={pageTextByBook}
        />
      )}
    </div>
  );
}
