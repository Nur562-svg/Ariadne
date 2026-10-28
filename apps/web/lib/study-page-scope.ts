import {
  collectStudyAtoms,
  findPageByPrinted,
  loadBookValidPages,
  loadCard,
  type BookConfig,
  type ChapterConfig,
} from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import { scopeExaminableCoverage, loadPageExaminable } from "@/lib/examinable-coverage-server";
import type { StudyMode } from "@/lib/study";

/**
 * T98 desk-study-page-split-01：/study 学习页服务端装配——自 app/(desk)/study/page.tsx
 * StudyBody 内 `return (` 前整段（原 :66–355）机械抽出。T20–T60 各派生口径逐字搬迁：
 * QS 消毒 / orphan 判定 / effChapter / 卡·页范围池 / sticky 双键 / 回书桌·核页·放宽
 * href 族 / Strip 与 progress* 同源池 / 可考覆盖与本页 hint。禁在此改写
 * collectStudyAtoms / collectCiteQueue / scopeExaminableCoverage / orphan 判定 /
 * QS 语义或发明第二套池。无 "use client"（纯服务端只读装配）。
 */

/** /study 页面 QS 形（page 与本模块共用的 resolved searchParams）。 */
export type StudyPageSearchParams = {
  book?: string;
  chapter?: string;
  mode?: string;
  card?: string;
  page?: string;
};

