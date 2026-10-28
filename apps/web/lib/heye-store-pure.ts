/**
 * T91 机械抽出：原 lib/heye-store.ts pure 分区（filterItemsByMode · countPoolMarks）
 * 整段迁此——open / checked / doubt 过滤口径与三计口径逐字一致。
 * 本件纯函数：← ./heye-store-types.ts（type-only）；禁 import persist；
 * 无 window / 无 localStorage / 无 "use client"。
 */

import type { HeYeFilterable, HeYeMode, HeYeStore } from "./heye-store-types.ts";

/** 按档位过滤：open=无记录；checked=已对；doubt=存疑（保持传入顺序）。 */
export function filterItemsByMode<T extends HeYeFilterable>(
  items: T[],
  store: HeYeStore,
  mode: HeYeMode,
): T[] {
  if (mode === "checked") return items.filter((it) => store[it.key]?.s === "checked");
  if (mode === "doubt") return items.filter((it) => store[it.key]?.s === "doubt");
  return items.filter((it) => !store[it.key]);
}

/** 范围进度面：待核 / 已对 / 存疑（当前池子，本机态）。 */
export function countPoolMarks<T extends HeYeFilterable>(
  items: T[],
  store: HeYeStore,
): { open: number; checked: number; doubt: number } {
  let open = 0;
  let checked = 0;
  let doubt = 0;
  for (const it of items) {
    const m = store[it.key];
    if (!m) open++;
    else if (m.s === "checked") checked++;
    else doubt++;
  }
  return { open, checked, doubt };
}
