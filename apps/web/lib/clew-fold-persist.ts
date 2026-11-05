/**
 * T106a：Clew 折叠偏好（全局，localStorage）。
 * key 与既有存储正交：ariadne.desk.clew-fold.v1 = "open" | "folded"；缺省/损坏/隐私模式 = null（未选择）。
 * 本模块允许 typeof window / localStorage / try-catch；无 fs / 无网络 / 无 LLM。
 */

export const CLEW_FOLD_KEY = "ariadne.desk.clew-fold.v1";
export type ClewFoldChoice = "open" | "folded";

/** 用户从未点过开关时的默认。T106a 恒展开（= tip 行为）；T106b 才会让卡页默认折叠。 */
export const CLEW_DEFAULT_OPEN = true;

const listeners = new Set<() => void>();
/** 隐私模式写失败时的本标签内存兜底，保证开关仍可用（fail-closed：不静默失灵）。 */
let memory: ClewFoldChoice | null = null;

function parse(raw: string | null): ClewFoldChoice | null {
  return raw === "open" || raw === "folded" ? raw : null;
}

/** 快照必须值稳定（原始值）。SSR / 损坏 / 读失败 → memory ?? null。 */
export function loadClewFold(): ClewFoldChoice | null {
  if (memory) return memory;
  if (typeof window === "undefined") return null;
  try {
    return parse(window.localStorage.getItem(CLEW_FOLD_KEY));
  } catch {
    return null;
  }
}

export function saveClewFold(choice: ClewFoldChoice): void {
  memory = choice;
  try {
    window.localStorage.setItem(CLEW_FOLD_KEY, choice);
  } catch {
    /* 隐私模式写失败：静默——仅本标签内存生效 */
  }
  listeners.forEach((l) => l());
}

/** 订阅：本标签 save + 跨标签 storage 事件（跨标签时清 memory，让盘面为准）。 */
export function subscribeClewFold(cb: () => void): () => void {
  listeners.add(cb);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(cb);
    };
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === CLEW_FOLD_KEY || e.key === null) {
      memory = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}
