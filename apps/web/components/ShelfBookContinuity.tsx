"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  healOpenedIfDirty,
  loadRecentBooks,
  subscribeLastOpened,
} from "@/lib/last-opened";
import { saveReturn } from "@/lib/return-stack";

/**
 * 书架每书「续开 p.N」客户岛（T25 D）：
 * 读最近书栈（ariadne.desk.recent-books.v1，last-opened 同族）找该书记录；
 * 有停留页 → 次级朱红文字链「续开 p.N →」进 /desk?book=&page=；无记录或无页 → 不渲染。
 * 主 CTA「打开书桌」仍在书卡上（不带页）；不出现第二颗大红按钮，
 * 不重做 ProgressPortability / LocalProgressStrip。
 * T31 C：续开读侧消毒——停留页经该书 validPages 验真，旧栈幽灵页（page=999）不再播。
 * T32 A：消毒升级 heal——有页表且脏时单条写回剥幽灵页（盘内 peel），不再只消毒展示。
 * T34 B：续开旁页级练/核——「练本页 →」/study?book=&page=&mode=all、「核本页 →」
 * /review?book=&page=&mode=open（muted 次级，对齐 LibraryContinuity 顶栏链口径；无页不渲）。
 * T37 E：页级练/核点前写 return 短链——回该书续开页（书桌 p.N；同 rememberDeskCardReturn
 * 口径，key 仍 ariadne.desk.return.v1）；「续开 p.N」自身就是书桌链，不写 return。
 * T50 A：页级练/核空池门禁（与章页轨顶 / CitePeek / ingest 三连同真）——服务端装配
 * 页→原子/待核 map 按 healed page 查；缺省/缺 key 当 0（fail-closed）。原子===0 →「练本页」
 * 降 muted 纯文「本页暂无原子」；待核===0 →「核本页」纯文「本页暂无待核」，均不可点；
 * >0 保持链 + rememberPageReturn；「续开 p.N」不受池影响，保持朱红文字链。
 */

/**
 * T34 C：该书 heal 后的合法停留页（单一口径——ShelfBookContinuity 与书卡 footer
 * 页级练/核链共用；读最近栈 + healOpenedIfDirty，无记录/无页 → null）。禁止第二套解析。
 */
export function healedRecentBookPage(bookId: string, validPages?: number[]): number | null {
  const hit = loadRecentBooks().find((e) => e.bookId === bookId);
  if (!hit) return null;
  return healOpenedIfDirty(hit, validPages).page ?? null;
}

/** 书架侧共享订阅 hook：随 last-opened 栈变化重读该书记留页（heal 幂等，干净不写盘）。 */
function useHealedRecentBookPage(bookId: string, validPages?: number[]): number | null {
  const [page, setPage] = useState<number | null>(null);
  useEffect(() => {
    function sync() {
      setPage(healedRecentBookPage(bookId, validPages));
    }
    sync();
    return subscribeLastOpened(sync);
  }, [bookId, validPages]);
  return page;
}

export default function ShelfBookContinuity({
  bookId,
  validPages,
  pageAtomByPage,
  pagePendingByPage,
}: {
  bookId: string;
  /** T31 C：该书已解析印刷页[]（服务端装配）——续开读侧幽灵页消毒。 */
  validPages?: number[];
  /** T50 A：页 → 该页可练原子数（collectStudyAtoms({bookId,page}) 同池族，服务端装配）；
      按 healed page 查，缺省/缺 key 当 0 · fail-closed——0 即「本页暂无原子」纯文。 */
  pageAtomByPage?: Record<number, number>;
  /** T50 A：页 → 该页待核 cite 数（collectCiteQueue({bookId,page}) 同池族）；查法同上。 */
  pagePendingByPage?: Record<number, number>;
}) {
  const page = useHealedRecentBookPage(bookId, validPages);
  if (page == null) return null;

  /** T50 A：页级空池门禁（fail-closed：map 未传/缺 key 都当 0，不进空页池）。 */
  const pageAtoms = pageAtomByPage?.[page] ?? 0;
  const pagePending = pagePendingByPage?.[page] ?? 0;

  /** T37 E：页级练/核出发写 return——回该书续开页（有阅读页→书桌 p.N）。 */
  const deskPageHref = `/desk?book=${encodeURIComponent(bookId)}&page=${page}`;
  const rememberPageReturn = () => {
    saveReturn({ href: deskPageHref, label: `书桌 p.${page}`, at: Date.now() });
  };

  return (
    <span className="flex flex-wrap items-baseline gap-3">
      <Link
        href={deskPageHref}
        className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
      >
        续开 p.{page} →
      </Link>
      {/* T34 B：页级练/核（muted 次级文字，非第二颗实心；与 LibraryContinuity 顶栏
          「学习环/核页」带 page= 的 href 同族）。T37 E：点前写 return。
          T50 A：0 原子/0 待核降 muted 纯文（本页池为空，进 /study|/review 也是空切片），
          文案与 CitePeek「本页暂无原子 / 本页暂无待核」同族。 */}
      {pageAtoms > 0 ? (
        <Link
          href={`/study?book=${encodeURIComponent(bookId)}&page=${page}&mode=all`}
          onClick={rememberPageReturn}
          className="text-sm text-muted no-underline hover:text-cinnabar"
        >
          练本页 →
        </Link>
      ) : (
        <span className="text-sm text-muted" title="本印刷页暂无可练原子">
          本页暂无原子
        </span>
      )}
      {pagePending > 0 ? (
        <Link
          href={`/review?book=${encodeURIComponent(bookId)}&page=${page}&mode=open`}
          onClick={rememberPageReturn}
          className="text-sm text-muted no-underline hover:text-cinnabar"
        >
          核本页 →
        </Link>
      ) : (
        <span className="text-sm text-muted" title="本印刷页暂无待核 cite">
          本页暂无待核
        </span>
      )}
    </span>
  );
}

