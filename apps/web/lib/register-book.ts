import fs from "node:fs";
import path from "node:path";
import {
  repoRoot,
  loadMaterials,
  deriveMaterialStage,
  type ChapterConfig,
  type BookConfig,
} from "@/lib/entities";

/**
 * 注册书目进书库（T22 register 核心，服务端纯函数，便于抽测）：
 * 把一条 extracted 物料的全部章合并写进 config/chapter.json + config/books.json，
 * 使 deriveMaterialStage 推进到 ready（书库/书桌/学习/核页随之可见）。
 *
 * 硬规则：
 * - 仅 extracted 可注册（uploaded/parsed 尚未本机抽取完，ready 已注册）。
 * - 任一章 id 已存在（含 seed ch01–ch07）→ 整单失败，绝不半写、绝不覆盖 seed 章表。
 * - 新 bookId 新书；bookId 冲突失败。默认由物料 id 派生新 bookId。
 * - 本机写盘（config 落盘），非云同步、非云端 OCR。
 *
 * review-fix-integrity A/B：
 * - fail-closed 读——config 文件存在但 JSON 坏 / 根非对象 / 缺合法 chapters|books 数组
 *   → 整单 500，禁止把损坏文件当空对象 `?? {}` 继续写（那会抹掉 seed 章表/书表）。
 * - 模块级 mutex + 同目录 tmp→rename 原子写——冲突检查与双文件写入同在锁内，
 *   并发 register 不交错半写；主文件任何时刻都是完整合法 JSON（旧版或新版）。
 */

export type RegisterResult =
  | { ok: true; bookId: string; chapterIds: string[] }
  | { ok: false; error: string; status: number };

// config 文件名白名单：read/write 只接受这两个字面量，阻断 rel 参数拼接路径的穿越面
const CONFIG_FILE_ALLOWLIST = ["chapter.json", "books.json"] as const;
type ConfigFileName = (typeof CONFIG_FILE_ALLOWLIST)[number];

function configPath(rel: ConfigFileName): string {
  if (!(CONFIG_FILE_ALLOWLIST as readonly string[]).includes(rel)) {
    throw new Error(`config 文件名不在白名单：${rel}`);
  }
  return path.join(repoRoot(), "config", rel);
}

/**
 * fail-closed 读（A）：文件不存在 → null（唯一可当「空库」的情形）；
 * 存在但坏（解析失败 / 根非对象 / 缺合法数组键）→ 抛错，调用方整单失败。
 * 同时校验 arrayKey（chapters|books）是数组——结构坏 ≠ 空。
 */
function readRawConfig(rel: ConfigFileName, arrayKey: "chapters" | "books"): Record<string, unknown> | null {
  const file = configPath(rel);
  if (!fs.existsSync(file)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw new Error(`config/${rel} 不是合法 JSON——拒绝注册写盘，请先修复该文件`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`config/${rel} 根不是 JSON 对象——拒绝注册写盘`);
  }
  const arr = (parsed as Record<string, unknown>)[arrayKey];
  if (!Array.isArray(arr)) {
    throw new Error(`config/${rel} 缺合法的 "${arrayKey}" 数组——拒绝注册写盘`);
  }
  return parsed as Record<string, unknown>;
}

