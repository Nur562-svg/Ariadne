"use client";

import Link from "next/link";
import { loadLastOpened } from "@/lib/last-opened";
import { loadReturnOnce } from "@/lib/return-stack";
import { useClientOnce } from "@/lib/use-client-once";

/**
 * 学习环回程短链（T23 A/B，客户端薄岛）：
 * 按「回本卡（可选）→ 回书桌本页 / 回书桌 → 回到刚才」渲染次级文字链。
 * - 印刷页可解析 →「回书桌本页 →」（/desk?book=&page=）；无页不假编 p.1，回落「回书桌 →」。
 *   页来源：pageHint（本卡首个有页 cite，服务端给）→ loadLastOpened() 同书 page（客户端回落）。
 * - showReturn 时读 return 桶渲染「回到刚才 →」（hover 显示出发标签）。
 * 禁大红并排：本组件只出次级文字链，主 CTA 由调用方另设。
 */
export default function ReturnNav({
  bookId,
  pageHint,
  deskHref,
  cardHref,
  validPages,
  showReturn = true,
}: {
  /** 当前范围书 id（缺省则只能回 /desk，不带 book/page）。 */
  bookId?: string;
  /** 单卡首个有页 cite 页码（服务端给；非卡范围常为 null）。 */
  pageHint?: number | null;
  /** 无页时回书桌的兜底深链（/desk?book= 或 /desk）。 */
  deskHref: string;
  /** ?card= 时回本卡链（/desk/card/<id>）。 */
  cardHref?: string;
  /**
   * T31 F：该书已解析印刷页[]（服务端装配）——lastOpened 回落页消毒：lo.page 不在表内
   * 不采用（无表时同样只信 pageHint，不盲信 localStorage）。pageHint（服务端可信）仍优先。
   */
  validPages?: number[];
  /** 是否渲染「回到刚才」（sticky 工具带设 false，完成/空态设 true）。 */
  showReturn?: boolean;
}) {
  // T72：一次性采纳改 noop-uSES（SSR/水合首帧恒 null 不水合错位，水合后读一次；
  // props 变化重渲染即以新闭包重采——等价旧 effect 的 deps 重跑）。T31 F 消毒口径不变：
  // 只信有表且页在表内的 lo.page；无表 / 脏页 / 无 pageHint → 不采用（回落 deskHref 书级）。
  const adoptedPage = useClientOnce<number | null>(() => {
    if (pageHint != null || !bookId) return null;
    const lo = loadLastOpened();
    return lo?.bookId === bookId && lo.page != null && validPages?.includes(lo.page)
      ? lo.page
      : null;
  }, null);
  const page = pageHint ?? adoptedPage;
  const ret = useClientOnce(() => (showReturn ? loadReturnOnce() : null), null);

  const deskPageHref =
    page != null && bookId ? `/desk?book=${encodeURIComponent(bookId)}&page=${page}` : undefined;

  return (
    <>
      {cardHref ? (
        <Link
          href={cardHref}
          className="text-sm text-muted no-underline hover:text-cinnabar"
        >
          回本卡 →
        </Link>
      ) : null}
      <Link
        href={deskPageHref ?? deskHref}
        className={`text-sm no-underline hover:underline underline-offset-4 ${
          deskPageHref ? "text-cinnabar" : "text-muted hover:text-cinnabar"
        }`}
      >
        {deskPageHref ? "回书桌本页 →" : "回书桌 →"}
      </Link>
      {showReturn && ret ? (
        <Link
          href={ret.href}
          title={ret.label}
          className="text-sm text-muted no-underline hover:text-cinnabar"
        >
          回到刚才 →
        </Link>
      ) : null}
    </>
  );
}