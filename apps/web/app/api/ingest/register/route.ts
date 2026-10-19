import { NextResponse } from "next/server";
import { registerBook } from "@/lib/register-book";

export const runtime = "nodejs";

/**
 * POST /api/ingest/register — extracted 物料一键上架（T22 register API）。
 * 入参 { materialId（必填）, bookId?, title? }；冲突/非法返回 4xx（琥珀错误由客户端展示）。
 * 本机写盘 config/chapter.json + config/books.json，非云同步。
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const materialId = String(b.materialId ?? "").trim();
  if (!materialId) {
    return NextResponse.json({ error: "缺少 materialId" }, { status: 400 });
  }

  const result = await registerBook({
    materialId,
    bookId: typeof b.bookId === "string" && b.bookId.trim() ? b.bookId.trim() : undefined,
    title: typeof b.title === "string" ? b.title : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json(result, { status: 201 });
}