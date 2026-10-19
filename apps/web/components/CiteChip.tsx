import Link from "next/link";
import type { Cite } from "@/lib/entities";

/**
 * citation 徽章：
 * - page 已知 → 显示 p.N（verified 中性；未抽查验证则琥珀虚线，仍可跳转）
 * - page 为 null → fail-closed 显示 p.?，禁止伪造页码
 * 落点分流：书桌语境（deskBookId 有值）有页 → /desk?book=<id>&page=<N>（DocumentPane 章页定位）；
 * 其余（shell /entities、/study）→ /viewer/[page] OCR 原文。
 */
export function CiteChip({
  cite,
  q,
  deskBookId,
}: {
  cite?: Cite;
  q?: string;
  /** 书桌语境的书 id：有值且有页时优先深链书桌章页，而不是跳出 DeskShell 到 /viewer。 */
  deskBookId?: string;
}) {
  if (!cite) return null;
  const known = cite.page != null;
  const label = known ? `p.${cite.page}` : "p.?";
  const cls = cite.verified
    ? "text-muted hover:text-cinnabar border-line"
    : "cite-unverified text-status-warn border-amber-300";
  const href = deskBookId
    ? `/desk?book=${encodeURIComponent(deskBookId)}&page=${cite.page}`
    : `/viewer/${cite.page}${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  const title = !known
    ? "未验证：未找到确切页码，禁止伪造"
    : deskBookId
      ? `在书桌打开印刷页 p.${cite.page}${cite.verified ? "" : "（待抽查验证）"}`
      : cite.verified
        ? `跳转到印刷页 ${cite.page}`
        : `印刷页 p.${cite.page}（待抽查验证）`;
  // fail-closed（review-fix-integrity E）：无页码不是链接——渲染 <span>（同视觉、同琥珀族），
  // 禁止 href="#" 假链（点击跳页顶 / 污染 URL 锚点）。有页仍走 Link 深链。
  if (!known) {
    return (
      <span
        title={title}
        className={`mono inline-flex items-center rounded border px-1.5 py-0.5 text-xs ${cls}`}
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      title={title}
      className={`mono inline-flex items-center rounded border px-1.5 py-0.5 text-xs no-underline transition-colors ${cls}`}
    >
      {label}
    </Link>
  );
}
