"use client";

import { useEffect, useState } from "react";
import type { StudyAtom } from "@/lib/entities";
import {
  countPoolGrades,
  loadGrades,
  subscribeStudyGrades,
  type GradeMap,
} from "@/lib/study";

/**
 * /study 页头的范围进度面：当前池子 认识 / 不熟 / 未评（本机 localStorage，跨刷新保留）。
 * 挂载后才读 localStorage（SSR 不读，避免水合不一致）；订阅 saveGrade 广播，
 * 学习会话里每评一张，这里同步刷新。绿/琥珀只作状态色，不作品牌色。
 */
export default function StudyScopeCounts({ atoms }: { atoms: StudyAtom[] }) {
  const [grades, setGrades] = useState<GradeMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setGrades(loadGrades());
    setReady(true);
    return subscribeStudyGrades(() => setGrades(loadGrades()));
  }, []);

  if (!ready) {
    return <p className="mt-2 text-xs text-muted">本机进度读取中…</p>;
  }

  const c = countPoolGrades(atoms, grades);

  return (
    <p className="mt-2 text-xs text-muted">
      本机进度（仅这个浏览器）：
      <span className="text-status-ok"> 认识 {c.known}</span>
      <span className="text-status-warn"> · 不熟 {c.unknown}</span>
      <span> · 未评 {c.ungraded}</span>
    </p>
  );
}
