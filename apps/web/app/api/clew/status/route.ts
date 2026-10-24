import { NextResponse } from "next/server";
import { publicProviderInfo, resolveClewProvider } from "@/lib/clew-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * T66 A（配套探针）：Clew 小能力可达性——**不调模型、不读盘、不回钥**。
 * 只回 { mode: "live"|"stub", provider, model }，让 ClewPane 会话条/空态在首问前就如实标
 * 「已接 live · zhipu/模型」或「未接模型（stub）」。建议动作本身仍只走 POST /api/clew/suggest。
 */
export async function GET() {
  const info = publicProviderInfo(resolveClewProvider(process.env));
  return NextResponse.json(
    {
      ok: true,
      mode: info ? "live" : "stub",
      provider: info?.name ?? null,
      model: info?.model ?? null,
      readonly: true,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
