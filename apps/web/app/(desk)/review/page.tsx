import Link from "next/link";
import { Suspense } from "react";
import {
  collectStudyAtoms,
  loadAllChapterPages,
  loadBookValidPages,
  loadBooks,
  loadCard,
  loadChapters,
} from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import type { HeYeMode } from "@/lib/heye-store";
import HeYeSession from "@/components/HeYeSession";
import HeYeScopeCounts from "@/components/HeYeScopeCounts";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import { withQsMode } from "@/lib/qs-mode";
import SessionKeyHint from "@/components/SessionKeyHint";
import DeskSurfaceBridge from "@/components/desk/DeskSurfaceBridge";
import StickyModeGate from "@/components/desk/StickyModeGate";
import StickyPageLoopKeys from "@/components/desk/StickyPageLoopKeys";
import ReturnNav from "@/components/desk/ReturnNav";
import CrossScopeReturnLink from "@/components/desk/CrossScopeReturnLink";
import StickyHeYeModeTabs from "@/components/desk/StickyHeYeModeTabs";
import LastOpenedTouch from "@/components/LastOpenedTouch";

export const dynamic = "force-dynamic";

/**
 * /review 核页 · 本机对页（desk-heye-01）。
 * 这里不做 FSRS 到期调度：队列是「有页码但 seed 未抽查 verified」的 cite，
 * 「本机已对 / 存疑」只写浏览器 localStorage（ariadne.heye.v1），绝不回写 seed JSON。
 * ?book= / ?card= / ?page= 范围过滤；无参 = 全部已解析卡（核页是数据质量工具，范围宁宽）。
 * desk-heye-batch-filter-01（T16）：?chapter= 章芯片 + ?mode= 本机三档（待核｜已对｜存疑）；
 * 服务端 collect 出全池，本机态过滤在客户端（HeYeSession）。
 */
export default function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    book?: string;
    card?: string;
    page?: string;
    chapter?: string;
    mode?: string;
  }>;
}) {
  const chapters = loadChapters();
  const books = loadBooks();
  return (
    <Suspense fallback={<p className="px-8 py-10 text-muted">加载中…</p>}>
      <ReviewBody searchParams={searchParams} chapters={chapters} books={books} />
    </Suspense>
  );
}

