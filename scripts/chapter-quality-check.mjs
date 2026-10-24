#!/usr/bin/env node
/**
 * T63 C：章级质量汇总 CLI（`pnpm qa-check`）——把既有四条机检 CLI 的同真算法
 * （scripts/lib/cite-ocr-quality · parse-ocr-coverage · extract-page-coverage ·
 * extract-page-density）**只读拼装**成六信号分列 rollup。**consume-only**：
 * 零新算法、零第二套阈值（SPARSE_CHAR_THR / SHALLOW_* / bigram 0.6 都只在 scripts/lib）。
 *
 * 用法：
 *   pnpm qa-check                     # 全部 config/chapter.json 章
 *   pnpm qa-check -- ch01 ch03        # 指定章
 *   pnpm qa-check -- --book immunology-3rd  # 按书折叠一行
 *
 * 输出：stdout 每章一行六信号（cite未见 / parse 空·稀 / 暗 / 浅 / 不完备 / 草稿）；
 * data/qa/<ch>.quality-rollup.json（**报告非 seed**——与 cite-ocr.json 等同族，
 * 绝不回写 entities / blocks，不写 verified）。缺 blocks/entities 的信号如实
 * 「未检」，不装完美 0。draft 是浏览器本机草稿（ariadne.atom-draft.v1），
 * CLI 永远看不见——stdout 如实标「—（本机）」；Web 端见书库「章质检驾驶舱」。
 */
import fs from "node:fs";
import path from "node:path";
import {
  scoreCard,
  scoreChapter,
  cardCiteMisses,
} from "./lib/cite-ocr-quality.mjs";
import { loadParseCoverage } from "./lib/parse-ocr-coverage.mjs";
import { loadExtractPageCoverage } from "./lib/extract-page-coverage.mjs";
import { loadExtractPageDensity } from "./lib/extract-page-density.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const argv = process.argv.slice(2);
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

// 章清单来源：config/chapter.json 注册表（六信号含 parse——它按注册章跑；与
// cite-check 的 data/cards 默认不同，这里要覆盖「还没抽出」的章才能如实显未检）。
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "chapter.json"), "utf8"));
let chapterIds = argIds.length > 0 ? argIds : cfg.chapters.map((c) => c.id);
const bookMode = bookId != null;
if (bookMode) {
  const books = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "books.json"), "utf8"));
  const book = (Array.isArray(books) ? books : books.books ?? []).find((b) => b.id === bookId);
  if (!book) {
    console.error(`--book: config/books.json 中没有 book id「${bookId}」`);
    process.exit(1);
  }
  chapterIds = book.chapterIds;
}
if (chapterIds.length === 0) {
  console.error("没有可机检的章（config/chapter.json 为空）");
  process.exit(1);
}

const MISS_CARD_SAMPLE = 8;
const PAGE_SAMPLE = 6;

/**
 * 单章 rollup（与 apps/web/lib/chapter-quality-rollup.ts 的 ChapterQualityRollup 同形状；
 * draft 字段省略——浏览器本机）。只拼装既有 lib 返回值，零重算。
 */
