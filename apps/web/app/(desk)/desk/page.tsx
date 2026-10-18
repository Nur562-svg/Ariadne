import Link from "next/link";
import {
  loadAllChapterPages,
  loadBooks,
  loadCards,
  loadChapters,
} from "@/lib/entities";
import DocumentPane from "@/components/desk/DocumentPane";

export const dynamic = "force-dynamic";

/**
 * 书桌页（服务端薄层）：加载当前书数据后交给 DocumentPane（客户端）编排。
 * ?book= 驱动当前书；无效 book id 回落第一本书并诚实提示（Task 09 行为）。
 */
export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string }>;
}) {
  const { book: bookId } = await searchParams;
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

  return (
    <DocumentPane
      book={book}
      chapters={chapters}
      cards={cards}
      pages={pages}
      invalidBook={invalidBook}
      badBookId={bookId}
    />
  );
}