import Link from "next/link";
import type { Cite } from "@/lib/entities";

/**
 * citation 徽章：
 * - page 已知 → 显示 p.N（verified 中性；未抽查验证则琥珀虚线，仍可跳转）
 * - page 为 null → fail-closed 显示 p.?，禁止伪造页码
 * 点击跳页（/viewer/[page]，展示该印刷页 OCR 原文）。
 */
export function CiteChip({ cite, q }: { cite?: Cite; q?: string }) {
  if (!cite) return null;
  const known = cite.page != null;
  const label = known ? `p.${cite.page}` : "p.?";
  const cls = cite.verified
    ? "text-muted hover:text-cinnabar border-line"
    : "cite-unverified text-status-warn border-amber-300";
  const href =
    known
      ? `/viewer/${cite.page}${q ? `?q=${encodeURIComponent(q)}` : ""}`
      : "#";
  const title = known
    ? cite.verified
      ? `跳转到印刷页 ${cite.page}`
      : `印刷页 p.${cite.page}（待抽查验证）`
    : "未验证：未找到确切页码，禁止伪造";
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
