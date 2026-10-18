"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HeYeItem } from "@/lib/heye";
import type { PageDoc } from "@/lib/entities";

/**
 * 核页对页会话（/review 中栏，客户端）：
 * 左 quote/上下文 ↔ 右该印刷页 OCR 原文（loadAllChapterPages 真页，服务端过滤后传入）。
 * 「本机已对 / 存疑」只写浏览器 localStorage（ariadne.heye.v1）——与 seed 抽查 verified 完全分离，
 * 绝不回写 data/cards（禁止 verified:true 过关）。
 */

const STORAGE_KEY = "ariadne.heye.v1";

type Mark = { s: "checked" | "doubt"; t: number };
type Store = Record<string, Mark>;

function loadStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export default function HeYeSession({
  items,
  pages,
  scopeLabel,
}: {
  /** 待核队列（服务端 collectCiteQueue，已按页码排序）。 */
  items: HeYeItem[];
  /** 队列涉及的 OCR 页（真 loadAllChapterPages 子集，按 page 索引）。 */
  pages: PageDoc[];
  /** 范围说明（全书库 / 某书书名），用于副文。 */
  scopeLabel: string;
}) {
  const [store, setStore] = useState<Store>({});
  const [index, setIndex] = useState(0);
  const loadedRef = useRef(false);

  // 挂载后读本机态（SSR 不读 localStorage，避免水合不一致）。
  useEffect(() => {
    setStore(loadStore());
    loadedRef.current = true;
  }, []);

  function persist(next: Store) {
    setStore(next);
    if (loadedRef.current) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 隐私模式等写不进去：本机态仅本会话有效，不阻塞核页。
      }
    }
  }

  const counts = useMemo(() => {
    let checked = 0;
    let doubt = 0;
    for (const it of items) {
      const m = store[it.key];
      if (m?.s === "checked") checked++;
      else if (m?.s === "doubt") doubt++;
    }
    return { checked, doubt, open: items.length - checked - doubt };
  }, [items, store]);

  const pageByNo = useMemo(() => {
    const m = new Map<number, PageDoc>();
    for (const p of pages) if (p.page != null) m.set(p.page, p);
    return m;
  }, [pages]);

  if (items.length === 0) {
    return (
      <div className="mt-8">
        <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
          这个范围（{scopeLabel}）没有待核 cite——没有「有页码但未抽查」的引用，
          或数据尚未解析出来。
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link
            href="/desk"
            className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
          >
            回书桌 →
          </Link>
          <Link
            href="/study"
            className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
          >
            去学习环 /study →
          </Link>
        </div>
      </div>
    );
  }

  const i = Math.min(index, items.length - 1);
  const cur = items[i];
  const mark = store[cur.key];
  const pg = pageByNo.get(cur.page);
  const allDone = counts.open === 0;
  const deskHref = `/desk?${cur.bookId ? `book=${encodeURIComponent(cur.bookId)}&` : ""}page=${cur.page}`;

  function go(nextIdx: number) {
    setIndex(Math.max(0, Math.min(items.length - 1, nextIdx)));
  }

  function setMark(s: Mark["s"]) {
    const next = { ...store, [cur.key]: { s, t: Date.now() } as Mark };
    persist(next);
    // 标完自动走到下一条未处理的；没有下一条就停在原地（进度条说明已完）。
    const rest = items.findIndex((it, j) => j > i && !next[it.key]);
    if (rest >= 0) setIndex(rest);
  }

  function resetStore() {
    persist({});
    setIndex(0);
  }

  return (
    <div className="mt-6">
      {/* 进度行 */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-muted">
          第 <span className="font-semibold text-foreground">{i + 1}</span> / {items.length} 条
          <span className="ml-3 text-status-ok">本机已对 {counts.checked}</span>
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
            disabled={i >= items.length - 1}
            className="text-muted hover:text-cinnabar disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar"
          >
            下一条 →
          </button>
        </nav>
      </div>

      {allDone ? (
        <p className="mt-4 rounded-lg border border-line bg-status-ok-bg px-4 py-3 text-sm leading-7 text-status-ok">
          本机已全部对过（已对 {counts.checked} · 存疑 {counts.doubt}）。这只影响本浏览器记录，
          seed 的「抽查 verified」状态没有变。{" "}
          <button onClick={resetStore} className="underline underline-offset-4 hover:text-foreground">
            清除本机核页记录
          </button>
        </p>
      ) : null}

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
              {cur.chapterId ? ` · ${cur.chapterId}` : ""} · 引 p.{cur.page}
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
              onClick={() => setMark("checked")}
              className={`rounded-md px-4 py-2 text-sm transition-opacity focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                mark?.s === "checked"
                  ? "bg-status-ok text-white"
                  : "border border-status-ok/50 text-status-ok hover:bg-status-ok-bg"
              }`}
            >
              本机已对
            </button>
            <button
              onClick={() => setMark("doubt")}
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
              disabled={i >= items.length - 1}
              className="rounded-md border border-line px-4 py-2 text-sm text-muted hover:text-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar"
            >
              跳过 →
            </button>
          </div>

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
