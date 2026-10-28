/**
 * T95 机械抽出：原 lib/entities.ts io-cache 分区（repoRoot · 私有 readJson · T74 进程内指纹门控
 * memo：私有 JsonMemoEntry / jsonMemo · entitiesCacheStats · clearEntitiesCache · 私有 deepFreeze ·
 * 私有 statFingerprint · readJsonMemoized）整段迁此——指纹 `${floor(mtimeMs)}:${size}`、
 * null 永不当命中、无 TTL / 无 revalidate、deepFreeze 只读合同、clearEntitiesCache 清 Map+计数
 * 逐字一致。readJsonMemoized 为 loaders / materials 跨文件所需由私有升 named export
 * （本刀唯一可见性变更；签名 / 语义零改；经 barrel export * 可达，但不是页面消费面——
 * loaders / materials 已封装读路径）。
 * 本件独占 fs/path + memo Map：← node:fs / node:path only；零 sibling import；
 * 禁 import loaders / query / materials。
 */

import fs from "node:fs";
import path from "node:path";

// apps/web → 仓库根（config/ 与 data/ 在根下）。部署时可用 ARIADNE_DATA 覆盖。
export function repoRoot(): string {
  return process.env.ARIADNE_DATA
    ? process.env.ARIADNE_DATA
    : path.resolve(process.cwd(), "..", "..");
}

function readJson<T>(file: string): T | undefined {
  if (!fs.existsSync(file)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return undefined;
  }
}

// ---- T74：进程内指纹门控 memo（只读加速层，不是任何可写路径）----
//
// 合同（与 fingerprintFile / ArtifactFingerprint 同口径的 mtimeMs+size）：
// - key = 文件绝对路径；指纹 = `${floor(mtimeMs)}:${size}`。
// - 命中 ⇔ 当前指纹非空且与缓存一致 ⇒ 返回上次解析结果（≡ 该指纹时刻磁盘内容的解析）。
// - 失效（miss）⇔ 新增/删除/改写（mtimeMs 或 size 变）或 stat 不可读——不可读一律按
//   变更处理重读，绝不把「读不到」当命中回旧数据；无 TTL / 无 revalidate 秒数充当新鲜度。
// - 目录（data/cards、data/chapters）：文件名集合每调用 readdir 现取，增删文件天然 miss；
//   省的是每文件 readFile+JSON.parse，stat/readdir 元数据照常付。
// - 缓存文档 deepFreeze：调用方约定只读（已审计全库无就地改动）；冻结让任何未来的就地
//   改动当场抛错，而不是静默污染缓存串成「陈旧绿卡 / 假计数」。
// - 公共 API（loadCards/loadCard/loadChapters/loadBooks/loadChapterPages/loadAllChapterPages）
//   签名与返回语义不变：bookId∩chapterId 交集、坏文件 skip+warn、isUsableCard 全保留；
//   物料归因（fingerprintFile/snapshotArtifactBaseline/materialOwnsArtifact/deriveMaterialStage）
//   不走本层、语义不动。

type JsonMemoEntry = { fp: string | null; doc: unknown };

const jsonMemo = new Map<string, JsonMemoEntry>();

/** 只读命中/未命中计数（夹具与验收证据用；clearEntitiesCache 一并清零）。 */
export const entitiesCacheStats = { hits: 0, misses: 0 };

/** 夹具/测试钩子：清空进程内 JSON memo 并清零计数。纯读侧缓存，无任何可写数据路径。 */
export function clearEntitiesCache(): void {
  jsonMemo.clear();
  entitiesCacheStats.hits = 0;
  entitiesCacheStats.misses = 0;
}

function deepFreeze<T>(v: T): T {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) {
    for (const x of v) deepFreeze(x);
  } else {
    for (const k of Object.keys(v as Record<string, unknown>)) {
      deepFreeze((v as Record<string, unknown>)[k]);
    }
  }
  Object.freeze(v);
  return v;
}

/** 与 fingerprintFile 同口径的 stat 指纹键；缺失/不可读 → null（null 永不当作命中）。 */
function statFingerprint(file: string): string | null {
  try {
    const st = fs.statSync(file);
    return `${Math.floor(st.mtimeMs)}:${st.size}`;
  } catch {
    return null;
  }
}

export function readJsonMemoized<T>(file: string): T | undefined {
  const fp = statFingerprint(file);
  const prev = jsonMemo.get(file);
  if (fp !== null && prev?.fp === fp) {
    entitiesCacheStats.hits++;
    return prev.doc as T | undefined;
  }
  entitiesCacheStats.misses++;
  const doc = readJson<T>(file);
  jsonMemo.set(file, { fp, doc: doc === undefined ? undefined : deepFreeze(doc) });
  return doc;
}
