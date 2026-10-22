import Link from "next/link";
import { Suspense } from "react";
import { loadCards, loadChapters, loadBooks } from "@/lib/entities";
import EntitySearch from "@/components/EntitySearch";

/** T45 D：KINDS 补 pathogen——KIND_ZH 既有「病原」，kind 芯片不再漏这一档（免疫学 seed 有病原卡）。 */
const KINDS = ["全部", "concept", "structure", "process", "molecule", "pathogen", "cell", "disease"] as const;

const KIND_ZH: Record<string, string> = {
  concept: "概念",
  structure: "结构",
  process: "过程",
  molecule: "分子",
  pathogen: "病原",
  cell: "细胞",
  disease: "疾病",
};

export const dynamic = "force-dynamic";

export default function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; book?: string; chapter?: string }>;
}) {
  const chapters = loadChapters();
  const books = loadBooks();
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Suspense
        fallback={<p className="mt-8 text-muted">加载中…</p>}
        key={JSON.stringify(chapters)}
      >
        <EntityList searchParams={searchParams} chapters={chapters} books={books} />
      </Suspense>
    </main>
  );
}

async function EntityList({
  searchParams,
  chapters,
  books,
}: {
  searchParams: Promise<{ kind?: string; book?: string; chapter?: string }>;
  chapters: ReturnType<typeof loadChapters>;
  books: ReturnType<typeof loadBooks>;
}) {
  const { kind, book: bookId, chapter: chapterId } = await searchParams;

  const activeBook = bookId ? books.find((b) => b.id === bookId) : undefined;
  const activeChapter = chapterId ? chapters.find((c) => c.id === chapterId) : undefined;
  /** ?book= 时章芯片只显示该书 chapterIds，避免混入其它书的章。 */
  const chipChapters = activeBook
    ? chapters.filter((c) => activeBook.chapterIds.includes(c.id))
    : chapters;

  const all = loadCards({ bookId: activeBook?.id, chapterId: activeChapter?.id });
  const cards = !kind || kind === "全部" ? all : all.filter((c) => c.kind === kind);

  /**
   * T31 E：列表卡 → 书桌反查（chapterId ∈ book.chapterIds，与 T30 B / desk 卡页同口径）——
   * 已注册章的卡传 deskBookId，瓷砖给次级「书桌打开 →」/desk/card/<id>；未注册章保持纯 shell。
   */
  const bookByChapter: Record<string, string> = {};
  for (const b of books) for (const ch of b.chapterIds) bookByChapter[ch] = b.id;
  const deskBookIds: Record<string, string> = {};
  for (const c of cards) {
    const bid = c.chapterId ? bookByChapter[c.chapterId] : undefined;
    if (bid) deskBookIds[c.id] = bid;
  }

  /** 保留当前 book/chapter 过滤：book 恒保留；chapter 用 null 显式清除，默认继承当前。 */
  const qs = (opts?: { chapter?: string | null; kind?: string }) => {
    const p = new URLSearchParams();
    if (activeBook) p.set("book", activeBook.id);
    const ch = opts?.chapter === undefined ? activeChapter?.id : opts.chapter ?? undefined;
    if (ch) p.set("chapter", ch);
    if (opts?.kind) p.set("kind", opts.kind);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  const heading = activeChapter?.title ?? activeBook?.title ?? "实体卡";
  const sub =
    activeChapter || activeBook
      ? activeBook
        ? `${activeBook.title}${activeChapter ? ` · ${activeChapter.title}` : ""}`
        : undefined
      : "全部已注册书目";

  return (
    <>
      <h1 className="brand-rule pb-2 text-3xl font-bold">{heading}</h1>
      <p className="mt-2 text-sm text-muted">{sub}</p>

      {/* 章过滤（config/chapter.json 派生） */}
      {chipChapters.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            key="all"
            href={`/entities${qs({ chapter: null })}`}
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
              href={`/entities${qs({ chapter: c.id })}`}
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

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">{cards.length} 张</span>
        {KINDS.map((k) => (
          <Link
            key={k}
            href={`/entities${qs(k === "全部" ? undefined : { kind: k })}`}
            className={`rounded-full border px-3 py-1 text-sm no-underline ${
              (k === "全部" && !kind) || k === kind
                ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                : "border-line text-muted hover:text-foreground"
            }`}
          >
            {k === "全部" ? "全部" : `${KIND_ZH[k] ?? k} ${k}`}
          </Link>
        ))}
      </div>

      <EntitySearch cards={cards} kindLabel={KIND_ZH} activeKind={kind} deskBookIds={deskBookIds} />
    </>
  );
}