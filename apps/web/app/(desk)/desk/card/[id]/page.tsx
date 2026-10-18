import { notFound } from "next/navigation";
import { loadBooks, loadCard, loadCards } from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import { EntityCardDetail } from "@/components/EntityCardDetail";

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
  const pendingCiteCount = collectCiteQueue({ cardId: card.id }).length;
  const confusionLinks: Record<string, string> = {};
  for (const c of loadCards()) {
    const names = [c.name_zh, ...(c.aliases ?? [])];
    for (const n of names) {
      const key = n.trim().toLowerCase();
      if (key) confusionLinks[key] = c.id;
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <EntityCardDetail
        card={card}
        backHref={backHref}
        backLabel="← 书桌"
        deskBookId={book?.id}
        pendingCiteCount={pendingCiteCount}
        confusionLinks={confusionLinks}
      />
    </div>
  );
}