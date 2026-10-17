"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StudyAtom } from "@/lib/entities";
import { CiteChip } from "@/components/CiteChip";

const STORE_KEY = "ariadne.study.v1";

export type GradeMap = Record<string, { k: 0 | 1; t: number }>;

function loadGrades(): GradeMap {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as GradeMap) : {};
  } catch {
    return {};
  }
}

/** atomId 在卡内唯一；跨卡用 cardId 组合成全局键。 */
function keyOf(a: StudyAtom): string {
  return `${a.cardId}/${a.atomId}`;
}

/** 确定性顺序（章 → 卡 → 按 prompt），服务端/客户端一致，避免 hydration 错位。 */
function orderAtoms(atoms: StudyAtom[]): StudyAtom[] {
  return atoms.slice().sort((a, b) => {
    const byChapter = (a.chapterId ?? "").localeCompare(b.chapterId ?? "");
    if (byChapter !== 0) return byChapter;
    const byCard = a.cardId.localeCompare(b.cardId);
    if (byCard !== 0) return byCard;
    return a.prompt.localeCompare(b.prompt);
  });
}

/**
 * atom 自评环：prompt → 揭示 answer → 自评 认识/不熟 → 下一个。
 * 进度写 localStorage（ariadne.study.v1），跨刷新保留；评分不改变 cite 语义。
 * 换范围时父级用 key 重挂载以重置本轮进度。
 */
export default function StudySession({
  atoms,
  scopeLabel,
  diffLabel,
}: {
  atoms: StudyAtom[];
  scopeLabel: string;
  diffLabel: Record<string, string>;
}) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [run, setRun] = useState({ known: 0, unknown: 0 });
  const [grades, setGrades] = useState<GradeMap>(() =>
    typeof window === "undefined" ? {} : loadGrades(),
  );

  const order = useMemo(() => orderAtoms(atoms), [atoms]);

  const poolGraded = useMemo(() => {
    let known = 0;
    let unknown = 0;
    for (const a of atoms) {
      const g = grades[keyOf(a)];
      if (!g) continue;
      if (g.k === 1) known++;
      else unknown++;
    }
    return { known, unknown };
  }, [atoms, grades]);

  if (atoms.length === 0) return null;

  const done = idx >= order.length;
  const cur = done ? undefined : order[idx];

  function grade(k: 0 | 1) {
    if (!cur) return;
    const key = keyOf(cur);
    const next: GradeMap = { ...grades, [key]: { k, t: Date.now() } };
    setGrades(next);
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* 隐私模式等场景写失败不阻塞自评 */
    }
    setRun((r) => ({ known: r.known + (k === 1 ? 1 : 0), unknown: r.unknown + (k === 0 ? 1 : 0) }));
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  function restart() {
    setIdx(0);
    setRevealed(false);
    setRun({ known: 0, unknown: 0 });
  }

  if (done || !cur) {
    return (
      <section className="mt-10 rounded-lg border border-line bg-card p-6">
        <h2 className="text-xl font-semibold">本轮完成</h2>
        <p className="mt-3 text-sm leading-7 text-foreground/90">
          共 {order.length} 个原子 · 认识 {run.known} · 不熟 {run.unknown}。
          本范围累计（跨刷新保留）：认识 {poolGraded.known} · 不熟 {poolGraded.unknown} · 未评{" "}
          {atoms.length - poolGraded.known - poolGraded.unknown}。
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={restart}
            className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white transition-colors hover:opacity-90 motion-reduce:transition-none"
          >
            再来一轮
          </button>
          <Link
            href="/entities"
            className="rounded-md border border-line px-4 py-2 text-sm text-muted no-underline hover:text-foreground"
          >
            浏览实体卡
          </Link>
        </div>
      </section>
    );
  }

  const progress = Math.round((idx / order.length) * 100);

  return (
    <section className="mt-8">
      {/* 进度（aria 可见文本） */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-muted">
        <span aria-live="polite">
          第 {idx + 1} / {order.length} 个原子
        </span>
        <span>
          本轮 认识 {run.known} · 不熟 {run.unknown}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={idx}
        aria-valuemin={0}
        aria-valuemax={order.length}
        aria-label="本轮进度"
        className="mt-2 h-0.5 w-full bg-line"
      >
        <div className="h-0.5 bg-cinnabar" style={{ width: `${progress}%` }} />
      </div>

      <article className="mt-6 rounded-lg border border-line bg-card p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link
            href={`/entities/${cur.cardId}`}
            className="font-medium text-cinnabar no-underline hover:underline underline-offset-4"
          >
            {cur.cardName}
          </Link>
          {cur.chapterId ? <span className="mono">{cur.chapterId}</span> : null}
          <span className="mono rounded border border-line px-1.5 py-0.5 text-[11px]">
            {diffLabel[cur.difficulty] ?? cur.difficulty}
          </span>
        </div>

        <p className="mt-4 text-lg font-medium leading-8" aria-live="polite">
          {cur.prompt}
        </p>

        {revealed ? (
          <div className="mt-4 border-l-2 border-cinnabar/40 pl-4">
            <p className="text-sm leading-7 text-foreground/90">{cur.answer}</p>
            {cur.cite ? (
              <div className="mt-2">
                <CiteChip cite={cur.cite} q={cur.answer.slice(0, 24)} />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setRevealed((v) => !v)}
            aria-expanded={revealed}
            className="rounded-md border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-cinnabar hover:text-cinnabar motion-reduce:transition-none"
          >
            {revealed ? "收起答案" : "显示答案"}
          </button>
          {revealed ? (
            <span className="flex items-center gap-3">
              <button
                onClick={() => grade(1)}
                className="rounded-md border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-cinnabar hover:text-cinnabar motion-reduce:transition-none"
              >
                认识
              </button>
              <button
                onClick={() => grade(0)}
                className="rounded-md border border-cinnabar/60 px-4 py-2 text-sm text-cinnabar transition-colors hover:bg-cinnabar hover:text-white motion-reduce:transition-none"
              >
                不熟
              </button>
            </span>
          ) : null}
        </div>
      </article>

      <p className="mt-4 text-xs text-muted">
        范围：{scopeLabel} · 评分只记本机浏览器；citation 徽章语义不变（未验证仍为琥珀）。
      </p>
    </section>
  );
}