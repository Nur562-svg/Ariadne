#!/usr/bin/env node
/**
 * T54 B：cite 机检 CLI——读 data/chapters/<ch>.blocks.json（OCR 原文）与
 * data/cards/<ch>.entities.json（实体卡），用 scripts/lib/cite-ocr-quality.mjs
 * 同真算法（bigram ≥0.6）打分。**只读 seed**：绝不改 entities 的 verified。
 *
 * 用法：
 *   pnpm cite-check              # 全部已有 entities 的章
 *   pnpm cite-check -- ch01 ch03 # 指定章
 *
 * 输出：stdout 每章一行汇总；data/qa/<ch>.cite-ocr.json（报告，非 seed 真源，
 * 含未命中样例 ≤30 条，供人逐条复核）。缺 blocks（无 OCR 文本）的章如实标
 * 「未检」，不抬假阳 ocrMiss。
 */
import fs from "node:fs";
import path from "node:path";
import { scoreChapter, cardCiteMisses } from "./lib/cite-ocr-quality.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const argIds = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const cardsDir = path.join(ROOT, "data", "cards");
const allChapterIds = fs.existsSync(cardsDir)
  ? fs.readdirSync(cardsDir).filter((f) => f.endsWith(".entities.json")).map((f) => f.replace(/\.entities\.json$/, ""))
  : [];
const chapterIds = argIds.length > 0 ? argIds : allChapterIds;

if (chapterIds.length === 0) {
  console.error("没有可机检的章（data/cards/*.entities.json 为空）");
  process.exit(1);
}

let bad = 0;
for (const ch of chapterIds) {
  const entitiesPath = path.join(cardsDir, `${ch}.entities.json`);
  const blocksPath = path.join(ROOT, "data", "chapters", `${ch}.blocks.json`);
  if (!fs.existsSync(entitiesPath)) {
    console.error(`${ch}: 缺 ${entitiesPath}——跳过`);
    bad++;
    continue;
  }
  const cards = JSON.parse(fs.readFileSync(entitiesPath, "utf8")).cards ?? [];
  if (!fs.existsSync(blocksPath)) {
    // 缺 OCR 文本：如实「未检」，不写 0 假数。
    console.log(`${ch}: 卡 ${cards.length} · OCR 文本缺（未检）——先跑 pnpm parse ${ch}`);
    continue;
  }
  const pages = JSON.parse(fs.readFileSync(blocksPath, "utf8")).pages ?? [];
  const pageTextByPage = {};
  for (const p of pages) if (p.page != null && (p.text ?? "").trim()) pageTextByPage[p.page] = p.text;

  const q = scoreChapter(cards, pageTextByPage);
  const misses = cards.flatMap((c) => cardCiteMisses(c, pageTextByPage)).slice(0, 30);
  const pct = (q.missRate * 100).toFixed(1);
  console.log(
    `${ch}: 卡 ${q.cards} · 原子 ${q.atoms} · 有页 cite ${q.cites} · OCR未见 ${q.ocrMiss}（missRate ${pct}%）· 无页 ${q.nullPage} · 零原子卡 ${q.zeroAtomCards}`,
  );
  const qaDir = path.join(ROOT, "data", "qa");
  fs.mkdirSync(qaDir, { recursive: true });
  const report = {
    chapter: ch,
    generatedAt: new Date().toISOString(),
    algorithm: "bigramCoverage >= 0.6（scripts/lib/cite-ocr-quality.mjs，与 web 同真）",
    summary: q,
    missSamples: misses,
    note: "只读机检报告，非 seed 真源；绝不回写 entities verified。",
  };
  const outPath = path.join(qaDir, `${ch}.cite-ocr.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 1));
  console.log(`  → ${path.relative(ROOT, outPath)}（未命中样例 ${misses.length} 条）`);
}
process.exit(bad > 0 ? 1 : 0);
