"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  healOpenedIfDirty,
  loadRecentBooks,
  subscribeLastOpened,
  type LastOpened,
} from "@/lib/last-opened";

export type BookSwitcherBook = { id: string; title: string };

/**
 * 书桌书名旁薄换书（T23 D，客户端）：books>=2 时在 DocumentPane 书名旁补 documents 换书入口，
 * 与 T22 Sidebar 换书视觉同族（「换书 ▾」disclosure + 缩进列表，非书单墙）。
 * 复用最近栈 deskHref / page——换下书仍带回它的停留页，换书后再回来不丢页。
 * T31 C：换书读侧消毒——带页 href 经该书 validPages 剥幽灵页（旧栈 page=999 不再深链）。
 */
export default function BookSwitcher({
  books,
  currentBookId,
  bookValidPages,
}: {
  books: BookSwitcherBook[];
  currentBookId: string;
  /** T31 C：bookId → 已解析印刷页[]（服务端装配）——换书读侧幽灵页消毒。 */
  bookValidPages?: Record<string, number[]>;
}) {
  const [recent, setRecent] = useState<LastOpened[]>([]);

  useEffect(() => {
    function sync() {
      // T32 A：换书读点从「只消毒展示」升级为 heal——有该书页表的脏条目单条写回
      // （剥幽灵 page / 脏 deskHref page=），渲染用 heal 后 entry；干净原引用不写盘。
      setRecent(
        loadRecentBooks().map((e) => healOpenedIfDirty(e, bookValidPages?.[e.bookId])),
      );
    }
    sync();
    return subscribeLastOpened(sync);
  }, [bookValidPages]);

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
          const ocrPages = bookValidPages?.[b.id]?.length ?? 0;
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
                {/* T46 D：换书条目标停留页 p.N + 0 OCR 提示（与 Sidebar 换书同口径；href 不变）。 */}
                {b.title}
                {entry?.page != null ? (
                  <span className="mono ml-1.5 text-[10px] text-muted">p.{entry.page}</span>
                ) : null}
                {ocrPages === 0 ? (
                  <span className="ml-1.5 text-[10px] text-muted">无 OCR</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}