#!/usr/bin/env node
/**
 * T56 B：parse/OCR 覆盖机检 CLI——读 data/chapters/<ch>.blocks.json，用
 * scripts/lib/parse-ocr-coverage.mjs 同真算法（SPARSE_CHAR_THR=40 / coverageRate /
 * weak 口径）打分。**只读**：绝不改 blocks / entities / deriveMaterialStage。
 *
 * 用法：
 *   pnpm parse-check                # 全部 config/chapter.json 章
 *   pnpm parse-check -- ch01 ch03   # 指定章
 *   pnpm parse-check -- --sparse ch01   # 列出空页 + 稀页（页码 · 字数）
 *   pnpm parse-check -- --book immunology-3rd  # 按书折叠多章一行
 *
 * 输出：stdout 汇总（期望/实有/空/稀/块/覆盖率）；data/qa/<ch>.parse-ocr.json
 * （报告，gitignored，非真源）。缺 blocks 的章如实「未检」。
 */
import fs from "node:fs";
import path from "node:path";
import { loadParseCoverage, scorePageText } from "./lib/parse-ocr-coverage.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const argv = process.argv.slice(2);
const showSparse = argv.includes("--sparse");
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

const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "chapter.json"), "utf8"));
let chapterIds = argIds.length > 0 ? argIds : cfg.chapters.map((c) => c.id);
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
  chapterIds = bookChapterIds;
}
if (chapterIds.length === 0) {
  console.error("没有可机检的章");
  process.exit(1);
}

function fmtLine(label, agg) {
  const pct = (agg.coverageRate * 100).toFixed(1);
  return (
    `${label}: 期望页 ${agg.expectedPages} · 实有 ${agg.pagesPresent} · 空 ${agg.emptyPages} · ` +
    `稀 ${agg.sparsePages} · 块 ${agg.blockCount}（main ${agg.mainBlocks}）· 覆盖率 ${pct}%` +
    (agg.weak ? " · weak" : "")
  );
}

const zero = {
  expectedPages: 0, pagesPresent: 0, emptyPages: 0, sparsePages: 0,
  blockCount: 0, mainBlocks: 0, coverageRate: 1, sparseRate: 0, weak: false,
};
function fold(into, q) {
  into.expectedPages += q.expectedPages;
  into.pagesPresent += q.pagesPresent;
  into.emptyPages += q.emptyPages;
  into.sparsePages += q.sparsePages;
  into.blockCount += q.blockCount;
  into.mainBlocks += q.mainBlocks;
}
function finalize(agg) {
  const nonEmpty = agg.pagesPresent - agg.emptyPages;
  agg.coverageRate = agg.expectedPages > 0 ? Math.min(1, nonEmpty / agg.expectedPages) : 1;
  agg.sparseRate = agg.pagesPresent > 0 ? agg.sparsePages / agg.pagesPresent : 0;
  agg.weak = agg.emptyPages > 0 || agg.sparsePages > 0 || agg.coverageRate < 0.85;
}

let bad = 0;
const results = [];
for (const ch of chapterIds) {
  const cov = loadParseCoverage(ROOT, ch);
  if (!cov) {
    console.log(`${ch}: 未检（缺 data/chapters/${ch}.blocks.json）——先跑 pnpm parse ${ch}`);
    results.push({ ch, cov: null });
    continue;
  }
  results.push({ ch, cov });

  if (!bookMode) {
    console.log(fmtLine(ch, cov));
    // T56 B：--sparse 列空页 + 稀页（页码 · 字数）——人读定位，供补扫决策。
    if (showSparse) {
      const doc = JSON.parse(
        fs.readFileSync(path.join(ROOT, "data", "chapters", `${ch}.blocks.json`), "utf8"),
      );
      const flagged = (doc.pages ?? [])
        .map((p) => ({ page: p.page, ...scorePageText(p.text ?? "") }))
        .filter((p) => p.empty || p.sparse);
      if (flagged.length === 0) console.log("  （无空页/稀页）");
      for (const p of flagged) {
        console.log(`  ${p.empty ? "空页" : "稀页"} p.${p.page} · ${p.chars} 字`);
      }
    }
  }

  const qaDir = path.join(ROOT, "data", "qa");
  fs.mkdirSync(qaDir, { recursive: true });
  const outPath = path.join(qaDir, `${ch}.parse-ocr.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        chapter: ch,
        generatedAt: new Date().toISOString(),
        algorithm: "SPARSE_CHAR_THR=40 / coverage=(实有-空)/期望（scripts/lib/parse-ocr-coverage.mjs，与 web 同真）",
        summary: cov,
        note: "只读机检报告，非 seed 真源；绝不回写 blocks / entities。",
      },
      null,
      1,
    ),
  );
  if (!bookMode) console.log(`  → ${path.relative(ROOT, outPath)}`);
}

// T56 B：--book 折叠——书级合计一行。
if (bookMode) {
  const checked = results.filter((r) => r.cov != null);
  const agg = { ...zero };
  for (const r of checked) fold(agg, r.cov);
  finalize(agg);
  console.log(fmtLine(`book ${bookId}`, agg));
  const unchecked = results.filter((r) => r.cov == null);
  if (unchecked.length > 0) {
    console.log(`  未检章（缺 blocks）: ${unchecked.map((r) => r.ch).join(", ")}`);
  }
}
process.exit(bad > 0 ? 1 : 0);
