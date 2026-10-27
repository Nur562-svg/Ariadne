"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StudyAtom } from "@/lib/entities";
import CitePeek from "@/components/CitePeek";
import {
  atomKey,
  countPoolGrades,
  deleteGrade,
  filterAtomsByMode,
  loadGrades,
  orderAtoms,
  saveGrade,
} from "@/lib/study";
import { useStudyGrades } from "@/lib/use-study-grades";
import { clearCursor, loadCursor, saveCursor } from "@/lib/session-continuity";
import { loadLastOpened } from "@/lib/last-opened";
import { loadReturnOnce, saveReturn } from "@/lib/return-stack";
import { useClientOnce } from "@/lib/use-client-once";
import { pageInOcr } from "@/lib/ocr-page";
import { isEditableTarget, isPeekOpen } from "@/lib/keyboard";
import SessionKeyHint from "@/components/SessionKeyHint";
import type { StudySessionProps } from "@/components/study-session-props";
import StudyEmptyMode from "@/components/StudyEmptyMode";
import StudyEmptyPool from "@/components/StudyEmptyPool";

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
  pendingCount = 0,
  cardHref,
  allHref,
  unknownHref,
  ungradedHref,
  widenPageHref,
  deskPageHint,
  deskBookId,
  loopKeys,
  scopeKey,
  validPages,
  leaveReturnTo,
  examinableWeak,
  darkCount,
  densityWeak,
  shallowCount,
}: StudySessionProps) {
  // T71：共享 useSyncExternalStore 口——grades 只此一源（评分/撤销走写 API + 订阅回流，
  // 不再本地 setGrades 镜像）；SSR/首帧空仓即合法口径，落盘后微任务内切真值。
  const grades = useStudyGrades();
  const [order, setOrder] = useState<StudyAtom[]>([]);
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [run, setRun] = useState({ known: 0, unknown: 0 });
  /** 本标签续位标记（恢复游标 >0 时置位）——用于诚实续练文案。 */
  const [resumed, setResumed] = useState(false);
  /** 最近一个带页 cite 的原子页码（完成态回书桌本页的第一优先页源）。 */
  const [lastAtomPage, setLastAtomPage] = useState<number | null>(null);
  /**
   * 本轮撤销栈（T25 B，薄；组件态，不跨会话持久化）：
   * 每次评分压入 { key, prev, idx }——prev=被覆盖的旧档（null=原无记录），idx=评分时游标。
   * u/z 弹栈回退；换范围/再来一轮即清空。
   */
  const [undoStack, setUndoStack] = useState<
    { key: string; prev: 0 | 1 | null; idx: number }[]
  >([]);
  const questionRef = useRef<HTMLElement | null>(null);

  // T72：last-opened 页码 + return 短链改 noop-uSES 一次性采纳（SSR/水合首帧恒 null
  // 不水合错位，水合后读一次；props 变化重渲染即以新闭包重采）。T32 E 消毒口径不变：
  // 只信有表且页在表内的 lo.page——无表 / 脏页不采用，完成态不把幽灵 p.999 链进书桌；
  // 页源优先级 lastAtomPage ?? deskPageHint 不变。
  const lastOpenedPage = useClientOnce<number | null>(() => {
    const scopeBookId = deskBookId ?? activeBookId;
    if (!scopeBookId) return null;
    const lo = loadLastOpened();
    return lo?.bookId === scopeBookId && lo.page != null && validPages?.includes(lo.page)
      ? (lo.page as number)
      : null;
  }, null);
  /** 「回到刚才」return 短链（出发写于书桌/卡枢纽）。 */
  const ret = useClientOnce(loadReturnOnce, null);

  // 挂载后冻结本轮队列（SSR 不读 localStorage，避免水合不一致）；同时恢复本标签会话
  // 游标（clamp 到 [0, order.length]，>0 视为续练）。
  // T71 DEFER: one-shot 冻结 — 非 uSES：order 只在 atoms/mode/scopeKey 变化时重算，
  // **不随中途 grades 变化重滤重排**（合同：本轮 order 挂载时冻结）。此处直读一次
  // 盘面当冻结基准（一次性读、不订阅）；grades 计数本身已走 uSES（见上）。
  useEffect(() => {
    const g = loadGrades();
    const ordered = orderAtoms(filterAtomsByMode(atoms, g, mode));
    setOrder(ordered);
    const saved = loadCursor("study", scopeKey);
    if (saved != null && saved > 0) {
      setIdx(Math.min(saved, ordered.length));
      setResumed(true);
    }
    setReady(true);
  }, [atoms, mode, scopeKey]);

  /** 可编辑目标（输入框/文本域/下拉/富文本）不拦截键盘（含 activeElement 兜底）。 */
  function silentKeyTarget(target: EventTarget | null): boolean {
    return isEditableTarget(target);
  }

  /**
   * 键盘环（T18 基础 + T25 B 对称）：空格 揭示（已揭示 no-op）；1/j 认识、2/k 不熟
   * （未揭示先揭示一次）；←/[/→/] 在本轮 order 内回看/前进（不改评分，切题即收起答案，
   * 边界 no-op）；u/z 撤销本轮最后一次评分（无栈 no-op）。
   * 挂在 window，可编辑目标静默；空队列/完成态直接忽略，不拦浏览器默认。
   */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (silentKeyTarget(e.target)) return;
      // 「摘」浮层开着：让路（不评分、不切题）——关掉浮层即恢复（review-fix-integrity E）。
      if (isPeekOpen()) return;
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
      } else if (e.key === "ArrowLeft" || e.key === "[") {
        // 回看：只动游标，不动评分；收起答案让回看者先见题面。
        e.preventDefault();
        if (idx > 0) {
          setRevealed(false);
          setIdx(idx - 1);
        }
      } else if (e.key === "ArrowRight" || e.key === "]") {
        // 前进：不越过最后一题（完成态只能靠评分自然到达）。
        e.preventDefault();
        if (idx < order.length - 1) {
          setRevealed(false);
          setIdx(idx + 1);
        }
      } else if (e.key === "u" || e.key === "z") {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, order, idx, revealed, grades, undoStack]);

  /** 游标写回：ready 后 idx 每次变化写 sessionStorage（续位用；跨刷新保留于本标签）。 */
  useEffect(() => {
    if (!ready) return;
    saveCursor("study", scopeKey, idx);
  }, [ready, idx, scopeKey]);

  /** 焦点跟当前题：续位后 / 每次切题，焦点落到题面主容器（tabIndex=-1，屏幕阅读器可读）。 */
  useEffect(() => {
    if (ready && idx < order.length) questionRef.current?.focus({ preventScroll: true });
  }, [ready, idx, order.length]);

  const pool = useMemo(() => countPoolGrades(atoms, grades), [atoms, grades]);

  /**
   * 回书桌本页 / 回书桌：页来源优先级 = 当前原子 cite.page → 单卡首个有页 cite(pageHint) → last-opened 同书 page。
   * T53 F：deskBackPage 过 pageInOcr(validPages)——原子 cite / pageHint 可指向该书未解析的
   * 鬼页（last-opened 侧 T32 E 已消毒，atom 侧此前未跟）；∉ 表回落书级 deskHref /
   * 「回书桌 →」，不拼鬼 &page=。validPages 未装配 → 不门禁（与 T32 E 同契约）。
   */
  const deskBackBookId = deskBookId ?? activeBookId;
  const rawDeskBackPage = lastAtomPage ?? deskPageHint ?? lastOpenedPage;
  const deskBackPage =
    rawDeskBackPage != null && pageInOcr(validPages, rawDeskBackPage) ? rawDeskBackPage : null;
  const deskBackHref =
    deskBackPage != null && deskBackBookId
      ? `/desk?book=${encodeURIComponent(deskBackBookId)}&page=${deskBackPage}`
      : deskHref;
  const deskBackLabel = deskBackPage != null && deskBackBookId ? "回书桌本页 →" : "回书桌 →";

  /** T42 B/D：离面前写 leaveReturnTo（父传 studyReturnTo，与页头 Strip/CrossScope 同源）；缺省 no-op。 */
  function rememberLeave() {
    if (leaveReturnTo) saveReturn({ ...leaveReturnTo, at: Date.now() });
  }

  if (atoms.length === 0) return null;

  /** 本机评分读取中：服务端/首帧一致占位，读完再出题。 */
  if (!ready) {
    return <p className="mt-8 text-sm text-muted">正在读取本机自评进度…</p>;
  }

  // ---- 空态分支（T79 机械抽至 StudyEmptyPool / StudyEmptyMode；ungradedDone 分型 /
  // pendingCount 门禁 / T58·T60 旁挂 / 文案 / class / href 逐段同 tip）----

  /** 队列空（档位过滤后无原子）：诚实说明 + 主 CTA + 次级链 + 档位芯片。 */
  if (order.length === 0) {
    return (
      <StudyEmptyPool
        mode={mode}
        pool={pool}
        atomTotal={atoms.length}
        allHref={allHref}
        unknownHref={unknownHref}
        ungradedHref={ungradedHref}
        widenPageHref={widenPageHref}
        cardHref={cardHref}
        pendingCount={pendingCount}
        reviewHref={reviewHref}
        deskBackHref={deskBackHref}
        deskBackLabel={deskBackLabel}
        ret={ret}
        rememberLeave={rememberLeave}
        leaveReturnTo={leaveReturnTo}
        examinableWeak={examinableWeak}
        darkCount={darkCount}
        densityWeak={densityWeak}
        shallowCount={shallowCount}
      />
    );
  }

  const done = idx >= order.length;
  const cur = done ? undefined : order[idx];
  /** CiteChip 深链书：优先当前 ?book=，否则按 atom 所在章反查。 */
  const curDeskBookId =
    activeBookId ?? (cur?.chapterId ? bookByChapter[cur.chapterId] : undefined);

  function grade(k: 0 | 1) {
    if (!cur) return;
    const key = atomKey(cur);
    // 压撤销栈：读盘面最新值当 prev（避免闭包陈旧）；idx 记评分时游标，供 u/z 回退。
    setUndoStack((s) => [...s, { key, prev: loadGrades()[key]?.k ?? null, idx }]);
    // T71：写 API 落盘 + 广播 → uSES 回流驱动计数（不再本地 setGrades 镜像）。
    saveGrade(key, k);
    setRun((r) => ({ known: r.known + (k === 1 ? 1 : 0), unknown: r.unknown + (k === 0 ? 1 : 0) }));
    if (cur.cite?.page != null) setLastAtomPage(cur.cite.page);
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  /**
   * 撤销本轮最后一次评分（T25 B，u/z）：写回 prevGrade（原无记录则删 key）、
   * 游标回到评分时位置、本轮 run 计数回滚（扣掉应用档，补回被覆盖的旧档）。
   * 无栈 no-op；栈不跨会话，refresh 后即清。
   */
  function undo() {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    const applied = loadGrades()[last.key]?.k;
    setRun((r) => {
      let known = r.known;
      let unknown = r.unknown;
      if (applied === 1) known = Math.max(0, known - 1);
      else if (applied === 0) unknown = Math.max(0, unknown - 1);
      if (last.prev === 1) known += 1;
      else if (last.prev === 0) unknown += 1;
      return { known, unknown };
    });
    // T71：写 API 落盘 + 广播 → uSES 回流（返回值不再镜像进本地 state）。
    if (last.prev == null) deleteGrade(last.key);
    else saveGrade(last.key, last.prev);
    setUndoStack((s) => s.slice(0, -1));
    setRevealed(false);
    setIdx(last.idx);
  }

  function restart() {
    // 用最新本机评分重新过滤（如「不熟再练」里已转认识的不再出现），重置本轮。
    // 显式重开是用户动作：直读一次盘面当冻结基准（grades 计数走 uSES，不镜像）。
    clearCursor("study", scopeKey);
    const g = loadGrades();
    setOrder(orderAtoms(filterAtomsByMode(atoms, g, mode)));
    setIdx(0);
    setRevealed(false);
    setRun({ known: 0, unknown: 0 });
    setResumed(false);
    setUndoStack([]);
  }

  /** 本轮完成：run 计数 + T58/T60 旁挂 + 续位提示 + 「再来一轮」+ 档位芯片。 */
  if (done || !cur) {
    return (
      <StudyEmptyMode
        mode={mode}
        pool={pool}
        orderLength={order.length}
        run={run}
        resumed={resumed}
        restart={restart}
        allHref={allHref}
        unknownHref={unknownHref}
        ungradedHref={ungradedHref}
        cardHref={cardHref}
        pendingCount={pendingCount}
        reviewHref={reviewHref}
        deskBackHref={deskBackHref}
        deskBackLabel={deskBackLabel}
        ret={ret}
        rememberLeave={rememberLeave}
        leaveReturnTo={leaveReturnTo}
        examinableWeak={examinableWeak}
        darkCount={darkCount}
        densityWeak={densityWeak}
        shallowCount={shallowCount}
      />
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

      {resumed ? (
        <p
          aria-live="polite"
          className="mt-2 border-l-2 border-line pl-3 text-xs leading-5 text-muted"
        >
          已从本标签续上：第 {idx + 1} / {order.length} 个原子（仅当前标签会话，非跨设备同步）。
        </p>
      ) : null}

      <article
        ref={questionRef}
        tabIndex={-1}
        className="mt-6 rounded-lg border border-line bg-card p-6 outline-none focus-visible:ring-2 focus-visible:ring-cinnabar/40"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {/* T42 D：练中开卡旁路点前写 leaveReturnTo——回当前学习环（与交叉链同一 payload）。 */}
          <Link
            href={`/desk/card/${encodeURIComponent(cur.cardId)}`}
            onClick={leaveReturnTo ? rememberLeave : undefined}
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
                {/* T19：裸 CiteChip → CitePeek（旁路「摘」浮层 + 深链）；无 cite 不渲染。
                    T49 F：atoms 池只有本原子自身 cite，无卡级引用全集/待核队列——
                    pageAtomCount（cardsCitingPage 口径）/pendingPageCount/pendingCiteCount
                    三数都取不出真值，按 D 契约省略不传（浮层保持既有链，不造假正数）。 */}
                <CitePeek
                  cite={cur.cite}
                  q={cur.answer.slice(0, 24)}
                  deskBookId={curDeskBookId}
                  cardId={cur.cardId}
                />
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
      {/* T25 B：键说明一族风格（muted 小字 + mono 键帽）。
          T28 F→T29 E：本页环键（g 清本页 / ⇧[] 切章）由父页按当前真可用性传入 loopKeys
          （与 sticky 键岛同源）——无本页过滤不列 g，无章芯片不列 ⇧[]；
          题内裸 [ / ] 仍是回看/前进，不受影响。
          T44 A：键帽与 onKey 同真——回看/前进拆两行列出 [ 与 ]，撤销列 u/z（不再漏键）。 */}
      <SessionKeyHint
        className="mt-1"
        keys={[
          ["空格", "显示答案"],
          ["1/j", "认识"],
          ["2/k", "不熟"],
          ["←/[", "回看"],
          ["→/]", "前进"],
          ["u/z", "撤销本轮最后一评"],
          ...(loopKeys ?? []),
        ]}
      />
    </section>
  );
}
