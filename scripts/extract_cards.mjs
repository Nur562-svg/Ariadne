#!/usr/bin/env node
/**
 * LLM 实体卡抽取（可重跑流水线；本次交付的 ch01.entities.json 由同 schema 人工复核产出）。
 *
 * 直连（勿 OpenRouter）：
 *   GLM:      GLM_API_KEY=...  （默认 https://open.bigmodel.cn/api/paas/v4，模型 glm-4.6）
 *   DeepSeek: DEEPSEEK_API_KEY=...（https://api.deepseek.com，模型 deepseek-chat）
 *
 * 用法：
 *   pnpm extract -- ch01            # 重抽某章（写 data/cards/<id>.entities.json）
 *   pnpm extract -- ch01 --dry      # 只打印 prompt/结果，不写文件
 *   pnpm extract -- ch01 --strict   # 机检后置：missRate>0.4 或零原子卡>0 → 非零退出拒写
 *
 * Fail-closed 约束（脚本侧硬校验，模型侧 prompt 约束）：
 *   - page 超出本章页码范围 → 置 null + verified:false（p.?）
 *   - quote 超 30 字 → 截断
 *   - one_liner 超 40 字 → 截断
 *
 * T54 C：写盘前跑 cite↔OCR 机检（scripts/lib/cite-ocr-quality.mjs，bigram≥0.6，
 * 与 web / pnpm cite-check 同真）——stderr 报 ocrMiss / missRate / 零原子卡。
 * 默认只警告仍写盘（弱稿可见、可人工复核）；--strict 且 missRate>0.4 或零原子卡>0
 * → 非零退出，已有 entities 拒绝覆盖。机检只读，绝不改写 verified。
 *
 * T57 C：写盘前兼报抽出页覆盖（scripts/lib/extract-page-coverage.mjs，与
 * pnpm page-check / web 同真）——暗页 = 实质 OCR 页（chars≥SPARSE_CHAR_THR=40）零
 * cite。默认只警告仍写盘（扉页/小结/跨章扉可能合理暗）；--strict 另或 darkRate≥0.35
 * 或 darkCount≥5（文档化阈值）→ 拒写。绝不自动发明 cite/原子填暗页。
 *
 * T59 C：写盘前兼报抽出后浅密度（scripts/lib/extract-page-density.mjs，与
 * pnpm density-check / web 同真）——浅页 = 实质 OCR 页已抽出原子但极稀（1≤atomCount
 * ≤2 且 chars/atomCount≥400；原子只计 atoms[].cite.page）。默认只警告仍写盘（浅 ≠
 * 错稿，人工补 seed / 重抽是后置决策）；--strict 另或 shallowRate≥0.35 或
 * shallowCount≥5（文档化阈值）→ 拒写。绝不自动发明原子「补浅」。
 */
import fs from "node:fs";
import path from "node:path";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { scoreChapter } from "./lib/cite-ocr-quality.mjs";
import { loadParseCoverage } from "./lib/parse-ocr-coverage.mjs";
import { scoreExtractPageCoverage } from "./lib/extract-page-coverage.mjs";
import { scoreExtractPageDensity } from "./lib/extract-page-density.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const strict = args.includes("--strict");
const chapterId = args.find((a) => !a.startsWith("--"));
if (!chapterId) {
  console.error("usage: node scripts/extract_cards.mjs <chapterId> [--dry]");
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "config/chapter.json"), "utf8"));
const ch = cfg.chapters.find((c) => c.id === chapterId);
if (!ch) {
  console.error(`chapter ${chapterId} not in config/chapter.json`);
  process.exit(1);
}

const blocksDoc = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/chapters", `${chapterId}.blocks.json`), "utf8"),
);
const pages = blocksDoc.pages.filter((p) => p.page != null && p.text.trim());
const [bookStart, bookEnd] = blocksDoc.chapter.pages.book;

