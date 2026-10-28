/**
 * T90 机械抽出：原 lib/clew-provider.ts defaults 分区（ZHIPU_DEFAULT_BASE_URL ·
 * ZHIPU_DEFAULT_MODEL · MINIMAX_DEFAULT_BASE_URL · MINIMAX_DEFAULT_MODEL ·
 * TIER_DEFAULT_MODELS）整段迁此——缺省 URL / model / 每档缺省模型表与 tip 逐字一致。
 * ClewProviderName / ClewTierId 自 types（type-only，Node 剥类型下擦除）；**禁止** import resolve。
 * 无 "use client" / 无 fs / 无网络 / 无 LLM / 无顶层 process.env。
 * 铁合同 header 与消费者入口仍在 @/lib/clew-provider（barrel）。
 */

import type { ClewProviderName, ClewTierId } from "./clew-provider-types.ts";

export const ZHIPU_DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
/** 免费 flash 档（小能力试）；ZHIPU_MODEL 可覆盖（仅 T66 单档兼容口用）。 */
export const ZHIPU_DEFAULT_MODEL = "glm-4.5-flash";
/** 国内站；国际站可 MINIMAX_BASE_URL=https://api.minimax.io/v1。 */
export const MINIMAX_DEFAULT_BASE_URL = "https://api.minimaxi.com/v1";
export const MINIMAX_DEFAULT_MODEL = "MiniMax-M2";

/** 每档缺省模型（厂商 → 档 → 模型名；全部可 CLEW_<TIER>_MODEL 覆盖）。 */
export const TIER_DEFAULT_MODELS: Record<ClewProviderName, Record<ClewTierId, string>> = {
  zhipu: { fast: "glm-4.5-flash", reasoning: "glm-4.6", "long-context": "glm-4.6" },
  minimax: { fast: "MiniMax-M2", reasoning: "MiniMax-M2", "long-context": "MiniMax-M2" },
};
