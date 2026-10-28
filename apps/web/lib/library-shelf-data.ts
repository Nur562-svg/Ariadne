import { atomIncomplete } from "@/lib/atom-draft";
import { collectBookPools, type BookPools } from "@/lib/book-pools";
import { scoreChapter, type CiteQuality } from "@/lib/cite-ocr-quality";
import { loadExtractPageDensity } from "@/lib/extract-page-density-server";
import { loadExtractPageCoverage } from "@/lib/extract-page-coverage-server";
import {
  loadBookValidPages,
  loadCards,
  loadChapterPages,
  loadChapters,
  type BookConfig,
} from "@/lib/entities";
import { loadParseCoverage } from "@/lib/parse-ocr-coverage-server";
import { loadChapterQualityRollup } from "@/lib/chapter-quality-rollup-server";
import type { ChapterQualityRollup } from "@/lib/chapter-quality-rollup";

/**
 * T97 desk-library-shelf-split-01：书库页（书架）服务端装配——自 app/(desk)/page.tsx :35–220
 * 机械抽出（T31 validPages · T50 pools · T62 draft 索引 · T63 章质检 rollup · T55 cite 质量 ·
 * T56 parse 覆盖 · T57 抽出页覆盖 · T59 抽出密度）。折叠算法与未检 null 口径逐字搬迁；
 * 无 "use client"（纯服务端只读装配）。禁在此改写 scoreChapter / loadParseCoverage /
 * loadExtractPage* 语义或发明第二套池。
 */

/** T56 书级 parse 覆盖信号（任章 weak → 书级琥珀；空/稀书级合计；缺 blocks 章＝未检计数）。 */
export type ShelfBookParseSignal = {
  weak: boolean;
  empty: number;
  sparse: number;
  unchecked: number;
};

/** T57 书级抽出页覆盖信号（暗页书级合计，darkRate 按合计重算）。 */
export type ShelfBookExtractPageSignal = {
  weak: boolean;
  dark: number;
  darkRate: number;
  unchecked: number;
};

/** T59 书级抽出密度信号（浅页书级合计，shallowRate 按合计重算）。 */
export type ShelfBookDensitySignal = {
  weak: boolean;
  shallow: number;
  shallowRate: number;
  unchecked: number;
};

