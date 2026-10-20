"use client";

import Sidebar from "@/components/desk/Sidebar";
import type { SidebarBook } from "@/components/desk/Sidebar";
import ClewPane from "@/components/desk/ClewPane";
import { DeskContextProvider } from "@/components/desk/DeskContext";
import type { ClewContextData } from "@/components/desk/DeskContext";

/**
 * DeskShell 三栏客户端编排（layout 为服务端，数据在此以 props 注入）：
 * DeskContextProvider 包住中栏与 Clew，DocumentPane 更新上下文、ClewPane 消费。
 */
export default function DeskShellClient({
  sidebarBooks,
  bookValidPages,
  clewInitial,
  children,
}: {
  sidebarBooks?: SidebarBook[];
  /** T31 C：bookId → 已解析印刷页[]（服务端装配）——Sidebar 读侧幽灵页消毒用。 */
  bookValidPages?: Record<string, number[]>;
  clewInitial: ClewContextData;
  children: React.ReactNode;
}) {
  return (
    <DeskContextProvider initial={clewInitial}>
      {/* 桌面三栏壳：Sidebar/Clew 固定宽，中栏最小 420px；窄视口横向滚动，绝不把中栏压成 0。 */}
      <div className="flex h-dvh overflow-x-auto overflow-y-hidden">
        <Sidebar books={sidebarBooks} bookValidPages={bookValidPages} />
        <main className="min-w-[420px] flex-1 overflow-y-auto">{children}</main>
        <ClewPane />
      </div>
    </DeskContextProvider>
  );
}