import type { Metadata } from "next";
import "./globals.css";
import { loadBooks } from "@/lib/entities";

export const metadata: Metadata = {
  title: "Ariadne · 书库",
  description: `${(loadBooks() ?? []).length > 0 ? `在读书目：${(loadBooks() ?? []).map((b) => b.title).join("、")}` : "教材 → 知识原子 / 实体卡 → 可复习"}`,
};

/**
 * 根 layout 只管 html/body。
 * - (desk) 组：DeskShell 三栏壳（书架 /、书桌 /desk、/review）——Sidebar 是唯一主导航。
 * - (shell) 组：残留单栏页（/ingest /study /entities /viewer），仅薄 ShellChrome 回链壳。
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}