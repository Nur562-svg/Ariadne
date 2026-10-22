"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HeYeItem } from "@/lib/heye";
import {
  countPoolMarks,
  loadHeYeStore,
  subscribeHeYeStore,
  type HeYeMode,
  type HeYeStore,
} from "@/lib/heye-store";

/**
 * /review sticky 档位 tablist 薄客户端岛（T41 B，对称 StickyStudyModeTabs）。
 * 门控与 HeYeModeChips（T38 E）/ HeYeScopeCounts（T35 D）同口径同池：
 * countPoolMarks（挂载后读 ariadne.heye.v1 + 订阅打标广播）——待核/已对/存疑
 * n===0 且非当前档 → 纯文 span（aria-disabled，保 tab chrome 不可点）；当前档无论 n
 * 保持指示（aria-selected + bg-cinnabar text-white）。未 ready 首帧非当前档一律纯文，
 * 不渲染可点谎言。非 Due / 非 FSRS 文案语义不变；HeYeScopeCounts / orphan 主 CTA /
 * CrossScopeReturnLink 不在本岛职责内。
 */
const TABS: [HeYeMode, string][] = [
  ["open", "待核"],
  ["checked", "已对"],
  ["doubt", "存疑"],
];

export default function StickyHeYeModeTabs({
  mode,
  items,
  hrefs,
}: {
  mode: HeYeMode;
  /** 与页头 HeYeScopeCounts 同源池（collectCiteQueue 全量，非档位过滤后）。 */
  items: HeYeItem[];
  /** 三档深链（review/page qs({ mode })，保留 book/card/chapter/page）。 */
  hrefs: { open: string; checked: string; doubt: string };
}) {
  const [store, setStore] = useState<HeYeStore | null>(null);

  useEffect(() => {
    setStore(loadHeYeStore());
    return subscribeHeYeStore(() => setStore(loadHeYeStore()));
  }, []);

  const marks = store ? countPoolMarks(items, store) : null;
  /** 档计数（未 ready → null，按空处理：非当前档纯文）。 */
  const countOf = (m: HeYeMode): number | null => {
    if (!marks) return null;
    return marks[m];
  };

  return (
    <div
      role="tablist"
      aria-label="核页队列档位"
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-card p-1.5"
    >
      {TABS.map(([m, label]) => {
        const n = countOf(m);
        const current = mode === m;
        // 当前档恒保持指示；非当前且 N=0（含未 ready）→ 纯文，不进空池。
        if (!current && (n === 0 || n == null)) {
          return (
            <span
              key={m}
              role="tab"
              aria-selected={false}
              aria-disabled="true"
              title="本档暂无记录"
              className="cursor-default rounded-md px-5 py-1.5 text-sm text-muted"
            >
              {label}
            </span>
          );
        }
        return (
          <Link
            key={m}
            role="tab"
            aria-selected={current}
            href={hrefs[m]}
            className={`rounded-md px-5 py-1.5 text-sm no-underline transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
              current
                ? "bg-cinnabar text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
