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

/** 从 deskHref 里取 page= 参数（无则 null）。非全局正则 match，语义等同 RegExp.exec。 */
function pageInHref(href: string): number | null {
  const m = href.match(/[?&]page=(\d+)/);
  return m ? Number(m[1]) : null;
}

/**
 * T31 C：续开/最近栈**读侧**幽灵页消毒（T30 D 封了写点，这里封旧栈消费）：
 * entry.page 或 entry.deskHref 里的 page= 不在该书已解析页集合（validPages，服务端
 * loadBookValidPages 装配）时，剥掉 page、deskHref 回落 undefined（消费方按书级反推）。
 * 纯函数不改栈；发现脏时由调用方**单条** saveLastOpened(sanitized) heal（禁
 * clearLastOpened 整栈、禁改 key 名、不动其它书条目）。validPages 缺省 = 无表——
 * 原样返回，由调用方自行决定是否信任 page（如 ReturnNav 无表只信 pageHint）。
 */
export function sanitizeOpenedPage(entry: LastOpened, validPages?: number[]): LastOpened {
  if (validPages == null) return entry;
  const valid = new Set(validPages);
  const okPage = (n: number | null | undefined) => n != null && valid.has(n);
  // entry.page == null = 无页可剥（视作干净）；只有「有 page 且非法」才剥 page。
  const entryPageOk = entry.page == null ? true : okPage(entry.page);
  const hrefPage = entry.deskHref ? pageInHref(entry.deskHref) : null;
  const hrefPageOk = hrefPage == null || okPage(hrefPage);
  // 干净条目原引用返回——调用方以 !== 判脏触发单条 heal，重建新对象会让 heal 循环。
  if (entryPageOk && hrefPageOk) return entry;
  return {
    ...entry,
    page: entryPageOk ? entry.page : undefined,
    deskHref: hrefPageOk ? entry.deskHref : undefined,
  };
}

/**
 * T32 A：读侧消毒 + 单条写回（heal）——把「只消毒展示」的读点统一成「消毒且盘内 peel」。
 * 内部 sanitizeOpenedPage；脏（sanitized !== entry）→ saveLastOpened({ ...sanitized, at: Date.now() })
 * 只改该书条目并保序其余书（禁 clearLastOpened 整栈、禁改 key 名）；干净原引用返回
 * （调用方以 !== / 引用稳定防 heal 循环）。validPages 缺省 = 无表 → 原引用返回不写盘。
 * 与 T31 Sidebar / LibraryContinuity 手写 sanitize+save 同口径，收敛成一处。
 */
export function healOpenedIfDirty(entry: LastOpened, validPages?: number[]): LastOpened {
  const sanitized = sanitizeOpenedPage(entry, validPages);
  if (sanitized === entry) return entry;
  return saveLastOpened({ ...sanitized, at: Date.now() });
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