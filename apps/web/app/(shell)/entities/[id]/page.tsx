import { Suspense } from "react";
import { notFound } from "next/navigation";
import { loadBookValidPages, loadBooks, loadCard, loadCards } from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import { EntityCardDetail } from "@/components/EntityCardDetail";

// review-fix-integrity F：卡是本机可变数据（重抽取即变），与 /entities、desk 数据页同策略
// force-dynamic——去掉会过期的 generateStaticParams（构建期冻结卡面/待核计数）。
export const dynamic = "force-dynamic";

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

  /**
   * T30 B 书桌 roundtrip：与 /desk/card/[id] 同口径解析书（chapterId ∈ book.chapterIds）。
   * 卡属已注册书 → 传 deskBookId：CitePeek 摘录「在书桌打开/练本页/核本页」、易混 vs
   * 深链 /desk/card/、练/核带 book=——shell 详情不再是落 /viewer 的死胡同；未注册章
   * 的卡保持无书语境（诚实不硬造书）。
   */
  const chapterId = card.chapterId;
  const book = chapterId
    ? loadBooks().find((b) => b.chapterIds.includes(chapterId))
    : undefined;
  /** 易混对象名（归一化）→ 卡 id：与 desk card 页同一构建，vs 命中链 /desk/card/。
   * T48 D：同遍历顺带记 confusionAtomCounts[c.id]=atoms.length——「练易混卡」对 vs 0 原子门禁。 */
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
  const queue = collectCiteQueue({ cardId: card.id });

  /**
   * T41 D/E：shell 详情出发回程——回实体列表视图（与 backHref 同源，含 ?kind=）。
   * label 精简自 backLabel（去「← 」前缀）；同时喂 CardHubReturnLinks（returnTo）与
   * 「在书桌打开本卡/本页」（openDeskReturnTo）——两路同源，不出现第二套口径。
   */
  const listReturnTo = {
    href: backHref,
    label: kind && kind !== "全部" ? `${KIND_ZH[kind] ?? kind}实体卡` : "全部实体卡",
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 flex-1">
      <EntityCardDetail
        card={card}
        backHref={backHref}
        backLabel={backLabel}
        deskBookId={book?.id}
        deskCardHref={book ? `/desk/card/${encodeURIComponent(card.id)}` : undefined}
        pendingCiteCount={queue.length}
        confusionLinks={confusionLinks}
        confusionAtomCounts={confusionAtomCounts}
        heyePoolKeys={queue.map((it) => ({ key: it.key }))}
        /* T52 H/I：该书已解析印刷页表——三处「对页」+「在书桌打开本页」OCR 有效性门禁；
           未注册章的卡保持无书语境不传（缺省不门禁，保持链）。 */
        bookValidPages={book ? loadBookValidPages()[book.id] : undefined}
        returnTo={listReturnTo}
        openDeskReturnTo={listReturnTo}
      />
    </main>
  );
}
