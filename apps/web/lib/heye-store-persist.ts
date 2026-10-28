/**
 * T91 机械抽出：原 lib/heye-store.ts persist 分区（loadHeYeStore · 私有 saveHeYeStore /
 * listeners / emitHeYeStoreChanged · subscribeHeYeStore · notifyHeYeExternalChange ·
 * setHeYeMark · setHeYeMarks · clearHeYeMarks）整段迁此——emit→save 顺序逐字一致、
 * clearHeYeMarks 范围清除口径零改；私有 save / emit / listeners 不经 barrel 外泄。
 * 本件独占 IO + 订阅总线（← ./heye-store-types.ts；禁 import pure）。
 * 无 "use client"（tip 无指令，保持无）。
 */

import { HEYE_STORE_KEY, type HeYeMark, type HeYeStore } from "./heye-store-types.ts";

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

/** 进度导入（lib/progress-port）等绕过 setHeYeMark 的外部整键写入后广播，让订阅组件重读本机库。 */
export function notifyHeYeExternalChange(): void {
  emitHeYeStoreChanged();
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

/**
 * 范围清除（review-fix-integrity G）：只删给定 keys（当前队列范围的 citeKey），
 * 其它书/范围的记录保留；keys 为空等价于无操作。与整钥 removeItem 不同，
 * 「清除本范围核页记录」不再误伤全局。
 */
export function clearHeYeMarks(keys: string[]): HeYeStore {
  const next = { ...loadHeYeStore() };
  let changed = false;
  for (const k of keys) {
    if (k in next) {
      delete next[k];
      changed = true;
    }
  }
  if (changed) emitHeYeStoreChanged();
  return saveHeYeStore(next);
}
