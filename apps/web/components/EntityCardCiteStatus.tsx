/**
 * T103 desk-entity-card-detail-split-01 · Seam B
 *
 * 实体卡详情「引用状态」section（RSC · 无 "use client"）。
 * 从 apps/web/components/EntityCardDetail.tsx :235–319 抽出。
 * cite 诚实条：有页 / p.? / seed 抽查未核计数；明确 seed verified ≠ 本机核页 localStorage 态。
 * 复制级补救：OCR 未见逐条展开 + 复制建议摘录 + 一键填入草稿 quote（仍只写本机草稿）。
 */

import type { EntityCard } from "@/lib/entities";
import type { EntityCardCiteStats, EntityCardMissModel } from "@/lib/entity-card-detail-model";
import CopyTextButton from "@/components/CopyTextButton";
import { FillAtomQuoteDraft } from "@/components/AtomDraftEditor";
import HonestyDisclosure from "@/components/desk/HonestyDisclosure";

export function EntityCardCiteStatus({
  card,
  stats,
  ocrMissCount,
  missDetails,
  atomTargetOfMiss,
  foldNote = false,
}: {
  card: EntityCard;
  stats: EntityCardCiteStats;
  ocrMissCount: number | null;
  missDetails: EntityCardMissModel["missDetails"];
  atomTargetOfMiss: EntityCardMissModel["atomTargetOfMiss"];
  foldNote?: boolean;
}) {
  const items = (
    <>
      <span className="text-muted">引用 {stats.total} 处</span>
      <span className="text-muted">
        有页 <span className="mono font-medium text-foreground">{stats.paged}</span>
      </span>
      <span className={stats.nullPage > 0 ? "text-status-warn" : "text-muted"}>
        无页 p.?{" "}
        <span className={`mono font-medium ${stats.nullPage > 0 ? "text-status-warn" : "text-foreground"}`}>
          {stats.nullPage}
        </span>
      </span>
      <span className={stats.unverified > 0 ? "text-status-warn" : "text-muted"}>
        教材抽查未核{" "}
        <span className={`mono font-medium ${stats.unverified > 0 ? "text-status-warn" : "text-foreground"}`}>
          {stats.unverified}
        </span>
      </span>
      {/* T54 F：机检「OCR 未见」——与 seed 抽查 verified 分列（另开信号，互不写入）；
          N=0 不吵；页文本未装配（未检）不出列。 */}
      {ocrMissCount != null && ocrMissCount > 0 ? (
        <span className="text-status-warn">
          OCR 未见{" "}
          <span className="mono font-medium text-status-warn">{ocrMissCount}</span>
        </span>
      ) : null}
    </>
  );

  const note = (
    <>
      「抽查未核」是教材数据（seed）自带的 verified 标记，未经本机对页——不计为已核；
      你在核页标「本机已对」只存本浏览器，与这里的数字互不写入。本卡核页状态不在此条伪造。
      {ocrMissCount != null
        ? "「OCR 未见」是机检（引文与该页 OCR 原文的 bigram 覆盖 < 0.6，可能 OCR 误差或抽取出错）——不是 seed verified，也不写你的核页标记。"
        : ""}
      {missDetails.length > 0
        ? " 建议摘录为启发式建议——人核后再贴；不会写回 seed / 改 verified / 记核页标记。"
        : ""}
    </>
  );

  return (
    <section
      aria-label="引用状态"
      className="mt-4 rounded-lg border border-line bg-card px-4 py-3 text-sm leading-7"
    >
      {stats.total > 0 ? (
        foldNote ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {items}
            <HonestyDisclosure disclaimer={note} />
          </div>
        ) : (
          <>
            <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">{items}</p>
            <p className="mt-1 text-xs leading-6 text-muted">{note}</p>
          </>
        )
      ) : (
        <p className="text-muted">本卡暂无引用记录（卡引用 / 字段 / 原子均无 cite）。</p>
      )}
      {/* T55 F：复制级补救——OCR 未见逐条展开（p.N · cov · quote · OCR 附近 mono +
          复制建议摘录）。只展示 + 剪贴板，不自动改 seed；未检（无页文本）不渲。 */}
      {missDetails.length > 0 ? (
        <details className="mt-3 rounded-lg border border-amber-300/60 px-3 py-2">
          <summary className="cursor-pointer select-none text-xs leading-6 text-status-warn focus-visible:outline-2 focus-visible:outline-cinnabar">
            补救 · OCR 未见 {ocrMissCount} 条{ocrMissCount != null && ocrMissCount > missDetails.length ? `（列前 ${missDetails.length}）` : ""} · 建议摘录可复制
          </summary>
          <ul className="mt-1.5 space-y-2">
            {missDetails.map((mm, i) => (
              <li key={`${mm.page}:${i}`} className="text-xs leading-5 text-muted">
                <span className="mono">p.{mm.page}</span> · cov {mm.coverage} · “{mm.quote}”
                {mm.ocrSnippet ? (
                  <span className="mono mt-0.5 block text-[11px] leading-5 text-foreground/80">
                    OCR附近：{mm.ocrSnippet}
                  </span>
                ) : null}
                {mm.suggestQuote ? (
                  <span className="mt-0.5 flex flex-wrap items-baseline gap-2">
                    <span className="min-w-0 flex-1">
                      建议摘录（人核后再贴）：<span className="text-foreground/90">“{mm.suggestQuote}”</span>
                    </span>
                    {/* T61 E：建议摘录除复制外可一键「填入草稿 quote」——仍只写本机草稿
                        （原子 cite.quote），未写回 seed / 不翻 verified。 */}
                    {(() => {
                      const tgt = atomTargetOfMiss(mm.page, mm.quote);
                      return tgt ? (
                        <FillAtomQuoteDraft cardId={card.id} atomId={tgt.id} quote={mm.suggestQuote} />
                      ) : null;
                    })()}
                    <CopyTextButton text={mm.suggestQuote} label="复制建议摘录" />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
