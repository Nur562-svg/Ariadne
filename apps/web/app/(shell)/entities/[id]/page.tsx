import { Suspense } from "react";
import { notFound } from "next/navigation";
import { loadCard, loadCards } from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import { EntityCardDetail } from "@/components/EntityCardDetail";

export function generateStaticParams() {
  return loadCards().map((c) => ({ id: c.id }));
}

const KIND_ZH: Record<string, string> = {
  concept: "概念",
  structure: "结构",
  process: "过程",
  molecule: "分子",
  pathogen: "病原",
  cell: "细胞",
  disease: "疾病",
};

export default function EntityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-6 py-12 flex-1">
          <p className="text-sm text-muted">加载中…</p>
        </main>
      }
    >
      <EntityDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EntityDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { id } = await params;
  const { kind } = await searchParams;
  const card = loadCard(id);
  if (!card) notFound();

  const backHref =
    kind && kind !== "全部" ? `/entities?kind=${encodeURIComponent(kind)}` : "/entities";
  const backLabel =
    kind && kind !== "全部" ? `← ${KIND_ZH[kind] ?? kind}实体卡` : "← 全部实体卡";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 flex-1">
      <EntityCardDetail
        card={card}
        backHref={backHref}
        backLabel={backLabel}
        pendingCiteCount={collectCiteQueue({ cardId: card.id }).length}
        heyePoolKeys={collectCiteQueue({ cardId: card.id }).map((it) => ({ key: it.key }))}
      />
    </main>
  );
}
