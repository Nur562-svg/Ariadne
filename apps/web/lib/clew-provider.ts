/**
 * T66 B / T68 A：Clew provider 与**三档**注册表（纯函数：env 对象入参 → 配置或 null）。
 *
 * 三档（T68）：`fast`（快答 · 缺省默认档）/ `reasoning`（推理）/ `long-context`（长上下文）。
 * **不串档（铁）**：`resolveClewTier(env, tier)` 缺该档可用钥 → null（route 回 503 tier_unavailable），
 * 永不静默回落其它档——「Fast 没钥悄悄打 Reasoning」= 撒谎，拒收。
 *
 * env 映射（钥只在**服务端** env；禁止 NEXT_PUBLIC_* / 入仓 / 写进 docs 值）：
 *   钥：     ZHIPU_API_KEY / MINIMAX_API_KEY（两档共用钥池；档差异主要在模型名）
 *   档模型： CLEW_FAST_MODEL / CLEW_REASONING_MODEL / CLEW_LONG_MODEL（缺省见下表）
 *   档厂商： CLEW_FAST_PROVIDER / CLEW_REASONING_PROVIDER / CLEW_LONG_PROVIDER（zhipu|minimax）
 *            → 全局 CLEW_PROVIDER → 缺省 Zhipu 优先（仅厂商选择；**不是**跨档回落）
 *   端点：   ZHIPU_BASE_URL / MINIMAX_BASE_URL
 * 缺省模型（2026-10 时点合理值，均可用 env 覆盖；docs/clew-mac-env.md 有对照表）：
 *   zhipu：  fast=glm-4.5-flash（免费档）· reasoning=glm-4.6 · long-context=glm-4.6（200k 上下文）
 *   minimax：fast=MiniMax-M2 · reasoning=MiniMax-M2 · long-context=MiniMax-M2（档语义靠 env 覆盖区分）
 * 本刀不交 LiteLLM 网关 / Auto 路由 / BYOK / 云配额（DEFER）。
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
