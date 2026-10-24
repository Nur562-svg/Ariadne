#!/usr/bin/env node
/**
 * DRY-RUN ONLY · never writes entities —— T64 B：seed-apply 干跑 CLI
 * （`pnpm seed-apply-check`）。把书桌 DraftInbox 导出的 T62 统一补丁包
 * （ariadne.atom-draft-pack.v1）与**当前仓库 seed**（data/cards/*.entities.json，
 * 与 buildSeedApplyGuide 的 seedPath 同口径）只读对照，逐条分列五种 status；
 * 永不写 entities / blocks / config，永不 verified:true，永不 auto PATCH，
 * 没有也不允许 --write / --apply 写模式，永不「一键写回仓库」。
 *
 * 用法：
 *   pnpm seed-apply-check -- --pack ariadne-atom-draft-pack.json
 *   cat ariadne-atom-draft-pack.json | pnpm seed-apply-check
 *   pnpm seed-apply-check -- --help
 *
 * 输出：stdout 五分列 counts + 逐条摘要；报告落
 * data/qa/<YYYYMMDD-HHmmss>.seed-apply-dryrun.json（**报告非 seed 真源**——
 * 与 cite-ocr.json / quality-rollup.json 同族 qa 报告，gitignored，绝不回写）。
 * 缺 pack / 坏 JSON / 非法 schema → 非零退出，不写假绿报告（fail-closed）。
 */
import fs from "node:fs";
import path from "node:path";
import { buildSeedApplyDryRun } from "./lib/seed-apply-dry-run.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const HELP = `DRY-RUN ONLY · never writes entities —— 草稿补丁包 ↔ 当前 seed 只读对照（T64）

用法：
  pnpm seed-apply-check -- --pack <pack.json>   # 书桌 DraftInbox 导出的 ariadne.atom-draft-pack.v1
  cat <pack.json> | pnpm seed-apply-check       # 或从 stdin 读同一 JSON
  pnpm seed-apply-check -- --help

分列（互斥，禁止合成「应用成功率%」）：
  would-change      seed 现值 ≠ 草稿值——人核后由人改 data/cards/<章>.entities.json
  already-matches   seed 现值已 === 草稿值——无需再改
  missing-card      章文件在、卡不在（可能已被重抽/删除）
  missing-seed-file data/cards/<chapterId>.entities.json 缺失
  invalid           条目形状坏 / target 解析不了 / 引用的原子·字段在当前 seed 不存在

