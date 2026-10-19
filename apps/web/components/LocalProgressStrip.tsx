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

/** 池内练计数（只用 cardId/atomId 键；池原子无需完整 StudyAtom）。 */
function poolGrades(
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
 * 跨面本机进度条（T17）：练（认识/不熟/未评）+ 核（待核/已对/存疑）分列。
 * 只读 ariadne.study.v1 / ariadne.heye.v1 本机记录，不引入新存储，不合成掌握度。
 * - atoms / items 传池时按池范围计数（书桌书头、卡枢纽）；
 * - 不传池时只显示本机已记录的项（未评/待核需池，省略，不编数）。
 * 免责固定：仅这个浏览器 · 非掌握度 · 非 Due · 与 seed verified 无关。
 */
export default function LocalProgressStrip({
  atoms,
  items,
  compact,
  scopeLabel,
  studyHref,
  reviewHref,
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

  const studyPart = (
    <>
      练 <span className="text-status-ok">认识 {pool ? pool.known : globalKnown}</span>
      <span className="text-status-warn"> · 不熟 {pool ? pool.unknown : globalUnknown}</span>
      {pool ? <span> · 未评 {pool.ungraded}</span> : null}
    </>
  );
  const heyePart = (
    <>
      核{" "}
      {marks ? <span>待核 {marks.open}</span> : null}
      <span className="text-status-ok"> · 已对 {marks ? marks.checked : globalChecked}</span>
      <span className="text-status-warn"> · 存疑 {marks ? marks.doubt : globalDoubt}</span>
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