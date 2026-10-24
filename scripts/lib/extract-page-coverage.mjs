/**
 * T57 A（孪生）：抽出后页→原子覆盖机检——与 apps/web/lib/extract-page-coverage.ts
 * **逐函数同真**（collectCitedPages / scoreExtractPageCoverage）；SPARSE_CHAR_THR 复用
 * ./parse-ocr-coverage.mjs 的 40（T56 同口径，**不**复制第二套常量防漂移）。另含 fs 版
 * loadExtractPageCoverage（web server 版在 apps/web/lib/extract-page-coverage-server.ts）。
 * 改任何一处必须同步其余两处（keep in sync）；口径只有这一份。
 *
 * 暗页 = 页 OCR chars ≥ SPARSE_CHAR_THR 且 cards 的 cites/fields[].cite/atoms[].cite
 * 零命中（page 精确匹配）；空/稀页归 T56，不进暗页。只读：绝不写回 entities /
 * blocks；不发明 cite/原子填暗页；不改 deriveMaterialStage。
 */
import fs from "node:fs";
import path from "node:path";
import { SPARSE_CHAR_THR } from "./parse-ocr-coverage.mjs";

export { SPARSE_CHAR_THR };

export function collectCitedPages(cards) {
  const out = new Set();
  const push = (c) => {
    if (c && typeof c.page === "number") out.add(c.page);
  };
  for (const card of cards ?? []) {
    for (const x of card.cites ?? []) push(x);
    for (const f of card.fields ?? []) push(f.cite);
    for (const a of card.atoms ?? []) push(a.cite);
  }
  return out;
}

export function scoreExtractPageCoverage(input) {
  const pages = input.pages ?? [];
  const cited = collectCitedPages(input.cards ?? []);
  let substantialPages = 0;
  let citedPages = 0;
  const darkPages = [];
  for (const p of pages) {
    if (p.page == null) continue;
    if (cited.has(p.page)) citedPages++;
    const chars = (p.text ?? "").trim().length;
    if (chars < SPARSE_CHAR_THR) continue; // 空/稀页归 T56 口径，不进暗页
    substantialPages++;
    if (cited.has(p.page)) continue;
    darkPages.push({
      page: p.page,
      chars,
      preview: (p.text ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
    });
  }
  darkPages.sort((a, b) => a.page - b.page);
  const darkCount = darkPages.length;
  const darkRate = substantialPages > 0 ? darkCount / substantialPages : 0;
  return {
    pagesPresent: pages.length,
    substantialPages,
    citedPages,
    darkPages,
    darkCount,
    darkRate,
    weak: darkCount > 0,
  };
}

/**
 * fs 版章覆盖装载：读 data/chapters/<id>.blocks.json + data/cards/<id>.entities.json；
 * **缺 blocks 或缺 entities → null**（未抽出/未解析＝未检，不装 darkCount=0 完美覆盖）。
 */
export function loadExtractPageCoverage(rootDir, chapterId) {
  const blocksFile = path.join(rootDir, "data", "chapters", `${chapterId}.blocks.json`);
  const cardsFile = path.join(rootDir, "data", "cards", `${chapterId}.entities.json`);
  if (!fs.existsSync(blocksFile) || !fs.existsSync(cardsFile)) return null;
  try {
    const blocksDoc = JSON.parse(fs.readFileSync(blocksFile, "utf8"));
    const cardsDoc = JSON.parse(fs.readFileSync(cardsFile, "utf8"));
    return scoreExtractPageCoverage({
      pages: blocksDoc.pages ?? [],
      cards: cardsDoc.cards ?? [],
    });
  } catch {
    return null; // 读/解析失败 = 未检（fail-closed，不装完美覆盖）
  }
}