硬合同：本 CLI 永不写 data/cards · data/chapters · config；唯一可写 = data/qa 报告
（非真源）。永不 verified:true、永不 auto PATCH、没有 --write/--apply 模式。
人核落盘步骤见 docs/seed-apply-mac-pr.md（导出 → 干跑 → 人改 seed → commit/PR）。`;

const argv = process.argv.slice(2);

// 禁写模式旗标（合同 5）：传了就硬拒——不是忽略，是非零退出 + DRY-RUN ONLY 提示。
for (const a of argv) {
  if (a === "--write" || a === "--apply" || a.startsWith("--write=") || a.startsWith("--apply=")) {
    console.error(`DRY-RUN ONLY · never writes entities —— 本 CLI 没有也不允许写模式。`);
    console.error(`收到非法旗标「${a}」：seed-apply 永不写 entities；人核后由人改 seed / 开 PR（docs/seed-apply-mac-pr.md）。`);
    process.exit(2);
  }
}

if (argv.includes("--help") || argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

// 只认 --pack <file> / --pack=<file>；裸 `--`（pnpm 透传的参数分隔符）跳过；
// 其余未知旗标与位置参数 fail-closed（不静默吞）。
let packPath = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--") continue;
  if (a === "--pack") {
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      console.error("--pack 需要一个文件路径（--pack ariadne-atom-draft-pack.json）");
      process.exit(1);
    }
    packPath = next;
    i++;
  } else if (a.startsWith("--pack=")) {
    packPath = a.slice("--pack=".length);
  } else {
    console.error(`未知参数「${a}」。${HELP}`);
    process.exit(1);
  }
}

/** 读 pack：--pack 文件优先，否则 stdin（管道）；都空 → 非零退出。 */
function readPackText() {
  if (packPath != null) {
    if (!fs.existsSync(packPath)) {
      console.error(`pack 文件不存在：${packPath}——先在书桌 DraftInbox「下载 .json」导出（docs/seed-apply-mac-pr.md）。`);
      process.exit(1);
    }
    return fs.readFileSync(packPath, "utf8");
  }
  if (process.stdin.isTTY) {
    console.error("缺 pack：用 --pack <file>，或 `cat pack.json | pnpm seed-apply-check` 从 stdin 传入。");
    console.error(HELP);
    process.exit(1);
  }
  return new Promise((resolve) => {
    let buf = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (buf += c));
    process.stdin.on("end", () => resolve(buf));
  });
}

const packSource = packPath != null ? packPath : "stdin";

const packText = await readPackText();
if (!packText.trim()) {
  console.error("pack 输入为空（stdin 无内容）——没有可对照的补丁包，不写报告。");
  process.exit(1);
}

let pack;
try {
  pack = JSON.parse(packText);
} catch (err) {
  console.error(`pack 不是合法 JSON（${err.message}）——整包拒收，不写假绿报告。请从书桌 DraftInbox 重新导出。`);
  process.exit(1);
}

// F：schema 校验——只认 T62 统一补丁包；非法 schema / 缺 cards 数组整包拒收。
if (pack?.schema !== "ariadne.atom-draft-pack.v1") {
  console.error(
    `pack.schema 不是 ariadne.atom-draft-pack.v1（收到 ${JSON.stringify(pack?.schema ?? null)}）——整包拒收。` +
      ` 请用书桌 DraftInbox「复制统一补丁包 / 下载 .json」导出的原文件。`,
  );
  process.exit(1);
}
if (!Array.isArray(pack.cards)) {
  console.error("pack.cards 缺失或不是数组——整包拒收（补丁包损坏，请重新导出）。");
  process.exit(1);
}

// ---- 装载当前 seed（只读；与 buildSeedApplyGuide seedPath 同口径 data/cards/<ch>.entities.json） ----
const cardsDir = path.join(ROOT, "data", "cards");
const chapterFiles = fs.existsSync(cardsDir)
  ? fs.readdirSync(cardsDir).filter((f) => f.endsWith(".entities.json"))
  : [];
/** chapterId → Map<cardId, card>（只装 id/atoms/fields——对照所需最小面）。 */
const byChapter = new Map();
/** cardId → { card, chapterId }（无 chapterId 的 pack 卡全局兜底解析用）。 */
const globalById = new Map();
for (const f of chapterFiles) {
  const ch = f.replace(/\.entities\.json$/, "");
  const file = path.join(cardsDir, f);
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    // 坏章文件 → 当缺失处理（fail-closed：该章条目如实 missing-seed-file，不装成功）。
    console.error(`[seed-apply-check] data/cards/${f} 不是合法 JSON（${err.message}）——按章文件缺失处理`);
    continue;
  }
  const map = new Map();
  for (const c of Array.isArray(doc?.cards) ? doc.cards : []) {
    if (c == null || typeof c.id !== "string" || c.id.length === 0) continue;
    map.set(c.id, c);
    if (!globalById.has(c.id)) globalById.set(c.id, { card: c, chapterId: ch });
  }
  byChapter.set(ch, map);
}

const presentChapters = new Set(byChapter.keys());
const packChapterIds = [
  ...new Set(
    pack.cards
      .map((d) => (typeof d?.chapterId === "string" ? d.chapterId : null))
      .filter((x) => x != null),
  ),
];
// 缺章 = 文件不存在或坏 JSON（坏文件未入 byChapter——fail-closed 同列 missing-seed-file）。
const missingSeedChapters = packChapterIds.filter((ch) => !presentChapters.has(ch));

/** 按声明章解析：只在该章文件内找卡（guide 指向该章文件，不跨章代找）；无声明 → 全局兜底。 */
function loadCard(cardId, chapterId) {
  if (chapterId != null) return byChapter.get(chapterId)?.get(cardId) ?? null;
  return globalById.get(cardId)?.card ?? null;
}

const report = buildSeedApplyDryRun({
  pack,
  loadCard,
  missingSeedChapters,
});

// ---- 报告（唯一可写产物；非 seed 真源） ----
const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace("T", "-")
  .slice(0, 15); // YYYYMMDD-HHMMSS（UTC 戳，报告名只用于区分运行）
const qaDir = path.join(ROOT, "data", "qa");
fs.mkdirSync(qaDir, { recursive: true });
const outPath = path.join(qaDir, `${stamp}.seed-apply-dryrun.json`);
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      schema: report.schema,
      generatedAt: report.generatedAt,
      packSource,
      packExportedAt: typeof pack.exportedAt === "string" ? pack.exportedAt : null,
      packCardCount: report.packCardCount,
      packEntryCount: report.entries.length,
      packChapters: packChapterIds,
      counts: report.counts,
      entries: report.entries,
      note: report.note,
    },
    null,
    1,
  ),
);

// ---- stdout：首行写死 DRY-RUN ONLY；五分列 counts；逐条摘要（前 20 条） ----
const c = report.counts;
const entryTotal = report.entries.length;
console.log("DRY-RUN ONLY · never writes entities（只对照当前 seed，不写 data/cards / blocks / config）");
console.log(
  `pack: ${packSource}（schema ariadne.atom-draft-pack.v1 · 卡 ${report.packCardCount} · 条目 ${entryTotal}` +
    `${typeof pack.exportedAt === "string" ? ` · 导出于 ${pack.exportedAt}` : ""}）`,
);
console.log(
  `would-change ${c["would-change"]} · already-matches ${c["already-matches"]} · missing-card ${c["missing-card"]} · missing-seed-file ${c["missing-seed-file"]} · invalid ${c.invalid}`,
);
if (entryTotal === 0) {
  console.log("（包内 0 条真改动条目——无可对照项；这不是「已应用」，是包本身为空。）");
}
const SAMPLE = 20;
for (const e of report.entries.slice(0, SAMPLE)) {
  const drift = e.drift ? " · drift（seed 在导出后又被改过）" : "";
  const before = e.before == null ? "（seed 无此文本——新增候选）" : e.before.replace(/\r?\n/g, " ⏎ ").slice(0, 60);
  const after = e.after.replace(/\r?\n/g, " ⏎ ").slice(0, 60);
  console.log(`  [${e.status}] ${e.cardId}${e.chapterId ? ` @${e.chapterId}` : ""} · ${e.target} · ${e.field}${drift}`);
  if (e.status === "would-change" || e.status === "already-matches") {
    console.log(`      before: ${before}`);
    console.log(`      after:  ${after}`);
  }
}
if (entryTotal > SAMPLE) console.log(`  …其余 ${entryTotal - SAMPLE} 条见报告`);
console.log(`  → ${path.relative(ROOT, outPath)}（报告非真源 · dry-run ≠ 已落盘）`);
console.log(
  "人核后由人改 data/cards/<章>.entities.json → git add 指名实体文件 → commit / PR；浏览器/CLI 都不会写回仓库（docs/seed-apply-mac-pr.md）。",
);
process.exit(0);
