"use client";

import { useState } from "react";
import { atomDraftKey, mergeAtomDraft } from "@/lib/atom-draft";
import { btnMuted } from "@/components/atom-draft-editor-shared";

/**
 * T82 机械抽出：原 AtomDraftEditor.tsx 内 FillAtomQuoteDraft 整段迁此——「填入草稿 quote」
 * merge 本机草稿 citeQuote / 已填入旁注 / 隐私模式未持久化 alert——JSX / 文案 / title / class
 * 与 tip 逐段一致；形参表同 tip。
 */

/**
 * E：T55 补救面板「填入草稿 quote」小岛——把建议摘录写进对应原子的草稿 citeQuote
 * （merge，不动该原子已有 prompt/answer 草稿）。仍只写本机草稿；未写回 seed /
 * 不翻 verified / 不记核页标记。写失败（隐私模式）可见错误。
 */
export function FillAtomQuoteDraft({
  cardId,
  atomId,
  quote,
}: {
  cardId: string;
  atomId: string;
  quote: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "unpersisted">("idle");
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => {
          const r = mergeAtomDraft(atomDraftKey(cardId, atomId), { citeQuote: quote });
          setState(r.persisted ? "done" : "unpersisted");
        }}
        title={`只写本机草稿（原子 ${atomId} 的 cite.quote）；不写回 seed、不翻 verified`}
        className={btnMuted}
      >
        填入草稿 quote
      </button>
      {state === "done" ? (
        <span className="text-[11px] text-muted">已填入本机草稿（未写回 seed）</span>
      ) : null}
      {state === "unpersisted" ? (
        <span role="alert" className="text-[11px] text-status-warn">
          本浏览器存储不可用——未持久化，刷新即丢
        </span>
      ) : null}
    </span>
  );
}
