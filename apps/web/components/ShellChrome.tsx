import Link from "next/link";

/**
 * 残留 shell 页（/ingest /study /entities /viewer）的薄壳：
 * 品牌行 + 「书桌 / 书架」回链，不复制 Sidebar 的 PRIMARY/SECONDARY 清单。
 * 主导航只有 DeskShell 侧栏一套；这里不是第二套导航。
 */
export default function ShellChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-baseline justify-between px-6 py-3">
          <Link
            href="/desk"
            className="mono text-sm tracking-widest text-foreground no-underline"
          >
            ARIADNE<span className="text-cinnabar">·</span>
          </Link>
          <nav className="flex items-baseline gap-4 text-sm" aria-label="返回">
            <Link href="/desk" className="text-muted no-underline hover:text-cinnabar">
              ← 书桌
            </Link>
            <Link href="/" className="text-muted no-underline hover:text-cinnabar">
              ← 书架
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}