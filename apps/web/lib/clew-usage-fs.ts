/**
 * T89 机械抽出：原 lib/clew-usage.ts 服务端 fs 分区（usagePath（私）· appendUsage ·
 * todayUsageCount · todayUsageByTier · sessionCapReached）整段迁此——append 失败只 warn
 * 不抛、无文件 today* → 0 / 全 0 三键、sessionCapReached 未设/非正整数 → null、各档
 * 共用计数，行为零改；自设顶（CLEW_SESSION_MAX_CALLS）非云墙口径零改。
 * 本件是三件 DAG 的服务端 fs 面：持既有 node:fs · node:path · ARIADNE_DATA ·
 * CLEW_SESSION_MAX_CALLS（本模块服务端面职责）；CLEW_USAGE_FILE / ClewUsageLine 自 types、
 * buildUsageLine / countToday / countTodayByTier / startOfToday 自 pure（**pure 零 import fs**）。
 * 无 "use client" / 无网络 / 无 LLM。
 * 铁合同 header 与消费者入口仍在 @/lib/clew-usage（barrel）。
 */

import fs from "node:fs";
import path from "node:path";
import { CLEW_USAGE_FILE, type ClewUsageLine } from "./clew-usage-types.ts";
import type { ClewTierId } from "@/lib/clew-provider";
import {
  buildUsageLine,
  countToday,
  countTodayByTier,
  startOfToday,
} from "./clew-usage-pure.ts";

// ---- 服务端 fs 面（route 专用；纯函数上方可单测） ----

function usagePath(): string {
  const root = process.env.ARIADNE_DATA
    ? process.env.ARIADNE_DATA
    : path.resolve(process.cwd(), "..", "..");
  return path.join(root, "data", "qa", CLEW_USAGE_FILE);
}

/** append 一行（best-effort：失败只 warn，永不抛、永不影响答）。 */
export function appendUsage(l: ClewUsageLine): void {
  try {
    const file = usagePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, buildUsageLine(l));
  } catch (e) {
    console.warn("[clew-usage] 记数失败（不影响答）:", e instanceof Error ? e.message : e);
  }
}

/** 读「本机今日」调用数（读失败 / 无文件 → 0；不抛）。 */
export function todayUsageCount(now = Date.now()): number {
  try {
    const file = usagePath();
    if (!fs.existsSync(file)) return 0;
    return countToday(fs.readFileSync(file, "utf8").split("\n"), startOfToday(now));
  } catch {
    return 0;
  }
}

/** T69 F：读「本机今日」各档调用数（读失败 / 无文件 → 全 0 三键；不抛）。 */
export function todayUsageByTier(now = Date.now()): Record<ClewTierId, number> {
  try {
    const file = usagePath();
    if (!fs.existsSync(file)) return { fast: 0, reasoning: 0, "long-context": 0 };
    return countTodayByTier(fs.readFileSync(file, "utf8").split("\n"), startOfToday(now));
  } catch {
    return { fast: 0, reasoning: 0, "long-context": 0 };
  }
}

/**
 * 自设顶检查（F3 可选）：CLEW_SESSION_MAX_CALLS 未设 / 非正整数 → null（无顶）；
 * 已达顶 → 返回今日已用数（route 回 429）；未达 → null。**各档共用**（读的是同一文件计数）。
 */
export function sessionCapReached(env: Record<string, string | undefined>, now = Date.now()): number | null {
  const raw = (env.CLEW_SESSION_MAX_CALLS ?? "").trim();
  if (!raw) return null;
  const cap = Number(raw);
  if (!Number.isInteger(cap) || cap <= 0) return null;
  const used = todayUsageCount(now);
  return used >= cap ? used : null;
}
