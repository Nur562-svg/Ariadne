import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ariadne · 实体卡",
  description: "《免疫学基础与病原生物学（第3版）》第一、二章 实体卡预览",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
