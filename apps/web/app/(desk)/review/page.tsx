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
 * desk-card-hub-01：?card= 收窄到单卡（卡枢纽「核本卡 cite」入口）。
 * desk-page-card-loop-01（T15）：?page= 收窄到单印刷页（章页卡轨「核本页」入口）；
 * 非法 page 诚实警告并回落无页过滤。
 */
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; card?: string; page?: string }>;
}) {
  const { book: bookId, card: cardId, page: pageParam } = await searchParams;
  const books = loadBooks();
  const book = books.find((b) => b.id === bookId);
  const invalidBook = bookId != null && !book;
  const card = cardId != null ? loadCard(cardId) : undefined;
  const invalidCard = cardId != null && !card;
  /** ?page= 需为正整数；非法 → 诚实警告 + 无页过滤回落。 */
  const pageNum = pageParam != null && /^\d+$/.test(pageParam) ? Number(pageParam) : null;
  const invalidPage = pageParam != null && pageNum == null;

  const items = collectCiteQueue({
    cardId: card?.id,
    bookId: book?.id,
    page: pageNum ?? undefined,
  });
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
  /** 回书桌本页（书范围且 page 合法时）：/desk?book=&page= 章页定位。 */
  const deskPageHref =
    pageNum != null && scopeBook
      ? `/desk?book=${encodeURIComponent(scopeBook.id)}&page=${pageNum}`
      : undefined;

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
        {invalidPage ? (
          <p className="mt-2 text-sm text-status-warn">
            page 参数「{pageParam}」需为正整数——页过滤未生效，已按{scopeLabel}统计。
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted">
          范围：{scopeLabel}
          {pageNum != null ? (
            <>
              {" "}
              · 印刷页 <span className="mono font-medium text-foreground">p.{pageNum}</span>
              {deskPageHref ? (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    href={deskPageHref}
                    className="text-cinnabar no-underline hover:underline underline-offset-4"
                  >
                    回书桌本页 →
                  </Link>
                </>
              ) : null}
            </>
          ) : null}
          {" "}· 待核 {items.length} 条
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
        deskPageHref={deskPageHref}
      />
    </div>
  );
}
