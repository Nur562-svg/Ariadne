/**
 * 书库「上次打开的书」续开指针（T21 desk-library-shelf-continuity-01）
 * + 最近书栈（T22 desk-ingest-shelf-register，多书换书 / 换书保留他书停留页）。
 *
 * 两条 localStorage key（与既有存储正交，勿混）：
 * - ariadne.desk.last-opened.v1 — 单一 bookId 指针（T21 骨架，loadLastOpened 仍返回栈顶）。
 * - ariadne.desk.recent-books.v1 — 最近栈（最多 5 条，去重，栈顶即「继续上次」）。
 *
 * 边界：
 * - 不是 ariadne.study.v1 / ariadne.heye.v1（本机练/核记录）——不得改名/迁移它们。
 * - 不是 ariadne.desk.session.v1（T20 sessionStorage 游标桶，关标签即清）——那是「本标签续位」，
 *   这是「跨日书架读哪本 + 换书不丢他书续开」，语义/生命周期不同，绝不复用。
 *
 * 本模块不 import fs / entities（客户端安全引入）；全部读写 try/catch（隐私模式 localStorage 可能不可用）。
 */

export const LAST_OPENED_KEY = "ariadne.desk.last-opened.v1";
export const RECENT_BOOKS_KEY = "ariadne.desk.recent-books.v1";
const RECENT_MAX = 5;

export type LastOpened = {
  bookId: string;
  /** 上次打开时进书桌的深链（缺省可由 bookId 反推 /desk?book=）。 */
  deskHref?: string;
  /** 上次停留的印刷页（深链 /desk?book=&page=）；缺省表示未定位到页。 */
  page?: number;
  /** 写入时刻（epoch ms）。 */
  at: number;
};

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