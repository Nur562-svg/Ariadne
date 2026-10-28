"use client";

import { useEffect, useMemo } from "react";
import type {
  BookConfig,
  ChapterConfig,
  EntityCard,
  PageCitingCard,
  PageDoc,
} from "@/lib/entities";
import type { ClewContextData } from "@/components/desk/DeskContext";
import type { SectionId } from "@/components/desk/SectionToc";
import { filterCards } from "@/components/desk/document-pane-helpers";
import { saveReturn } from "@/lib/return-stack";
import { collectCitedPages } from "@/lib/extract-page-coverage";
import { collectAtomCountByPage } from "@/lib/extract-page-density";

/**
 * T96 机械抽出：原 DocumentPane.tsx 作用域派生段（pageCitingCards … stripReviewHref ·
 * setClew 同步 effect · deskReturnPayload/rememberDeskCardReturn）整段迁此——派生与
 * effect 体零改，仅换文件。入参 = 编排器已有 props/state；返回值供 Chrome/Body 消费，
 * 不出现第二套待核/原子/进度口径。
 */
export type UseDocumentPaneScopeInput = {
  book: BookConfig;
  cards: EntityCard[];
  pages: PageDoc[];
  chapterId: string;
  readingPage: number | null;
  visibleCards: EntityCard[];
  activeChapter: ChapterConfig | undefined;
  citingByPage?: Record<number, PageCitingCard[]>;
  pendingByPage?: Record<number, number>;
  heyePool?: { key: string; cardId: string; page: number }[];
  setClew: (data: ClewContextData) => void;
};

export function useDocumentPaneScope({
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
}: UseDocumentPaneScopeInput) {
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

  return {
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
  };
}
