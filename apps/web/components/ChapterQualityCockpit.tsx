"use client";

import Link from "next/link";
import { useMemo } from "react";
import CopyCommand from "@/components/CopyCommand";
import { cardDraftCount, listDraftedCardIds } from "@/lib/atom-draft";
import { useAtomDraftStore } from "@/lib/use-atom-draft-store";
import {
  foldChapterRollups,
  rollupAllUnchecked,
  rollupCliCommands,
  rollupIsWeak,
  type ChapterQualityRollup,
} from "@/lib/chapter-quality-rollup";

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
 */

/** H：诚实文案——一次说清四个 ≠，禁止掌握% / Due / 单一健康分。 */
const COCKPIT_DISCLAIMER =
  "机检 ≠ verified 抽查 · cockpit ≠ seed 已核 · 草稿 ≠ 已写回 · data/qa 报告 ≠ 真源";

const th = "px-2 py-1.5 font-normal whitespace-nowrap";
const td = "px-2 py-1.5 align-top whitespace-nowrap";
const muted = "text-muted";
const amber = "text-status-warn";

function pct(x: number): string {
  return `${(x * 100).toFixed(0)}%`;
}

/** 未检 cell：fail-closed，缺 blocks/entities 不装完美 0。 */
function UncheckedCell({ why }: { why: string }) {
  return (
    <span className={muted} title={why}>
      未检
    </span>
  );
}

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
                          <ChapterRow
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

