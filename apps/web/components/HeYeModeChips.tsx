"use client";

import Link from "next/link";
import type { HeYeMode } from "@/lib/heye-store";

/**
 * 档位芯片（T25 A）：待核/已对/存疑 本机计数，可点切档（URL 规则与 sticky 三档一致）；
 * 当前档高亮。扫视控件，非掌握色环；仅在池空/档内空态出现，核中不插队。
 * T38 E：本档 N=0 且非当前档 → 纯文 span（边框保留、无 hover，不假装能点进空池）；
 * N>0 且有 href 仍 Link；当前档无论计数保持指示（有 href 为 Link + 当前样式，无则
 * 当前样式 span）。空/完成态主 CTA「回待核档 / 去学习环」是切档主路径，不受影响。
 */
export function HeYeModeChips({
  counts,
  mode,
  hrefs,
}: {
  counts: { open: number; checked: number; doubt: number };
  mode: HeYeMode;
  hrefs: Record<HeYeMode, string | undefined>;
}) {
  const rows: [HeYeMode, string, number][] = [
    ["open", "待核", counts.open],
    ["checked", "已对", counts.checked],
    ["doubt", "存疑", counts.doubt],
  ];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {rows.map(([m, label, n]) => {
        const text = `${label} ${n}`;
        if (n === 0 && mode !== m) {
          return (
            <span
              key={m}
              aria-disabled="true"
              title="本档暂无记录"
              className="cursor-default rounded-full border border-line px-3 py-1 text-xs text-muted"
            >
              {text}
            </span>
          );
        }
        const cls = `rounded-full border px-3 py-1 text-xs no-underline transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
          mode === m
            ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
            : "border-line text-muted hover:border-cinnabar hover:text-cinnabar"
        }`;
        return hrefs[m] ? (
          <Link key={m} href={hrefs[m] as string} className={cls}>
            {text}
          </Link>
        ) : (
          <span key={m} className={cls}>
            {text}
          </span>
        );
      })}
    </div>
  );
}
