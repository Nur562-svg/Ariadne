#!/usr/bin/env node
/**
 * T59 B：抽出后浅密度机检 CLI——用 scripts/lib/extract-page-density.mjs 同真算法
 * （浅页 = 实质 OCR 页 chars≥SPARSE_CHAR_THR(40) ∧ 1≤atoms[].cite.page 计数≤
 * SHALLOW_ATOM_MAX(2) ∧ chars/atomCount≥SHALLOW_CHARS_PER_ATOM(400)；原子只计
 * atoms[].cite.page，不计 card cites / fields[].cite）。**只读**：绝不改 blocks /
 * entities / verified；不自动发明原子「补浅」。
 *
 * 用法：
 *   pnpm density-check                     # 全部 config/chapter.json 章
 *   pnpm density-check -- ch01 ch03        # 指定章
 *   pnpm density-check -- --shallow ch01   # 列出浅页（页码 · 字数 · 原子数 · 均摊 · 预览）
 *   pnpm density-check -- --book immunology-3rd  # 按书折叠多章一行
 *   SHALLOW=1 pnpm density-check -- ch01   # 环境变量等价 --shallow
 *
 * 输出：stdout 汇总（实质页/有原子页/浅S/shallowRate）；data/qa/<ch>.extract-density.json
 * （报告，gitignored，非真源）。缺 blocks 或缺 entities 的章如实「未检」
 * （未抽出 ≠ shallowCount=0 完美密度）。暗页归 page-check（T57）、稀页归
 * parse-check（T56），与本 CLI 三概念分列，互不伪装。
 */
import fs from "node:fs";
import path from "node:path";
import { loadExtractPageDensity } from "./lib/extract-page-density.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const argv = process.argv.slice(2);
const showShallow = argv.includes("--shallow") || process.env.SHALLOW === "1";
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
  const pct = (agg.shallowRate * 100).toFixed(1);
  return (
    `${label}: 实质页 ${agg.substantialPages} · 有原子页 ${agg.citedAtomPages} · ` +
    `浅 ${agg.shallowCount} · shallowRate ${pct}%` +
    (agg.weak ? " · weak" : "")
  );
}

const zero = { substantialPages: 0, citedAtomPages: 0, shallowCount: 0, shallowRate: 0, weak: false };
function fold(into, q) {
  into.substantialPages += q.substantialPages;
  into.citedAtomPages += q.citedAtomPages;
  into.shallowCount += q.shallowCount;
}
function finalize(agg) {
  agg.shallowRate = agg.substantialPages > 0 ? agg.shallowCount / agg.substantialPages : 0;
  agg.weak = agg.shallowCount > 0;
}

const results = [];
for (const ch of chapterIds) {
  const den = loadExtractPageDensity(ROOT, ch);
  if (!den) {
    console.log(`${ch}: 未检（缺 data/chapters/${ch}.blocks.json 或 data/cards/${ch}.entities.json）——先跑 pnpm extract -- ${ch}`);
    results.push({ ch, den: null });
    continue;
  }
  results.push({ ch, den });

  if (!bookMode) {
    console.log(fmtLine(ch, den));
    // T59 B：--shallow 列浅页（页码 · 字数 · 原子数 · 均摊 · 截断预览）——人读定位，
    // 供重抽 / 人工补 seed 决策（不自动发明原子）。
    if (showShallow) {
      if (den.shallowPages.length === 0) console.log("  （无浅页）");
      for (const s of den.shallowPages) {
        console.log(`  浅页 p.${s.page} · ${s.chars} 字 · ${s.atomCount} 原子 · ${s.charsPerAtom} 字/原子 · ${s.preview}…`);
      }
    }
  }

  const qaDir = path.join(ROOT, "data", "qa");
  fs.mkdirSync(qaDir, { recursive: true });
  const outPath = path.join(qaDir, `${ch}.extract-density.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        chapter: ch,
        generatedAt: new Date().toISOString(),
        algorithm:
          "SHALLOW = 实质 OCR 页 chars≥SPARSE_CHAR_THR(40) ∧ 1≤atoms[].cite.page 计数≤SHALLOW_ATOM_MAX(2) ∧ chars/atomCount≥SHALLOW_CHARS_PER_ATOM(400)（scripts/lib/extract-page-density.mjs，与 web 同真；原子只计 atoms[].cite.page）；暗页归 T57 page-check、稀页归 T56 parse-check，三概念分列",
        summary: den,
        note: "只读机检报告，非 seed 真源；绝不回写 entities / blocks，不发明原子补浅，不写 verified。",
      },
      null,
      1,
    ),
  );
  if (!bookMode) console.log(`  → ${path.relative(ROOT, outPath)}`);
}

// T59 B：--book 折叠——书级合计一行（shallowRate 按合计重算；weak=任浅页）。
if (bookMode) {
  const checked = results.filter((r) => r.den != null);
  const agg = { ...zero };
  for (const r of checked) fold(agg, r.den);
  finalize(agg);
  console.log(fmtLine(`book ${bookId}`, agg));
  const unchecked = results.filter((r) => r.den == null);
  if (unchecked.length > 0) {
    console.log(`  未检章（缺 blocks 或缺 entities）: ${unchecked.map((r) => r.ch).join(", ")}`);
  }
}
process.exit(0);
