"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Cite } from "@/lib/entities";
import { CiteChip } from "@/components/CiteChip";

/**
 * CitePeek lite（T17）：CiteChip 旁边一枚「摘」按钮，点开轻量浮层看引文全貌与诚实状态。
 * - cite 单击深链保持原样（chip 仍是主路径）；旁钮不抢导航。
 * - 浮层只有 quote / p.N / p.? 诚实句 + 深链（书桌 / 核本页 / 核本卡）。
 * - 禁止 OCR 句级高亮、页图、Canvas；Esc / 点外关闭；无花哨动画。
 */
export default function CitePeek({
  cite,
  q,
  deskBookId,
  cardId,
}: {
  cite?: Cite;
  q?: string;
  /** 书桌语境：有页时「在书桌打开」与「核本页」都带 book=。 */
  deskBookId?: string;
  /** 卡上下文：「核本卡」链 /review?card=。 */
  cardId?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  // Esc 关闭；点外关闭由透明遮罩承担。
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!cite) return null;
  const known = cite.page != null;
  const deskPageHref =
    known && deskBookId
      ? `/desk?book=${encodeURIComponent(deskBookId)}&page=${cite.page}`
      : undefined;
  const reviewPageHref = known
    ? `/review?${deskBookId ? `book=${encodeURIComponent(deskBookId)}&` : ""}page=${cite.page}`
    : undefined;
  const reviewCardHref = cardId ? `/review?card=${encodeURIComponent(cardId)}` : undefined;

  return (
    <span ref={rootRef} className="relative inline-flex items-center gap-1">
      <CiteChip cite={cite} q={q} deskBookId={deskBookId} />
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="查看引用摘录"
        title="查看引用摘录（不离开本页）"
        className="mono rounded border border-line px-1 text-[10px] leading-4 text-muted transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
      >
        摘
      </button>

      {open ? (
        <>
          {/* 点外关闭遮罩（透明，不抢视觉）。 */}
          <button
            aria-label="关闭摘录浮层"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
            tabIndex={-1}
          />
          <div
            role="dialog"
            aria-label="引用摘录"
            className="absolute left-0 top-7 z-30 w-72 rounded-lg border border-line bg-card p-3 shadow-md"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="mono text-xs">
                {known ? `p.${cite.page}` : "p.?"}
              </span>
              <span
                className={`text-[11px] leading-5 ${cite.verified ? "text-muted" : "text-status-warn"}`}
              >
                {cite.verified
                  ? "seed 已抽查"
                  : "教材抽查未核（seed）· 与本机核页标记无关"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-6 text-foreground/90">
              {cite.quote ? (
                cite.quote.length > 120 ? `“${cite.quote.slice(0, 120)}…”` : `“${cite.quote}”`
              ) : (
                <span className="text-muted">无摘录原文——按页码到原文核对。</span>
              )}
            </p>
            <nav className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-2 text-xs">
              {deskPageHref ? (
                <Link
                  href={deskPageHref}
                  className="text-cinnabar no-underline hover:underline underline-offset-4"
                >
                  在书桌打开 →
                </Link>
              ) : null}
              {reviewPageHref ? (
                <Link
                  href={reviewPageHref}
                  className="text-muted no-underline hover:text-cinnabar"
                >
                  核本页 →
                </Link>
              ) : null}
              {reviewCardHref ? (
                <Link
                  href={reviewCardHref}
                  className="text-muted no-underline hover:text-cinnabar"
                >
                  核本卡 →
                </Link>
              ) : null}
              {!known ? (
                <span className="text-status-warn">未找到确切页码，禁止伪造定位。</span>
              ) : null}
            </nav>
          </div>
        </>
      ) : null}
    </span>
  );
}