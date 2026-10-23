import { loadBooks, loadCards, loadBookValidPages } from "@/lib/entities";
import { collectBookPools } from "@/lib/book-pools";
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
  const bookValidPages = loadBookValidPages();
  /**
   * 多书摘要（id/title/章数/卡数/OCR 页数）：Sidebar 客户端据此与 last-opened 对齐选「在读」，
   * 失效回落首本/空库。T46 C：pages = bookValidPages[b.id]?.length ?? 0（与书架/Overview 同口径）。
   * T50 E：附书级练核池 + 页→原子/待核 map（collectBookPools，collectStudyAtoms/
   * collectCiteQueue 同池族单一装配）——Sidebar 在读「学习/核页」空池门禁用；客户端按
   * 消毒后 currentEntry.page 查页级 map，缺省/缺 key 当 0（fail-closed）。
   */
  const sidebarBooks = books.map((b) => {
    const pools = collectBookPools(b.id);
    return {
      id: b.id,
      title: b.title,
      chapters: b.chapterIds.length,
      cards: loadCards({ bookId: b.id }).length,
      pages: bookValidPages[b.id]?.length ?? 0,
      atomCount: pools.atomCount,
      pendingCount: pools.pendingCount,
      pageAtomByPage: pools.pageAtomByPage,
      pagePendingByPage: pools.pagePendingByPage,
    };
  });

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