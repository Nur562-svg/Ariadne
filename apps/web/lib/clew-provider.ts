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

/*
 * T90 desk-clew-provider-lib-split-01：本文件收口为 barrel——铁合同 header 留此，消费者入口不变
 * （api/clew/status · api/clew/suggest · clew-usage-{types,pure,fs}（type-only ClewTierId）一律
 * `from "@/lib/clew-provider"`；scripts/clew-suggest-check.mjs 仍 `await import("../apps/web/lib/
 * clew-provider.ts")` 相对 barrel——Node 原生剥类型下兄弟件相对 `.ts` 值导入可解析）。
 * 实现按既有分区机械抽出为三件，全部既有 named exports 经此 re-export 守恒：
 *   lib/clew-provider-types.ts    ClewProviderName / ClewTierId / CLEW_TIERS / CLEW_DEFAULT_TIER /
 *                                 ClewProviderConfig / ClewTierConfig / EnvLike（DAG 根：零 import）
 *   lib/clew-provider-defaults.ts ZHIPU_DEFAULT_BASE_URL / ZHIPU_DEFAULT_MODEL /
 *                                 MINIMAX_DEFAULT_BASE_URL / MINIMAX_DEFAULT_MODEL /
 *                                 TIER_DEFAULT_MODELS（← types · type-only；禁 import resolve）
 *   lib/clew-provider-resolve.ts  resolveClewTier / ClewTierSummary / clewTierSummaries /
 *                                 resolveClewProvider / publicProviderInfo（私有 nonEmpty ·
 *                                 tierEnvPrefix · pickProvider 随行；← types · ← defaults）
 * 三件彼此只有相对 `.ts` import（同 T83–T89：Node 原生 type-strip 直载不解析 `@/` 别名也不补
 * 扩展名；tsconfig allowImportingTsExtensions 已开）；全纯函数（EnvLike 入参），无顶层
 * process.env 读 / 无 "use client" 指令 / 无 fs / 无网络 / 无 LLM。
 */
export * from "./clew-provider-types.ts";
export * from "./clew-provider-defaults.ts";
export * from "./clew-provider-resolve.ts";
