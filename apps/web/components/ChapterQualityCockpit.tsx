"use client";

import { useMemo } from "react";
import { cardDraftCount, listDraftedCardIds } from "@/lib/atom-draft";
import { useAtomDraftStore } from "@/lib/use-atom-draft-store";
import {
  foldChapterRollups,
  rollupAllUnchecked,
  rollupIsWeak,
  type ChapterQualityRollup,
} from "@/lib/chapter-quality-rollup";
import ChapterQualityCockpitRow from "@/components/ChapterQualityCockpitRow";
import { COCKPIT_DISCLAIMER, muted, th } from "@/components/chapter-quality-cockpit-shared";

/**
 * T63 D/E/F/G/H：章质检驾驶舱（客户端岛；挂书库效用区，近 ProgressPortability /
 * DraftInbox，独立折叠区块——不塞书架三分列、不造第四书架徽列）。
 *
 * consume-only：六信号（cite 未见 / parse 空·稀 / 暗 / 浅 / 不完备 / 草稿）**分列**，
 * 全部来自 Server loadChapterQualityRollup 拼装的既有同真算法返回值——本组件零重算、
 * 零新阈值；草稿列 = Client 读 ariadne.atom-draft.v1（T62 listDraftedCardIds /
 * cardDraftCount 交叉，不改键名、不进 progress-port）。
 * 深链只到既有面：/desk/card/<id> · /viewer/<page> · 可复制 CLI（CopyCommand）。
 * 永不 verified:true · 永不 auto PATCH entities/blocks · 永不「一键重抽写回」。
 * 好章不吵；弱章琥珀点名；朱砂只在复制动作与链接 hover。
 *
 * T81 机械拆：UncheckedCell + ChapterRow 整段抽至 ChapterQualityCockpitRow；诚实文案 /
 * 表格 class / pct 抽至 chapter-quality-cockpit-shared——本件只留编排（useAtomDraftStore ·
 * draftByChapter/fold/weakIds · details 折叠壳 · 汇总 · 表头 · map Row）。
 */
export default function ChapterQualityCockpit({
  books,
  chapterTitles,
  rollupByChapter,
  cardIndex,
}: {
  /** 书分组（Server loadBooks 派生 slim）。 */
  books: { id: string; title: string; chapterIds: string[] }[];
  /** 章 id → 标题（Server loadChapters 派生）。 */
  chapterTitles: Record<string, string>;
  /** 章 id → rollup（Server loadChapterQualityRollup；六信号分列，null=未检）。 */
  rollupByChapter: Record<string, ChapterQualityRollup>;
  /** slim 卡索引（Server loadCards 派生 id/章——草稿列交叉 cardId→章，勿整库下传）。 */
  cardIndex: { id: string; chapterId?: string }[];
}) {
  // G：草稿交叉——共享 useSyncExternalStore 口（T71 抽自本件的 draftSnap 私货，交叉列
  // 数字不变；SSR/首帧空仓 → 草稿列如实 0）。
  const store = useAtomDraftStore();

  /** 章 id → 本机草稿摘要（listDraftedCardIds ∩ 本章卡；entry 数 = cardDraftCount 求和）。 */
  const draftByChapter = useMemo(() => {
    const drafted = new Set(listDraftedCardIds(store));
    const byChapter = new Map<string, { draftedCardCount: number; draftEntryCount: number; firstCardId: string | null }>();
    for (const c of cardIndex) {
      if (!drafted.has(c.id)) continue;
      const key = c.chapterId ?? "";
      const prev = byChapter.get(key) ?? { draftedCardCount: 0, draftEntryCount: 0, firstCardId: null };
      prev.draftedCardCount += 1;
      prev.draftEntryCount += cardDraftCount(store, c.id);
      if (prev.firstCardId == null) prev.firstCardId = c.id;
      byChapter.set(key, prev);
    }
    return byChapter;
  }, [store, cardIndex]);

  const allRollups = useMemo(
    () => books.flatMap((b) => b.chapterIds.map((ch) => rollupByChapter[ch]).filter((r) => r != null)),
    [books, rollupByChapter],
  );
  const fold = useMemo(() => foldChapterRollups(allRollups), [allRollups]);
  const weakIds = useMemo(
    () => allRollups.filter(rollupIsWeak).map((r) => r.chapterId),
    [allRollups],
  );

  return (
    <section aria-label="章质检驾驶舱" className="mt-6">
      <details className="rounded-lg border border-line px-3 py-2">
        <summary className="cursor-pointer select-none text-xs leading-6">
          {fold.weakChapters > 0 ? (
            <span className="text-status-warn">
              章质检驾驶舱 · 弱章 {fold.weakChapters}/{fold.chapters}（{weakIds.join(" ")}）· 六信号分列
            </span>
          ) : (
            <span className={muted}>
              章质检驾驶舱 · {fold.chapters} 章机检净 · 六信号分列
            </span>
          )}
          <span className={`ml-2 ${muted}`}>机检 ≠ verified · 展开看弱项深链与可复制命令</span>
        </summary>

        <div className="mt-2">
          <p className={`text-xs leading-6 ${muted}`}>
            一章一眼并读六信号（cite 未见 / parse 空·稀 / 暗 / 浅 / 不完备 / 草稿），点哪类伤深链到既有补救面。
            {COCKPIT_DISCLAIMER}。复制命令全为只读机检（cite/parse/page/density/qa-check）——没有「一键重抽写回」。
          </p>

          {books.map((b) => {
            const rows = b.chapterIds
              .map((ch) => ({ ch, r: rollupByChapter[ch] }))
              .filter((x): x is { ch: string; r: ChapterQualityRollup } => x.r != null);
            if (rows.length === 0) return null;
            return (
              <div key={b.id} className="mt-3">
                <p className="text-xs font-semibold text-foreground/85">《{b.title}》</p>
                <div className="mt-1 overflow-x-auto">
                  <table className="w-full min-w-[44rem] border-collapse text-left text-xs leading-5">
                    <thead>
                      <tr className="border-b border-line text-muted">
                        <th className={`${th} min-w-[10rem]`}>章</th>
                        <th className={th}>cite 未见</th>
                        <th className={th}>parse 空·稀</th>
                        <th className={th}>暗</th>
                        <th className={th}>浅</th>
                        <th className={th}>不完备</th>
                        <th className={th}>草稿</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ ch, r }) => {
                        const weak = rollupIsWeak(r);
                        const draft = draftByChapter.get(ch);
                        const allUnchecked = rollupAllUnchecked(r);
                        return (
                          <ChapterQualityCockpitRow
                            key={ch}
                            chapterId={ch}
                            title={chapterTitles[ch] ?? ""}
                            rollup={r}
                            draft={draft ?? null}
                            weak={weak}
                            allUnchecked={allUnchecked}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <p className={`mt-2 text-[11px] leading-5 ${muted}`}>
            CLI 孪生：<span className="mono">pnpm qa-check</span> 出同一六信号汇总并写 data/qa/&lt;ch&gt;.quality-rollup.json
            （报告非 seed 真源，gitignored）。{COCKPIT_DISCLAIMER}。
          </p>
        </div>
      </details>
    </section>
  );
}
