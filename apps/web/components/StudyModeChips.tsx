"use client";

import Link from "next/link";
import type { StudyMode } from "@/lib/study";

/**
 * 档位芯片（T25 A + T26 C）：认识/不熟/未评 本机计数，可点切到对应档
 * （认识→全部、不熟→不熟再练、未评→未评；URL 规则与 sticky 三档一致）。
 * 当前档朱红 soft 高亮（对齐 HeYeModeChips）；扫视控件，非掌握色环；
 * 仅在空/完成态出现，练中不插队。
 * T38 E：本档 N=0 且非当前档 → 纯文 span（边框保留作扫视分组，无 hover、不可点进空池）；
 * N>0 仍 Link；当前档无论计数恒 Link + aria-current（档位指示不丢）。空/完成态主 CTA
 * 「切到全部 / 只练不熟」是切档主路径，不依赖这些芯片，故空芯片降级不断路。
 */
export function StudyModeChips({
  pool,
  mode,
  hrefs,
}: {
  pool: { known: number; unknown: number; ungraded: number };
  mode: StudyMode;
  hrefs: { all: string; unknown: string; ungraded: string };
}) {
  const rows: { label: string; m: StudyMode; n: number; href: string; title: string }[] = [
    { label: "认识", m: "all", n: pool.known, href: hrefs.all, title: "切到「全部」档" },
    { label: "不熟", m: "unknown", n: pool.unknown, href: hrefs.unknown, title: "切到「不熟再练」档" },
    { label: "未评", m: "ungraded", n: pool.ungraded, href: hrefs.ungraded, title: "切到「未评」档" },
  ];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted">本范围本机：</span>
      {rows.map(({ label, m, n, href, title }) =>
        n === 0 && mode !== m ? (
          <span
            key={label}
            aria-disabled="true"
            title="本档暂无记录"
            className="cursor-default rounded-full border border-line px-3 py-1 text-xs text-muted"
          >
            {label} {n}
          </span>
        ) : (
          <Link
            key={label}
            href={href}
            title={title}
            aria-current={mode === m ? "true" : undefined}
            className={`rounded-full border px-3 py-1 text-xs no-underline transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
              mode === m
                ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                : "border-line text-muted hover:border-cinnabar hover:text-cinnabar"
            }`}
          >
            {label} {n}
          </Link>
        ),
      )}
    </div>
  );
}
