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
  type GradeMap,
  type StudyMode,
} from "@/lib/study";
import { clearCursor, loadCursor, saveCursor } from "@/lib/session-continuity";
import { loadLastOpened } from "@/lib/last-opened";
import { loadReturn, saveReturn, type ReturnEntry } from "@/lib/return-stack";
import { isEditableTarget, isPeekOpen } from "@/lib/keyboard";
import SessionKeyHint from "@/components/SessionKeyHint";

/**
 * 档位芯片（T25 A + T26 C）：认识/不熟/未评 本机计数，可点切到对应档
 * （认识→全部、不熟→不熟再练、未评→未评；URL 规则与 sticky 三档一致）。
 * 当前档朱红 soft 高亮（对齐 HeYeModeChips）；扫视控件，非掌握色环；
 * 仅在空/完成态出现，练中不插队。
 * T38 E：本档 N=0 且非当前档 → 纯文 span（边框保留作扫视分组，无 hover、不可点进空池）；
 * N>0 仍 Link；当前档无论计数恒 Link + aria-current（档位指示不丢）。空/完成态主 CTA
 * 「切到全部 / 只练不熟」是切档主路径，不依赖这些芯片，故空芯片降级不断路。
 */
function StudyModeChips({
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
  ungradedHref,
  widenPageHref,
  deskPageHint,
  deskBookId,
  loopKeys,
  scopeKey,
  validPages,
  leaveReturnTo,
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
  /** 档位芯片「未评」目标：同范围 ?mode=ungraded（T25 A）。 */
  ungradedHref: string;
  /**
   * T28 C：本页档空的放宽链（清 page + mode=all，服务端拼好）——空档区次级文字链
   * 「清本页，看本章全部 →」；仅有效 pageNum 时传入。仍只保留一颗实心主 CTA。
   */
  widenPageHref?: string;
  /** 单卡首个有页 cite 页码（服务端给）：完成/空态回书桌本页的页来源之一。 */
  deskPageHint?: number | null;
  /** 当前范围书 id（scopeBook，含单卡反查）：回书桌本页 / last-opened 回落以它为准。 */
  deskBookId?: string;
  /**
   * T29 E：父页算好的本页环键（g 清本页 / ⇧[ ⇧] 切章；与 sticky 键岛同源 stickyKeys）——
   * 仅当前真可用时传入；无本页过滤不列 g，无章芯片不列 ⇧[]。题内裸 [ / ] 仍是回看/前进。
   */
  loopKeys?: [string, string][];
  /** 续位作用域（与父级 remount key 一致）：`${card|all}:${book|all}:${chapter|all}:${mode}`。 */
  scopeKey: string;
  /**
   * T32 E：该书已解析印刷页[]（服务端装配）——完成/空态「回书桌本页」的 lastOpened
   * 回落页消毒：仅当 lo.page 在表内才采用；无表 / 脏页 → 不采用（与 ReturnNav 同真，
   * 不盲信 localStorage）。页源优先级不变：lastAtomPage ?? deskPageHint ?? lastOpenedPage。
   */
  validPages?: number[];
  /**
   * T42 B/D：离面链（去核页/核本卡交叉 + 题头卡名开卡）点前的 return payload——
   * 父传 studyReturnTo（与页头 Strip / sticky CrossScope 同一份，禁第二套）；缺省不写，
   * 行为与前同。回书桌/回本卡链**不写**（那是回程不是进环，避免互谎）。
   * key 仍 ariadne.desk.return.v1。
   */
  leaveReturnTo?: { href: string; label: string };
}) {
  const [grades, setGrades] = useState<GradeMap>({});
  const [order, setOrder] = useState<StudyAtom[]>([]);
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [run, setRun] = useState({ known: 0, unknown: 0 });
  /** 本标签续位标记（恢复游标 >0 时置位）——用于诚实续练文案。 */
  const [resumed, setResumed] = useState(false);
  /** 最近一个带页 cite 的原子页码（完成态回书桌本页的第一优先页源）。 */
  const [lastAtomPage, setLastAtomPage] = useState<number | null>(null);
  /** loadLastOpened() 同书页码（第三优先页源，客户端回落）。 */
  const [lastOpenedPage, setLastOpenedPage] = useState<number | null>(null);
  /** 「回到刚才」return 短链（出发写于书桌/卡枢纽）。 */
  const [ret, setRet] = useState<ReturnEntry | null>(null);
  /**
   * 本轮撤销栈（T25 B，薄；组件态，不跨会话持久化）：
   * 每次评分压入 { key, prev, idx }——prev=被覆盖的旧档（null=原无记录），idx=评分时游标。
   * u/z 弹栈回退；换范围/再来一轮即清空。
   */
  const [undoStack, setUndoStack] = useState<
    { key: string; prev: 0 | 1 | null; idx: number }[]
  >([]);
  const questionRef = useRef<HTMLElement | null>(null);

  /** 同书 last-opened 页码 + return 短链（客户端读，SSR 不读 localStorage/sessionStorage）。 */
  useEffect(() => {
    const scopeBookId = deskBookId ?? activeBookId;
    if (scopeBookId) {
      const lo = loadLastOpened();
      // T32 E：只信有表且页在表内的 lo.page（与 ReturnNav 同真）——无表 / 脏页不采用，
      // 完成态不把幽灵 p.999 链进书桌；页源优先级 lastAtomPage ?? deskPageHint 不变。
      const adopt =
        lo?.bookId === scopeBookId && lo.page != null && validPages?.includes(lo.page);
      setLastOpenedPage(adopt ? (lo.page as number) : null);
    }
    setRet(loadReturn());
  }, [deskBookId, activeBookId, validPages]);

  // 挂载后读本机评分并冻结本轮队列（SSR 不读 localStorage，避免水合不一致）；
  // 同时恢复本标签会话游标（clamp 到 [0, order.length]，>0 视为续练）。
  useEffect(() => {
    const g = loadGrades();
    const ordered = orderAtoms(filterAtomsByMode(atoms, g, mode));
    setGrades(g);
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

  /** 回书桌本页 / 回书桌：页来源优先级 = 当前原子 cite.page → 单卡首个有页 cite(pageHint) → last-opened 同书 page。 */
  const deskBackBookId = deskBookId ?? activeBookId;
  const deskBackPage = lastAtomPage ?? deskPageHint ?? lastOpenedPage;
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

  /** 队列空（档位过滤后无原子）：诚实说明 + 一颗主 CTA + 次级文字链 + 档位芯片（本机计数可切档）。
   *  T28 C：文案必须报池大小与本档计数——池里有原子但本档为 0 时，禁止说成「这个范围没有原子」。 */
  if (order.length === 0) {
    return (
      <section className="mt-10 rounded-lg border border-line bg-card p-6">
        <h2 className="text-xl font-semibold">这个队列是空的</h2>
        <p className="mt-3 text-sm leading-7 text-foreground/90">
          {mode === "ungraded"
            ? `本范围有 ${atoms.length} 个原子，未评的是 ${pool.ungraded}——都评过了，没有未评的原子可练。`
            : mode === "unknown"
              ? `本范围有 ${atoms.length} 个原子，标「不熟」的是 ${pool.unknown}。先在「全部」或「未评」里标几张不熟，再回来只练它们。`
              : "当前范围没有可练的原子。"}
        </p>
        <StudyModeChips
          pool={pool}
          mode={mode}
          hrefs={{ all: allHref, unknown: unknownHref, ungraded: ungradedHref }}
        />
        {/* T25 A densify：一颗朱红主 CTA，其余一律次级文字链（勿一排多颗实心按钮）。 */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          {mode !== "all" ? (
            <Link
              href={allHref}
              className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline transition-opacity hover:opacity-90"
            >
              切到「全部」
            </Link>
          ) : null}
          {/* T28 C：本页过滤时并列放宽链（清 page 落全部档；次级文字，不加第二颗实心）。 */}
          {widenPageHref ? (
            <Link
              href={widenPageHref}
              className="text-sm text-muted no-underline hover:text-cinnabar"
            >
              清本页，看本章全部 →
            </Link>
          ) : null}
          {cardHref ? (
            <>
              <Link
                href={cardHref}
                className="text-sm text-muted no-underline hover:text-cinnabar"
              >
                回本卡 →
              </Link>
              {/* T42 B：交叉进核点前写 leaveReturnTo（回本学习环），与 sticky CrossScope 同真。 */}
              <Link
                href={reviewHref}
                onClick={leaveReturnTo ? rememberLeave : undefined}
                className="text-sm text-muted no-underline hover:text-cinnabar"
              >
                核本卡 →
              </Link>
            </>
          ) : (
            <Link
              href={reviewHref}
              onClick={leaveReturnTo ? rememberLeave : undefined}
              className="text-sm text-muted no-underline hover:text-cinnabar"
            >
              去核页 →
            </Link>
          )}
          <Link href={deskBackHref} className="text-sm text-muted no-underline hover:text-cinnabar">
            {deskBackLabel}
          </Link>
          {ret ? (
            <Link href={ret.href} title={ret.label} className="text-sm text-muted no-underline hover:text-cinnabar">
              回到刚才 →
            </Link>
          ) : null}
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
    const key = atomKey(cur);
    // 压撤销栈：读盘面最新值当 prev（避免闭包陈旧）；idx 记评分时游标，供 u/z 回退。
    setUndoStack((s) => [...s, { key, prev: loadGrades()[key]?.k ?? null, idx }]);
    const next = saveGrade(key, k);
    setGrades(next);
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
    setGrades(last.prev == null ? deleteGrade(last.key) : saveGrade(last.key, last.prev));
    setUndoStack((s) => s.slice(0, -1));
    setRevealed(false);
    setIdx(last.idx);
  }

  function restart() {
    // 用最新本机评分重新过滤（如「不熟再练」里已转认识的不再出现），重置本轮。
    clearCursor("study", scopeKey);
    const g = loadGrades();
    setGrades(g);
    setOrder(orderAtoms(filterAtomsByMode(atoms, g, mode)));
    setIdx(0);
    setRevealed(false);
    setRun({ known: 0, unknown: 0 });
    setResumed(false);
    setUndoStack([]);
  }

  if (done || !cur) {
    return (
      <section className="mt-10 rounded-lg border border-line bg-card p-6">
        <h2 className="text-xl font-semibold">本轮完成</h2>
        <p className="mt-3 text-sm leading-7 text-foreground/90">
          共 {order.length} 个原子 · 本轮 认识 {run.known} · 不熟 {run.unknown}。
        </p>
        {resumed ? (
          <p aria-live="polite" className="mt-2 text-xs leading-5 text-muted">
            已从本标签续上（完成态）；本轮 run 计数不持久化，从 0 起。
          </p>
        ) : null}
        <StudyModeChips
          pool={pool}
          mode={mode}
          hrefs={{ all: allHref, unknown: unknownHref, ungraded: ungradedHref }}
        />
        {/* T25 A densify：一颗朱红主 CTA（再来一轮），其余一律次级文字链。 */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            onClick={restart}
            className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 motion-reduce:transition-none"
          >
            再来一轮
          </button>
          {mode !== "unknown" ? (
            <Link
              href={unknownHref}
              className="text-sm text-muted no-underline hover:text-cinnabar"
            >
              只练不熟 →
            </Link>
          ) : null}
          {cardHref ? (
            <>
              <Link
                href={cardHref}
                className="text-sm text-muted no-underline hover:text-cinnabar"
              >
                回本卡 →
              </Link>
              {/* T42 B：交叉进核点前写 leaveReturnTo（回本学习环），与 sticky CrossScope 同真。 */}
              <Link
                href={reviewHref}
                onClick={leaveReturnTo ? rememberLeave : undefined}
                className="text-sm text-muted no-underline hover:text-cinnabar"
              >
                核本卡 →
              </Link>
            </>
          ) : (
            <Link
              href={reviewHref}
              onClick={leaveReturnTo ? rememberLeave : undefined}
              className="text-sm text-muted no-underline hover:text-cinnabar"
            >
              去核页 →
            </Link>
          )}
          <Link href={deskBackHref} className="text-sm text-muted no-underline hover:text-cinnabar">
            {deskBackLabel}
          </Link>
          {ret ? (
            <Link href={ret.href} title={ret.label} className="text-sm text-muted no-underline hover:text-cinnabar">
              回到刚才 →
            </Link>
          ) : null}
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
