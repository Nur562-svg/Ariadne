/**
 * T103 desk-entity-card-detail-split-01 · Seam A
 *
 * 实体卡详情数据模型与机检 helpers（server · 零 JSX · 无 "use client"）。
 * 从 apps/web/components/EntityCardDetail.tsx 抽出：
 * - citeStats / firstPagedCitePage (:16–51)
 * - miss 装配体 (:128–155)：ocrMissCount / missDetails / atomTargetOfMiss
 * 未检（pageTextByPage == null）/ 去重 / slice(0, 8) / 首匹配原子规则 ≡ tip。
 * 只读：绝不写回 entities / 不写 verified / 不记本机核页标记。
 */

import type { EntityCard } from "@/lib/entities";
import { cardCiteMisses, enumerateCardCites, quoteInOcr } from "@/lib/cite-ocr-quality";

/** 本卡全部 cite 来源的诚实汇总（cites + fields[].cite + atoms[].cite，按 page|verified|quote 去重）。 */
export function citeStats(card: EntityCard): {
  total: number;
  paged: number;
  nullPage: number;
  unverified: number;
} {
  const seen = new Set<string>();
  let paged = 0;
  let nullPage = 0;
  let unverified = 0;
  const all = [
    ...card.cites,
    ...card.fields.map((f) => f.cite),
    ...card.atoms.map((a) => a.cite),
  ];
  for (const c of all) {
    if (!c) continue;
    const qk = (c.quote ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
    const key = `${c.page ?? "?"}|${c.verified ? 1 : 0}|${qk}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (c.page == null) nullPage++;
    else paged++;
    if (c.verified === false) unverified++;
  }
  return { total: paged + nullPage, paged, nullPage, unverified };
}

/** 本卡首个有页 cite 页码（cites → fields → atoms；全无页 → null）：「在书桌打开本页」定位用。 */
export function firstPagedCitePage(card: EntityCard): number | null {
  for (const c of card.cites) if (c.page != null) return c.page;
  for (const f of card.fields) if (f.cite?.page != null) return f.cite.page;
  for (const a of card.atoms) if (a.cite?.page != null) return a.cite.page;
  return null;
}

/**
 * T61 E：miss → 原子 quote 草稿目标（按 page + quote 前缀匹配回 atoms[].cite——
 * cardCiteMisses 的 quote 截到 30 字，故去「…」后 startsWith 比对）。取首匹配原子，
 * 按钮 title 点名原子 id，不静默写多条；找不到 → 不渲染「填入草稿 quote」（不猜目标）。
 * 只写本机草稿 citeQuote——不写回 seed / 不翻 verified / 不记核页标记。
 */
export function findAtomTargetOfMiss(
  card: EntityCard,
  page: number,
  quote: string,
) {
  const q = quote.replace(/…$/, "");
  return card.atoms.find(
    (a) => a.cite?.page === page && q.length > 0 && (a.cite?.quote ?? "").startsWith(q),
  );
}

/**
 * T103 Seam A: miss 装配体从 EntityCardDetail:128–155 抽出。
 */
export function buildEntityCardMissModel(
  card: EntityCard,
  pageTextByPage?: Record<number, string>,
) {
  const ocrMissCount = (() => {
    if (pageTextByPage == null) return null;
    let n = 0;
    for (const c of enumerateCardCites(card)) {
      if (c.page == null || (c.quote ?? "").trim() === "") continue;
      if (pageTextByPage[c.page] != null && !quoteInOcr(c.quote, pageTextByPage[c.page])) n++;
    }
    return n;
  })();
  /**
   * T55 F/I：miss 明细（含 OCR 附近窗 + 启发式建议摘录，server 侧算优）——补救面板
   * 逐条展示 + 复制建议摘录（剪贴板；人核后再贴）。只展示 + 复制：不自动 PATCH
   * entities / 不写 verified / 不记本机核页标记。未装配页文本 → 空列表（未检）。
   */
  const missDetails =
    pageTextByPage == null ? [] : cardCiteMisses(card, pageTextByPage).slice(0, 8);
  /**
   * T61 E：miss → 原子 quote 草稿目标（按 page + quote 前缀匹配回 atoms[].cite）。
   */
  const atomTargetOfMiss = (page: number, quote: string) =>
    findAtomTargetOfMiss(card, page, quote);

  return {
    ocrMissCount,
    missDetails,
    atomTargetOfMiss,
  };
}

export type EntityCardCiteStats = ReturnType<typeof citeStats>;
export type EntityCardMissModel = ReturnType<typeof buildEntityCardMissModel>;
