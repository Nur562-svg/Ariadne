import Link from "next/link";
import { Suspense } from "react";
import { collectStudyAtoms, loadBooks, loadChapters } from "@/lib/entities";
import StudySession from "@/components/StudySession";

export const dynamic = "force-dynamic";

const DIFF_ZH = { what: "识记", why: "机制", case: "应用" } as const;

export default function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; chapter?: string }>;
}) {
  const chapters = loadChapters();
  const books = loadBooks();
  return (
    <Suspense fallback={<p className="mt-8 text-muted">加载中…</p>}>
      <StudyBody searchParams={searchParams} chapters={chapters} books={books} />
    </Suspense>
  );
}

async function StudyBody({
  searchParams,
  chapters,
  books,
}: {
  searchParams: Promise<{ book?: string; chapter?: string }>;
  chapters: ReturnType<typeof loadChapters>;
  books: ReturnType<typeof loadBooks>;
}) {
  const { book: bookId, chapter: chapterId } = await searchParams;
  const activeBook = bookId ? books.find((b) => b.id === bookId) : undefined;
  const activeChapter = chapterId ? chapters.find((c) => c.id === chapterId) : undefined;
  /** ?book= 时章芯片只显示该书 chapterIds。 */
  const chipChapters = activeBook
    ? chapters.filter((c) => activeBook.chapterIds.includes(c.id))
    : chapters;

  const atoms = collectStudyAtoms({ bookId: activeBook?.id, chapterId: activeChapter?.id });

  const qs = (opts?: { chapter?: string | null }) => {
    const p = new URLSearchParams();
    if (activeBook) p.set("book", activeBook.id);
    const ch = opts?.chapter === undefined ? activeChapter?.id : opts.chapter ?? undefined;
    if (ch) p.set("chapter", ch);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  const scopeLabel = activeChapter?.title ?? activeBook?.title ?? "全部已注册书目";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="brand-rule pb-2 text-3xl font-bold">学习</h1>
      <p className="mt-2 text-sm text-muted">
        {scopeLabel} · 看问题 → 回想 → 自评「认识 / 不熟」。进度保存在本浏览器（localStorage），跨刷新保留。
      </p>

      {/* 章过滤（config 派生；有书时以上下文书为准） */}
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

      <p className="mt-6 text-sm text-muted">{atoms.length} 个知识原子</p>

      {atoms.length === 0 ? (
        <p className="mt-8 border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
          这个范围还没有知识原子。先到 <Link className="text-cinnabar underline underline-offset-4" href="/ingest">/ingest</Link> 上传并解析教材，或换一个章过滤。
        </p>
      ) : (
        <StudySession
          key={`${activeBook?.id ?? "all"}:${activeChapter?.id ?? "all"}`}
          atoms={atoms}
          scopeLabel={scopeLabel}
          diffLabel={DIFF_ZH}
        />
      )}
    </main>
  );
}