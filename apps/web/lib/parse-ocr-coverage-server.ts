/**
 * T56 A：fs 版章覆盖装载（**server 专用**——含 node:fs，勿从 client 组件 import；
 * client 用纯函数版 @/lib/parse-ocr-coverage）。读 data/chapters/<id>.blocks.json →
 * scoreParseChapter（期望页优先 chapter.pages.book 闭区间）；缺文件 → null（未检，
 * 不装完美覆盖）。只读，绝不写回 blocks / entities / deriveMaterialStage。
 */
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "@/lib/entities";
import { scoreParseChapter, type ParseCoverage } from "@/lib/parse-ocr-coverage";

type BlocksDoc = {
  chapter?: { pages?: { book?: [number, number] } };
  pages?: { page: number | null; text: string }[];
  blocks?: { region?: string }[];
};

export function loadParseCoverage(chapterId: string): ParseCoverage | null {
  const file = path.join(repoRoot(), "data", "chapters", `${chapterId}.blocks.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const doc = JSON.parse(fs.readFileSync(file, "utf8")) as BlocksDoc;
    const book = doc.chapter?.pages?.book;
    const start = book?.[0];
    const end = book?.[1];
    const expectedPages =
      typeof start === "number" && typeof end === "number" && end >= start
        ? end - start + 1
        : undefined;
    return scoreParseChapter({
      expectedPages,
      pages: doc.pages ?? [],
      blocks: doc.blocks ?? [],
    });
  } catch {
    return null; // 读/解析失败 = 未检（fail-closed，不装完美覆盖）
  }
}
