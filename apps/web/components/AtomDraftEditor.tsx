"use client";

import { useEffect, useState } from "react";
import {
  applyAtomDraft,
  applyFieldDraft,
  atomDraftDiffers,
  atomDraftKey,
  clearAtomDraft,
  fieldDraftDiffers,
  fieldDraftKey,
  loadAtomDraftStore,
  mergeAtomDraft,
  setAtomDraft,
} from "@/lib/atom-draft";
import { useAtomDraftStore } from "@/lib/use-atom-draft-store";

const DIFF_ZH = { what: "识记", why: "机制", case: "应用" } as const;

/** 三分列短句（H）：草稿 ≠ seed · ≠ heye 本机已对 · ≠ study 练分（多处复用，不另造措辞）。 */
const DRAFT_DISCLAIMER = "草稿 ≠ seed 已核 · 草稿 ≠ heye 本机已对 · 草稿 ≠ study 练分";

/** 隐私模式写失败的可感错误行（H）：不装已持久化。 */
function PersistWarn({ persisted }: { persisted: boolean | null }) {
  if (persisted !== false) return null;
  return (
    <p role="alert" className="mt-2 text-xs leading-5 text-status-warn">
      本浏览器存储不可用——草稿仅本次会话可见，未持久化（刷新即丢）。
    </p>
  );
}

const btnMuted =
  "shrink-0 rounded border border-line px-1.5 py-0.5 text-xs text-cinnabar transition-colors hover:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none";
const btnQuiet =
  "shrink-0 rounded border border-line px-1.5 py-0.5 text-xs text-muted transition-colors hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none";

const textareaCls =
  "mt-1 w-full rounded border border-line bg-card px-2 py-1.5 text-sm leading-6 text-foreground focus-visible:outline-2 focus-visible:outline-cinnabar";

function nonBlank(s: string | undefined): boolean {
  return s != null && s.trim().length > 0;
}

/**
 * D：原子草稿编辑器（内联于原子行下方）。可编 prompt / answer / cite.quote（可选，
 * 便于贴 T55 建议摘录）——全部只进本机草稿；id / difficulty / cite.page 只读展示。
 * 顶部硬横幅写死「本机草稿 · 未写回 seed · 不等于抽查 verified · 不等于本机已对」。
 * 无 verified 开关、无「提交到服务器」类 CTA——保存只写 localStorage 新键
 * ariadne.atom-draft.v1，永不 PATCH entities / blocks、永不 Clew 真写。
 */
function AtomDraftEditor({
  cardId,
  atomId,
  seedPrompt,
  seedAnswer,
  seedDifficulty,
  seedCitePage,
  seedCiteQuote,
}: {
  cardId: string;
  atomId: string;
  seedPrompt: string;
  seedAnswer: string;
  seedDifficulty: "what" | "why" | "case";
  seedCitePage: number | null;
  seedCiteQuote?: string;
}) {
  const key = atomDraftKey(cardId, atomId);
  const [prompt, setPrompt] = useState(seedPrompt);
  const [answer, setAnswer] = useState(seedAnswer);
  const [citeQuote, setCiteQuote] = useState(seedCiteQuote ?? "");
  const [seeded, setSeeded] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  // 打开时以「seed ⊕ 已有草稿」为初值（草稿优先）；草稿为空串的字段回落 seed 文本，
  // 让编辑器始终从可读全文出发，而不是从空白吞掉 seed。
  // T71 DEFER: form-seed — 非 uSES（受控表单初值一次性回填，留 effect）。
  useEffect(() => {
    if (seeded) return;
    const cur = loadAtomDraftStore()[key];
    if (cur) {
      if (nonBlank(cur.prompt)) setPrompt(cur.prompt as string);
      if (nonBlank(cur.answer)) setAnswer(cur.answer as string);
      if (nonBlank(cur.citeQuote)) setCiteQuote(cur.citeQuote as string);
    }
    setSeeded(true);
  }, [key, seeded]);

  return (
    <div className="mt-2 rounded-lg border border-amber-300/60 bg-status-warn-bg/40 px-3 py-2.5">
      <p className="text-xs leading-5 text-status-warn">
        本机草稿 · 未写回 seed · 不等于抽查 verified · 不等于本机已对
      </p>
      <p className="mono mt-1 text-[11px] leading-5 text-muted">
        {atomId} · {DIFF_ZH[seedDifficulty]}（只读）·{" "}
        {seedCitePage != null ? `cite p.${seedCitePage}（seed，只读）` : "cite 无页（seed，只读）"}
      </p>
      <label className="mt-2 block text-xs text-muted">
        prompt（题面）
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} className={textareaCls} />
      </label>
      <label className="mt-2 block text-xs text-muted">
        answer（答案）
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} className={textareaCls} />
      </label>
      <label className="mt-2 block text-xs text-muted">
        cite.quote 草稿（可选 · 可贴 T55 建议摘录 · 只改引文文本，不造页码、不翻 verified）
        <textarea value={citeQuote} onChange={(e) => setCiteQuote(e.target.value)} rows={2} className={textareaCls} />
      </label>
      <p className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const r = setAtomDraft(key, { prompt, answer, citeQuote: citeQuote || undefined });
            setPersisted(r.persisted);
          }}
          className={btnMuted}
        >
          保存本条草稿
        </button>
        <button
          type="button"
          onClick={() => {
            const r = clearAtomDraft(key);
            setPersisted(r.persisted);
            setPrompt(seedPrompt);
            setAnswer(seedAnswer);
            setCiteQuote(seedCiteQuote ?? "");
          }}
          className={btnQuiet}
        >
          放弃本条草稿
        </button>
        <span className="text-[11px] text-muted">{DRAFT_DISCLAIMER}</span>
      </p>
      <PersistWarn persisted={persisted} />
    </div>
  );
}

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

