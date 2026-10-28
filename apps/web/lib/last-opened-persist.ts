/**
 * T88 机械抽出：原 lib/last-opened.ts persist 分区（RECENT_MAX（仍私有）· parseEntry（私）·
 * loadLastOpened · loadRecentBooks · persistLastOpened（私）· saveLastOpened ·
 * touchLastOpened · clearLastOpened · listeners（私）· subscribeLastOpened ·
 * emitLastOpenedChanged（私））整段迁此——SSR 守卫（typeof window）/ try-catch /
 * Date.now / bookId 空拒写 / 去重截栈口径零改；emit 仅 persistLastOpened /
 * clearLastOpened 路径调用，subscribe 与 emit 同文件。
 * keys 与 LastOpened 自 types；**禁止**本件 import heal（DAG 单向 types ← persist ← heal）。
 * 本模块职责允许既有 typeof window / localStorage / Date.now / try-catch；
 * 无 "use client" 指令 / 无 fs / 无 process.env / 无网络 / 无 LLM。
 * 边界铁律 header 与消费者入口仍在 @/lib/last-opened（barrel）。
 */

import { LAST_OPENED_KEY, RECENT_BOOKS_KEY, type LastOpened } from "./last-opened-types.ts";

const RECENT_MAX = 5;

/** SSR / 隐私模式 / 损坏读一律 null。 */
function parseEntry(raw: unknown): LastOpened | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<LastOpened>;
  if (typeof parsed.bookId !== "string" || !parsed.bookId) return null;
  return {
    bookId: parsed.bookId,
    deskHref: typeof parsed.deskHref === "string" ? parsed.deskHref : undefined,
    page:
      typeof parsed.page === "number" && Number.isFinite(parsed.page) ? parsed.page : undefined,
    at: typeof parsed.at === "number" && Number.isFinite(parsed.at) ? parsed.at : 0,
  };
}

/** 读续开指针（= 最近栈栈顶；SSR / 隐私模式 / 损坏读一律 null）。 */
export function loadLastOpened(): LastOpened | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_OPENED_KEY);
    if (!raw) return null;
    return parseEntry(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** 读最近书栈（id → 最近读过的书，栈顶最新；SSR / 隐私模式 / 损坏读一律 []）。 */
export function loadRecentBooks(): LastOpened[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_BOOKS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const out: LastOpened[] = [];
    for (const x of arr) {
      const e = parseEntry(x);
      if (e) out.push(e);
    }
    return out.slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

/**
 * 单指针 + 最近栈一起落盘（二者保持一致，栈顶 = 单指针）。
 * 栈：去重（同 bookId 移到栈顶），截断到 RECENT_MAX；换书后再回来，被换下书仍带着它的 deskHref/page。
 */
function persistLastOpened(entry: LastOpened): LastOpened {
  try {
    window.localStorage.setItem(LAST_OPENED_KEY, JSON.stringify(entry));
  } catch {
    /* 隐私模式写失败：静默——只是续开增强失效 */
  }
  try {
    const stack = loadRecentBooks();
    const next = [entry, ...stack.filter((e) => e.bookId !== entry.bookId)].slice(0, RECENT_MAX);
    window.localStorage.setItem(RECENT_BOOKS_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  emitLastOpenedChanged();
  return entry;
}

/** 显式全量写（书桌命中已注册书时用；带完整 deskHref/page）。 */
export function saveLastOpened(entry: LastOpened): LastOpened {
  return persistLastOpened(entry);
}

/**
 * 轻触续开（/study?book=、/review?book= 鼓励同 bookId）：
 * 刷新 `at`；同一本书时保留原 `deskHref/page`（学习/核页只证明「在读这本书」，
 * 不覆盖书桌上更精确的停留页），换书时不残留旧书的页/链。
 */
export function touchLastOpened(
  bookId: string,
  opts?: { deskHref?: string; page?: number },
): LastOpened {
  const prev = loadLastOpened();
  const sameBook = prev?.bookId === bookId;
  return persistLastOpened({
    bookId,
    deskHref: opts?.deskHref ?? (sameBook ? prev?.deskHref : undefined),
    page: opts?.page ?? (sameBook ? prev?.page : undefined),
    at: Date.now(),
  });
}

/** 清除续开单指针（书已不在书库 → 失效恢复）。最近栈由消费方按真实书库过滤，无需在此清理。 */
export function clearLastOpened(): void {
  try {
    window.localStorage.removeItem(LAST_OPENED_KEY);
  } catch {
    /* 忽略 */
  }
  emitLastOpenedChanged();
}

/** 同页多组件（Sidebar 在读 / 书架续开条 / 换书列表）共享续开指针的轻量订阅。 */
const listeners = new Set<() => void>();

export function subscribeLastOpened(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitLastOpenedChanged() {
  for (const l of listeners) l();
}