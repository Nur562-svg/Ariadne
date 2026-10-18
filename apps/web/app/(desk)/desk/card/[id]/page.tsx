import { notFound } from "next/navigation";
import { loadBooks, loadCard } from "@/lib/entities";
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

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <EntityCardDetail card={card} backHref={backHref} backLabel="← 书桌" />
    </div>
  );
}