/**
 * T56 E：开抽前 parse 覆盖预检（与 pnpm parse-check 同真算法）——weak 只警告不阻断
 * 默认路径（抽取基于缺页正文，cite 质量风险由 T54 后置机检兜住）；--strict 下
 * coverageRate<0.5 或 emptyPages>0 与 T54/T55 strict 条件**或**并存（见写盘前判断）。
 */
const parseCov = loadParseCoverage(ROOT, chapterId);
if (parseCov != null && parseCov.weak) {
  process.stderr.write(
    `parse 覆盖偏弱: 期望 ${parseCov.expectedPages} · 空 ${parseCov.emptyPages} · ` +
      `稀 ${parseCov.sparsePages} · 覆盖率 ${(parseCov.coverageRate * 100).toFixed(1)}%` +
      `——抽取基于缺页正文，cite 质量风险高（pnpm parse-check -- --sparse ${chapterId} 复核）\n`,
  );
}

// ---- provider：直连 GLM 或 DeepSeek ----
const provider = process.env.DEEPSEEK_API_KEY
  ? {
      baseURL: "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    }
  : process.env.GLM_API_KEY
    ? {
        baseURL: process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
        apiKey: process.env.GLM_API_KEY,
        model: process.env.GLM_MODEL || "glm-4.6",
      }
    : null;

if (!provider) {
  console.error("缺少 GLM_API_KEY 或 DEEPSEEK_API_KEY（直连，不经 OpenRouter）");
  process.exit(1);
}
const client = createOpenAICompatible({ name: "ariadne", baseURL: provider.baseURL, apiKey: provider.apiKey });

// ---- prompt（强制 JSON + fail-closed）----
const SCHEMA_HINT = `{
  "cards": [{
    "id": "kebab-case-slug",
    "name_zh": "", "name_en": "", "aliases": [],
    "kind": "concept|structure|process|pathogen|cell|molecule|disease",
    "one_liner": "≤40字",
    "fields": [{"label":"","value":"","cite":{"page":N|null,"quote":"≤30字原文","verified":true|false}}],
    "confusions": [{"vs":"","tip":""}],
    "atoms": [{"id":"<chapterId>:<slug>:N","prompt":"可测问法","answer":"","difficulty":"what|why|case","cite":{...}}],
    "cites": [{"page":N|null,"quote":"","verified":true|false}]
  }]
}`;

function buildPrompt(chunk) {
  return `你是医学教材知识卡编辑。从下面带印刷页码的教材原文中抽取实体卡（entity cards）。

规则（必须遵守）：
1. 只抽原文明确支持的事实。每张卡 ≥1 条 citation：page 用原文标注的印刷页码，quote 摘 ≤30 字原文。
2. FAIL-CLOSED：不确定页码就填 null 且 verified:false；禁止编造页码或原文。
3. 每张卡 1~3 个知识原子（可测单元：定义=what / 机制一步=why / 临床应用=case），原子 id 格式 "${chapterId}:<slug>:<序号>"。
4. 易混概念写进 confusions（如 TD-Ag vs TI-Ag）。
5. 不写诊断、不开处方；只做教材范围内的定义/机制。
6. 每个原子的 prompt 与 answer 必须非空（可测问法 + 教材内答案），禁止留空。
7. 只输出 JSON，不要多余文字。schema：
${SCHEMA_HINT}

原文（印刷页 p.${chunk[0].page}–p.${chunk[chunk.length - 1].page}）：
${chunk.map((p) => `【p.${p.page}】\n${p.text}`).join("\n\n")}`;
}

// ---- fail-closed 后校验 ----
function sanitizeCard(card) {
  card.one_liner = (card.one_liner || "").slice(0, 40);
  const fix = (c) => {
    if (!c) return c;
    if (c.page == null || c.page < bookStart || c.page > bookEnd) {
      return { page: null, quote: c.quote?.slice(0, 30), verified: false };
    }
    return { page: c.page, quote: c.quote?.slice(0, 30), verified: !!c.verified };
  };
  card.fields = (card.fields || []).map((f) => ({ ...f, cite: fix(f.cite) }));
  card.atoms = (card.atoms || []).map((a) => ({ ...a, cite: fix(a.cite) }));
  card.cites = (card.cites || []).map(fix);
  return card;
}

// ---- 分块调用（每块 ~4 页，保证页码定位精度）----
const CHUNK = 4;
const chunks = [];
for (let i = 0; i < pages.length; i += CHUNK) chunks.push(pages.slice(i, i + CHUNK));

const all = [];
for (const [i, chunk] of chunks.entries()) {
  process.stderr.write(`chunk ${i + 1}/${chunks.length} (p.${chunk[0].page}–p.${chunk.at(-1).page}) …\n`);
  const { text } = await generateText({
    model: client(provider.model),
    prompt: buildPrompt(chunk),
    temperature: 0.1,
  });
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) {
    process.stderr.write(`  ! chunk ${i + 1} 未返回 JSON，跳过\n`);
    continue;
  }
  let cards;
  try {
    cards = JSON.parse(m[0]).cards || [];
  } catch {
    process.stderr.write(`  ! chunk ${i + 1} JSON 解析失败，跳过\n`);
    continue;
  }
  all.push(...cards.map(sanitizeCard));
  process.stderr.write(`  + ${cards.length} cards\n`);
}

