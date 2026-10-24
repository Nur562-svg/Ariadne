/**
 * T59 A：fs 版章抽出密度装载（**server 专用**——含 node:fs，勿从 client 组件 import；
 * client 用纯函数版 @/lib/extract-page-density）。读 data/chapters/<id>.blocks.json +
 * data/cards/<id>.entities.json → scoreExtractPageDensity；**缺 blocks 或缺 entities →
 * null**（未抽出/未解析＝未检，不装 shallowCount=0 完美密度）。只读，绝不写回 blocks /
 * entities；不发明原子「补浅」；不写 verified；不改 deriveMaterialStage。
 */
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "@/lib/entities";
import {
  scoreExtractPageDensity,
  type DensityCardLike,
  type DensityPageLike,
  type ExtractPageDensity,
} from "@/lib/extract-page-density";

type BlocksDoc = { pages?: DensityPageLike[] };
type CardsDoc = { cards?: DensityCardLike[] };

export function loadExtractPageDensity(chapterId: string): ExtractPageDensity | null {
  const blocksFile = path.join(repoRoot(), "data", "chapters", `${chapterId}.blocks.json`);
  const cardsFile = path.join(repoRoot(), "data", "cards", `${chapterId}.entities.json`);
  if (!fs.existsSync(blocksFile) || !fs.existsSync(cardsFile)) return null;
  try {
    const blocksDoc = JSON.parse(fs.readFileSync(blocksFile, "utf8")) as BlocksDoc;
    const cardsDoc = JSON.parse(fs.readFileSync(cardsFile, "utf8")) as CardsDoc;
    return scoreExtractPageDensity({
      pages: blocksDoc.pages ?? [],
      cards: cardsDoc.cards ?? [],
    });
  } catch {
    return null; // 读/解析失败 = 未检（fail-closed，不装完美密度）
  }
}
