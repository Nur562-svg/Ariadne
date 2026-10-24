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
import CitePeek from "@/components/CitePeek";
import { useDeskContext } from "@/components/desk/DeskContext";
import {
  healOpenedIfDirty,
  loadLastOpened,
  loadRecentBooks,
  touchLastOpened,
} from "@/lib/last-opened";
import { loadViewMode, saveViewMode } from "@/lib/view-continuity";
import { saveReturn } from "@/lib/return-stack";
import { deskPageHref } from "@/lib/ocr-page";
import { citeOcrMiss } from "@/lib/cite-ocr-quality";
import { scoreParseChapter } from "@/lib/parse-ocr-coverage";
import { collectCitedPages, scoreExtractPageCoverage } from "@/lib/extract-page-coverage";

const KIND_ZH: Record<string, string> = {
  concept: "概念",
  structure: "结构",
  process: "过程",
  molecule: "分子",
  pathogen: "病原",
  cell: "细胞",
  disease: "疾病",
};

type Mode = "cards" | "pages" | "split";

/** TOC 段 → 卡片过滤规则（真数据；无假 Paper、无假核页）。 */
function filterCards(section: SectionId, cards: EntityCard[]): EntityCard[] {
  switch (section) {
    case "process":
      // 机制串讲：过程类卡（顺带 molecule 这类机制载体）——只过滤，不编正文
      return cards.filter((c) => c.kind === "process" || c.kind === "molecule");
    case "confusions":
      return cards.filter((c) => (c.confusions?.length ?? 0) > 0);
    case "case":
      return cards.filter(
        (c) =>
          c.kind === "disease" ||
          c.kind === "pathogen" ||
          c.atoms.some((a) => a.difficulty === "case"),
      );
    default:
      return cards;
  }
}

/** 按 kind 分组（实体图谱）。 */
function groupByKind(cards: EntityCard[]): { kind: string; items: EntityCard[] }[] {
  const order = ["concept", "cell", "molecule", "structure", "process", "pathogen", "disease"];
  const byKind = new Map<string, EntityCard[]>();
  for (const c of cards) {
    const list = byKind.get(c.kind) ?? [];
    list.push(c);
    byKind.set(c.kind, list);
  }
  return [...byKind.entries()]
    .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
    .map(([kind, items]) => ({ kind, items }));
}

