import type { Metadata } from "next";
import "./globals.css";
import { loadBooks } from "@/lib/entities";
import DeskNav from "@/components/DeskNav";

export const metadata: Metadata = {
  title: "Ariadne · 书库",
  description: `${(loadBooks() ?? []).length > 0 ? `在读书目：${(loadBooks() ?? []).map((b) => b.title).join("、")}` : "教材 → 知识原子 / 实体卡 → 可复习"}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <DeskNav />
        {children}
      </body>
    </html>
  );
}