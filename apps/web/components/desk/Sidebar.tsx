"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** 侧栏「在读书目」一行（(desk) layout 服务端算好传入，客户端不读文件）。 */
export type SidebarBook = {
  title: string;
  chapters: number;
  cards: number;
};

const PRIMARY = [
  { href: "/desk", label: "书桌", hint: "实体卡 · 过渡文档" },
  { href: "/review", label: "复习", hint: "到期 0 · FSRS 未接" },
  { href: "/", label: "书架", hint: "书库" },
] as const;

const SECONDARY = [
  { href: "/entities", label: "实体卡浏览器" },
  { href: "/study", label: "学习环 · 自评" },
  { href: "/ingest", label: "导入教材" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * desk-v4 左栏（~248）：书桌 / 复习 / 书架 主导航 + 次级入口 + 在读书目。
 * 朱砂只做当前行强调；复习角标为静态 0（FSRS 未接入，禁止假队列）。
 */
export default function Sidebar({ book }: { book?: SidebarBook }) {
  const pathname = usePathname();
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
        {book ? (
          <>
            <p className="text-[11px] text-muted">在读书目</p>
            <p className="mt-1 text-sm font-medium leading-6 text-foreground">{book.title}</p>
            <p className="mt-0.5 text-xs text-muted">
              {book.chapters} 章 · {book.cards} 张实体卡
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
