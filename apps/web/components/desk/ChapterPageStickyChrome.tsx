"use client";

import type { RefObject } from "react";
import SessionKeyHint from "@/components/SessionKeyHint";
import type { PageDoc } from "@/lib/entities";
import { SPARSE_CHAR_THR } from "@/lib/parse-ocr-coverage";
import type { NeighborChapter } from "@/components/desk/chapter-page-reader-helpers";

/**
 * T76 机械抽出：原 ChapterPageReader.tsx 内 sticky 页铬（T24 A 实底工具带 + T26 A
 * 跳页表单/章芯片行 + T56 H 稀页徽章 + T18 翻页 nav + SessionKeyHint）整段迁此——
 * JSX/文案/class/href 零改，仅换文件。跳页输入态（draft/error/ref/submit）与键盘
 * g// 聚焦仍由 ChapterPageReader 编排器持有（onKey 要 focus 跳页输入），经 props 下传。
 */
export default function ChapterPageStickyChrome({
  variant,
  hasPages,
  chapters,
  chapterId,
  onSwitchChapter,
  jumpDraft,
  onJumpDraftChange,
  jumpError,
  jumpInputRef,
  onSubmitJump,
  pg,
  pagePos,
  pageTotal,
  prev,
  next,
  prevReadable,
  nextReadable,
  onPageChange,
  onChapterChange,
}: {
  /** sticky 工具带贴合方式：full = 章页整宽模式（吃掉中栏 px-8）；column = 分栏右列（吃掉 pl-6）。 */
  variant: "full" | "column";
  /** 本书是否有解析页（pages.length > 0 才出跳页表单——无页书不出空表单）。 */
  hasPages: boolean;
  chapters: { id: string; title: string }[];
  chapterId: string;
  onSwitchChapter: (chapterId: string) => void;
  jumpDraft: string;
  onJumpDraftChange: (v: string) => void;
  jumpError: string | null;
  jumpInputRef: RefObject<HTMLInputElement | null>;
  onSubmitJump: (e: React.FormEvent) => void;
  /** 当前印刷页（缺页章时 undefined——页头/翻页/键说明块随之不出）。 */
  pg?: PageDoc;
  /** 当前章内序（idx>=0 ? idx+1 : 0）分母 pageTotal——「n/m 页」计数。 */
  pagePos: number;
  pageTotal: number;
  prev?: PageDoc;
  next?: PageDoc;
  prevReadable: NeighborChapter | null;
  nextReadable: NeighborChapter | null;
  onPageChange: (pageNo: number) => void;
  onChapterChange: (chapterId: string, pageNo: number | null) => void;
}) {
  return (
    /* T24 A：sticky 页铬（实底 bg-card + border-b，与 T21 study/review 工具带同族，不做第三套 chrome）。
       full 模式吃掉中栏 px-8 撑满整宽；column 模式吃掉分栏右列 pl-6。长 OCR 滚动时章/页/翻页仍在。
       T26 A：章控件区 = 可点章芯片行（扫视优先，select 退役）；右侧薄跳页输入贴同一页铬。 */
    <div
      className={`sticky top-0 z-10 border-b border-line bg-card py-3 ${
        variant === "column" ? "-ml-6 pl-6 pr-1" : "-mx-8 px-8"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-sm font-semibold text-muted">章页（OCR 原文）</h2>
        {hasPages ? (
          <form
            onSubmit={onSubmitJump}
            aria-label="跳到印刷页"
            className="flex items-center gap-1.5"
          >
            <input
              ref={jumpInputRef}
              value={jumpDraft}
              onChange={(e) => onJumpDraftChange(e.target.value)}
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
                onClick={() => onSwitchChapter(c.id)}
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
              {pagePos >= 0 ? pagePos + 1 : 0}/{pageTotal} 页
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
  );
}
