import Link from "next/link";
import { Suspense } from "react";
import { loadCards } from "@/lib/entities";

const KINDS = ["全部", "concept", "structure", "process", "molecule"] as const;

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
      <h1 className="brand-rule pb-2 text-3xl font-bold">实体卡 · 免疫学概述 / 抗原</h1>
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

      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li key={c.id}>
            <Link
              href={`/entities/${c.id}`}
              className="block h-full rounded-lg border border-line bg-card p-5 no-underline transition-shadow hover:shadow-md"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-foreground">{c.name_zh}</h2>
                <span className="mono shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
                  {KIND_ZH[c.kind] ?? c.kind}
                </span>
              </div>
              {c.name_en && <p className="mono mt-0.5 text-xs text-muted">{c.name_en}</p>}
              <p className="mt-3 text-sm leading-6 text-foreground/85">{c.one_liner}</p>
              <p className="mt-3 text-xs text-muted">
                {c.atoms.length} 个原子 · 引自 p.
                {[...new Set(c.cites.filter((x) => x.page != null).map((x) => x.page))].join(", p.")}
                {c.cites.some((x) => x.page == null) ? " · 部分未验证 p.?" : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
