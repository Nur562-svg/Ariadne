"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * 中栏 → Clew 的上下文：DocumentPane 随模式/章节/页码变化同步，
 * ClewPane 据此生成建议问与 stub 回复的页码提示。形状只此一处，避免多书大拆。
 */
export type ClewContextData = {
  book?: { id: string; title: string };
  chapter?: { id: string; title: string };
  /** 中栏章页模式当前印刷页（无则 null/undefined）。 */
  page?: number | null;
  /** 可见实体卡的 cite 印刷页示例（最多 3 个），供 stub 回复提示对页。 */
  citePages: number[];
  /** 当前可见（过滤后）第一张实体卡名，插入建议问文案。 */
  visibleEntityName?: string;
};

type DeskContextValue = {
  clew: ClewContextData;
  setClew: (data: ClewContextData) => void;
};

const DeskContext = createContext<DeskContextValue>({
  clew: { citePages: [] },
  setClew: () => {},
});

export function DeskContextProvider({
  initial,
  children,
}: {
  initial: ClewContextData;
  children: ReactNode;
}) {
  const [clew, setClew] = useState<ClewContextData>(initial);
  const value = useMemo(() => ({ clew, setClew }), [clew]);
  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDeskContext(): DeskContextValue {
  return useContext(DeskContext);
}