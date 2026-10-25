import { NextResponse } from "next/server";
import {
  CLEW_DEFAULT_TIER,
  clewTierSummaries,
  resolveClewTier,
} from "@/lib/clew-provider";
import { todayUsageCount } from "@/lib/clew-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * T66 A / T68 B：Clew 可达性探针——**不调模型、不回钥**。
 * 回 mode/provider/model（默认档 fast，T66 兼容）+ tiers[]（三档各自 available/provider/model）
 * + usage.today（本机今日调用数 · 读 data/qa/clew-usage.jsonl · 非云账单）。
 * ClewPane 据此驱动档位芯片可用/置灰与底栏用量行。全档缺 → mode:"stub"。
 * 建议动作本身仍只走 POST /api/clew/suggest。
 */
export async function GET() {
  const env = process.env;
  const tiers = clewTierSummaries(env);
  const def = resolveClewTier(env, CLEW_DEFAULT_TIER);
  return NextResponse.json(
    {
      ok: true,
      mode: def ? "live" : "stub",
      provider: def?.name ?? null,
      model: def?.model ?? null,
      defaultTier: CLEW_DEFAULT_TIER,
      tiers,
      usage: { today: todayUsageCount(), note: "本机记数 · 非云账单" },
      readonly: true,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
