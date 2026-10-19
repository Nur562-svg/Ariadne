"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadRecentBooks,
  subscribeLastOpened,
  type LastOpened,
} from "@/lib/last-opened";

/**
 * 书架每书「续开 p.N」客户岛（T25 D）：
 * 读最近书栈（ariadne.desk.recent-books.v1，last-opened 同族）找该书记录；
 * 有停留页 → 次级朱红文字链「续开 p.N →」进 /desk?book=&page=；无记录或无页 → 不渲染。
 * 主 CTA「打开书桌」仍在书卡上（不带页）；不出现第二颗大红按钮，
 * 不重做 ProgressPortability / LocalProgressStrip。
 */
export default function ShelfBookContinuity({ bookId }: { bookId: string }) {
  const [entry, setEntry] = useState<LastOpened | null>(null);

  useEffect(() => {
    function sync() {
      const hit = loadRecentBooks().find((e) => e.bookId === bookId) ?? null;
      setEntry(hit && hit.page != null ? hit : null);
    }
    sync();
    return subscribeLastOpened(sync);
  }, [bookId]);

  if (!entry || entry.page == null) return null;

  return (
    <Link
      href={`/desk?book=${encodeURIComponent(bookId)}&page=${entry.page}`}
      className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
    >
      续开 p.{entry.page} →
    </Link>
  );
}