export function buildLibraryShelfData(books: BookConfig[]) {
  /** T31 C：各书已解析印刷页集合——继续上次 / 每书「续开 p.N」读侧幽灵页消毒。 */
  const bookValidPages = loadBookValidPages();
  /**
   * T50 E：各书练/核池（书级长度 + 页→原子/待核 map）——collectBookPools 单一装配口径
   * （collectStudyAtoms / collectCiteQueue / cardsCitingPage 卡级命中同池族，禁第二套池、
   * 禁造假正数）：书架续开「练本页/核本页」、footer「学习环/核页」、「继续上次」学习环/核页
   * 空池门禁共用；客户端按 healed/last.page 查页级 map，缺 key 当 0（fail-closed）。
   */
  const poolsByBook: Record<string, BookPools> = {};
  for (const b of books) poolsByBook[b.id] = collectBookPools(b.id);

  /**
   * T62 I：草稿收件箱种子 props——slim 卡索引（全库 id/名/章，不整库下传 entities）+
   * seed 口径 incomplete 摘要（atomIncomplete 与 T55 incompleteAtoms 同口径；只列 >0 的卡）。
   * Server 只读 loadCards；Client 读草稿键并按需只读 GET /api/entities/<id>（详见 DraftInbox）。
   */
  const inboxCards = loadCards();
  const draftCardIndex = inboxCards.map((c) => ({
    id: c.id,
    nameZh: c.name_zh,
    chapterId: c.chapterId,
  }));

  /**
   * T63 I：章质检驾驶舱装配——各书各章 loadChapterQualityRollup（只拼装既有同真算法
   * scoreChapter / loadParseCoverage / loadExtractPageCoverage / loadExtractPageDensity /
   * T55 incomplete 口径，零重算零新阈值；缺 blocks/entities → null=未检不装完美 0）。
   * 草稿列由 Client 读 ariadne.atom-draft.v1 交叉（T62，不改键、不进 progress-port）。
   */
  const chapterTitles: Record<string, string> = {};
  for (const c of loadChapters()) chapterTitles[c.id] = c.title;
  const rollupByChapter: Record<string, ChapterQualityRollup> = {};
  for (const b of books) {
    for (const chId of b.chapterIds) {
      if (!(chId in rollupByChapter)) rollupByChapter[chId] = loadChapterQualityRollup(chId);
    }
  }
  const incompleteCardSummaries = inboxCards
    .map((c) => ({
      id: c.id,
      name: c.name_zh,
      chapterId: c.chapterId,
      incompleteAtoms: c.atoms.filter((a) => atomIncomplete(a)).length,
    }))
    .filter((s) => s.incompleteAtoms > 0);

  /**
   * T55 H/I：书级质量徽装配——各书折叠其章 scoreChapter（与 pnpm cite-check / ingest
   * 章清单同真算法；缺 OCR 文本的 cite 不计 miss＝未检，不抬假阳）。章级 textByPage /
   * cards 跨书缓存一次；弱书（OCR未见/零原子/不完备 任一 >0）才出琥珀徽，好书不吵。
   */
  const qualityTextByCh = new Map<string, Record<number, string>>();
  const qualityCardsByCh = new Map<string, Parameters<typeof scoreChapter>[0]>();
  function chapterCheck(chId: string): CiteQuality | null {
    if (!qualityTextByCh.has(chId)) {
      const textByPage: Record<number, string> = {};
      for (const p of loadChapterPages(chId)) {
        if (p.page != null) textByPage[p.page] = p.text;
      }
      qualityTextByCh.set(chId, textByPage);
      qualityCardsByCh.set(chId, loadCards({ chapterId: chId }));
    }
    const chCards = qualityCardsByCh.get(chId) ?? [];
    if (chCards.length === 0) return null; // 无 entities＝未检，不装 0 假数
    return scoreChapter(chCards, qualityTextByCh.get(chId) ?? {});
  }
  const bookQuality: Record<string, CiteQuality | null> = {};
  for (const b of books) {
    const qs = b.chapterIds.map((chId) => chapterCheck(chId)).filter((q): q is CiteQuality => q != null);
    if (qs.length === 0) {
      bookQuality[b.id] = null;
      continue;
    }
    const folded = qs.reduce<CiteQuality>(
      (acc, q) => {
        acc.cards += q.cards;
        acc.atoms += q.atoms;
        acc.cites += q.cites;
        acc.nullPage += q.nullPage;
        acc.ocrMiss += q.ocrMiss;
        acc.zeroAtomCards += q.zeroAtomCards;
        acc.emptyPromptAtoms += q.emptyPromptAtoms;
        acc.emptyAnswerAtoms += q.emptyAnswerAtoms;
        acc.incompleteAtoms += q.incompleteAtoms;
        return acc;
      },
      {
        cards: 0, atoms: 0, cites: 0, nullPage: 0, ocrMiss: 0, zeroAtomCards: 0,
        missRate: 0, emptyPromptAtoms: 0, emptyAnswerAtoms: 0, incompleteAtoms: 0,
      },
    );
    folded.missRate = folded.cites > 0 ? folded.ocrMiss / folded.cites : 0;
    bookQuality[b.id] = folded;
  }

  /**
   * T56 G/I：书级 parse 覆盖徽装配——各章 loadParseCoverage（与 pnpm parse-check 同真；
   * 缺 blocks 章＝未检，不装完美覆盖）；任章 weak → 书级琥珀徽（空/稀书级合计）。
   * 与 T55 cite 质量徽**分列**（两枚徽、两行口径），不合并不改写。
   */
  const bookParse: Record<string, ShelfBookParseSignal> = {};
  for (const b of books) {
    let weak = false;
    let empty = 0;
    let sparse = 0;
    let unchecked = 0;
    for (const chId of b.chapterIds) {
      const cov = loadParseCoverage(chId);
      if (cov == null) {
        unchecked++;
        continue;
      }
      if (cov.weak) weak = true;
      empty += cov.emptyPages;
      sparse += cov.sparsePages;
    }
    bookParse[b.id] = { weak, empty, sparse, unchecked };
  }

  /**
   * T57 G/I：书级抽出页覆盖徽装配——各章 loadExtractPageCoverage（与 pnpm page-check
   * 同真；缺 blocks/entities 章＝未检，不装 darkCount=0 完美）；任章 weak → 书级琥珀
   * 徽（暗页书级合计，darkRate 按合计重算）。与 T55 cite 质量徽 / T56 parse 覆盖徽
   * **三分列**（三枚徽、三行口径，不合并不改写——暗页是抽出后「实质页未成原子」
   * 信号，与 OCR 空稀、cite↔OCR 比对互斥不伪装）。
   */
  const bookExtractPage: Record<string, ShelfBookExtractPageSignal> = {};
  for (const b of books) {
    let weak = false;
    let dark = 0;
    let substantial = 0;
    let unchecked = 0;
    for (const chId of b.chapterIds) {
      const cov = loadExtractPageCoverage(chId);
      if (cov == null) {
        unchecked++;
        continue;
      }
      if (cov.weak) weak = true;
      dark += cov.darkCount;
      substantial += cov.substantialPages;
    }
    bookExtractPage[b.id] = {
      weak,
      dark,
      darkRate: substantial > 0 ? dark / substantial : 0,
      unchecked,
    };
  }

  /**
   * T59 G/I：书级抽出密度折叠——各章 loadExtractPageDensity（与 pnpm density-check
   * 同真；缺 blocks/entities 章＝未检，不装 shallowCount=0 完美）。任章 weak → 书级
   * 浅信号（浅页书级合计，shallowRate 按合计重算）**旁挂**在 T57「抽出偏稀」行——
   * 不拆 cite|parse|暗 三分列骨架、不造第四大红独立列；浅 ≠ 暗（浅 = 已 cite 页原子
   * 极稀，暗 = 零 cite），两概念在同一点名行分列不合并。
   */
  const bookDensity: Record<string, ShelfBookDensitySignal> = {};
  for (const b of books) {
    let weak = false;
    let shallow = 0;
    let substantial = 0;
    let unchecked = 0;
    for (const chId of b.chapterIds) {
      const den = loadExtractPageDensity(chId);
      if (den == null) {
        unchecked++;
        continue;
      }
      if (den.weak) weak = true;
      shallow += den.shallowCount;
      substantial += den.substantialPages;
    }
    bookDensity[b.id] = {
      weak,
      shallow,
      shallowRate: substantial > 0 ? shallow / substantial : 0,
      unchecked,
    };
  }

  return {
    bookValidPages,
    poolsByBook,
    draftCardIndex,
    chapterTitles,
    rollupByChapter,
    incompleteCardSummaries,
    bookQuality,
    bookParse,
    bookExtractPage,
    bookDensity,
  };
}

export type LibraryShelfData = ReturnType<typeof buildLibraryShelfData>;
