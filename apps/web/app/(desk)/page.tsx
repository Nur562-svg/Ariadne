import Link from "next/link";
import {
  collectStudyAtoms,
  loadBooks,
  loadBookValidPages,
  loadCards,
  loadChapterPages,
} from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import { collectBookPools, type BookPools } from "@/lib/book-pools";
import { scoreChapter, type CiteQuality } from "@/lib/cite-ocr-quality";
import { loadParseCoverage } from "@/lib/parse-ocr-coverage-server";
import { loadExtractPageCoverage } from "@/lib/extract-page-coverage-server";
import { loadExtractPageDensity } from "@/lib/extract-page-density-server";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import LibraryContinuity from "@/components/LibraryContinuity";
import ProgressPortability from "@/components/ProgressPortability";
import DraftInbox from "@/components/DraftInbox";
import { atomIncomplete } from "@/lib/atom-draft";
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
  /**
   * T50 E：各书练/核池（书级长度 + 页→原子/待核 map）——collectBookPools 单一装配口径
   * （collectStudyAtoms / collectCiteQueue / cardsCitingPage 卡级命中同池族，禁第二套池、
   * 禁造假正数）：书架续开「练本页/核本页」、footer「学习环/核页」、「继续上次」学习环/核页
   * 空池门禁共用；客户端按 healed/last.page 查页级 map，缺 key 当 0（fail-closed）。
   */
  const poolsByBook: Record<string, BookPools> = {};
  for (const b of books) poolsByBook[b.id] = collectBookPools(b.id);

  /**
   * T62 I：草稿收件箱种子 props——slim 卡索引（全库 id/名/章，不整库下传 entities）+
   * seed 口径 incomplete 摘要（atomIncomplete 与 T55 incompleteAtoms 同口径；只列 >0 的卡）。
   * Server 只读 loadCards；Client 读草稿键并按需只读 GET /api/entities/<id>（详见 DraftInbox）。
   */
  const inboxCards = loadCards();
  const draftCardIndex = inboxCards.map((c) => ({
    id: c.id,
    nameZh: c.name_zh,
    chapterId: c.chapterId,
  }));
  const incompleteCardSummaries = inboxCards
    .map((c) => ({
      id: c.id,
      name: c.name_zh,
      chapterId: c.chapterId,
      incompleteAtoms: c.atoms.filter((a) => atomIncomplete(a)).length,
    }))
    .filter((s) => s.incompleteAtoms > 0);

  /**
   * T55 H/I：书级质量徽装配——各书折叠其章 scoreChapter（与 pnpm cite-check / ingest
   * 章清单同真算法；缺 OCR 文本的 cite 不计 miss＝未检，不抬假阳）。章级 textByPage /
   * cards 跨书缓存一次；弱书（OCR未见/零原子/不完备 任一 >0）才出琥珀徽，好书不吵。
   */
  const qualityTextByCh = new Map<string, Record<number, string>>();
  const qualityCardsByCh = new Map<string, Parameters<typeof scoreChapter>[0]>();
  function chapterCheck(chId: string): CiteQuality | null {
    if (!qualityTextByCh.has(chId)) {
      const textByPage: Record<number, string> = {};
      for (const p of loadChapterPages(chId)) {
        if (p.page != null) textByPage[p.page] = p.text;
      }
      qualityTextByCh.set(chId, textByPage);
      qualityCardsByCh.set(chId, loadCards({ chapterId: chId }));
    }
    const chCards = qualityCardsByCh.get(chId) ?? [];
    if (chCards.length === 0) return null; // 无 entities＝未检，不装 0 假数
    return scoreChapter(chCards, qualityTextByCh.get(chId) ?? {});
  }
  const bookQuality: Record<string, CiteQuality | null> = {};
  for (const b of books) {
    const qs = b.chapterIds.map((chId) => chapterCheck(chId)).filter((q): q is CiteQuality => q != null);
    if (qs.length === 0) {
      bookQuality[b.id] = null;
      continue;
    }
    const folded = qs.reduce<CiteQuality>(
      (acc, q) => {
        acc.cards += q.cards;
        acc.atoms += q.atoms;
        acc.cites += q.cites;
        acc.nullPage += q.nullPage;
        acc.ocrMiss += q.ocrMiss;
        acc.zeroAtomCards += q.zeroAtomCards;
        acc.emptyPromptAtoms += q.emptyPromptAtoms;
        acc.emptyAnswerAtoms += q.emptyAnswerAtoms;
        acc.incompleteAtoms += q.incompleteAtoms;
        return acc;
      },
      {
        cards: 0, atoms: 0, cites: 0, nullPage: 0, ocrMiss: 0, zeroAtomCards: 0,
        missRate: 0, emptyPromptAtoms: 0, emptyAnswerAtoms: 0, incompleteAtoms: 0,
      },
    );
    folded.missRate = folded.cites > 0 ? folded.ocrMiss / folded.cites : 0;
    bookQuality[b.id] = folded;
  }

  /**
   * T56 G/I：书级 parse 覆盖徽装配——各章 loadParseCoverage（与 pnpm parse-check 同真；
   * 缺 blocks 章＝未检，不装完美覆盖）；任章 weak → 书级琥珀徽（空/稀书级合计）。
   * 与 T55 cite 质量徽**分列**（两枚徽、两行口径），不合并不改写。
   */
  const bookParse: Record<string, { weak: boolean; empty: number; sparse: number; unchecked: number }> = {};
  for (const b of books) {
    let weak = false;
    let empty = 0;
    let sparse = 0;
    let unchecked = 0;
    for (const chId of b.chapterIds) {
      const cov = loadParseCoverage(chId);
      if (cov == null) {
        unchecked++;
        continue;
      }
      if (cov.weak) weak = true;
      empty += cov.emptyPages;
      sparse += cov.sparsePages;
    }
    bookParse[b.id] = { weak, empty, sparse, unchecked };
  }

  /**
   * T57 G/I：书级抽出页覆盖徽装配——各章 loadExtractPageCoverage（与 pnpm page-check
   * 同真；缺 blocks/entities 章＝未检，不装 darkCount=0 完美）；任章 weak → 书级琥珀
   * 徽（暗页书级合计，darkRate 按合计重算）。与 T55 cite 质量徽 / T56 parse 覆盖徽
   * **三分列**（三枚徽、三行口径，不合并不改写——暗页是抽出后「实质页未成原子」
   * 信号，与 OCR 空稀、cite↔OCR 比对互斥不伪装）。
   */
  const bookExtractPage: Record<
    string,
    { weak: boolean; dark: number; darkRate: number; unchecked: number }
  > = {};
  for (const b of books) {
    let weak = false;
    let dark = 0;
    let substantial = 0;
    let unchecked = 0;
    for (const chId of b.chapterIds) {
      const cov = loadExtractPageCoverage(chId);
      if (cov == null) {
        unchecked++;
        continue;
      }
      if (cov.weak) weak = true;
      dark += cov.darkCount;
      substantial += cov.substantialPages;
    }
    bookExtractPage[b.id] = {
      weak,
      dark,
      darkRate: substantial > 0 ? dark / substantial : 0,
      unchecked,
    };
  }

  /**
   * T59 G/I：书级抽出密度折叠——各章 loadExtractPageDensity（与 pnpm density-check
   * 同真；缺 blocks/entities 章＝未检，不装 shallowCount=0 完美）。任章 weak → 书级
   * 浅信号（浅页书级合计，shallowRate 按合计重算）**旁挂**在 T57「抽出偏稀」行——
   * 不拆 cite|parse|暗 三分列骨架、不造第四大红独立列；浅 ≠ 暗（浅 = 已 cite 页原子
   * 极稀，暗 = 零 cite），两概念在同一点名行分列不合并。
   */
  const bookDensity: Record<
    string,
    { weak: boolean; shallow: number; shallowRate: number; unchecked: number }
  > = {};
  for (const b of books) {
    let weak = false;
    let shallow = 0;
    let substantial = 0;
    let unchecked = 0;
    for (const chId of b.chapterIds) {
      const den = loadExtractPageDensity(chId);
      if (den == null) {
        unchecked++;
        continue;
      }
      if (den.weak) weak = true;
      shallow += den.shallowCount;
      substantial += den.substantialPages;
    }
    bookDensity[b.id] = {
      weak,
      shallow,
      shallowRate: substantial > 0 ? shallow / substantial : 0,
      unchecked,
    };
  }

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
          T31 C：传 validPages——旧栈幽灵页读侧消毒（脏时单条 heal）。
          T50 E：传 poolsByBook——学习环/核页空池门禁（有 last.page 用页级否则书级；fail-closed）。 */}
      <LibraryContinuity
        books={books.map((b) => ({ id: b.id, title: b.title }))}
        bookValidPages={bookValidPages}
        poolsByBook={poolsByBook}
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
                  <ShelfBookContinuity
                    bookId={b.id}
                    validPages={bookValidPages[b.id]}
                    pageAtomByPage={poolsByBook[b.id].pageAtomByPage}
                    pagePendingByPage={poolsByBook[b.id].pagePendingByPage}
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
              {/* T55 H：书级质量徽——弱书（OCR未见 / 零原子卡 / 不完备原子 任一 >0）琥珀
                  点名（只列 >0 项），好书不吵；次级 /ingest 去补救（miss 样例 / 重抽命令在
                  物料面板）。非掌握% / 非 Due 角标 / 无圆环；未检（无 entities）不出徽。 */}
              {(() => {
                const q = bookQuality[b.id];
                if (q == null) return null;
                if (q.ocrMiss === 0 && q.zeroAtomCards === 0 && q.incompleteAtoms === 0) return null;
                const parts: string[] = [];
                if (q.ocrMiss > 0) parts.push(`OCR未见 ${q.ocrMiss}`);
                if (q.zeroAtomCards > 0) parts.push(`零原子卡 ${q.zeroAtomCards}`);
                if (q.incompleteAtoms > 0) parts.push(`空原子字段 ${q.incompleteAtoms}`);
                return (
                  <p className="mt-3 flex flex-wrap items-baseline gap-2 text-xs leading-6 text-status-warn">
                    <span className="rounded border border-amber-300 bg-status-warn-bg px-2 py-0.5">
                      质量偏弱 · {parts.join(" · ")}
                    </span>
                    <Link href="/ingest" className="text-muted no-underline hover:text-cinnabar">
                      去补救 →
                    </Link>
                  </p>
                );
              })()}
              {/* T56 G：书级 parse 覆盖徽——与上方 T55 cite 质量徽**分列**（独立一行、独立口径：
                  空页/稀页是 OCR 阶段信号，OCR未见是 cite↔OCR 比对信号）。任章 weak 才出，
                  好书/未检不吵；次级 /ingest 补扫；无掌握% / Due / 圆环。 */}
              {(() => {
                const bp = bookParse[b.id];
                if (!bp || !bp.weak) return null;
                return (
                  <p className="mt-2 flex flex-wrap items-baseline gap-2 text-xs leading-6 text-status-warn">
                    <span className="rounded border border-amber-300 bg-status-warn-bg px-2 py-0.5">
                      OCR覆盖偏弱
                      {bp.empty > 0 ? ` · 空 ${bp.empty}` : ""}
                      {bp.sparse > 0 ? ` · 稀 ${bp.sparse}` : ""}
                    </span>
                    <Link href="/ingest" className="text-muted no-underline hover:text-cinnabar">
                      去补扫 →
                    </Link>
                  </p>
                );
              })()}
              {/* T57 G：书级抽出页覆盖徽——第三枚，与 T55 cite / T56 parse 徽三分列（独立
                  一行、独立口径：暗页 = 实质 OCR 页 chars≥40 零 cite，抽出后未成原子）。
                  任章 weak 才出（D=书级合计）；好书/未检不吵；次级 /ingest 重抽；
                  无掌握% / Due / 圆环；不自动发明 cite 填暗页。
                  T59 G：浅信号**旁挂**本行（暗与浅同点名行分列；书级 shallowCount 合计，
                  loadExtractPageDensity 与 pnpm density-check 同真）——只任暗或任浅才出，
                  好书静音；缺 cards/blocks 章＝未检不抬假阳；仍不拆 cite|parse|暗 三分列
                  骨架、不造第四大红独立列。 */}
              {(() => {
                const be = bookExtractPage[b.id];
                const bd = bookDensity[b.id];
                if ((!be || !be.weak) && (!bd || !bd.weak)) return null;
                return (
                  <p className="mt-2 flex flex-wrap items-baseline gap-2 text-xs leading-6 text-status-warn">
                    <span className="rounded border border-amber-300 bg-status-warn-bg px-2 py-0.5">
                      抽出偏稀
                      {be && be.dark > 0
                        ? ` · 暗${be.dark}（darkRate ${(be.darkRate * 100).toFixed(0)}%）`
                        : ""}
                      {bd && bd.shallow > 0
                        ? ` · 浅${bd.shallow}（shallowRate ${(bd.shallowRate * 100).toFixed(0)}%）`
                        : ""}
                    </span>
                    <Link href="/ingest" className="text-muted no-underline hover:text-cinnabar">
                      去重抽 →
                    </Link>
                  </p>
                );
              })()}
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
                  validPages={bookValidPages[b.id]}
                  title={b.title}
                  atomCount={poolsByBook[b.id].atomCount}
                  pendingCount={poolsByBook[b.id].pendingCount}
                  pageAtomByPage={poolsByBook[b.id].pageAtomByPage}
                  pagePendingByPage={poolsByBook[b.id].pagePendingByPage}
                />
              </p>
            </li>
          );
        })}
      </ul>

      {/* T24 C：书库效用区「本机进度带走」——导出/导入 study+heye JSON（纯客户端，非云同步）。 */}
      <ProgressPortability />

      {/* T62 I：书库效用区「本机草稿收件箱」——多卡草稿 + 统一补丁包 + 人核落盘清单 + 草稿单独带走。
          Server 只读 loadCards 下传 slim 索引与 seed 口径 incomplete 摘要（T55 同口径）；
          Client 读 ariadne.atom-draft.v1，只对有草稿的卡按需只读 GET /api/entities/<id> 组包。
          与 ProgressPortability 分列：draft-port ≠ progress-port，草稿永不并进 study/heye 包。 */}
      <DraftInbox cardIndex={draftCardIndex} incompleteCardSummaries={incompleteCardSummaries} />

      <p className="mt-10 text-sm text-muted">
        导入新书：<Link href="/ingest" className="text-cinnabar no-underline hover:underline underline-offset-4">/ingest 上传 PDF</Link>
      </p>
    </div>
  );
}