/**
 * 「回到刚才」薄 return 桶（T23 A/B）：从书桌章页 / 卡枢纽出发进练或核时写一条短链，
 * 完成 / 空态次级链「回到刚才 →」据此回到出发点。
 *
 * 只写 sessionStorage（同一标签页内有效，关标签即清）；与其它桶正交，绝不复用：
 * - ariadne.desk.session.v1 — T20 游标桶（跨刷新续位），不是「回到出发点」。
 * - ariadne.desk.last-opened.v1 / recent-books.v1 — T21/22 跨日书架 / 换书停留页，localStorage。
 * - ariadne.study.v1 / ariadne.heye.v1 — 本机练 / 核记录，不得改名。
 *
 * 非法（非站内相对路径 / 协议伪造）一律忽略；目标失效由消费方静默回落，本模块不阻塞 UI。
 */

export const RETURN_STACK_KEY = "ariadne.desk.return.v1";

export type ReturnEntry = {
  /** 站内相对路径（'/desk?book=&page=' / '/desk/card/<id>'）。 */
  href: string;
  /** 出发点标签（如「书桌 p.42」「卡《生育抗体》」），仅作 hover 提示，不强制展示。 */
  label?: string;
  /** 写入时刻（epoch ms）。 */
  at: number;
};

function isValidHref(href: unknown): href is string {
  if (typeof href !== "string" || !href) return false;
  // 仅接受站内相对路径：'/' 开头且非 '//'（协议相对），阻断 javascript: 等伪方案。
  if (!href.startsWith("/")) return false;
  if (href.startsWith("//")) return false;
  return true;
}

function parseEntry(raw: unknown): ReturnEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<ReturnEntry>;
  if (!isValidHref(parsed.href)) return null;
  return {
    href: parsed.href,
    label: typeof parsed.label === "string" && parsed.label ? parsed.label : undefined,
    at: typeof parsed.at === "number" && Number.isFinite(parsed.at) ? parsed.at : 0,
  };
}

/** 读 return 短链；SSR / 隐私模式 / 损坏读 / 非法一律 null。 */
export function loadReturn(): ReturnEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RETURN_STACK_KEY);
    if (!raw) return null;
    return parseEntry(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * T72：每页载入读一次的会话级缓存（引用稳定——供 uSES getSnapshot 直用）。
 * return 桶的写点都在「离面进练/核」的点前（saveReturn），消费面（会话/回程链）
 * 挂载期间桶不变，与旧 mount-effect 一次性采纳等价；SSR / 读失败 = null。
 */
let returnOnceCache: ReturnEntry | null | undefined;

export function loadReturnOnce(): ReturnEntry | null {
  if (typeof window === "undefined") return null;
  if (returnOnceCache === undefined) returnOnceCache = loadReturn();
  return returnOnceCache;
}

/** 写 return 短链（覆盖旧值）；非法 href 忽略（parseEntry 拒收）。 */
export function saveReturn(entry: ReturnEntry): void {
  const parsed = parseEntry(entry);
  if (!parsed) return;
  try {
    window.sessionStorage.setItem(RETURN_STACK_KEY, JSON.stringify(parsed));
  } catch {
    /* 隐私模式等写失败：静默——只是「回到刚才」增强失效 */
  }
}

/** 清除 return 短链。 */
export function clearReturn(): void {
  try {
    window.sessionStorage.removeItem(RETURN_STACK_KEY);
  } catch {
    /* 忽略 */
  }
}