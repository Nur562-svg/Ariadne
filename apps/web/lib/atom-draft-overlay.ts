/**
 * T83 机械抽出：原 lib/atom-draft.ts overlay helpers 分区（Draftable* / nonEmptyDraft /
 * apply* / cardDraftCount / incomplete* / *Differs / listDraftedCardIds）整段迁此——
 * overlay 语义 = seed ⊕ draft、服务端 loadCards 只读不变，行为零改。
 * nonEmptyDraft 由模块私有改为 named export：供 atom-draft-patch 的 pushIfChanged 复用
 * 同一口径（不复制分叉两份语义）。五禁合同与消费者入口仍在 @/lib/atom-draft（barrel）。
 */

import type { Atom, Cite, EntityCard } from "@/lib/entities";
import { atomDraftKey, draftCardId, type AtomDraftStore, type DraftEntry } from "./atom-draft-store.ts";

// ---- overlay helpers（显示 = seed ⊕ draft overlay；服务端 loadCards 只读不变） ----

/** 与打分相关的最小原子形状（结构兼容 lib/entities 的 Atom；不 import 含 fs 的模块）。 */
export type DraftableAtom = Pick<Atom, "id" | "prompt" | "answer" | "difficulty"> & {
  cite?: Cite;
};
/** 与打分相关的最小字段形状（结构兼容 EntityCard.fields 项）。 */
export type DraftableField = { label: string; value: string; cite?: Cite };

/** 草稿字段非空（trim 后有内容）——overlay 覆盖判定与 patch 真改动判定同口径。 */
export function nonEmptyDraft(s: string | undefined): boolean {
  return s != null && s.trim().length > 0;
}

/**
 * 原子 overlay：有草稿字段覆盖 seed，无草稿保持 seed。citeQuote 仅在 seed 已有 cite 时
 * 覆盖 quote 文本（seed 无 cite 不凭空造 cite——页码 / verified 永远来自 seed）。
 */
export function applyAtomDraft(
  seedAtom: DraftableAtom,
  entry: DraftEntry | undefined,
): DraftableAtom {
  if (!entry) return seedAtom;
  return {
    ...seedAtom,
    prompt: nonEmptyDraft(entry.prompt) ? (entry.prompt as string) : seedAtom.prompt,
    answer: nonEmptyDraft(entry.answer) ? (entry.answer as string) : seedAtom.answer,
    cite:
      nonEmptyDraft(entry.citeQuote) && seedAtom.cite
        ? { ...seedAtom.cite, quote: entry.citeQuote as string }
        : seedAtom.cite,
  };
}

/** 字段 overlay：value 可草稿；label 只读（F 最小面）。 */
export function applyFieldDraft(
  seedField: DraftableField,
  entry: DraftEntry | undefined,
): DraftableField {
  if (!entry) return seedField;
  return {
    ...seedField,
    value: nonEmptyDraft(entry.value) ? (entry.value as string) : seedField.value,
  };
}

/** 本卡草稿条数（atom + field 全部 target，前缀精确匹配本卡）。 */
export function cardDraftCount(store: AtomDraftStore, cardId: string): number {
  let n = 0;
  for (const k of Object.keys(store)) {
    if (k.startsWith(`${cardId}/`)) n++;
  }
  return n;
}

/** seed 口径单原子不完备（对齐 T55 scoreCard 的 incompleteAtoms：trim 空 prompt ∨ 空 answer）。 */
export function atomIncomplete(a: DraftableAtom): boolean {
  return (a.prompt ?? "").trim().length === 0 || (a.answer ?? "").trim().length === 0;
}

export type IncompleteDraftTarget = {
  atomId: string;
  key: string;
  emptyPrompt: boolean;
  emptyAnswer: boolean;
  /** 该原子已有本机草稿（旁挂用；草稿是否真的补上了空字段由 overlay 显示说话）。 */
  hasDraft: boolean;
};

/**
 * 列出 seed 口径不完备原子（trim 空 prompt/answer，与 T55 incompleteAtoms 同口径不另造
 * 分叉）；供卡级草稿条「可开本机草稿补空字段」引导与编辑入口点名。零原子卡返回空
 * （没有 atoms 可数，不编造目标）。
 */
export function listIncompleteDraftTargets(
  card: Pick<EntityCard, "id" | "atoms">,
  store?: AtomDraftStore,
): IncompleteDraftTarget[] {
  const s = store ?? {};
  const out: IncompleteDraftTarget[] = [];
  for (const a of card.atoms ?? []) {
    const emptyPrompt = (a.prompt ?? "").trim().length === 0;
    const emptyAnswer = (a.answer ?? "").trim().length === 0;
    if (!emptyPrompt && !emptyAnswer) continue;
    const key = atomDraftKey(card.id, a.id);
    out.push({ atomId: a.id, key, emptyPrompt, emptyAnswer, hasDraft: key in s });
  }
  return out;
}

/** 原子草稿是否至少有一个字段真改动（trim 比较 seed；空草稿字段不算——「已改草稿」旁挂与补丁导出同口径）。 */
export function atomDraftDiffers(
  seed: { prompt: string; answer: string; citeQuote?: string | null },
  entry: DraftEntry | undefined,
): boolean {
  if (!entry) return false;
  let changed = false;
  if (nonEmptyDraft(entry.prompt)) changed = (entry.prompt as string).trim() !== seed.prompt.trim() || changed;
  if (nonEmptyDraft(entry.answer)) changed = (entry.answer as string).trim() !== seed.answer.trim() || changed;
  if (nonEmptyDraft(entry.citeQuote) && seed.citeQuote != null)
    changed = (entry.citeQuote as string).trim() !== seed.citeQuote.trim() || changed;
  if (nonEmptyDraft(entry.citeQuote) && seed.citeQuote == null) changed = true;
  return changed;
}

/** 字段草稿是否真改动（同 atomDraftDiffers 口径）。 */
export function fieldDraftDiffers(seedValue: string, entry: DraftEntry | undefined): boolean {
  if (!entry) return false;
  return nonEmptyDraft(entry.value) && (entry.value as string).trim() !== seedValue.trim();
}

/** store 里出现过的全部卡 id（draftKey 前缀去重；顺序稳定按首次出现）。 */
export function listDraftedCardIds(store: AtomDraftStore): string[] {
  const seen: string[] = [];
  const set = new Set<string>();
  for (const k of Object.keys(store)) {
    const cid = draftCardId(k);
    if (cid && !set.has(cid)) {
      set.add(cid);
      seen.push(cid);
    }
  }
  return seen;
}