/**
 * F：字段草稿岛（最小面）——value 可草稿（overlay 显示 + 极简编辑器）；label 只读。
 * 有真改动草稿 → 琥珀「已改草稿」旁挂（与原子区同族样式、同 trim 口径）。0 字段诚实句
 * 由服务端保留（T47），本岛不参与空表 densify、不加第二颗实心主 CTA。
 */
export function FieldDraftLine({
  cardId,
  fieldIndex,
  seedValue,
}: {
  cardId: string;
  fieldIndex: number;
  seedValue: string;
}) {
  const key = fieldDraftKey(cardId, fieldIndex);
  // T71：共享 useSyncExternalStore 口（空仓 entry=undefined → 回落 seed 原文，同旧 ready=false 分支）。
  const store = useAtomDraftStore();
  const entry = store[key];
  const changed = fieldDraftDiffers(seedValue, entry);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(seedValue);
  const [seeded, setSeeded] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  // T71 DEFER: form-seed — 非 uSES（受控输入框初值一次性回填，留 effect）。
  useEffect(() => {
    if (seeded) return;
    const cur = loadAtomDraftStore()[key];
    if (cur && nonBlank(cur.value)) setValue(cur.value as string);
    setSeeded(true);
  }, [key, seeded]);

  return (
    <div>
      <p className="text-sm leading-7 text-foreground/90">
        {entry ? applyFieldDraft({ label: "", value: seedValue }, entry).value : seedValue}
        {changed ? (
          <span className="ml-2 rounded border border-amber-300 px-1.5 py-0.5 align-middle text-[11px] text-status-warn">
            已改草稿
          </span>
        ) : null}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={open ? btnQuiet : btnMuted}
          aria-expanded={open}
        >
          {open ? "收起草稿编辑" : "编辑字段草稿（本机）"}
        </button>
        <span className="text-[11px] text-muted">label 只读 · {DRAFT_DISCLAIMER}</span>
      </p>
      {open ? (
        <div className="mt-2 rounded-lg border border-amber-300/60 bg-status-warn-bg/40 px-3 py-2.5">
          <p className="text-xs leading-5 text-status-warn">
            本机草稿 · 未写回 seed · 不等于抽查 verified · 不等于本机已对
          </p>
          <label className="mt-2 block text-xs text-muted">
            value（字段内容）
            <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} className={textareaCls} />
          </label>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const r = setAtomDraft(key, { value });
                setPersisted(r.persisted);
              }}
              className={btnMuted}
            >
              保存本条草稿
            </button>
            <button
              type="button"
              onClick={() => {
                const r = clearAtomDraft(key);
                setPersisted(r.persisted);
                setValue(seedValue);
              }}
              className={btnQuiet}
            >
              放弃本条草稿
            </button>
          </p>
          <PersistWarn persisted={persisted} />
        </div>
      ) : null}
    </div>
  );
}

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
