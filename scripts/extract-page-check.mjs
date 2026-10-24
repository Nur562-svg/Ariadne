#!/usr/bin/env node
/**
 * T57 B：抽出后页→原子覆盖机检 CLI——用 scripts/lib/extract-page-coverage.mjs 同真算法
 * （暗页 = chars≥SPARSE_CHAR_THR(40) 且 cards cites/fields[].cite/atoms[].cite 零命中；
 * 空/稀页归 T56 parse-check，不进暗页）打分。**只读**：绝不改 blocks / entities /
 * verified；不自动发明 cite 填暗页。
 *
 * 用法：
 *   pnpm page-check                    # 全部 config/chapter.json 章
 *   pnpm page-check -- ch01 ch03       # 指定章
 *   pnpm page-check -- --dark ch01     # 列出暗页（页码 · 字数 · 截断预览）
 *   pnpm page-check -- --book immunology-3rd  # 按书折叠多章一行
 *
 * 输出：stdout 汇总（页/实质/已cite/暗/darkRate）；data/qa/<ch>.extract-page.json
 * （报告，gitignored，非真源）。缺 blocks 或缺 entities 的章如实「未检」
 * （未抽出 ≠ darkCount=0 完美覆盖）。
 */
import fs from "node:fs";
import path from "node:path";
import { loadExtractPageCoverage } from "./lib/extract-page-coverage.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const argv = process.argv.slice(2);
const showDark = argv.includes("--dark");
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
  const pct = (agg.darkRate * 100).toFixed(1);
  return (
    `${label}: 页 ${agg.pagesPresent} · 实质页 ${agg.substantialPages} · 已cite ${agg.citedPages} · ` +
    `暗 ${agg.darkCount} · darkRate ${pct}%` +
    (agg.weak ? " · weak" : "")
  );
}

const zero = { pagesPresent: 0, substantialPages: 0, citedPages: 0, darkCount: 0, darkRate: 0, weak: false };
function fold(into, q) {
  into.pagesPresent += q.pagesPresent;
  into.substantialPages += q.substantialPages;
  into.citedPages += q.citedPages;
  into.darkCount += q.darkCount;
}
function finalize(agg) {
  agg.darkRate = agg.substantialPages > 0 ? agg.darkCount / agg.substantialPages : 0;
  agg.weak = agg.darkCount > 0;
}

let bad = 0;
const results = [];
for (const ch of chapterIds) {
  const cov = loadExtractPageCoverage(ROOT, ch);
  if (!cov) {
    console.log(`${ch}: 未检（缺 data/chapters/${ch}.blocks.json 或 data/cards/${ch}.entities.json）——先跑 pnpm extract -- ${ch}`);
    results.push({ ch, cov: null });
    continue;
  }
  results.push({ ch, cov });

  if (!bookMode) {
    console.log(fmtLine(ch, cov));
    // T57 B：--dark 列暗页（页码 · 字数 · 截断预览）——人读定位，供重抽/人工补 seed 决策。
    if (showDark) {
      if (cov.darkPages.length === 0) console.log("  （无暗页）");
      for (const d of cov.darkPages) {
        console.log(`  暗页 p.${d.page} · ${d.chars} 字 · ${d.preview}…`);
      }
    }
  }

  const qaDir = path.join(ROOT, "data", "qa");
  fs.mkdirSync(qaDir, { recursive: true });
  const outPath = path.join(qaDir, `${ch}.extract-page.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        chapter: ch,
        generatedAt: new Date().toISOString(),
        algorithm:
          "DARK = 页 OCR chars≥SPARSE_CHAR_THR(40) 且 cards cites/fields[].cite/atoms[].cite 零命中（scripts/lib/extract-page-coverage.mjs，与 web 同真）；空/稀页归 T56 parse-check 口径",
        summary: cov,
        note: "只读机检报告，非 seed 真源；绝不回写 entities / blocks，不发明 cite 填暗页。",
      },
      null,
      1,
    ),
  );
  if (!bookMode) console.log(`  → ${path.relative(ROOT, outPath)}`);
}

// T57 B：--book 折叠——书级合计一行（darkRate 按合计重算；weak=任暗页）。
if (bookMode) {
  const checked = results.filter((r) => r.cov != null);
  const agg = { ...zero };
  for (const r of checked) fold(agg, r.cov);
  finalize(agg);
  console.log(fmtLine(`book ${bookId}`, agg));
  const unchecked = results.filter((r) => r.cov == null);
  if (unchecked.length > 0) {
    console.log(`  未检章（缺 blocks 或缺 entities）: ${unchecked.map((r) => r.ch).join(", ")}`);
  }
}
process.exit(bad > 0 ? 1 : 0);