export function buildStudyPageScope(
  sp: StudyPageSearchParams,
  chapters: ChapterConfig[],
  books: BookConfig[],
) {
  const {
    book: bookId,
    chapter: chapterId,
    mode: modeParam,
    card: cardId,
    page: pageParam,
  } = sp;
  const activeBook = bookId ? books.find((b) => b.id === bookId) : undefined;
  const activeChapter = chapterId ? chapters.find((c) => c.id === chapterId) : undefined;
  const invalidBook = bookId != null && !activeBook;
  /** ?card= 单卡范围（找不到卡 → 诚实回落书/全部范围）。 */
  const scopedCard = cardId != null ? loadCard(cardId) : undefined;
  const invalidCard = cardId != null && !scopedCard;
  /** ?page= 本页范围（T27 C）：正整数才生效；非法 → 琥珀警告 + 页过滤不生效（对齐 review）。 */
  const pageNum = pageParam != null && /^\d+$/.test(pageParam) ? Number(pageParam) : null;
  const invalidPage = pageParam != null && pageNum == null;
  const mode: StudyMode =
    modeParam === "ungraded" || modeParam === "unknown" ? modeParam : "all";
  /**
   * T43 A（对齐 review invalid* + effChapter）：坏 QS 不静默——
   * - mode 未识别 → 琥珀 + 回落「全部」（StickyModeGate 本就不写非法档，勿改契约）；
   * - 章 id 未注册 / 章不在 ?book= 内 → 琥珀；章过滤不生效，按书/全部出题；
   * - effChapter = 单卡（章过滤不生效）且非无效/越界时的有效章——池、qs 继承、芯片当前态、
   *   Strip/progress* 深链全走 effChapter，坏章不再当有效当前章继续传毒。
   */
  const invalidMode =
    modeParam != null && modeParam !== "all" && mode !== (modeParam as StudyMode);
  const invalidChapter = chapterId != null && !activeChapter;
  const chapterOutsideBook =
    activeChapter != null && activeBook != null && !activeBook.chapterIds.includes(activeChapter.id);
  const effChapter = !scopedCard && activeChapter && !chapterOutsideBook ? activeChapter : undefined;

  /** 章 → 书反查：无 ?book= 时也能让 CiteChip 深链回对应书的书桌章页。 */
  const bookByChapter: Record<string, string> = {};
  for (const b of books) for (const ch of b.chapterIds) bookByChapter[ch] = b.id;

  /** 卡所在书（chapterId 反查）：单卡范围的章页深链与回书桌都以它为准（可受 ?book= 覆盖）。 */
  const cardBookId = scopedCard?.chapterId ? bookByChapter[scopedCard.chapterId] : undefined;
  const scopeBook = activeBook ?? (cardBookId ? books.find((b) => b.id === cardBookId) : undefined);

  /** T28 A densify：章芯片按可解析书（?book= 或单卡反查 scopeBook）过滤，有书不铺全库；
   *  单卡范围固定，隐藏章芯片。当前章朱红；切章即离页（study qs 已有，勿回退）。 */
  const chipChapters = scopeBook
    ? chapters.filter((c) => scopeBook.chapterIds.includes(c.id))
    : chapters;

  /**
   * 本页池（T27 A/C）：collectStudyAtoms({page}) 口径 = cardsCitingPage 命中卡全部 atoms，
   * 与书桌 Strip / 卡轨「练本页」同池；page+card 不匹配 → 空队列 + 页面琥珀诚实。
   * T43 A：章过滤走 effChapter——无效/越界章不进池（与 review collectCiteQueue 同口径）。
   */
  const atoms = collectStudyAtoms(
    scopedCard
      ? {
          cardId: scopedCard.id,
          bookId: activeBook?.id,
          chapterId: effChapter?.id,
          page: pageNum ?? undefined,
        }
      : { bookId: activeBook?.id, chapterId: effChapter?.id, page: pageNum ?? undefined },
  );
  /** 本页核池（T29 B 对齐 review/desk 口径）：page 过滤的 collectCiteQueue，章/书回落池见下。 */
  const heyeItems = collectCiteQueue({
    cardId: scopedCard?.id,
    bookId: activeBook?.id,
    chapterId: effChapter?.id,
    page: pageNum ?? undefined,
  });
  /**
   * T29 C/F 孤儿练判定（合法 pageNum · 非单卡 · 本页无可练原子）——deskPageHint 消毒与
   * Clew page 共用：不把幽灵 page 深链进书桌 / 续开指针 / Clew 会话条。
   */
  const orphanStudy = pageNum != null && !scopedCard && atoms.length === 0;
  /** T43 B：单卡出界（卡有原子但当前 book/chapter/page 过滤后为空）——页头琥珀与空态正文共用同一判定。 */
  const cardOutOfRange = scopedCard != null && atoms.length === 0 && scopedCard.atoms.length > 0;

  /** T20 续位 / sticky 作用域：cursor 含 mode（与 StudySession remount key 对齐），sticky 不含 mode；
   *  T27 C：两键都纳入 page——本页队列的续位/档位记忆不与章/书队列互串。
   *  T43 A：章段走 effChapter——坏章不构成独立作用域，与书级记忆同键。 */
  const studyScopeKey = `${scopedCard?.id ?? "all"}:${activeBook?.id ?? "all"}:${effChapter?.id ?? "all"}:${pageNum ?? "all"}:${mode}`;
  const studyStickyScope = `${scopedCard?.id ?? "all"}:${activeBook?.id ?? "all"}:${effChapter?.id ?? "all"}:${pageNum ?? "all"}`;

  /**
   * 精确回书桌页优先级（T27 C）：?page= 本页 > 单卡首个有页 cite（cites → fields → atoms）；
   * 都无 → null（回书桌不带页，同书保留原页，不擦书桌精确页）。
   * T29 F：孤儿页（本页无可练原子）不把幽灵 page 深链进书桌——hint 置 null，回书桌走书级。
   */
  const deskPageHint = orphanStudy
    ? null
    : pageNum ??
      (scopedCard
        ? (scopedCard.cites.find((c) => c.page != null)?.page ??
          scopedCard.fields.find((f) => f.cite?.page != null)?.cite?.page ??
          scopedCard.atoms.find((a) => a.cite?.page != null)?.cite?.page ??
          null)
        : null);
  /** LastOpenedTouch 精确页：有页才写带 page 的 deskHref。 */
  const deskPageHrefForTouch =
    deskPageHint != null && scopeBook
      ? `/desk?book=${encodeURIComponent(scopeBook.id)}&page=${deskPageHint}`
      : undefined;

  /**
   * qs helper（T27 C）：默认保留 card/book/chapter/mode/page；
   * - 切章（含「全部章节」清章）即离页——不把旧章印刷页残留在新作用域 URL；
   * - clearPage 只清 page（清本页，留书/章/档）。
   * T43 A：章继承走 effChapter（对齐 review qs）——无效/越界章不随档位/清页链继续传毒。
   */
  const qs = (opts?: {
    chapter?: string | null;
    mode?: StudyMode;
    clearPage?: boolean;
  }) => {
    const p = new URLSearchParams();
    if (scopedCard) p.set("card", scopedCard.id);
    if (activeBook) p.set("book", activeBook.id);
    const switchingChapter = opts?.chapter !== undefined;
    const ch = scopedCard
      ? undefined
      : switchingChapter
        ? (opts.chapter ?? undefined)
        : effChapter?.id;
    if (ch) p.set("chapter", ch);
    if (!switchingChapter && !opts?.clearPage && pageNum != null) {
      p.set("page", String(pageNum));
    }
    const m = opts?.mode ?? mode;
    if (m !== "all") p.set("mode", m);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  /**
   * T28 C：本页档空时的放宽链——清 page 且落「全部」档（清本页即看得见池）；
   * 仅有效 pageNum 时传给 StudySession 空档区当次级文字链。
   */
  const widenPageHref =
    pageNum != null ? `/study${qs({ clearPage: true, mode: "all" })}` : undefined;

  /** T28 F：⇧[ / ⇧] 切章目标（章芯片顺序；「全部章节」时下一章 = 第一章，首/末边界 undefined → no-op）。 */
  const chipIndex = chipChapters.findIndex((c) => c.id === effChapter?.id);
  const prevChapterHref =
    chipIndex > 0 ? `/study${qs({ chapter: chipChapters[chipIndex - 1].id })}` : undefined;
  const nextChapterHref =
    chipIndex >= 0 && chipIndex < chipChapters.length - 1
      ? `/study${qs({ chapter: chipChapters[chipIndex + 1].id })}`
      : chipIndex === -1 && chipChapters.length > 0
        ? `/study${qs({ chapter: chipChapters[0].id })}`
        : undefined;

  /** T28 F：sticky 键说明——只列当前实际可用的本页环键（无页不给 g，单卡不给切章）。 */
  const stickyKeys: [string, string][] = [
    ...(pageNum != null ? ([["g", "清本页"]] as [string, string][]) : []),
    ...(!scopedCard && chipChapters.length > 0 ? ([["⇧[ ⇧]", "切章"]] as [string, string][]) : []),
  ];

  /** 范围文案（T27 C）：有效页优先标「本页 p.N」（Strip/会话条同此口径）；单卡仍卡名。
   *  T43 A：章段走 effChapter——坏章不冒充当前范围（池本就按书/全部算）。 */
  const scopeLabel = scopedCard
    ? `卡《${scopedCard.name_zh}》${scopeBook ? ` · 《${scopeBook.title}》` : ""}`
    : pageNum != null
      ? `本页 p.${pageNum}`
      : (effChapter?.title ?? activeBook?.title ?? "全部已注册书目");
  const deskHref = scopeBook
    ? `/desk?book=${encodeURIComponent(scopeBook.id)}${
        deskPageHint != null ? `&page=${deskPageHint}` : ""
      }`
    : "/desk";
  /**
   * 单卡 → 核本卡（兼书）；书/全范围 → 核页深链。T26 C 带章；T27 D：有效页带 page
   * （本页练完核本页，不落到丢页的章/全书）；无书有页（手写 URL）→ 仅 ?page=。
   * T39 C：凡有范围落到 /review?… 的分支恒拼 &mode=open（单卡 / 本页 / 章 / 书 / 仅 page）——
   * StudySession 空·完成态「核本卡 / 去核页」与空范围「核本卡」共用本构造点，一次覆盖；
   * 交叉链不再裸范围被核侧 StickyModeGate 回补成 checked/doubt 空档。sticky「去核同范围」
   * 走 progressReviewHref（自有 mode）只回归。无范围裸 /review 保持。
   */
  const reviewHref = scopedCard
    ? `/review?card=${encodeURIComponent(scopedCard.id)}${
        activeBook ? `&book=${encodeURIComponent(activeBook.id)}` : ""
      }&mode=open`
    : pageNum != null
      ? activeBook
        ? `/review?book=${encodeURIComponent(activeBook.id)}${
            effChapter ? `&chapter=${encodeURIComponent(effChapter.id)}` : ""
          }&page=${pageNum}&mode=open`
        : `/review?page=${pageNum}&mode=open`
      : activeBook
        ? `/review?book=${encodeURIComponent(activeBook.id)}${
            effChapter ? `&chapter=${encodeURIComponent(effChapter.id)}` : ""
          }&mode=open`
        : "/review";
  /** 完成/空态「回本卡」（仅 ?card= 时展示）。 */
  const cardHref = scopedCard ? `/desk/card/${encodeURIComponent(scopedCard.id)}` : undefined;

  /** T31 F + T32 E：该书已解析印刷页表——ReturnNav 与 StudySession 的 lastOpened 回落页消毒（脏页不采用）。 */
  const scopeBookValidPages = scopeBook ? loadBookValidPages()[scopeBook.id] : undefined;

  /**
   * T29 B/F（T28 B 口径对齐 review/desk）：练/核各自判本页——本页无可练原子时练侧回落
   * 章/书池，本页无待核 cite 时核侧回落；标签如实分写；孤儿页（双空）按章/书池统计，
   * 不再把空池标成「本页 p.N」与书桌/核页同页互谎。单卡用卡交集池（标签「本卡」）。
   */
  const scopeStudyAtoms =
    pageNum != null && !scopedCard
      ? collectStudyAtoms({ bookId: activeBook?.id, chapterId: effChapter?.id })
      : atoms;
  const scopeHeYeItems =
    pageNum != null && !scopedCard
      ? collectCiteQueue({ bookId: activeBook?.id, chapterId: effChapter?.id })
      : heyeItems;
  const stripStudyPageScope = pageNum != null && !scopedCard && atoms.length > 0;
  const stripHeYePageScope = pageNum != null && !scopedCard && heyeItems.length > 0;
  const sideScopeLabel = effChapter
    ? `本章 ${effChapter.id}`
    : activeBook
      ? "本书"
      : "全部";
  const stripScopeLabel = scopedCard
    ? "本卡"
    : stripStudyPageScope && stripHeYePageScope
      ? `本页 p.${pageNum}`
      : stripHeYePageScope
        ? `练${sideScopeLabel} · 核 p.${pageNum}`
        : stripStudyPageScope
          ? `练 p.${pageNum} · 核${sideScopeLabel}`
          : sideScopeLabel;
  /** Strip / Clew 同源池（练/核各自判本页；单卡用卡交集池）。 */
  const stripAtoms = (scopedCard || stripStudyPageScope ? atoms : scopeStudyAtoms).map((a) => ({
    cardId: a.cardId,
    atomId: a.atomId,
  }));
  const stripItemKeys = (scopedCard || stripHeYePageScope ? heyeItems : scopeHeYeItems).map(
    (it) => ({ key: it.key }),
  );
  /**
   * T29 B：Clew progress* 同范围练/核深链（对齐书桌 DocumentPane / review 规则）：练侧显式
   * mode=all，核侧 mode=open；仅对应本页池非空才带 &page=（孤儿页不深链幽灵印刷页）。
   */
  const progressStudyQs = new URLSearchParams();
  if (scopedCard) progressStudyQs.set("card", scopedCard.id);
  if (activeBook) progressStudyQs.set("book", activeBook.id);
  if (effChapter && !scopedCard) progressStudyQs.set("chapter", effChapter.id);
  if (pageNum != null && (scopedCard ? atoms.length > 0 : stripStudyPageScope))
    progressStudyQs.set("page", String(pageNum));
  progressStudyQs.set("mode", "all");
  const progressStudyHref = `/study?${progressStudyQs.toString()}`;
  const progressReviewQs = new URLSearchParams();
  if (scopedCard) progressReviewQs.set("card", scopedCard.id);
  if (activeBook) progressReviewQs.set("book", activeBook.id);
  if (effChapter && !scopedCard) progressReviewQs.set("chapter", effChapter.id);
  if (pageNum != null && (scopedCard ? heyeItems.length > 0 : stripHeYePageScope))
    progressReviewQs.set("page", String(pageNum));
  progressReviewQs.set("mode", "open");
  const progressReviewHref = `/review?${progressReviewQs.toString()}`;

  /**
   * T40 A/C：练面回程 payload——页头 Strip（条末「核此范围」+ 核侧 N>0 分段）与 sticky
   * 「去核同范围」client 岛**共用同一份**（禁第二套口径）：回本学习环范围（progressStudyHref
   * 与练侧池/标签同源、已含默认 mode=all；孤儿页不带幽灵 page= 沿用 progress* 消毒）。
   * label 短标「学习环 · scope」（hover 提示用，勿长句）。key 仍 ariadne.desk.return.v1。
   */
  const studyReturnTo = { href: progressStudyHref, label: `学习环 · ${stripScopeLabel}` };

  /**
   * T58 B/I：scope 可考覆盖（**消费** T57 extract-page 暗页信号，勿另起第二套算法）——
   * - 单卡 scope 跳过（卡级无「暗页章」意义，口径文档化：不装章级覆盖条）；
   * - 章 scope = 单章；书 scope = 全书章折叠；本页 scope = 页所在章；裸 /study = 全部章折叠；
   * - 缺 blocks/entities 章如实未检，整 scope 全未检 → null（不装 examinableRate 完美，
   *   无 cards 不装假 0 暗）。数字与 pnpm page-check / 书架暗徽同源同真。
   */
  const pageOwner = pageNum != null ? findPageByPrinted(pageNum) : undefined;
  const examChapterIds = scopedCard
    ? null
    : effChapter
      ? [effChapter.id]
      : pageNum != null
        ? pageOwner?.chapterId
          ? [pageOwner.chapterId]
          : null
        : activeBook
          ? activeBook.chapterIds
          : chapters.map((c) => c.id);
  const examCoverage = examChapterIds ? scopeExaminableCoverage(examChapterIds) : null;
  /**
   * T58 D + T60 D/I：本页可考性 hint——orphan 分型点名（ghost 页 / 章未抽出 → 不点名
   * 暗）；sparse 归 T56 口径只轻提，dark 才换暗页正文。T60 起非 orphan 页也算（浅旁挂：
   * 本页有原子 × hint==='shallow' 时点名「原子偏稀」——浅页有 cite 不是 orphan，勿改写
   * orphan 暗正文）。atomCount 只计 atoms[].cite.page（与 density-check 同口径）。
   */
  const pageExam = pageNum != null ? loadPageExaminable(pageNum) : null;

  return {
    bookId,
    chapterId,
    modeParam,
    cardId,
    pageParam,
    activeBook,
    activeChapter,
    invalidBook,
    scopedCard,
    invalidCard,
    pageNum,
    invalidPage,
    mode,
    invalidMode,
    invalidChapter,
    chapterOutsideBook,
    effChapter,
    bookByChapter,
    scopeBook,
    chipChapters,
    atoms,
    heyeItems,
    orphanStudy,
    cardOutOfRange,
    studyScopeKey,
    studyStickyScope,
    deskPageHint,
    deskPageHrefForTouch,
    qs,
    widenPageHref,
    prevChapterHref,
    nextChapterHref,
    stickyKeys,
    scopeLabel,
    deskHref,
    reviewHref,
    cardHref,
    scopeBookValidPages,
    stripScopeLabel,
    stripAtoms,
    stripItemKeys,
    progressStudyHref,
    progressReviewHref,
    studyReturnTo,
    pageOwner,
    examCoverage,
    pageExam,
  };
}

/** T98：/study 页装配模型——page / StudyPageChrome / StudyPageEmpty 三方同源消费（勿另算）。 */
export type StudyPageScope = ReturnType<typeof buildStudyPageScope>;
