import { loadBooks, loadCards } from "@/lib/entities";
import DeskShellClient from "@/components/desk/DeskShellClient";

export const dynamic = "force-dynamic";

/**
 * desk-v4 三栏壳（服务端数据装配）：
 * 读 books/cards 组装 Sidebar 在读书目与 Clew 初始上下文，交给 DeskShellClient。
 * 书桌主路径（/desk、/desk/card/*、/review）+ 书架 / 共用此壳。
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

  const clewInitial = book
    ? { book: { id: book.id, title: book.title }, citePages: [] }
    : { citePages: [] };

  return (
    <DeskShellClient sidebarBook={sidebarBook} clewInitial={clewInitial}>
      {children}
    </DeskShellClient>
  );
}