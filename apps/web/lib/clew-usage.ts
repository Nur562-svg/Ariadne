import fs from "node:fs";
import path from "node:path";

/**
 * T68 E：Clew 本机用量记数——**本刀唯一可写文件** `data/qa/clew-usage.jsonl`（.gitignore 已列；
 * 报告非真源）。append-only 单行 JSON：ts · tier · provider · model · ok | fail(code) · tokens?
 * · auditUnmarkedOut?（T70 可选；缺字段的旧行照常解析）。
 * 永不写 entities / blocks / verified；不是云账单（不拉上游计量 API，只记本地调用事实）；
 * 非掌握度 / 非 Due。记数失败（盘只读等）只 warn 不影响答——用量是旁观者，不是门。
 * 可选 CLEW_SESSION_MAX_CALLS（服务端 env，正整数）：「本机今日」调用 ≥ 顶 → 429 session_cap
 * （自设顶，非云墙）；**各档共用计数**——换档不能绕过。
 */

import type { ClewTierId } from "@/lib/clew-provider";

export const CLEW_USAGE_FILE = "clew-usage.jsonl";

/** 单行记录（纯形状；clew-check 直接测）。 */
export type ClewUsageLine = {
  ts: number;
  tier: ClewTierId;
  provider: string;
  model: string;
  ok: boolean;
  /** 失败时的错误码（upstream_error / upstream_timeout / empty_answer…）。 */
  error?: string;
  tokens?: { input?: number | null; output?: number | null };
  /**
   * T70 C：本次答核账的越窗未标条数（可选）。缺省 = 旧行 / 审计失败没数字。
   * 不是掌握度、不是 Due；todayUsageByTier 不读它。
   */
  auditUnmarkedOut?: number;
};

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
