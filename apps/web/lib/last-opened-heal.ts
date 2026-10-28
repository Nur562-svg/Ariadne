/**
 * T88 机械抽出：原 lib/last-opened.ts heal 分区（pageInHref（私）· sanitizeOpenedPage ·
 * healOpenedIfDirty）整段迁此——sanitize 干净条目原引用返回（调用方 !== 判脏）、
 * 脏 → 单条 saveLastOpened({...sanitized, at: Date.now()}) heal（禁 clearLastOpened
 * 整栈、禁改 key 名、不动其它书条目）、validPages 缺省原引用返回不写盘，行为零改。
 * LastOpened 自 types；saveLastOpened 自 persist（DAG 单向 types ← persist ← heal）。
 * 无 "use client" 指令 / 无 fs / 无 process.env / 无网络 / 无 LLM。
 * 边界铁律 header 与消费者入口仍在 @/lib/last-opened（barrel）。
 */

import type { LastOpened } from "./last-opened-types.ts";
import { saveLastOpened } from "./last-opened-persist.ts";

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
