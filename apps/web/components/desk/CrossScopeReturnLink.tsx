"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { saveReturn } from "@/lib/return-stack";

/**
 * 会话面 sticky 交叉回程薄客户端岛（T40 C）。
 * /study /review 页是 Server Component——Server 渲染的 <Link> 挂 onClick 会 500（函数
 * props 不能跨 RSC 边界），故把 sticky 工具带里的「去核同范围 →」（study）/「去练同范围 →」
 * （review）抽成本岛（与 CardHubReturnLinks / IngestReadyLinks 同一手法）。
 * 点前 saveReturn——payload 由宿主**单一来源**传入（study=studyReturnTo · review=
 * reviewReturnTo，与同页页头 Strip returnTo 同一份，禁第二套口径）；key 仍
 * ariadne.desk.return.v1。href 保持既有 progress*（已含默认 mode），本岛只加 onClick；
 * 视觉仍 muted 次级文字链（非第二颗实心朱红），sticky 工具带布局不动。
 */
export default function CrossScopeReturnLink({
  href,
  returnTo,
  className,
  children,
  emptyLabel,
}: {
  /** 交叉目标（宿页 progressReviewHref / progressStudyHref，原样传入）。 */
  href: string;
  /** 出发面回程 payload（与同页 Strip returnTo 同一来源）。 */
  returnTo: { href: string; label: string };
  /** 可选样式覆盖（T42 B：study 空原子分支复用本岛时对齐相邻 text-sm 次级链）；缺省 sticky muted 样式。 */
  className?: string;
  children: ReactNode;
  /**
   * T51 H：对侧池 0 的 fail-closed 降级文案——有值时渲染 muted 纯文占位（不可点、不写
   * return、不挂 onClick），宿主按同页 Strip 池（stripItemKeys/stripAtoms）判定传入；
   * 缺省（未传）保持既有 Link，行为与前完全同。sticky 布局不动。
   */
  emptyLabel?: string;
}) {
  if (emptyLabel != null) {
    return <span className={className ?? "text-xs text-muted"}>{emptyLabel}</span>;
  }
  return (
    <Link
      href={href}
      onClick={() => saveReturn({ ...returnTo, at: Date.now() })}
      className={
        className ??
        "text-xs text-muted no-underline transition-colors hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
      }
    >
      {children}
    </Link>
  );
}
