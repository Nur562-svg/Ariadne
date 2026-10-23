"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  healOpenedIfDirty,
  loadLastOpened,
  loadRecentBooks,
  subscribeLastOpened,
  type LastOpened,
} from "@/lib/last-opened";
import { saveReturn } from "@/lib/return-stack";

/** 侧栏「在读书目」摘要（(desk) layout 服务端算好传入多书，客户端据 last-opened 选一本）。 */
export type SidebarBook = {
  id: string;
  title: string;
  chapters: number;
  cards: number;
  /** T46 C：OCR 印刷页数（loadBookValidPages 同口径；0 = 无 OCR 页）。 */
  pages?: number;
  /** T50 D：书级可练原子数（collectStudyAtoms({bookId}).length 同池族；缺省当 0 · fail-closed）。 */
  atomCount?: number;
  /** T50 D：书级待核 cite 数（collectCiteQueue({bookId}).length 同池族；缺省当 0）。 */
  pendingCount?: number;
  /** T50 D：页 → 该页可练原子数（collectBookPools 同族 map）；按消毒后 currentEntry.page 查。 */
  pageAtomByPage?: Record<number, number>;
  /** T50 D：页 → 该页待核 cite 数（同上）。 */
  pagePendingByPage?: Record<number, number>;
};

const PRIMARY = [
  { href: "/desk", label: "书桌", hint: "实体卡 · 章页" },
  { href: "/study", label: "学习", hint: "本机自评 · 不熟再练" },
  { href: "/review", label: "复习", hint: "核页 · 本机对页" },
  { href: "/", label: "书架", hint: "书库" },
] as const;

