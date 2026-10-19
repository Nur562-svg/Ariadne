"use client";

import { useEffect } from "react";
import { useDeskContext } from "@/components/desk/DeskContext";
import type { ClewContextData } from "@/components/desk/DeskContext";

/**
 * 中栏表面薄桥（T17）：书桌由 DocumentPane 自己 setClew；
 * /desk/card/[id]、/study、/review 等页面挂载本桥，把服务端解析好的
 * book / chapter / page / card / surface 写进 DeskContext，
 * Clew 右栏会话条与「本轮变更」入口随之显示当前面。
 *
 * review-fix-integrity D（= T29 A，先落）：App Router 同路由 searchParams 变化
 * **不会重挂载**页面组件——空依赖「只在挂载时写一次」是谎言。改为上下文键
 * （面/书/章/页/卡 + progress* 池）变化时全量 setClew(data)（整体替换，勿浅 merge，
 * 防旧 page/citePages/progress* 残留）。data 为服务端 props，每次导航都是新对象，
 * 直接入 deps 即「跟每次软导航」。
 */
export default function DeskSurfaceBridge({ data }: { data: ClewContextData }) {
  const { setClew } = useDeskContext();

  useEffect(() => {
    setClew(data);
  }, [
    setClew,
    data,
    data.surface,
    data.book?.id,
    data.chapter?.id,
    data.page,
    data.card?.id,
    data.progressScopeLabel,
    data.progressStudyHref,
    data.progressReviewHref,
    data.progressAtoms,
    data.progressItems,
  ]);

  return null;
}
