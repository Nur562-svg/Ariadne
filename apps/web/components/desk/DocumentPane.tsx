"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BookConfig, ChapterConfig, EntityCard, PageCitingCard, PageDoc } from "@/lib/entities";
import SectionToc, { SECTIONS } from "@/components/desk/SectionToc";
import type { SectionId } from "@/components/desk/SectionToc";
import ChapterPageReader from "@/components/desk/ChapterPageReader";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import { useDeskContext } from "@/components/desk/DeskContext";

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

function CardCard({ card, bookId }: { card: EntityCard; bookId?: string }) {
  const citePage = card.cites.find((x) => x.page != null)?.page ?? null;
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
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p className="min-w-0 text-xs text-muted">
          {card.atoms.length} 个原子 · {card.chapterId ?? ""}
          {citePage != null ? ` · 引 p.${citePage}` : ""}
          {card.cites.some((x) => x.page == null) ? " · 部分未验证 p.?" : ""}
        </p>
        {bookId ? (
          <Link
            href={`/study?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(bookId)}`}
            className="shrink-0 text-xs text-cinnabar no-underline hover:underline underline-offset-4"
          >
            练 →
          </Link>
        ) : null}
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
}: {
  book: BookConfig;
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
  /** 本书核池键（服务端 collectCiteQueue({bookId}) 的 {key}）：LocalProgressStrip 按池计数。 */
  heyePool?: { key: string }[];
}) {
  const { setClew } = useDeskContext();

  /** 深链页是否落在本书已解析页里；不在 → 诚实横幅，不伪造定位。 */
  const deepPage =
    initialPage != null ? pages.find((p) => p.page === initialPage) : undefined;
  const invalidPage = initialPage != null && !deepPage;

  const [mode, setMode] = useState<Mode>(
    deepPage ? (initialMode ?? "pages") : "cards",
  );
  const [section, setSection] = useState<SectionId>("map");
  const [chapterId, setChapterId] = useState<string>(
    deepPage?.chapterId ?? chapters[0]?.id ?? "",
  );
  const [pageNo, setPageNo] = useState<number | null>(deepPage?.page ?? null);

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

  /** 当前页的 citing 卡与待核数（服务端索引表按 pageNo 查；翻页随动）。 */
  const pageCitingCards =
    readingPage != null && citingByPage ? (citingByPage[readingPage] ?? []) : [];
  const pagePendingCount =
    readingPage != null && pendingByPage ? (pendingByPage[readingPage] ?? 0) : 0;

  /** 同步 Clew 上下文（书/章/当前页/可见卡名/示例 cite 页/表面/当前卡）。 */
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
    });
  }, [book, activeChapter, readingPage, visibleCards, setClew]);

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      <header>
        <h1 className="brand-rule pb-2 text-3xl font-bold">{book.title}</h1>
        {invalidBook ? (
          <p className="mt-2 text-sm text-status-warn">
            书库中没有 book id「{badBookId}」——已回落到第一本书。可从书架打开正确书目。
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm text-muted">
            {book.chapterIds.length} 章 · {cards.length} 张实体卡 ·{" "}
            {cards.reduce((n, c) => n + c.atoms.length, 0)} 个知识原子
          </p>
          <Link
            href={`/study?book=${encodeURIComponent(book.id)}`}
            className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
          >
            学习环 · 自评 →
          </Link>
        </div>
        {/* 跨面本机进度：本书原子池 + 本书核池（分列，非掌握仪表盘）。 */}
        <LocalProgressStrip
          atoms={cards.flatMap((c) => c.atoms.map((a) => ({ cardId: c.id, atomId: a.id })))}
          items={heyePool}
        />
        <p className="mt-1 text-sm text-muted">
          过渡文档 · 六段讲义生成管线未接入；章页是 OCR 原文，不是萃取讲义。
        </p>
        {invalidPage ? (
          <p className="mt-3 rounded-lg border border-amber-300 bg-status-warn-bg px-4 py-3 text-sm leading-7 text-status-warn">
            本书已解析的 OCR 里没有印刷页 p.{initialPage}——可能该页未解析或不属于本书。
            已从第一章开始；可换页码或用「章页」模式翻页。
          </p>
        ) : null}
      </header>

      {/* 模式切换：实体卡 | 章页 | 分栏（朱砂只标当前模式）。
          分段控件留呼吸感：段间 gap + 段内横向 padding，inactive 不贴 active 朱红 pill。 */}
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
        ).map(([m, label]) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-md px-5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
              mode === m
                ? "bg-cinnabar text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <SectionToc
        active={section}
        onSelect={(s) => {
          setSection(s);
          if (s === "overview" || s === "quiz") setMode("cards");
        }}
      />

      {/* 内容区：TOC 段 + 模式组合驱动 */}
      {section === "overview" ? (
        <OverviewPanel
          book={book}
          chapters={chapters}
          cards={cards}
          pages={pages}
          onOpenChapter={(chId) => {
            setChapterId(chId);
            setPageNo(firstPageOf(chId));
            setMode("pages");
          }}
        />
      ) : section === "quiz" ? (
        <QuizPanel bookId={book.id} atomCount={cards.reduce((n, c) => n + c.atoms.length, 0)} />
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
            <SectionCards section={section} cards={visibleCards} compact bookId={book.id} />
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
            />
          </div>
        </div>
      ) : (
        <SectionCards section={section} cards={visibleCards} bookId={book.id} />
      )}
    </div>
  );
}

