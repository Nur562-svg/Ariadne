import Link from "next/link";
import type { Cite } from "@/lib/entities";
import { pageInOcr } from "@/lib/ocr-page";

/**
 * citation 徽章：
 * - page 已知 → 显示 p.N（verified 中性；未抽查验证则琥珀虚线，仍可跳转）
 * - page 为 null → fail-closed 显示 p.?，禁止伪造页码
 * 落点分流：书桌语境（deskBookId 有值）有页 → /desk?book=<id>&page=<N>（DocumentPane 章页定位）；
 * 其余（shell /entities、/study）→ /viewer/[page] OCR 原文。
 * T53 B：书桌语境 + 已知页 + bookValidPages 已装配且不含该页（鬼页）→ 降纯文 chip
 * 「p.N · 本页无 OCR」（同 chip 视觉、无 Link，不深链定位不了的章页）；未装配 / 页∈OCR
 * 保持既有 Link；/viewer 路径不门禁（viewer 自带「未找到印刷页」诚实琥珀）。p.? 不动。
 */
export function CiteChip({
  cite,
  q,
  deskBookId,
  bookValidPages,
  ocrMiss,
}: {
  cite?: Cite;
  q?: string;
  /** 书桌语境的书 id：有值且有页时优先深链书桌章页，而不是跳出 DeskShell 到 /viewer。 */
  deskBookId?: string;
  /**
   * T53 B/I：该书已解析印刷页[]（宿主 loadBookValidPages()[bookId] 装配；缺省不门禁）——
   * 书桌深链鬼页降纯文；由 CitePeek 等宿主透传，不重复装配。
   */
  bookValidPages?: number[];
  /**
   * T54 H/I：该 cite 机检「OCR 未见」（宿主 server 侧 quoteInOcr 实算；缺省不点名）——
   * chip 文本后缀「· OCR 未见」+ title 说明；不改 Link 门禁（鬼页仍吃 T53 pageInOcr），
   * 也不是 seed verified（两个概念分列互不写入）。
   */
  ocrMiss?: boolean;
}) {
  if (!cite) return null;
  const known = cite.page != null;
  const baseLabel = known ? `p.${cite.page}` : "p.?";
  const label = ocrMiss ? `${baseLabel} · OCR 未见` : baseLabel;
  const cls = cite.verified
    ? "text-muted hover:text-cinnabar border-line"
    : "cite-unverified text-status-warn border-amber-300";
  const ghostInDesk =
    known && deskBookId != null && !pageInOcr(bookValidPages, cite.page as number);
  const href = deskBookId
    ? `/desk?book=${encodeURIComponent(deskBookId)}&page=${cite.page}`
    : `/viewer/${cite.page}${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  const title = !known
    ? "未验证：未找到确切页码，禁止伪造"
    : ghostInDesk
      ? "该印刷页尚未解析 OCR——书桌章页定位不了"
      : ocrMiss
        ? `机检：引文未在该页 OCR 命中（bigram<0.6，可能 OCR 误差或抽取出错）· 印刷页 p.${cite.page}`
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
  // T53 B：书桌鬼页同族纯文 chip（琥珀 = 稀疏/存疑族；无 hover 变色、无 Link）。
  if (ghostInDesk) {
    return (
      <span
        title={title}
        className="mono inline-flex items-center rounded border border-amber-300 px-1.5 py-0.5 text-xs text-status-warn"
      >
        {label} · 本页无 OCR
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
