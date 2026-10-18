/**
 * 核页本机态存取（客户端专用；与 lib/study.ts 对称，跑在浏览器）：
 * key 仍是 ariadne.heye.v1（与 T12 HeYeSession 一致，勿丢已有本机记录）——
 * Record<citeKey, { s: "checked"|"doubt"; t: number }>。
 * 本模块不 import lib/entities / lib/heye（二者含 fs），保证可被客户端安全引入；
 * 不做 FSRS / Due；「本机已对/存疑」绝不回写 seed JSON，也不改变 cite / verified 语义。
 */

export const HEYE_STORE_KEY = "ariadne.heye.v1";

export type HeYeMark = { s: "checked" | "doubt"; t: number };
export type HeYeStore = Record<string, HeYeMark>;

/** 档位：待核（本机未标）｜已对｜存疑。本机态过滤，非到期调度。 */
export type HeYeMode = "open" | "checked" | "doubt";

export type HeYeFilterable = { key: string };

/** 读本机核页记录；SSR / 隐私模式读失败一律 {}，不抛。 */
export function loadHeYeStore(): HeYeStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(HEYE_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HeYeStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** 写回 localStorage；隐私模式写失败不阻塞（会话内仍以返回值为准）。 */
function saveHeYeStore(next: HeYeStore): HeYeStore {
  try {
    window.localStorage.setItem(HEYE_STORE_KEY, JSON.stringify(next));
  } catch {
    /* 写失败不阻塞；返回值仍供本会话使用 */
  }
  return next;
}

/** 同页多个组件（页头计数 / 核页会话）共享本机态的轻量订阅。 */
const listeners = new Set<() => void>();

export function subscribeHeYeStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitHeYeStoreChanged() {
  for (const l of listeners) l();
}

/** 单条打标（写 localStorage + 广播），返回最新 store。 */
export function setHeYeMark(key: string, s: HeYeMark["s"]): HeYeStore {
  const next = { ...loadHeYeStore(), [key]: { s, t: Date.now() } as HeYeMark };
  emitHeYeStoreChanged();
  return saveHeYeStore(next);
}

/** 同页批量打标（只写本浏览器；多条 key 一次写入），返回最新 store。 */
export function setHeYeMarks(keys: string[], s: HeYeMark["s"]): HeYeStore {
  const next = { ...loadHeYeStore() };
  const t = Date.now();
  for (const k of keys) next[k] = { s, t } as HeYeMark;
  emitHeYeStoreChanged();
  return saveHeYeStore(next);
}

/** 按档位过滤：open=无记录；checked=已对；doubt=存疑（保持传入顺序）。 */
export function filterItemsByMode<T extends HeYeFilterable>(
  items: T[],
  store: HeYeStore,
  mode: HeYeMode,
): T[] {
  if (mode === "checked") return items.filter((it) => store[it.key]?.s === "checked");
  if (mode === "doubt") return items.filter((it) => store[it.key]?.s === "doubt");
  return items.filter((it) => !store[it.key]);
}

/** 范围进度面：待核 / 已对 / 存疑（当前池子，本机态）。 */
export function countPoolMarks<T extends HeYeFilterable>(
  items: T[],
  store: HeYeStore,
): { open: number; checked: number; doubt: number } {
  let open = 0;
  let checked = 0;
  let doubt = 0;
  for (const it of items) {
    const m = store[it.key];
    if (!m) open++;
    else if (m.s === "checked") checked++;
    else doubt++;
  }
  return { open, checked, doubt };
}