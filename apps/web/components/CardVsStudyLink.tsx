"use client";

import Link from "next/link";
import { saveReturn } from "@/lib/return-stack";

/**
 * 卡枢纽「练易混卡 →」薄客户端岛（T39 D）。
 * EntityCardDetail 是 Server Component——其 <Link> 不能挂 onClick（函数 props 不能跨 RSC
 * 边界，落地即 500），与 CardHubReturnLinks 同一手法抽岛。点前写 return 短链回**当前卡**
 * 枢纽（/desk/card/<fromCardId>，label 卡《name》，与主条 CardHubReturnLinks 同口径）——
 * 练完易混卡「回到刚才」回出发的那张卡，不是被练的那张。
 * 只在书桌语境（deskBookId 存在）才渲染本岛（父组件已按 vsId && deskBookId 门控），
 * 故这里无条件写；href（/study?card=<vsId>&book=&mode=all，T35 B 口径）由父组件拼好
 * 原样传入，本岛不再解析 scope。次级 muted 文字链，不加第二颗实心。
 */
export default function CardVsStudyLink({
  href,
  fromCardId,
  fromCardName,
}: {
  /** 易混卡练面深链（父组件拼好：/study?card=<vsId>&book=<deskBookId>&mode=all）。 */
  href: string;
  /** 出发卡 id（当前卡枢纽）——return 回它。 */
  fromCardId: string;
  /** 出发卡中文名——return label「卡《name》」。 */
  fromCardName: string;
}) {
  function rememberFromCardReturn() {
    saveReturn({
      href: `/desk/card/${encodeURIComponent(fromCardId)}`,
      label: `卡《${fromCardName}》`,
      at: Date.now(),
    });
  }
  return (
    <Link
      href={href}
      onClick={rememberFromCardReturn}
      className="ml-3 whitespace-nowrap text-xs text-muted no-underline hover:text-cinnabar"
    >
      练易混卡 →
    </Link>
  );
}
