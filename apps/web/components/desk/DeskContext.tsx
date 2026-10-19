"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * 中栏 → Clew 的上下文：DocumentPane / 卡页 / study / review 随表面变化同步，
 * ClewPane 据此生成建议问、会话条与 stub 回复的页码提示。形状只此一处，避免多书大拆。
 * desk-clew-session-honesty（T17）：加 surface（哪个面）与 card（当前卡）；
 * sessionStartedAt 由 Provider 挂载时记一次，setClew 不触碰它——「本轮变更」按它过滤。
 */
export type DeskSurface = "desk" | "card" | "study" | "review" | "library";

export type ClewContextData = {
  book?: { id: string; title: string };
  chapter?: { id: string; title: string };
  /** 中栏章页模式当前印刷页（无则 null/undefined）。 */
  page?: number | null;
  /** 可见实体卡的 cite 印刷页示例（最多 3 个），供 stub 回复提示对页。 */
  citePages: number[];
  /** 当前可见（过滤后）第一张实体卡名，插入建议问文案。 */
  visibleEntityName?: string;
  /** 当前强调的实体卡（书桌=第一张可见卡；卡页=本卡）。 */
  card?: { id: string; name_zh: string };
  /** 当前表面：书桌 / 本卡 / 学习 / 核页 / 书架。 */
  surface?: DeskSurface;
  /**
   * T19 章/页作用域本机进度池：与中栏 LocalProgressStrip 同一键集（DocumentPane 随翻章/翻页写）。
   * ClewPane 的 LocalProgressStrip compact 据此收窄计数（有池时数字应明显小于全书）；
   * 无池（书架 / study / review 薄桥）→ 全局计数 + 诚实「未定位章」说明。
   */
  progressAtoms?: { cardId: string; atomId: string }[];
  progressItems?: { key: string }[];
  /** 池作用域标注（「本章 ch01」/「本页 p.N」），与中栏 Strip 一致。 */
  progressScopeLabel?: string;
  /** 同范围练 / 核入口（可选；未定位章等无池态不传）。 */
  progressStudyHref?: string;
  progressReviewHref?: string;
};

type DeskContextValue = {
  clew: ClewContextData;
  setClew: (data: ClewContextData) => void;
  /** 本会话开始时刻（Provider 首次挂载记一次）；Clew「本轮变更」用它过滤本机活动。 */
  sessionStartedAt: number;
};

const DeskContext = createContext<DeskContextValue>({
  clew: { citePages: [] },
  setClew: () => {},
  sessionStartedAt: 0,
});

export function DeskContextProvider({
  initial,
  children,
}: {
  initial: ClewContextData;
  children: ReactNode;
}) {
  const [clew, setClew] = useState<ClewContextData>(initial);
  /** 挂载一次即固定；不放进 clew state —— setClew 合并永远冲不掉它。 */
  const sessionStartedAt = useRef<number>(Date.now());
  const value = useMemo(
    () => ({ clew, setClew, sessionStartedAt: sessionStartedAt.current }),
    [clew],
  );
  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDeskContext(): DeskContextValue {
  return useContext(DeskContext);
}