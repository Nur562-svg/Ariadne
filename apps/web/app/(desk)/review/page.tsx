import Link from "next/link";
import { Suspense } from "react";
import {
  collectStudyAtoms,
  loadAllChapterPages,
  loadBooks,
  loadCard,
  loadChapters,
} from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import type { HeYeMode } from "@/lib/heye-store";
import HeYeSession from "@/components/HeYeSession";
import HeYeScopeCounts from "@/components/HeYeScopeCounts";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import DeskSurfaceBridge from "@/components/desk/DeskSurfaceBridge";
import StickyModeGate from "@/components/desk/StickyModeGate";
import LastOpenedTouch from "@/components/LastOpenedTouch";

export const dynamic = "force-dynamic";

const MODES: [HeYeMode, string][] = [
  ["open", "待核"],
  ["checked", "已对"],
  ["doubt", "存疑"],
];

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

  let scopeLabel = "全部已解析卡";
  if (book) scopeLabel = `《${book.title}》`;
  if (card) scopeLabel = `卡《${card.name_zh}》${scopeBook ? ` · 《${scopeBook.title}》` : ""}`;
  if (effChapter) {
    scopeLabel = `${book ? `《${book.title}》 · ` : ""}${effChapter.id} · ${effChapter.title}`;
  }

  const cardHref = card ? `/desk/card/${encodeURIComponent(card.id)}` : undefined;
  /** T26 C：去学习环带作用域——非单卡时至少 ?book=（有书），有 effChapter 再 &chapter=；
   *  禁止裸 "/study"（换环丢书）。单卡仍 ?card=（兼书）。 */
  const studyHref = card
    ? `/study?card=${encodeURIComponent(card.id)}${book ? `&book=${encodeURIComponent(book.id)}` : ""}`
    : book
      ? `/study?book=${encodeURIComponent(book.id)}${
          effChapter ? `&chapter=${encodeURIComponent(effChapter.id)}` : ""
        }`
      : "/study";
  /** 回书桌本页（书范围且 page 合法时）：/desk?book=&page= 章页定位。 */
  const deskPageHref =
    pageNum != null && scopeBook
      ? `/desk?book=${encodeURIComponent(scopeBook.id)}&page=${pageNum}`
      : undefined;
  /** 无页时回书桌的兜底深链。 */
  const deskHref = scopeBook ? `/desk?book=${encodeURIComponent(scopeBook.id)}` : "/desk";

  /** ?book= 时章芯片只显示该书 chapterIds（对齐 study）；单卡范围固定，隐藏章芯片。 */
  const chipChapters = book
    ? chapters.filter((c) => book.chapterIds.includes(c.id))
    : chapters;

  /** qs helper：切换章 / 档位时保留 book / card / page / chapter / mode 的合理组合。 */
  const qs = (opts?: { chapter?: string | null; mode?: HeYeMode }) => {
    const p = new URLSearchParams();
    if (book) p.set("book", book.id);
    if (card) p.set("card", card.id);
    if (pageNum != null) p.set("page", String(pageNum));
    const ch = card
      ? undefined
      : opts?.chapter !== undefined
        ? (opts.chapter ?? undefined)
        : (effChapter?.id ?? undefined);
    if (ch) p.set("chapter", ch);
    const m = opts?.mode ?? mode;
    if (m !== "open") p.set("mode", m);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  /** 章范围空态用于清章回全书核页（T19/T20）：仅在章范围且非单卡时给出。 */
  const clearChapterHref = effChapter && !card ? `/review${qs({ chapter: null })}` : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      {/* 核页面薄桥：Clew 会话条显示核页范围（书/章/页/卡）。 */}
      <DeskSurfaceBridge
        data={{
          surface: "review",
          book: scopeBook ? { id: scopeBook.id, title: scopeBook.title } : undefined,
          chapter: effChapter
            ? { id: effChapter.id, title: effChapter.title }
            : undefined,
          page: pageNum,
          card: card ? { id: card.id, name_zh: card.name_zh } : undefined,
          citePages: [],
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
          page 合法时写带 page 的 deskHref，否则回落不带 page 的兜底（同书保留原页）。 */}
      {scopeBook ? (
        <LastOpenedTouch bookId={scopeBook.id} deskHref={deskPageHref ?? deskHref} page={pageNum} />
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
          <HeYeScopeCounts items={items} />
        </p>
      </header>

      {/* 作用域进度（T18：同范围练+核分列；本页即核环，不重复核链）。 */}
      <LocalProgressStrip
        atoms={collectStudyAtoms({
          cardId: card?.id,
          bookId: book?.id,
          chapterId: effChapter?.id,
        }).map((a) => ({ cardId: a.cardId, atomId: a.atomId }))}
        items={items.map((it) => ({ key: it.key }))}
        scopeLabel={
          card
            ? "本卡"
            : effChapter
              ? `本章 ${effChapter.id}`
              : book
                ? "本书"
                : "全部"
        }
      />

      {/* T21 D：章芯片行 + 三档 tablist 收进 position:sticky 实底工具带（bg-card + border-b）。
          仅 CSS 钉住——长队列下滚时章芯片/档位仍可见；与 T20 StickyModeGate（URL 档位记忆 replace 补档）
          职责正交，各司其职，勿删 StickyModeGate。 */}
      <div className="sticky top-0 z-10 -mx-8 mt-6 border-b border-line bg-card px-8 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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

          {/* 本机三档：待核 | 已对 | 存疑（本机态过滤，非 FSRS；对齐 study 呼吸感）。 */}
          <div
            role="tablist"
            aria-label="核页队列档位"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-card p-1.5"
          >
            {MODES.map(([m, label]) => (
              <Link
                key={m}
                role="tab"
                aria-selected={mode === m}
                href={`/review${qs({ mode: m })}`}
                className={`rounded-md px-5 py-1.5 text-sm no-underline transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                  mode === m ? "bg-cinnabar text-white" : "text-muted hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* T23 D：sticky 工具带回程薄链（对称 study）：?card= 回本卡；page 合法回书桌本页，否则回落回书桌。 */}
          <div className="flex items-center gap-3">
            {cardHref ? (
              <Link href={cardHref} className="text-sm text-muted no-underline hover:text-cinnabar">
                回本卡 →
              </Link>
            ) : null}
            <Link
              href={deskPageHref ?? deskHref}
              className={`text-sm no-underline hover:underline underline-offset-4 ${
                deskPageHref ? "text-cinnabar" : "text-muted hover:text-cinnabar"
              }`}
            >
              {deskPageHref ? "回书桌本页 →" : "回书桌 →"}
            </Link>
          </div>
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
      />
    </div>
  );
}