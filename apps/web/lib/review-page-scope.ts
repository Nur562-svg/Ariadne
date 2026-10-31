import {
  collectStudyAtoms,
  loadAllChapterPages,
  loadBookValidPages,
  loadCard,
  type BookConfig,
  type ChapterConfig,
} from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import { loadPageExaminable } from "@/lib/examinable-coverage-server";
import type { HeYeMode } from "@/lib/heye-store";

/**
 * T99 desk-review-page-split-01：/review 核页面服务端装配——自 app/(desk)/review/page.tsx
 * ReviewBody 内 `return (` 前整段（原 :72–324）机械抽出。T16–T60 各派生口径逐字搬迁：
 * QS 消毒 / orphanReview / effChapter / 卡·页范围池 / stickyKeys / studyHref / deskPageHref
 * / progress* 与 Strip 同源池 / emptyKind / crossStudyAtomCount / pageExam / orphanDark / pageShallow。
 * 禁在此改写 collectCiteQueue / orphan 判定 / emptyKind 三态 / QS 语义或发明第二套池。
 * 无 "use client"（纯服务端只读装配）。
 */

/** /review 页面 QS 形（page 与本模块共用的 resolved searchParams）。 */
export type ReviewPageSearchParams = {
  book?: string;
  card?: string;
  page?: string;
  chapter?: string;
  mode?: string;
};

