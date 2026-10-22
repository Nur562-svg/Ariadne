import Link from "next/link";
import { collectStudyAtoms, loadBooks, loadBookValidPages, loadCards } from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import LibraryContinuity from "@/components/LibraryContinuity";
import ProgressPortability from "@/components/ProgressPortability";
import ShelfBookContinuity, { ShelfBookFooterLinks } from "@/components/ShelfBookContinuity";
import { withQsMode } from "@/lib/qs-mode";

/**
 * 书库页（书架）：DeskShell 中栏，从 config/books.json 派生，不硬编码任何书名/章节 copy。
 * 空库 → 指向 /ingest 的安静 empty-state，不是营销 hero。
 */
export const dynamic = "force-dynamic";

export default function Library() {
  const books = loadBooks();
  /** T31 C：各书已解析印刷页集合——继续上次 / 每书「续开 p.N」读侧幽灵页消毒。 */
  const bookValidPages = loadBookValidPages();

  if (books.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-8 py-10">
        <h1 className="brand-rule pb-2 text-4xl font-bold tracking-wide">书库</h1>
        <p className="mt-6 leading-8 text-foreground/90">
          书库还空着。先到 <span className="mono text-sm">/ingest</span> 上传教材 PDF、跑完 OCR 解析与实体卡抽取，
          再在章清单里「注册进书库」，即可在书桌阅读、进入卡浏览器与学习环。
          书目注册走应用内流程，不需要手工改 <span className="mono text-sm">config/books.json</span>。
        </p>
        <ol className="mt-8 max-w-md space-y-2 text-sm text-foreground/85">
          <li>1 · 上传教材 PDF，本机跑 OCR 解析。</li>
          <li>2 · 抽取实体卡与知识原子。</li>
          <li>3 · 在 /ingest 章清单里「注册进书库」，开书桌阅读、进学习环 / 核页。</li>
        </ol>
        <Link
          href="/ingest"
          className="mt-10 inline-block rounded-md bg-cinnabar px-5 py-2.5 text-white no-underline"
        >
          去导入教材 →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      <h1 className="brand-rule pb-2 text-4xl font-bold tracking-wide">书库</h1>
      <p className="mt-4 text-sm leading-7 text-muted">
        教材 → 知识原子 / 实体卡 → 可复习。打开一本书进入书桌（三栏学习面）；citation 仍 fail-closed（未验证保留琥珀 p.N / p.?）。
      </p>

      {/* T21 B1：合法 last-opened → 顶栏「继续上次」进书桌（次级学习/核）；失效 → clear + 琥珀提示。
          T31 C：传 validPages——旧栈幽灵页读侧消毒（脏时单条 heal）。 */}
      <LibraryContinuity
        books={books.map((b) => ({ id: b.id, title: b.title }))}
        bookValidPages={bookValidPages}
      />

      <ul className="mt-6 space-y-4">
        {books.map((b) => {
          const cards = loadCards({ bookId: b.id });
          const atoms = cards.reduce((n, c) => n + c.atoms.length, 0);
          /** T46 A：OCR 就绪口径 = bookValidPages（与 T45 Overview / 章行同一事实源）。 */
          const ocrPages = bookValidPages[b.id]?.length ?? 0;
          const deskHref = `/desk?book=${encodeURIComponent(b.id)}`;
          /* T36 D：书级练/核显式默认档（练 mode=all · 核 mode=open）——本标签 sticky 停在
             unknown/ungraded/doubt 空档时，从书架条末进练/核仍落可见池；条末仍书级（不伪装本页，
             有续开页的精确页练核走 ShelfBookContinuity 页级链，与 T34 C 一致，只补默认 mode）。 */
          const studyHref = `/study?book=${encodeURIComponent(b.id)}&mode=all`;
          const reviewHref = `/review?book=${encodeURIComponent(b.id)}&mode=open`;
          return (
            <li key={b.id} className="rounded-lg border border-line bg-card p-5">
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
                  <ShelfBookContinuity bookId={b.id} validPages={bookValidPages[b.id]} />
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
                    T37 E：传 title——点前 return 书级 label 含书名（有页落「书桌 p.N」）。 */}
                <ShelfBookFooterLinks
                  bookId={b.id}
                  validPages={bookValidPages[b.id]}
                  title={b.title}
                />
              </p>
            </li>
          );
        })}
      </ul>

      {/* T24 C：书库效用区「本机进度带走」——导出/导入 study+heye JSON（纯客户端，非云同步）。 */}
      <ProgressPortability />

      <p className="mt-10 text-sm text-muted">
        导入新书：<Link href="/ingest" className="text-cinnabar no-underline hover:underline underline-offset-4">/ingest 上传 PDF</Link>
      </p>
    </div>
  );
}