/** 概览面板：书头统计 + 章列表（点击章 → 章页模式）。 */
function OverviewPanel({
  book,
  chapters,
  cards,
  pages,
  onOpenChapter,
}: {
  book: BookConfig;
  chapters: ChapterConfig[];
  cards: EntityCard[];
  pages: PageDoc[];
  onOpenChapter: (chId: string) => void;
}) {
  return (
    <section className="mt-8">
      <dl className="grid grid-cols-3 gap-4 sm:max-w-md">
        {[
          ["章节", book.chapterIds.length],
          ["实体卡", cards.length],
          ["知识原子", cards.reduce((n, c) => n + c.atoms.length, 0)],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-lg border border-line bg-card p-4 text-center">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="mt-0.5 text-lg font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-8 text-sm font-semibold text-muted">章节（点击进入章页 OCR）</h2>
      <ul className="mt-3 space-y-2">
        {chapters.map((c) => {
          const count = pages.filter((p) => p.chapterId === c.id).length;
          return (
            <li key={c.id}>
              <button
                onClick={() => onOpenChapter(c.id)}
                className="flex w-full items-baseline justify-between gap-3 rounded-lg border border-line bg-card px-4 py-3 text-left transition-colors hover:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
              >
                <span className="text-sm font-medium text-foreground">
                  {c.id} · {c.title}
                </span>
                <span className="mono shrink-0 text-xs text-muted">{count} 页 →</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 自测面板：学习环本机自评 + 核页本机对页（两者均已可用；均非 FSRS 到期调度）。 */
function QuizPanel({ bookId, atomCount }: { bookId: string; atomCount: number }) {
  return (
    <section className="mt-8 max-w-xl rounded-lg border border-line bg-card p-6">
      <h2 className="text-sm font-semibold">自测与核对</h2>
      <p className="mt-2 text-sm leading-7 text-foreground/90">
        学习环已有 {atomCount} 个知识原子：看问题 → 回想 → 自评「认识 / 不熟」（进度保存在本浏览器，
        非到期调度）。
      </p>
      <p className="mt-1 text-sm leading-7 text-muted">
        核页已可用：把卡片引用逐条对着该页 OCR 原文核对，标「本机已对 / 存疑」——只记本机，不回写教材数据。
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href={`/study?book=${encodeURIComponent(bookId)}`}
          className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
        >
          去学习环自评 →
        </Link>
        <Link
          href={`/review?book=${encodeURIComponent(bookId)}`}
          className="text-sm text-muted no-underline hover:text-cinnabar"
        >
          去核页 →
        </Link>
      </div>
    </section>
  );
}

/** 卡片区：默认网格；实体图谱按 kind 分组；compact 用于分栏窄列。卡瓷砖右上角带薄「练」链 → /study?card=。 */
function SectionCards({
  section,
  cards,
  compact,
  bookId,
}: {
  section: SectionId;
  cards: EntityCard[];
  compact?: boolean;
  bookId?: string;
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
                  <CardCard card={c} bookId={bookId} />
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
            <CardCard card={c} bookId={bookId} />
          </li>
        ))}
      </ul>
    </section>
  );
}