const SECONDARY = [
  { href: "/entities", label: "实体卡浏览器" },
  { href: "/ingest", label: "导入教材" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * desk-v4 左栏（~248）：书桌 / 学习 / 复习 / 书架 主导航 + 次级入口 + 在读书目。
 * 朱砂只做当前行强调；「学习」是本机自评环（desk-study-01，全部｜未评｜不熟再练），
 * 「复习」是核页本机对页（desk-heye-01）——两者都不是 FSRS，禁止再写假 Due 角标 / 到期暗示。
 * T21（desk-library-shelf-continuity）：在读书目不再死取 books[0]，
 * 客户端据 last-opened 选「在读」书（失效回落首本/空库），书名可点进书桌，并给学习/核次级链（?book=）。
 */
export default function Sidebar({
  books,
  bookValidPages,
}: {
  books?: SidebarBook[];
  /** T31 C：bookId → 已解析印刷页[]（服务端 loadBookValidPages 装配）——读侧幽灵页消毒。 */
  bookValidPages?: Record<string, number[]>;
}) {
  const pathname = usePathname();
  const [current, setCurrent] = useState<SidebarBook | undefined>(books?.[0]);
  /** 消毒后的在读条目（含合法停留页）；无效/无记录 → null。 */
  const [currentEntry, setCurrentEntry] = useState<LastOpened | null>(null);
  const [recent, setRecent] = useState<LastOpened[]>([]);

  useEffect(() => {
    function sync() {
      const raw = loadLastOpened();
      const book = raw ? books?.find((b) => b.id === raw.bookId) : undefined;
      /**
       * T31 C + T32 A/B：读侧消毒 + 单条 heal（helper 同口径）——旧栈幽灵页（如历史写入的
       * page=999）经该书 validPages 剥掉并写回盘内（只改该书条目并保序，禁 clearLastOpened
       * 整栈；写点已在 T30 D 封死，heal 只兜历史脏数据）。
       */
      const lo = raw && book ? healOpenedIfDirty(raw, bookValidPages?.[raw.bookId]) : raw;
      // 有效 last-opened → 该书；无效/无 → 首本（有书时）或 undefined（空库文案）。
      setCurrentEntry(book ? lo : null);
      setCurrent(book ?? books?.[0]);
      // T32 B：recent 多书 heal——换书列表/侧栏在读书目引用的每条 recent，有该书页表的
      // 脏条目同样单条写回（干净原引用返回，!== 判脏防循环；不清整栈、不改 RECENT_MAX）。
      setRecent(
        loadRecentBooks().map((e) => healOpenedIfDirty(e, bookValidPages?.[e.bookId])),
      );
    }
    sync();
    return subscribeLastOpened(sync);
  }, [books, bookValidPages]);

  /**
   * T38 A：在读「学习 / 核页」出发进练核前写 return 短链——完成态「回到刚才」回这本书
   * 的书桌位（有消毒后合法停留页回本页，否则书级）。key 仍 ariadne.desk.return.v1
   * （与 ChapterPageReader / Clew / Shelf 同一桶，覆盖式单条），不另开第二套 return；
   * 全局 NAV /study /review 仍不写（那是换面，不是从某出发点进练核）。
   */
  function rememberDeskReturn() {
    if (!current) return;
    const bookQ = `book=${encodeURIComponent(current.id)}`;
    saveReturn({
      href:
        currentEntry?.page != null ? `/desk?${bookQ}&page=${currentEntry.page}` : `/desk?${bookQ}`,
      label: currentEntry?.page != null ? `书桌 p.${currentEntry.page}` : `书桌《${current.title}》`,
      at: Date.now(),
    });
  }

  /**
   * T50 D：在读学习/核页空池门禁（与书架续开 / footer / 继续上次同族）——有消毒后
   * 合法停留页用该书页级池（pageAtomByPage/pagePendingByPage 按页查），否则书级
   * atomCount/pendingCount；缺省/缺 key 当 0（fail-closed）。===0 → muted 纯文
   * （页级「本页暂无原子/待核」· 书级「暂无原子/待核」）不可点；>0 保持链 + return。
   * 只门禁这两条练核入口——主导航 / 换书 / OCR 摘要不动。
   */
  const studyPool =
    currentEntry?.page != null
      ? (current?.pageAtomByPage?.[currentEntry.page] ?? 0)
      : (current?.atomCount ?? 0);
  const reviewPool =
    currentEntry?.page != null
      ? (current?.pagePendingByPage?.[currentEntry.page] ?? 0)
      : (current?.pendingCount ?? 0);

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-line bg-card">
      <div className="px-5 pb-4 pt-5">
        <Link href="/desk" className="mono text-sm tracking-widest text-foreground no-underline">
          ARIADNE<span className="text-cinnabar">·</span>
        </Link>
        <p className="mt-1 text-xs text-muted">考前书桌</p>
      </div>

      <nav className="flex flex-col gap-1 px-3" aria-label="主导航">
        {PRIMARY.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-baseline justify-between gap-2 rounded-lg px-3 py-2 no-underline transition-colors motion-reduce:transition-none ${
                active
                  ? "bg-cinnabar-soft font-semibold text-cinnabar"
                  : "text-foreground/85 hover:bg-background"
              }`}
            >
              <span className="text-sm">{item.label}</span>
              <span className={`text-xs ${active ? "text-cinnabar/80" : "text-muted"}`}>
                {item.hint}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-5">
        <p className="text-[11px] tracking-wider text-muted">入口</p>
      </div>
      <nav className="mt-2 flex flex-col gap-0.5 px-3" aria-label="次级入口">
        {SECONDARY.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm no-underline transition-colors motion-reduce:transition-none ${
                active
                  ? "bg-cinnabar-soft text-cinnabar"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-line px-5 py-4">
        {current ? (
          <>
            <p className="text-[11px] text-muted">在读书目</p>
            <Link
              href={`/desk?book=${encodeURIComponent(current.id)}`}
              title={current.title}
              className="mt-1 block truncate text-sm font-medium leading-6 text-foreground no-underline hover:text-cinnabar"
            >
              {current.title}
            </Link>
            <p className="mt-0.5 text-xs text-muted">
              {/* T46 C：在读摘要补 OCR 就绪（与书架书卡/Overview 同口径；0 写「无 OCR 页」）。 */}
              {current.chapters} 章 · {current.cards} 张实体卡 ·{" "}
              {current.pages != null && current.pages > 0
                ? `${current.pages} OCR 页`
                : "无 OCR 页"}
            </p>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {/* T31 D：合法停留页（消毒后）→ 学习/核页次级链带 page，落本页池；
                  练侧显式 mode=all 防 sticky 档位回补空档（与 Strip 深链同族）。
                  T37 C：恒拼默认档（练 mode=all · 核 mode=open，无页书级也写）——与
                  T36 书架 Strip/FooterLinks 同口径，消 if 分支漏成裸 ?book= 的空档。
                  T38 A：两条链点前 saveReturn（见 rememberDeskReturn）——完成态可回这本书。
                  T50 D：空池门禁（fail-closed，同书架续开/footer/继续上次族）——
                  0 原子/0 待核降 muted 纯文（页级点名本页），不可点。 */}
              {studyPool > 0 ? (
                <Link
                  href={`/study?book=${encodeURIComponent(current.id)}${
                    currentEntry?.page != null ? `&page=${currentEntry.page}` : ""
                  }&mode=all`}
                  onClick={rememberDeskReturn}
                  className="text-muted no-underline hover:text-cinnabar"
                >
                  学习 →
                </Link>
              ) : (
                <span
                  className="text-muted"
                  title={
                    currentEntry?.page != null
                      ? "本印刷页暂无可练原子"
                      : "这本书还没有萃取出的知识原子"
                  }
                >
                  {currentEntry?.page != null ? "本页暂无原子" : "暂无原子"}
                </span>
              )}
              {reviewPool > 0 ? (
                <Link
                  href={`/review?book=${encodeURIComponent(current.id)}${
                    currentEntry?.page != null ? `&page=${currentEntry.page}` : ""
                  }&mode=open`}
                  onClick={rememberDeskReturn}
                  className="text-muted no-underline hover:text-cinnabar"
                >
                  核页 →
                </Link>
              ) : (
                <span
                  className="text-muted"
                  title={
                    currentEntry?.page != null
                      ? "本印刷页暂无待核 cite"
                      : "这本书还没有待核 cite"
                  }
                >
                  {currentEntry?.page != null ? "本页暂无待核" : "暂无待核"}
                </span>
              )}
            </p>
            {/* T22 D：多书换书入口（薄 disclosure，非书单墙）；换书保留被换下书的停留页（读最近栈 deskHref/page）。 */}
            {books && books.length >= 2 ? (
              <details className="mt-2">
                <summary className="cursor-pointer list-none text-xs text-muted transition-colors hover:text-cinnabar [&::-webkit-details-marker]:hidden">
                  换书 ▾
                </summary>
                <ul className="mt-1 space-y-0.5 border-l-2 border-line pl-3">
                  {books
                    .filter((b) => b.id !== current.id)
                    .map((b) => {
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
                            className="block truncate text-xs text-muted no-underline hover:text-cinnabar"
                          >
                            {/* T46 D：换书条目标停留页 p.N + 0 OCR 提示（与 BookSwitcher 同口径）。 */}
                            {b.title}
                            {entry?.page != null ? (
                              <span className="mono ml-1.5 text-[10px] text-muted">p.{entry.page}</span>
                            ) : null}
                            {(b.pages ?? 0) === 0 ? (
                              <span className="ml-1.5 text-[10px] text-muted">无 OCR</span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </details>
            ) : null}
          </>
        ) : (
          <p className="text-xs leading-6 text-muted">
            书库为空 ·{" "}
            <Link href="/ingest" className="text-cinnabar no-underline hover:underline underline-offset-4">
              去导入
            </Link>
          </p>
        )}
      </div>
    </aside>
  );
}
