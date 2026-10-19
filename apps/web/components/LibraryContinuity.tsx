"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearLastOpened,
  loadLastOpened,
  subscribeLastOpened,
  type LastOpened,
} from "@/lib/last-opened";

/**
 * 书库「继续上次」客户岛（T21 B）：
 * 读 last-opened 找书 → 顶栏「继续上次：《书名》→」进书桌 + 学习/核次级文字链；
 * 失效（bookId 已不在书库）→ clear + 回落 + 琥珀提示。
 * 「继续上次」是效用主链（朱红文字，非第三颗大红按钮）；「上次打开」用 muted 小字。
 * 不出现掌握 % / 圆环 / 营销绿条。
 */
export default function LibraryContinuity({ books }: { books: { id: string; title: string }[] }) {
  const [last, setLast] = useState<LastOpened | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    function sync() {
      const lo = loadLastOpened();
      if (!lo) {
        setLast(null);
        setInvalid(false);
        return;
      }
      if (!books.some((b) => b.id === lo.bookId)) {
        // 失效指针：书已不在书库 → 清除并诚实提示（可选琥珀）。
        clearLastOpened();
        setLast(null);
        setInvalid(true);
        return;
      }
      setInvalid(false);
      setLast(lo);
    }
    sync();
    return subscribeLastOpened(sync);
  }, [books]);

  if (invalid) {
    return (
      <p className="mt-6 text-sm text-status-warn">
        上次打开的书已不在书库，已清除续开指针。
      </p>
    );
  }

  const book = last ? books.find((b) => b.id === last.bookId) : undefined;
  if (!last || !book) return null;

  const href = last.deskHref || `/desk?book=${encodeURIComponent(book.id)}`;

  return (
    <div className="mt-8 rounded-lg border border-line bg-card px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <Link
          href={href}
          className="text-sm font-medium text-cinnabar no-underline hover:underline underline-offset-4"
        >
          继续上次：《{book.title}》 →
        </Link>
        <Link
          href={`/study?book=${encodeURIComponent(book.id)}`}
          className="text-sm text-muted no-underline hover:text-cinnabar"
        >
          学习环 →
        </Link>
        <Link
          href={`/review?book=${encodeURIComponent(book.id)}`}
          className="text-sm text-muted no-underline hover:text-cinnabar"
        >
          核页 →
        </Link>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        上次打开
        {last.page != null ? ` · 上次停在 p.${last.page}` : ""}
        {" · "}仅这个浏览器
      </p>
    </div>
  );
}