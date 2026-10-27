/**
 * T83 机械抽出：原 lib/atom-draft.ts store 分区（键 / 类型 / load·persist·subscribe·
 * set·merge·clear·clearCard·saveWhole）整段迁此——行为 / 键名 ariadne.atom-draft.v1 零改。
 * 五禁合同（T61）与消费者入口仍在 @/lib/atom-draft（barrel）：消费者一律从 barrel import。
 */

export const ATOM_DRAFT_STORE_KEY = "ariadne.atom-draft.v1";

/**
 * 单条草稿：只含可编辑字段子集（atom：prompt/answer + 可选 citeQuote 供贴 T55 建议
 * 摘录；field：value）。没有 verified / difficulty / page 等只读字段——草稿永远
 * 翻不了 verified。citeQuote 只覆盖 quote 文本，不造页码、不造抽查结论。
 */
export type DraftEntry = {
  prompt?: string;
  answer?: string;
  value?: string;
  citeQuote?: string;
  t: number;
};

/** Record<draftKey, DraftEntry>；draftKey = `${cardId}/atom:${atomId}` 或 `${cardId}/field:${index}`。 */
export type AtomDraftStore = Record<string, DraftEntry>;

export function atomDraftKey(cardId: string, atomId: string): string {
  return `${cardId}/atom:${atomId}`;
}

export function fieldDraftKey(cardId: string, index: number): string {
  return `${cardId}/field:${index}`;
}

/** 从 draftKey 取回 cardId 前缀（卡 id 是 slug，不含「/」；拆失败返回 null 不抛）。 */
export function draftCardId(key: string): string | null {
  const i = key.indexOf("/");
  return i > 0 ? key.slice(0, i) : null;
}

/** 读本机草稿；SSR / 隐私模式读失败 / 形状不对一律 {}，不抛。 */
export function loadAtomDraftStore(): AtomDraftStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ATOM_DRAFT_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AtomDraftStore;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * 写回 localStorage；隐私模式写失败不抛。返回 persisted=false 让 UI 可感知
 * （「草稿仅本次会话可见，未持久化」——绝不装已持久化）。
 */
function persistAtomDraftStore(next: AtomDraftStore): boolean {
  try {
    window.localStorage.setItem(ATOM_DRAFT_STORE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

/** 同页多个组件（草稿条 / 原子行 / 字段行 / 编辑器）共享本机态的轻量订阅（对齐 heye-store）。 */
const listeners = new Set<() => void>();

export function subscribeAtomDraftStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitAtomDraftChanged() {
  for (const l of listeners) l();
}

export type DraftWriteResult = { persisted: boolean };

/** 整条覆盖保存（编辑器「保存本条草稿」——编辑器掌控全部可编辑字段，故整条替换）。 */
export function setAtomDraft(key: string, fields: Omit<DraftEntry, "t">): DraftWriteResult {
  const next = { ...loadAtomDraftStore(), [key]: { ...fields, t: Date.now() } as DraftEntry };
  emitAtomDraftChanged();
  return { persisted: persistAtomDraftStore(next) };
}

/** 合并字段（如 T55 建议摘录「填入草稿 quote」只动 citeQuote，不动已有 prompt/answer 草稿）。 */
export function mergeAtomDraft(key: string, fields: Omit<DraftEntry, "t">): DraftWriteResult {
  const store = loadAtomDraftStore();
  const prev = store[key] ?? { t: 0 };
  const next = { ...store, [key]: { ...prev, ...fields, t: Date.now() } as DraftEntry };
  emitAtomDraftChanged();
  return { persisted: persistAtomDraftStore(next) };
}

/** 放弃本条草稿（删单 key）。 */
export function clearAtomDraft(key: string): DraftWriteResult {
  const next = { ...loadAtomDraftStore() };
  delete next[key];
  emitAtomDraftChanged();
  return { persisted: persistAtomDraftStore(next) };
}

/** 清除本卡全部草稿（卡级草稿条「清除本卡草稿」——只删本卡前缀，不误伤他卡）。 */
export function clearCardDrafts(cardId: string): DraftWriteResult {
  const next = { ...loadAtomDraftStore() };
  let changed = false;
  for (const k of Object.keys(next)) {
    if (k.startsWith(`${cardId}/`)) {
      delete next[k];
      changed = true;
    }
  }
  if (changed) emitAtomDraftChanged();
  return { persisted: persistAtomDraftStore(next) };
}

/**
 * T62 C：整库覆写口（atom-draft-port 导入专用）——只写 ATOM_DRAFT_STORE_KEY + 广播。
 * 独立成口而非复用 setAtomDraft：导入是「外部整包进入」，语义与单条编辑不同；
 * 仍永不并进 progress-port 的 study/heye 包（ProgressPayload 形状不动）。
 */
export function saveWholeAtomDraftStore(next: AtomDraftStore): DraftWriteResult {
  emitAtomDraftChanged();
  return { persisted: persistAtomDraftStore(next) };
}
