import { notFound } from "next/navigation";
import {
  loadBookValidPages,
  loadBooks,
  loadCard,
  loadCards,
  loadChapterPages,
  loadChapters,
} from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import { cardsCitingPage } from "@/lib/entities-query";
import { firstPagedCitePage } from "@/lib/entity-card-detail-model";
import {
  mergeOcrHardBreaks,
  defaultActiveField,
  type SourcePage,
  type CitingCardRow,
  type FieldCiteLite,
} from "@/lib/entity-card-source-model";
import { EntityCardDetail } from "@/components/EntityCardDetail";
import DeskSurfaceBridge from "@/components/desk/DeskSurfaceBridge";
import {
  CardSourceProvider,
  CardSourceConnector,
} from "@/components/EntityCardSourceLink";
import EntityCardSourcePane from "@/components/EntityCardSourcePane";

export const dynamic = "force-dynamic";

/** 书桌中栏的实体卡详情（DocumentPane 内）。返回书桌时带上该书（chapterId → book 反查）。 */
export default async function DeskCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = loadCard(id);
  if (!card) notFound();

  const book = card.chapterId
    ? loadBooks().find((b) => b.chapterIds.includes(card.chapterId as string))
    : undefined;
  const backHref = book ? `/desk?book=${encodeURIComponent(book.id)}` : "/desk";

  /** 枢纽 props：本卡待核 cite 数（动作条诚实文案）+ 易混对象名 → 卡 id（vs 深链）。
   * T48 D：同遍历顺带记 confusionAtomCounts[c.id]=atoms.length——「练易混卡」对 vs 0 原子
   * 门禁（与 T45 本卡练门禁同族：不进空练池）。 */
  const queue = collectCiteQueue({ cardId: card.id });
  const pendingCiteCount = queue.length;
  const heyePoolKeys = queue.map((it) => ({ key: it.key }));
  const confusionLinks: Record<string, string> = {};
  const confusionAtomCounts: Record<string, number> = {};
  for (const c of loadCards()) {
    confusionAtomCounts[c.id] = c.atoms.length;
    const names = [c.name_zh, ...(c.aliases ?? [])];
    for (const n of names) {
      const key = n.trim().toLowerCase();
      if (key) confusionLinks[key] = c.id;
    }
  }

  const chapter = card.chapterId
    ? loadChapters().find((c) => c.id === card.chapterId)
    : undefined;

  /**
   * T30 A：与 EntityCardDetail 本卡 Strip / 动作条同一套池与深链——卡面 Clew
   * 「本轮变化」compact 标「本卡」+ 本卡数字，不再掉「未定位章 · 全书本机记录」；
   * 练/核深链与动作条同口径（card= 兼 book=）。
   * T35 A/B：显式默认档（练 mode=all · 核 mode=open）——与 EntityCardDetail 动作条 href 同真，
   * Clew 卡面 CTA 进练/核不被 sticky 非默认空档撒谎。
   */
  const progressStudyHref = book
    ? `/study?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(book.id)}&mode=all`
    : `/study?card=${encodeURIComponent(card.id)}&mode=all`;
  const progressReviewHref = book
    ? `/review?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(book.id)}&mode=open`
    : `/review?card=${encodeURIComponent(card.id)}&mode=open`;

  const chapterPages = card.chapterId
    ? loadChapterPages(card.chapterId).filter((p) => p.page != null)
    : [];
  const seenPages = new Set<number>();
  const pages: SourcePage[] = [];
  for (const p of chapterPages) {
    const pageNum = p.page as number;
    if (!seenPages.has(pageNum)) {
      seenPages.add(pageNum);
      pages.push({
        page: pageNum,
        physicalPage: p.physicalPage,
        paras: mergeOcrHardBreaks(p.text),
      });
    }
  }
  pages.sort((a, b) => a.page - b.page);

  const citingByPage: Record<number, CitingCardRow[]> = {};
  if (book && pages.length > 0) {
    for (const p of pages) {
      const citingCards = cardsCitingPage(p.page, { bookId: book.id });
      citingByPage[p.page] = citingCards
        .filter((c) => c.chapterId === card.chapterId)
        .map((c) => ({
          cardId: c.cardId,
          nameZh: c.nameZh,
          hitCount: c.hits.length,
        }));
    }
  }

  const fieldCites: (FieldCiteLite | null)[] = card.fields.map((f) =>
    f.cite ? { page: f.cite.page ?? null, quote: f.cite.quote } : null,
  );
  const pageNums = pages.map((p) => p.page);
  const pageSet = new Set(pageNums);
  const initialField = defaultActiveField(fieldCites, pageSet);
  const firstCitePage = firstPagedCitePage(card);
  const initialPage =
    initialField != null && fieldCites[initialField]?.page != null
      ? (fieldCites[initialField]!.page as number)
      : firstCitePage != null && pageSet.has(firstCitePage)
      ? firstCitePage
      : (pages[0]?.page ?? 0);

  const twoCol = !!book && pages.length > 0;
  const validPages = book ? loadBookValidPages()[book.id] : undefined;
  const openDeskReturnTo = {
    href: `/desk/card/${encodeURIComponent(card.id)}`,
    label: `卡《${card.name_zh}》`,
  };

  const bridge = (
    /* 卡面薄桥：Clew 会话条显示「本卡」+ 卡名可回跳；progress* 与中栏本卡 Strip 同池（T30 A）。 */
    <DeskSurfaceBridge
      data={{
        surface: "card",
        book: book ? { id: book.id, title: book.title } : undefined,
        chapter: chapter ? { id: chapter.id, title: chapter.title } : undefined,
        card: { id: card.id, name_zh: card.name_zh },
        citePages: card.cites
          .filter((x) => x.page != null)
          .slice(0, 3)
          .map((x) => x.page as number),
        progressAtoms: card.atoms.map((a) => ({ cardId: card.id, atomId: a.id })),
        progressItems: heyePoolKeys,
        progressScopeLabel: "本卡",
        progressStudyHref: progressStudyHref,
        progressReviewHref: progressReviewHref,
      }}
    />
  );

  const detail = (
    /* T41 D：desk 卡页「在书桌打开本卡/本页」点前 return 回本卡枢纽（与枢纽动作条
        默认 returnTo 口径一致）；returnTo 不传——CardHub 默认本卡，只回归。 */
    <EntityCardDetail
      card={card}
      backHref={backHref}
      backLabel="← 书桌"
      deskBookId={book?.id}
      pendingCiteCount={pendingCiteCount}
      confusionLinks={confusionLinks}
      confusionAtomCounts={confusionAtomCounts}
      heyePoolKeys={heyePoolKeys}
      /* T52 H/I：该书已解析印刷页表——三处「对页」+「在书桌打开本页」OCR 有效性门禁；
         无书语境不传（缺省不门禁，保持链）。 */
      bookValidPages={validPages}
      /* T54 F/I：该书 page→OCR 原文（按书章逐章取，无跨书页码串扰）——卡详诚实条
         「OCR 未见 N」+ 字段/原子/页脚 per-cite 机检（server 侧 quoteInOcr 同真）。 */
      pageTextByPage={
        book
          ? Object.fromEntries(
              book.chapterIds.flatMap((chId) =>
                loadChapterPages(chId)
                  .filter((p) => p.page != null)
                  .map((p) => [p.page, p.text]),
              ),
            )
          : undefined
      }
      openDeskReturnTo={openDeskReturnTo}
      foldHonesty={twoCol}
    />
  );

  if (!twoCol) {
    return (
      <div className="mx-auto w-full max-w-3xl px-8 py-10">
        {bridge}
        {detail}
      </div>
    );
  }

  return (
    <CardSourceProvider
      fieldCites={fieldCites}
      pages={pageNums}
      initialPage={initialPage}
      initialField={initialField}
    >
      <div className="mx-auto w-full max-w-3xl min-[1248px]:grid min-[1248px]:max-w-[1200px] min-[1248px]:in-data-[clew=folded]:grid-cols-[520px_minmax(0,1fr)] min-[1248px]:in-data-[clew=open]:grid-cols-[44px_minmax(0,1fr)]">
        <aside
          aria-label="章页原文"
          className="hidden min-[1248px]:sticky min-[1248px]:top-0 min-[1248px]:block min-[1248px]:h-[calc(100dvh-2.5rem)] min-[1248px]:self-start"
        >
          <EntityCardSourcePane
            pages={pages}
            citingByPage={citingByPage}
            currentCardId={card.id}
            currentCardName={card.name_zh}
            bookId={book.id}
            validPages={validPages}
            chapterId={card.chapterId as string}
            openDeskReturnTo={openDeskReturnTo}
          />
        </aside>
        <div className="min-w-0 px-8 py-10 min-[1248px]:py-8 min-[1248px]:pl-7">
          {bridge}
          {detail}
        </div>
      </div>
      <CardSourceConnector />
    </CardSourceProvider>
  );
}