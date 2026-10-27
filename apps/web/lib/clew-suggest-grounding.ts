/**
 * T84 机械抽出：原 lib/clew-suggest.ts T69 A 按档 grounding 策略分区（GroundingPolicy /
 * groundingPolicyForTier / selectGroundPages / groundPagesOf / assembleChapterGround /
 * CLEW_HONESTY_FOOTNOTE）+ 截断分区（truncatePageText）整段迁此——T69 有界铁顶语义零改
 * （LONG_PAGES_MAX / LONG_TOTAL_CHARS_MAX / PAGE_TEXT_MAX_CHARS 自 clew-suggest-types import）。
 * 纯函数；无 fs / 无 process.env / 无 "use client"；route 与 clew-check 共用。
 * 铁合同七条与消费者入口仍在 @/lib/clew-suggest（barrel）。
 */

import {
  LONG_PAGES_MAX,
  LONG_TOTAL_CHARS_MAX,
  PAGE_TEXT_MAX_CHARS,
  isPrintedPage,
  type ClewGrounding,
} from "./clew-suggest-types.ts";

// ---- T69 A：按档 grounding 策略（纯函数；route 与 clew-check 共用） ----

export type GroundingPolicy = {
  /** single = 三档同 tip 单页小窗；chapter-bounded = long-context 同章有界多页。 */
  mode: "single" | "chapter-bounded";
  maxPages: number;
  maxTotalChars: number;
};

/**
 * 按档接地策略：fast / reasoning 恒 single（1 页 / PAGE_TEXT_MAX_CHARS，与 T66–T68 完全一致）；
 * long-context = chapter-bounded（LONG_PAGES_MAX 页 / LONG_TOTAL_CHARS_MAX 字）。
 * 档 id 非法 → 按 single（不因未知档放宽顶）。
 */
export function groundingPolicyForTier(tier: string): GroundingPolicy {
  return tier === "long-context"
    ? { mode: "chapter-bounded", maxPages: LONG_PAGES_MAX, maxTotalChars: LONG_TOTAL_CHARS_MAX }
    : { mode: "single", maxPages: 1, maxTotalChars: PAGE_TEXT_MAX_CHARS };
}

/**
 * 选接地页（T69 A·B）：候选 = chapterPages（该章 blocks 里**有文本**的印刷页，服务端自取），
 * 优先序 = 当前页 → 请求上下文 cite 页（须同章，跨章 cite 不采）→ 同章近邻补齐（按与当前页
 * 距离，平手取低页）。去重后按 maxPages 硬顶，返回**升序阅读序**（优先序只决定谁入选）。
 * chapterPages 空 / maxPages ≤ 0 → 空数组（缺章缺 blocks 诚实降级，不编页）。
 */
export function selectGroundPages(opts: {
  currentPage?: number | null;
  citePages?: readonly number[];
  chapterPages: readonly number[];
  maxPages: number;
}): number[] {
  const eligible = [...new Set(opts.chapterPages.filter((p) => isPrintedPage(p)))].sort((a, b) => a - b);
  if (eligible.length === 0 || opts.maxPages <= 0) return [];
  const chosen: number[] = [];
  const take = (p: number) => {
    if (chosen.length < opts.maxPages && !chosen.includes(p)) chosen.push(p);
  };
  const anchor =
    opts.currentPage != null && eligible.includes(opts.currentPage) ? opts.currentPage : eligible[0];
  if (anchor === opts.currentPage) take(anchor);
  for (const p of new Set(opts.citePages ?? [])) {
    if (eligible.includes(p)) take(p);
  }
  const rest = eligible
    .filter((p) => !chosen.includes(p))
    .sort((a, b) => Math.abs(a - anchor) - Math.abs(b - anchor) || a - b);
  for (const p of rest) take(p);
  return [...chosen].sort((a, b) => a - b);
}

/** 流 meta / 非流响应用的接地页平铺（含当前页；无任何窗 → 空数组）。 */
export function groundPagesOf(g?: ClewGrounding): number[] {
  if (!g) return [];
  if (g.ground) return g.ground.pages;
  return g.pageWindow ? [g.pageWindow.page] : [];
}

/**
 * T70 D：long-context 装窗收口。
 * - 有附加窗 → ground（pages = 当前页 + 已装附加页，pagesOmitted 如实）。
 * - 附加窗为空但 omitted>0 → **仍设** ground：pages=[当前页]，pagesOmitted=omitted。
 *   选出的扩页全因总字顶未装时，不得把 omitted 丢成「没扩」。
 * - 两者都没有 → undefined（单页，不写 ground；fast/reasoning 不调用本函数）。
 */
export function assembleChapterGround(opts: {
  currentPage: number;
  extraPages: readonly number[];
  omitted: number;
  totalChars: number;
  maxPages: number;
  maxTotalChars: number;
}): NonNullable<ClewGrounding["ground"]> | undefined {
  const extras = opts.extraPages.filter((p) => isPrintedPage(p) && p !== opts.currentPage);
  if (extras.length === 0 && opts.omitted <= 0) return undefined;
  const pages = [...new Set([opts.currentPage, ...extras])].filter((p) => isPrintedPage(p)).sort((a, b) => a - b);
  return {
    mode: "chapter-bounded",
    pages,
    totalChars: opts.totalChars,
    maxPages: opts.maxPages,
    maxTotalChars: opts.maxTotalChars,
    pagesOmitted: opts.omitted > 0 ? opts.omitted : 0,
  };
}

/** G：诚实脚注——ClewPane 底栏与 docs 同源一句（保留既有「以教材页码为准」口径）。 */
export const CLEW_HONESTY_FOOTNOTE =
  "不做诊断 · 回答≠已核 · 永不写 seed · 页码以印刷页为准 · 小能力只读";

// ---- 截断 ----

/** 页 OCR 小窗截断：统一换行、trim、超 max 取前 max 字并标注；chars 报截断前总字数。 */
export function truncatePageText(
  text: string,
  max: number = PAGE_TEXT_MAX_CHARS,
): { text: string; chars: number; truncated: boolean } {
  const t = text.replace(/\r\n?/g, "\n").trim();
  if (t.length <= max) return { text: t, chars: t.length, truncated: false };
  return { text: `${t.slice(0, max)}\n…（小窗已截断）`, chars: t.length, truncated: true };
}
