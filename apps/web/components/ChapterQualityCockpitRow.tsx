"use client";

import Link from "next/link";
import CopyCommand from "@/components/CopyCommand";
import { rollupCliCommands, type ChapterQualityRollup } from "@/lib/chapter-quality-rollup";
import { amber, muted, pct, td } from "@/components/chapter-quality-cockpit-shared";

/**
 * T81 机械抽出：原 ChapterQualityCockpit.tsx 内 UncheckedCell + ChapterRow 整段迁此——
 * 六分列 / 弱章展开行 / 深链（/desk/card/<id> · /viewer/<page>）/ CopyCommand 只读机检 /
 * 草稿链 / why·title 文案 / class 零改；形参表同 tip（chapterId / title / rollup / draft /
 * weak / allUnchecked 经 props）。未检 fail-closed 语义零改（缺 blocks/entities 不装完美 0）。
 */

/** 未检 cell：fail-closed，缺 blocks/entities 不装完美 0。 */
function UncheckedCell({ why }: { why: string }) {
  return (
    <span className={muted} title={why}>
      未检
    </span>
  );
}

/** 单章行：六个信号 cell + 弱章展开行（深链 + 可复制命令）。 */
export default function ChapterQualityCockpitRow({
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