// review-fix-integrity F：全部 chunk 失败（或无可抽页）→ all 为空——拒绝用空数组
// 覆盖已有的 data/cards/<ch>.entities.json（旧好数据会被抹掉、物料状态被降级）；
// dry-run 仍可打印。非零退出让流水线感知失败。
if (!dry && all.length === 0) {
  const out0 = path.join(ROOT, "data/cards", `${chapterId}.entities.json`);
  const hadOld = fs.existsSync(out0);
  console.error(
    `extracted 0 cards (chunks=${chunks.length})——${hadOld ? `拒绝覆盖已有 ${out0}` : "无产出"}；中止，不写盘`,
  );
  process.exit(1);
}

const doc = {
  source: `data/chapters/${chapterId}.blocks.json`,
  book: blocksDoc.book,
  scope: `${ch.title}（书页 ${bookStart}–${bookEnd}）`,
  pageNote: "page = 印刷书页码",
  generated_by: `extract_cards.mjs · ${provider.model} · ${new Date().toISOString()}`,
  cards: all,
};

// ---- T54 C + T55 C：写盘前 cite↔OCR 机检 + 原子完备（同真算法；只读，不改 verified）----
const pageTextByPage = {};
for (const p of pages) if (p.page != null) pageTextByPage[p.page] = p.text;
const quality = scoreChapter(all, pageTextByPage);
process.stderr.write(
  `质量机检: 卡 ${quality.cards} · 原子 ${quality.atoms} · 有页 cite ${quality.cites} · ` +
    `OCR未见 ${quality.ocrMiss}（missRate ${(quality.missRate * 100).toFixed(1)}%）· ` +
    `无页 ${quality.nullPage} · 零原子卡 ${quality.zeroAtomCards} · ` +
    `空prompt ${quality.emptyPromptAtoms} · 空answer ${quality.emptyAnswerAtoms} · ` +
    `不完备原子 ${quality.incompleteAtoms}\n`,
);
// ---- T57 C：抽出页覆盖兼报（写盘前算；用完整 blocksDoc.pages 与本次抽出 all——与
// pnpm page-check 同真。默认只警告；--strict 高暗拒写见下。绝不发明 cite 填暗页。）----
const pageCov = scoreExtractPageCoverage({ pages: blocksDoc.pages ?? [], cards: all });
if (pageCov.darkCount > 0) {
  const darkSample = pageCov.darkPages
    .slice(0, 8)
    .map((d) => `p.${d.page}(${d.chars}字)`)
    .join(" ");
  process.stderr.write(
    `抽出页覆盖: 实质页 ${pageCov.substantialPages} · 已cite ${pageCov.citedPages} · ` +
      `暗 ${pageCov.darkCount}（darkRate ${(pageCov.darkRate * 100).toFixed(1)}%）——` +
      `暗页样例 ${darkSample}（扉页/小结/跨章扉可能合理暗；pnpm page-check -- --dark ${chapterId} 复核）\n`,
  );
}
// ---- T59 C：抽出后浅密度兼报（写盘前算；用完整 blocksDoc.pages 与本次抽出 all——
// 与 pnpm density-check 同真。默认只警告；--strict 高浅拒写见下。绝不发明原子补浅。）----
const density = scoreExtractPageDensity({ pages: blocksDoc.pages ?? [], cards: all });
if (density.shallowCount > 0) {
  const shallowSample = density.shallowPages
    .slice(0, 8)
    .map((s) => `p.${s.page}(${s.chars}字/${s.atomCount}原子)`)
    .join(" ");
  process.stderr.write(
    `抽出密度: 实质页 ${density.substantialPages} · 有原子页 ${density.citedAtomPages} · ` +
      `浅 ${density.shallowCount}（shallowRate ${(density.shallowRate * 100).toFixed(1)}%）——` +
      `浅页样例 ${shallowSample}（已 cite 实质页原子极稀；pnpm density-check -- --shallow ${chapterId} 复核）\n`,
  );
}
// T55 C + T56 E + T57 C + T59 C：--strict 拒写条件（各条**或**关系，注释为证）：
//   T54   missRate > 0.4（cite↔OCR 未见率）
//   T55   zeroAtomCards > 0（零原子卡）或 incompleteAtoms > 0（空 prompt ∨ 空 answer）
//   T56   parseCov.coverageRate < 0.5 或 parseCov.emptyPages > 0（OCR 覆盖偏弱，可 null=未检）
//   T57   pageCov.darkRate ≥ 0.35 或 darkCount ≥ 5（抽出页覆盖极稀——实质页大量未成原子）
//   T59   density.shallowRate ≥ 0.35 或 shallowCount ≥ 5（浅密度极稀——已 cite 实质页原子极少）
const parseStrictFail =
  parseCov != null && (parseCov.coverageRate < 0.5 || parseCov.emptyPages > 0);
