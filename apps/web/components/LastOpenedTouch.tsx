"use client";

import { useEffect } from "react";
import { touchLastOpened } from "@/lib/last-opened";

/**
 * 续开指针写点（T21 A2，薄客户端岛）：
 * 页面命中已注册书时挂载本组件，`touchLastOpened` 一次；T28 D：依赖 book/deskHref/page——
 * 清页 / 换页 / 换书后跟着当前 URL 重写指针，不再只在挂载时写一次。
 * - /desk?book= 命中已注册书（含 ?page= 深链）→ 写 deskHref + page；
 * - /study?book=、/review?book= 有效范围 → 轻触同 bookId；本次没有页时传 page: undefined，
 *   touchLastOpened 同书保留原页（学习/核页只证明「在读这本书」，不擦书桌更精确的停留页）。
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
  }, [bookId, deskHref, page]);

  return null;
}