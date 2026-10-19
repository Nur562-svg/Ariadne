"use client";

import { useEffect } from "react";
import { touchLastOpened } from "@/lib/last-opened";

/**
 * 续开指针写点（T21 A2，薄客户端岛）：
 * 页面命中已注册书时挂载本组件，挂载时 `touchLastOpened` 一次。
 * - /desk?book= 命中已注册书（含 ?page= 深链）→ 写 deskHref + page；
 * - /study?book=、/review?book= 有效范围 → 轻触同 bookId（刷新 at，保留停留页）。
 * 非法 / 未注册 bookId 不挂载本组件 → 不写（由服务端页 `invalidBook`/`scopeBook` 判空）。
 */
export default function LastOpenedTouch({
  bookId,
  deskHref,
  page,
}: {
  bookId: string;
  deskHref?: string;
  page?: number | null;
}) {
  useEffect(() => {
    if (!bookId) return;
    touchLastOpened(bookId, { deskHref, page: page ?? undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}