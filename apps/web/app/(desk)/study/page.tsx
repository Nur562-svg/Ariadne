import Link from "next/link";
import { Suspense } from "react";
import { collectStudyAtoms, loadBooks, loadCard, loadChapters } from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import type { StudyMode } from "@/lib/study";
import StudySession from "@/components/StudySession";
import StudyScopeCounts from "@/components/StudyScopeCounts";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import DeskSurfaceBridge from "@/components/desk/DeskSurfaceBridge";
import StickyModeGate from "@/components/desk/StickyModeGate";
import ReturnNav from "@/components/desk/ReturnNav";
import LastOpenedTouch from "@/components/LastOpenedTouch";

export const dynamic = "force-dynamic";

const DIFF_ZH = { what: "识记", why: "机制", case: "应用" } as const;

const MODES: [StudyMode, string][] = [
  ["all", "全部"],
  ["ungraded", "未评"],
  ["unknown", "不熟再练"],
];

/**
 * /study 学习 · 本机自评（desk-study-01，DeskShell 内）。
 * 这里不做 FSRS 到期调度：队列是「全部｜未评｜不熟再练」的本机态过滤，
 * 评分只写浏览器 localStorage（ariadne.study.v1），跨刷新保留，绝不回写 seed。
 * desk-card-hub-01：支持 ?card= 收窄到单卡（卡枢纽「练这张卡」入口）；
 * 页头显示卡名，完成/空态可回本卡、核本卡。
 */
export default function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{
    book?: string;
    chapter?: string;
    mode?: string;
    card?: string;
    page?: string;
  }>;
}) {
  const chapters = loadChapters();
  const books = loadBooks();
  return (
    <Suspense fallback={<p className="px-8 py-10 text-muted">加载中…</p>}>
      <StudyBody searchParams={searchParams} chapters={chapters} books={books} />
    </Suspense>
  );
}

