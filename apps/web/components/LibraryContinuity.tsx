"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearLastOpened,
  healOpenedIfDirty,
  loadLastOpened,
  subscribeLastOpened,
  type LastOpened,
} from "@/lib/last-opened";
import { saveReturn } from "@/lib/return-stack";
import type { BookPools } from "@/lib/book-pools";

/**
 * 书库「继续上次」客户岛（T21 B）：
 * 读 last-opened 找书 → 顶栏「继续上次：《书名》→」进书桌 + 学习/核次级文字链；
 * 失效（bookId 已不在书库）→ clear + 回落 + 琥珀提示。
 * 「继续上次」是效用主链（朱红文字，非第三颗大红按钮）；「上次打开」用 muted 小字。
 * 不出现掌握 % / 圆环 / 营销绿条。
 * T31 C/D：读侧消毒——旧栈幽灵页（page=999）经该书 validPages 剥掉（脏时单条 heal，
 * 禁 clearLastOpened 整栈）；消毒后仍有合法停留页 → 学习/核次级链带 &page=（练 mode=all ·
 * 核 mode=open，与 Strip 深链同族）。
 * T37 C/E：学习环/核页恒拼默认档（无页书级也写 mode=all / mode=open，与 T36 书架
 * Strip/FooterLinks 同口径）；点前写 return 短链（有合法停留页→书桌 p.N，否则书级
 * deskHref——rememberDeskCardReturn 同口径，key 仍 ariadne.desk.return.v1）。
 * T50 C：学习环/核页空池门禁（与 ingest 三连 / 书架 footer 同真，soft leftover 收口）——
 * 有 last.page 用该书页级池（pageAtomByPage/pagePendingByPage 按页查），否则书级
 * atomCount/pendingCount；缺省/缺 key 当 0（fail-closed）。===0 → muted 纯文（页级
 * 「本页暂无原子/待核」· 书级「暂无原子/待核」）不可点；>0 保持链 + return。
 * 硬不动 T47 E「继续上次（尚无 OCR）」0-OCR 壳 / 去解析 / ocrPages 判断 / 失效琥珀。
 */
export default function LibraryContinuity({
  books,
  bookValidPages,
  poolsByBook,
}: {
  books: { id: string; title: string }[];
  /** T31 C：bookId → 已解析印刷页[]（服务端装配）——读侧幽灵页消毒。 */
  bookValidPages?: Record<string, number[]>;
  /** T50 C：bookId → 书级练核池 ± 页级 map（服务端 collectBookPools 装配，与书架续开/
      footer 同族单一口径）；按 last.page 选页级否则书级，缺省/缺 key 当 0 · fail-closed。 */
  poolsByBook?: Record<string, BookPools>;
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
      // T31 C + T32 A：消毒 + 单条 heal（helper 同口径；只改该书条目，不动其它书/不清整栈）。
      const sanitized = healOpenedIfDirty(raw, bookValidPages?.[raw.bookId]);
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
  /** T47 E：续开与书架 CTA 同真 OCR——该书 0 已解析印刷页 → 续开主链降级点名「尚无 OCR」+ 次级 /ingest；
      仍可进桌看概览/卡（href 不变）；>0 保持朱红。 */
  const ocrPages = bookValidPages?.[book.id]?.length ?? 0;

  /**
   * T37 E：学习环/核页点前写 return——从书库续开出发进练/核，完成态「回到刚才」
   * 回书桌原位（有合法停留页→书桌 p.N，否则书级；非法 href 由 saveReturn 拒收）。
   * 箭头 const（guard 后声明）保留 last/book 收窄——hoisted function 声明会丢窄化。
   */
  const rememberContinueReturn = () => {
    saveReturn({
      href:
        last.page != null
          ? `/desk?book=${encodeURIComponent(book.id)}&page=${last.page}`
          : href,
      label: last.page != null ? `书桌 p.${last.page}` : `书桌《${book.title}》`,
      at: Date.now(),
    });
  };

  /** T50 C：池选择与书架 footer 同族——有消毒后合法停留页用页级池，否则书级；缺 key 当 0。 */
  const pools = poolsByBook?.[book.id];
  const atomPool =
    last.page != null ? (pools?.pageAtomByPage?.[last.page] ?? 0) : (pools?.atomCount ?? 0);
  const pendingPool =
    last.page != null ? (pools?.pagePendingByPage?.[last.page] ?? 0) : (pools?.pendingCount ?? 0);

  return (
    <div className="mt-8 rounded-lg border border-line bg-card px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        {ocrPages > 0 ? (
          <Link
            href={href}
            className="text-sm font-medium text-cinnabar no-underline hover:underline underline-offset-4"
          >
            继续上次：《{book.title}》 →
          </Link>
        ) : (
          <>
            <Link
              href={href}
              title="尚无 OCR 印刷页——章页/分栏暂读不了；可进桌看概览与实体卡"
              className="text-sm font-medium text-muted no-underline hover:text-cinnabar"
            >
              继续上次：《{book.title}》（尚无 OCR）→
            </Link>
            <Link
              href="/ingest"
              className="text-sm text-muted no-underline hover:text-cinnabar"
            >
              去解析 →
            </Link>
          </>
        )}
        {/* T50 C：空池门禁（fail-closed）——0 原子/0 待核降 muted 纯文（页级点名本页、
            书级泛指），不可点 /study|/review；>0 保持链 + rememberContinueReturn。
            文案与书架 footer / ingest 三连 / CitePeek 同族。 */}
        {atomPool > 0 ? (
          <Link
            href={`/study?book=${encodeURIComponent(book.id)}${
              last.page != null ? `&page=${last.page}` : ""
            }&mode=all`}
            onClick={rememberContinueReturn}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            学习环 →
          </Link>
        ) : (
          <span
            className="text-sm text-muted"
            title={
              last.page != null ? "本印刷页暂无可练原子" : "这本书还没有萃取出的知识原子"
            }
          >
            {last.page != null ? "本页暂无原子" : "暂无原子"}
          </span>
        )}
        {pendingPool > 0 ? (
          <Link
            href={`/review?book=${encodeURIComponent(book.id)}${
              last.page != null ? `&page=${last.page}` : ""
            }&mode=open`}
            onClick={rememberContinueReturn}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            核页 →
          </Link>
        ) : (
          <span
            className="text-sm text-muted"
            title={last.page != null ? "本印刷页暂无待核 cite" : "这本书还没有待核 cite"}
          >
            {last.page != null ? "本页暂无待核" : "暂无待核"}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        上次打开
        {last.page != null ? ` · 上次停在 p.${last.page}` : ""}
        {" · "}仅这个浏览器
      </p>
    </div>
  );
}