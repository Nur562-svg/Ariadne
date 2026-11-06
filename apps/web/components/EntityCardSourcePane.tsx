"use client";

import { useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useCardSource } from "@/components/EntityCardSourceLink";
import { useClewFold } from "@/components/desk/ClewToggle";
import { deskPageHref } from "@/lib/ocr-page";
import HonestyDisclosure from "@/components/desk/HonestyDisclosure";
import DeskOpenReturnLink from "@/components/DeskOpenReturnLink";
import {
  locateQuote,
  splitParaByMark,
  neighborPages,
  type SourcePage,
  type CitingCardRow,
} from "@/lib/entity-card-source-model";

export type EntityCardSourcePaneProps = {
  pages: SourcePage[];
  citingByPage: Record<number, CitingCardRow[]>;
  currentCardId: string;
  currentCardName: string;
  bookId: string;
  validPages: number[] | undefined;
  chapterId: string;
  openDeskReturnTo: { href: string; label: string };
};

export default function EntityCardSourcePane({
  pages,
  citingByPage,
  currentCardId,
  bookId,
  validPages,
  chapterId,
  openDeskReturnTo,
}: EntityCardSourcePaneProps) {
  const ctx = useCardSource();
  const { open: clewOpen, setOpen: setClewOpen } = useClewFold();
  const textRef = useRef<HTMLDivElement>(null);

  const page = ctx?.page;
  const activeField = ctx?.activeField;
  const fieldCites = ctx?.fieldCites;

  const curPageObj = useMemo(
    () => (page != null ? pages.find((p) => p.page === page) : undefined),
    [pages, page],
  );

  const pageNums = useMemo(() => pages.map((p) => p.page), [pages]);
  const { prev, next, index } = useMemo(
    () => (page != null ? neighborPages(pageNums, page) : { prev: null, next: null, index: -1 }),
    [pageNums, page],
  );

  const activeCite = useMemo(() => {
    if (activeField == null || !fieldCites) return null;
    return fieldCites[activeField] ?? null;
  }, [activeField, fieldCites]);

  const segs = useMemo(() => {
    if (page == null || !curPageObj || !activeCite || activeCite.page !== page) return null;
    return locateQuote(curPageObj.paras, activeCite.quote);
  }, [page, curPageObj, activeCite]);

  const hasMissNote =
    activeCite != null &&
    activeCite.page === page &&
    !!activeCite.quote &&
    segs === null;

  useLayoutEffect(() => {
    const tx = textRef.current;
    if (!tx) return;
    const mark = tx.querySelector("[data-card-src-mark]");
    if (mark) {
      const txRect = tx.getBoundingClientRect();
      const markRect = mark.getBoundingClientRect();
      const markTopRelativeToTx = markRect.top - txRect.top + tx.scrollTop;
      tx.scrollTop = Math.max(0, markTopRelativeToTx - tx.clientHeight / 3);
    } else {
      tx.scrollTop = 0;
    }
  }, [ctx?.page, ctx?.activeField, segs, clewOpen, ctx?.wide]);

  if (!ctx || !ctx.wide) {
    return null;
  }

  if (clewOpen) {
    return (
      <div className="flex h-full flex-col items-center gap-3 border-r border-line bg-card py-3 overflow-hidden">
        <button
          type="button"
          aria-label="展开章页原文（收起 Clew）"
          title="展开章页原文（收起 Clew）"
          aria-controls="desk-clew-slot"
          onClick={() => setClewOpen(false)}
          className="inline-flex size-8 items-center justify-center rounded-md border border-line bg-card text-muted transition-colors hover:text-cinnabar hover:bg-background focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 3.5l4.5 4.5-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-xs text-muted [writing-mode:vertical-rl]">
          章页 p.{ctx.page}
        </span>
      </div>
    );
  }

  const deskHref = deskPageHref(bookId, ctx.page, validPages);
  const rows = citingByPage[ctx.page] ?? [];

  return (
    <div data-card-src-pane className="flex h-full min-h-0 flex-col border-r border-line bg-card">
      {/* 页头 */}
      <div className="shrink-0 border-b border-line py-3.5 pl-8 pr-9">
        <div className="flex items-center justify-between gap-3 text-xs leading-[18px] text-muted">
          <div className="flex items-center gap-1.5">
            <span>章页（OCR 原文）</span>
            <span>仅合并 OCR 硬换行，字不改</span>
            <HonestyDisclosure disclaimer="高亮只表示这句引文在本页文字里被逐字找到，不等于教材数据已核（seed verified），也不写你的核页标记。" />
          </div>
          {deskHref ? (
            <span className="[&>a]:text-cinnabar [&>a]:underline [&>a]:underline-offset-2">
              <DeskOpenReturnLink href={deskHref} returnTo={openDeskReturnTo}>
                在书桌打开本页 →
              </DeskOpenReturnLink>
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 flex items-center gap-2.5">
          <span className="text-base font-semibold leading-6">印刷页 p.{ctx.page}</span>
          <span className="text-[11px] leading-4 text-muted">
            PDF 物理页 {curPageObj?.physicalPage ?? "—"} · {chapterId}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              disabled={prev == null}
              aria-label={prev != null ? `上一页 p.${prev}` : "上一页"}
              onClick={() => prev != null && ctx.goPage(prev)}
              className="min-h-7 px-1 text-xs text-muted hover:text-cinnabar disabled:opacity-40 disabled:hover:text-muted focus-visible:outline-2 focus-visible:outline-cinnabar"
            >
              {prev != null ? `← p.${prev}` : "←"}
            </button>
            <span className="text-xs text-muted">
              {index >= 0 ? index + 1 : 1}/{pages.length} 页
            </span>
            <button
              type="button"
              disabled={next == null}
              aria-label={next != null ? `下一页 p.${next}` : "下一页"}
              onClick={() => next != null && ctx.goPage(next)}
              className="min-h-7 px-1 text-xs text-muted hover:text-cinnabar disabled:opacity-40 disabled:hover:text-muted focus-visible:outline-2 focus-visible:outline-cinnabar"
            >
              {next != null ? `p.${next} →` : "→"}
            </button>
          </div>
        </div>
      </div>

      {/* 正文 */}
      <div
        ref={textRef}
        data-card-src-text
        tabIndex={0}
        aria-label={`章页 OCR 原文（印刷页 p.${ctx.page}）`}
        className="min-h-0 flex-1 overflow-y-auto py-4 pl-8 pr-9 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-cinnabar"
      >
        {hasMissNote ? (
          <p className="mb-2 text-xs leading-5 text-muted">
            未能在本页文字里逐字定位该字段引文——不高亮、不连线。
          </p>
        ) : null}
        {curPageObj?.paras.map((para, pIdx) => {
          const seg = segs?.find((s) => s.para === pIdx);
          const parts = splitParaByMark(para, seg);
          return (
            <p key={pIdx} className="mb-1.5 [overflow-wrap:anywhere]">
              {parts.map((pt, ptIdx) =>
                pt.mark ? (
                  <mark
                    key={ptIdx}
                    data-card-src-mark
                    className="bg-cinnabar-soft text-inherit border-b-[1.5px] border-cinnabar [box-decoration-break:clone]"
                  >
                    {pt.text}
                  </mark>
                ) : (
                  <span key={ptIdx}>{pt.text}</span>
                ),
              )}
            </p>
          );
        })}
      </div>

      {/* 脚注 */}
      <footer className="shrink-0 border-t border-line py-2.5 pl-8 pr-9 max-h-36 overflow-y-auto">
        <h3 className="text-xs font-semibold text-muted">
          引用本页的卡（{rows.length}）
        </h3>
        {rows.length === 0 ? (
          <p className="mt-1 text-xs text-muted">本页暂无卡引用。</p>
        ) : (
          <ul className="mt-1 space-y-0.5">
            {rows.map((row) =>
              row.cardId === currentCardId ? (
                <li key={row.cardId} className="text-sm leading-6">
                  <span>{row.nameZh}</span>
                  <span className="ml-2 text-xs text-muted">
                    {row.hitCount} 处引用 · 当前卡
                  </span>
                </li>
              ) : (
                <li key={row.cardId} className="text-sm leading-6">
                  <Link
                    href={`/desk/card/${encodeURIComponent(row.cardId)}`}
                    className="text-foreground hover:text-cinnabar no-underline focus-visible:outline-2 focus-visible:outline-cinnabar"
                  >
                    {row.nameZh}
                  </Link>
                  <span className="ml-2 text-xs text-muted">
                    {row.hitCount} 处引用
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </footer>
    </div>
  );
}