/**
 * T34 C：书卡 footer「学习环 →」「核页 →」客户岛——与「续开 p.N」同一 heal 口径
 * （useHealedRecentBookPage 共用，无第二套解析）：该书有合法续开页时带 &page=
 * （练 mode=all · 核 mode=open，对齐 LibraryContinuity）；无页保持书级 /study?book= ·
 * /review?book=。LocalProgressStrip 的「本书」书级 href 不动（全书池诚实）。
 * T36 D：无页书级链也补默认档（&mode=all / &mode=open）——本标签 sticky 停在非默认
 * 空档时，footer 入口与书架 Strip 条末同真，不被档位记忆吞成空队列。
 * T37 E：点前写 return 短链——回该书书桌（有合法续开页→书桌 p.N，与链接自身页级池同位；
 * 否则书级 /desk?book=，label 含书名或「书桌」；同 rememberDeskCardReturn 口径，
 * key 仍 ariadne.desk.return.v1）。
 * T50 B：学习环/核页空池门禁（与 ingest 三连 / T48 轨顶同真）——有合法续开页用页级池
 * （pageAtomByPage/pendingPageByPage 按 healed page 查），无页用书级 atomCount/pendingCount；
 * 全部缺省/缺 key 当 0（fail-closed）。===0 → muted 纯文（页级点名「本页暂无原子/待核」、
 * 书级「暂无原子/待核」）不可点；>0 保持链 + rememberFooterReturn。Strip 的书级练/核
 * 与分段不在本组件，不动（Strip 已有 N=0 纯文）。
 */
export function ShelfBookFooterLinks({
  bookId,
  validPages,
  title,
  atomCount,
  pendingCount,
  pageAtomByPage,
  pagePendingByPage,
}: {
  bookId: string;
  validPages?: number[];
  /** T37 E：书名（书级 return label 用）；缺省 label 落「书桌」，不编书名。 */
  title?: string;
  /** T50 B：书级可练原子数（collectStudyAtoms({bookId}).length 同池族；缺省当 0）。 */
  atomCount?: number;
  /** T50 B：书级待核 cite 数（collectCiteQueue({bookId}).length 同池族；缺省当 0）。 */
  pendingCount?: number;
  /** T50 B：页 → 该页可练原子数（与 ShelfBookContinuity 同族 map）；有合法续开页时按页查。 */
  pageAtomByPage?: Record<number, number>;
  /** T50 B：页 → 该页待核 cite 数（同上）。 */
  pagePendingByPage?: Record<number, number>;
}) {
  const page = useHealedRecentBookPage(bookId, validPages);
  /** T50 B：有合法续开页用页级池，无页用书级池；缺省/缺 key 当 0 · fail-closed。 */
  const atomPool = page != null ? (pageAtomByPage?.[page] ?? 0) : (atomCount ?? 0);
  const pendingPool = page != null ? (pagePendingByPage?.[page] ?? 0) : (pendingCount ?? 0);
  const studyHref = `/study?book=${encodeURIComponent(bookId)}${
    page != null ? `&page=${page}` : ""
  }&mode=all`;
  const reviewHref = `/review?book=${encodeURIComponent(bookId)}${
    page != null ? `&page=${page}` : ""
  }&mode=open`;
  function rememberFooterReturn() {
    saveReturn({
      href:
        page != null
          ? `/desk?book=${encodeURIComponent(bookId)}&page=${page}`
          : `/desk?book=${encodeURIComponent(bookId)}`,
      label: page != null ? `书桌 p.${page}` : title ? `书桌《${title}》` : "书桌",
      at: Date.now(),
    });
  }
  return (
    <>
      {atomPool > 0 ? (
        <Link
          href={studyHref}
          onClick={rememberFooterReturn}
          className="text-muted no-underline hover:text-cinnabar"
        >
          学习环{page != null ? ` p.${page}` : ""} →
        </Link>
      ) : (
        <span
          className="text-muted"
          title={page != null ? "本印刷页暂无可练原子" : "这本书还没有萃取出的知识原子"}
        >
          {page != null ? "本页暂无原子" : "暂无原子"}
        </span>
      )}
      {pendingPool > 0 ? (
        <Link
          href={reviewHref}
          onClick={rememberFooterReturn}
          className="text-muted no-underline hover:text-cinnabar"
        >
          核页{page != null ? ` p.${page}` : ""} →
        </Link>
      ) : (
        <span
          className="text-muted"
          title={page != null ? "本印刷页暂无待核 cite" : "这本书还没有待核 cite"}
        >
          {page != null ? "本页暂无待核" : "暂无待核"}
        </span>
      )}
    </>
  );
}
