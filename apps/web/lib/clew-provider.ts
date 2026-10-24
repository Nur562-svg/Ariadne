/**
 * T66 B：Clew 小能力 provider 解析（纯函数：env 对象入参 → 一档配置或 null）。
 *
 * 一档即可：Zhipu（open.bigmodel.cn · openai-compatible）或 Minimax（api.minimaxi.com · openai-compatible）。
 * 两钥都在时 CLEW_PROVIDER=zhipu|minimax 指定；缺省 Zhipu 优先。
 * 钥只在**服务端** env：ZHIPU_API_KEY / MINIMAX_API_KEY。禁止 NEXT_PUBLIC_*、禁止入仓、禁止写进 docs 值。
 * 本函数返回的 apiKey 只能交给 createOpenAICompatible；永不进响应体 / 日志 / 客户端——
 * 对外只暴露 publicProviderInfo（name + model）。
 * 缺钥 → null（route 回 503 no_provider；ClewPane 降诚实 stub，不编假 live）。
 * 本刀不交三档选择器 / 配额 / 路由（DEFER 全量 harness）。
 */

export type ClewProviderName = "zhipu" | "minimax";

export type ClewProviderConfig = {
  name: ClewProviderName;
  baseURL: string;
  /** 只在服务端内存里流转；route 用后即弃。 */
  apiKey: string;
  model: string;
};

export type EnvLike = Record<string, string | undefined>;

export const ZHIPU_DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
/** 免费 flash 档（小能力试）；ZHIPU_MODEL 可覆盖。 */
export const ZHIPU_DEFAULT_MODEL = "glm-4.5-flash";
/** 国内站；国际站可 MINIMAX_BASE_URL=https://api.minimax.io/v1。 */
export const MINIMAX_DEFAULT_BASE_URL = "https://api.minimaxi.com/v1";
export const MINIMAX_DEFAULT_MODEL = "MiniMax-M2";

function nonEmpty(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t ? t : null;
}

export function resolveClewProvider(env: EnvLike): ClewProviderConfig | null {
  const pick = (env.CLEW_PROVIDER ?? "").trim().toLowerCase();
  const zhipuKey = nonEmpty(env.ZHIPU_API_KEY);
  const minimaxKey = nonEmpty(env.MINIMAX_API_KEY);

  const zhipu: ClewProviderConfig | null = zhipuKey
    ? {
        name: "zhipu",
        baseURL: nonEmpty(env.ZHIPU_BASE_URL) ?? ZHIPU_DEFAULT_BASE_URL,
        apiKey: zhipuKey,
        model: nonEmpty(env.ZHIPU_MODEL) ?? ZHIPU_DEFAULT_MODEL,
      }
    : null;
  const minimax: ClewProviderConfig | null = minimaxKey
    ? {
        name: "minimax",
        baseURL: nonEmpty(env.MINIMAX_BASE_URL) ?? MINIMAX_DEFAULT_BASE_URL,
        apiKey: minimaxKey,
        model: nonEmpty(env.MINIMAX_MODEL) ?? MINIMAX_DEFAULT_MODEL,
      }
    : null;

  if (pick === "zhipu") return zhipu;
  if (pick === "minimax") return minimax;
  return zhipu ?? minimax;
}

/** 响应体 / 探针可见的安全投影——永不含 apiKey / baseURL 以外的敏感项。 */
export function publicProviderInfo(
  p: ClewProviderConfig | null,
): { name: ClewProviderName; model: string } | null {
  return p ? { name: p.name, model: p.model } : null;
}
