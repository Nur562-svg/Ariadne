import Link from "next/link";
import { collectStudyAtoms, loadCards, type BookConfig } from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import type { BookPools } from "@/lib/book-pools";
import type { CiteQuality } from "@/lib/cite-ocr-quality";
import type {
  ShelfBookDensitySignal,
  ShelfBookExtractPageSignal,
  ShelfBookParseSignal,
} from "@/lib/library-shelf-data";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import ShelfBookContinuity, { ShelfBookFooterLinks } from "@/components/ShelfBookContinuity";
import ShelfBookSignalBadges from "@/components/ShelfBookSignalBadges";
import { withQsMode } from "@/lib/qs-mode";

/**
 * T97 desk-library-shelf-split-01：书架单书卡——自 app/(desk)/page.tsx :262–465 books.map 体
 * 机械抽出（标题链 · T46 打开书桌 OCR 门禁 · ShelfBookContinuity · 四格 dl ·
 * ShelfBookSignalBadges · LocalProgressStrip 书级 mode href + returnTo 书架 · footer 卡浏览器 +
 * ShelfBookFooterLinks）。className / 文案 / href / 门禁 ≡ tip；validPages / pools / 四信号
 * 切片由 page 自 buildLibraryShelfData 同池下传，本件不另读第二套；key 由 page 的 map 持有。
 */
export default function ShelfBookCard({
  book: b,
  validPages,
  pools,
  quality,
  parseCoverage,
  extractPage,
  density,
}: {
  book: BookConfig;
  validPages: number[] | undefined;
  pools: BookPools;
  quality: CiteQuality | null;
  parseCoverage: ShelfBookParseSignal;
  extractPage: ShelfBookExtractPageSignal;
  density: ShelfBookDensitySignal;
}) {
  const cards = loadCards({ bookId: b.id });
  const atoms = cards.reduce((n, c) => n + c.atoms.length, 0);
  /** T46 A：OCR 就绪口径 = bookValidPages（与 T45 Overview / 章行同一事实源）。 */
  const ocrPages = validPages?.length ?? 0;
  const deskHref = `/desk?book=${encodeURIComponent(b.id)}`;
  /* T36 D：书级练/核显式默认档（练 mode=all · 核 mode=open）——本标签 sticky 停在
     unknown/ungraded/doubt 空档时，从书架条末进练/核仍落可见池；条末仍书级（不伪装本页，
     有续开页的精确页练核走 ShelfBookContinuity 页级链，与 T34 C 一致，只补默认 mode）。 */
  const studyHref = `/study?book=${encodeURIComponent(b.id)}&mode=all`;
  const reviewHref = `/review?book=${encodeURIComponent(b.id)}&mode=open`;
  return (
    <li className="rounded-lg border border-line bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold text-foreground">
          <Link
            href={deskHref}
            className="text-foreground no-underline hover:text-cinnabar"
          >
            {b.title}
          </Link>
        </h2>
        {/* T25 D：主 CTA「打开书桌」旁的次级续开链（该书记录带停留页时才出现，勿第二颗大红）。
            T46 B：0 OCR 书主 CTA 降级 outline/muted + 点名尚无 OCR（章页/分栏暂读不了）——
            仍可进桌看概览/实体卡，旁补次级 /ingest；>0 保持朱红。 */}
        <span className="flex flex-wrap items-center gap-4">
          {ocrPages > 0 ? (
            <Link
              href={deskHref}
              className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline"
            >
              打开书桌 →
            </Link>
          ) : (
            <>
              <Link
                href={deskHref}
                title="尚无 OCR 印刷页——章页/分栏暂读不了；可进桌看概览与实体卡"
                className="rounded-md border border-line px-4 py-2 text-sm text-muted no-underline hover:border-cinnabar hover:text-cinnabar"
              >
                打开书桌（尚无 OCR）→
              </Link>
              <Link
                href="/ingest"
                className="text-sm text-muted no-underline hover:text-cinnabar"
              >
                去解析 →
              </Link>
            </>
          )}
          <ShelfBookContinuity
            bookId={b.id}
            validPages={validPages}
            pageAtomByPage={pools.pageAtomByPage}
            pagePendingByPage={pools.pagePendingByPage}
          />
        </span>
      </div>
      {/* T46 A：书卡四格补「OCR 印刷页」——与 T45 Overview 四格同款（0 写「无 OCR 页」）。 */}
      <dl className="mt-4 grid grid-cols-2 gap-4 text-center sm:max-w-lg sm:grid-cols-4">
        {(
          [
            ["章节", b.chapterIds.length],
            ["实体卡", cards.length],
            ["知识原子", atoms],
            ["OCR 印刷页", ocrPages > 0 ? ocrPages : "无 OCR 页"],
          ] as [string, string | number][]
        ).map(([k, v]) => (
          <div key={String(k)}>
            <dt className="text-xs text-muted">{k}</dt>
            <dd
              className={`mt-0.5 font-semibold ${
                typeof v === "number" ? "text-lg" : "text-base leading-7"
              }`}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <ShelfBookSignalBadges
        quality={quality}
        parseCoverage={parseCoverage}
        extractPage={extractPage}
        density={density}
      />
      <p className="mt-4 text-xs leading-6 text-muted">章 {b.chapterIds.join(" · ")}</p>
      {/* T21 B2：每书本机练/核计数（传该书 atoms/items 池；无掌握% / 圆环 / Due 角标）。
          T36 D：书级池分段可点——三档从条末书级 href mode-swap（?book=&mode=*）；
          N=0 纯文，无池不出现（书架恒传本书池）。
          T39 E：returnTo 回书架（/ · label 书架《书名》）——条末练/核与 N>0 分段
          点前写 return，完成态「回到刚才」回到这本书所在的列表。 */}
      <LocalProgressStrip
        atoms={collectStudyAtoms({ bookId: b.id }).map((a) => ({ cardId: a.cardId, atomId: a.atomId }))}
        items={collectCiteQueue({ bookId: b.id }).map((it) => ({ key: it.key }))}
        scopeLabel="本书"
        studyHref={studyHref}
        reviewHref={reviewHref}
        returnTo={{ href: "/", label: `书架《${b.title}》` }}
        studyModeHrefs={{
          all: withQsMode(studyHref, "all"),
          unknown: withQsMode(studyHref, "unknown"),
          ungraded: withQsMode(studyHref, "ungraded"),
        }}
        heyeModeHrefs={{
          open: withQsMode(reviewHref, "open"),
          checked: withQsMode(reviewHref, "checked"),
          doubt: withQsMode(reviewHref, "doubt"),
        }}
      />
      <p className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
        <Link
          href={`/entities?book=${encodeURIComponent(b.id)}`}
          className="text-muted no-underline hover:text-cinnabar"
        >
          卡浏览器 →
        </Link>
        {/* T34 C：footer 学习环/核页与「续开 p.N」同一 heal 口径（有合法续开页带
            &page= · 练 mode=all · 核 mode=open；无页书级）。
            T37 E：传 title——点前 return 书级 label 含书名（有页落「书桌 p.N」）。
            T50 E：传书级 counts ± 页级 map——空池门禁（有页用页级否则书级）。 */}
        <ShelfBookFooterLinks
          bookId={b.id}
          validPages={validPages}
          title={b.title}
          atomCount={pools.atomCount}
          pendingCount={pools.pendingCount}
          pageAtomByPage={pools.pageAtomByPage}
          pagePendingByPage={pools.pagePendingByPage}
        />
      </p>
    </li>
  );
}
