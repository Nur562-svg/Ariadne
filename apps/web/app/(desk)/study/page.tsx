import Link from "next/link";
import { Suspense } from "react";
import { collectStudyAtoms, loadBooks, loadChapters } from "@/lib/entities";
import type { StudyMode } from "@/lib/study";
import StudySession from "@/components/StudySession";
import StudyScopeCounts from "@/components/StudyScopeCounts";

export const dynamic = "force-dynamic";

const DIFF_ZH = { what: "识记", why: "机制", case: "应用" } as const;

const MODES: [StudyMode, string][] = [
  ["all", "全部"],
  ["ungraded", "未评"],
  ["unknown", "不熟再练"],
];

/**
 * /study 学习 · 本机自评（desk-study-01，DeskShell 内）。
 * 这里不做 FSRS 到期调度：队列是「全部｜未评｜不熟再练」的本机态过滤，
 * 评分只写浏览器 localStorage（ariadne.study.v1），跨刷新保留，绝不回写 seed。
 */
export default function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; chapter?: string; mode?: string }>;
}) {
  const chapters = loadChapters();
  const books = loadBooks();
  return (
    <Suspense fallback={<p className="px-8 py-10 text-muted">加载中…</p>}>
      <StudyBody searchParams={searchParams} chapters={chapters} books={books} />
    </Suspense>
  );
}

async function StudyBody({
  searchParams,
  chapters,
  books,
}: {
  searchParams: Promise<{ book?: string; chapter?: string; mode?: string }>;
  chapters: ReturnType<typeof loadChapters>;
  books: ReturnType<typeof loadBooks>;
}) {
  const { book: bookId, chapter: chapterId, mode: modeParam } = await searchParams;
  const activeBook = bookId ? books.find((b) => b.id === bookId) : undefined;
  const activeChapter = chapterId ? chapters.find((c) => c.id === chapterId) : undefined;
  const invalidBook = bookId != null && !activeBook;
  const mode: StudyMode =
    modeParam === "ungraded" || modeParam === "unknown" ? modeParam : "all";

  /** ?book= 时章芯片只显示该书 chapterIds（T07 行为）。 */
  const chipChapters = activeBook
    ? chapters.filter((c) => activeBook.chapterIds.includes(c.id))
    : chapters;

  const atoms = collectStudyAtoms({ bookId: activeBook?.id, chapterId: activeChapter?.id });

  /** 章 → 书反查：无 ?book= 时也能让 CiteChip 深链回对应书的书桌章页。 */
  const bookByChapter: Record<string, string> = {};
  for (const b of books) for (const ch of b.chapterIds) bookByChapter[ch] = b.id;

  const qs = (opts?: { chapter?: string | null; mode?: StudyMode }) => {
    const p = new URLSearchParams();
    if (activeBook) p.set("book", activeBook.id);
    const ch = opts?.chapter === undefined ? activeChapter?.id : opts.chapter ?? undefined;
    if (ch) p.set("chapter", ch);
    const m = opts?.mode ?? mode;
    if (m !== "all") p.set("mode", m);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  const scopeLabel = activeChapter?.title ?? activeBook?.title ?? "全部已注册书目";
  const deskHref = activeBook ? `/desk?book=${activeBook.id}` : "/desk";
  const reviewHref = activeBook ? `/review?book=${activeBook.id}` : "/review";

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <header>
        <h1 className="brand-rule pb-2 text-3xl font-bold">学习 · 本机自评</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {scopeLabel} · 看问题 → 回想 → 自评「认识 / 不熟」。FSRS 到期调度未接入，这里不做到期复习；
          进度只保存在这个浏览器（localStorage），跨刷新保留。
        </p>
        {invalidBook ? (
          <p className="mt-2 text-sm text-status-warn">
            书库中没有 book id「{bookId}」——已按全部已注册书目出题。可从书架打开正确书目。
          </p>
        ) : null}
        <StudyScopeCounts atoms={atoms} />
      </header>

      {/* 章过滤（config 派生；有书时以上下文书为准；保留当前队列档） */}
      {chipChapters.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href={`/study${qs({ chapter: null })}`}
            className={`rounded-full border px-3 py-1 text-sm no-underline ${
              !activeChapter
                ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                : "border-line text-muted hover:text-foreground"
            }`}
          >
            全部章节
          </Link>
          {chipChapters.map((c) => (
            <Link
              key={c.id}
              href={`/study${qs({ chapter: c.id })}`}
              className={`rounded-full border px-3 py-1 text-sm no-underline ${
                activeChapter?.id === c.id
                  ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                  : "border-line text-muted hover:text-foreground"
              }`}
            >
              {c.id}
            </Link>
          ))}
        </div>
      ) : null}

      {/* 队列三档：全部 | 未评 | 不熟再练（本机态过滤，非 FSRS）。
          分段控件留呼吸感：段间 gap + 段内横向 padding，inactive 不贴 active 朱红 pill。 */}
      <div
        role="tablist"
        aria-label="练习队列"
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line bg-card p-1.5"
      >
        {MODES.map(([m, label]) => (
          <Link
            key={m}
            role="tab"
            aria-selected={mode === m}
            href={`/study${qs({ mode: m })}`}
            className={`rounded-md px-5 py-1.5 text-sm no-underline transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
              mode === m ? "bg-cinnabar text-white" : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">{atoms.length} 个知识原子</p>

      {atoms.length === 0 ? (
        <div className="mt-8">
          <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
            这个范围还没有知识原子。先到{" "}
            <Link className="text-cinnabar underline underline-offset-4" href="/ingest">
              /ingest
            </Link>{" "}
            上传并解析教材，或换一个章过滤。
          </p>
          <div className="mt-6">
            <Link
              href={deskHref}
              className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
            >
              回书桌 →
            </Link>
          </div>
        </div>
      ) : (
        <StudySession
          key={`${activeBook?.id ?? "all"}:${activeChapter?.id ?? "all"}:${mode}`}
          atoms={atoms}
          scopeLabel={scopeLabel}
          diffLabel={DIFF_ZH}
          mode={mode}
          activeBookId={activeBook?.id}
          bookByChapter={bookByChapter}
          deskHref={deskHref}
          reviewHref={reviewHref}
          allHref={`/study${qs({ mode: "all" })}`}
          unknownHref={`/study${qs({ mode: "unknown" })}`}
        />
      )}
    </div>
  );
}
