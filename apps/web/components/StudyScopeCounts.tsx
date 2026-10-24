"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { StudyAtom } from "@/lib/entities";
import {
  countPoolGrades,
  loadGrades,
  subscribeStudyGrades,
  type GradeMap,
} from "@/lib/study";

/** T35 C：三档深链（与 sticky 三档 / StudyModeChips 同一 qs({ mode }) 口径，由 study/page 下传）。 */
export type StudyScopeHrefs = { all?: string; unknown?: string; ungraded?: string };

/**
 * /study 页头的范围进度面：当前池子 认识 / 不熟 / 未评（本机 localStorage，跨刷新保留）。
 * 挂载后才读 localStorage（SSR 不读，避免水合不一致）；订阅 saveGrade 广播，
 * 学习会话里每评一张，这里同步刷新。绿/琥珀只作状态色，不作品牌色。
 * T35 C：分段计数可点——有 hrefs 且 N>0 时切到对应档（认识→all · 不熟→unknown · 未评→ungraded）；
 * N=0 或无 href 纯文。保持页头轻量文字链，不做第二排实心芯片（空/完成态 ModeChips 仍负责芯片 UI）。
 * T60 C：scope 浅密度旁挂（父页消费 T59 装配 examCoverage 同一份）——densityWeak 时
 * 行尾琥珀「浅S 页可考密度不足」。只旁挂提示：不改三档分段/N=0 纯文逻辑，不加实心芯片。
 */
export default function StudyScopeCounts({
  atoms,
  hrefs,
  densityWeak = false,
  shallowCount = 0,
}: {
  atoms: StudyAtom[];
  hrefs?: StudyScopeHrefs;
  /** T60 C：scope 浅密度偏弱（examCoverage.densityWeak；单卡/未检 → 缺省 false 不吵）。 */
  densityWeak?: boolean;
  /** T60 C：scope 浅页数（旁挂点名用，densityWeak 为 true 时才渲）。 */
  shallowCount?: number;
}) {
  const [grades, setGrades] = useState<GradeMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // T65 G：fail-closed——装载/订阅抛错仍 setReady(true)（空计数），绝不永挂「读取中」。
    try {
      setGrades(loadGrades());
      setReady(true);
      return subscribeStudyGrades(() => setGrades(loadGrades()));
    } catch {
      setReady(true);
      return;
    }
  }, []);

  if (!ready) {
    return <p className="mt-2 text-xs text-muted">本机进度读取中…</p>;
  }

  const c = countPoolGrades(atoms, grades);

  /** 分段：N>0 且有 href → 文字链（同色 + hover 下划线）；否则纯文（不编行动）。 */
  function seg(n: number, label: string, href: string | undefined, toneCls: string) {
    const text = (
      <>
        {label} {n}
      </>
    );
    if (href && n > 0) {
      return (
        <Link
          href={href}
          className={`${toneCls} no-underline hover:underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-cinnabar`}
        >
          {text}
        </Link>
      );
    }
    return <span className={toneCls}>{text}</span>;
  }

  return (
    <p className="mt-2 text-xs text-muted">
      本机进度（仅这个浏览器）：{" "}
      {seg(c.known, "认识", hrefs?.all, "text-status-ok")}
      <span className="text-status-warn"> · </span>
      {seg(c.unknown, "不熟", hrefs?.unknown, "text-status-warn")}
      <span> · </span>
      {seg(c.ungraded, "未评", hrefs?.ungraded, "")}
      {/* T60 C：浅密度旁挂——池内原子 ≠ 可考够（浅页已 cite 但原子极稀）；好范围/未检不吵。 */}
      {densityWeak && shallowCount > 0 ? (
        <span className="text-status-warn"> · 浅{shallowCount} 页可考密度不足</span>
      ) : null}
    </p>
  );
}
