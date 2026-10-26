import type { EntityCard, PageDoc } from "@/lib/entities";
import type { SectionId } from "@/components/desk/SectionToc";

/**
 * T73 机械抽出：原 DocumentPane.tsx 模块层纯函数/常量（KIND_ZH / Mode / firstPageOf /
 * filterCards / groupByKind）整段迁此——函数体零改，仅换文件。DocumentPane / SectionCards /
 * DocumentCardTile 共用同一份，不出现第二套过滤或分组口径。
 */

export const KIND_ZH: Record<string, string> = {
  concept: "概念",
  structure: "结构",
  process: "过程",
  molecule: "分子",
  pathogen: "病原",
  cell: "细胞",
  disease: "疾病",
};

export type Mode = "cards" | "pages" | "split";

/** 章首页码（模块层纯函数——lazy 初值与渲染期补位都要在 useState 声明前可用）。 */
export function firstPageOf(pages: PageDoc[], chId: string): number | null {
  return (
    pages
      .filter((p) => p.chapterId === chId && p.page != null)
      .sort((a, b) => (a.page ?? 0) - (b.page ?? 0))[0]?.page ?? null
  );
}

/** TOC 段 → 卡片过滤规则（真数据；无假 Paper、无假核页）。 */
export function filterCards(section: SectionId, cards: EntityCard[]): EntityCard[] {
  switch (section) {
    case "process":
      // 机制串讲：过程类卡（顺带 molecule 这类机制载体）——只过滤，不编正文
      return cards.filter((c) => c.kind === "process" || c.kind === "molecule");
    case "confusions":
      return cards.filter((c) => (c.confusions?.length ?? 0) > 0);
    case "case":
      return cards.filter(
        (c) =>
          c.kind === "disease" ||
          c.kind === "pathogen" ||
          c.atoms.some((a) => a.difficulty === "case"),
      );
    default:
      return cards;
  }
}

/** 按 kind 分组（实体图谱）。 */
export function groupByKind(cards: EntityCard[]): { kind: string; items: EntityCard[] }[] {
  const order = ["concept", "cell", "molecule", "structure", "process", "pathogen", "disease"];
  const byKind = new Map<string, EntityCard[]>();
  for (const c of cards) {
    const list = byKind.get(c.kind) ?? [];
    list.push(c);
    byKind.set(c.kind, list);
  }
  return [...byKind.entries()]
    .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
    .map(([kind, items]) => ({ kind, items }));
}