async function StudyBody({
  searchParams,
  chapters,
  books,
}: {
  searchParams: Promise<{
    book?: string;
    chapter?: string;
    mode?: string;
    card?: string;
    page?: string;
  }>;
  chapters: ReturnType<typeof loadChapters>;
  books: ReturnType<typeof loadBooks>;
}) {
  const {
    book: bookId,
    chapter: chapterId,
    mode: modeParam,
    card: cardId,
    page: pageParam,
  } = await searchParams;
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

  /** ?book= 时章芯片只显示该书 chapterIds（T07 行为）；单卡范围固定，隐藏章芯片。 */
  const chipChapters = activeBook
    ? chapters.filter((c) => activeBook.chapterIds.includes(c.id))
    : chapters;

  /**
   * 本页池（T27 A/C）：collectStudyAtoms({page}) 口径 = cardsCitingPage 命中卡全部 atoms，
   * 与书桌 Strip / 卡轨「练本页」同池；page+card 不匹配 → 空队列 + 页面琥珀诚实。
   */
  const atoms = collectStudyAtoms(
    scopedCard
      ? {
          cardId: scopedCard.id,
          bookId: activeBook?.id,
          chapterId: activeChapter?.id,
          page: pageNum ?? undefined,
        }
      : { bookId: activeBook?.id, chapterId: activeChapter?.id, page: pageNum ?? undefined },
  );

  /** T20 续位 / sticky 作用域：cursor 含 mode（与 StudySession remount key 对齐），sticky 不含 mode；
   *  T27 C：两键都纳入 page——本页队列的续位/档位记忆不与章/书队列互串。 */
  const studyScopeKey = `${scopedCard?.id ?? "all"}:${activeBook?.id ?? "all"}:${activeChapter?.id ?? "all"}:${pageNum ?? "all"}:${mode}`;
  const studyStickyScope = `${scopedCard?.id ?? "all"}:${activeBook?.id ?? "all"}:${activeChapter?.id ?? "all"}:${pageNum ?? "all"}`;

  /** 章 → 书反查：无 ?book= 时也能让 CiteChip 深链回对应书的书桌章页。 */
  const bookByChapter: Record<string, string> = {};
  for (const b of books) for (const ch of b.chapterIds) bookByChapter[ch] = b.id;

  /** 卡所在书（chapterId 反查）：单卡范围的章页深链与回书桌都以它为准（可受 ?book= 覆盖）。 */
  const cardBookId = scopedCard?.chapterId ? bookByChapter[scopedCard.chapterId] : undefined;
  const scopeBook = activeBook ?? (cardBookId ? books.find((b) => b.id === cardBookId) : undefined);

  /**
   * 精确回书桌页优先级（T27 C）：?page= 本页 > 单卡首个有页 cite（cites → fields → atoms）；
   * 都无 → null（回书桌不带页，同书保留原页，不擦书桌精确页）。
   */
  const deskPageHint =
    pageNum ??
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
        : activeChapter?.id;
    if (ch) p.set("chapter", ch);
    if (!switchingChapter && !opts?.clearPage && pageNum != null) {
      p.set("page", String(pageNum));
    }
    const m = opts?.mode ?? mode;
    if (m !== "all") p.set("mode", m);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  /** 范围文案（T27 C）：有效页优先标「本页 p.N」（Strip/会话条同此口径）；单卡仍卡名。 */
  const scopeLabel = scopedCard
    ? `卡《${scopedCard.name_zh}》${scopeBook ? ` · 《${scopeBook.title}》` : ""}`
    : pageNum != null
      ? `本页 p.${pageNum}`
      : (activeChapter?.title ?? activeBook?.title ?? "全部已注册书目");
  const deskHref = scopeBook
    ? `/desk?book=${encodeURIComponent(scopeBook.id)}${pageNum != null ? `&page=${pageNum}` : ""}`
    : "/desk";
  /**
   * 单卡 → 核本卡（兼书）；书/全范围 → 核页深链。T26 C 带章；T27 D：有效页带 page
   * （本页练完核本页，不落到丢页的章/全书）；无书有页（手写 URL）→ 仅 ?page=。
   */
  const reviewHref = scopedCard
    ? `/review?card=${encodeURIComponent(scopedCard.id)}${activeBook ? `&book=${encodeURIComponent(activeBook.id)}` : ""}`
    : pageNum != null
      ? activeBook
        ? `/review?book=${encodeURIComponent(activeBook.id)}${
            activeChapter ? `&chapter=${encodeURIComponent(activeChapter.id)}` : ""
          }&page=${pageNum}`
        : `/review?page=${pageNum}`
      : activeBook
        ? `/review?book=${encodeURIComponent(activeBook.id)}${
            activeChapter ? `&chapter=${encodeURIComponent(activeChapter.id)}` : ""
          }`
        : "/review";
  /** 完成/空态「回本卡」（仅 ?card= 时展示）。 */
  const cardHref = scopedCard ? `/desk/card/${encodeURIComponent(scopedCard.id)}` : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      {/* 学习面薄桥：Clew 会话条显示学习范围。 */}
      <DeskSurfaceBridge
        data={{
          surface: "study",
          book: scopeBook ? { id: scopeBook.id, title: scopeBook.title } : undefined,
          chapter: activeChapter ? { id: activeChapter.id, title: activeChapter.title } : undefined,
          card: scopedCard ? { id: scopedCard.id, name_zh: scopedCard.name_zh } : undefined,
          page: pageNum ?? undefined,
          citePages: [],
        }}
      />
      {/* T20 sticky 档位：无 ?mode= 时读本标签记忆补档（replace，不整页刷新）；有合法 ?mode= 时胜出并写回。 */}
      <StickyModeGate
        kind="study"
        scopeKey={studyStickyScope}
        defaultMode="all"
        nonDefaultModes={["ungraded", "unknown"]}
      />
      {/* T21 续开指针轻触：有效范围（?book= 或 ?card= 反查书）才写同 bookId；不写非法书。
          有页（本卡 cite）则写精确页；无页保持「同书保留原页」，禁止空 page 擦掉书桌精确页。 */}
      {scopeBook ? (
        <LastOpenedTouch bookId={scopeBook.id} deskHref={deskPageHrefForTouch} page={deskPageHint} />
      ) : null}
      <header>
        <h1 className="brand-rule pb-2 text-3xl font-bold">学习 · 本机自评</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {scopeLabel} · 看问题 → 回想 → 自评「认识 / 不熟」。FSRS 到期调度未接入，这里不做到期复习；
          进度只保存在这个浏览器（localStorage），跨刷新保留。
        </p>
        {invalidBook ? (
          <p className="mt-2 text-sm text-status-warn">
            书库中没有 book id「{bookId}」——已按全部已注册书目出题。可从书架打开正确书目。
          </p>
        ) : null}
        {invalidCard ? (
          <p className="mt-2 text-sm text-status-warn">
            没有卡 id「{cardId}」——已按{activeBook?.title ?? "全部已注册书目"}出题，卡范围未生效。
          </p>
        ) : null}
        {invalidPage ? (
          <p className="mt-2 text-sm text-status-warn">
            page 参数「{pageParam}」需为正整数——页过滤未生效，已按
            {activeChapter ? activeChapter.title : (activeBook?.title ?? "全部已注册书目")}出题。
          </p>
        ) : null}
        {scopedCard && atoms.length === 0 && scopedCard.atoms.length > 0 ? (
          <p className="mt-2 text-sm text-status-warn">
            卡「{scopedCard.name_zh}」不在当前 book / chapter
            {pageNum != null ? " / page" : ""} 范围内——按空队列处理。
          </p>
        ) : null}
        <StudyScopeCounts atoms={atoms} />
        {/* 作用域进度（T18：同范围练+核分列；本页即练环，不重复练链）。
            T27 C：有效页时练/核两列都是本页池（collectCiteQueue 同样带 page），标签「本页 p.N」。 */}
        <LocalProgressStrip
          atoms={atoms.map((a) => ({ cardId: a.cardId, atomId: a.atomId }))}
          items={collectCiteQueue({
            cardId: scopedCard?.id,
            bookId: activeBook?.id,
            chapterId: activeChapter?.id,
            page: pageNum ?? undefined,
          }).map((it) => ({ key: it.key }))}
          scopeLabel={
            scopedCard
              ? "本卡"
              : pageNum != null
                ? `本页 p.${pageNum}`
                : activeChapter
                  ? `本章 ${activeChapter.id}`
                  : activeBook
                    ? "本书"
                    : "全部"
          }
        />
      </header>

      {/* T21 D：章芯片行 + 三档 tablist 收进 position:sticky 实底工具带（bg-card + border-b）。
          仅 CSS 钉住——长队列下滚时章芯片/档位仍可见；与 T20 StickyModeGate（URL 档位记忆 replace 补档）
          职责正交，各司其职，勿删 StickyModeGate。 */}
      <div className="sticky top-0 z-10 -mx-8 mt-6 border-b border-line bg-card px-8 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* T27 C：本页范围铬——有效页 pill 标注（与章芯片同族）+「清本页」（清 page，留书/章/档）。 */}
          {pageNum != null ? (
            <span className="flex items-center gap-2">
              <span
                aria-current="true"
                className="rounded-full border border-cinnabar bg-cinnabar-soft px-3 py-1 text-sm text-cinnabar"
              >
                本页 p.{pageNum}
              </span>
              <Link
                href={`/study${qs({ clearPage: true })}`}
                className="text-xs text-muted no-underline transition-colors hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
              >
                清本页 →
              </Link>
            </span>
          ) : null}
          {/* 章过滤（config 派生；有书时以上下文书为准；保留当前队列档；切章即离页）。单卡范围固定，隐藏章芯片。 */}
          {!scopedCard && chipChapters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/study${qs({ chapter: null })}`}
                className={`rounded-full border px-3 py-1 text-sm no-underline ${
                  !activeChapter
                    ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                    : "border-line text-muted hover:text-foreground"
                }`}
              >
                全部章节
              </Link>
              {chipChapters.map((c) => (
                <Link
                  key={c.id}
                  href={`/study${qs({ chapter: c.id })}`}
                  className={`rounded-full border px-3 py-1 text-sm no-underline ${
                    activeChapter?.id === c.id
                      ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                      : "border-line text-muted hover:text-foreground"
                  }`}
                >
                  {c.id}
                </Link>
              ))}
            </div>
          ) : null}

          {/* 队列三档：全部 | 未评 | 不熟再练（本机态过滤，非 FSRS）。 */}
          <div
            role="tablist"
            aria-label="练习队列"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-card p-1.5"
          >
            {MODES.map(([m, label]) => (
              <Link
                key={m}
                role="tab"
                aria-selected={mode === m}
                href={`/study${qs({ mode: m })}`}
                className={`rounded-md px-5 py-1.5 text-sm no-underline transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                  mode === m ? "bg-cinnabar text-white" : "text-muted hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* T23 D：sticky 工具带回程薄链（次级文字，非第三颗大红）：?card= 回本卡；可解析本页回书桌本页。*/}
          <div className="flex items-center gap-3">
            <ReturnNav
              bookId={scopeBook?.id}
              pageHint={deskPageHint}
              deskHref={deskHref}
              cardHref={cardHref}
              showReturn={false}
            />
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted">{atoms.length} 个知识原子</p>

      {atoms.length === 0 ? (
        <div className="mt-8">
          <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
            这个范围还没有知识原子。先到{" "}
            <Link className="text-cinnabar underline underline-offset-4" href="/ingest">
              /ingest
            </Link>{" "}
            上传并解析教材，或换一个更宽的范围。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            {cardHref ? (
              <>
                <Link
                  href={cardHref}
                  className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
                >
                  回本卡 →
                </Link>
                <Link
                  href={reviewHref}
                  className="text-sm text-muted no-underline hover:text-cinnabar"
                >
                  核本卡 →
                </Link>
              </>
            ) : null}
            {/* T27 C：本页空 → 主 CTA 优先放宽（清 page 留 chapter/book，一颗实心）；
                非本页范围才走 T20 章程恢复主 CTA。 */}
            {pageNum != null ? (
              <Link
                href={`/study${qs({ clearPage: true })}`}
                className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
              >
                {activeChapter ? "换到本章全部 →" : activeBook ? "换到本书全部 →" : "换到全部书目 →"}
              </Link>
            ) : !scopedCard && (activeChapter || activeBook) ? (
              activeChapter ? (
                <Link
                  href={`/study${qs({ chapter: null })}`}
                  className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
                >
                  换到全部章节 →
                </Link>
              ) : (
                <Link
                  href="/study"
                  className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
                >
                  看全部书目 →
                </Link>
              )
            ) : null}
            {/* T23 A：范围空回书桌本页 / 回书桌 + 回到刚才（次级文字链，主 CTA 已在上面）。*/}
            <ReturnNav
              bookId={scopeBook?.id}
              pageHint={deskPageHint}
              deskHref={deskHref}
              showReturn
            />
          </div>
        </div>
      ) : (
        <StudySession
          key={studyScopeKey}
          scopeKey={studyScopeKey}
          atoms={atoms}
          scopeLabel={scopeLabel}
          diffLabel={DIFF_ZH}
          mode={mode}
          activeBookId={activeBook?.id}
          bookByChapter={bookByChapter}
          deskHref={deskHref}
          reviewHref={reviewHref}
          cardHref={cardHref}
          allHref={`/study${qs({ mode: "all" })}`}
          unknownHref={`/study${qs({ mode: "unknown" })}`}
          ungradedHref={`/study${qs({ mode: "ungraded" })}`}
          deskPageHint={deskPageHint}
          deskBookId={scopeBook?.id}
        />
      )}
    </div>
  );
}
