"use client";

import type { NeighborChapter } from "@/components/desk/chapter-page-reader-helpers";

/**
 * T76 机械抽出：原 ChapterPageReader.tsx 内无页章空态（T26 B 诚实文案：主 CTA
 * 「下一有页章 →」前向优先、前向无页降后向「上一有页章 →」、全书无页纯文 +
 * 次级「回概览」）整段迁此——JSX/文案/class 零改，仅换文件。
 */
export default function ChapterPageEmptyChapter({
  chapterId,
  nextReadable,
  prevReadable,
  onSwitchChapter,
  onOpenOverview,
}: {
  chapterId: string;
  nextReadable: NeighborChapter | null;
  prevReadable: NeighborChapter | null;
  onSwitchChapter: (chapterId: string) => void;
  /** 次级「回概览」：DocumentPane 切回概览段（可选，避免组件耦合段状态）。 */
  onOpenOverview?: () => void;
}) {
  return (
    <div className="mt-4">
      <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
        这一章（{chapterId}）还没有解析出的印刷页——OCR 未覆盖或解析未完成，
        纸面暂读不了；先去别的章，或回概览看各章卡数。
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        {nextReadable ? (
          <button
            onClick={() => onSwitchChapter(nextReadable.id)}
            title={`下一章 ${nextReadable.id} · ${nextReadable.title}（首页 p.${nextReadable.page}）`}
            className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline transition-opacity hover:opacity-90 motion-reduce:transition-none"
          >
            下一有页章 {nextReadable.id} →
          </button>
        ) : prevReadable ? (
          /* 前向无页、后向有：同一颗主 CTA，标签如实说「上一」。 */
          <button
            onClick={() => onSwitchChapter(prevReadable.id)}
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
  );
}
