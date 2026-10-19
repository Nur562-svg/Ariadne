"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadLastOpened, subscribeLastOpened } from "@/lib/last-opened";

/** 侧栏「在读书目」摘要（(desk) layout 服务端算好传入多书，客户端据 last-opened 选一本）。 */
export type SidebarBook = {
  id: string;
  title: string;
  chapters: number;
  cards: number;
};

const PRIMARY = [
  { href: "/desk", label: "书桌", hint: "实体卡 · 章页" },
  { href: "/study", label: "学习", hint: "本机自评 · 不熟再练" },
  { href: "/review", label: "复习", hint: "核页 · 本机对页" },
  { href: "/", label: "书架", hint: "书库" },
] as const;

const SECONDARY = [
  { href: "/entities", label: "实体卡浏览器" },
  { href: "/ingest", label: "导入教材" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * desk-v4 左栏（~248）：书桌 / 学习 / 复习 / 书架 主导航 + 次级入口 + 在读书目。
 * 朱砂只做当前行强调；「学习」是本机自评环（desk-study-01，全部｜未评｜不熟再练），
 * 「复习」是核页本机对页（desk-heye-01）——两者都不是 FSRS，禁止再写假 Due 角标 / 到期暗示。
 * T21（desk-library-shelf-continuity）：在读书目不再死取 books[0]，
 * 客户端据 last-opened 选「在读」书（失效回落首本/空库），书名可点进书桌，并给学习/核次级链（?book=）。
 */
export default function Sidebar({ books }: { books?: SidebarBook[] }) {
  const pathname = usePathname();
  const [current, setCurrent] = useState<SidebarBook | undefined>(books?.[0]);

  useEffect(() => {
    function sync() {
      const lo = loadLastOpened();
      const book = lo
        ? books?.find((b) => b.id === lo.bookId)
        : undefined;
      // 有效 last-opened → 该书；无效/无 → 首本（有书时）或 undefined（空库文案）。
      setCurrent(book ?? books?.[0]);
    }
    sync();
    return subscribeLastOpened(sync);
  }, [books]);

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-line bg-card">
      <div className="px-5 pb-4 pt-5">
        <Link href="/desk" className="mono text-sm tracking-widest text-foreground no-underline">
          ARIADNE<span className="text-cinnabar">·</span>
        </Link>
        <p className="mt-1 text-xs text-muted">考前书桌</p>
      </div>

      <nav className="flex flex-col gap-1 px-3" aria-label="主导航">
        {PRIMARY.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-baseline justify-between gap-2 rounded-lg px-3 py-2 no-underline transition-colors motion-reduce:transition-none ${
                active
                  ? "bg-cinnabar-soft font-semibold text-cinnabar"
                  : "text-foreground/85 hover:bg-background"
              }`}
            >
              <span className="text-sm">{item.label}</span>
              <span className={`text-xs ${active ? "text-cinnabar/80" : "text-muted"}`}>
                {item.hint}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-5">
        <p className="text-[11px] tracking-wider text-muted">入口</p>
      </div>
      <nav className="mt-2 flex flex-col gap-0.5 px-3" aria-label="次级入口">
        {SECONDARY.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm no-underline transition-colors motion-reduce:transition-none ${
                active
                  ? "bg-cinnabar-soft text-cinnabar"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-line px-5 py-4">
        {current ? (
          <>
            <p className="text-[11px] text-muted">在读书目</p>
            <Link
              href={`/desk?book=${encodeURIComponent(current.id)}`}
              className="mt-1 block text-sm font-medium leading-6 text-foreground no-underline hover:text-cinnabar"
            >
              {current.title}
            </Link>
            <p className="mt-0.5 text-xs text-muted">
              {current.chapters} 章 · {current.cards} 张实体卡
            </p>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <Link
                href={`/study?book=${encodeURIComponent(current.id)}`}
                className="text-muted no-underline hover:text-cinnabar"
              >
                学习 →
              </Link>
              <Link
                href={`/review?book=${encodeURIComponent(current.id)}`}
                className="text-muted no-underline hover:text-cinnabar"
              >
                核页 →
              </Link>
            </p>
          </>
        ) : (
          <p className="text-xs leading-6 text-muted">
            书库为空 ·{" "}
            <Link href="/ingest" className="text-cinnabar no-underline hover:underline underline-offset-4">
              去导入
            </Link>
          </p>
        )}
      </div>
    </aside>
  );
}
