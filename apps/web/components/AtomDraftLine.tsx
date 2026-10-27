"use client";

import { useState } from "react";
import { applyAtomDraft, atomDraftDiffers, atomDraftKey } from "@/lib/atom-draft";
import { useAtomDraftStore } from "@/lib/use-atom-draft-store";
import { AtomDraftEditor } from "@/components/AtomDraftEditor";
import { DIFF_ZH, btnMuted, btnQuiet } from "@/components/atom-draft-editor-shared";

/**
 * T82 机械抽出：原 AtomDraftEditor.tsx 内 AtomDraftLine 整段迁此——seed ⊕ draft overlay /
 * 琥珀「已改草稿」旁挂 / 「待补草稿」入口 / 「编辑草稿（本机）」展开内联编辑器——JSX / 文案 /
 * class / aria 与 tip 逐段一致；形参表同 tip。内联编辑器仍住 AtomDraftEditor.tsx，主文件同时
 * re-export 本岛：二者互引只在渲染期访问（函数声明提升），模块求值期无环引用。
 */

/**
 * E：原子行草稿岛——显示 seed ⊕ draft overlay 的 prompt / answer（SSR 先渲 seed，挂载后
 * 有草稿则换 overlay 文）；有真改动草稿 → 琥珀「已改草稿」旁挂（与补丁导出同 trim 口径，
 * 空转草稿不装「已改」）；seed 口径不完备（空 prompt / answer，服务端传入）→ 「待补草稿」
 * 入口；「编辑草稿」展开 D 编辑器。difficulty / id / cite 页码只读。不动 CitePeek / 对页 /
 * T55 补救块（由服务端兄弟节点渲染，契约不变）。
 */
export function AtomDraftLine({
  cardId,
  atomId,
  seedPrompt,
  seedAnswer,
  seedDifficulty,
  seedCitePage,
  seedCiteQuote,
  incomplete,
}: {
  cardId: string;
  atomId: string;
  seedPrompt: string;
  seedAnswer: string;
  seedDifficulty: "what" | "why" | "case";
  seedCitePage: number | null;
  seedCiteQuote?: string;
  /** seed 口径不完备（trim 空 prompt ∨ 空 answer，服务端按 T55 incompleteAtoms 同口径算）。 */
  incomplete?: boolean;
}) {
  // T71：共享 useSyncExternalStore 口（空仓 entry=undefined → 差异/overlay 均回落 seed 原文，同旧 ready=false 分支）。
  const store = useAtomDraftStore();
  const entry = store[atomDraftKey(cardId, atomId)];
  const changed = atomDraftDiffers(
    { prompt: seedPrompt, answer: seedAnswer, citeQuote: seedCiteQuote ?? null },
    entry,
  );
  const display = applyAtomDraft(
    { id: atomId, prompt: seedPrompt, answer: seedAnswer, difficulty: seedDifficulty },
    entry,
  );
  const [open, setOpen] = useState(false);

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 font-medium leading-7">
          <span className="mono mr-2 align-middle text-[11px] text-muted">{atomId}</span>
          {display.prompt}
        </p>
        <span className="flex shrink-0 items-center gap-2">
          {changed ? (
            <span className="rounded border border-amber-300 px-1.5 py-0.5 text-[11px] text-status-warn">
              已改草稿
            </span>
          ) : null}
          <span className="mono rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
            {DIFF_ZH[seedDifficulty]}
          </span>
        </span>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer select-none text-sm text-muted hover:text-cinnabar">
          显示答案
        </summary>
        <p className="mt-2 border-l-2 border-cinnabar/40 pl-3 text-sm leading-7">
          {display.answer}
        </p>
      </details>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={open ? btnQuiet : btnMuted}
          aria-expanded={open}
        >
          {open ? "收起草稿编辑" : "编辑草稿（本机）"}
        </button>
        {incomplete && !changed ? (
          <span
            className="text-xs text-status-warn"
            title="seed 里该原子 prompt/answer 有空（trim 口径，与 pnpm cite-check 不完备原子同数）"
          >
            待补草稿——本原子 seed 有空字段
          </span>
        ) : null}
      </p>
      {open ? (
        <AtomDraftEditor
          cardId={cardId}
          atomId={atomId}
          seedPrompt={seedPrompt}
          seedAnswer={seedAnswer}
          seedDifficulty={seedDifficulty}
          seedCitePage={seedCitePage}
          seedCiteQuote={seedCiteQuote}
        />
      ) : null}
    </div>
  );
}