function buildRollup(ch) {
  const cardsFile = path.join(ROOT, "data", "cards", `${ch}.entities.json`);
  const blocksFile = path.join(ROOT, "data", "chapters", `${ch}.blocks.json`);
  let cite = null;
  let citeMisses = [];
  let incompleteCardIds = [];
  if (fs.existsSync(cardsFile)) {
    const cards = JSON.parse(fs.readFileSync(cardsFile, "utf8")).cards ?? [];
    if (cards.length > 0) {
      // pageTextByPage 装配与 cite-check 同口径：只收有正文的页（空文本页不造假 miss 源）。
      const pageTextByPage = {};
      if (fs.existsSync(blocksFile)) {
        const pages = JSON.parse(fs.readFileSync(blocksFile, "utf8")).pages ?? [];
        for (const p of pages)
          if (p.page != null && (p.text ?? "").trim()) pageTextByPage[p.page] = p.text;
      }
      cite = scoreChapter(cards, pageTextByPage);
      citeMisses = cards.flatMap((c) => cardCiteMisses(c, pageTextByPage));
      // incomplete 卡枚举：scoreCard 单卡打分（空 pageTextByPage 只影响 miss，不影响完备计数）——
      // 与 T55 incompleteAtoms 同真，不另造谓词。
      incompleteCardIds = cards
        .filter((c) => scoreCard(c, {}).incompleteAtoms > 0)
        .map((c) => c.id);
    }
  }
  const parse = loadParseCoverage(ROOT, ch);
  const dark = loadExtractPageCoverage(ROOT, ch);
  const shallow = loadExtractPageDensity(ROOT, ch);
  const seen = new Set();
  const citeMissCardIds = [];
  for (const m of citeMisses ?? []) {
    if (seen.has(m.cardId)) continue;
    seen.add(m.cardId);
    citeMissCardIds.push(m.cardId);
    if (citeMissCardIds.length >= MISS_CARD_SAMPLE) break;
  }
  return {
    chapterId: ch,
    cite: cite
      ? {
          cards: cite.cards,
          atoms: cite.atoms,
          cites: cite.cites,
          nullPage: cite.nullPage,
          ocrMiss: cite.ocrMiss,
          missRate: cite.missRate,
          zeroAtomCards: cite.zeroAtomCards,
        }
      : null,
    citeMissCardIds,
    parse: parse
      ? {
          expectedPages: parse.expectedPages,
          pagesPresent: parse.pagesPresent,
          emptyPages: parse.emptyPages,
          sparsePages: parse.sparsePages,
          coverageRate: parse.coverageRate,
          weak: parse.weak,
        }
      : null,
    dark: dark
      ? {
          darkCount: dark.darkCount,
          darkRate: dark.darkRate,
          substantialPages: dark.substantialPages,
          samplePages: dark.darkPages.slice(0, PAGE_SAMPLE).map((d) => d.page),
        }
      : null,
    shallow: shallow
      ? {
          shallowCount: shallow.shallowCount,
          shallowRate: shallow.shallowRate,
          substantialPages: shallow.substantialPages,
          samplePages: shallow.shallowPages.slice(0, PAGE_SAMPLE).map((s) => s.page),
        }
      : null,
    incompleteAtoms: cite ? cite.incompleteAtoms : 0,
    incompleteCardIds: cite ? incompleteCardIds : [],
  };
}

