import fs from "node:fs";
import path from "node:path";

/**
 * 服务端数据层：直接读仓库根 data/ 下的 JSON 文件。
 * 生产化路线（Postgres + pgvector）留接口：换掉 loadCards/loadPage 即可，页面不动。
 */

export type Cite = {
  page: number | null;
  quote?: string;
  verified: boolean;
};

export type Atom = {
  id: string;
  prompt: string;
  answer: string;
  difficulty: "what" | "why" | "case";
  cite?: Cite;
};

export type EntityCard = {
  id: string;
  name_zh: string;
  name_en?: string;
  aliases?: string[];
  kind: "concept" | "structure" | "process" | "pathogen" | "cell" | "molecule" | "disease";
  one_liner: string;
  fields: { label: string; value: string; cite?: Cite }[];
  confusions?: { vs: string; tip: string }[];
  atoms: Atom[];
  cites: Cite[];
};

export type ChapterDoc = {
  book: string;
  chapter: { id: string; title: string };
  pageOffset: number;
  pages: { page: number | null; physicalPage: number; text: string }[];
};

// apps/web → 仓库根（data/ 在根下）。部署时可用 ARIADNE_DATA 覆盖。
function repoRoot(): string {
  return process.env.ARIADNE_DATA
    ? process.env.ARIADNE_DATA
    : path.resolve(process.cwd(), "..", "..");
}

export function loadCards(): EntityCard[] {
  const dir = path.join(repoRoot(), "data", "cards");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
  return files.flatMap((f) => {
    const doc = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    return (doc.cards ?? []) as EntityCard[];
  });
}

export function loadCard(id: string): EntityCard | undefined {
  return loadCards().find((c) => c.id === id);
}

export function loadChapterPages(chapterId = "ch01"): ChapterDoc["pages"] {
  const file = path.join(repoRoot(), "data", "chapters", `${chapterId}.blocks.json`);
  if (!fs.existsSync(file)) return [];
  const doc = JSON.parse(fs.readFileSync(file, "utf8")) as ChapterDoc;
  return doc.pages ?? [];
}