export function buildReviewPageScope(
  sp: ReviewPageSearchParams,
  chapters: ChapterConfig[],
  books: BookConfig[],
) {
  const { book: bookId, card: cardId, page: pageParam, chapter: chapterParam, mode: modeParam } =
    sp;
  const book = books.find((b) => b.id === bookId);
  const invalidBook = bookId != null && !book;
  const card = cardId != null ? loadCard(cardId) : undefined;
  const invalidCard = cardId != null && !card;
  /** ?page= 需为正整数；非法 → 诚实警告 + 无页过滤回落。 */
  const pageNum = pageParam != null && /^\d+$/.test(pageParam) ? Number(pageParam) : null;
  const invalidPage = pageParam != null && pageNum == null;
  /** ?mode= 只认 open|checked|doubt；非法 → 回落 open + 琥珀警告。 */
  const mode: HeYeMode =
    modeParam === "checked" || modeParam === "doubt" ? modeParam : "open";
  const invalidMode = modeParam != null && modeParam !== "open" && mode !== (modeParam as HeYeMode);
  /** ?chapter= 章过滤：config 未注册 → 警告回落；有书且章不属于该书 → 警告回落全书。 */
  const activeChapter = chapterParam != null ? chapters.find((c) => c.id === chapterParam) : undefined;
  const invalidChapter = chapterParam != null && !activeChapter;
  const chapterOutsideBook =
    activeChapter != null && book != null && !book.chapterIds.includes(activeChapter.id);
  /** 有效章范围：单卡范围固定（隐藏章芯片，章过滤不生效）。 */
  const effChapter = !card && activeChapter && !chapterOutsideBook ? activeChapter : undefined;

  /** T20 续位 / sticky 作用域：cursor 含 mode（与 HeYeSession remount key 对齐），sticky 不含 mode。 */
  const heyeScopeKey = `${book?.id ?? "all"}:${card?.id ?? "all"}:${pageNum ?? "all"}:${effChapter?.id ?? "all"}:${mode}`;
  const heyeStickyScope = `${book?.id ?? "all"}:${card?.id ?? "all"}:${pageNum ?? "all"}:${effChapter?.id ?? "all"}`;

  const items = collectCiteQueue({
    cardId: card?.id,
    bookId: book?.id,
    page: pageNum ?? undefined,
    chapterId: effChapter?.id,
  });
  // OCR 只传队列涉及的页（loadAllChapterPages 真页子集），避免全量 OCR 进客户端。
  const wanted = new Set(items.map((it) => it.page));
  const pages = loadAllChapterPages().filter((p) => p.page != null && wanted.has(p.page));

  /** 卡所在书（章反查，可被 ?book= 覆盖）：范围文案与回书桌深链。 */
  const cardBook =
    card?.chapterId != null
      ? books.find((b) => b.chapterIds.includes(card.chapterId as string))
      : undefined;
  const scopeBook = book ?? cardBook;

  /**
   * T29 C 孤儿核判定：合法 pageNum（非法时 pageNum 为 null）· 非单卡 · 核池空——
   * studyHref / deskPageHref / Clew page / HeYeSession 空态主 CTA 四处共用同一口径。
   */
  const orphanReview = pageNum != null && !card && items.length === 0;

  let scopeLabel = "全部已解析卡";
  if (book) scopeLabel = `《${book.title}》`;
  if (card) scopeLabel = `卡《${card.name_zh}》${scopeBook ? ` · 《${scopeBook.title}》` : ""}`;
  if (effChapter) {
    scopeLabel = `${book ? `《${book.title}》 · ` : ""}${effChapter.id} · ${effChapter.title}`;
  }

  const cardHref = card ? `/desk/card/${encodeURIComponent(card.id)}` : undefined;
  /** T26 C：去学习环带作用域——非单卡时至少 ?book=（有书），有 effChapter 再 &chapter=；
   *  禁止裸 "/study"（换环丢书）。单卡仍 ?card=（兼书）。
   *  T27 D：有效 pageNum 时带 &page=——本页核完去练仍落本页池，不落到丢页的章/全书。
   *  T29 C：孤儿页不带 &page=——不把人送进 page 死环，落 book+chapter 章练；
   *  本页有 cite（items.length>0）时仍带 &page=（T27/T28 不回退）。
   *  T39 C（对称 study）：凡有范围落到 /study?… 的分支恒拼 &mode=all（单卡 / 本页 / 章 / 书）——
   *  HeYeSession 池空·档空·完成态「去学习环 / 去学习本卡」共用本构造点，一次覆盖；交叉链不再
   *  裸范围被练侧 StickyModeGate 回补成 unknown/ungraded 空档。孤儿消毒（不带幽灵 page=）只回归；
   *  单卡时 progressStudyHref 即本 href，sticky「去练同范围」随之同真。无范围裸 /study 保持。 */
  const studyHref = card
    ? `/study?card=${encodeURIComponent(card.id)}${
        book ? `&book=${encodeURIComponent(book.id)}` : ""
      }&mode=all`
    : pageNum != null && !orphanReview
      ? `/study?${
          book ? `book=${encodeURIComponent(book.id)}&` : ""
        }${effChapter ? `chapter=${encodeURIComponent(effChapter.id)}&` : ""}page=${pageNum}&mode=all`
      : book
        ? `/study?book=${encodeURIComponent(book.id)}${
            effChapter ? `&chapter=${encodeURIComponent(effChapter.id)}` : ""
          }&mode=all`
        : "/study";
  /** 回书桌本页（书范围且 page 合法时）：/desk?book=&page= 章页定位。
   *  T29 F 幽灵印刷页卫生：孤儿页不深链 /desk?…&page=999，回落书级 deskHref（文案「回书桌 →」）；
   *  合法且本页池非空（或单卡）的精确回书桌保留。 */
  const deskPageHref =
    pageNum != null && scopeBook && (card || items.length > 0)
      ? `/desk?book=${encodeURIComponent(scopeBook.id)}&page=${pageNum}`
      : undefined;
  /** 无页时回书桌的兜底深链。 */
  const deskHref = scopeBook ? `/desk?book=${encodeURIComponent(scopeBook.id)}` : "/desk";
  /** T32 D：该书已解析印刷页表——sticky ReturnNav lastOpened 回落页消毒（与 study 同口径）。 */
  const scopeBookValidPages = scopeBook ? loadBookValidPages()[scopeBook.id] : undefined;

  /** T28 A densify：章芯片按可解析书（?book= 或卡反查 scopeBook）过滤，有书不铺全库；单卡范围固定，隐藏章芯片。 */
  const chipChapters = scopeBook
    ? chapters.filter((c) => scopeBook.chapterIds.includes(c.id))
    : chapters;

  /**
   * qs helper（T28 A 对齐 study）：切章（含「全部章节」清章）即离页——不把旧章印刷页
   * 残留进新作用域 URL；只改档位时保留 page；clearPage 只删 page（留书/章/档）。
   */
  const qs = (opts?: { chapter?: string | null; mode?: HeYeMode; clearPage?: boolean }) => {
    const p = new URLSearchParams();
    if (book) p.set("book", book.id);
    if (card) p.set("card", card.id);
    const switchingChapter = opts?.chapter !== undefined;
    if (!switchingChapter && !opts?.clearPage && pageNum != null) {
      p.set("page", String(pageNum));
    }
    const ch = card
      ? undefined
      : switchingChapter
        ? (opts.chapter ?? undefined)
        : (effChapter?.id ?? undefined);
    if (ch) p.set("chapter", ch);
    const m = opts?.mode ?? mode;
    if (m !== "open") p.set("mode", m);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  /** T28 A/E：本页过滤的放宽链——只删 page，留书/章/档（仅有效 pageNum 时给，含单卡 mismatch 放宽）。 */
  const clearPageHref = pageNum != null ? `/review${qs({ clearPage: true })}` : undefined;

  /**
   * T28 F：⇧[ / ⇧] 切章目标（章芯片顺序；「全部章节」时下一章 = 第一章，首/末边界 undefined → no-op）。
   */
  const chipIndex = chipChapters.findIndex((c) => c.id === effChapter?.id);
  const prevChapterHref =
    chipIndex > 0 ? `/review${qs({ chapter: chipChapters[chipIndex - 1].id })}` : undefined;
  const nextChapterHref =
    chipIndex >= 0 && chipIndex < chipChapters.length - 1
      ? `/review${qs({ chapter: chipChapters[chipIndex + 1].id })}`
      : chipIndex === -1 && chipChapters.length > 0
        ? `/review${qs({ chapter: chipChapters[0].id })}`
        : undefined;

  /**
   * 作用域进度（T18 分列；T28 B 对齐书桌双作用域）：有效 page 时练侧仍与
   * collectStudyAtoms({page}) 同池（T27 不回退），但练/核各自判本页——
   * 本页无可练原子时练侧回落章/书池、标签如实分写，与书桌同页打开时不互谎。
   */
  const pageStudyAtoms = collectStudyAtoms({
    cardId: card?.id,
    bookId: book?.id,
    chapterId: effChapter?.id,
    page: pageNum ?? undefined,
  });
  const scopeStudyAtoms =
    pageNum != null
      ? collectStudyAtoms({ cardId: card?.id, bookId: book?.id, chapterId: effChapter?.id })
      : pageStudyAtoms;
  const scopeItems =
    pageNum != null
      ? collectCiteQueue({ cardId: card?.id, bookId: book?.id, chapterId: effChapter?.id })
      : items;
  const stripStudyPageScope = pageNum != null && !card && pageStudyAtoms.length > 0;
  const stripHeYePageScope = pageNum != null && !card && items.length > 0;
  const sideScopeLabel = effChapter ? `本章 ${effChapter.id}` : book ? "本书" : "全部";
  const stripScopeLabel = card
    ? "本卡"
    : stripStudyPageScope && stripHeYePageScope
      ? `本页 p.${pageNum}`
      : stripHeYePageScope
        ? `练${sideScopeLabel} · 核 p.${pageNum}`
        : stripStudyPageScope
          ? `练 p.${pageNum} · 核${sideScopeLabel}`
          : sideScopeLabel;

  /** T29 B：Strip / Clew 同源池（练/核各自判本页；单卡用卡交集池）——页内 Strip 与 Bridge progress* 共用。 */
  const stripAtoms = (card || stripStudyPageScope ? pageStudyAtoms : scopeStudyAtoms).map((a) => ({
    cardId: a.cardId,
    atomId: a.atomId,
  }));
  const stripItemKeys = (card || stripHeYePageScope ? items : scopeItems).map((it) => ({
    key: it.key,
  }));
  /**
   * T29 B：Clew progress* 同范围练/核深链（对齐书桌 DocumentPane 规则）：练侧显式 mode=all
   * （防 StickyModeGate 把深链回补成空档），核侧 mode=open；仅对应本页池非空才带 &page=
   * （孤儿页不深链幽灵印刷页）。
   */
  const progressStudyQs = new URLSearchParams();
  if (book) progressStudyQs.set("book", book.id);
  if (effChapter) progressStudyQs.set("chapter", effChapter.id);
  if (pageNum != null && stripStudyPageScope) progressStudyQs.set("page", String(pageNum));
  progressStudyQs.set("mode", "all");
  const progressStudyHref = card
    ? studyHref
    : `/study?${progressStudyQs.toString()}`;
  const progressReviewQs = new URLSearchParams();
  if (book) progressReviewQs.set("book", book.id);
  if (card) progressReviewQs.set("card", card.id);
  if (effChapter) progressReviewQs.set("chapter", effChapter.id);
  if (pageNum != null && (card ? items.length > 0 : stripHeYePageScope))
    progressReviewQs.set("page", String(pageNum));
  progressReviewQs.set("mode", "open");
  const progressReviewHref = `/review?${progressReviewQs.toString()}`;

  /**
   * T40 B/C：核面回程 payload——页头 Strip（条末「练此范围」+ 练侧 N>0 分段）与 sticky
   * 「去练同范围」client 岛**共用同一份**（禁第二套口径）：回本核页范围（progressReviewHref
   * 与核侧池/标签同源、已含默认 mode=open；孤儿页不带幽灵 page= 沿用 progress* 消毒）。
   * label 短标「核页 · scope」。key 仍 ariadne.desk.return.v1。
   */
  const reviewReturnTo = { href: progressReviewHref, label: `核页 · ${stripScopeLabel}` };

  /**
   * T51 J：HeYeSession 交叉练链（studyHref）的对侧真池——按 studyHref 同范围计数：
   * 单卡 = 卡池（studyHref 不带 page，与 href 同口）；有效页非孤儿 = 页池 pageStudyAtoms
   * （studyHref 带 &page=，heye-only 页如实归 0——不拿章池数字谎报页练链）；无页/孤儿 =
   * 章/书池（stripAtoms / progressStudyHref 同源）。缺省/解析不出当 0（fail-closed）。
   */
  const crossStudyAtomCount = card
    ? collectStudyAtoms({ cardId: card.id }).length
    : pageNum != null && !orphanReview
      ? pageStudyAtoms.length
      : stripAtoms.length;

  /**
   * T52 E：核池空分型（对齐 study 的 orphan / cardOutOfRange / 真空三型）——
   * orphan = 合法 pageNum · 非单卡 · 池空（沿用 orphanReview）；card-out = 单卡在宽范围
   * （collectCiteQueue({cardId}) 无过滤）有待核、当前 book/chapter/page 交集滤空（越界）；
   * true-empty = 其余（真无待核数据）。页顶琥珀保留点名，HeYeSession body 分型以此为准。
   */
  const cardWidePending =
    card && items.length === 0 ? collectCiteQueue({ cardId: card.id }).length : 0;
  const emptyKind: "orphan" | "card-out" | "true-empty" | null =
    items.length === 0
      ? orphanReview
        ? "orphan"
        : card && cardWidePending > 0
          ? "card-out"
          : "true-empty"
      : null;

  /** T28 F：sticky 键说明——只列当前实际可用的本页环键（无页不给 g，单卡不给切章）。 */
  const stickyKeys: [string, string][] = [
    ...(pageNum != null && !card ? ([["g", "清本页"]] as [string, string][]) : []),
    ...(!card && chipChapters.length > 0 ? ([["⇧[ ⇧]", "切章"]] as [string, string][]) : []),
  ];

  /** 章范围空态用于清章回全书核页（T19/T20）：仅在章范围且非单卡时给出。 */
  const clearChapterHref = effChapter && !card ? `/review${qs({ chapter: null })}` : undefined;

  /**
   * T58 F/I + T60 F/I：本页可考性（**消费** T57/T59；ghost 页 / 章未抽出 → 非
   * dark/shallow 不点名）——orphanDark 只旁挂 orphan×dark 一句（emptyKind 三态与
   * orphan 主 CTA 契约不动）；pageShallow 只旁挂**匹配中**（非 orphan）浅页一句
   * （浅页有 cite 不是 orphan 主题，勿吞 orphan 分型）。一次装载两用。
   */
  const pageExam = pageNum != null ? loadPageExaminable(pageNum) : null;
  const orphanDark = orphanReview && pageExam?.hint === "dark";
  const pageShallow = !orphanReview && pageExam?.hint === "shallow";

  return {
    bookId,
    cardId,
    pageParam,
    chapterParam,
    modeParam,
    book,
    invalidBook,
    card,
    invalidCard,
    pageNum,
    invalidPage,
    mode,
    invalidMode,
    activeChapter,
    invalidChapter,
    chapterOutsideBook,
    effChapter,
    heyeScopeKey,
    heyeStickyScope,
    items,
    pages,
    cardBook,
    scopeBook,
    orphanReview,
    scopeLabel,
    cardHref,
    studyHref,
    deskPageHref,
    deskHref,
    scopeBookValidPages,
    chipChapters,
    qs,
    clearPageHref,
    prevChapterHref,
    nextChapterHref,
    pageStudyAtoms,
    scopeStudyAtoms,
    scopeItems,
    stripStudyPageScope,
    stripHeYePageScope,
    sideScopeLabel,
    stripScopeLabel,
    stripAtoms,
    stripItemKeys,
    progressStudyQs,
    progressStudyHref,
    progressReviewQs,
    progressReviewHref,
    reviewReturnTo,
    crossStudyAtomCount,
    cardWidePending,
    emptyKind,
    stickyKeys,
    clearChapterHref,
    pageExam,
    orphanDark,
    pageShallow,
  };
}

/** T99：/review 页装配模型——page / ReviewPageChrome / ReviewPageSticky 三方同源消费（勿另算）。 */
export type ReviewPageScope = ReturnType<typeof buildReviewPageScope>;
