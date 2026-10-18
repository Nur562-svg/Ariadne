import DeskNav from "@/components/DeskNav";

/**
 * shell-01 单栏壳：满宽顶栏 + 单栏内容。
 * 书桌主学习路径（/desk、/review）走 (desk) 组的三栏 DeskShell，不再叠这条顶栏。
 */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DeskNav />
      {children}
    </>
  );
}
