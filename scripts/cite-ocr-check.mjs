#!/usr/bin/env node
/**
 * T54 B + T55 B：cite 机检 CLI——读 data/chapters/<ch>.blocks.json（OCR 原文）与
 * data/cards/<ch>.entities.json（实体卡），用 scripts/lib/cite-ocr-quality.mjs
 * 同真算法（bigram ≥0.6）打分。**只读 seed**：绝不改 entities 的 verified。
 *
 * 用法：
 *   pnpm cite-check                     # 全部已有 entities 的章
 *   pnpm cite-check -- ch01 ch03        # 指定章
 *   pnpm cite-check -- --misses ch01    # 逐条打印 miss（cardId · p.N · cov · quote · OCR 附近）
 *   pnpm cite-check -- --book immunology-3rd  # 按书折叠多章一行（config/books.json）
 *
 * 输出：stdout 汇总（含 空prompt/空answer/不完备原子）；data/qa/<ch>.cite-ocr.json
 * （报告，非 seed 真源，含 missSamples[].ocrSnippet/suggestQuote 供人核）。
 * 缺 blocks（无 OCR 文本）的章如实标「未检」，不抬假阳 ocrMiss。
 */
import fs from "node:fs";
import path from "node:path";
import { scoreChapter, cardCiteMisses } from "./lib/cite-ocr-quality.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const argv = process.argv.slice(2);
const showMisses = argv.includes("--misses");
let bookId = null;
{
  const i = argv.indexOf("--book");
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) bookId = argv[i + 1];
  else {
    const eq = argv.find((a) => a.startsWith("--book="));
    if (eq) bookId = eq.slice("--book=".length);
  }
}
const argIds = argv.filter((a) => !a.startsWith("--") && a !== bookId);

const cardsDir = path.join(ROOT, "data", "cards");
const allChapterIds = fs.existsSync(cardsDir)
  ? fs
      .readdirSync(cardsDir)
      .filter((f) => f.endsWith(".entities.json"))
      .map((f) => f.replace(/\.entities\.json$/, ""))
  : [];

/** 书模式：按 config/books.json 的 chapterIds 选章（缺 entities 的章跳过并点名）。 */
let chapterIds = argIds.length > 0 ? argIds : allChapterIds;
const bookMode = bookId != null;
let bookChapterIds = null;
if (bookMode) {
  const books = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "books.json"), "utf8"));
  const book = (Array.isArray(books) ? books : books.books ?? []).find((b) => b.id === bookId);
  if (!book) {
    console.error(`--book: config/books.json 中没有 book id「${bookId}」`);
    process.exit(1);
  }
  bookChapterIds = book.chapterIds;
  chapterIds = bookChapterIds.filter((ch) => allChapterIds.includes(ch));
  const missing = bookChapterIds.filter((ch) => !allChapterIds.includes(ch));
  if (missing.length > 0) console.error(`--book ${bookId}: 无 entities 的章跳过——${missing.join(", ")}`);
}
if (chapterIds.length === 0) {
  console.error("没有可机检的章（data/cards/*.entities.json 为空）");
  process.exit(1);
}

function fmtLine(label, q) {
  const pct = (q.missRate * 100).toFixed(1);
  return (
    `${label}: 卡 ${q.cards} · 原子 ${q.atoms} · 有页 cite ${q.cites} · ` +
    `OCR未见 ${q.ocrMiss}（missRate ${pct}%）· 无页 ${q.nullPage} · 零原子卡 ${q.zeroAtomCards} · ` +
    `空prompt ${q.emptyPromptAtoms} · 空answer ${q.emptyAnswerAtoms} · 不完备原子 ${q.incompleteAtoms}`
  );
}

let bad = 0;
/** 章级结果（书模式折叠用）。 */
const results = [];
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
    console.log(`${ch}: 卡 ${cards.length} · OCR 文本缺（未检）——先跑 pnpm parse ${ch}`);
    results.push({ ch, q: null, misses: [], cardCount: cards.length });
    continue;
  }
  const pages = JSON.parse(fs.readFileSync(blocksPath, "utf8")).pages ?? [];
  const pageTextByPage = {};
  for (const p of pages) if (p.page != null && (p.text ?? "").trim()) pageTextByPage[p.page] = p.text;

  const q = scoreChapter(cards, pageTextByPage);
  const misses = cards.flatMap((c) => cardCiteMisses(c, pageTextByPage));
  results.push({ ch, q, misses, cardCount: cards.length });

  if (!bookMode) {
    console.log(fmtLine(ch, q));
    // T55 B：--misses 逐条人读明细（cardId · p.N · cov · quote · OCR 附近 / 建议摘录）。
    if (showMisses) {
      for (const m of misses) {
        console.log(`  miss ${m.cardId} · p.${m.page} · cov ${m.coverage} · “${m.quote}”`);
        if (m.ocrSnippet) console.log(`    OCR附近: ${m.ocrSnippet}`);
        if (m.suggestQuote) console.log(`    建议摘录（人核后再贴）: ${m.suggestQuote}`);
      }
      if (misses.length === 0) console.log("  （无 OCR 未见条目）");
    }
  }

  const qaDir = path.join(ROOT, "data", "qa");
  fs.mkdirSync(qaDir, { recursive: true });
  const report = {
    chapter: ch,
    generatedAt: new Date().toISOString(),
    algorithm: "bigramCoverage >= 0.6（scripts/lib/cite-ocr-quality.mjs，与 web 同真）",
    summary: q,
    missSamples: misses.slice(0, 30),
    note: "只读机检报告，非 seed 真源；绝不回写 entities verified。建议摘录供人核后手贴。",
  };
  const outPath = path.join(qaDir, `${ch}.cite-ocr.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 1));
  if (!bookMode) console.log(`  → ${path.relative(ROOT, outPath)}（未命中样例 ${Math.min(misses.length, 30)} 条）`);
}

// T55 B：--book 折叠——多章合计一行（missRate 按合计重算）。
if (bookMode) {
  const checked = results.filter((r) => r.q != null);
  const zero = {
    cards: 0, atoms: 0, cites: 0, nullPage: 0, ocrMiss: 0,
    zeroAtomCards: 0, missRate: 0, emptyPromptAtoms: 0, emptyAnswerAtoms: 0, incompleteAtoms: 0,
  };
  for (const r of checked) {
    zero.cards += r.q.cards; zero.atoms += r.q.atoms; zero.cites += r.q.cites;
    zero.nullPage += r.q.nullPage; zero.ocrMiss += r.q.ocrMiss;
    zero.zeroAtomCards += r.q.zeroAtomCards;
    zero.emptyPromptAtoms += r.q.emptyPromptAtoms;
    zero.emptyAnswerAtoms += r.q.emptyAnswerAtoms;
    zero.incompleteAtoms += r.q.incompleteAtoms;
  }
  zero.missRate = zero.cites > 0 ? zero.ocrMiss / zero.cites : 0;
  const unchecked = results.filter((r) => r.q == null);
  console.log(fmtLine(`book ${bookId}`, zero));
  if (unchecked.length > 0) {
    console.log(`  未检章（缺 OCR 文本）: ${unchecked.map((r) => r.ch).join(", ")}`);
  }
}
process.exit(bad > 0 ? 1 : 0);
