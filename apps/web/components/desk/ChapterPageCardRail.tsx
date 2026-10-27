"use client";

import Link from "next/link";
import CitePeek from "@/components/CitePeek";
import PageCardRailMarks from "@/components/desk/PageCardRailMarks";
import type { PageCitingCard } from "@/lib/entities";
import { KIND_ZH, hitSummary } from "@/components/desk/chapter-page-reader-helpers";

/**
 * T76 机械抽出：原 ChapterPageReader.tsx 内本页卡轨（T15 页→卡闭环 · T27 B 练本页
 * mode=all / T35 核本页 mode=open · T48 C pendingByCard 空池门禁 · T24 B RailMarks ·
 * CitePeek 三数 + validPages · T42 rememberDeskReturn）整段迁此——JSX/文案/class/href
 * 零改，仅换文件。编排器在 pg && citingCards != null 时装配（空态诚实，不造假卡）。
 */
export default function ChapterPageCardRail({
  citingCards,
  bookId,
  studyPageHref,
  pageAtomCount,
  reviewPageHref,
  pendingPageCount,
  pendingByCard,
  readerValidPages,
  rememberDeskReturn,
}: {
  citingCards: PageCitingCard[];
  /** 当前书 id：「练」「核」深链携带 book=。 */
  bookId?: string;
  /** 练本页 href（编排器拼 book+chapter+page+mode=all；curPage 缺席为 undefined）。 */
  studyPageHref: string | undefined;
  /** 本页 citing 卡 atoms 合计（轨顶「练本页」与浮层同数）。 */
  pageAtomCount: number;
  /** 核本页 href（编排器拼 book+page+mode=open）。 */
  reviewPageHref: string | undefined;
  /** 当前印刷页待核 cite 数（0 → 「核本页」诚实禁用）。 */
  pendingPageCount?: number;
  /** T48 C：cardId → 本书待核 cite 数（0 → 轨行「核」降 muted 纯文，不进空 open 池）。 */
  pendingByCard?: Record<string, number>;
  /** T53 I：本书已解析印刷页表（CitePeek「在书桌打开」鬼页门禁）。 */
  readerValidPages: number[];
  /** 出发进练/核/开卡前写 return 短链（回当前书桌章页，带印刷页）。 */
  rememberDeskReturn: () => void;
}) {
  return (
    <section
      aria-label="本页相关实体卡"
      className="mt-6 rounded-lg border border-line bg-card px-4 py-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h4 className="text-xs font-semibold tracking-wider text-muted">
          本页相关实体卡 · {citingCards.length}
        </h4>
        <span className="flex flex-wrap items-baseline gap-3">
          {/* T27 B：练本页对称核本页（同族次级文字链；出发写 return 与核本页一致）。 */}
          {studyPageHref && citingCards.length > 0 ? (
            pageAtomCount > 0 ? (
              <Link
                href={studyPageHref}
                onClick={rememberDeskReturn}
                className="text-xs text-cinnabar no-underline hover:underline underline-offset-4"
              >
                练本页（{pageAtomCount}）→
              </Link>
            ) : (
              <span className="text-xs text-muted">本页暂无可练原子</span>
            )
          ) : null}
          {reviewPageHref ? (
            pendingPageCount != null && pendingPageCount > 0 ? (
              <Link
                href={reviewPageHref}
                onClick={rememberDeskReturn}
                className="text-xs text-cinnabar no-underline hover:underline underline-offset-4"
              >
                核本页（{pendingPageCount}）→
              </Link>
            ) : (
              <span className="text-xs text-muted">本页暂无待核 cite</span>
            )
          ) : null}
        </span>
      </div>
      {citingCards.length === 0 ? (
        <p className="mt-2 text-xs leading-6 text-muted">
          本页暂无 seed 卡引用本印刷页。
        </p>
      ) : (
        <>
          <ul className="mt-2 space-y-2">
            {citingCards.map((c) => (
              <li
                key={c.cardId}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-t border-line pt-2 first:border-t-0 first:pt-0"
              >
                <div className="min-w-0">
                  {/* T42 A：轨行卡名开卡点前 rememberDeskReturn——与同轨「练」「核」/
                      RailMarks 同函数（有阅读页→书桌 p.N），开卡旁路不再单向。 */}
                  <Link
                    href={`/desk/card/${encodeURIComponent(c.cardId)}`}
                    onClick={rememberDeskReturn}
                    className="text-sm font-medium text-foreground no-underline hover:text-cinnabar"
                  >
                    {c.nameZh}
                  </Link>
                  {/* T35 A/B：轨行「练」「核」写出默认档（练 mode=all · 核 mode=open）——
                      从轨进卡范围落可见池，不被 sticky 非默认空档撒谎。
                      T48 C：核侧空池门禁（与卡瓷砖/卡枢纽同池同真）——本卡 pending
                      （pendingByCard 由 DocumentPane heyePool 派生）===0 降 muted 纯文
                      「暂无待核」，不装有待核可点进 /review?card=&mode=open 空池。 */}
                  {c.atomCount > 0 && bookId ? (
                    <Link
                      href={`/study?card=${encodeURIComponent(c.cardId)}&book=${encodeURIComponent(bookId)}&mode=all`}
                      onClick={rememberDeskReturn}
                      className="ml-2 text-xs text-cinnabar no-underline hover:underline underline-offset-4"
                    >
                      练
                    </Link>
                  ) : null}
                  {bookId ? (
                    (pendingByCard?.[c.cardId] ?? 0) > 0 ? (
                      <Link
                        href={`/review?card=${encodeURIComponent(c.cardId)}&book=${encodeURIComponent(bookId)}&mode=open`}
                        onClick={rememberDeskReturn}
                        className="ml-2 text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                        title={`核《${c.nameZh}》的 cite`}
                      >
                        核
                      </Link>
                    ) : (
                      <span
                        className="ml-2 text-xs text-muted"
                        title={`《${c.nameZh}》暂无待核 cite`}
                      >
                        暂无待核
                      </span>
                    )
                  ) : null}
                  {/* T24 B：本机练/核薄计数（只读 study/heye 桶；无掌握% / 色环 / Due）。
                      T34 E：分段计数可点进该卡对应档（bookId + 点前写 return，同轨「练/核」口径）。 */}
                  <PageCardRailMarks
                    cardId={c.cardId}
                    atomCount={c.atomCount}
                    bookId={bookId}
                    rememberReturn={rememberDeskReturn}
                  />
                  {c.hits.slice(0, 2).map((h, i) => (
                    <div key={`${h.source}:${h.label}:${i}`} className="mt-0.5 flex items-center gap-1">
                      <span className="min-w-0 truncate text-xs text-muted">
                        {hitSummary(h)}
                      </span>
                      {/* T19：轨上 Peek——cite 由 hit 原样字段构造（page/verified 不编造）。
                          T49 E：下传 T48 同源三数——本页原子（pageAtomCount，轨顶「练本页」同 reduce）·
                          本页待核（pendingPageCount，页顶「核本页」同表）· 本卡待核
                          （pendingByCard，轨「核」门禁同表）——浮层 CTA 与轨顶/枢纽同真不进空池。
                          T53 I：再传该书 validPages——CiteChip/「在书桌打开」鬼页门禁同真。 */}
                      <CitePeek
                        cite={{
                          page: h.page,
                          quote: h.quote,
                          verified: h.verified,
                        }}
                        deskBookId={bookId}
                        cardId={c.cardId}
                        bookValidPages={readerValidPages}
                        pageAtomCount={pageAtomCount}
                        pendingPageCount={pendingPageCount}
                        pendingCiteCount={pendingByCard?.[c.cardId] ?? 0}
                      />
                    </div>
                  ))}
                </div>
                <span className="mono shrink-0 text-[11px] text-muted">
                  {KIND_ZH[c.kind] ?? c.kind}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-5 text-muted">
            「摘」可浮层看 quote 与抽查状态；「核」进核本卡、「核本页」逐条对本印刷页；练/核计数仅本浏览器记录。
          </p>
        </>
      )}
    </section>
  );
}
