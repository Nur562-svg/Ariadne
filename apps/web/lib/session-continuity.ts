/**
 * 练 / 核会话续位与 sticky 档位（T20 desk-session-continuity-01）。
 * 只写 sessionStorage（同一标签页内刷新 / 客户端路由不丢队列位；关标签即清）。
 * 绝不新建 localStorage 进度仓；也不改名 ariadne.study.v1 / ariadne.heye.v1。
 *
 * - cursor：Study/HeYe 队列游标，scopeKey 与父级 remount key 对齐
 *   （Study=`${card|all}:${book|all}:${chapter|all}:${mode}`；
 *    HeYe=`${book|all}:${card|all}:${page|all}:${chapter|all}:${mode}`）。
 * - sticky mode：档位记忆，scopeKey **不含** mode（同范围共享上次档位）。
 *
 * 全部读写 try/catch（隐私模式 sessionStorage 可能不可用）：读失败返回 null/缺省，
 * 写失败静默——只是“跨刷新续位”这一增强失效，不影响本会话打分 / 核对本身。
 */

export const SESSION_CONTINUITY_KEY = "ariadne.desk.session.v1";

export type SessionKind = "study" | "heye";

type Bucket = {
  v: 1;
  cursors: Record<SessionKind, Record<string, number>>;
  sticky: Record<SessionKind, Record<string, string>>;
};

function emptyBucket(): Bucket {
  return { v: 1, cursors: { study: {}, heye: {} }, sticky: { study: {}, heye: {} } };
}

function readBucket(): Bucket | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CONTINUITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Bucket>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      v: 1,
      cursors: {
        study: (parsed.cursors?.study as Record<string, number>) ?? {},
        heye: (parsed.cursors?.heye as Record<string, number>) ?? {},
      },
      sticky: {
        study: (parsed.sticky?.study as Record<string, string>) ?? {},
        heye: (parsed.sticky?.heye as Record<string, string>) ?? {},
      },
    };
  } catch {
    return null;
  }
}

function writeBucket(mutate: (b: Bucket) => void): void {
  if (typeof window === "undefined") return;
  const b = readBucket() ?? emptyBucket();
  mutate(b);
  try {
    window.sessionStorage.setItem(SESSION_CONTINUITY_KEY, JSON.stringify(b));
  } catch {
    /* 隐私模式等写失败：静默——本会话内仍能自评/核对 */
  }
}

/** 读某范围游标；无记录或非法返回 null。 */
export function loadCursor(kind: SessionKind, scopeKey: string): number | null {
  const b = readBucket();
  if (!b) return null;
  const v = b.cursors[kind]?.[scopeKey];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function saveCursor(kind: SessionKind, scopeKey: string, idx: number): void {
  writeBucket((b) => {
    b.cursors[kind][scopeKey] = idx;
  });
}

export function clearCursor(kind: SessionKind, scopeKey: string): void {
  writeBucket((b) => {
    delete b.cursors[kind][scopeKey];
  });
}

/** 读某范围 sticky 档；无记录返回 null。 */
export function loadStickyMode(kind: SessionKind, scopeKey: string): string | null {
  const b = readBucket();
  if (!b) return null;
  const v = b.sticky[kind]?.[scopeKey];
  return typeof v === "string" ? v : null;
}

export function saveStickyMode(kind: SessionKind, scopeKey: string, mode: string): void {
  writeBucket((b) => {
    b.sticky[kind][scopeKey] = mode;
  });
}

export function clearStickyMode(kind: SessionKind, scopeKey: string): void {
  writeBucket((b) => {
    delete b.sticky[kind][scopeKey];
  });
}