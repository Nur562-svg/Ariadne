"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isEditableTarget, isPeekOpen } from "@/lib/keyboard";

/**
 * study/review sticky 工具带键盘岛（T28 F）：
 * - g：有本页过滤时聚焦「清本页」链接（preventScroll，不抢滚动）；无页 no-op。
 * - Shift+[ / Shift+]：切到章芯片上一/下一章（父页给同族 qs href——切章即离页）；边界 no-op。
 * 冲突硬规则：题内裸 [ / ] 是 StudySession/HeYeSession 的回看/前进——本组件只认
 * Shift 组合（按物理键 e.code 判定，布局无关），绝不拦截裸 [ / ]。
 * 可编辑目标静默（与练/核键盘环同款 isEditableTarget）。
 */
export default function StickyPageLoopKeys({
  clearPageSelector,
  prevChapterHref,
  nextChapterHref,
}: {
  /** 「清本页」链接选择器（sticky 工具带内 data 属性）；无本页过滤时不传 → g no-op。 */
  clearPageSelector?: string;
  /** 章芯片顺序的上一章 href（切章即离页）；首章边界不传 → no-op。 */
  prevChapterHref?: string;
  /** 章芯片顺序的下一章 href；末章边界不传 → no-op。 */
  nextChapterHref?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;
      // 「摘」浮层开着：让路（不聚焦清本页、不切章路由）——关掉即恢复（review-fix-integrity E）。
      if (isPeekOpen()) return;
      if (e.key === "g" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!clearPageSelector) return; // 无本页过滤：g 让位（no-op，不抢浏览器默认行为）。
        const el = document.querySelector<HTMLElement>(clearPageSelector);
        if (!el) return;
        e.preventDefault();
        el.focus({ preventScroll: true });
        return;
      }
      // Shift+[ / Shift+] 按物理键判定：US 布局 Shift+[ 产出 "{"，用 e.code 才稳；
      // 裸 [ / ]（shiftKey=false）不进本分支，归题内回看/前进。
      if (e.shiftKey && (e.code === "BracketLeft" || e.code === "BracketRight")) {
        const href = e.code === "BracketLeft" ? prevChapterHref : nextChapterHref;
        if (!href) return; // 边界 no-op
        e.preventDefault();
        router.push(href);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearPageSelector, prevChapterHref, nextChapterHref, router]);

  return null;
}
