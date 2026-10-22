"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { StudyAtom } from "@/lib/entities";
import {
  countPoolGrades,
  loadGrades,
  subscribeStudyGrades,
  type GradeMap,
  type StudyMode,
} from "@/lib/study";

/**
 * /study sticky 档位 tablist 薄客户端岛（T41 A）。
 * 缺口：原 Server 裸 MODES.map Link 恒可点——本机 N=0 的「不熟再练 / 未评」也装能点进空池。
 * 门控（与页头 StudyScopeCounts 同源池、同计数口径）：
 * - all 用 atoms.length（队列全集，非本机态）；
 * - unknown/ungraded 用 countPoolGrades 池计数（挂载后读 ariadne.study.v1 + 订阅广播）；
 * - n===0 且非当前档 → 纯文 span（aria-disabled + title，保 tab chrome 不可点）；
 * - 当前档无论 n 保持指示（aria-selected + bg-cinnabar text-white，恒可点自指刷新）。
 * 未 ready（首帧未读本机盘）：非当前档一律纯文——宁可少一帧可点，不渲染可点谎言。
 * 视觉保持既有 sticky tab chrome（rounded-md tab，非 ModeChips 圆 pill）；空/完成态
 * StudyModeChips（T38 E）不动、不插进练中会话；StickyModeGate / ScopeCounts / 章芯片 /
 * 清本页 / CrossScopeReturnLink 均不在本岛职责内。
 */
const TABS: [StudyMode, string][] = [
  ["all", "全部"],
  ["ungraded", "未评"],
  ["unknown", "不熟再练"],
];

export default function StickyStudyModeTabs({
  mode,
  atoms,
  hrefs,
}: {
  mode: StudyMode;
  /** 与页头 StudyScopeCounts 同源池（collectStudyAtoms 全量，非档位过滤后）。 */
  atoms: StudyAtom[];
  /** 三档深链（study/page qs({ mode })，保留 card/book/chapter/page）。 */
  hrefs: { all: string; unknown: string; ungraded: string };
}) {
  const [grades, setGrades] = useState<GradeMap | null>(null);

  useEffect(() => {
    setGrades(loadGrades());
    return subscribeStudyGrades(() => setGrades(loadGrades()));
  }, []);

  const pool = grades ? countPoolGrades(atoms, grades) : null;
  /** 门控计数：all=池全集；unknown/ungraded=本机档计数（未 ready → null，全部按空处理）。 */
  const countOf = (m: StudyMode): number | null => {
    if (m === "all") return atoms.length;
    if (!pool) return null;
    return m === "unknown" ? pool.unknown : pool.ungraded;
  };

  return (
    <div
      role="tablist"
      aria-label="练习队列"
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-card p-1.5"
    >
      {TABS.map(([m, label]) => {
        const n = countOf(m);
        const current = mode === m;
        // 当前档恒保持指示（可点自指）；非当前且 N=0（含未 ready）→ 纯文，不进空池。
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
