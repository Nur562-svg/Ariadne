import { notFound } from "next/navigation";
import { loadCard } from "@/lib/entities";
import { EntityCardDetail } from "@/components/EntityCardDetail";

export const dynamic = "force-dynamic";

/** 书桌中栏的实体卡详情（DocumentPane 内），返回书桌列表。 */
export default async function DeskCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = loadCard(id);
  if (!card) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <EntityCardDetail card={card} backHref="/desk" backLabel="← 书桌" />
    </div>
  );
}