function CardCard({
  card,
  bookId,
  rememberReturn,
  pendingCiteCount,
  pendingByPage,
  bookValidPages,
  pageTextByPage,
}: {
  card: EntityCard;
  bookId?: string;
  /**
   * T34 A：瓷砖练/核出发写 return 短链（回当前书桌——章页/分栏有阅读页写书桌 p.N，
   * 实体卡模式写书级；对齐 ChapterPageReader.rememberDeskReturn 口径）。
   */
  rememberReturn?: () => void;
  /**
   * T48 A：本卡待核 cite 数——父从书级 heyePool（collectCiteQueue({bookId}) 轻量项）按 card.id
   * 计数下传，与 CardHubReturnLinks pendingCiteCount / collectCiteQueue({cardId}) 同池族。
   * 缺省当 0（fail-closed）：0 →「核」降 muted 纯文「暂无待核」，不进空 open 池。
   */
  pendingCiteCount?: number;
  /**
   * T49 E：页 → 待核数（服务端 pendingByPage 同表）——瓷砖「摘」浮层「核本页」空池门禁；
   * 缺省（未装配）不传给 CitePeek（D 契约：未传入保持链）。
   */
  pendingByPage?: Record<number, number>;
  /**
   * T53 D/I：该书已解析印刷页[]（DocumentPane bookValidPages[bookId]）——主 cite「对页」
   * 与「摘」浮层 CiteChip/「在书桌打开」的鬼页门禁（共享 helper）；练/核空池门禁不动。
   */
  bookValidPages?: number[];
  /**
   * T54 H/I：该书 page→OCR 原文（DocumentPane 自 pages prop 派生，客户端纯计算）——
   * 主 cite 机检「OCR 未见」点名（citeOcrMiss 同真算法；缺文本不抬假阳）。
   */
  pageTextByPage?: Record<number, string>;
}) {
  /** 主 cite（卡级第一条有页引用）；无页则没有可 Peek 的定位，不渲染。 */
  const primaryCite = card.cites.find((x) => x.page != null);
  const primaryOcrMiss = citeOcrMiss(primaryCite, pageTextByPage);
  return (
    <div className="block h-full rounded-lg border border-line bg-card p-4 transition-shadow hover:shadow-md">
      <Link href={`/desk/card/${card.id}`} className="block no-underline">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">{card.name_zh}</h3>
          <span className="mono shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
            {KIND_ZH[card.kind] ?? card.kind}
          </span>
        </div>
        {card.name_en && <p className="mono mt-0.5 text-xs text-muted">{card.name_en}</p>}
        <p className="mt-2 text-sm leading-6 text-foreground/85">{card.one_liner}</p>
      </Link>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="min-w-0 text-xs text-muted">
          {card.atoms.length} 个原子 · {card.chapterId ?? ""}
          {card.cites.some((x) => x.page == null) ? " · 部分未验证 p.?" : ""}
        </p>
        <span className="flex shrink-0 items-center gap-2">
          {/* 主 cite 旁轻量 Peek（T19 鼓励项）：不新增颜色，不抢「练」主链；无页则不渲染。
              T49 E：下传 T48 同源卡级 pending（「核本卡」门禁）+ 页级 pending
              （primaryCite.page 查 pendingByPage，「核本页」门禁；表未装配不传保持链）。
              T53 D/I：下传该书 validPages——CiteChip 书桌深链 / 浮层「在书桌打开」鬼页门禁。 */}
          {primaryCite ? (
            <CitePeek
              cite={primaryCite}
              deskBookId={bookId}
              cardId={card.id}
              bookValidPages={bookValidPages}
              ocrMiss={primaryOcrMiss}
              pendingCiteCount={pendingCiteCount}
              pendingPageCount={
                pendingByPage != null && primaryCite.page != null
                  ? (pendingByPage[primaryCite.page] ?? 0)
                  : undefined
              }
            />
          ) : null}
          {/* T34 A：主 cite 有页 + 书桌语境 → 次级「对页」直跳（与 EntityCardDetail T33 字段/页脚同族）。
              T53 D：改走共享 deskPageHref——鬼页（该书 OCR 表已装配且不含）降纯文「本页无 OCR」，
              与 EntityCardDetail 对页（T52）同真；有 OCR / 未装配保持链。 */}
          {primaryCite?.page != null && bookId ? (
            deskPageHref(bookId, primaryCite.page, bookValidPages) ? (
              <Link
                href={`/desk?book=${encodeURIComponent(bookId)}&page=${primaryCite.page}`}
                className="text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
              >
                对页 →
              </Link>
            ) : (
              <span
                className="text-xs text-muted"
                title="该印刷页尚未解析 OCR——书桌章页定位不了"
              >
                本页无 OCR
              </span>
            )
          ) : null}
          {/* T35 B：瓷砖「练」显式 mode=all——打开可见池入口写出默认档，挡住 sticky 非默认空档。
              T45 C：零原子卡同族门禁（对齐 CardHubReturnLinks / 章页轨）——「练」降 muted 纯文
              「暂无原子」，不可点 /study?card=；>0 保持练链 + rememberReturn。 */}
          {bookId ? (
            card.atoms.length > 0 ? (
              <Link
                href={`/study?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(bookId)}&mode=all`}
                onClick={rememberReturn}
                className="text-xs text-cinnabar no-underline hover:underline underline-offset-4"
              >
                练 →
              </Link>
            ) : (
              <span className="text-xs text-muted">暂无原子</span>
            )
          ) : null}
          {/* T34 A：练核对称——「核」次级 muted（与本页卡轨轨卡「核」同族，非第二颗实心朱红）；
              与「练」同点前写 return。T35 A：显式 mode=open。
              T48 A：pending 空池门禁（对齐 CardHubReturnLinks「本卡暂无待核 cite」）——
              pendingCiteCount===0 降 muted 纯文「暂无待核」，不可点 /review?card=&mode=open；
              >0 保持链 + rememberReturn。缺省当 0，不假装有待核。 */}
          {bookId ? (
            (pendingCiteCount ?? 0) > 0 ? (
              <Link
                href={`/review?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(bookId)}&mode=open`}
                onClick={rememberReturn}
                className="text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
              >
                核 →
              </Link>
            ) : (
              <span className="text-xs text-muted" title="本卡暂无待核 cite">
                暂无待核
              </span>
            )
          ) : null}
        </span>
      </div>
    </div>
  );
}

