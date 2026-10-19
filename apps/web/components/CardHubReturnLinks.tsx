"use client";

import Link from "next/link";
import { saveReturn } from "@/lib/return-stack";

/**
 * 卡枢纽动作条里的「练 / 核」两个可点 CTA（薄客户端岛）。
 * EntityCardDetail 是 Server Component，不能在它的 <Link> 上挂 onClick 函数（会落地成 500）；
 * 这里把需要「点前写 return 短链」的两个按钮抽成客户端岛，next/link 的 onClick 才合法。
 * 在书桌语境（deskBookId 传入）点练/核前写 return（回本卡枢纽）；shell /entities 无 deskBookId 不写。
 */
export default function CardHubReturnLinks({
  studyHref,
  reviewHref,
  cardId,
  cardName,
  atomCount,
  pendingCiteCount,
  deskBookId,
}: {
  studyHref: string;
  reviewHref: string;
  cardId: string;
  cardName: string;
  atomCount: number;
  pendingCiteCount?: number;
  deskBookId?: string;
}) {
  function rememberCardReturn() {
    saveReturn({
      href: `/desk/card/${encodeURIComponent(cardId)}`,
      label: `卡《${cardName}》`,
      at: Date.now(),
    });
  }

  return (
    <>
      {atomCount > 0 ? (
        <Link
          href={studyHref}
          onClick={deskBookId ? rememberCardReturn : undefined}
          className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline transition-opacity hover:opacity-90 motion-reduce:transition-none"
        >
          练这张卡（{atomCount}）
        </Link>
      ) : (
        <span className="rounded-md border border-dashed border-line px-4 py-2 text-sm text-muted">
          本卡无知识原子，暂不可练
        </span>
      )}
      {pendingCiteCount === 0 ? (
        <span className="rounded-md border border-dashed border-line px-4 py-2 text-sm text-muted">
          本卡暂无待核 cite
        </span>
      ) : (
        <Link
          href={reviewHref}
          onClick={deskBookId ? rememberCardReturn : undefined}
          className="rounded-md border border-line px-4 py-2 text-sm text-foreground no-underline transition-colors hover:border-cinnabar hover:text-cinnabar motion-reduce:transition-none"
        >
          核本卡 cite{pendingCiteCount != null && pendingCiteCount > 0 ? ` · ${pendingCiteCount}` : ""}
        </Link>
      )}
    </>
  );
}