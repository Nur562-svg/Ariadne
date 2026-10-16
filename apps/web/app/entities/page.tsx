import Link from "next/link";
import { Suspense } from "react";
import { loadCards } from "@/lib/entities";
import EntitySearch from "@/components/EntitySearch";

const KINDS = ["全部", "concept", "structure", "process", "molecule", "cell", "disease"] as const;

const KIND_ZH: Record<string, string> = {
  concept: "概念",
  structure: "结构",
  process: "过程",
  molecule: "分子",
  pathogen: "病原",
  cell: "细胞",
  disease: "疾病",
};

export default function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 flex-1">
      <h1 className="brand-rule pb-2 text-3xl font-bold">实体卡 · 免疫学概述 / 抗原 / 免疫器官与组织</h1>
      <Suspense fallback={<p className="mt-8 text-muted">加载中…</p>}>
        <EntityList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function EntityList({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const all = loadCards();
  const cards = !kind || kind === "全部" ? all : all.filter((c) => c.kind === kind);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">{cards.length} 张</span>
        {KINDS.map((k) => (
          <Link
            key={k}
            href={k === "全部" ? "/entities" : `/entities?kind=${k}`}
            className={`rounded-full border px-3 py-1 text-sm no-underline ${
              (k === "全部" && !kind) || k === kind
                ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                : "border-line text-muted hover:text-foreground"
            }`}
          >
            {k === "全部" ? "全部" : `${KIND_ZH[k] ?? k} ${k}`}
          </Link>
        ))}
      </div>

      <EntitySearch cards={cards} kindLabel={KIND_ZH} activeKind={kind} />
    </>
  );
}
