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

export type PageDoc = {
  page: number | null;
  physicalPage: number;
  text: string;
  chapterId?: string;
};

export type ChapterDoc = {
  book: string;
  chapter: { id: string; title: string };
  pageOffset: number;
  pages: PageDoc[];
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

/** 单章 pages（按印刷页）。边界页若跨章重复，以该章文件为准。 */
export function loadChapterPages(chapterId = "ch01"): PageDoc[] {
  const file = path.join(repoRoot(), "data", "chapters", `${chapterId}.blocks.json`);
  if (!fs.existsSync(file)) return [];
  const doc = JSON.parse(fs.readFileSync(file, "utf8")) as ChapterDoc;
  return (doc.pages ?? []).map((p) => ({ ...p, chapterId }));
}

/**
 * 合并所有已解析章的印刷页索引（按 page 去重，先出现的章优先）。
 * viewer / cite 跳转必须走这里，不能写死 ch01。
 */
export function loadAllChapterPages(): PageDoc[] {
  const dir = path.join(repoRoot(), "data", "chapters");
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".blocks.json"))
    .sort();
  const byPage = new Map<number, PageDoc>();
  for (const f of files) {
    const chapterId = f.replace(/\.blocks\.json$/, "");
    const doc = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as ChapterDoc;
    for (const p of doc.pages ?? []) {
      if (p.page == null) continue;
      if (!byPage.has(p.page)) {
        byPage.set(p.page, { ...p, chapterId });
      }
    }
  }
  return [...byPage.values()].sort((a, b) => (a.page ?? 0) - (b.page ?? 0));
}

/** 按印刷页查找 OCR 页；找不到返回 undefined。 */
export function findPageByPrinted(printedPage: number): PageDoc | undefined {
  return loadAllChapterPages().find((p) => p.page === printedPage);
}

/** 章节短标题（去掉「（第N章）」括注），用于 /entities 页头派生，不硬编码。 */
export function loadChapterTitles(): string[] {
  const file = path.join(repoRoot(), "config", "chapter.json");
  if (!fs.existsSync(file)) return [];
  const cfg = JSON.parse(fs.readFileSync(file, "utf8")) as {
    chapters?: { title?: string }[];
  };
  return (cfg.chapters ?? [])
    .map((c) => (c.title ?? "").replace(/（第[^）]*章）/g, ""))
    .filter(Boolean);
}
