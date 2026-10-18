import Link from "next/link";
import { loadBooks, loadCards } from "@/lib/entities";

export const dynamic = "force-dynamic";

const KIND_ZH: Record<string, string> = {
  concept: "概念",
  structure: "结构",
  process: "过程",
  molecule: "分子",
  pathogen: "病原",
  cell: "细胞",
  disease: "疾病",
};

/** 六段讲义 TOC：静态结构占位（当前高亮为假状态），生成管线未接入，禁止编造正文。 */
const SECTIONS = ["概览", "实体图谱", "机制串讲", "易混对照", "应用与病例", "自测"] as const;

/**
 * 书桌（desk-v4 中栏 interim document）：
 * 该书实体卡列表（真 seed）+ 六段 TOC 占位；点卡进 /desk/card/[id] 详情。
 */
export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string }>;
}) {
  const { book: bookId } = await searchParams;
  const books = loadBooks();
  const book = books.find((b) => b.id === bookId) ?? books[0];
  /** 请求了不存在的 book id → 回落第一本书，并诚实提示。 */
  const invalidBook = bookId != null && !books.some((b) => b.id === bookId);

  if (!book) {
    return (
      <div className="mx-auto w-full max-w-2xl px-8 py-16">
        <h1 className="brand-rule pb-2 text-3xl font-bold">书桌</h1>
        <p className="mt-6 leading-8 text-foreground/90">
          书库还空着：先上传并解析教材、注册书目，书桌才有可读的讲义与实体卡。
        </p>
        <Link
          href="/ingest"
          className="mt-8 inline-block rounded-md bg-cinnabar px-5 py-2.5 text-white no-underline"
        >
          去导入教材 →
        </Link>
      </div>
    );
  }

  const cards = loadCards({ bookId: book.id });
  const atoms = cards.reduce((n, c) => n + c.atoms.length, 0);

  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-10">
      <header>
        <h1 className="brand-rule pb-2 text-3xl font-bold">{book.title}</h1>
        {invalidBook ? (
          <p className="mt-2 text-sm text-status-warn">
            书库中没有 book id「{bookId}」——已回落到第一本书。可从书架打开正确书目。
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted">
          {book.chapterIds.length} 章 · {cards.length} 张实体卡 · {atoms} 个知识原子
        </p>
        <p className="mt-1 text-sm text-muted">
          六段讲义生成管线未接入——当前以实体卡作为过渡文档（interim document）。
        </p>
      </header>

      {/* 六段 SectionTOC：静态占位，无假正文 */}
      <nav aria-label="讲义目录（占位）" className="mt-6 rounded-xl border border-line bg-card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">六段讲义</h2>
          <span className="text-xs text-muted">占位 · 待生成管线</span>
        </div>
        <ol className="mt-3 flex flex-wrap gap-2">
          {SECTIONS.map((s, i) => (
            <li
              key={s}
              aria-current={i === 0 ? "step" : undefined}
              className={`rounded-full border px-3 py-1 text-sm ${
                i === 0
                  ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                  : "border-line text-muted"
              }`}
            >
              {i + 1} {s}
            </li>
          ))}
        </ol>
      </nav>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-muted">实体卡（过渡文档）</h2>
        {cards.length === 0 ? (
          <p className="mt-4 border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
            这本书还没有抽取出的实体卡。到{" "}
            <Link className="text-cinnabar underline underline-offset-4" href="/ingest">
              /ingest
            </Link>{" "}
            完成解析与抽取。
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {cards.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/desk/card/${c.id}`}
                  className="block h-full rounded-lg border border-line bg-card p-5 no-underline transition-shadow hover:shadow-md"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{c.name_zh}</h3>
                    <span className="mono shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
                      {KIND_ZH[c.kind] ?? c.kind}
                    </span>
                  </div>
                  {c.name_en && <p className="mono mt-0.5 text-xs text-muted">{c.name_en}</p>}
                  <p className="mt-3 text-sm leading-6 text-foreground/85">{c.one_liner}</p>
                  <p className="mt-3 text-xs text-muted">
                    {c.atoms.length} 个原子 · {c.chapterId ?? ""} · 引自 p.
                    {[...new Set(c.cites.filter((x) => x.page != null).map((x) => x.page))].join(
                      ", p.",
                    )}
                    {c.cites.some((x) => x.page == null) ? " · 部分未验证 p.?" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
