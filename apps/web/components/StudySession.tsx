"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { StudyAtom } from "@/lib/entities";
import { CiteChip } from "@/components/CiteChip";
import {
  atomKey,
  countPoolGrades,
  filterAtomsByMode,
  loadGrades,
  orderAtoms,
  saveGrade,
  type GradeMap,
  type StudyMode,
} from "@/lib/study";
import { isEditableTarget } from "@/lib/keyboard";

/**
 * atom 自评环：prompt → 揭示 answer → 自评 认识/不熟 → 下一个。
 * 队列三档（全部｜未评｜不熟再练）是本机态过滤，不是 FSRS 到期调度；
 * 进度写 localStorage（ariadne.study.v1），跨刷新保留；评分不改变 cite 语义。
 * 换范围/档位时父级用 key 重挂载；挂载后读本机评分并冻结本轮队列，
 * 避免「不熟再练」里评分把当前原子从队列抽走导致跳题。
 */
export default function StudySession({
  atoms,
  scopeLabel,
  diffLabel,
  mode,
  activeBookId,
  bookByChapter,
  deskHref,
  reviewHref,
  cardHref,
  allHref,
  unknownHref,
}: {
  /** 当前范围全池（未按档位过滤；档位在客户端按本机评分过滤）。 */
  atoms: StudyAtom[];
  scopeLabel: string;
  diffLabel: Record<string, string>;
  /** 队列档位：all 全部｜ungraded 未评｜unknown 不熟再练。 */
  mode: StudyMode;
  /** 当前 ?book=（有值时 CiteChip 优先深链书桌章页）。 */
  activeBookId?: string;
  /** 章 → 书反查（books.json）：无 ?book= 时按 atom 所在章找书。 */
  bookByChapter: Record<string, string>;
  /** 完成态 / 空队列回链：书桌与核页（有书带 book 参数）。 */
  deskHref: string;
  reviewHref: string;
  /** 单卡范围（/study?card=）：完成/空态改为「回本卡」「核本卡」，回书桌让位为次要链。 */
  cardHref?: string;
  /** 「只练不熟」与空队列回链：同范围切档 URL。 */
  allHref: string;
  unknownHref: string;
}) {
  const [grades, setGrades] = useState<GradeMap>({});
  const [order, setOrder] = useState<StudyAtom[]>([]);
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [run, setRun] = useState({ known: 0, unknown: 0 });

  // 挂载后读本机评分并冻结本轮队列（SSR 不读 localStorage，避免水合不一致）。
  useEffect(() => {
    const g = loadGrades();
    setGrades(g);
    setOrder(orderAtoms(filterAtomsByMode(atoms, g, mode)));
    setReady(true);
  }, [atoms, mode]);

  /** 可编辑目标（输入框/文本域/下拉/富文本）不拦截键盘（含 activeElement 兜底）。 */
  function silentKeyTarget(target: EventTarget | null): boolean {
    return isEditableTarget(target);
  }

  /**
   * 键盘环（T18）：空格 揭示（已揭示 no-op）；1/j 认识、2/k 不熟（未揭示先揭示一次）。
   * 挂在 window，可编辑目标静默；空队列/完成态直接忽略，不拦浏览器默认。
   */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (silentKeyTarget(e.target)) return;
      if (!ready || order.length === 0 || idx >= order.length) return;
      if (e.key === " ") {
        e.preventDefault();
        if (!revealed) setRevealed(true);
        return;
      }
      if (e.key === "1" || e.key === "j") {
        e.preventDefault();
        if (!revealed) {
          setRevealed(true);
          return;
        }
        grade(1);
      } else if (e.key === "2" || e.key === "k") {
        e.preventDefault();
        if (!revealed) {
          setRevealed(true);
          return;
        }
        grade(0);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, order, idx, revealed]);

  const pool = useMemo(() => countPoolGrades(atoms, grades), [atoms, grades]);

  if (atoms.length === 0) return null;

  /** 本机评分读取中：服务端/首帧一致占位，读完再出题。 */
  if (!ready) {
    return <p className="mt-8 text-sm text-muted">正在读取本机自评进度…</p>;
  }

  /** 队列空（档位过滤后无原子）：诚实说明 + 切档 / 回书桌 / 核页。 */
  if (order.length === 0) {
    return (
      <section className="mt-10 rounded-lg border border-line bg-card p-6">
        <h2 className="text-xl font-semibold">这个队列是空的</h2>
        <p className="mt-3 text-sm leading-7 text-foreground/90">
          {mode === "ungraded"
            ? "当前范围的原子都评过了——没有未评的。"
            : mode === "unknown"
              ? "当前范围没有标「不熟」的原子。先在「全部」或「未评」里标几张不熟，再回来只练它们。"
              : "当前范围没有可练的原子。"}
          本范围累计（仅这个浏览器）：认识 {pool.known} · 不熟 {pool.unknown} · 未评{" "}
          {pool.ungraded}。
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {mode !== "all" ? (
            <Link
              href={allHref}
              className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline transition-opacity hover:opacity-90"
            >
              切到「全部」
            </Link>
          ) : null}
          {cardHref ? (
            <>
              <Link
                href={cardHref}
                className="rounded-md border border-line px-4 py-2 text-sm text-foreground no-underline hover:border-cinnabar hover:text-cinnabar"
              >
                回本卡
              </Link>
              <Link
                href={reviewHref}
                className="rounded-md border border-line px-4 py-2 text-sm text-muted no-underline hover:text-foreground"
              >
                核本卡
              </Link>
              <Link
                href={deskHref}
                className="text-sm text-muted no-underline hover:text-cinnabar"
              >
                回书桌
              </Link>
            </>
          ) : (
            <>
              <Link
                href={deskHref}
                className="rounded-md border border-line px-4 py-2 text-sm text-muted no-underline hover:text-foreground"
              >
                回书桌
              </Link>
              <Link
                href={reviewHref}
                className="rounded-md border border-line px-4 py-2 text-sm text-muted no-underline hover:text-foreground"
              >
                去核页
              </Link>
            </>
          )}
        </div>
      </section>
    );
  }

  const done = idx >= order.length;
  const cur = done ? undefined : order[idx];
  /** CiteChip 深链书：优先当前 ?book=，否则按 atom 所在章反查。 */
  const curDeskBookId =
    activeBookId ?? (cur?.chapterId ? bookByChapter[cur.chapterId] : undefined);

  function grade(k: 0 | 1) {
    if (!cur) return;
    const next = saveGrade(atomKey(cur), k);
    setGrades(next);
    setRun((r) => ({ known: r.known + (k === 1 ? 1 : 0), unknown: r.unknown + (k === 0 ? 1 : 0) }));
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  function restart() {
    // 用最新本机评分重新过滤（如「不熟再练」里已转认识的不再出现），重置本轮。
    const g = loadGrades();
    setGrades(g);
    setOrder(orderAtoms(filterAtomsByMode(atoms, g, mode)));
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
          本范围累计（仅这个浏览器，跨刷新保留）：认识 {pool.known} · 不熟 {pool.unknown} · 未评{" "}
          {pool.ungraded}。
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={restart}
            className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 motion-reduce:transition-none"
          >
            再来一轮
          </button>
          {mode !== "unknown" ? (
            <Link
              href={unknownHref}
              className="rounded-md border border-line px-4 py-2 text-sm text-foreground no-underline hover:border-cinnabar hover:text-cinnabar"
            >
              只练不熟
            </Link>
          ) : null}
          {cardHref ? (
            <>
              <Link
                href={cardHref}
                className="rounded-md border border-line px-4 py-2 text-sm text-foreground no-underline hover:border-cinnabar hover:text-cinnabar"
              >
                回本卡
              </Link>
              <Link
                href={reviewHref}
                className="rounded-md border border-line px-4 py-2 text-sm text-muted no-underline hover:text-foreground"
              >
                核本卡
              </Link>
              <Link
                href={deskHref}
                className="text-sm text-muted no-underline hover:text-cinnabar"
              >
                回书桌
              </Link>
            </>
          ) : (
            <>
              <Link
                href={deskHref}
                className="rounded-md border border-line px-4 py-2 text-sm text-muted no-underline hover:text-foreground"
              >
                回书桌
              </Link>
              <Link
                href={reviewHref}
                className="rounded-md border border-line px-4 py-2 text-sm text-muted no-underline hover:text-foreground"
              >
                去核页
              </Link>
            </>
          )}
        </div>
      </section>
    );
  }

  const progress = Math.round((idx / order.length) * 100);
  const modeLabel = mode === "all" ? "全部" : mode === "ungraded" ? "未评" : "不熟再练";

  return (
    <section className="mt-8">
      {/* 进度（aria 可见文本） */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-muted">
        <span aria-live="polite">
          队列「{modeLabel}」 · 第 {idx + 1} / {order.length} 个原子
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
            href={`/desk/card/${encodeURIComponent(cur.cardId)}`}
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
                <CiteChip cite={cur.cite} q={cur.answer.slice(0, 24)} deskBookId={curDeskBookId} />
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
        范围：{scopeLabel} · 评分只记本机浏览器（非 FSRS 调度）；citation 徽章语义不变（未验证仍为琥珀）。
      </p>
      <p className="mt-1 text-xs text-muted">
        键：空格 显示答案 · <span className="mono">1</span>/<span className="mono">j</span> 认识 ·{" "}
        <span className="mono">2</span>/<span className="mono">k</span> 不熟（未显示时先显示）。
      </p>
    </section>
  );
}
