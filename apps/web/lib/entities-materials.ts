/**
 * T95 机械抽出：原 lib/entities.ts materials 分区（loadMaterials · chapterHasBlocks ·
 * chapterHasCards · fingerprintFile · snapshotArtifactBaseline · 私有 fingerprintsDiffer ·
 * 私有 materialOwnsArtifact · materialChapterHasBlocks · materialChapterHasCards ·
 * deriveMaterialStage）整段迁此——T77 物料读走 readJsonMemoized 同 jsonMemo 键空间、
 * fingerprintFile mtimeMs+size 口径、materialOwnsArtifact 相对 artifactBaseline 变化 / 无基线
 * mtime>createdAt fail-closed、deriveMaterialStage uploaded→parsed→extracted→ready|failed
 * 磁盘事实推导 逐字一致；私有 fingerprintsDiffer / materialOwnsArtifact 不经 barrel 外泄。
 * 本件 ← ./entities-types.ts（type-only）+ ./entities-io.ts（repoRoot · readJsonMemoized）
 * + ./entities-loaders.ts（loadBooks）；禁 import query。
 */

import fs from "node:fs";
import path from "node:path";
import type { ArtifactFingerprint, ChapterDoc, Material, MaterialStage } from "./entities-types.ts";
import { readJsonMemoized, repoRoot } from "./entities-io.ts";
import { loadBooks } from "./entities-loaders.ts";

// ---- ingest：物料记录 + 诚实状态推导 ----

export function loadMaterials(): Material[] {
  const dir = path.join(repoRoot(), "data", "materials");
  if (!fs.existsSync(dir)) return [];
  // T77：物料文件读走 readJsonMemoized（T74 同一 jsonMemo 键空间）；目录 readdir 仍每调用
  // 现取——增删 .material.json 天然可见；坏文件缓存 undefined（指纹未变时命中返回 undefined
  // 走同一 skip 分支），改写必 miss 重读。
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".material.json"))
    .sort()
    .flatMap((f) => {
      const m = readJsonMemoized<Material>(path.join(dir, f));
      return m ? [m] : [];
    });
}

/** 章是否已有真实 OCR blocks（至少一页带正文文本）。无 blocks 一律不算 parsed。 */
export function chapterHasBlocks(chapterId: string): boolean {
  const file = path.join(repoRoot(), "data", "chapters", `${chapterId}.blocks.json`);
  // T77：与 loadChapterPages / loadAllChapterPages 同一绝对路径 → 同一 jsonMemo 键，
  // ingest 同请求双通道（materialChapterHas* 先读、loadChapterPages 后读）第二读命中。
  const doc = readJsonMemoized<ChapterDoc>(file);
  return !!doc?.pages?.some((p) => (p.text ?? "").trim().length > 0);
}

/** 章是否已有抽取产出的实体卡。 */
export function chapterHasCards(chapterId: string): boolean {
  const file = path.join(repoRoot(), "data", "cards", `${chapterId}.entities.json`);
  // T77：与 loadCards 逐文件读同一绝对路径 → 同一 jsonMemo 键（跨通道命中，见上）。
  const doc = readJsonMemoized<{ cards?: unknown[] }>(file);
  return !!doc?.cards?.length;
}

/** 读取文件指纹；不存在 → { mtimeMs: null, size: null }。 */
export function fingerprintFile(file: string): ArtifactFingerprint {
  if (!fs.existsSync(file)) return { mtimeMs: null, size: null };
  try {
    const st = fs.statSync(file);
    return { mtimeMs: Math.floor(st.mtimeMs), size: st.size };
  } catch {
    return { mtimeMs: null, size: null };
  }
}

/** 上传时快照各章 blocks/cards 指纹，供 deriveMaterialStage 绑定本物料。 */
export function snapshotArtifactBaseline(
  chapterIds: string[],
): NonNullable<Material["artifactBaseline"]> {
  const root = repoRoot();
  const out: NonNullable<Material["artifactBaseline"]> = {};
  for (const id of chapterIds) {
    out[id] = {
      blocks: fingerprintFile(path.join(root, "data", "chapters", `${id}.blocks.json`)),
      cards: fingerprintFile(path.join(root, "data", "cards", `${id}.entities.json`)),
    };
  }
  return out;
}

function fingerprintsDiffer(a: ArtifactFingerprint, b: ArtifactFingerprint): boolean {
  return a.mtimeMs !== b.mtimeMs || a.size !== b.size;
}

/**
 * 本物料是否「拥有」该章的某类产物：文件存在且相对上传基线已变化。
 * 无基线时退化为 mtime > createdAt（fail-closed：上传前已存在的 seed 不算）。
 */
function materialOwnsArtifact(
  m: Material,
  chapterId: string,
  kind: "blocks" | "cards",
): boolean {
  const file =
    kind === "blocks"
      ? path.join(repoRoot(), "data", "chapters", `${chapterId}.blocks.json`)
      : path.join(repoRoot(), "data", "cards", `${chapterId}.entities.json`);
  const cur = fingerprintFile(file);
  if (cur.mtimeMs == null) return false;

  const baseline = m.artifactBaseline?.[chapterId]?.[kind];
  if (baseline) {
    return fingerprintsDiffer(cur, baseline);
  }

  // 旧记录无基线：只认上传时间之后写出的文件，绝不把 seed 归因到新 job。
  const createdMs = Date.parse(m.createdAt);
  if (!Number.isFinite(createdMs)) return false;
  return cur.mtimeMs > createdMs;
}

/** 本物料的该章是否已有真实 OCR blocks（且为本物料写出，非 seed 归因）。 */
export function materialChapterHasBlocks(m: Material, chapterId: string): boolean {
  return materialOwnsArtifact(m, chapterId, "blocks") && chapterHasBlocks(chapterId);
}

/** 本物料的该章是否已有抽取实体卡（且为本物料写出，非 seed 归因）。 */
export function materialChapterHasCards(m: Material, chapterId: string): boolean {
  return materialOwnsArtifact(m, chapterId, "cards") && chapterHasCards(chapterId);
}

/**
 * 状态机（fail-closed）：全部由「本物料」的磁盘事实推导，禁止凭空标 parsed/extracted/ready。
 * 关键产物路径仍是 data/chapters/<id>.blocks.json / data/cards/<id>.entities.json，
 * 但必须相对 artifactBaseline（或 createdAt）发生变化才算本 job 的产出——禁止把 seed ch01 算到新上传头上。
 * - failed：记录里显式标失败
 * - ready：全部章有本物料写出的卡，且已注册进 config/books.json（图书馆可见）
 * - extracted：全部章有本物料写出的卡（但未注册进书库）
 * - parsed：全部章有本物料写出的真实 blocks
 * - uploaded：其余（只有上传记录，或磁盘上仍是上传前的 seed）
 */
export function deriveMaterialStage(m: Material): MaterialStage {
  if (m.status === "failed") return "failed";
  const ids = m.chapters.map((c) => c.id);
  if (ids.length === 0) return "uploaded";
  if (!ids.every((id) => materialChapterHasBlocks(m, id))) return "uploaded";
  if (!ids.every((id) => materialChapterHasCards(m, id))) return "parsed";
  const registered = loadBooks().some((b) => ids.every((id) => b.chapterIds.includes(id)));
  return registered ? "ready" : "extracted";
}
