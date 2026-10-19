"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadRecentBooks, subscribeLastOpened, type LastOpened } from "@/lib/last-opened";

export type BookSwitcherBook = { id: string; title: string };

/**
 * 书桌书名旁薄换书（T23 D，客户端）：books>=2 时在 DocumentPane 书名旁补 documents 换书入口，
 * 与 T22 Sidebar 换书视觉同族（「换书 ▾」disclosure + 缩进列表，非书单墙）。
 * 复用最近栈 deskHref / page——换下书仍带回它的停留页，换书后再回来不丢页。
 */
export default function BookSwitcher({
  books,
  currentBookId,
}: {
  books: BookSwitcherBook[];
  currentBookId: string;
}) {
  const [recent, setRecent] = useState<LastOpened[]>([]);

  useEffect(() => {
    function sync() {
      setRecent(loadRecentBooks());
    }
    sync();
    return subscribeLastOpened(sync);
  }, []);

  if (books.length < 2) return null;
  const others = books.filter((b) => b.id !== currentBookId);
  if (others.length === 0) return null;

  return (
    <details className="mt-1">
      <summary className="cursor-pointer list-none text-xs text-muted transition-colors hover:text-cinnabar [&::-webkit-details-marker]:hidden">
        换书 ▾
      </summary>
      <ul className="mt-1 space-y-0.5 border-l-2 border-line pl-3">
        {others.map((b) => {
          const entry = recent.find((e) => e.bookId === b.id);
          const href =
            entry?.page != null
              ? `/desk?book=${encodeURIComponent(b.id)}&page=${entry.page}`
              : entry?.deskHref || `/desk?book=${encodeURIComponent(b.id)}`;
          return (
            <li key={b.id}>
              <Link
                href={href}
                title={b.title}
                className="block max-w-[16rem] truncate text-xs text-muted no-underline hover:text-cinnabar"
              >
                {b.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}