"use client";

import type { Dispatch, SetStateAction } from "react";
import type {
  BookConfig,
  ChapterConfig,
  EntityCard,
  PageCitingCard,
  PageDoc,
} from "@/lib/entities";
import { SECTIONS } from "@/components/desk/SectionToc";
import type { SectionId } from "@/components/desk/SectionToc";
import ChapterPageReader from "@/components/desk/ChapterPageReader";
import OverviewPanel from "@/components/desk/OverviewPanel";
import QuizPanel from "@/components/desk/DocumentQuizPanel";
import SectionCards from "@/components/desk/SectionCards";
import { firstPageOf, type Mode } from "@/components/desk/document-pane-helpers";

/**
 * T96 机械抽出：原 DocumentPane.tsx 内容区段（overview→OverviewPanel · quiz→QuizPanel ·
 * pages→ChapterPageReader · split→SectionCards+ChapterPageReader · cards→SectionCards）
 * 整段迁此——下传 props 与子组件零改，仅换文件。
 */
export default function DocumentPaneBody({
  section,
  mode,
  book,
  chapters,
  cards,
  pages,
  chapterId,
  setChapterId,
  pageNo,
  setPageNo,
  setPickedMode,
  setSection,
  visibleCards,
  pendingByCard,
  pendingByPage,
  bookValidPages,
  pageTextByBook,
  chapterCitedPages,
  chapterAtomCountByPage,
  pageCitingCards,
  pagePendingCount,
  stripAtoms,
  stripItems,
  bookAtomCount,
  stripStudyHref,
  stripReviewHref,
  stripScopeLabel,
  rememberDeskCardReturn,
  deskReturnPayload,
}: {
  section: SectionId;
  mode: Mode;
  book: BookConfig;
  chapters: ChapterConfig[];
  cards: EntityCard[];
  pages: PageDoc[];
  chapterId: string;
  setChapterId: Dispatch<SetStateAction<string>>;
  pageNo: number | null;
  setPageNo: Dispatch<SetStateAction<number | null>>;
  setPickedMode: Dispatch<SetStateAction<Mode | null>>;
  setSection: Dispatch<SetStateAction<SectionId>>;
  visibleCards: EntityCard[];
  pendingByCard: Record<string, number>;
  pendingByPage?: Record<number, number>;
  bookValidPages?: Record<string, number[]>;
  pageTextByBook: Record<number, string>;
  chapterCitedPages?: Set<number>;
  chapterAtomCountByPage?: Map<number, number>;
  pageCitingCards: PageCitingCard[];
  pagePendingCount: number;
  stripAtoms: { cardId: string; atomId: string }[];
  stripItems: { key: string }[];
  bookAtomCount: number;
  stripStudyHref: string;
  stripReviewHref: string;
  stripScopeLabel: string;
  rememberDeskCardReturn: () => void;
  /** T39 E 单一来源（use-document-pane-scope 派生）——QuizPanel 内嵌 Strip returnTo 同一份。 */
  deskReturnPayload: { href: string; label: string };
}) {
  return (
    <>
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
    </>
  );
}
