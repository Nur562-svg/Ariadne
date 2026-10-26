"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Cite } from "@/lib/entities";
import { CiteChip } from "@/components/CiteChip";
import { saveReturn } from "@/lib/return-stack";
import { deskPageHref as buildDeskPageHref } from "@/lib/ocr-page";

/** Popover width (w-72 = 18rem). Used for horizontal clamp. */
const POPOVER_W = 288;
/** Height estimate before first measure; also flip threshold when space below is tight. */
const EST_H = 240;
const MARGIN = 8;
const GAP = 4;

/**
 * CitePeek lite（T17）：CiteChip 旁边一枚「摘」按钮，点开轻量浮层看引文全貌与诚实状态。
 * - cite 单击深链保持原样（chip 仍是主路径）；旁钮不抢导航。
 * - 浮层只有 quote / p.N / p.? 诚实句 + 深链（书桌 / 核本页 / 核本卡）。
 * - 禁止 OCR 句级高亮、页图、Canvas；Esc / 点外关闭；无花哨动画。
 * - T25 debt：fixed 定位 + 上下翻转，避免父级 overflow 裁切底部链接。
 */
export default function CitePeek({
  cite,
  q,
  deskBookId,
  cardId,
  bookValidPages,
  ocrMiss,
  pageAtomCount,
  pendingPageCount,
  pendingCiteCount,
}: {
  cite?: Cite;
  q?: string;
  /** 书桌语境：有页时「在书桌打开」与「核本页」都带 book=。 */
  deskBookId?: string;
  /** 卡上下文：「核本卡」链 /review?card=。 */
  cardId?: string;
  /**
   * T53 C/I：该书已解析印刷页[]（宿主装配，缺省不门禁）——只用于 nav：内部 CiteChip
   * 书桌深链与浮层「在书桌打开」的鬼页降纯文；quote / trap / 定位 / verified 文案 /
   * 浮层布局一概不动（正文/trap forever OUT）。
   */
  bookValidPages?: number[];
  /**
   * T54 H/I：该 cite 的机检「OCR 未见」（宿主 server 侧 quoteInOcr 实算，缺省不点名）——
   * 只透传给内部 CiteChip 做后缀/title 提示；不改任何 Link 门禁（鬼页仍吃 T53 pageInOcr）。
   */
  ocrMiss?: boolean;
  /**
   * T49 D：浮层 nav CTA 空池门禁（只动 nav，quote/trap/定位/verified 文案/布局一概不动）——
   * 父传入且对应 ===0 → 该 CTA 降 muted 纯文不可点；未传入 → 保持既有 Link（宿主能取到
   * 才传，E/F 接线；禁造假正数）。计数与轨顶/CardHub/T48 pendingByCard 同池族。
   */
  /** 「练本页」页池原子数（cardsCitingPage 口径）：传入且 0 → 纯文「本页暂无原子」。 */
  pageAtomCount?: number;
  /** 「核本页」页池待核数（pendingByPage 同族）：传入且 0 → 纯文「本页暂无待核」。 */
  pendingPageCount?: number;
  /** 「核本卡」本卡待核数（collectCiteQueue({cardId}) 同族）：传入且 0 → 纯文「本卡暂无待核」。 */
  pendingCiteCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const rootRef = useRef<HTMLSpanElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  /** 关闭中守卫：close() 把焦点归还「摘」时，focusin 拉回逻辑必须让路（否则焦点被拽回层内）。 */
  const closingRef = useRef(false);

  /** T24 D：Esc / 点外关闭后焦点归还「摘」按钮（不滚动页面），键盘环不断线。 */
  function close() {
    closingRef.current = true;
    setOpen(false);
    toggleRef.current?.focus({ preventScroll: true });
  }

  /** Place dialog with fixed coords from toggle; flip above when space below is tight. */
  function placePopover() {
    const btn = toggleRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const h = dialogRef.current?.offsetHeight || EST_H;
    const spaceBelow = vh - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;
    const placeAbove = spaceBelow < EST_H && spaceAbove > spaceBelow;

    let top: number;
    if (placeAbove) {
      top = Math.max(MARGIN, rect.top - GAP - h);
    } else {
      top = Math.min(rect.bottom + GAP, Math.max(MARGIN, vh - MARGIN - h));
    }

    let left = rect.left;
    if (left + POPOVER_W > vw - MARGIN) left = vw - MARGIN - POPOVER_W;
    if (left < MARGIN) left = MARGIN;

    setPos({ top, left });
  }

  // Recalculate on open + window/scroll (passive) so fixed coords stay aligned.
  useLayoutEffect(() => {
    if (!open) return;
    placePopover();
    const id = requestAnimationFrame(() => placePopover());
    const onReposition = () => placePopover();
    window.addEventListener("resize", onReposition, { passive: true });
    // capture: nested scroll parents (desk center column) also fire scroll
    window.addEventListener("scroll", onReposition, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  // T25 C：焦点陷阱——双层防护。
  // ① keydown：Tab/Shift+Tab 在 dialog 内循环（栈底/栈顶 preventDefault 包边）。
  // ② focusin：任何路径焦点落到层外（含各类默认导航漏网）→ 立即拉回层内；
  //    close() 归位「摘」时由 closingRef 让路，T24 归位行为不变。
  // 陷阱只圈浮层本身，触发钮「摘」在层外，不含入；不重做摘录内容。
  // review-fix-integrity E：开浮层时置 body 旗标（ariadnePeek），会话级键盘环
  // （练/核/sticky/纸面）读 isPeekOpen() 让路；关闭/卸载即清，Esc/Tab trap 行为不变。
  useEffect(() => {
    if (!open) {
      closingRef.current = false;
      return;
    }
    closingRef.current = false;
    document.body.dataset.ariadnePeek = "1";
    const dlg = dialogRef.current;
    function focusableEls(): HTMLElement[] {
      if (!dlg) return [];
      return Array.from(
        dlg.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }
    // 开层：焦点移入第一个可聚焦控件（深链链接）；全无则落在浮层容器（tabIndex=-1）。
    const els = focusableEls();
    (els[0] ?? dlg)?.focus({ preventScroll: true });

    function pullBack() {
      if (!dlg || closingRef.current) return;
      if (dlg.contains(document.activeElement)) return;
      const f = focusableEls();
      (f[0] ?? dlg).focus({ preventScroll: true });
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !dlg) return;
      const f = focusableEls();
      if (f.length === 0) {
        e.preventDefault();
        dlg.focus({ preventScroll: true });
        return;
      }
      const firstEl = f[0];
      const lastEl = f[f.length - 1];
      const active = document.activeElement;
      const inside = dlg.contains(active);
      if (e.shiftKey) {
        if (!inside || active === firstEl) {
          e.preventDefault();
          lastEl.focus({ preventScroll: true });
        }
      } else {
        if (!inside || active === lastEl) {
          e.preventDefault();
          firstEl.focus({ preventScroll: true });
        }
      }
      // 兜底：部分宿主在事件派发后自行移动焦点且不发 focusin——
      // 事件循环后再校验一次焦点位置，逃出即拉回（真实浏览器为 no-op）。
      setTimeout(pullBack, 0);
    }
    // 捕获阶段监听：兼容不冒泡的合成 keydown / 宿主实现（真实浏览器行为一致）。
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("focusin", pullBack, true);
    return () => {
      delete document.body.dataset.ariadnePeek;
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusin", pullBack, true);
    };
  }, [open]);

  if (!cite) return null;
  const known = cite.page != null;
  /**
   * T53 C：书桌章页深链改走共享 helper（lib/ocr-page）——鬼页（bookValidPages 已装配
   * 且不含）→ null，nav 降纯文「本页无 OCR」；未装配 / 页∈OCR 行为与前同。
   * 核本页 / 练本页 / 核本卡 href 与 T49 空池门禁一概不动。
   */
  const deskPageLink =
    known && deskBookId
      ? buildDeskPageHref(deskBookId, cite.page as number, bookValidPages)
      : null;
  /** T35 A：核本页显式 mode=open（只改导航 href；quote/trap/定位不动）——落可见待核池，不被 sticky 空档回补。 */
  const reviewPageHref = known
    ? `/review?${deskBookId ? `book=${encodeURIComponent(deskBookId)}&` : ""}page=${cite.page}&mode=open`
    : undefined;
  /** T28 D：练本页深链（cite.page 与 deskBookId 都在才有）——显式 mode=all，
   *  与书桌练本页同款：落页队列可见，不被 sticky restore 成档空。 */
  const studyPageHref =
    known && deskBookId
      ? `/study?book=${encodeURIComponent(deskBookId)}&page=${cite.page}&mode=all`
      : undefined;
  /** T30 C：核本卡带书语境（有 deskBookId 时 /review?book=&card=）——从卡面/摘录进核不丢书。
   *  T35 A：显式 mode=open（同上，只改 href）。 */
  const reviewCardHref = cardId
    ? `/review?${deskBookId ? `book=${encodeURIComponent(deskBookId)}&` : ""}card=${encodeURIComponent(cardId)}&mode=open`
    : undefined;

  /**
   * T38 D：练/核深链（核本页 / 练本页 / 核本卡）点前写 return 短链——完成态「回到刚才」
   * 回书桌：有书有页回本页（书桌 p.N），仅书回书级，皆无不写（key 仍
   * ariadne.desk.return.v1，覆盖式单条）。只加 onClick：quote 截断 / trap / 定位 /
   * verified 文案 / 浮层布局一概不动。
   */
  function rememberPeekReturn() {
    // 渲染点必在 !cite 早退之后；函数体自带守卫只为过 TS 收窄（运行时恒真）。
    if (!deskBookId || !cite) return;
    const bookQ = `book=${encodeURIComponent(deskBookId)}`;
    saveReturn({
      href: cite.page != null ? `/desk?${bookQ}&page=${cite.page}` : `/desk?${bookQ}`,
      label: cite.page != null ? `书桌 p.${cite.page}` : "书桌",
      at: Date.now(),
    });
  }

  return (
    <span ref={rootRef} className="relative inline-flex items-center gap-1">
      <CiteChip cite={cite} q={q} deskBookId={deskBookId} bookValidPages={bookValidPages} ocrMiss={ocrMiss} />
      <button
        ref={toggleRef}
        onClick={() => (open ? close() : setOpen(true))}
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
            onClick={close}
            className="fixed inset-0 z-20 cursor-default"
            tabIndex={-1}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="引用摘录"
            tabIndex={-1}
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-30 w-72 max-h-[min(70vh,20rem)] overflow-y-auto rounded-lg border border-line bg-card p-3 shadow-md outline-none focus-visible:ring-2 focus-visible:ring-cinnabar/40"
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
              {/* T53 C：只动本 nav 行——「在书桌打开」鬼页（已知页但 deskPageLink 为 null）
                  降 muted 纯文「本页无 OCR」，不写 return 不装链；有 OCR 保持 Link + 记回程。 */}
              {deskPageLink ? (
                <Link
                  href={deskPageLink}
                  onClick={rememberPeekReturn}
                  className="text-cinnabar no-underline hover:underline underline-offset-4"
                >
                  在书桌打开 →
                </Link>
              ) : known && deskBookId ? (
                <span className="text-muted" title="该印刷页尚未解析 OCR——书桌章页定位不了">
                  本页无 OCR
                </span>
              ) : null}
              {reviewPageHref ? (
                pendingPageCount != null && pendingPageCount === 0 ? (
                  <span className="text-muted" title="本印刷页暂无待核 cite">
                    本页暂无待核
                  </span>
                ) : (
                  <Link
                    href={reviewPageHref}
                    onClick={rememberPeekReturn}
                    className="text-muted no-underline hover:text-cinnabar"
                  >
                    核本页 →
                  </Link>
                )
              ) : null}
              {studyPageHref ? (
                pageAtomCount != null && pageAtomCount === 0 ? (
                  <span className="text-muted" title="本印刷页暂无可练原子">
                    本页暂无原子
                  </span>
                ) : (
                  <Link
                    href={studyPageHref}
                    onClick={rememberPeekReturn}
                    className="text-muted no-underline hover:text-cinnabar"
                  >
                    练本页 →
                  </Link>
                )
              ) : null}
              {reviewCardHref ? (
                pendingCiteCount != null && pendingCiteCount === 0 ? (
                  <span className="text-muted" title="本卡暂无待核 cite">
                    本卡暂无待核
                  </span>
                ) : (
                  <Link
                    href={reviewCardHref}
                    onClick={rememberPeekReturn}
                    className="text-muted no-underline hover:text-cinnabar"
                  >
                    核本卡 →
                  </Link>
                )
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
