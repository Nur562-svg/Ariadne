"use client";

import { useEffect, useState } from "react";
import { loadGrades, subscribeStudyGrades, type GradeMap } from "@/lib/study";
import { loadHeYeStore, subscribeHeYeStore, type HeYeStore } from "@/lib/heye-store";

/**
 * 本页卡轨「本机态」客户岛（Task 24 B）：每张卡只读 ariadne.study.v1 / ariadne.heye.v1，
 * 按卡汇总一行薄文案——练：认识/不熟/未评；核：已对/存疑；某类无本机记录诚实标「—」
 * （待核数需服务端池子，这里不编）。键前缀匹配：练 = `<cardId>/<atomId>`；核 citeKey 以
 * `<cardId>|` 打头（lib/heye.ts push 规则），因此无需原子 id 即可按卡聚合。
 * 禁止掌握 %、色环、Due 角标、假「本页已全核」绿条；仅本浏览器记录，与 seed verified 无关。
 */
export default function PageCardRailMarks({
  cardId,
  atomCount,
}: {
  cardId: string;
  /** 卡内原子总数（未评 = 总数 − 已评，只作减法展示，不编数据）。 */
  atomCount: number;
}) {
  const [grades, setGrades] = useState<GradeMap>({});
  const [heye, setHeYe] = useState<HeYeStore>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setGrades(loadGrades());
    setHeYe(loadHeYeStore());
    setReady(true);
    const u1 = subscribeStudyGrades(() => setGrades(loadGrades()));
    const u2 = subscribeHeYeStore(() => setHeYe(loadHeYeStore()));
    return () => {
      u1();
      u2();
    };
  }, []);

  if (!ready) return null;

  const studyPrefix = `${cardId}/`;
  let known = 0;
  let unknown = 0;
  for (const [k, g] of Object.entries(grades)) {
    if (!k.startsWith(studyPrefix)) continue;
    if (g.k === 1) known++;
    else unknown++;
  }
  const ungraded = Math.max(0, atomCount - known - unknown);

  const heyePrefix = `${cardId}|`;
  let checked = 0;
  let doubt = 0;
  for (const [k, m] of Object.entries(heye)) {
    if (!k.startsWith(heyePrefix)) continue;
    if (m.s === "checked") checked++;
    else doubt++;
  }

  const hasStudy = known + unknown > 0;
  const hasHeye = checked + doubt > 0;

  return (
    <p className="mt-0.5 text-[11px] leading-4 text-muted" aria-label={`${cardId} 的本机练/核标记`}>
      练{" "}
      {hasStudy ? (
        <>
          认识 <span className="text-status-ok">{known}</span>
          <span className="text-status-warn"> · 不熟 {unknown}</span>
          {ungraded > 0 ? <> · 未评 {ungraded}</> : null}
        </>
      ) : (
        "—"
      )}
      <span className="mx-1.5 text-line">|</span>
      核{" "}
      {hasHeye ? (
        <>
          <span className="text-status-ok">已对 {checked}</span>
          <span className="text-status-warn"> · 存疑 {doubt}</span>
        </>
      ) : (
        "—"
      )}
    </p>
  );
}
