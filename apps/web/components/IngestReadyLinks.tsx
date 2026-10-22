"use client";

import Link from "next/link";
import { saveReturn } from "@/lib/return-stack";

/**
 * ingest 就绪三连薄客户端岛（T39 B）：ready 物料上的「打开书桌 / 学习环 / 核页」。
 * ingest 页是 Server Component——Server 渲染的 <Link> 挂 onClick 会 500（函数 props
 * 不能跨 RSC 边界），故抽成本岛，next/link 的 onClick 才合法（与 CardHubReturnLinks
 * 同一手法）。三条链点前写 return 短链 → /ingest（label 上传）——练/核完成态
 * 「回到刚才」回上传面；key 仍 ariadne.desk.return.v1，不另开第二套。
 * 视觉与提取前一致：书桌仍是唯一朱红实心主 CTA，学习/核为 cinnabar 文字链；
 * 练 mode=all · 核 mode=open（T37 D 口径只回归）。extracted 分支仍走
 * RegisterMaterialButton（其自带同款 return，见 T39 A）。
 */
export default function IngestReadyLinks({ bookId }: { bookId: string }) {
  function rememberUploadReturn() {
    saveReturn({ href: "/ingest", label: "上传", at: Date.now() });
  }
  const bookQ = encodeURIComponent(bookId);
  return (
    <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <Link
        href={`/desk?book=${bookQ}`}
        onClick={rememberUploadReturn}
        className="inline-block rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline"
      >
        打开书桌 →
      </Link>
      <Link
        href={`/study?book=${bookQ}&mode=all`}
        onClick={rememberUploadReturn}
        className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
      >
        学习环 →
      </Link>
      <Link
        href={`/review?book=${bookQ}&mode=open`}
        onClick={rememberUploadReturn}
        className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
      >
        核页 →
      </Link>
    </span>
  );
}