/** 弱章旗（展示派生，keep in sync with apps/web/lib/chapter-quality-rollup.ts rollupWeakFlags）。 */
function weakFlags(r) {
  return {
    cite: r.cite != null && (r.cite.ocrMiss > 0 || r.cite.zeroAtomCards > 0),
    parse: r.parse != null && r.parse.weak,
    dark: r.dark != null && r.dark.darkCount > 0,
    shallow: r.shallow != null && r.shallow.shallowCount > 0,
    incomplete: r.cite != null && r.incompleteAtoms > 0,
  };
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;

function fmtSignals(r) {
  const f = weakFlags(r);
  const cite =
    r.cite == null
      ? "cite 未检（缺 entities）"
      : `cite未见 ${r.cite.ocrMiss}/${r.cite.cites}（${pct(r.cite.missRate)}）· 零原子卡 ${r.cite.zeroAtomCards}`;
  const parse =
    r.parse == null
      ? "parse 未检（缺 blocks）"
      : `parse 空${r.parse.emptyPages}·稀${r.parse.sparsePages}·覆盖${pct(r.parse.coverageRate)}`;
  const dark =
    r.dark == null ? "暗 未检" : `暗 ${r.dark.darkCount}（${pct(r.dark.darkRate)}）`;
  const shallow =
    r.shallow == null
      ? "浅 未检"
      : `浅 ${r.shallow.shallowCount}（${pct(r.shallow.shallowRate)}）`;
  const incomplete =
    r.cite == null ? "不完备 未检" : `不完备 ${r.incompleteAtoms}`;
  // draft：浏览器 localStorage（ariadne.atom-draft.v1）——CLI 永远不可见，如实标 —。
  const draft = "草稿 —（本机）";
  const anyWeak = Object.values(f).some(Boolean);
  return `${cite} · ${parse} · ${dark} · ${shallow} · ${incomplete} · ${draft}${anyWeak ? " · weak" : ""}`;
}

const results = [];
for (const ch of chapterIds) {
  const r = buildRollup(ch);
  results.push(r);
  if (!bookMode) console.log(`${ch}: ${fmtSignals(r)}`);

  const qaDir = path.join(ROOT, "data", "qa");
  fs.mkdirSync(qaDir, { recursive: true });
  const outPath = path.join(qaDir, `${ch}.quality-rollup.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        chapter: ch,
        schema: "ariadne.chapter-quality-rollup.v1",
        generatedAt: new Date().toISOString(),
        signals: r,
        weak: weakFlags(r),
        sources: [
          "scripts/lib/cite-ocr-quality.mjs（T54/T55，与 web 同真）",
          "scripts/lib/parse-ocr-coverage.mjs（T56，与 web 同真）",
          "scripts/lib/extract-page-coverage.mjs（T57，与 web 同真）",
          "scripts/lib/extract-page-density.mjs（T59，与 web 同真）",
        ],
        note: "只读机检汇总报告（六信号分列），非 seed 真源；绝不回写 entities/blocks，不写 verified。draft 是浏览器本机草稿（ariadne.atom-draft.v1），CLI 不可见——Web 端见书库「章质检驾驶舱」。",
      },
      null,
      1,
    ),
  );
  if (!bookMode) console.log(`  → ${path.relative(ROOT, outPath)}`);
}

// --book 折叠：一行六信号（合计率按合计重算；未检章点名）。
if (bookMode) {
  const checked = results.filter((r) => r.cite != null || r.parse != null);
  const ocrMiss = checked.reduce((n, r) => n + (r.cite?.ocrMiss ?? 0), 0);
  const cites = checked.reduce((n, r) => n + (r.cite?.cites ?? 0), 0);
  const zeroAtom = checked.reduce((n, r) => n + (r.cite?.zeroAtomCards ?? 0), 0);
  const empty = checked.reduce((n, r) => n + (r.parse?.emptyPages ?? 0), 0);
  const sparse = checked.reduce((n, r) => n + (r.parse?.sparsePages ?? 0), 0);
  const darkN = checked.reduce((n, r) => n + (r.dark?.darkCount ?? 0), 0);
  const darkSub = checked.reduce((n, r) => n + (r.dark?.substantialPages ?? 0), 0);
  const shallowN = checked.reduce((n, r) => n + (r.shallow?.shallowCount ?? 0), 0);
  const shallowSub = checked.reduce((n, r) => n + (r.shallow?.substantialPages ?? 0), 0);
  const incomplete = checked.reduce((n, r) => n + r.incompleteAtoms, 0);
  const weakChapters = results.filter((r) => Object.values(weakFlags(r)).some(Boolean));
  console.log(
    `book ${bookId}（${results.length} 章，弱章 ${weakChapters.length}）: ` +
      `cite未见 ${ocrMiss}/${cites}（${pct(cites > 0 ? ocrMiss / cites : 0)}）· 零原子卡 ${zeroAtom} · ` +
      `parse 空${empty}·稀${sparse} · 暗 ${darkN}（${pct(darkSub > 0 ? darkN / darkSub : 0)}）· ` +
      `浅 ${shallowN}（${pct(shallowSub > 0 ? shallowN / shallowSub : 0)}）· 不完备 ${incomplete} · 草稿 —（本机）`,
  );
  const unchecked = results.filter((r) => r.cite == null && r.parse == null);
  if (unchecked.length > 0) {
    console.log(`  整章未检（缺 blocks 且缺 entities）: ${unchecked.map((r) => r.chapterId).join(", ")}`);
  }
}
process.exit(0);
