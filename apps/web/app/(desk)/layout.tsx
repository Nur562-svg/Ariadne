import { loadBooks, loadCards } from "@/lib/entities";
import Sidebar from "@/components/desk/Sidebar";
import ClewPane from "@/components/desk/ClewPane";

export const dynamic = "force-dynamic";

/**
 * desk-v4 三栏壳：左 Sidebar(~248) · 中 DocumentPane(自适应) · 右 ClewPane(~400)。
 * 学习主路径（/desk、/desk/card/*、/review）共用此壳，不再叠满宽顶栏；
 * /ingest、书库、viewer 等 shell-01 页面留在 (shell) 单栏组。
 */
export default function DeskLayout({ children }: { children: React.ReactNode }) {
  const books = loadBooks();
  const book = books[0];
  const sidebarBook = book
    ? {
        title: book.title,
        chapters: book.chapterIds.length,
        cards: loadCards({ bookId: book.id }).length,
      }
    : undefined;

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar book={sidebarBook} />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      <ClewPane bookTitle={book?.title} />
    </div>
  );
}