/** 原子写（B）：同目录 tmp 写满再 rename；禁止直接 truncate 主文件。 */
function writeRawConfig(rel: ConfigFileName, obj: unknown): void {
  const file = configPath(rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Date.now().toString(36)}`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
    fs.renameSync(tmp, file);
  } catch (e) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* tmp 可能尚未创建 */
    }
    throw e;
  }
}

/** 默认 bookId：m-<ts36> → book-<ts36>（唯一、合法、与物料一一对应）。 */
function deriveBookId(id: string): string {
  return `book-${id.replace(/^m-/, "")}`;
}

/** 模块级互斥（B）：串行化「读检查 → 写双文件」整个临界区；失败不堵后续请求，只保序。 */
let registerLock: Promise<unknown> = Promise.resolve();

export function registerBook(input: {
  materialId: string;
  bookId?: string;
  title?: string;
}): Promise<RegisterResult> {
  const result = registerLock.then(() => registerBookLocked(input));
  registerLock = result.catch(() => undefined);
  return result;
}

function registerBookLocked(input: {
  materialId: string;
  bookId?: string;
  title?: string;
}): RegisterResult {
  const mat = loadMaterials().find((m) => m.id === input.materialId);
  if (!mat) return { ok: false, error: "物料不存在，无法注册", status: 404 };

  const stage = deriveMaterialStage(mat);
  if (stage !== "extracted") {
    return {
      ok: false,
      error: `物料当前状态为「${stage}」，只有 extracted（全部章已本机抽取、尚未注册）可一键上架`,
      status: 409,
    };
  }

  // fail-closed 读两个 config（A）：坏文件在写盘前整单失败（503——本机磁盘态坏，非请求错）。
  let chapterRaw: Record<string, unknown> | null;
  let bookRaw: Record<string, unknown> | null;
  try {
    chapterRaw = readRawConfig("chapter.json", "chapters");
    bookRaw = readRawConfig("books.json", "books");
  } catch (e) {
    return { ok: false, error: (e as Error).message, status: 503 };
  }
  const chapterCfg = (chapterRaw?.chapters as ChapterConfig[] | undefined) ?? [];
  const bookCfg = (bookRaw?.books as BookConfig[] | undefined) ?? [];

  // 章 id 冲突：以将要写回的原始章表为准查清再决定写盘——冲突即整单失败
  // （不写任何文件、不覆盖 seed；用 raw 列表而非 loadChapters()，避免后者吞坏文件误判为空）。
  const existingChapterIds = new Set(chapterCfg.map((c) => c.id));
  const conflictIds = mat.chapters.map((c) => c.id).filter((id) => existingChapterIds.has(id));
  if (conflictIds.length > 0) {
    return {
      ok: false,
      error: `章 id 已存在（拒绝整单，不覆盖 seed 章表）：${conflictIds.join("、")}`,
      status: 409,
    };
  }

  const bookId = input.bookId?.trim() ?? deriveBookId(mat.id);
  if (!/^[\w-]{2,64}$/.test(bookId)) {
    return { ok: false, error: "bookId 不合法（2–64 位字母/数字/下划线/连字符）", status: 400 };
  }
  if (bookCfg.some((b) => b.id === bookId)) {
    return { ok: false, error: `bookId 已存在：${bookId}`, status: 409 };
  }

  const title = (input.title ?? mat.title).trim();
  if (!title) return { ok: false, error: "缺少书名 title", status: 400 };

  // 新章条目：物理范围沿用物料；pageOffset 用物料口径，保证 citation 页码=(物理页−offset) 一致。
  const newChapters: ChapterConfig[] = mat.chapters.map((c) => ({
    id: c.id,
    title: c.title,
    physicalStart: c.physicalStart,
    physicalEnd: c.physicalEnd,
    pageOffset: mat.pageOffset,
  }));

  // 读原始文件，保留 $comment/pdf/ocr 等其它顶层字段，仅追加 chapters / books 数组。
  const nextChapters = [...chapterCfg, ...newChapters];
  const newBook: BookConfig = {
    id: bookId,
    title,
    source: mat.pdfFile,
    chapterIds: mat.chapters.map((c) => c.id),
  };
  const nextBooks = [...bookCfg, newBook];

  // 校验全部通过后才落盘（先 chapter 后 books；tmp→rename 原子替换，并发由模块锁串行）。
  try {
    writeRawConfig("chapter.json", { ...(chapterRaw ?? {}), chapters: nextChapters });
    writeRawConfig("books.json", { ...(bookRaw ?? {}), books: nextBooks });
  } catch (e) {
    return { ok: false, error: `config 写盘失败：${(e as Error).message}`, status: 500 };
  }

  return { ok: true, bookId, chapterIds: mat.chapters.map((c) => c.id) };
}
