import { loadBooks, loadCards, loadBookValidPages } from "@/lib/entities";
import DeskShellClient from "@/components/desk/DeskShellClient";

export const dynamic = "force-dynamic";

/**
 * desk-v4 三栏壳（服务端数据装配）：
 * 读 books/cards 组装 Sidebar 在读书目与 Clew 初始上下文，交给 DeskShellClient。
 * 书桌主路径（/desk、/desk/card/*、/review、/study）+ 书架 / 共用此壳。
 */
export default function DeskLayout({ children }: { children: React.ReactNode }) {
  const books = loadBooks();
  const book = books[0];
  /** 多书摘要（id/title/章数/卡数）：Sidebar 客户端据此与 last-opened 对齐选「在读」，失效回落首本/空库。 */
  const sidebarBooks = books.map((b) => ({
    id: b.id,
    title: b.title,
    chapters: b.chapterIds.length,
    cards: loadCards({ bookId: b.id }).length,
  }));
  /**
   * T31 C：各书已解析印刷页集合（服务端一次装配）——Sidebar 在读/换书读侧
   * 消毒旧栈幽灵页（page=999 不再播）；客户端不读 fs，不造全量校验库。
   */
  const bookValidPages = loadBookValidPages();

  const clewInitial = book
    ? { book: { id: book.id, title: book.title }, citePages: [] }
    : { citePages: [] };

  return (
    <DeskShellClient
      sidebarBooks={sidebarBooks}
      bookValidPages={bookValidPages}
      clewInitial={clewInitial}
    >
      {children}
    </DeskShellClient>
  );
}