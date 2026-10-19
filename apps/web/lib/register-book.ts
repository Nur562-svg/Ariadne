import fs from "node:fs";
import path from "node:path";
import {
  repoRoot,
  loadMaterials,
  loadChapters,
  loadBooks,
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

function readRawConfig(rel: ConfigFileName): unknown {
  const file = configPath(rel);
  if (!fs.existsSync(file)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

function writeRawConfig(rel: ConfigFileName, obj: unknown): void {
  const file = configPath(rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

/** 默认 bookId：m-<ts36> → book-<ts36>（唯一、合法、与物料一一对应）。 */
function deriveBookId(id: string): string {
  return `book-${id.replace(/^m-/, "")}`;
}

export function registerBook(input: {
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

  // 章 id 冲突：先查清再决定写盘——冲突即整单失败（不写任何文件、不覆盖 seed）。
  const existingChapters = loadChapters();
  const existingChapterIds = new Set(existingChapters.map((c) => c.id));
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
  const existingBooks = loadBooks();
  if (existingBooks.some((b) => b.id === bookId)) {
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
  const chapterRaw = (readRawConfig("chapter.json") ?? {}) as {
    chapters?: ChapterConfig[];
  };
  const chapterCfg = Array.isArray(chapterRaw.chapters) ? chapterRaw.chapters : [];
  const nextChapters = [...chapterCfg, ...newChapters];

  const bookRaw = (readRawConfig("books.json") ?? {}) as { books?: BookConfig[] };
  const bookCfg = Array.isArray(bookRaw.books) ? bookRaw.books : [];
  const newBook: BookConfig = {
    id: bookId,
    title,
    source: mat.pdfFile,
    chapterIds: mat.chapters.map((c) => c.id),
  };
  const nextBooks = [...bookCfg, newBook];

  // 校验全部通过后才落盘（先 chapter 后 books；冲突已在写前查清）。
  writeRawConfig("chapter.json", { ...(chapterRaw ?? {}), chapters: nextChapters });
  writeRawConfig("books.json", { ...(bookRaw ?? {}), books: nextBooks });

  return { ok: true, bookId, chapterIds: mat.chapters.map((c) => c.id) };
}