const pageStrictFail = pageCov.darkRate >= 0.35 || pageCov.darkCount >= 5;
const densityStrictFail = density.shallowRate >= 0.35 || density.shallowCount >= 5;
if (
  strict &&
  (quality.missRate > 0.4 ||
    quality.zeroAtomCards > 0 ||
    quality.incompleteAtoms > 0 ||
    parseStrictFail ||
    pageStrictFail ||
    densityStrictFail)
) {
  const outStrict = path.join(ROOT, "data/cards", `${chapterId}.entities.json`);
  const hadOldStrict = fs.existsSync(outStrict);
  console.error(
    `--strict 拒绝：missRate ${(quality.missRate * 100).toFixed(1)}%（>40%）/ 零原子卡 ${quality.zeroAtomCards} / ` +
      `不完备原子 ${quality.incompleteAtoms} / 抽出暗页 ${pageCov.darkCount}（darkRate ` +
      `${(pageCov.darkRate * 100).toFixed(1)}%，阈值 35% 或 ≥5 页）/ 浅页 ${density.shallowCount}（shallowRate ` +
      `${(density.shallowRate * 100).toFixed(1)}%，阈值 35% 或 ≥5 页）任一命中——` +
      `${hadOldStrict ? `拒绝覆盖已有 ${outStrict}` : "拒绝写盘"}；可 pnpm cite-check -- --misses ${chapterId} 或 pnpm density-check -- --shallow ${chapterId} 看样例后人工复核`,
  );
  process.exit(1);
}

if (dry) {
  console.log(JSON.stringify(doc, null, 1));
} else {
  const out = path.join(ROOT, "data/cards", `${chapterId}.entities.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(doc, null, 1));
  console.log(`wrote ${out} (${all.length} cards)`);
}
