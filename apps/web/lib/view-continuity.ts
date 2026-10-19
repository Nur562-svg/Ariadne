/**
 * 中栏视图模式续位（Task 24 A 加分项）：sessionStorage 记住 DocumentPane 的 pages|split|cards。
 * 独立桶 ariadne.desk.view.v1 —— 与既有桶严格分界、互不复用：
 * - ariadne.desk.session.v1（T20）是练/核游标与档位，不是中栏视图；
 * - ariadne.desk.return.v1（T23）是「回到出发点」短链；
 * - ariadne.desk.last-opened.v1 / recent-books.v1（T21/22）是跨日书架指针（localStorage）。
 *
 * 只在本标签页内生效（关标签即清，同 T20 语义）；URL ?mode= 深链时 URL 胜出。
 * 全部读写 try/catch：隐私模式读失败返回 null、写失败静默——只是「续住上次模式」这一增强失效。
 */

export const VIEW_STORE_KEY = "ariadne.desk.view.v1";

export type DeskViewMode = "cards" | "pages" | "split";

/** 读上次视图模式；无记录 / 非法值 / SSR 一律 null。 */
export function loadViewMode(): DeskViewMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(VIEW_STORE_KEY);
    if (raw === "cards" || raw === "pages" || raw === "split") return raw;
    return null;
  } catch {
    return null;
  }
}

/** 写当前视图模式（覆盖旧值）。 */
export function saveViewMode(mode: DeskViewMode): void {
  try {
    window.sessionStorage.setItem(VIEW_STORE_KEY, mode);
  } catch {
    /* 隐私模式写失败：静默 */
  }
}
