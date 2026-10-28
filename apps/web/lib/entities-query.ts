/**
 * T95 机械抽出：原 lib/entities.ts query 分区（StudyAtom · PageCiteHit · PageCitingCard ·
 * cardsCitingPage · collectStudyAtoms）整段迁此——页→卡反向索引按 card.id 去重、同来源同 quote
 * 只留一条、page / verified 原样取自 cite、zh localeCompare 稳定排序；collectStudyAtoms
 * cardId×bookId/chapterId 一致性约束与 T27 A page 卡级命中交集 逐字一致；只读 seed，不改数据 /
 * 不编造卡。
 * 本件 ← ./entities-types.ts（type-only：Atom · Cite · EntityCard）+ ./entities-loaders.ts
 * （loadBooks · loadCard · loadCards）；无 fs / path；不直引 io；禁 import materials。
 */

import type { Atom, Cite, EntityCard } from "./entities-types.ts";
import { loadBooks, loadCard, loadCards } from "./entities-loaders.ts";

/** 学习环视图模型：卡片的所有原子扁平化，带卡/章上下文。 */
export type StudyAtom = {
  cardId: string;
  cardName: string;
  cardNameEn?: string;
  chapterId?: string;
  atomId: string;
  prompt: string;
  answer: string;
  difficulty: Atom["difficulty"];
  cite?: Cite;
};

/** 页引用命中摘要（本页卡轨用）：来源标签 + 短引文（UI 再截断）。 */
export type PageCiteHit = {
  source: "card" | "field" | "atom";
  label: string;
  quote?: string;
  /** 原样自 cite.page（与查询页一致），供轨上 CitePeek 构造一致 Cite。 */
  page: number;
  /** 原样自 cite.verified（seed 抽查态，勿编造；不等于本机核页标记）。 */
  verified: boolean;
};

/** 页 → 卡反向索引的一条结果：轻量卡摘要（不进完整 atoms/fields，控制 payload）。 */
export type PageCitingCard = {
  cardId: string;
  nameZh: string;
  nameEn?: string;
  kind: EntityCard["kind"];
  oneLiner: string;
  chapterId?: string;
  atomCount: number;
  hits: PageCiteHit[];
};

/**
 * 页 → 卡反向索引：扫描每张卡的 cites / fields[].cite / atoms[].cite，
 * cite.page === page 即命中；按 card.id 去重（同卡多处命中合并 hits，同来源同 quote 只留一条）。
 * bookId 可选：只扫该书章节下的卡（与 loadCards({bookId}) 一致）。
 * 只读 seed，禁止改数据 / 编造卡。
 */
export function cardsCitingPage(page: number, opts?: { bookId?: string }): PageCitingCard[] {
  const out: PageCitingCard[] = [];
  for (const c of loadCards(opts?.bookId ? { bookId: opts.bookId } : undefined)) {
    const hits: PageCiteHit[] = [];
    const seen = new Set<string>();
    const push = (cite: Cite | undefined, source: PageCiteHit["source"], label: string) => {
      if (!cite || cite.page !== page) return;
      const key = `${source}|${label}|${(cite.quote ?? "").trim().replace(/\s+/g, " ")}`;
      if (seen.has(key)) return;
      seen.add(key);
      // page/verified 原样取自 cite（已保证 cite.page === page，勿改值、勿编造抽查态）。
      hits.push({
        source,
        label,
        quote: cite.quote,
        page: cite.page as number,
        verified: cite.verified,
      });
    };
    for (const x of c.cites) push(x, "card", "卡引用");
    for (const f of c.fields) push(f.cite, "field", `字段 · ${f.label}`);
    for (const a of c.atoms) push(a.cite, "atom", `原子 · ${a.prompt}`);
    if (hits.length > 0) {
      out.push({
        cardId: c.id,
        nameZh: c.name_zh,
        nameEn: c.name_en,
        kind: c.kind,
        oneLiner: c.one_liner,
        chapterId: c.chapterId,
        atomCount: c.atoms.length,
        hits,
      });
    }
  }
  // 按卡名稳定排序（服务端/客户端一致，避免水合错位）。
  return out.sort((a, b) => a.nameZh.localeCompare(b.nameZh, "zh"));
}

/**
 * 组合规则（cardId 与 book/chapter 并存时）：
 * - 仅 cardId：只出该卡 atoms（书桌卡枢纽 /study?card= 的范围）。
 * - cardId + bookId / chapterId：要求卡属于该范围（一致性约束）——不属于则空数组，
 *   由页面诚实回落（卡不存在 / 范围不匹配都给警告文案），不静默放宽。
 * - 仅 bookId / chapterId（无 cardId）：原行为不变（按书 / 章过滤全库）。
 * - page（T27 A）：与上述范围取交集后，只保留 cardsCitingPage(page, {bookId}) 命中卡的
 *   全部 atoms——口径与书桌本页池（DocumentPane pageAtoms）一致：卡 cites / 字段 cite /
 *   原子 cite 任一命中该印刷页即整卡入池，不是「仅 atom.cite.page === N」。
 *   page + cardId：卡须 citing 该页且属范围，否则空数组（页面侧琥珀诚实）。
 */
export function collectStudyAtoms(opts?: {
  chapterId?: string;
  bookId?: string;
  cardId?: string;
  page?: number;
}): StudyAtom[] {
  const { cardId, page, ...scope } = opts ?? {};

  let cards: EntityCard[];
  if (cardId != null) {
    const card = loadCard(cardId);
    if (!card) return [];
    const inBook =
      scope.bookId == null ||
      loadBooks().some(
        (b) => b.id === scope.bookId && b.chapterIds.includes(card.chapterId ?? ""),
      );
    const inChapter = scope.chapterId == null || card.chapterId === scope.chapterId;
    if (!inBook || !inChapter) return [];
    cards = [card];
  } else {
    cards = loadCards(scope);
  }

  // page 过滤（T27 A）：与 cardsCitingPage 同口径的卡级命中（见上注释），交集不留分叉。
  if (page != null) {
    const citingIds = new Set(
      cardsCitingPage(page, { bookId: scope.bookId }).map((c) => c.cardId),
    );
    cards = cards.filter((c) => citingIds.has(c.id));
  }

  return cards.flatMap((c) =>
    c.atoms.map((a) => ({
      cardId: c.id,
      cardName: c.name_zh,
      cardNameEn: c.name_en,
      chapterId: c.chapterId,
      atomId: a.id,
      prompt: a.prompt,
      answer: a.answer,
      difficulty: a.difficulty,
      cite: a.cite,
    })),
  );
}