async function ReviewBody({
  searchParams,
  chapters,
  books,
}: {
  searchParams: Promise<{
    book?: string;
    card?: string;
    page?: string;
    chapter?: string;
    mode?: string;
  }>;
  chapters: ReturnType<typeof loadChapters>;
  books: ReturnType<typeof loadBooks>;
}) {
  const { book: bookId, card: cardId, page: pageParam, chapter: chapterParam, mode: modeParam } =
    await searchParams;
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

  /** T28 F：sticky 键说明——只列当前实际可用的本页环键（无页不给 g，单卡不给切章）。 */
  const stickyKeys: [string, string][] = [
    ...(pageNum != null && !card ? ([["g", "清本页"]] as [string, string][]) : []),
    ...(!card && chipChapters.length > 0 ? ([["⇧[ ⇧]", "切章"]] as [string, string][]) : []),
  ];

  /** 章范围空态用于清章回全书核页（T19/T20）：仅在章范围且非单卡时给出。 */
  const clearChapterHref = effChapter && !card ? `/review${qs({ chapter: null })}` : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      {/* 核页面薄桥：Clew 会话条显示核页范围（书/章/页/卡）。
          T29 B：progress* 与页内 Strip 同一套池/标签/深链——Clew「本轮变化」compact 在核页
          也显示本章/本页收窄数字，不再掉「未定位章 · 全书本机记录」。
          T29 F：孤儿页不给 Clew 残留幽灵 p.N（头栏/建议问/stub 不提 999，会话条不深链书桌幽灵页）。 */}
      <DeskSurfaceBridge
        data={{
          surface: "review",
          book: scopeBook ? { id: scopeBook.id, title: scopeBook.title } : undefined,
          chapter: effChapter
            ? { id: effChapter.id, title: effChapter.title }
            : undefined,
          page: orphanReview ? null : pageNum,
          card: card ? { id: card.id, name_zh: card.name_zh } : undefined,
          citePages: [],
          progressAtoms: stripAtoms,
          progressItems: stripItemKeys,
          progressScopeLabel: stripScopeLabel,
          progressStudyHref: progressStudyHref,
          progressReviewHref: progressReviewHref,
        }}
      />
      {/* T20 sticky 档位：无 ?mode= 时读本标签记忆补档（replace）；有合法 ?mode= 时胜出并写回。 */}
      <StickyModeGate
        kind="heye"
        scopeKey={heyeStickyScope}
        defaultMode="open"
        nonDefaultModes={["checked", "doubt"]}
      />
      {/* T21/T23 续开指针轻触：有效范围（?book= 或 ?card= 反查书）才写同 bookId；不写非法书。
          page 合法且本页池非空时写带 page 的 deskHref，否则回落不带 page 的兜底
          （T29 F：孤儿页不把幽灵 page=999 写进续开指针，同书保留原页）。 */}
      {scopeBook ? (
        <LastOpenedTouch
          bookId={scopeBook.id}
          deskHref={deskPageHref ?? deskHref}
          page={deskPageHref ? pageNum : undefined}
        />
      ) : null}
      <header>
        <h1 className="brand-rule pb-2 text-3xl font-bold">核页 · 本机对页</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          把每条引用的 quote 对着该印刷页的 OCR 原文看一遍，标「本机已对」或「存疑」。
          进度只保存在这个浏览器；FSRS 到期调度未接入，这里不做到期复习。
        </p>
        {invalidBook ? (
          <p className="mt-2 text-sm text-status-warn">
            书库中没有 book id「{bookId}」——已按全部已解析卡统计。可从书架打开正确书目。
          </p>
        ) : null}
        {invalidCard ? (
          <p className="mt-2 text-sm text-status-warn">
            没有卡 id「{cardId}」——卡范围未生效，已按{book ? `《${book.title}》` : "全部已解析卡"}统计。
          </p>
        ) : null}
        {invalidPage ? (
          <p className="mt-2 text-sm text-status-warn">
            page 参数「{pageParam}」需为正整数——页过滤未生效，已按{scopeLabel}统计。
          </p>
        ) : null}
        {/* T28 E：合法孤儿页（零待核 cite）琥珀点名本页 + 放宽（T29 C：空态主 CTA 升「清本页」），
            不静默落到通用「这个范围没有」空态。 */}
        {orphanReview ? (
          <p className="mt-2 text-sm text-status-warn">
            本页 p.{pageNum} 暂无待核 cite——没有「有页码但未抽查」的引用落在这一印刷页；
            可清本页放宽到{sideScopeLabel}，或换到更宽的范围。
          </p>
        ) : null}
        {invalidChapter ? (
          <p className="mt-2 text-sm text-status-warn">
            没有章 id「{chapterParam}」——章过滤未生效，已按{scopeLabel}统计。
          </p>
        ) : null}
        {!invalidChapter && chapterOutsideBook ? (
          <p className="mt-2 text-sm text-status-warn">
            章「{activeChapter?.id}」不在《{book?.title}》范围内——已按全书过滤。
          </p>
        ) : null}
        {invalidMode ? (
          <p className="mt-2 text-sm text-status-warn">
            mode 参数「{modeParam}」未识别——已回落「待核」档。
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted">
          范围：{scopeLabel}
          {pageNum != null ? (
            <>
              {" "}
              · 印刷页 <span className="mono font-medium text-foreground">p.{pageNum}</span>
              {deskPageHref ? (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    href={deskPageHref}
                    className="text-cinnabar no-underline hover:underline underline-offset-4"
                  >
                    回书桌本页 →
                  </Link>
                </>
              ) : null}
            </>
          ) : null}
          {" "}· 待核 {items.length} 条
          {book || effChapter ? (
            <>
              {" "}
              ·{" "}
              <Link
                href="/review"
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                看全部 →
              </Link>
            </>
          ) : null}
          {cardHref ? (
            <>
              {" "}
              ·{" "}
              <Link
                href={cardHref}
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                回本卡 →
              </Link>
            </>
          ) : null}
          {" "}
          {/* T35 D：页头范围计数可点——与 sticky 三档 tablist / HeYeSession openHref·checkedHref·
              doubtHref 同一 qs({ mode }) 口径（保留 book/card/chapter/page）；N=0 纯文。 */}
          <HeYeScopeCounts
            items={items}
            hrefs={{
              open: `/review${qs({ mode: "open" })}`,
              checked: `/review${qs({ mode: "checked" })}`,
              doubt: `/review${qs({ mode: "doubt" })}`,
            }}
          />
        </p>
      </header>

      {/* 作用域进度（T18：同范围练+核分列；本页即核环，不重复核链）。
          T27 soft：有效 page 时练侧与 collectStudyAtoms({page}) / study Strip 同池。
          T28 B：练/核各自判本页——heye-only 页练侧回落章/书池，标签分写，与书桌同页不互谎。
          T29 B：池选择收进 stripAtoms/stripItemKeys，与 Bridge progress* 同源。
          T33 A：交叉弱链——核面只传 studyHref（progressStudyHref，与 Clew/Bridge 同源），
          不传本面 reviewHref（「核此范围」自指无意义）；孤儿页不带幽灵 page= 沿用 progress* 口径。
          T36 B（对称 study）：池分段可点——核侧三档与 HeYeScopeCounts/sticky 同一 qs({ mode })
          （保留 book/card/chapter/page）；练侧三档从 progressStudyHref mode-swap（单卡时
          progressStudyHref 即卡作用域 studyHref，withQsMode 补 mode 同族）；N=0 / 无池纯文。
          T40 B：returnTo=reviewReturnTo——条末「练此范围」与练侧 N>0 分段点前写 return，
          进练完成态「回到刚才」回本核页范围。 */}
      <LocalProgressStrip
        atoms={stripAtoms}
        items={stripItemKeys}
        scopeLabel={stripScopeLabel}
        studyHref={progressStudyHref}
        returnTo={reviewReturnTo}
        heyeModeHrefs={{
          open: `/review${qs({ mode: "open" })}`,
          checked: `/review${qs({ mode: "checked" })}`,
          doubt: `/review${qs({ mode: "doubt" })}`,
        }}
        studyModeHrefs={{
          all: withQsMode(progressStudyHref, "all"),
          unknown: withQsMode(progressStudyHref, "unknown"),
          ungraded: withQsMode(progressStudyHref, "ungraded"),
        }}
      />

      {/* T28 F：sticky 键盘岛——g 聚焦「清本页」，⇧[ / ⇧] 按章芯片顺序切章（切章即离页）；
          题内裸 [ / ] 回看/前进归 HeYeSession 自己的键盘环，本岛不拦截。 */}
      <StickyPageLoopKeys
        clearPageSelector={pageNum != null && !card ? "a[data-sticky-clear-page]" : undefined}
        prevChapterHref={!card && chipChapters.length > 0 ? prevChapterHref : undefined}
        nextChapterHref={!card && chipChapters.length > 0 ? nextChapterHref : undefined}
      />
      {/* T21 D：章芯片行 + 三档 tablist 收进 position:sticky 实底工具带（bg-card + border-b）。
          仅 CSS 钉住——长队列下滚时章芯片/档位仍可见；与 T20 StickyModeGate（URL 档位记忆 replace 补档）
          职责正交，各司其职，勿删 StickyModeGate。 */}
      <div className="sticky top-0 z-10 -mx-8 mt-6 border-b border-line bg-card px-8 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* T28 A：本页范围铬（与 study 同族 pill）+「清本页」（只删 page，留书/章/档；改档留页）。 */}
          {clearPageHref && !card ? (
            <span className="flex items-center gap-2">
              <span
                aria-current="true"
                className="rounded-full border border-cinnabar bg-cinnabar-soft px-3 py-1 text-sm text-cinnabar"
              >
                本页 p.{pageNum}
              </span>
              <Link
                href={clearPageHref}
                data-sticky-clear-page=""
                aria-keyshortcuts="g"
                className="text-xs text-muted no-underline transition-colors hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
              >
                清本页 →
              </Link>
            </span>
          ) : null}
          {/* 章过滤（对齐 study；单卡范围固定，隐藏章芯片）。 */}
          {!card && chipChapters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/review${qs({ chapter: null })}`}
                className={`rounded-full border px-3 py-1 text-sm no-underline ${
                  !effChapter
                    ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                    : "border-line text-muted hover:text-foreground"
                }`}
              >
                全部章节
              </Link>
              {chipChapters.map((c) => (
                <Link
                  key={c.id}
                  href={`/review${qs({ chapter: c.id })}`}
                  className={`rounded-full border px-3 py-1 text-sm no-underline ${
                    effChapter?.id === c.id
                      ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                      : "border-line text-muted hover:text-foreground"
                  }`}
                >
                  {c.id}
                </Link>
              ))}
            </div>
          ) : null}

          {/* 本机三档：待核 | 已对 | 存疑（本机态过滤，非 FSRS；对齐 study 呼吸感）。
              T41 B：抽薄客户端岛 StickyHeYeModeTabs（对称 study）——N=0 且非当前档纯文
              不可点（与 HeYeModeChips/HeYeScopeCounts 同池同口径；当前档恒指示），
              tab chrome 不变。 */}
          <StickyHeYeModeTabs
            mode={mode}
            items={items}
            hrefs={{
              open: `/review${qs({ mode: "open" })}`,
              checked: `/review${qs({ mode: "checked" })}`,
              doubt: `/review${qs({ mode: "doubt" })}`,
            }}
          />

          {/* T23 D + T32 D：sticky 工具带回程（对称 study）改用 ReturnNav——回本卡 / 回书桌
              本页（pageHint 仅 deskPageHref 可解析时给，孤儿不给页 hint）/ lastOpened 回落页
              经该书 validPages 消毒；showReturn=false 与 study sticky 同（「回到刚才」归
              HeYeSession 空/完成态，勿在此重复）。 */}
          <div className="flex items-center gap-3">
            <ReturnNav
              bookId={scopeBook?.id}
              pageHint={deskPageHref ? pageNum : null}
              deskHref={deskHref}
              cardHref={cardHref}
              validPages={scopeBookValidPages}
              showReturn={false}
            />
            {/* T33 A：交叉弱链的 sticky 延伸（对称 study）——长队列滚离页头后仍能去同范围练；
                muted 次级文字（非第二颗实心朱红），href 与页头 Strip 同一 progressStudyHref。
                T40 C：Server 页不能挂 onClick——换薄客户端岛 CrossScopeReturnLink，
                点前 saveReturn（payload=reviewReturnTo，与页头 Strip 同一来源）。 */}
            <CrossScopeReturnLink href={progressStudyHref} returnTo={reviewReturnTo}>
              去练同范围 →
            </CrossScopeReturnLink>
          </div>

          {/* T28 F：本页环键说明（与练/核底栏 SessionKeyHint 同族，只列当前实际可用的键）。 */}
          {stickyKeys.length > 0 ? <SessionKeyHint keys={stickyKeys} /> : null}
        </div>
      </div>

      <HeYeSession
        key={heyeScopeKey}
        scopeKey={heyeScopeKey}
        items={items}
        pages={pages}
        scopeLabel={scopeLabel}
        mode={mode}
        cardHref={cardHref}
        studyHref={studyHref}
        deskPageHref={deskPageHref}
        openHref={`/review${qs({ mode: "open" })}`}
        checkedHref={`/review${qs({ mode: "checked" })}`}
        doubtHref={`/review${qs({ mode: "doubt" })}`}
        clearChapterHref={clearChapterHref}
        clearPageHref={clearPageHref}
        orphanPage={orphanReview}
        loopKeys={stickyKeys}
      />
    </div>
  );
}