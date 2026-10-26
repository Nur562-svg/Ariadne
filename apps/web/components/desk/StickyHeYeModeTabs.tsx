"use client";

import Link from "next/link";
import type { HeYeItem } from "@/lib/heye";
import { countPoolMarks, type HeYeMode } from "@/lib/heye-store";
import { useHeYeStore } from "@/lib/use-heye-store";

/**
 * /review sticky 档位 tablist 薄客户端岛（T41 B，对称 StickyStudyModeTabs）。
 * 门控与 HeYeModeChips（T38 E）/ HeYeScopeCounts（T35 D）同口径同池：
 * countPoolMarks（挂载后读 ariadne.heye.v1 + 订阅打标广播）——待核/已对/存疑
 * n===0 且非当前档 → 纯文 span（aria-disabled，保 tab chrome 不可点）；当前档无论 n
 * 保持指示（aria-selected + bg-cinnabar text-white）。非 Due / 非 FSRS 文案语义不变；
 * HeYeScopeCounts / orphan 主 CTA / CrossScopeReturnLink 不在本岛职责内。
 * T48 E：档位标签后缀标 N（与门控 countOf 同源，视觉对齐 T47 SectionToc 计数 mono 后缀）——
 * 核中看得见各档存量；SSR/首帧空仓如实标 0（禁止造假正数，T71 起 store 无 null 态）；
 * N=0 非当前档纯文降级契约不变（本刀只加展示，不改 T41 门禁）。
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
  // T71：共享 useSyncExternalStore 口——SSR/首帧空仓即合法口径（0 是真实空档读数，
  // 不造假正数；落盘后微任务内切真值）。T48 的「未 ready 不显数字」随 null-store
  // 概念一并退役：空档如实标 0、非当前档 N=0 纯文降级契约不变。
  const store = useHeYeStore();

  const marks = countPoolMarks(items, store);
  /** 档计数（空仓 → 0，如实；非当前档 0 仍纯文降级）。 */
  const countOf = (m: HeYeMode): number | null => marks[m];

  return (
    <div
      role="tablist"
      aria-label="核页队列档位"
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-card p-1.5"
    >
      {TABS.map(([m, label]) => {
        const n = countOf(m);
        const current = mode === m;
        // T48 E：档计数后缀真 N（含 0——空档如实标 0，不造假正数）。
        const countTag = n != null ? (
          <span className="mono ml-1.5 text-[11px] font-normal">{n}</span>
        ) : null;
        // 当前档恒保持指示；非当前且 N=0 → 纯文，不进空池。
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
              {countTag}
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
            {countTag}
          </Link>
        );
      })}
    </div>
  );
}
