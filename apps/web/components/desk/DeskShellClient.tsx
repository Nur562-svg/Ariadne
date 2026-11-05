"use client";

import Sidebar from "@/components/desk/Sidebar";
import type { SidebarBook } from "@/components/desk/Sidebar";
import ClewPane from "@/components/desk/ClewPane";
import { DeskContextProvider } from "@/components/desk/DeskContext";
import type { ClewContextData } from "@/components/desk/DeskContext";
import ClewToggle, { useClewFold } from "@/components/desk/ClewToggle";

/**
 * DeskShell 三栏客户端编排（layout 为服务端，数据在此以 props 注入）：
 * DeskContextProvider 包住中栏与 Clew，DocumentPane 更新上下文、ClewPane 消费。
 * T106a：主列引入 40px 安静顶栏放 Clew 折叠开关；ClewPane 始终挂载，折叠仅隐藏/置 inert。
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
  const { open: clewOpen, setOpen: setClewOpen } = useClewFold();

  return (
    <DeskContextProvider initial={clewInitial}>
      {/* 桌面三栏壳：Sidebar/Clew 固定宽，中栏最小 420px；窄视口横向滚动，绝不把中栏压成 0。 */}
      <div
        className="flex h-dvh overflow-x-auto overflow-y-hidden"
        data-clew={clewOpen ? "open" : "folded"}
      >
        <Sidebar books={sidebarBooks} bookValidPages={bookValidPages} />
        {/* 主列：安静顶栏（仅 Clew 开关）+ 原 main。最小宽 420 从 main 上移到本列，行为不变。 */}
        <div className="flex min-w-[420px] flex-1 flex-col">
          <div className="flex h-10 shrink-0 items-center justify-end border-b border-line px-4">
            <ClewToggle open={clewOpen} onToggle={() => setClewOpen(!clewOpen)} />
          </div>
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
        {/* ClewPane 始终挂载：展开 = display:contents（aside 仍是 flex 直接子项，像素同 tip）；
            折叠 = 宽 0 + 裁切 + invisible + inert（不可聚焦/不可读屏，但 React 状态与滚动位置保留）。 */}
        <div
          id="desk-clew-slot"
          inert={!clewOpen}
          className={clewOpen ? "contents" : "invisible w-0 shrink-0 overflow-hidden"}
        >
          <ClewPane />
        </div>
      </div>
    </DeskContextProvider>
  );
}
