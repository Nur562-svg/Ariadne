"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HeYeItem } from "@/lib/heye";
import type { Cite, PageDoc } from "@/lib/entities";
import CitePeek from "@/components/CitePeek";
import {
  countPoolMarks,
  filterItemsByMode,
  HEYE_STORE_KEY,
  loadHeYeStore,
  setHeYeMark,
  setHeYeMarks,
  type HeYeMode,
  type HeYeStore,
} from "@/lib/heye-store";
import { isEditableTarget } from "@/lib/keyboard";

/**
 * 核页对页会话（/review 中栏，客户端）：
 * 左 quote/上下文 ↔ 右该印刷页 OCR 原文（loadAllChapterPages 真页，服务端过滤后传入）。
 * 「本机已对 / 存疑」只写浏览器 localStorage（ariadne.heye.v1，lib/heye-store）——与 seed 抽查
 * verified 完全分离，绝不回写 data/cards（禁止 verified:true 过关）。
 * desk-heye-batch-filter-01（T16）：本机态三档（待核｜已对｜存疑）在客户端过滤可见队列；
 * 待核档提供同页批量「本机已对」（次级加速器，仍只写本浏览器）。
 */
export default function HeYeSession({
  items,
  pages,
  scopeLabel,
  mode,
  cardHref,
  studyHref,
  deskPageHref,
  openHref,
}: {
  /** 全池待核队列（服务端 collectCiteQueue，已按页码排序；本机态过滤在客户端）。 */
  items: HeYeItem[];
  /** 队列涉及的 OCR 页（真 loadAllChapterPages 子集，按 page 索引）。 */
  pages: PageDoc[];
  /** 范围说明（全书库 / 某书书名 / 单卡卡名 / 章），用于副文。 */
  scopeLabel: string;
  /** 档位：待核｜已对｜存疑（本机态，非到期调度）。 */
  mode: HeYeMode;
  /** 单卡范围（/review?card=）：空队列/全部对过时链回本卡。 */
  cardHref?: string;
  /** 跨环学习链（有卡带 ?card=，否则 /study）。 */
  studyHref?: string;
  /** 单页范围（/review?page=）：空队列/全部对过时优先链回书桌本页（/desk?book=&page=）。 */
  deskPageHref?: string;
  /** 空档「回待核」链（同范围 ?mode=open）。 */
  openHref?: string;
}) {
  const [store, setStore] = useState<HeYeStore>({});
  const [index, setIndex] = useState(0);

  // 挂载后读本机态（SSR 不读 localStorage，避免水合不一致）；换范围/档位由父级 key 重挂载。
  useEffect(() => {
    setStore(loadHeYeStore());
  }, []);

  /** 当前档可见队列（本机态过滤，保持全池顺序）。 */
  const visible = useMemo(() => filterItemsByMode(items, store, mode), [items, store, mode]);
  /** 全池累计（本范围，纯本机态）：待核 / 已对 / 存疑。 */
  const counts = useMemo(() => countPoolMarks(items, store), [items, store]);
  /** key → 全池下标（标完跳下一条用）。 */
  const posOf = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((it, j) => m.set(it.key, j));
    return m;
  }, [items]);

  const pageByNo = useMemo(() => {
    const m = new Map<number, PageDoc>();
    for (const p of pages) if (p.page != null) m.set(p.page, p);
    return m;
  }, [pages]);

  /** 可编辑目标（输入框/文本域/下拉/富文本）不拦截键盘（含 activeElement 兜底）。 */
  function silentKeyTarget(target: EventTarget | null): boolean {
    return isEditableTarget(target);
  }

  /**
   * 键盘环（T18）：1 本机已对 · 2 存疑 · ←/j 上一条 · →/k 下一条 · b 同页批量（仅待核档）。
   * 挂在 window；可编辑目标静默；空档直接忽略。markOne/go/markSamePage 声明在后（函数声明提升）。
   */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (silentKeyTarget(e.target)) return;
      if (visible.length === 0) return;
      if (e.key === "1") {
        e.preventDefault();
        markOne("checked");
      } else if (e.key === "2") {
        e.preventDefault();
        markOne("doubt");
      } else if (e.key === "ArrowLeft" || e.key === "j") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "ArrowRight" || e.key === "k") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "b" && mode === "open") {
        if (samePageOpen.length >= 1) {
          e.preventDefault();
          markSamePage();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length, index, mode, store]);

  /** 标完跳到下一条仍属本档的项（按全池顺序；没有则停在最后一条，空档由空态分支接管）。 */
  function advance(nextStore: HeYeStore, fromKey: string) {
    const fromPos = posOf.get(fromKey) ?? -1;
    if (fromPos < 0) return;
    const nv = filterItemsByMode(items, nextStore, mode);
    const nextIdx = nv.findIndex((it) => (posOf.get(it.key) ?? -1) > fromPos);
    if (nextIdx >= 0) setIndex(nextIdx);
    else setIndex(Math.min(index, nv.length - 1));
  }

  function resetStore() {
    const next: HeYeStore = {};
    try {
      window.localStorage.removeItem(HEYE_STORE_KEY);
    } catch {
      /* 隐私模式等写不进去：会话内已清即可 */
    }
    setStore(next);
    setIndex(0);
  }

  // ---- 空态分支 ----

  /** 服务端池空：本范围没有「有页码但未抽查」的引用。 */
  if (items.length === 0) {
    return (
      <div className="mt-8">
        <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
          这个范围（{scopeLabel}）没有待核 cite——没有「有页码但未抽查」的引用，
          或数据尚未解析出来。
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          {cardHref ? (
            <>
              <Link
                href={cardHref}
                className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
              >
                回本卡 →
              </Link>
              <Link
                href={studyHref ?? "/study"}
                className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
              >
                去学习本卡 →
              </Link>
              {deskPageHref ? (
                <Link
                  href={deskPageHref}
                  className="text-sm text-muted no-underline hover:text-cinnabar"
                >
                  回书桌本页 →
                </Link>
              ) : null}
            </>
          ) : deskPageHref ? (
            <>
              <Link
                href={deskPageHref}
                className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
              >
                回书桌本页 →
              </Link>
              <Link
                href={studyHref ?? "/study"}
                className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
              >
                去学习环 /study →
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/desk"
                className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
              >
                回书桌 →
              </Link>
              <Link
                href={studyHref ?? "/study"}
                className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
              >
                去学习环 /study →
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  /** 档内空：open 空 = 本范围全标完；checked/doubt 空 = 还没有对应记录。 */
  if (visible.length === 0) {
    return (
      <div className="mt-8">
        {mode === "open" ? (
          <>
            <p className="rounded-lg border border-line bg-status-ok-bg px-4 py-3 text-sm leading-7 text-status-ok">
              本机已全部对过（已对 {counts.checked} · 存疑 {counts.doubt}）。这只影响本浏览器记录，
              seed 的「抽查 verified」状态没有变。{" "}
              <button onClick={resetStore} className="underline underline-offset-4 hover:text-foreground">
                清除本机核页记录
              </button>
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              这个范围（{scopeLabel}）没有待核（本机未标）的 cite。想复查的可在「已对 / 存疑」档里看。
            </p>
          </>
        ) : (
          <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
            这个范围还没有本机「{mode === "checked" ? "已对" : "存疑"}」记录。
            先在「待核」档里逐条核对，标过的项会出现在这里。
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {mode !== "open" && openHref ? (
            <Link
              href={openHref}
              className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
            >
              回待核档 →
            </Link>
          ) : null}
          {cardHref ? (
            <Link
              href={cardHref}
              className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
            >
              回本卡 →
            </Link>
          ) : null}
          {deskPageHref ? (
            <Link
              href={deskPageHref}
              className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
            >
              回书桌本页 →
            </Link>
          ) : (
            <Link
              href="/desk"
              className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
            >
              回书桌 →
            </Link>
          )}
          <Link
            href={studyHref ?? "/study"}
            className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
          >
            {cardHref ? "去学习本卡 →" : "去学习环 →"}
          </Link>
        </div>
      </div>
    );
  }

  // ---- 会话主流程 ----

  const i = Math.min(index, visible.length - 1);
  const cur = visible[i];
  const mark = store[cur.key];
  const pg = pageByNo.get(cur.page);
  const deskHref = `/desk?${cur.bookId ? `book=${encodeURIComponent(cur.bookId)}&` : ""}page=${cur.page}`;

  /** 同页其余待核（全池，同一印刷页、未标、不含当前条）——批量清同页 / 可点跳条。 */
  const samePageOpen = items.filter(
    (it) => it.page === cur.page && !store[it.key] && it.key !== cur.key,
  );
  /**
   * 当前条的 Cite 快照：队列定义即 seed verified===false。
   * 禁止改写成 true——「本机已对」只进 localStorage，与 seed 抽查态无关。
   */
  const curCite: Cite = { page: cur.page, quote: cur.quote, verified: false };

  function go(nextIdx: number) {
    setIndex(Math.max(0, Math.min(visible.length - 1, nextIdx)));
  }

  function markOne(s: "checked" | "doubt") {
    const next = setHeYeMark(cur.key, s);
    setStore(next);
    advance(next, cur.key);
  }

  function markSamePage() {
    const keys = samePageOpen.map((it) => it.key);
    const next = setHeYeMarks(keys, "checked");
    setStore(next);
    advance(next, cur.key);
  }

  return (
    <div className="mt-6">
      {/* 进度行：队列位置按「本档」，计数按「本范围」全池。 */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-muted">
          第 <span className="font-semibold text-foreground">{i + 1}</span> / {visible.length} 条
          <span className="ml-1">（本档）</span>
          <span className="ml-3">本范围</span>
          <span className="ml-1 text-status-ok">已对 {counts.checked}</span>
          <span className="ml-2 text-status-warn">存疑 {counts.doubt}</span>
          <span className="ml-2">待核 {counts.open}</span>
        </p>
        <nav className="flex gap-3 text-sm" aria-label="队列翻页">
          <button
            onClick={() => go(i - 1)}
            disabled={i === 0}
            className="text-muted hover:text-cinnabar disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar"
          >
            ← 上一条
          </button>
          <button
            onClick={() => go(i + 1)}
            disabled={i >= visible.length - 1}
            className="text-muted hover:text-cinnabar disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar"
          >
            下一条 →
          </button>
        </nav>
      </div>
      <p className="mt-1 text-xs text-muted">
        键：<span className="mono">1</span> 已对 · <span className="mono">2</span> 存疑 ·{" "}
        <span className="mono">←</span>/<span className="mono">→</span> 上下条
        {mode === "open" && samePageOpen.length >= 1 ? (
          <>
            {" "}
            · <span className="mono">b</span> 同页批量
          </>
        ) : null}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* 左：cite 上下文 */}
        <section aria-label="待核引用" className="min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-muted">待核引用</h2>
            {mark ? (
              <span
                className={`mono rounded border px-1.5 py-0.5 text-[11px] ${
                  mark.s === "checked"
                    ? "border-status-ok/40 bg-status-ok-bg text-status-ok"
                    : "border-amber-300 bg-status-warn-bg text-status-warn"
                }`}
              >
                {mark.s === "checked" ? "本机已对" : "本机存疑"}
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm">
            <Link
              href={`/desk/card/${encodeURIComponent(cur.cardId)}`}
              className="font-semibold text-cinnabar no-underline hover:underline underline-offset-4"
            >
              {cur.cardName}
            </Link>
            <span className="ml-2 text-muted">
              {cur.sourceLabel}
              {cur.chapterId ? ` · ${cur.chapterId}` : ""} · 引
            </span>
            {/* Peek 为旁路深链：quote 正文仍在下方 blockquote；verified 恒 false（见 curCite 注释）。 */}
            <span className="ml-1">
              <CitePeek cite={curCite} deskBookId={cur.bookId} cardId={cur.cardId} />
            </span>
          </p>

          {cur.quote ? (
            <blockquote className="mt-3 rounded-lg border border-line bg-card p-4 text-sm leading-7 text-foreground/90">
              “{cur.quote}”
            </blockquote>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-line p-4 text-sm text-muted">
              这条引用没有记录引文片段——按上下文到右页找对应位置。
            </p>
          )}

          {cur.context && cur.context !== cur.quote ? (
            <p className="mt-3 text-sm leading-7 text-muted">
              <span className="text-foreground/80">上下文：</span>
              {cur.context.length > 160 ? `${cur.context.slice(0, 160)}…` : cur.context}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => markOne("checked")}
              className={`rounded-md px-4 py-2 text-sm transition-opacity focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                mark?.s === "checked"
                  ? "bg-status-ok text-white"
                  : "border border-status-ok/50 text-status-ok hover:bg-status-ok-bg"
              }`}
            >
              本机已对
            </button>
            <button
              onClick={() => markOne("doubt")}
              className={`rounded-md px-4 py-2 text-sm transition-opacity focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                mark?.s === "doubt"
                  ? "bg-status-warn text-white"
                  : "border border-amber-300 text-status-warn hover:bg-status-warn-bg"
              }`}
            >
              存疑
            </button>
            <button
              onClick={() => go(i + 1)}
              disabled={i >= visible.length - 1}
              className="rounded-md border border-line px-4 py-2 text-sm text-muted hover:text-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar"
            >
              跳过 →
            </button>
          </div>

          {/* 同页批量 + 同页跳核列表（次级加速器，仅待核档；只写本浏览器，不等同 seed verified）。
              T19：samePageOpen 条可点跳（open 档下均在本档可见；点击只 go 定位、不写任何本机态）。 */}
          {mode === "open" && samePageOpen.length >= 1 ? (
            <div className="mt-4 border-t border-line pt-3">
              <button
                onClick={markSamePage}
                className="rounded-md border border-line px-4 py-2 text-sm text-muted no-underline transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
              >
                本页其余 {samePageOpen.length} 条一并「本机已对」→
              </button>
              <p className="mt-2 text-xs font-medium text-muted">本页其余待核条目（点击定位，不批量打标）：</p>
              <ul className="mt-1 space-y-0.5">
                {samePageOpen.map((it) => (
                  <li key={it.key}>
                    <button
                      onClick={() => {
                        // 跳转到该项在本档中的下标；不在本档（如已切档）则忽略——open 档下恒可跳。
                        const vi = visible.findIndex((v) => v.key === it.key);
                        if (vi >= 0) go(vi);
                      }}
                      className="max-w-full truncate text-left text-xs leading-5 text-muted transition-colors hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                    >
                      <span className="font-medium text-foreground/75">{it.cardName}</span>
                      <span className="ml-1">· {it.sourceLabel}</span>
                      {it.quote ? (
                        <span className="ml-1">
                          · “{it.quote.length > 36 ? `${it.quote.slice(0, 36)}…` : it.quote}”
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-xs leading-6 text-muted">
                点击条目只跳定位，不改本机态；批量只写本浏览器（localStorage），表示你拿 quote
                对着 OCR 页看过；它不等于教材侧「抽查 verified」，也不显示「本页已全核」。
              </p>
            </div>
          ) : null}

          <p className="mt-4 text-xs leading-6 text-muted">
            「本机已对」只存在这个浏览器（localStorage），表示你拿 quote 对着 OCR 页看过；
            它不等于教材侧「抽查 verified」，也不会改写 seed 数据。
          </p>
          <p className="mt-2 text-xs">
            <Link
              href={deskHref}
              className="text-cinnabar no-underline hover:underline underline-offset-4"
            >
              在书桌打开 p.{cur.page} →
            </Link>
          </p>
        </section>

        {/* 右：OCR 原文 */}
        <section aria-label="印刷页 OCR" className="min-w-0 max-xl:border-t max-xl:pt-6 xl:border-l xl:border-line xl:pl-6">
          <h2 className="text-sm font-semibold text-muted">印刷页 OCR（原文）</h2>
          {pg ? (
            <>
              <h3 className="mt-3 text-lg font-bold">
                p.{pg.page}
                <span className="ml-2 text-sm font-normal text-muted">
                  PDF 物理页 {pg.physicalPage}
                  {pg.chapterId ? ` · ${pg.chapterId}` : ""}
                </span>
              </h3>
              <article className="mt-3 max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-card p-5 text-sm leading-7">
                {pg.text}
              </article>
            </>
          ) : (
            <p className="mt-3 rounded-lg border border-amber-300 bg-status-warn-bg p-4 text-sm leading-7 text-status-warn">
              已解析的 OCR 里找不到印刷页 p.{cur.page}——可能该页还没解析或页码映射有误。
              请标「存疑」或跳过；不要凭记忆判对。
            </p>
          )}
        </section>
      </div>
    </div>
  );
}