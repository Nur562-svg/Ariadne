"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  healOpenedIfDirty,
  loadRecentBooks,
  subscribeLastOpened,
} from "@/lib/last-opened";

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
}: {
  bookId: string;
  /** T31 C：该书已解析印刷页[]（服务端装配）——续开读侧幽灵页消毒。 */
  validPages?: number[];
}) {
  const page = useHealedRecentBookPage(bookId, validPages);
  if (page == null) return null;

  return (
    <span className="flex flex-wrap items-baseline gap-3">
      <Link
        href={`/desk?book=${encodeURIComponent(bookId)}&page=${page}`}
        className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
      >
        续开 p.{page} →
      </Link>
      {/* T34 B：页级练/核（muted 次级文字，非第二颗实心；与 LibraryContinuity 顶栏
          「学习环/核页」带 page= 的 href 同族）。 */}
      <Link
        href={`/study?book=${encodeURIComponent(bookId)}&page=${page}&mode=all`}
        className="text-sm text-muted no-underline hover:text-cinnabar"
      >
        练本页 →
      </Link>
      <Link
        href={`/review?book=${encodeURIComponent(bookId)}&page=${page}&mode=open`}
        className="text-sm text-muted no-underline hover:text-cinnabar"
      >
        核本页 →
      </Link>
    </span>
  );
}

/**
 * T34 C：书卡 footer「学习环 →」「核页 →」客户岛——与「续开 p.N」同一 heal 口径
 * （useHealedRecentBookPage 共用，无第二套解析）：该书有合法续开页时带 &page=
 * （练 mode=all · 核 mode=open，对齐 LibraryContinuity）；无页保持书级 /study?book= ·
 * /review?book=。LocalProgressStrip 的「本书」书级 href 不动（全书池诚实）。
 */
export function ShelfBookFooterLinks({
  bookId,
  validPages,
}: {
  bookId: string;
  validPages?: number[];
}) {
  const page = useHealedRecentBookPage(bookId, validPages);
  const studyHref = `/study?book=${encodeURIComponent(bookId)}${
    page != null ? `&page=${page}&mode=all` : ""
  }`;
  const reviewHref = `/review?book=${encodeURIComponent(bookId)}${
    page != null ? `&page=${page}&mode=open` : ""
  }`;
  return (
    <>
      <Link href={studyHref} className="text-muted no-underline hover:text-cinnabar">
        学习环{page != null ? ` p.${page}` : ""} →
      </Link>
      <Link href={reviewHref} className="text-muted no-underline hover:text-cinnabar">
        核页{page != null ? ` p.${page}` : ""} →
      </Link>
    </>
  );
}
