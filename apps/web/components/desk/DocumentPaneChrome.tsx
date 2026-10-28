"use client";

import Link from "next/link";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { BookConfig, EntityCard, PageDoc } from "@/lib/entities";
import SectionToc from "@/components/desk/SectionToc";
import type { SectionId } from "@/components/desk/SectionToc";
import BookSwitcher, { type BookSwitcherBook } from "@/components/desk/BookSwitcher";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import { withQsMode } from "@/lib/qs-mode";
import type { Mode } from "@/components/desk/document-pane-helpers";

/**
 * T96 机械抽出：原 DocumentPane.tsx 书头 chrome 段（书名/换书 · 练核深链 ·
 * LocalProgressStrip · heye-only 稀疏诚实条 · 模式芯片 · SectionToc）整段迁此——
 * JSX/文案/className/href 构造零改，仅换文件；内容区经 children（DocumentPaneBody）嵌入。
 */
export default function DocumentPaneChrome({
  children,
  book,
  books,
  invalidBook,
  badBookId,
  cards,
  pages,
  bookValidPages,
  invalidPage,
  initialPage,
  chapterId,
  chapterAtoms,
  chapterSideLabel,
  studyPageScope,
  reviewPageScope,
  readingPage,
  stripAtoms,
  stripItems,
  stripScopeLabel,
  stripStudyHref,
  stripReviewHref,
  deskReturnPayload,
  rememberDeskCardReturn,
  mode,
  setPickedMode,
  section,
  setSection,
  sectionCounts,
}: {
  children: ReactNode;
  book: BookConfig;
  books?: BookSwitcherBook[];
  invalidBook: boolean;
  badBookId?: string;
  cards: EntityCard[];
  pages: PageDoc[];
  /** T31 C：bookId → 已解析印刷页[]（BookSwitcher 换书读侧幽灵页消毒）。 */
  bookValidPages?: Record<string, number[]>;
  invalidPage: boolean;
  initialPage?: number | null;
  chapterId: string;
  chapterAtoms: { cardId: string; atomId: string }[];
  chapterSideLabel: string;
  studyPageScope: boolean;
  reviewPageScope: boolean;
  readingPage: number | null;
  stripAtoms: { cardId: string; atomId: string }[];
  stripItems: { key: string }[];
  stripScopeLabel: string;
  stripStudyHref: string;
  stripReviewHref: string;
  /** T39 E 单一来源（use-document-pane-scope 派生）——Strip returnTo 与卡瓷砖/自测 CTA 同一份。 */
  deskReturnPayload: { href: string; label: string };
  rememberDeskCardReturn: () => void;
  mode: Mode;
  setPickedMode: Dispatch<SetStateAction<Mode | null>>;
  section: SectionId;
  setSection: Dispatch<SetStateAction<SectionId>>;
  sectionCounts: Partial<Record<SectionId, number>>;
}) {
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

      {children}
    </div>
  );
}
