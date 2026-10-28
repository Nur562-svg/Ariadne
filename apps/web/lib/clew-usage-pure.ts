/**
 * T89 机械抽出：原 lib/clew-usage.ts pure 分区（buildUsageLine · parseUsageLine ·
 * startOfToday · countToday · countTodayByTier）整段迁此——解析脏行丢、ok/fail 都算
 * 一次调用、byTier 三键恒在、不带 apiKey / 不带问句原文，行为零改。
 * ClewUsageLine 自 types（type-only）；ClewTierId 跨 lib type-only（剥类型下擦除）。
 * **无 fs / 无 path / 无 process.env**；无 "use client" / 无网络 / 无 LLM。
 * 铁合同 header 与消费者入口仍在 @/lib/clew-usage（barrel）。
 */

import type { ClewUsageLine } from "./clew-usage-types.ts";
import type { ClewTierId } from "@/lib/clew-provider";

/** 组一行（结尾 \n）；不带 apiKey / 不带问句原文（问题内容不进用量文件）。 */
export function buildUsageLine(l: ClewUsageLine): string {
  return `${JSON.stringify(l)}\n`;
}

/** 解析一行 → ClewUsageLine | null（脏行丢，不抛）。 */
export function parseUsageLine(line: string): ClewUsageLine | null {
  const t = line.trim();
  if (!t) return null;
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    if (typeof o.ts !== "number") return null;
    if (o.tier !== "fast" && o.tier !== "reasoning" && o.tier !== "long-context") return null;
    if (typeof o.provider !== "string" || typeof o.model !== "string") return null;
    return {
      ts: o.ts,
      tier: o.tier,
      provider: o.provider,
      model: o.model,
      ok: o.ok === true,
      ...(typeof o.error === "string" ? { error: o.error } : {}),
      ...(o.tokens !== null && typeof o.tokens === "object"
        ? {
            tokens: {
              input: typeof (o.tokens as Record<string, unknown>).input === "number"
                ? ((o.tokens as Record<string, unknown>).input as number)
                : null,
              output: typeof (o.tokens as Record<string, unknown>).output === "number"
                ? ((o.tokens as Record<string, unknown>).output as number)
                : null,
            },
          }
        : {}),
      // 可选键：非负整数才收下；脏值丢掉该键，不因此拒整行（旧行没有这个字段）。
      ...(typeof o.auditUnmarkedOut === "number" &&
      Number.isInteger(o.auditUnmarkedOut) &&
      o.auditUnmarkedOut >= 0
        ? { auditUnmarkedOut: o.auditUnmarkedOut }
        : {}),
    };
  } catch {
    return null;
  }
}

/** 「今日 0 点」本地时区（本机口径——非 UTC 云账单）。 */
export function startOfToday(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 纯计数：行集里 ts ≥ dayStart 的条数（ok 与 fail 都算一次调用）。 */
export function countToday(lines: string[], dayStart: number): number {
  let n = 0;
  for (const line of lines) {
    const l = parseUsageLine(line);
    if (l && l.ts >= dayStart) n++;
  }
  return n;
}

/**
 * T69 F：纯计数（按档）——行集里 ts ≥ dayStart 的各档条数；三档键恒在（缺 = 0）。
 * 与 countToday 同口径（ok 与 fail 都算）；总分 = 各档之和。非掌握度 / 非 Due。
 */
export function countTodayByTier(
  lines: string[],
  dayStart: number,
): Record<ClewTierId, number> {
  const out: Record<ClewTierId, number> = { fast: 0, reasoning: 0, "long-context": 0 };
  for (const line of lines) {
    const l = parseUsageLine(line);
    if (l && l.ts >= dayStart) out[l.tier]++;
  }
  return out;
}
