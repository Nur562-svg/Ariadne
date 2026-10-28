/**
 * T90 机械抽出：原 lib/clew-provider.ts types 分区（ClewProviderName · ClewTierId ·
 * CLEW_TIERS · CLEW_DEFAULT_TIER · ClewProviderConfig · ClewTierConfig · EnvLike）
 * 整段迁此——三档 id 一字不改（fast | reasoning | long-context）、CLEW_DEFAULT_TIER
 * = "fast" 零改、形状零改。
 * 本件是三件 DAG 的根：零 import（兄弟件与跨 lib 均 zero）。
 * 无 "use client" / 无 fs / 无网络 / 无 LLM / 无顶层 process.env。
 * 铁合同 header 与消费者入口仍在 @/lib/clew-provider（barrel）。
 */

export type ClewProviderName = "zhipu" | "minimax";

/** T68 三档 id（稳定标识：API body `tier`、status.tiers[].id、UI 芯片共用）。 */
export type ClewTierId = "fast" | "reasoning" | "long-context";

export const CLEW_TIERS: { id: ClewTierId; label: string; zh: string }[] = [
  { id: "fast", label: "Fast", zh: "快答" },
  { id: "reasoning", label: "Reasoning", zh: "推理" },
  { id: "long-context", label: "Long-context", zh: "长上下文" },
];

/** 缺省默认档（POST /api/clew/suggest 不带 tier 时用它；文档写死）。 */
export const CLEW_DEFAULT_TIER: ClewTierId = "fast";

export type ClewProviderConfig = {
  name: ClewProviderName;
  baseURL: string;
  /** 只在服务端内存里流转；route 用后即弃。 */
  apiKey: string;
  model: string;
};

export type ClewTierConfig = ClewProviderConfig & { tier: ClewTierId };

export type EnvLike = Record<string, string | undefined>;
