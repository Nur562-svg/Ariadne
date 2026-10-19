import { loadBooks, loadCards, loadCard } from "@/lib/entities";

/**
 * 核页（本机对页）队列：从实体卡收集「有页码但未抽查验证」的 cite。
 * 数据源仍是 seed JSON——本模块只读不写；「本机已对/存疑」状态存浏览器 localStorage，
 * 绝不回写 data/cards 的 verified（禁止 verified:true 过关）。
 */

export type HeYeSource = "card" | "field" | "atom";

export type HeYeItem = {
  /** 稳定 citeKey：localStorage 本机态的键；同 cardId+page+quote 跨来源去重后也用它。 */
  key: string;
  cardId: string;
  cardName: string;
  chapterId?: string;
  /** 章 → 书反查（books.json）；未注册章为 undefined。 */
  bookId?: string;
  page: number;
  quote?: string;
  source: HeYeSource;
  /** 来源标签：卡引用 / 字段 · <label> / 原子 · <prompt 摘要>。 */
  sourceLabel: string;
  /** 对页辅助上下文：字段值或原子问题（卡引用为空）。 */
  context?: string;
};

function quoteKey(quote?: string): string {
  return (quote ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
}

/**
 * 收集待核队列：cite.page != null && cite.verified === false。
 * - 来源：card.cites（卡引用）→ fields[].cite（字段）→ atoms[].cite（原子）
 * - 去重：cardId + page + quote 归一化后相同只保留第一条（避免同一句在卡引用/字段里刷屏）；
 *   无 quote 时按来源 id 兜底，同卡同页无引文的多条卡引用合并为一条。
 * - ?book= 过滤；无参默认**全部已解析卡**（含未注册进书库的章——核页是数据质量工具，
 *   范围宁宽勿窄；UI 仍可按书过滤）。
 * - ?card= 收窄（书桌卡枢纽 /review?card=）：只收集该卡待核项；语义 page!=null && verified===false 不变。
 *   组合规则：cardId 与 bookId 并存时要求卡属于该书（一致性约束），不属于 → 空队列；
 *   仅 bookId 无 cardId 时保持原按书行为。
 * - ?page= 收窄（章页卡轨「核本页」）：在现有收集之后按 item.page === page 过滤（选择此实现并固化为注释）——
 *   与 bookId 并存即「先书后页」，与 cardId 并存即交集；语义不变，零回写。
 * - ?chapter= 收窄（核页工作台章芯片，T16）：在**卡集合阶段**按 card.chapterId 过滤（比收集后过滤省扫描）——
 *   与 page 为交集；与 bookId 并存要求章属于该书（不属于 → 空队列）；与 cardId 并存要求卡属于该章（否则空）。
 */
export function collectCiteQueue(opts?: {
  bookId?: string;
  cardId?: string;
  page?: number;
  chapterId?: string;
}): HeYeItem[] {
  const { bookId, cardId, page, chapterId } = opts ?? {};

  let cards = loadCards(bookId ? { bookId } : undefined);
  if (cardId != null) {
    const card = loadCard(cardId);
    if (!card) {
      cards = [];
    } else if (bookId != null) {
      const book = loadBooks().find((b) => b.id === bookId);
      cards = book && book.chapterIds.includes(card.chapterId ?? "") ? [card] : [];
    } else {
      cards = [card];
    }
    // cardId + chapterId：交集（卡必须属于该章）。
    if (chapterId != null && cards.length > 0) {
      cards = cards.filter((c) => c.chapterId === chapterId);
    }
  } else if (chapterId != null && bookId != null) {
    // chapterId + bookId：章须属于该书（一致性约束），不属于 → 空队列。
    const book = loadBooks().find((b) => b.id === bookId);
    cards = book && book.chapterIds.includes(chapterId)
      ? loadCards({ chapterId })
      : [];
  } else if (chapterId != null) {
    cards = loadCards({ chapterId });
  }
  const books = loadBooks();
  const bookOf = new Map<string, string>();
  for (const b of books) for (const ch of b.chapterIds) bookOf.set(ch, b.id);

  const seen = new Set<string>();
  const items: HeYeItem[] = [];

  function push(
    cardId: string,
    cardName: string,
    chapterId: string | undefined,
    page: number,
    quote: string | undefined,
    source: HeYeSource,
    sourceLabel: string,
    sourceId: string,
    context?: string,
  ) {
    const qk = quoteKey(quote);
    // 有 quote 跨来源去重；无 quote 保留来源粒度（但同来源同页合并）。
    const key = qk
      ? `${cardId}|${page}|q:${qk}`
      : `${cardId}|${page}|${source}:${sourceId}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      key,
      cardId,
      cardName,
      chapterId,
      bookId: chapterId ? bookOf.get(chapterId) : undefined,
      page,
      quote,
      source,
      sourceLabel,
      context,
    });
  }

  for (const c of cards) {
    for (const x of c.cites) {
      if (x.page == null || x.verified !== false) continue;
      push(c.id, c.name_zh, c.chapterId, x.page, x.quote, "card", "卡引用", "card");
    }
    for (const f of c.fields) {
      const x = f.cite;
      if (!x || x.page == null || x.verified !== false) continue;
      push(
        c.id,
        c.name_zh,
        c.chapterId,
        x.page,
        x.quote,
        "field",
        `字段 · ${f.label}`,
        `field:${f.label}`,
        f.value,
      );
    }
    for (const a of c.atoms) {
      const x = a.cite;
      if (!x || x.page == null || x.verified !== false) continue;
      push(
        c.id,
        c.name_zh,
        c.chapterId,
        x.page,
        x.quote,
        "atom",
        `原子 · ${a.prompt.slice(0, 18)}${a.prompt.length > 18 ? "…" : ""}`,
        `atom:${a.id}`,
        a.prompt,
      );
    }
  }

  // ?page= 收窄：收集完成后过滤（先书/卡后页；与 cardId/chapterId 为交集）。
  const scoped = page != null ? items.filter((it) => it.page === page) : items;

  // 按页码再按卡名排序：对页时相邻条目大概率同页，减少来回翻页。
  return scoped.sort(
    (a, b) => a.page - b.page || a.cardName.localeCompare(b.cardName, "zh"),
  );
}
