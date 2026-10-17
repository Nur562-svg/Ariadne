"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "书库" },
  { href: "/entities", label: "实体卡" },
  { href: "/study", label: "学习" },
  { href: "/ingest", label: "导入" },
] as const;

/** 桌面顶栏：精炼导航，朱砂只做当前页下划线强调。 */
export default function DeskNav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-baseline justify-between px-6 py-3">
        <Link href="/" className="mono text-sm tracking-widest text-foreground no-underline">
          ARIADNE<span className="text-cinnabar">·</span>
        </Link>
        <nav className="flex items-baseline gap-5 text-sm">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname === l.href || pathname.startsWith(`${l.href}/`) || pathname.startsWith(`${l.href}?`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`no-underline transition-colors motion-reduce:transition-none ${
                  active
                    ? "text-cinnabar underline decoration-cinnabar/60 underline-offset-4"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}