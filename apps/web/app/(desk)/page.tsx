import Link from "next/link";
import { loadBooks, loadCards } from "@/lib/entities";

/**
 * 书库页（书架）：DeskShell 中栏，从 config/books.json 派生，不硬编码任何书名/章节 copy。
 * 空库 → 指向 /ingest 的安静 empty-state，不是营销 hero。
 */
export const dynamic = "force-dynamic";

export default function Library() {
  const books = loadBooks();

  if (books.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-8 py-10">
        <h1 className="brand-rule pb-2 text-4xl font-bold tracking-wide">书库</h1>
        <p className="mt-6 leading-8 text-foreground/90">
          书库还空着。上传教材 PDF、在本机跑完 OCR 解析与实体卡抽取，再把书目注册进
          <span className="mono text-sm"> config/books.json </span>，即可在书桌阅读、进入卡浏览器与学习环。
        </p>
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

      <ul className="mt-10 space-y-4">
        {books.map((b) => {
          const cards = loadCards({ bookId: b.id });
          const atoms = cards.reduce((n, c) => n + c.atoms.length, 0);
          const deskHref = `/desk?book=${encodeURIComponent(b.id)}`;
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
                <Link
                  href={deskHref}
                  className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline"
                >
                  打开书桌 →
                </Link>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-4 text-center sm:max-w-md">
                {[
                  ["章节", b.chapterIds.length],
                  ["实体卡", cards.length],
                  ["知识原子", atoms],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="mt-0.5 text-lg font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs leading-6 text-muted">章 {b.chapterIds.join(" · ")}</p>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
                <Link
                  href={`/entities?book=${encodeURIComponent(b.id)}`}
                  className="text-muted no-underline hover:text-cinnabar"
                >
                  卡浏览器 →
                </Link>
                <Link
                  href={`/study?book=${encodeURIComponent(b.id)}`}
                  className="text-muted no-underline hover:text-cinnabar"
                >
                  学习环 →
                </Link>
                <Link
                  href={`/review?book=${encodeURIComponent(b.id)}`}
                  className="text-muted no-underline hover:text-cinnabar"
                >
                  核页 →
                </Link>
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 text-sm text-muted">
        导入新书：<Link href="/ingest" className="text-cinnabar no-underline hover:underline underline-offset-4">/ingest 上传 PDF</Link>
      </p>
    </div>
  );
}