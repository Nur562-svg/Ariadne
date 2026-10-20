"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearLastOpened,
  loadLastOpened,
  sanitizeOpenedPage,
  saveLastOpened,
  subscribeLastOpened,
  type LastOpened,
} from "@/lib/last-opened";

/**
 * 书库「继续上次」客户岛（T21 B）：
 * 读 last-opened 找书 → 顶栏「继续上次：《书名》→」进书桌 + 学习/核次级文字链；
 * 失效（bookId 已不在书库）→ clear + 回落 + 琥珀提示。
 * 「继续上次」是效用主链（朱红文字，非第三颗大红按钮）；「上次打开」用 muted 小字。
 * 不出现掌握 % / 圆环 / 营销绿条。
 * T31 C/D：读侧消毒——旧栈幽灵页（page=999）经该书 validPages 剥掉（脏时单条 heal，
 * 禁 clearLastOpened 整栈）；消毒后仍有合法停留页 → 学习/核次级链带 &page=（练 mode=all ·
 * 核 mode=open，与 Strip 深链同族），无页保持书级。
 */
export default function LibraryContinuity({
  books,
  bookValidPages,
}: {
  books: { id: string; title: string }[];
  /** T31 C：bookId → 已解析印刷页[]（服务端装配）——读侧幽灵页消毒。 */
  bookValidPages?: Record<string, number[]>;
}) {
  const [last, setLast] = useState<LastOpened | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    function sync() {
      const raw = loadLastOpened();
      if (!raw) {
        setLast(null);
        setInvalid(false);
        return;
      }
      if (!books.some((b) => b.id === raw.bookId)) {
        // 失效指针：书已不在书库 → 清除并诚实提示（可选琥珀）。
        clearLastOpened();
        setLast(null);
        setInvalid(true);
        return;
      }
      // T31 C：消毒 + 单条 heal（只改该书条目，不动其它书/不清整栈）。
      const sanitized = sanitizeOpenedPage(raw, bookValidPages?.[raw.bookId]);
      if (sanitized !== raw) saveLastOpened({ ...sanitized, at: Date.now() });
      setInvalid(false);
      setLast(sanitized);
    }
    sync();
    return subscribeLastOpened(sync);
  }, [books, bookValidPages]);

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
          href={`/study?book=${encodeURIComponent(book.id)}${
            last.page != null ? `&page=${last.page}&mode=all` : ""
          }`}
          className="text-sm text-muted no-underline hover:text-cinnabar"
        >
          学习环 →
        </Link>
        <Link
          href={`/review?book=${encodeURIComponent(book.id)}${
            last.page != null ? `&page=${last.page}&mode=open` : ""
          }`}
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