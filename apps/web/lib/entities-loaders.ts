/**
 * T95 机械抽出：原 lib/entities.ts loaders 分区（loadChapters · loadBooks · 私有 isUsableCard ·
 * loadCards · loadCard · loadCardDocMeta · loadChapterPages · loadAllChapterPages ·
 * findPageByPrinted · loadBookValidPages）整段迁此——bookId∩chapterId 交集、坏文件 skip+warn、
 * isUsableCard 最小 shape 校验、印刷页按 page 去重先出现章优先、T31 C 各书有效页集合 逐字一致；
 * 私有 isUsableCard 不经 barrel 外泄。
 * 本件 ← ./entities-types.ts（type-only）+ ./entities-io.ts（repoRoot · readJsonMemoized）；
 * 禁 import query / materials。
 */

import fs from "node:fs";
import path from "node:path";
import type { BookConfig, ChapterConfig, ChapterDoc, EntityCard, PageDoc } from "./entities-types.ts";
import { readJsonMemoized, repoRoot } from "./entities-io.ts";

export function loadChapters(): ChapterConfig[] {
  const file = path.join(repoRoot(), "config", "chapter.json");
  const cfg = readJsonMemoized<{ chapters?: ChapterConfig[] }>(file);
  return cfg?.chapters ?? [];
}

export function loadBooks(): BookConfig[] {
  const file = path.join(repoRoot(), "config", "books.json");
  const cfg = readJsonMemoized<{ books?: BookConfig[] }>(file);
  return cfg?.books ?? [];
}

/**
 * 单卡最小 shape 校验（review-fix-integrity F）：缺硬字段/数组不是数组的卡 skip + warn，
 * 不让一张坏卡在 cardsCitingPage / collectStudyAtoms / EntityCardDetail 里炸成整站 500。
 * 只查下游真正解引用的字段（id/name_zh/fields/cites/atoms），不做 schema 全验。
 */
function isUsableCard(c: unknown): c is EntityCard {
  if (c === null || typeof c !== "object" || Array.isArray(c)) return false;
  const o = c as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    o.id.length > 0 &&
    typeof o.name_zh === "string" &&
    Array.isArray(o.fields) &&
    Array.isArray(o.cites) &&
    Array.isArray(o.atoms)
  );
}

export function loadCards(opts?: { chapterId?: string; bookId?: string }): EntityCard[] {
  const dir = path.join(repoRoot(), "data", "cards");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];

  let allowed: Set<string> | undefined;
  if (opts?.bookId) {
    const book = loadBooks().find((b) => b.id === opts.bookId);
    if (!book) return [];
    // bookId + chapterId：交集——章须属于该书，否则空（与 collectCiteQueue 一致）。
    // 仅 bookId 时保持全书章；仅 chapterId（无 book）走下方分支。
    if (opts.chapterId) {
      if (!book.chapterIds.includes(opts.chapterId)) return [];
      allowed = new Set([opts.chapterId]);
    } else {
      allowed = new Set(book.chapterIds);
    }
  } else if (opts?.chapterId) {
    allowed = new Set([opts.chapterId]);
  }

  const cards: EntityCard[] = [];
  for (const f of files.sort()) {
    const chapterId = f.replace(/\.entities\.json$/, "");
    if (allowed && !allowed.has(chapterId)) continue;
    // 逐文件韧性（review-fix-integrity F）：readJson 吞 parse 错返回 undefined →
    // skip + warn（不静默消失）；根非对象 / cards 非数组同理，绝不拖垮整站。
    // T74：readJsonMemoized 指纹门控——坏文件缓存的是 undefined，指纹未变时命中返回
    // undefined 走同一 warn 分支（同字节解析结果确定）；指纹变了（含改成好文件）必 miss 重读。
    const doc = readJsonMemoized<{ cards?: unknown }>(path.join(dir, f));
    if (!doc || typeof doc !== "object" || !Array.isArray(doc.cards)) {
      console.warn(`[loadCards] data/cards/${f} 不是含 cards 数组的合法 JSON——整文件跳过`);
      continue;
    }
    let skipped = 0;
    for (const c of doc.cards) {
      if (!isUsableCard(c)) {
        skipped++;
        continue;
      }
      cards.push({ ...c, chapterId } as EntityCard);
    }
    if (skipped > 0) {
      console.warn(`[loadCards] data/cards/${f}: ${skipped} 张卡缺硬字段（id/name_zh/fields/cites/atoms），已跳过`);
    }
  }
  return cards;
}

export function loadCard(id: string): EntityCard | undefined {
  return loadCards().find((c) => c.id === id);
}

/** 卡文件级元信息（doc 顶层 book/scope），供 library 统计与 UI 派生，不硬编码。 */
export function loadCardDocMeta(chapterId: string): { book?: string; scope?: string } | undefined {
  const file = path.join(repoRoot(), "data", "cards", `${chapterId}.entities.json`);
  return readJsonMemoized<{ book?: string; scope?: string }>(file);
}

/** 单章 pages（按印刷页）。边界页若跨章重复，以该章文件为准。 */
export function loadChapterPages(chapterId = "ch01"): PageDoc[] {
  const file = path.join(repoRoot(), "data", "chapters", `${chapterId}.blocks.json`);
  if (!fs.existsSync(file)) return [];
  const doc = readJsonMemoized<ChapterDoc>(file);
  return (doc?.pages ?? []).map((p) => ({ ...p, chapterId }));
}

/**
 * 合并所有已解析章的印刷页索引（按 page 去重，先出现的章优先）。
 * viewer / cite 跳转必须走这里，不能写死 ch01。
 */
export function loadAllChapterPages(): PageDoc[] {
  const dir = path.join(repoRoot(), "data", "chapters");
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".blocks.json"))
    .sort();
  const byPage = new Map<number, PageDoc>();
  for (const f of files) {
    const chapterId = f.replace(/\.blocks\.json$/, "");
    const doc = readJsonMemoized<ChapterDoc>(path.join(dir, f));
    for (const p of doc?.pages ?? []) {
      if (p.page == null) continue;
      if (!byPage.has(p.page)) {
        byPage.set(p.page, { ...p, chapterId });
      }
    }
  }
  return [...byPage.values()].sort((a, b) => (a.page ?? 0) - (b.page ?? 0));
}

/** 按印刷页查找 OCR 页；找不到返回 undefined。 */
export function findPageByPrinted(printedPage: number): PageDoc | undefined {
  return loadAllChapterPages().find((p) => p.page === printedPage);
}

/**
 * T31 C：各书「已解析印刷页」集合（bookId → 印刷页升序列表，loadAllChapterPages ∩ 书 chapterIds）。
 * 服务端装配一次，经 props 下传给续开/换书/回程等读侧消费组件做幽灵页消毒
 * （与 lib/last-opened 的 sanitizeOpenedPage 配套；客户端不读 fs，不造全量校验库）。
 */
export function loadBookValidPages(): Record<string, number[]> {
  const books = loadBooks();
  const pages = loadAllChapterPages();
  const out: Record<string, number[]> = {};
  for (const b of books) {
    const ids = new Set(b.chapterIds);
    out[b.id] = pages
      .filter((p) => p.chapterId != null && ids.has(p.chapterId as string) && p.page != null)
      .map((p) => p.page as number)
      .sort((x, y) => x - y);
  }
  return out;
}
