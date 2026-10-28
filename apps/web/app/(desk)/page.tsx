import Link from "next/link";
import { loadBooks } from "@/lib/entities";
import { buildLibraryShelfData } from "@/lib/library-shelf-data";
import LibraryContinuity from "@/components/LibraryContinuity";
import ProgressPortability from "@/components/ProgressPortability";
import DraftInbox from "@/components/DraftInbox";
import ChapterQualityCockpit from "@/components/ChapterQualityCockpit";
import ShelfBookCard from "@/components/ShelfBookCard";

/**
 * 书库页（书架）：DeskShell 中栏，从 config/books.json 派生，不硬编码任何书名/章节 copy。
 * 空库 → 指向 /ingest 的安静 empty-state，不是营销 hero。
 *
 * T97 desk-library-shelf-split-01：服务端装配（T31 validPages · T50 pools · T62 draft 索引 ·
 * T63 rollup · T55–T59 四信号折叠）→ lib/library-shelf-data；单书卡 → ShelfBookCard；
 * 三行信号徽 → ShelfBookSignalBadges。本文件只留 imports · dynamic · 装配调用 · 空库分支 ·
 * Continuity · map → Card · 效用区 · 底注；default export 与 force-dynamic 守恒。
 */
export const dynamic = "force-dynamic";

export default function Library() {
  const books = loadBooks();
  /**
   * T97：书架装配单点——与 tip 同序在空库分支之前调用；折叠算法与未检 null 口径逐字在
   * lib/library-shelf-data，本页不另算、不发明第二套池。
   */
  const {
    bookValidPages,
    poolsByBook,
    draftCardIndex,
    chapterTitles,
    rollupByChapter,
    incompleteCardSummaries,
    bookQuality,
    bookParse,
    bookExtractPage,
    bookDensity,
  } = buildLibraryShelfData(books);

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
        {books.map((b) => (
          <ShelfBookCard
            key={b.id}
            book={b}
            validPages={bookValidPages[b.id]}
            pools={poolsByBook[b.id]}
            quality={bookQuality[b.id]}
            parseCoverage={bookParse[b.id]}
            extractPage={bookExtractPage[b.id]}
            density={bookDensity[b.id]}
          />
        ))}
      </ul>

      {/* T24 C：书库效用区「本机进度带走」——导出/导入 study+heye JSON（纯客户端，非云同步）。 */}
      <ProgressPortability />

      {/* T62 I：书库效用区「本机草稿收件箱」——多卡草稿 + 统一补丁包 + 人核落盘清单 + 草稿单独带走。
          Server 只读 loadCards 下传 slim 索引与 seed 口径 incomplete 摘要（T55 同口径）；
          Client 读 ariadne.atom-draft.v1，只对有草稿的卡按需只读 GET /api/entities/<id> 组包。
          与 ProgressPortability 分列：draft-port ≠ progress-port，草稿永不并进 study/heye 包。 */}
      <DraftInbox incompleteCardSummaries={incompleteCardSummaries} />

      {/* T63 E/I：书库效用区「章质检驾驶舱」——一章一眼并读六信号（cite 未见 / parse 空·稀 /
          暗 / 浅 / 不完备 / 草稿），深链既有补救面（卡详 / viewer / 可复制 CLI）。
          consume-only：Server 只拼装既有算法返回值；cockpit ≠ seed 已核、机检 ≠ verified、
          草稿 ≠ 已写回、data/qa 报告 ≠ 真源；与 ProgressPortability / DraftInbox 分列，
          不塞书架 cite|parse|暗 三分列、不造第四书架徽列、无单一健康分。 */}
      <ChapterQualityCockpit
        books={books.map((b) => ({ id: b.id, title: b.title, chapterIds: b.chapterIds }))}
        chapterTitles={chapterTitles}
        rollupByChapter={rollupByChapter}
        cardIndex={draftCardIndex}
      />

      <p className="mt-10 text-sm text-muted">
        导入新书：<Link href="/ingest" className="text-cinnabar no-underline hover:underline underline-offset-4">/ingest 上传 PDF</Link>
      </p>
    </div>
  );
}
