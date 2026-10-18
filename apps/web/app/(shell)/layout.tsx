import ShellChrome from "@/components/ShellChrome";

/**
 * 残留 shell 路由组（/ingest /study /entities /viewer）：
 * 薄 ShellChrome 壳（品牌 + 书桌/书架回链），不再是满宽主导航顶栏。
 * 主导航只在 DeskShell 侧栏（书桌 / 复习 / 书架）一套。
 */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <ShellChrome>{children}</ShellChrome>;
}