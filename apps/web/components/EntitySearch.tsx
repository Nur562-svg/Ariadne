"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { EntityCard } from "@/lib/entities";

/**
 * 实体卡悬浮搜索（Task 01.1）：
 * - 视口右下角小按钮 → 展开为输入框，不占半屏、不挡卡片标题区主内容
 * - 纯客户端即时过滤 name_zh / name_en / aliases / id（大小写不敏感，中文子串）
 * - 与 kind 筛选可叠加：kind 由服务端筛好后传入 cards，这里再做 search
 * - Esc 清空并收起
 */
export default function EntitySearch({
  cards,
  kindLabel,
  activeKind,
}: {
  cards: EntityCard[];
  kindLabel: Record<string, string>;
  /** Current list kind filter (URL ?kind=); preserved on card → detail so back can restore it. */
  activeKind?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const needle = q.trim().toLowerCase();
  const hits = needle
    ? cards.filter((c) =>
        [c.name_zh, c.name_en, c.id, ...(c.aliases ?? [])].some(
          (f) => typeof f === "string" && f.toLowerCase().includes(needle),
        ),
      )
    : cards;

  function collapse() {
    setQ("");
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <>
      {/* 悬浮入口 / 展开面板 */}
      {open ? (
        <div className="fixed bottom-5 right-5 z-50 flex w-[min(calc(100vw-2.5rem),22rem)] flex-col gap-2 rounded-xl border border-line bg-card p-3 shadow-lg motion-reduce:transition-none">
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="shrink-0 text-muted"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") collapse();
              }}
              placeholder="按名称 / 别名 / id"
              aria-label="搜索实体卡"
              className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-cinnabar motion-reduce:transition-none"
            />
            <button
              onClick={collapse}
              aria-label="关闭搜索"
              className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <p aria-live="polite" className="text-xs text-muted">
            {needle ? `${hits.length} 结果` : ""}
          </p>
        </div>
      ) : (
        <button
          ref={buttonRef}
          onClick={() => setOpen(true)}
          aria-label="搜索实体卡"
          className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-muted shadow-md transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      )}

      {/* 结果列表：kind（服务端）已筛 → 这里叠加 search */}
      {needle && hits.length === 0 ? (
        <p className="mt-8 text-sm text-muted">没有匹配「{q.trim()}」的实体卡</p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hits.map((c) => (
            <li key={c.id}>
              <Link
                href={
                  activeKind && activeKind !== "全部"
                    ? `/entities/${c.id}?kind=${encodeURIComponent(activeKind)}`
                    : `/entities/${c.id}`
                }
                className="block h-full rounded-lg border border-line bg-card p-5 no-underline transition-shadow hover:shadow-md"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{c.name_zh}</h2>
                  <span className="mono shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
                    {kindLabel[c.kind] ?? c.kind}
                  </span>
                </div>
                {c.name_en && <p className="mono mt-0.5 text-xs text-muted">{c.name_en}</p>}
                <p className="mt-3 text-sm leading-6 text-foreground/85">{c.one_liner}</p>
                <p className="mt-3 text-xs text-muted">
                  {c.atoms.length} 个原子 · 引自 p.
                  {[...new Set(c.cites.filter((x) => x.page != null).map((x) => x.page))].join(", p.")}
                  {c.cites.some((x) => x.page == null) ? " · 部分未验证 p.?" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}