/**
 * DocumentPane：/desk 中栏编排（客户端）。
 * 模式：实体卡 | 章页 | 分栏；六段 TOC 驱动真过滤/面板；状态经 DeskContext 同步给 Clew。
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

  const [mode, setMode] = useState<Mode>(
    deepPage ? (initialMode ?? "pages") : (initialMode ?? "cards"),
  );
  const [section, setSection] = useState<SectionId>("map");
  const [chapterId, setChapterId] = useState<string>(
    deepPage?.chapterId ?? chapters[0]?.id ?? "",
  );
  const [pageNo, setPageNo] = useState<number | null>(deepPage?.page ?? null);

  /**
   * T24 A 加分项：无 URL 深链（?page= / ?mode=）时，从 ariadne.desk.view.v1
   * 续住本标签页上次的中栏模式；URL 深链时 URL 胜出（不读桶）。
   */
  useEffect(() => {
    if (deepPage || initialMode) return;
    const saved = loadViewMode();
    if (saved && saved !== "cards") setMode(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 模式变化即写回 view.v1（独立桶，与 session/return 分界）。 */
  useEffect(() => {
    saveViewMode(mode);
  }, [mode]);

  const firstPageOf = (chId: string) =>
    pages
      .filter((p) => p.chapterId === chId && p.page != null)
      .sort((a, b) => (a.page ?? 0) - (b.page ?? 0))[0]?.page ?? null;

  useEffect(() => {
    if (pageNo == null && chapterId) setPageNo(firstPageOf(chapterId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

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

  /** 当前页的 citing 卡与待核数（服务端索引表按 pageNo 查；翻页随动）。 */
  const pageCitingCards =
    readingPage != null && citingByPage ? (citingByPage[readingPage] ?? []) : [];
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
              onClick={() => setMode(m)}
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
          if (s === "overview" || s === "quiz") setMode("cards");
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
            setPageNo(firstPageOf(chId));
            setMode("pages");
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

/**
 * 概览面板：书头统计 + 章列表（主按钮点章 → 章页 OCR）。
 * T37 A/B：每章行补旁路次级「练本章 →」「核本章 →」——/study?book=&chapter=&mode=all ·
 * /review?book=&chapter=&mode=open（章池 + 默认可见档，不被本标签 sticky 非默认档吞成空队列）；
 * 点前写 return 短链（rememberReturn = rememberDeskCardReturn 口径：有阅读页→书桌 p.N，
 * 否则书级；不另开第二套 return key）。0 卡章练/核纯文不可点（不进空池）；
 * 「N 页 · M 卡」meta 保留；次级 text-xs muted + hover cinnabar，不抢主按钮、不加实心。
 * T48 F：章行练/核不再只看 cardCount——有卡章再按章内原子总数（cards.reduce atoms）与
 * 章内 pending（pendingByCard 对该章卡 id 集合求和，与卡瓷砖/轨同一张表）各自门禁：
 * 原子===0 →「本章暂无原子」纯文；pending===0 →「本章暂无待核」纯文；二者 >0 保持链。
 */
function OverviewPanel({
  book,
  chapters,
  cards,
  pages,
  pendingByCard,
  onOpenChapter,
  rememberReturn,
}: {
  book: BookConfig;
  chapters: ChapterConfig[];
  cards: EntityCard[];
  pages: PageDoc[];
  /** T48 F：cardId → 本书待核 cite 数（DocumentPane heyePool 派生）——章行「核本章」空池门禁。 */
  pendingByCard?: Record<string, number>;
  onOpenChapter: (chId: string) => void;
  /** T37 A：练本章/核本章点前写 return（DocumentPane 依当前阅读页构造，同 CardCard 口径）。 */
  rememberReturn?: () => void;
}) {
  return (
    <section className="mt-8">
      {/* T45 B：书级四格补「OCR 印刷页」= pages.length——与章行「N 页 / 无 OCR 页」同一事实源；
          0 页写「无 OCR 页」，不造「0 页」假计数感。 */}
      <dl className="grid grid-cols-2 gap-4 sm:max-w-lg sm:grid-cols-4">
        {(
          [
            ["章节", book.chapterIds.length],
            ["实体卡", cards.length],
            ["知识原子", cards.reduce((n, c) => n + c.atoms.length, 0)],
            ["OCR 印刷页", pages.length > 0 ? pages.length : "无 OCR 页"],
          ] as [string, string | number][]
        ).map(([k, v]) => (
          <div key={String(k)} className="rounded-lg border border-line bg-card p-4 text-center">
            <dt className="text-xs text-muted">{k}</dt>
            <dd
              className={`mt-0.5 font-semibold ${
                typeof v === "number" ? "text-lg" : "text-base leading-7"
              }`}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-8 text-sm font-semibold text-muted">章节（点击进入章页 OCR）</h2>
      <ul className="mt-3 space-y-2">
        {chapters.map((c) => {
          const count = pages.filter((p) => p.chapterId === c.id).length;
          /* T26 D：章行如实报「页 + 卡」；0 页章写「无 OCR 页」，不造「0 页」假计数感。 */
          const chCards = cards.filter((k) => k.chapterId === c.id);
          const cardCount = chCards.length;
          /* T48 F：章内原子总数 / 章内待核数（pendingByCard 对该章卡求和，与瓷砖/轨同表）——
             练/核章行各自按真池门禁，不再凭 cardCount>0 就装两条都能进。 */
          const chAtoms = chCards.reduce((n, k) => n + k.atoms.length, 0);
          const chPending = chCards.reduce((n, k) => n + (pendingByCard?.[k.id] ?? 0), 0);
          /* T58 H：章级抽出页覆盖（scoreExtractPageCoverage 与 pnpm page-check 同真）——
             提升**一次计算**两处消费：T57 暗徽（F）+ 练本章 title 旁挂（H）。无卡/无页章
             null（未检不装暗假 0）。 */
          const chExaminable =
            count > 0 && cardCount > 0
              ? scoreExtractPageCoverage({
                  pages: pages.filter((p) => p.chapterId === c.id),
                  cards: chCards,
                })
              : null;
          return (
            <li key={c.id}>
              {/* 章行卡片容器（对齐 CardCard 容器模式）：主按钮（开章 OCR）占满左区，
                  练/核为行尾旁路次级链——<a> 不嵌 <button>，键盘/读屏各自可达。
                  T46 E：无 OCR 章（count===0）开章降级为纯文（「无 OCR 页」如实展示，
                  不可 onOpenChapter）；有页保持既有开章与 T37 练/核章行。 */}
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg border border-line bg-card px-4 py-3 transition-colors hover:border-cinnabar motion-reduce:transition-none">
                {count > 0 ? (
                  <button
                    onClick={() => onOpenChapter(c.id)}
                    className="flex min-w-0 flex-1 items-baseline justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-cinnabar"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {c.id} · {c.title}
                    </span>
                    <span className="mono shrink-0 text-xs text-muted">
                      {count} 页 · {cardCount} 卡 →
                    </span>
                  </button>
                ) : (
                  <span
                    className="flex min-w-0 flex-1 items-baseline justify-between gap-3 text-left"
                    title="本章尚无 OCR 印刷页——暂不能开章页"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {c.id} · {c.title}
                    </span>
                    <span className="mono shrink-0 text-xs text-muted">
                      无 OCR 页 · {cardCount} 卡
                    </span>
                  </span>
                )}
                {/* T37 B：0 卡章练/核纯文（muted 提示，不点进空池）；有卡两链章池 + 默认档。
                    T48 F：有卡章再按章内原子/待核各自门禁——0 原子「本章暂无原子」、0 待核
                    「本章暂无待核」纯文；>0 保持链 + rememberReturn。 */}
                {cardCount > 0 ? (
                  <span className="flex shrink-0 items-baseline gap-3 text-xs">
                    {chAtoms > 0 ? (
                      <Link
                        href={`/study?book=${encodeURIComponent(book.id)}&chapter=${encodeURIComponent(c.id)}&mode=all`}
                        onClick={rememberReturn}
                        /* T58 H：练入口 title 旁挂——章 weak 时点名暗 D（练本章 ≠ 覆盖本章
                           暗页）；好章不加 title 不吵。次级链语义不动。 */
                        title={
                          chExaminable?.weak
                            ? `本章还有 ${chExaminable.darkCount} 个暗页（实质 OCR 未抽出原子）——练本章不覆盖暗页；pnpm page-check 可复核`
                            : undefined
                        }
                        className="text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                      >
                        练本章 →
                      </Link>
                    ) : (
                      <span className="text-muted" title="本章实体卡均未萃取出知识原子">
                        本章暂无原子
                      </span>
                    )}
                    {chPending > 0 ? (
                      <Link
                        href={`/review?book=${encodeURIComponent(book.id)}&chapter=${encodeURIComponent(c.id)}&mode=open`}
                        onClick={rememberReturn}
                        className="text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                      >
                        核本章 →
                      </Link>
                    ) : (
                      <span className="text-muted" title="本章暂无待核 cite">
                        本章暂无待核
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-muted">本章暂无卡</span>
                )}
                {/* T56 F：章行 parse 覆盖徽（与书架 bookParse / pnpm parse-check 同真）——
                    空页/稀页任一 > 0 → 琥珀短徽「空E · 稀S」（只列 >0 项）；好章不吵；
                    无 OCR 章沿用上方「无 OCR 页」文案，此处不出徽（无 pages 可评）。 */}
                {(() => {
                  if (count === 0) return null; // 无 OCR 页章走既有「无 OCR 页」
                  const cov = scoreParseChapter({
                    pages: pages.filter((p) => p.chapterId === c.id),
                  });
                  if (cov.emptyPages === 0 && cov.sparsePages === 0) return null;
                  const parts: string[] = [];
                  if (cov.emptyPages > 0) parts.push(`空 ${cov.emptyPages}`);
                  if (cov.sparsePages > 0) parts.push(`稀 ${cov.sparsePages}`);
                  return (
                    <span
                      title="本章有空页/稀页（OCR 正文 0 字或 <40 字）——pnpm parse-check 可复核"
                      className="mono shrink-0 rounded border border-amber-300 bg-status-warn-bg px-1.5 py-0.5 text-[10px] text-status-warn"
                    >
                      {parts.join(" · ")}
                    </span>
                  );
                })()}
                {/* T57 F：章行暗页徽（与 T56 空/稀徽、T55 cite 徽三分列）——有 cards 且有
                    OCR 页才实算（chExaminable，T58 H 提升的同一份——与 pnpm page-check
                    同真：暗页 = chars≥40 实质页零 cite）；darkCount>0 → 琥珀短徽「暗D」；
                    好章不吵；无 cards（未抽出）不装暗徽（未检 ≠ 零暗）。无掌握% / Due。 */}
                {(() => {
                  const epc = chExaminable;
                  if (!epc || epc.darkCount === 0) return null;
                  return (
                    <span
                      title={`本章 ${epc.darkCount} 个实质 OCR 页未被任何卡 cite（暗页：${epc.darkPages
                        .slice(0, 6)
                        .map((d) => `p.${d.page}`)
                        .join(" ")}）——扉页/小结可能合理暗；pnpm page-check -- --dark ${c.id} 可复核`}
                      className="mono shrink-0 rounded border border-amber-300 bg-status-warn-bg px-1.5 py-0.5 text-[10px] text-status-warn"
                    >
                      暗{epc.darkCount}
                    </span>
                  );
                })()}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * 自测面板：学习环本机自评 + 核页本机对页（两者均已可用；均非 FSRS 到期调度）。
 * T31 B：练/核深链吃 Strip 同款章/页 scope（book+chapter 恒在，本页有池才带 page）——
 * 禁止裸 /study?book= / /review?book= 丢章。
 * T35 E densify：① 练/核点前写 return（有阅读页→书桌 p.N，否则书级——TOC 切「自测」时常
 * mode=cards、readingPage 为 null，诚实落书级）；② 嵌 LocalProgressStrip 吃当前 strip* 池/标签/
 * href——静态门户变可见本机数；③ 仍一颗朱红主 CTA，「去核页」次级；href 已含 mode=all/open。
 */
function QuizPanel({
  bookId,
  atomCount,
  bookAtomCount,
  studyHref,
  reviewHref,
  atoms,
  items,
  scopeLabel,
  rememberReturn,
  returnTo,
}: {
  bookId: string;
  atomCount: number;
  /**
   * T52 A：本书可练原子数（DocumentPane 与书头统计同一 reduce / collectStudyAtoms({bookId})
   * 同池）——本章 0 且本书 0 时「放宽到本书」降纯文「本书暂无原子」，不链进全书空练池；
   * 本书 >0 保持 T45 A 放宽链语义不动。
   */
  bookAtomCount: number;
  studyHref: string;
  reviewHref: string;
  /** T35 E：当前 strip 池（与书头 Strip / Clew progress* 同源）。 */
  atoms: { cardId: string; atomId: string }[];
  items: { key: string }[];
  scopeLabel: string;
  /** T35 E：练/核点前写 return（DocumentPane 依当前阅读页构造，同 CardCard 口径）。 */
  rememberReturn: () => void;
  /** T39 E：内嵌 Strip 的 returnTo（= 书头 deskReturnPayload 同一份）——条末/分段点前同写。 */
  returnTo: { href: string; label: string };
}) {
  return (
    <section className="mt-8 max-w-xl rounded-lg border border-line bg-card p-6">
      <h2 className="text-sm font-semibold">自测与核对</h2>
      <p className="mt-2 text-sm leading-7 text-foreground/90">
        {atomCount > 0 ? (
          <>
            当前范围（{scopeLabel}）可练 {atomCount} 个知识原子：看问题 → 回想 → 自评「认识 /
            不熟」（进度保存在本浏览器，非到期调度）。
          </>
        ) : (
          <>
            当前范围（{scopeLabel}）暂无可练知识原子——这一范围还没有萃取原子的卡，
            自评入口不装作能进空池。
          </>
        )}
      </p>
      <p className="mt-1 text-sm leading-7 text-muted">
        核页已可用：把卡片引用逐条对着该页 OCR 原文核对，标「本机已对 / 存疑」——只记本机，不回写教材数据。
      </p>
      {/* T35 E：当前范围本机进度（练 认识/不熟/未评 · 核 待核/已对/存疑）——与书头 Strip 同池同口径；
          条末弱链即练/核入口的同范围版本，不另加实心。
          T36 C：分段可点——三档从本面板 studyHref/reviewHref（= strip* 同源）mode-swap 派生。
          T39 E：returnTo 同书头 deskReturnPayload——条末/分段点前写 return，与本面板主 CTA 同真。 */}
      <LocalProgressStrip
        atoms={atoms}
        items={items}
        scopeLabel={scopeLabel}
        studyHref={studyHref}
        reviewHref={reviewHref}
        returnTo={returnTo}
        studyModeHrefs={{
          all: withQsMode(studyHref, "all"),
          unknown: withQsMode(studyHref, "unknown"),
          ungraded: withQsMode(studyHref, "ungraded"),
        }}
        heyeModeHrefs={{
          open: withQsMode(reviewHref, "open"),
          checked: withQsMode(reviewHref, "checked"),
          doubt: withQsMode(reviewHref, "doubt"),
        }}
      />
      <div className="mt-5 flex flex-wrap items-center gap-4">
        {/* T45 A：atomCount 与内嵌 Strip 同池（stripAtoms.length）——0 原子时主 CTA 降级为
            诚实放宽链（book 级 /study，同一 qs 语义），不装作进空练池；>0 保持章/页范围主 CTA。
            T52 A：放宽链先看本书池——本章 0 且本书 0（整本书都没萃出原子）→ 纯文
            「本书暂无原子」，不可点也不引导「放宽」；本书 >0 才给「放宽到本书」链。 */}
        {atomCount > 0 ? (
          <Link
            href={studyHref}
            onClick={rememberReturn}
            className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
          >
            去学习环自评 →
          </Link>
        ) : bookAtomCount > 0 ? (
          <Link
            href={`/study?book=${encodeURIComponent(bookId)}&mode=all`}
            onClick={rememberReturn}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            本章暂无原子 · 去学习环放宽到本书 →
          </Link>
        ) : (
          <span className="text-sm text-muted" title="本书实体卡均未萃取出知识原子">
            本书暂无原子
          </span>
        )}
        {/* T51 G：「去核页」空池门禁——items（= stripItems，与 reviewHref 同章/页池）===0 降
            muted 纯文「暂无待核」不可点；>0 保持链 + rememberReturn。练侧 atomCount===0 放宽链
            （T45 A）语义不动；内嵌 Strip 条末已由 T51 E 组件级接线。 */}
        {items.length > 0 ? (
          <Link
            href={reviewHref}
            onClick={rememberReturn}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            去核页 →
          </Link>
        ) : (
          <span className="text-sm text-muted" title="当前范围没有待核 cite">
            暂无待核
          </span>
        )}
      </div>
    </section>
  );
}

/** 卡片区：默认网格；实体图谱按 kind 分组；compact 用于分栏窄列。卡瓷砖右上角薄「练/核」链（T34 A 含 return）。 */
function SectionCards({
  section,
  cards,
  compact,
  bookId,
  rememberReturn,
  pendingByCard,
  pendingByPage,
  bookValidPages,
  pageTextByPage,
}: {
  section: SectionId;
  cards: EntityCard[];
  compact?: boolean;
  bookId?: string;
  /** T34 A：卡瓷砖练/核点前写 return（DocumentPane 依当前阅读页构造）。 */
  rememberReturn?: () => void;
  /** T48 A：cardId → 本书待核 cite 数（DocumentPane heyePool 派生）——瓷砖「核」空池门禁。 */
  pendingByCard?: Record<string, number>;
  /** T49 E：页 → 待核数（服务端 pendingByPage）——瓷砖「摘」浮层「核本页」门禁。 */
  pendingByPage?: Record<number, number>;
  /** T53 D/I：该书已解析印刷页[]——瓷砖「对页」/摘浮层鬼页门禁（共享 helper）。 */
  bookValidPages?: number[];
  /** T54 H/I：该书 page→OCR 原文——瓷砖主 cite 机检点名（透传 CardCard）。 */
  pageTextByPage?: Record<number, string>;
}) {
  if (cards.length === 0) {
    return (
      <p className="mt-8 border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
        当前段「{SECTIONS.find((s) => s.id === section)?.label}」没有匹配的实体卡（过滤规则见六段目录说明）。
      </p>
    );
  }
  if (section === "map" && !compact) {
    return (
      <div className="mt-8 space-y-8">
        {groupByKind(cards).map(({ kind, items }) => (
          <section key={kind} aria-label={`${KIND_ZH[kind] ?? kind}类实体卡`}>
            <h2 className="text-sm font-semibold text-muted">
              {KIND_ZH[kind] ?? kind}（{items.length}）
            </h2>
            <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((c) => (
                <li key={c.id}>
                  <CardCard
                    card={c}
                    bookId={bookId}
                    rememberReturn={rememberReturn}
                    pendingCiteCount={pendingByCard?.[c.id] ?? 0}
                    pendingByPage={pendingByPage}
                    bookValidPages={bookValidPages}
                    pageTextByPage={pageTextByPage}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }
  return (
    <section className="mt-8" aria-label={`${SECTIONS.find((s) => s.id === section)?.label}实体卡`}>
      <h2 className="text-sm font-semibold text-muted">
        {SECTIONS.find((s) => s.id === section)?.label}（{cards.length} 张）
      </h2>
      <ul className={`mt-3 grid grid-cols-1 gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
        {cards.map((c) => (
          <li key={c.id}>
            <CardCard
              card={c}
              bookId={bookId}
              rememberReturn={rememberReturn}
              pendingCiteCount={pendingByCard?.[c.id] ?? 0}
              pendingByPage={pendingByPage}
              bookValidPages={bookValidPages}
              pageTextByPage={pageTextByPage}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}