import Link from "next/link";
import { Suspense } from "react";
import { loadAllChapterPages } from "@/lib/entities";

/**
 * citation 跳页的落点：展示该印刷页的 OCR 原文（main 栏阅读序），
 * 高亮 ?q= 传入的引文片段。Nuradil 也可按 physicalPage 在 PDF 里核对。
 *
 * 印刷页索引合并自 data/chapters/*.blocks.json（各章 page = 物理页 − pageOffset），
 * 勿写死单一章节，否则 ch03+ 的 cite（如 p.64）会报「本章范围 1–18」。
 */
export default function ViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 flex-1">
      <Link href="/entities" className="text-sm text-muted no-underline hover:text-cinnabar">
        ← 全部实体卡
      </Link>
      <Suspense fallback={<p className="mt-8 text-muted">加载中…</p>}>
        <ViewerBody params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ViewerBody({
  params,
  searchParams,
}: {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { page } = await params;
  const { q } = await searchParams;
  const pageNo = Number(page);
  const pages = loadAllChapterPages();
  const pg = pages.find((p) => p.page === pageNo);
  if (!pg) {
    const nums = pages.map((p) => p.page).filter((n): n is number => n != null);
    const range =
      nums.length > 0
        ? `${Math.min(...nums)} – ${Math.max(...nums)}`
        : "（无已收录页）";
    return (
      <p className="mt-8 text-status-warn">
        未找到印刷页 p.{page}（已收录范围 {range}）。
      </p>
    );
  }

  const prev = pages.find((p) => p.page === pageNo - 1);
  const next = pages.find((p) => p.page === pageNo + 1);

  return (
    <>
      <header className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">
          印刷页 p.{pg.page}
          <span className="ml-3 text-sm font-normal text-muted">
            PDF 物理页 {pg.physicalPage}
            {pg.chapterId ? ` · ${pg.chapterId}` : ""}
          </span>
        </h1>
        <nav className="flex gap-3 text-sm">
          {prev ? (
            <Link href={`/viewer/${prev.page}`} className="text-muted no-underline hover:text-cinnabar">
              ← p.{prev.page}
            </Link>
          ) : null}
          {next ? (
            <Link href={`/viewer/${next.page}`} className="text-muted no-underline hover:text-cinnabar">
              p.{next.page} →
            </Link>
          ) : null}
        </nav>
      </header>

      {q ? (
        <p className="mt-4 rounded border border-amber-300 bg-status-warn-bg p-3 text-sm text-status-warn">
          定位引文：<span className="font-semibold">“{q}”</span>（若下方原文未高亮，可能引文跨页或经 OCR 订正）
        </p>
      ) : null}

      <article className="mt-6 whitespace-pre-wrap rounded-lg border border-line bg-card p-8 text-[15px] leading-9">
        {highlight(pg.text, q)}
      </article>
    </>
  );
}

function highlight(text: string, q?: string): React.ReactNode {
  if (!q) return text;
  const i = text.indexOf(q.slice(0, 8));
  if (i < 0) return text;
  const head = text.slice(0, i);
  const hit = text.slice(i, i + q.length + 6);
  const tail = text.slice(i + q.length + 6);
  return (
    <>
      {head}
      <mark className="rounded bg-status-warn-bg px-0.5">{hit}</mark>
      {tail}
    </>
  );
}
