import Link from "next/link";
import { loadCards } from "@/lib/entities";

export default function Home() {
  const cards = loadCards();
  const atoms = cards.reduce((n, c) => n + c.atoms.length, 0);
  const verified = cards.filter((c) => c.cites.some((x) => x.verified && x.page != null)).length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 flex-1">
      <p className="mono text-sm text-cinnabar">ARIADNE</p>
      <h1 className="brand-rule mt-2 pb-3 text-4xl font-bold tracking-wide">实体卡预览</h1>
      <p className="mt-6 leading-8 text-foreground/90">
        《免疫学基础与病原生物学（第3版）》第一篇 · 第一章 免疫学概述 + 第二章 抗原。
        每张卡带印刷页码 citation，未验证引用以琥珀虚线标 <span className="cite-unverified">p.?</span>。
      </p>
      <dl className="mt-10 grid grid-cols-3 gap-4 text-center">
        {[
          ["实体卡", cards.length],
          ["知识原子", atoms],
          ["带已验证页码的卡", verified],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-lg border border-line bg-card px-4 py-6">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="mt-1 text-3xl font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <Link
        href="/entities"
        className="mt-10 inline-block rounded-md bg-cinnabar px-5 py-2.5 text-white no-underline"
      >
        浏览全部实体卡 →
      </Link>
    </main>
  );
}
