import type { Metadata } from "next";
import "./globals.css";
import { loadBooks } from "@/lib/entities";

export const metadata: Metadata = {
  title: "Ariadne · 书库",
  description: `${(loadBooks() ?? []).length > 0 ? `在读书目：${(loadBooks() ?? []).map((b) => b.title).join("、")}` : "教材 → 知识原子 / 实体卡 → 可复习"}`,
};

/**
 * 根 layout 只管 html/body。
 * - (shell) 组：shell-01 单栏页（书库 / 实体卡 / 学习 / 导入 / viewer），保留满宽 DeskNav。
 * - (desk) 组：desk-v4 三栏壳（书桌主路径 / 复习），不再叠满宽顶栏。
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}