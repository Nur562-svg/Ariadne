"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { saveReturn } from "@/lib/return-stack";

/**
 * EntityCardDetail「在书桌打开本卡 / 本页 →」薄客户端岛（T41 D）。
 * EntityCardDetail 是 Server Component——其 <Link> 挂 onClick 会 500（函数 props 不能
 * 跨 RSC 边界），与 CardVsStudyLink / CardHubReturnLinks 同一手法抽岛。
 * 点前 saveReturn({ ...returnTo, at })——returnTo 由父传 openDeskReturnTo（desk 卡页=
 * 本卡枢纽；shell 详情=实体列表，与 CardHubReturnLinks 的 returnTo 同源）；无 returnTo
 * 不写（保底，行为与前同）。key 仍 ariadne.desk.return.v1。打开目标 URL 原样传入不动；
 * 次级 muted 文字链（非第二颗实心）。
 */
export default function DeskOpenReturnLink({
  href,
  returnTo,
  children,
}: {
  /** 打开目标（/desk/card/<id> 或 /desk?book=&page=，父组件原样拼）。 */
  href: string;
  /** 出发面回程 payload（父传 openDeskReturnTo）；缺省不写。 */
  returnTo?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={returnTo ? () => saveReturn({ ...returnTo, at: Date.now() }) : undefined}
      className="text-sm text-muted no-underline hover:text-cinnabar"
    >
      {children}
    </Link>
  );
}
