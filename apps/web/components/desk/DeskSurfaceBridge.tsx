"use client";

import { useEffect } from "react";
import { useDeskContext } from "@/components/desk/DeskContext";
import type { ClewContextData } from "@/components/desk/DeskContext";

/**
 * 中栏表面薄桥（T17）：书桌由 DocumentPane 自己 setClew；
 * /desk/card/[id]、/study、/review 等页面挂载本桥，把服务端解析好的
 * book / chapter / page / card / surface 一次性写进 DeskContext，
 * Clew 右栏会话条与「本轮变更」入口随之显示当前面。
 * 只在挂载时写一次（页面级 key/参数变化会重挂载页面 → 重新写）。
 */
export default function DeskSurfaceBridge({ data }: { data: ClewContextData }) {
  const { setClew } = useDeskContext();

  useEffect(() => {
    setClew(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}