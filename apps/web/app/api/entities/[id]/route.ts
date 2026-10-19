import { NextResponse } from "next/server";
import { loadCard } from "@/lib/entities";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = loadCard(id);
  if (!card) {
    return NextResponse.json({ error: "entity not found", id }, { status: 404 });
  }
  return NextResponse.json(card);
}
