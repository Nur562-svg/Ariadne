/**
 * T90 机械抽出：原 lib/clew-provider.ts resolve 分区（私有 nonEmpty · tierEnvPrefix ·
 * pickProvider + resolveClewTier · ClewTierSummary · clewTierSummaries ·
 * resolveClewProvider · publicProviderInfo）整段迁此——不串档 fail-closed（缺该档可用
 * 钥 → null，永不静默回落其它档）、显式厂商缺钥不悄换、publicProviderInfo 永不含
 * apiKey / baseURL，行为零改。纯函数（EnvLike 入参），**无顶层 process.env 读**。
 * types 与 defaults 自前两件（值 + type 按需）；私有 helpers 不经 barrel 外泄。
 * 无 "use client" / 无 fs / 无网络 / 无 LLM。
 * 铁合同 header 与消费者入口仍在 @/lib/clew-provider（barrel）。
 */

import {
  CLEW_DEFAULT_TIER,
  CLEW_TIERS,
  type ClewProviderConfig,
  type ClewProviderName,
  type ClewTierConfig,
  type ClewTierId,
  type EnvLike,
} from "./clew-provider-types.ts";
import {
  MINIMAX_DEFAULT_BASE_URL,
  TIER_DEFAULT_MODELS,
  ZHIPU_DEFAULT_BASE_URL,
} from "./clew-provider-defaults.ts";

function nonEmpty(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t ? t : null;
}

/** 档的 env 前缀（brief 定名）：fast/reasoning/long-context → FAST/REASONING/LONG。 */
function tierEnvPrefix(tier: ClewTierId): string {
  return tier === "long-context" ? "LONG" : tier.toUpperCase();
}

function pickProvider(env: EnvLike, tier: ClewTierId): ClewProviderName | null {
  const byTier = nonEmpty(env[`CLEW_${tierEnvPrefix(tier)}_PROVIDER`]);
  if (byTier === "zhipu" || byTier === "minimax") return byTier;
  const global = (nonEmpty(env.CLEW_PROVIDER) ?? "").toLowerCase();
  if (global === "zhipu" || global === "minimax") return global;
  // 缺省 Zhipu 优先——这只是**该档内**的厂商选择，不是跨档回落。
  if (nonEmpty(env.ZHIPU_API_KEY)) return "zhipu";
  if (nonEmpty(env.MINIMAX_API_KEY)) return "minimax";
  return null;
}

/**
 * 解析某档：缺该档可用钥（即两家钥全缺，或显式指定的厂商缺钥）→ **null，不回落其它档**。
 * 显式 CLEW_<TIER>_PROVIDER / CLEW_PROVIDER 指定的厂商缺钥 → 同样 null（不悄换厂商）。
 */
export function resolveClewTier(env: EnvLike, tier: ClewTierId): ClewTierConfig | null {
  const name = pickProvider(env, tier);
  if (!name) return null;
  const key = nonEmpty(name === "zhipu" ? env.ZHIPU_API_KEY : env.MINIMAX_API_KEY);
  if (!key) return null;
  const modelOverride = nonEmpty(env[`CLEW_${tierEnvPrefix(tier)}_MODEL`]);
  return {
    tier,
    name,
    baseURL: nonEmpty(name === "zhipu" ? env.ZHIPU_BASE_URL : env.MINIMAX_BASE_URL)
      ?? (name === "zhipu" ? ZHIPU_DEFAULT_BASE_URL : MINIMAX_DEFAULT_BASE_URL),
    apiKey: key,
    model: modelOverride ?? TIER_DEFAULT_MODELS[name][tier],
  };
}

/** 三档总览（status 探针用）：available = 该档可解析；不含钥。 */
export type ClewTierSummary = {
  id: ClewTierId;
  label: string;
  zh: string;
  available: boolean;
  provider: ClewProviderName | null;
  model: string | null;
};

export function clewTierSummaries(env: EnvLike): ClewTierSummary[] {
  return CLEW_TIERS.map(({ id, label, zh }) => {
    const cfg = resolveClewTier(env, id);
    return {
      id,
      label,
      zh,
      available: cfg != null,
      provider: cfg?.name ?? null,
      model: cfg?.model ?? null,
    };
  });
}

/**
 * T66 兼容口（单档语义）：解析**默认档 fast**。route/status 已改走 tiers；此函数留给
 * 既有调用与单测——语义 = resolveClewTier(env, "fast") 去 tier 字段。
 */
export function resolveClewProvider(env: EnvLike): ClewProviderConfig | null {
  const t = resolveClewTier(env, CLEW_DEFAULT_TIER);
  if (!t) return null;
  return { name: t.name, baseURL: t.baseURL, apiKey: t.apiKey, model: t.model };
}

/** 响应体 / 探针可见的安全投影——永不含 apiKey / baseURL。 */
export function publicProviderInfo(
  p: ClewProviderConfig | null,
): { name: ClewProviderName; model: string } | null {
  return p ? { name: p.name, model: p.model } : null;
}
