/**
 * T89 机械抽出：原 lib/clew-usage.ts types 分区（CLEW_USAGE_FILE · type ClewUsageLine）
 * 整段迁此——文件名字符串一字不改（`clew-usage.jsonl`）、行形状零改。
 * 本件是三件 DAG 的根：跨 lib 仅 `import type` ClewTierId（Node 原生剥类型下整句擦除，
 * 可脱离 Next 直载）。
 * 无 "use client" / 无 fs / 无 process.env / 无网络 / 无 LLM。
 * 铁合同 header 与消费者入口仍在 @/lib/clew-usage（barrel）。
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
