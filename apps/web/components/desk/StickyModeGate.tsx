"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { loadStickyMode, saveStickyMode, type SessionKind } from "@/lib/session-continuity";

/**
 * 薄 sticky 档位门（T20 desk-session-continuity-01）：只做 URL 补齐，不整页重载、不加闪烁动画。
 *
 * - URL 里有合法 ?mode= → 用之并写回本标签 sticky（含默认档，覆盖旧记忆；非法值不写，交服务端琥珀警告回落）。
 * - URL 没有 ?mode= → 读本标签 sticky；若非默认档，则 `router.replace` 补齐 mode，
 *   保留 book/card/page/chapter 其余查询参数（`searchParams.toString()` 原样携带）。
 *
 * 渲染为 null；仅在挂载时执行一次（`done` ref 抵御 React StrictMode 双跑）。
 */
export default function StickyModeGate({
  kind,
  scopeKey,
  defaultMode,
  nonDefaultModes,
}: {
  kind: SessionKind;
  /** sticky 作用域（不含 mode），由服务端页用与 remount key 对齐的片段拼接。 */
  scopeKey: string;
  defaultMode: string;
  /** 值得持久化并用于 replace 补齐的非默认档（不含 defaultMode）。 */
  nonDefaultModes: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /**
   * 审计 + 最小修（review-fix-integrity G）：App Router 软导航改 qs 时本组件**不重挂**，
   * 旧 `done = useRef(false)` 换范围后永真 → 新作用域的 sticky 档位记忆永不补齐。
   * 改为按 `${kind}:${scopeKey}` 记忆——同一范围只跑一次（StrictMode 双跑抵御依旧），
   * 换书/章/卡/页（scopeKey 变）即重新对齐 URL 与 sticky。
   */
  const doneFor = useRef<string | null>(null);

  useEffect(() => {
    const gateKey = `${kind}:${scopeKey}`;
    if (doneFor.current === gateKey) return;
    doneFor.current = gateKey;

    const validModes = [defaultMode, ...nonDefaultModes];
    const mode = searchParams.get("mode");

    if (mode) {
      // 合法档（含默认）写回 sticky；非法档不写（服务端已回落，勿污染记忆）。
      if (validModes.includes(mode)) saveStickyMode(kind, scopeKey, mode);
      return;
    }

    const sticky = loadStickyMode(kind, scopeKey);
    if (sticky && nonDefaultModes.includes(sticky)) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("mode", sticky);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }
  }, [kind, scopeKey, defaultMode, nonDefaultModes, pathname, router, searchParams]);

  return null;
}