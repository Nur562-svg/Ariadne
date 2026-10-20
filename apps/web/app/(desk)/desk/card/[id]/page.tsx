import { notFound } from "next/navigation";
import { loadBooks, loadCard, loadCards, loadChapters } from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import { EntityCardDetail } from "@/components/EntityCardDetail";
import DeskSurfaceBridge from "@/components/desk/DeskSurfaceBridge";

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

  /** 枢纽 props：本卡待核 cite 数（动作条诚实文案）+ 易混对象名 → 卡 id（vs 深链）。 */
  const queue = collectCiteQueue({ cardId: card.id });
  const pendingCiteCount = queue.length;
  const heyePoolKeys = queue.map((it) => ({ key: it.key }));
  const confusionLinks: Record<string, string> = {};
  for (const c of loadCards()) {
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
   */
  const progressStudyHref = book
    ? `/study?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(book.id)}`
    : `/study?card=${encodeURIComponent(card.id)}`;
  const progressReviewHref = book
    ? `/review?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(book.id)}`
    : `/review?card=${encodeURIComponent(card.id)}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      {/* 卡面薄桥：Clew 会话条显示「本卡」+ 卡名可回跳；progress* 与中栏本卡 Strip 同池（T30 A）。 */}
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
      <EntityCardDetail
        card={card}
        backHref={backHref}
        backLabel="← 书桌"
        deskBookId={book?.id}
        pendingCiteCount={pendingCiteCount}
        confusionLinks={confusionLinks}
        heyePoolKeys={heyePoolKeys}
      />
    </div>
  );
}