import Link from "next/link";
import type { Cite } from "@/lib/entities";

/**
 * citation 徽章：已验证 → 中性链接；未验证 → 琥珀虚线 + p.?
 * 点击跳页（/viewer/[page]，展示该印刷页 OCR 原文）。
 */
export function CiteChip({ cite, q }: { cite?: Cite; q?: string }) {
  if (!cite) return null;
  const label = cite.verified && cite.page != null ? `p.${cite.page}` : "p.?";
  const cls = cite.verified
    ? "text-muted hover:text-cinnabar border-line"
    : "cite-unverified text-status-warn border-amber-300";
  const href =
    cite.page != null
      ? `/viewer/${cite.page}${q ? `?q=${encodeURIComponent(q)}` : ""}`
      : "#";
  return (
    <Link
      href={href}
      title={cite.verified ? `跳转到印刷页 ${cite.page}` : "未验证：未找到确切页码，禁止伪造"}
      className={`mono inline-flex items-center rounded border px-1.5 py-0.5 text-xs no-underline transition-colors ${cls}`}
    >
      {label}
    </Link>
  );
}
