import Link from "next/link";
import { loadAllChapterPages, loadBooks, loadCard } from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import HeYeSession from "@/components/HeYeSession";

export const dynamic = "force-dynamic";

/**
 * /review 核页 · 本机对页（desk-heye-01）。
 * 这里不做 FSRS 到期调度：队列是「有页码但 seed 未抽查 verified」的 cite，
 * 「本机已对 / 存疑」只写浏览器 localStorage，绝不回写 seed JSON。
 * ?book= 过滤范围；无参 = 全部已解析卡（核页是数据质量工具，范围宁宽）。
 * desk-card-hub-01：支持 ?card= 收窄到单卡（卡枢纽「核本卡 cite」入口）；
 * 空/完成态链「回本卡」「去学习本卡」。
 */
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; card?: string }>;
}) {
  const { book: bookId, card: cardId } = await searchParams;
  const books = loadBooks();
  const book = books.find((b) => b.id === bookId);
  const invalidBook = bookId != null && !book;
  const card = cardId != null ? loadCard(cardId) : undefined;
  const invalidCard = cardId != null && !card;

  const items = card
    ? collectCiteQueue({ cardId: card.id, bookId: book?.id })
    : collectCiteQueue(book ? { bookId: book.id } : undefined);
  // OCR 只传队列涉及的页（loadAllChapterPages 真页子集），避免全量 OCR 进客户端。
  const wanted = new Set(items.map((it) => it.page));
  const pages = loadAllChapterPages().filter((p) => p.page != null && wanted.has(p.page));

  /** 卡所在书（章反查，可被 ?book= 覆盖）：范围文案与回书桌深链。 */
  const cardBook =
    card?.chapterId != null
      ? books.find((b) => b.chapterIds.includes(card.chapterId as string))
      : undefined;
  const scopeBook = book ?? cardBook;

  const scopeLabel = card
    ? `卡《${card.name_zh}》${scopeBook ? ` · 《${scopeBook.title}》` : ""}`
    : book
      ? `《${book.title}》`
      : "全部已解析卡";
  const cardHref = card ? `/desk/card/${encodeURIComponent(card.id)}` : undefined;
  const studyHref = card
    ? `/study?card=${encodeURIComponent(card.id)}${book ? `&book=${encodeURIComponent(book.id)}` : ""}`
    : "/study";

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      <header>
        <h1 className="brand-rule pb-2 text-3xl font-bold">核页 · 本机对页</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          把每条引用的 quote 对着该印刷页的 OCR 原文看一遍，标「本机已对」或「存疑」。
          进度只保存在这个浏览器；FSRS 到期调度未接入，这里不做到期复习。
        </p>
        {invalidBook ? (
          <p className="mt-2 text-sm text-status-warn">
            书库中没有 book id「{bookId}」——已按全部已解析卡统计。可从书架打开正确书目。
          </p>
        ) : null}
        {invalidCard ? (
          <p className="mt-2 text-sm text-status-warn">
            没有卡 id「{cardId}」——卡范围未生效，已按{book ? `《${book.title}》` : "全部已解析卡"}统计。
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted">
          范围：{scopeLabel} · 待核 {items.length} 条
          {book ? (
            <>
              {" "}
              ·{" "}
              <Link
                href="/review"
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                看全部 →
              </Link>
            </>
          ) : null}
          {cardHref ? (
            <>
              {" "}
              ·{" "}
              <Link
                href={cardHref}
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                回本卡 →
              </Link>
            </>
          ) : null}
        </p>
      </header>

      <HeYeSession
        items={items}
        pages={pages}
        scopeLabel={scopeLabel}
        cardHref={cardHref}
        studyHref={studyHref}
      />
    </div>
  );
}
