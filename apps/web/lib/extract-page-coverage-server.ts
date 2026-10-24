/**
 * T57 A：fs 版章抽出页覆盖装载（**server 专用**——含 node:fs，勿从 client 组件 import；
 * client 用纯函数版 @/lib/extract-page-coverage）。读 data/chapters/<id>.blocks.json +
 * data/cards/<id>.entities.json → scoreExtractPageCoverage；**缺 blocks 或缺 entities →
 * null**（未抽出/未解析＝未检，不装 darkCount=0 完美覆盖）。只读，绝不写回 blocks /
 * entities；不发明 cite/原子填暗页；不改 deriveMaterialStage。
 */
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "@/lib/entities";
import {
  scoreExtractPageCoverage,
  type ExtractPageCardLike,
  type ExtractPageCoverage,
  type ExtractPageLike,
} from "@/lib/extract-page-coverage";

type BlocksDoc = { pages?: ExtractPageLike[] };
type CardsDoc = { cards?: ExtractPageCardLike[] };

export function loadExtractPageCoverage(chapterId: string): ExtractPageCoverage | null {
  const blocksFile = path.join(repoRoot(), "data", "chapters", `${chapterId}.blocks.json`);
  const cardsFile = path.join(repoRoot(), "data", "cards", `${chapterId}.entities.json`);
  if (!fs.existsSync(blocksFile) || !fs.existsSync(cardsFile)) return null;
  try {
    const blocksDoc = JSON.parse(fs.readFileSync(blocksFile, "utf8")) as BlocksDoc;
    const cardsDoc = JSON.parse(fs.readFileSync(cardsFile, "utf8")) as CardsDoc;
    return scoreExtractPageCoverage({
      pages: blocksDoc.pages ?? [],
      cards: cardsDoc.cards ?? [],
    });
  } catch {
    return null; // 读/解析失败 = 未检（fail-closed，不装完美覆盖）
  }
}
