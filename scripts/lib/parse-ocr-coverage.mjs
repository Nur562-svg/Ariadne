/**
 * T56 A（孪生）：parse/OCR 覆盖机检——与 apps/web/lib/parse-ocr-coverage.ts
 * **逐函数同真**（SPARSE_CHAR_THR / scorePageText / scoreParseChapter），另含 fs 版
 * loadParseCoverage（web server 版在 apps/web/lib/parse-ocr-coverage-server.ts）。
 * 改任何一处必须同步其余两处（keep in sync）；口径只有这一份。
 *
 * 只读：绝不写回 data/chapters/*.blocks.json / entities；不改 deriveMaterialStage。
 */

export const SPARSE_CHAR_THR = 40;

export function scorePageText(text, thr = SPARSE_CHAR_THR) {
  const chars = (text ?? "").trim().length;
  return { chars, empty: chars === 0, sparse: chars > 0 && chars < thr };
}

export function scoreParseChapter(input) {
  const pages = input.pages ?? [];
  const pagesPresent = pages.length;
  let emptyPages = 0;
  let sparsePages = 0;
  for (const p of pages) {
    const s = scorePageText(p.text ?? "");
    if (s.empty) emptyPages++;
    if (s.sparse) sparsePages++;
  }
  const expectedPages = input.expectedPages ?? pagesPresent;
  const nonEmpty = pagesPresent - emptyPages;
  const coverageRate = expectedPages > 0 ? Math.min(1, nonEmpty / expectedPages) : 1;
  const sparseRate = pagesPresent > 0 ? sparsePages / pagesPresent : 0;
  const blockCount = input.blocks?.length ?? 0;
  const mainBlocks = (input.blocks ?? []).filter((b) => b.region === "main").length;
  return {
    expectedPages,
    pagesPresent,
    emptyPages,
    sparsePages,
    blockCount,
    mainBlocks,
    coverageRate,
    sparseRate,
    weak: emptyPages > 0 || sparsePages > 0 || coverageRate < 0.85,
  };
}

/**
 * fs 版章覆盖装载：读 data/chapters/<id>.blocks.json（期望页优先 chapter.pages.book
 * 闭区间长度）；缺文件 → null（未检，不装完美覆盖）。
 */
import fs from "node:fs";
import path from "node:path";

export function loadParseCoverage(rootDir, chapterId) {
  const file = path.join(rootDir, "data", "chapters", `${chapterId}.blocks.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    const [start, end] = doc.chapter?.pages?.book ?? [];
    const expectedPages =
      Number.isFinite(start) && Number.isFinite(end) && end >= start
        ? end - start + 1
        : undefined;
    return scoreParseChapter({
      expectedPages,
      pages: doc.pages ?? [],
      blocks: doc.blocks ?? [],
    });
  } catch {
    return null;
  }
}
