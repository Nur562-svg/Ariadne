"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  atomKey,
  loadGrades,
  subscribeStudyGrades,
  type GradeMap,
} from "@/lib/study";
import {
  countPoolMarks,
  loadHeYeStore,
  subscribeHeYeStore,
  type HeYeStore,
} from "@/lib/heye-store";
import type { StudyScopeHrefs } from "@/components/StudyScopeCounts";
import type { HeYeScopeHrefs } from "@/components/HeYeScopeCounts";

/**
 * 池内练计数（只用 cardId/atomId 键；池原子无需完整 StudyAtom）。
 * T33 C：导出供 Clew QueuePanel 复用——与条内计数同一口径，不另写一份分叉逻辑。
 */
export function poolGrades(
  atoms: { cardId: string; atomId: string }[],
  grades: GradeMap,
): { known: number; unknown: number; ungraded: number } {
  let known = 0;
  let unknown = 0;
  for (const a of atoms) {
    const g = grades[atomKey(a)];
    if (!g) continue;
    if (g.k === 1) known++;
    else unknown++;
  }
  return { known, unknown, ungraded: atoms.length - known - unknown };
}

/**
 * T36 A 共用小 helper withQsMode(href, mode)（URLSearchParams 只换 mode 档）见 lib/qs-mode.ts——
 * 放无 "use client" 的 lib 供 server 页面（study/review/书架/卡详情）与 client 岛共用；
 * 分段深链一律从同一对 progress* 与 strip* href 派生，不出现第二套 book/chapter/page 解析。
 */

/**
 * 跨面本机进度条（T17）：练（认识/不熟/未评）+ 核（待核/已对/存疑）分列。
 * 只读 ariadne.study.v1 / ariadne.heye.v1 本机记录，不引入新存储，不合成掌握度。
 * - atoms / items 传池时按池范围计数（书桌书头、卡枢纽）；
 * - 不传池时只显示本机已记录的项（未评/待核需池，省略，不编数）。
 * T36 A：池分段可点——有池且有对应 mode href 时，分段 N>0 变文字链进同范围档
 * （练：认识→all · 不熟→unknown · 未评→ungraded；核：待核→open · 已对→checked ·
 * 存疑→doubt），视觉对齐 StudyScopeCounts/HeYeScopeCounts 的 seg 族；N=0 / 无 href /
 * 无池（global 已记录计数）→ 纯文，不编全书假档链。条末「练/核此范围」保留不动。
 * 免责固定：仅这个浏览器 · 非掌握度 · 非 Due · 与 seed verified 无关。
 */
export default function LocalProgressStrip({
  atoms,
  items,
  compact,
  scopeLabel,
  studyHref,
  reviewHref,
  studyModeHrefs,
  heyeModeHrefs,
}: {
  /** 范围池：练的原子（只要 cardId/atomId 做键）。缺省 → 全局已记录计数。 */
  atoms?: { cardId: string; atomId: string }[];
  /** 范围池：核的 cite 项（只要 key 做键）。缺省 → 全局已记录计数。 */
  items?: { key: string }[];
  /** 紧凑单行（Clew 内用）。 */
  compact?: boolean;
  /** 作用域标注（本章 / 本页 p.N / 本卡 / 本书）。 */
  scopeLabel?: string;
  /** 同范围练入口（未评/认识数…不单做数字链接，条末文字链更克制）。 */
  studyHref?: string;
  /** 同范围核入口。 */
  reviewHref?: string;
  /** T36 A：练池三档深链（all/unknown/ungraded）——仅池计数消费；global 分段不链。 */
  studyModeHrefs?: StudyScopeHrefs;
  /** T36 A：核池三档深链（open/checked/doubt）——仅池计数消费；global 分段不链。 */
  heyeModeHrefs?: HeYeScopeHrefs;
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

  if (!ready) {
    return (
      <p className="text-xs text-muted">
        {compact ? "本机进度读取中…" : "本机进度读取中…"}
      </p>
    );
  }

  // 练：有池按池（认识/不熟/未评），无池只报全局已记录条数。
  const pool = atoms ? poolGrades(atoms, grades) : null;
  const globalKnown = Object.values(grades).filter((g) => g.k === 1).length;
  const globalUnknown = Object.values(grades).filter((g) => g.k === 0).length;

  // 核：有池按池（待核/已对/存疑），无池只报全局已记录条数。
  const marks = items ? countPoolMarks(items, heye) : null;
  const globalChecked = Object.values(heye).filter((m) => m.s === "checked").length;
  const globalDoubt = Object.values(heye).filter((m) => m.s === "doubt").length;

  /**
   * T36 A 分段：N>0 且有 href → 文字链（同色 + hover 下划线，对齐 ScopeCounts seg 族）；
   * 否则纯文。href 只在有池时采信——global 已记录计数没有对应档池，不编假档链。
   */
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

  const studyPart = (
    <>
      练{" "}
      {seg(pool ? pool.known : globalKnown, "认识", pool ? studyModeHrefs?.all : undefined, "text-status-ok")}
      <span className="text-status-warn"> · </span>
      {seg(pool ? pool.unknown : globalUnknown, "不熟", pool ? studyModeHrefs?.unknown : undefined, "text-status-warn")}
      {pool ? (
        <>
          <span> · </span>
          {seg(pool.ungraded, "未评", studyModeHrefs?.ungraded, "")}
        </>
      ) : null}
    </>
  );
  const heyePart = (
    <>
      核{" "}
      {marks ? (
        <>
          {seg(marks.open, "待核", heyeModeHrefs?.open, "")}
          <span className="text-status-ok"> · </span>
        </>
      ) : null}
      {seg(marks ? marks.checked : globalChecked, "已对", marks ? heyeModeHrefs?.checked : undefined, "text-status-ok")}
      <span className="text-status-warn"> · </span>
      {seg(marks ? marks.doubt : globalDoubt, "存疑", marks ? heyeModeHrefs?.doubt : undefined, "text-status-warn")}
    </>
  );

  return (
    <p
      className={`text-xs text-muted ${compact ? "leading-5" : "mt-2 leading-6"}`}
      aria-label="本机学习与核页进度"
    >
      {scopeLabel ? <span className="mr-2 text-foreground/80">{scopeLabel}</span> : null}
      {studyPart}
      <span className={compact ? "mx-2 text-line" : "mx-3 text-line"}>|</span>
      {heyePart}
      {studyHref ? (
        <Link
          href={studyHref}
          className="ml-2 text-cinnabar no-underline hover:underline underline-offset-4"
        >
          练此范围 →
        </Link>
      ) : null}
      {reviewHref ? (
        <Link
          href={reviewHref}
          className="ml-1 text-cinnabar no-underline hover:underline underline-offset-4"
        >
          核此范围 →
        </Link>
      ) : null}
      <span className="ml-2">
        · 仅这个浏览器 · 非掌握度 · 非 Due · 与 seed verified 无关
      </span>
    </p>
  );
}
