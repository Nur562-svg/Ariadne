"use client";

import { useState } from "react";
import { atomDraftKey, clearAtomDraft, loadAtomDraftStore, setAtomDraft } from "@/lib/atom-draft";
import {
  DIFF_ZH,
  DRAFT_DISCLAIMER,
  PersistWarn,
  btnMuted,
  btnQuiet,
  nonBlank,
  textareaCls,
} from "@/components/atom-draft-editor-shared";

/**
 * T82 机械拆：三草稿岛 AtomDraftLine / FieldDraftLine / FillAtomQuoteDraft 整段抽至同名文件，
 * 此处 named re-export 守恒（EntityCardDetail 仍自 @/components/AtomDraftEditor 导入三岛，零 diff）；
 * 顶部常量 / PersistWarn / nonBlank 抽至 atom-draft-editor-shared。本件只留内联编辑器，并加
 * named export 供 AtomDraftLine 引用——本件 ⇄ AtomDraftLine 互引只在渲染期访问（函数声明
 * 提升），模块求值期无环引用。
 */
export { AtomDraftLine } from "@/components/AtomDraftLine";
export { FieldDraftLine } from "@/components/FieldDraftLine";
export { FillAtomQuoteDraft } from "@/components/FillAtomQuoteDraft";

/**
 * D：原子草稿编辑器（内联于原子行下方）。可编 prompt / answer / cite.quote（可选，
 * 便于贴 T55 建议摘录）——全部只进本机草稿；id / difficulty / cite.page 只读展示。
 * 顶部硬横幅写死「本机草稿 · 未写回 seed · 不等于抽查 verified · 不等于本机已对」。
 * 无 verified 开关、无「提交到服务器」类 CTA——保存只写 localStorage 新键
 * ariadne.atom-draft.v1，永不 PATCH entities / blocks、永不 Clew 真写。
 */
export function AtomDraftEditor({
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
  // T72：form-seed 改 lazy 初值——「seed ⊕ 已有草稿」（草稿非空优先；空串字段回落 seed
  // 文本，编辑器始终从可读全文出发）。编辑器只在点开「编辑草稿（本机）」后挂载
  // （纯客户端、无 SSR 面水合不参与）；每次点开重挂 → 初值重读，用户编辑中途不再
  // 被 effect 冲掉。读盘失败（隐私模式）= 空草稿 → seed 原文（fail-closed）。
  const [seeded0] = useState(() => {
    const cur = loadAtomDraftStore()[key];
    return {
      prompt: cur && nonBlank(cur.prompt) ? (cur.prompt as string) : seedPrompt,
      answer: cur && nonBlank(cur.answer) ? (cur.answer as string) : seedAnswer,
      citeQuote:
        cur && nonBlank(cur.citeQuote) ? (cur.citeQuote as string) : (seedCiteQuote ?? ""),
    };
  });
  const [prompt, setPrompt] = useState(seeded0.prompt);
  const [answer, setAnswer] = useState(seeded0.answer);
  const [citeQuote, setCiteQuote] = useState(seeded0.citeQuote);
  const [persisted, setPersisted] = useState<boolean | null>(null);

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
