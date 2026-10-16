import { NextResponse } from "next/server";
import { loadCards } from "@/lib/entities";

export async function GET() {
  const cards = loadCards();
  return NextResponse.json({
    count: cards.length,
    entities: cards.map((c) => ({
      id: c.id,
      name_zh: c.name_zh,
      name_en: c.name_en,
      kind: c.kind,
      one_liner: c.one_liner,
      atoms: c.atoms.length,
      href: `/api/entities/${c.id}`,
    })),
  });
}
