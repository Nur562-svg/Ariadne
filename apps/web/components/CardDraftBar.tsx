"use client";

import { useEffect, useState } from "react";
import CopyTextButton from "@/components/CopyTextButton";
import {
  buildAtomDraftPatch,
  buildAtomDraftPatchDoc,
  cardDraftCount,
  clearCardDrafts,
  listIncompleteDraftTargets,
  loadAtomDraftStore,
  subscribeAtomDraftStore,
  type AtomDraftStore,
} from "@/lib/atom-draft";
import type { EntityCard } from "@/lib/entities";

/** 三分列短句（H）：草稿 ≠ seed · ≠ heye 本机已对 · ≠ study 练分。 */
const DRAFT_DISCLAIMER_SHORT = "草稿 ≠ seed 已核 · ≠ heye 本机已对 · ≠ study 练分";

/**
 * G：卡级草稿条（客户端岛；卡详顶部、字段区上方）。本卡有草稿 → muted/琥珀
 * 「本卡本机草稿 N · 未写回 seed」+「复制草稿补丁」（复用 CopyTextButton 诚实契约：
 * 剪贴板不可用不装假已复制；无真改动 → 诚实「无草稿可导出」）+「清除本卡草稿」
 * 两击确认（对齐 RegisterMaterialButton 的布防模式，不弹 window.confirm）。
 * 不完备原子>0 且无草稿 → 次级文字引导（非第二颗大红主 CTA、不硬阻断任何 API）。
 * 质量分 / cite 徽 / 进度条都不读草稿——草稿只在此条与 overlay 显示说话。
 */
export default function CardDraftBar({ card }: { card: EntityCard }) {
  const [store, setStore] = useState<AtomDraftStore>({});
  const [ready, setReady] = useState(false);
  const [armClear, setArmClear] = useState(false);
  const [clearPersisted, setClearPersisted] = useState<boolean | null>(null);

  // mount 后读 + 订阅（对齐 LocalProgressStrip：SSR 渲 null，不碰 window）。
  useEffect(() => {
    setStore(loadAtomDraftStore());
    setReady(true);
    const un = subscribeAtomDraftStore(() => setStore(loadAtomDraftStore()));
    return un;
  }, []);

  if (!ready) return null;

  const count = cardDraftCount(store, card.id);
  // 真改动口径（与补丁导出同源）：草稿存在但与 seed 逐字段 trim 相同 → 不算可导出改动。
  const patchEntries = buildAtomDraftPatchDoc(card, store).entries;
  const realDrafts = patchEntries.length > 0;
  const incompleteNoDraft = listIncompleteDraftTargets(card, store).filter((t) => !t.hasDraft);

  if (count === 0) {
    // 无草稿：只在 seed 口径确有不完备原子时给次级文字引导（不加空条 chrome）。
    if (incompleteNoDraft.length === 0) return null;
    return (
      <section
        aria-label="本机草稿引导"
        className="mt-4 rounded-lg border border-line bg-card px-4 py-3 text-xs leading-6 text-muted"
      >
        本卡有 {incompleteNoDraft.length} 个不完备原子（空 prompt/answer，seed 口径，与
        pnpm cite-check 同数）——可在下方原子区开「本机草稿」补空字段，导出补丁人核后自行
        落盘。{DRAFT_DISCLAIMER_SHORT}
      </section>
    );
  }

  return (
    <section
      aria-label="本机草稿"
      className="mt-4 rounded-lg border border-amber-300/60 bg-card px-4 py-3"
    >
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm leading-6">
        <span className="text-status-warn">本卡本机草稿 {count} · 未写回 seed</span>
        {realDrafts ? (
          <CopyTextButton text={buildAtomDraftPatch(card, store)} label="复制草稿补丁" />
        ) : (
          <span className="text-xs text-muted">无草稿可导出（草稿与 seed 无差异）</span>
        )}
        {armClear ? (
          <button
            type="button"
            onClick={() => {
              const r = clearCardDrafts(card.id);
              setClearPersisted(r.persisted);
              setArmClear(false);
            }}
            className="shrink-0 rounded border border-amber-300 px-1.5 py-0.5 text-xs text-status-warn transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
          >
            确认清除本卡 {count} 条草稿
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setArmClear(true)}
            className="shrink-0 rounded border border-line px-1.5 py-0.5 text-xs text-muted transition-colors hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
          >
            清除本卡草稿
          </button>
        )}
      </p>
      <p className="mt-1 text-xs leading-6 text-muted">
        复制的补丁是 JSON 文档（schema ariadne.atom-draft-patch.v1）——人核后自行改 seed /
        开 PR · 本浏览器不会写回仓库 · 不含 verified 翻改。{DRAFT_DISCLAIMER_SHORT}
      </p>
      {clearPersisted === false ? (
        <p role="alert" className="mt-1 text-xs leading-5 text-status-warn">
          本浏览器存储不可用——清除未持久化（本会话内已生效，刷新后草稿仍在）。
        </p>
      ) : null}
    </section>
  );
}
