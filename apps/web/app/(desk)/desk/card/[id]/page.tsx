import { notFound } from "next/navigation";
import { loadBookValidPages, loadBooks, loadCard, loadCards, loadChapters } from "@/lib/entities";
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

  /** 枢纽 props：本卡待核 cite 数（动作条诚实文案）+ 易混对象名 → 卡 id（vs 深链）。
   * T48 D：同遍历顺带记 confusionAtomCounts[c.id]=atoms.length——「练易混卡」对 vs 0 原子
   * 门禁（与 T45 本卡练门禁同族：不进空练池）。 */
  const queue = collectCiteQueue({ cardId: card.id });
  const pendingCiteCount = queue.length;
  const heyePoolKeys = queue.map((it) => ({ key: it.key }));
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

  const chapter = card.chapterId
    ? loadChapters().find((c) => c.id === card.chapterId)
    : undefined;

  /**
   * T30 A：与 EntityCardDetail 本卡 Strip / 动作条同一套池与深链——卡面 Clew
   * 「本轮变化」compact 标「本卡」+ 本卡数字，不再掉「未定位章 · 全书本机记录」；
   * 练/核深链与动作条同口径（card= 兼 book=）。
   * T35 A/B：显式默认档（练 mode=all · 核 mode=open）——与 EntityCardDetail 动作条 href 同真，
   * Clew 卡面 CTA 进练/核不被 sticky 非默认空档撒谎。
   */
  const progressStudyHref = book
    ? `/study?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(book.id)}&mode=all`
    : `/study?card=${encodeURIComponent(card.id)}&mode=all`;
  const progressReviewHref = book
    ? `/review?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(book.id)}&mode=open`
    : `/review?card=${encodeURIComponent(card.id)}&mode=open`;

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
      {/* T41 D：desk 卡页「在书桌打开本卡/本页」点前 return 回本卡枢纽（与枢纽动作条
          默认 returnTo 口径一致）；returnTo 不传——CardHub 默认本卡，只回归。 */}
      <EntityCardDetail
        card={card}
        backHref={backHref}
        backLabel="← 书桌"
        deskBookId={book?.id}
        pendingCiteCount={pendingCiteCount}
        confusionLinks={confusionLinks}
        confusionAtomCounts={confusionAtomCounts}
        heyePoolKeys={heyePoolKeys}
        /* T52 H/I：该书已解析印刷页表——三处「对页」+「在书桌打开本页」OCR 有效性门禁；
           无书语境不传（缺省不门禁，保持链）。 */
        bookValidPages={book ? loadBookValidPages()[book.id] : undefined}
        openDeskReturnTo={{
          href: `/desk/card/${encodeURIComponent(card.id)}`,
          label: `卡《${card.name_zh}》`,
        }}
      />
    </div>
  );
}