/** 单章行：六个信号 cell + 弱章展开行（深链 + 可复制命令）。 */
function ChapterRow({
  chapterId,
  title,
  rollup,
  draft,
  weak,
  allUnchecked,
}: {
  chapterId: string;
  title: string;
  rollup: ChapterQualityRollup;
  draft: { draftedCardCount: number; draftEntryCount: number; firstCardId: string | null } | null;
  weak: boolean;
  allUnchecked: boolean;
}) {
  const { cite, parse, dark, shallow } = rollup;
  const citeWeak = cite != null && (cite.ocrMiss > 0 || cite.zeroAtomCards > 0);
  const parseWeak = parse != null && parse.weak;
  const darkWeak = dark != null && dark.darkCount > 0;
  const shallowWeak = shallow != null && shallow.shallowCount > 0;
  const incompleteWeak = cite != null && rollup.incompleteAtoms > 0;

  return (
    <>
      <tr className={`border-b ${weak ? "border-amber-300/50" : "border-line/60"}`}>
        <td className={td}>
          <span className="mono text-foreground/85">{chapterId}</span>
          {allUnchecked ? (
            <span className={`ml-2 ${muted}`} title="缺 blocks 且缺 entities——先 pnpm parse / pnpm extract">
              未解析
            </span>
          ) : null}
          {title ? (
            <span className={`ml-2 hidden whitespace-normal text-[11px] sm:inline ${muted}`}>{title}</span>
          ) : null}
        </td>
        {/* 六分列 1：cite 未见（T54 bigram≥0.6；缺 OCR 文本的 cite 不计 miss）。 */}
        <td className={td}>
          {cite == null ? (
            <UncheckedCell why="缺 entities——未抽出＝未检，不装 0" />
          ) : (
            <span className={citeWeak ? amber : muted}>
              {cite.ocrMiss}/{cite.cites}
              {cite.cites > 0 ? `（${pct(cite.missRate)}）` : ""}
              {cite.zeroAtomCards > 0 ? ` · 零原子卡 ${cite.zeroAtomCards}` : ""}
            </span>
          )}
        </td>
        {/* 六分列 2：parse 空·稀（T56 SPARSE_CHAR_THR=40）。 */}
        <td className={td}>
          {parse == null ? (
            <UncheckedCell why="缺 blocks——未解析＝未检" />
          ) : (
            <span className={parseWeak ? amber : muted}>
              空{parse.emptyPages}·稀{parse.sparsePages}·覆盖{pct(parse.coverageRate)}
            </span>
          )}
        </td>
        {/* 六分列 3：暗（T57 实质页零 cite）。 */}
        <td className={td}>
          {dark == null ? (
            <UncheckedCell why="缺 blocks 或 entities——未检" />
          ) : (
            <span className={darkWeak ? amber : muted}>
              {dark.darkCount}
              {dark.substantialPages > 0 ? `（${pct(dark.darkRate)}）` : ""}
            </span>
          )}
        </td>
        {/* 六分列 4：浅（T59 已 cite 页原子极稀）。 */}
        <td className={td}>
          {shallow == null ? (
            <UncheckedCell why="缺 blocks 或 entities——未检" />
          ) : (
            <span className={shallowWeak ? amber : muted}>
              {shallow.shallowCount}
              {shallow.substantialPages > 0 ? `（${pct(shallow.shallowRate)}）` : ""}
            </span>
          )}
        </td>
        {/* 六分列 5：不完备原子（T55 空 prompt ∨ 空 answer）。 */}
        <td className={td}>
          {cite == null ? (
            <UncheckedCell why="缺 entities——未检" />
          ) : (
            <span className={incompleteWeak ? amber : muted}>{rollup.incompleteAtoms}</span>
          )}
        </td>
        {/* 六分列 6：草稿（T62 本机——非缺陷，不计弱；draft ≠ applied）。 */}
        <td className={td}>
          {draft != null && draft.draftedCardCount > 0 ? (
            <Link
              href={`/desk/card/${encodeURIComponent(draft.firstCardId ?? "")}`}
              title="本机草稿未写回 seed · 见上方草稿收件箱"
              className="text-foreground/85 no-underline hover:text-cinnabar hover:underline underline-offset-4"
            >
              {draft.draftedCardCount}卡·{draft.draftEntryCount}条
            </Link>
          ) : (
            <span className={muted}>0</span>
          )}
        </td>
      </tr>
      {/* 弱章展开行：深链既有补救面 + 只读机检命令（F）。好章不出此行——不吵。 */}
      {weak ? (
        <tr className="border-b border-line/60">
          <td colSpan={7} className="px-2 py-2">
            <div className="rounded border border-amber-300/50 bg-status-warn-bg/40 px-3 py-2">
              <p className={`text-xs leading-6 ${amber}`}>
                {chapterId} 弱项 ·{" "}
                {[
                  citeWeak && (cite as NonNullable<typeof cite>).ocrMiss > 0 ? "cite 未见" : null,
                  citeWeak && (cite as NonNullable<typeof cite>).zeroAtomCards > 0 ? "零原子卡" : null,
                  parseWeak ? "parse 空/稀" : null,
                  darkWeak ? "暗页" : null,
                  shallowWeak ? "浅页" : null,
                  incompleteWeak ? "不完备原子" : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {/* OCR 未见样例卡 → 卡详（既有面）。 */}
              {rollup.citeMissCardIds.length > 0 ? (
                <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs leading-5 text-muted">
                  <span>OCR未见样例卡：</span>
                  {rollup.citeMissCardIds.map((id) => (
                    <Link
                      key={id}
                      href={`/desk/card/${encodeURIComponent(id)}`}
                      className="mono text-foreground/80 no-underline hover:text-cinnabar hover:underline underline-offset-4"
                    >
                      {id}
                    </Link>
                  ))}
                </p>
              ) : null}
              {/* 不完备卡 → 卡详开本机草稿（T61 既有面；草稿 ≠ seed）。 */}
              {rollup.incompleteCardIds.length > 0 ? (
                <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs leading-5 text-muted">
                  <span>不完备卡（到卡详开草稿补空字段）：</span>
                  {rollup.incompleteCardIds.slice(0, 8).map((id) => (
                    <Link
                      key={id}
                      href={`/desk/card/${encodeURIComponent(id)}`}
                      className="mono text-foreground/80 no-underline hover:text-cinnabar hover:underline underline-offset-4"
                    >
                      {id}
                    </Link>
                  ))}
                  {rollup.incompleteCardIds.length > 8 ? (
                    <span>等 {rollup.incompleteCardIds.length} 张卡</span>
                  ) : null}
                </p>
              ) : null}
              {/* 暗/浅样例页 → viewer OCR 原文（既有深链惯例 /viewer/<page>）。 */}
              {dark != null && dark.samplePages.length > 0 ? (
                <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs leading-5 text-muted">
                  <span>暗页样例（看 OCR 原文）：</span>
                  {dark.samplePages.map((p) => (
                    <Link
                      key={p}
                      href={`/viewer/${p}`}
                      className="mono text-foreground/80 no-underline hover:text-cinnabar hover:underline underline-offset-4"
                    >
                      p.{p}
                    </Link>
                  ))}
                </p>
              ) : null}
              {shallow != null && shallow.samplePages.length > 0 ? (
                <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs leading-5 text-muted">
                  <span>浅页样例（看 OCR 原文）：</span>
                  {shallow.samplePages.map((p) => (
                    <Link
                      key={p}
                      href={`/viewer/${p}`}
                      className="mono text-foreground/80 no-underline hover:text-cinnabar hover:underline underline-offset-4"
                    >
                      p.{p}
                    </Link>
                  ))}
                </p>
              ) : null}
              {/* 只读机检命令（CopyCommand；无重抽写回按钮）。 */}
              <div className="mt-2 space-y-1.5">
                {rollupCliCommands(rollup).map((c) => (
                  <div key={c.command}>
                    <p className={`text-[11px] leading-4 ${muted}`}>{c.label}</p>
                    <CopyCommand command={c.command} />
                  </div>
                ))}
              </div>
              {rollup.lastCliCheckAt ? (
                <p className={`mt-1.5 text-[11px] leading-5 ${muted}`}>
                  上次 CLI 戳 {rollup.lastCliCheckAt}（data/qa 报告旁注，≠ 真源）。
                </p>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
