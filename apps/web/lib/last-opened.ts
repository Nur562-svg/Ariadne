/**
 * 书库「上次打开的书」续开指针（T21 desk-library-shelf-continuity-01）。
 * 专用 localStorage key `ariadne.desk.last-opened.v1` 存单一书签：
 * `{ bookId, deskHref?, page?, at }`。
 *
 * 边界（与既有存储正交，勿混）：
 * - 不是 ariadne.study.v1 / ariadne.heye.v1（本机练/核记录，跨刷新保留）——本条不得改名/迁移它们。
 * - 不是 ariadne.desk.session.v1（T20 sessionStorage 游标桶，关标签即清）——那是「本标签续位」，
 *   这是「跨日书架读哪本」，二者语义不同、生命周期不同，绝不复用。
 *
 * 本模块不 import fs / entities（保证客户端安全引入）；全部读写 try/catch（隐私模式 localStorage 可能不可用）。
 */

export const LAST_OPENED_KEY = "ariadne.desk.last-opened.v1";

export type LastOpened = {
  bookId: string;
  /** 上次打开时进书桌的深链（缺省可由 bookId 反推 /desk?book=）。 */
  deskHref?: string;
  /** 上次停留的印刷页（深链 /desk?book=&page=）；缺省表示未定位到页。 */
  page?: number;
  /** 写入时刻（epoch ms）。 */
  at: number;
};

/** 读续开指针；SSR / 隐私模式 / 损坏读一律 null。 */
export function loadLastOpened(): LastOpened | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_OPENED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastOpened>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.bookId !== "string" ||
      !parsed.bookId
    ) {
      return null;
    }
    return {
      bookId: parsed.bookId,
      deskHref: typeof parsed.deskHref === "string" ? parsed.deskHref : undefined,
      page:
        typeof parsed.page === "number" && Number.isFinite(parsed.page)
          ? parsed.page
          : undefined,
      at: typeof parsed.at === "number" && Number.isFinite(parsed.at) ? parsed.at : 0,
    };
  } catch {
    return null;
  }
}

/** 显式全量写（书桌命中已注册书时用；带完整 deskHref/page）。 */
export function saveLastOpened(entry: LastOpened): LastOpened {
  try {
    window.localStorage.setItem(LAST_OPENED_KEY, JSON.stringify(entry));
  } catch {
    /* 隐私模式写失败：静默——只是续开增强失效 */
  }
  emitLastOpenedChanged();
  return entry;
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
  return saveLastOpened({
    bookId,
    deskHref: opts?.deskHref ?? (sameBook ? prev?.deskHref : undefined),
    page: opts?.page ?? (sameBook ? prev?.page : undefined),
    at: Date.now(),
  });
}

/** 清除续开指针（书已在书库中删除 → 失效恢复）。 */
export function clearLastOpened(): void {
  try {
    window.localStorage.removeItem(LAST_OPENED_KEY);
  } catch {
    /* 忽略 */
  }
  emitLastOpenedChanged();
}

/** 同页多组件（Sidebar 在读 / 书架续开条）共享续开指针的轻量订阅。 */
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