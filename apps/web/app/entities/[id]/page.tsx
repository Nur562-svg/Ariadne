import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCard, loadCards } from "@/lib/entities";
import { CiteChip } from "@/components/CiteChip";

export function generateStaticParams() {
  return loadCards().map((c) => ({ id: c.id }));
}

const DIFF_ZH = { what: "识记", why: "机制", case: "应用" } as const;

export default async function EntityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = loadCard(id);
  if (!card) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 flex-1">
      <Link href="/entities" className="text-sm text-muted no-underline hover:text-cinnabar">
        ← 全部实体卡
      </Link>

      <header className="brand-rule mt-4 pb-4">
        <h1 className="text-3xl font-bold">{card.name_zh}</h1>
        {card.name_en && <p className="mono mt-1 text-sm text-muted">{card.name_en}</p>}
        {card.aliases?.length ? (
          <p className="mt-1 text-sm text-muted">又称：{card.aliases.join(" · ")}</p>
        ) : null}
        <p className="mt-3 text-lg leading-7">{card.one_liner}</p>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-muted">字段</h2>
        <dl className="mt-3 space-y-3">
          {card.fields.map((f, i) => (
            <div key={i} className="rounded-lg border border-line bg-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-semibold">{f.label}</dt>
                <CiteChip cite={f.cite} q={f.value.slice(0, 24)} />
              </div>
              <dd className="mt-1.5 text-sm leading-7 text-foreground/90">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {card.confusions?.length ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-muted">易混点</h2>
          <ul className="mt-3 space-y-2">
            {card.confusions.map((c, i) => (
              <li key={i} className="rounded-lg border border-cinnabar/30 bg-cinnabar-soft/60 p-4 text-sm leading-7">
                <span className="font-semibold text-cinnabar">vs {c.vs}</span>
                <span className="mx-2 text-line">|</span>
                {c.tip}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-muted">知识原子（{card.atoms.length}）</h2>
        <ol className="mt-3 space-y-3">
          {card.atoms.map((a) => (
            <li key={a.id} className="rounded-lg border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium leading-7">{a.prompt}</p>
                <span className="mono shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
                  {DIFF_ZH[a.difficulty]}
                </span>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer select-none text-sm text-muted hover:text-cinnabar">
                  显示答案
                </summary>
                <p className="mt-2 border-l-2 border-cinnabar/40 pl-3 text-sm leading-7">{a.answer}</p>
              </details>
              {a.cite ? (
                <div className="mt-2">
                  <CiteChip cite={a.cite} q={a.answer.slice(0, 24)} />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-10 border-t border-line pt-4 text-sm text-muted">
        引用：{" "}
        {card.cites.map((c, i) => (
          <span key={i} className="mr-2 inline-flex items-center gap-1">
            <CiteChip cite={c} />
            {c.quote ? <span className="text-xs">“{c.quote}”</span> : null}
          </span>
        ))}
      </footer>
    </main>
  );
}
