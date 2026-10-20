import Link from "next/link";
import {
  cardsCitingPage,
  loadAllChapterPages,
  loadBookValidPages,
  loadBooks,
  loadCards,
  loadChapters,
  type PageCitingCard,
} from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import DocumentPane from "@/components/desk/DocumentPane";
import LastOpenedTouch from "@/components/LastOpenedTouch";

export const dynamic = "force-dynamic";

/**
 * 书桌页（服务端薄层）：加载当前书数据后交给 DocumentPane（客户端）编排。
 * ?book= 驱动当前书；无效 book id 回落第一本书并诚实提示（Task 09 行为）。
 * desk-page-card-loop（T15）：服务端预计算「页 → 引用该页的卡」与「页 → 本页待核数」
 * 两张索引表传给 DocumentPane——客户端翻页时按 pageNo 查表即可，章页卡轨随动。
 */
export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; page?: string; mode?: string }>;
}) {
  const { book: bookId, page: pageParam, mode: modeParam } = await searchParams;
  /** CiteChip / 核页深链：?page=N → DocumentPane 自动切章页并定位；?mode=split 可选。 */
  const initialPage = pageParam != null && /^\d+$/.test(pageParam) ? Number(pageParam) : null;
  const initialMode = modeParam === "split" || modeParam === "pages" ? modeParam : undefined;
  const books = loadBooks();
  const book = books.find((b) => b.id === bookId) ?? books[0];
  const invalidBook = bookId != null && !books.some((b) => b.id === bookId);

  if (!book) {
    return (
      <div className="mx-auto w-full max-w-2xl px-8 py-16">
        <h1 className="brand-rule pb-2 text-3xl font-bold">书桌</h1>
        <p className="mt-6 leading-8 text-foreground/90">
          书库还空着：先上传并解析教材、注册书目，书桌才有可读的讲义与实体卡。
        </p>
        <Link
          href="/ingest"
          className="mt-8 inline-block rounded-md bg-cinnabar px-5 py-2.5 text-white no-underline"
        >
          去导入教材 →
        </Link>
      </div>
    );
  }

  const chapters = loadChapters().filter((c) => book.chapterIds.includes(c.id));
  const cards = loadCards({ bookId: book.id });
  const pages = loadAllChapterPages().filter(
    (p) => p.chapterId != null && book.chapterIds.includes(p.chapterId as string),
  );

  /** 页 → 引用该页的实体卡（轻量摘要；按卡名稳定排序）。 */
  const citingByPage: Record<number, PageCitingCard[]> = {};
  for (const p of pages) {
    if (p.page == null) continue;
    citingByPage[p.page] = cardsCitingPage(p.page, { bookId: book.id });
  }
  /** 页 → 本页待核 cite 数（collectCiteQueue 只读，零回写）。 */
  const bookQueue = collectCiteQueue({ bookId: book.id });
  const pendingByPage: Record<number, number> = {};
  for (const it of bookQueue) {
    pendingByPage[it.page] = (pendingByPage[it.page] ?? 0) + 1;
  }

  /**
   * T30 D 续开幽灵页消毒：仅当 ?page= 落在本书已解析页（p.page === initialPage）才写进
   * ariadne.desk.last-opened.v1 / recent-books.v1——page=999 不再进书架「续开 p.999」。
   * 同书无有效页时 touchLastOpened 保留原页（不误伤合法停留页）；DocumentPane 的
   * invalidPage 琥珀横幅与翻页 touchLastOpened（只跟合法 readingPage）不回退。
   */
  const validInitialPage =
    initialPage != null && pages.some((p) => p.page === initialPage) ? initialPage : undefined;

  return (
    <>
      {/* T21 续开指针写点：仅当命中已注册书（非法 bookId 已回落不写）；page 只写合法已解析页。 */}
      {!invalidBook ? (
        <LastOpenedTouch
          bookId={book.id}
          deskHref={`/desk?book=${encodeURIComponent(book.id)}`}
          page={validInitialPage}
        />
      ) : null}
      <DocumentPane
        key={`${book.id}:${initialPage ?? ""}`}
        book={book}
        books={books.map((b) => ({ id: b.id, title: b.title }))}
        chapters={chapters}
        cards={cards}
        pages={pages}
        invalidBook={invalidBook}
        badBookId={bookId}
        initialPage={initialPage}
        initialMode={initialMode}
        citingByPage={citingByPage}
        pendingByPage={pendingByPage}
        heyePool={bookQueue.map((it) => ({ key: it.key, cardId: it.cardId, page: it.page }))}
        bookValidPages={loadBookValidPages()}
      />
    </>
  );
}