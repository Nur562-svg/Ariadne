import fs from "node:fs";
import path from "node:path";

/**
 * 服务端数据层：直接读仓库根 config/ + data/ 下的 JSON 文件。
 * 生产化路线（Postgres + pgvector）留接口：换掉 loadCards/loadPage 即可，页面不动。
 */

export type Cite = {
  page: number | null;
  quote?: string;
  verified: boolean;
};

export type Atom = {
  id: string;
  prompt: string;
  answer: string;
  difficulty: "what" | "why" | "case";
  cite?: Cite;
};

export type EntityCard = {
  id: string;
  name_zh: string;
  name_en?: string;
  aliases?: string[];
  kind: "concept" | "structure" | "process" | "pathogen" | "cell" | "molecule" | "disease";
  one_liner: string;
  fields: { label: string; value: string; cite?: Cite }[];
  confusions?: { vs: string; tip: string }[];
  atoms: Atom[];
  cites: Cite[];
  /** 派生自所在文件 data/cards/<chapterId>.entities.json（loadCards 附加，不在 JSON 里）。 */
  chapterId?: string;
};

export type PageDoc = {
  page: number | null;
  physicalPage: number;
  text: string;
  chapterId?: string;
};

export type ChapterDoc = {
  book: string;
  chapter: { id: string; title: string };
  pageOffset: number;
  pages: PageDoc[];
};

export type ChapterConfig = {
  id: string;
  title: string;
  physicalStart: number;
  physicalEnd: number;
  pageOffset: number;
};

export type BookConfig = {
  id: string;
  title: string;
  source?: string;
  chapterIds: string[];
};

/** 上传瞬间对某产物文件的快照（mtimeMs + size；文件不存在则为 null）。 */
export type ArtifactFingerprint = {
  mtimeMs: number | null;
  size: number | null;
};

/** 上传物料的持久化记录（data/materials/<id>.material.json）。 */
export type Material = {
  id: string;
  title: string;
  pageOffset: number;
  pdfFile: string;
  chapters: { id: string; title: string; physicalStart: number; physicalEnd: number }[];
  /** 持久化基准状态：uploaded（创建时）或 failed（带 failure 说明）。向前推进全部由文件系统事实推导，不凭空标记。 */
  status: "uploaded" | "failed";
  failure?: string;
  /**
   * 上传瞬间各章 blocks/cards 的指纹。deriveMaterialStage 只在磁盘产物相对此基线发生变化
   * （即本物料后续 CLI parse/extract 写出）时推进——禁止把 seed 的 ch01.blocks.json 算到新上传头上。
   */
  artifactBaseline?: Record<
    string,
    {
      blocks: ArtifactFingerprint;
      cards: ArtifactFingerprint;
    }
  >;
  createdAt: string;
  updatedAt: string;
};

/** 状态机：uploaded → parsed → extracted → ready | failed。由磁盘事实推导（deriveMaterialStage）。 */
export type MaterialStage = "uploaded" | "parsed" | "extracted" | "ready" | "failed";

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

export function loadChapters(): ChapterConfig[] {
  const file = path.join(repoRoot(), "config", "chapter.json");
  const cfg = readJson<{ chapters?: ChapterConfig[] }>(file);
  return cfg?.chapters ?? [];
}

export function loadBooks(): BookConfig[] {
  const file = path.join(repoRoot(), "config", "books.json");
  const cfg = readJson<{ books?: BookConfig[] }>(file);
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
    const doc = readJson<{ cards?: unknown }>(path.join(dir, f));
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
  return readJson<{ book?: string; scope?: string }>(file);
}

/** 单章 pages（按印刷页）。边界页若跨章重复，以该章文件为准。 */
export function loadChapterPages(chapterId = "ch01"): PageDoc[] {
  const file = path.join(repoRoot(), "data", "chapters", `${chapterId}.blocks.json`);
  if (!fs.existsSync(file)) return [];
  const doc = readJson<ChapterDoc>(file);
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
    const doc = readJson<ChapterDoc>(path.join(dir, f));
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

/** 学习环视图模型：卡片的所有原子扁平化，带卡/章上下文。 */
export type StudyAtom = {
  cardId: string;
  cardName: string;
  cardNameEn?: string;
  chapterId?: string;
  atomId: string;
  prompt: string;
  answer: string;
  difficulty: Atom["difficulty"];
  cite?: Cite;
};

/** 页引用命中摘要（本页卡轨用）：来源标签 + 短引文（UI 再截断）。 */
export type PageCiteHit = {
  source: "card" | "field" | "atom";
  label: string;
  quote?: string;
  /** 原样自 cite.page（与查询页一致），供轨上 CitePeek 构造一致 Cite。 */
  page: number;
  /** 原样自 cite.verified（seed 抽查态，勿编造；不等于本机核页标记）。 */
  verified: boolean;
};

/** 页 → 卡反向索引的一条结果：轻量卡摘要（不进完整 atoms/fields，控制 payload）。 */
export type PageCitingCard = {
  cardId: string;
  nameZh: string;
  nameEn?: string;
  kind: EntityCard["kind"];
  oneLiner: string;
  chapterId?: string;
  atomCount: number;
  hits: PageCiteHit[];
};

/**
 * 页 → 卡反向索引：扫描每张卡的 cites / fields[].cite / atoms[].cite，
 * cite.page === page 即命中；按 card.id 去重（同卡多处命中合并 hits，同来源同 quote 只留一条）。
 * bookId 可选：只扫该书章节下的卡（与 loadCards({bookId}) 一致）。
 * 只读 seed，禁止改数据 / 编造卡。
 */
export function cardsCitingPage(page: number, opts?: { bookId?: string }): PageCitingCard[] {
  const out: PageCitingCard[] = [];
  for (const c of loadCards(opts?.bookId ? { bookId: opts.bookId } : undefined)) {
    const hits: PageCiteHit[] = [];
    const seen = new Set<string>();
    const push = (cite: Cite | undefined, source: PageCiteHit["source"], label: string) => {
      if (!cite || cite.page !== page) return;
      const key = `${source}|${label}|${(cite.quote ?? "").trim().replace(/\s+/g, " ")}`;
      if (seen.has(key)) return;
      seen.add(key);
      // page/verified 原样取自 cite（已保证 cite.page === page，勿改值、勿编造抽查态）。
      hits.push({
        source,
        label,
        quote: cite.quote,
        page: cite.page as number,
        verified: cite.verified,
      });
    };
    for (const x of c.cites) push(x, "card", "卡引用");
    for (const f of c.fields) push(f.cite, "field", `字段 · ${f.label}`);
    for (const a of c.atoms) push(a.cite, "atom", `原子 · ${a.prompt}`);
    if (hits.length > 0) {
      out.push({
        cardId: c.id,
        nameZh: c.name_zh,
        nameEn: c.name_en,
        kind: c.kind,
        oneLiner: c.one_liner,
        chapterId: c.chapterId,
        atomCount: c.atoms.length,
        hits,
      });
    }
  }
  // 按卡名稳定排序（服务端/客户端一致，避免水合错位）。
  return out.sort((a, b) => a.nameZh.localeCompare(b.nameZh, "zh"));
}

/**
 * 组合规则（cardId 与 book/chapter 并存时）：
 * - 仅 cardId：只出该卡 atoms（书桌卡枢纽 /study?card= 的范围）。
 * - cardId + bookId / chapterId：要求卡属于该范围（一致性约束）——不属于则空数组，
 *   由页面诚实回落（卡不存在 / 范围不匹配都给警告文案），不静默放宽。
 * - 仅 bookId / chapterId（无 cardId）：原行为不变（按书 / 章过滤全库）。
 * - page（T27 A）：与上述范围取交集后，只保留 cardsCitingPage(page, {bookId}) 命中卡的
 *   全部 atoms——口径与书桌本页池（DocumentPane pageAtoms）一致：卡 cites / 字段 cite /
 *   原子 cite 任一命中该印刷页即整卡入池，不是「仅 atom.cite.page === N」。
 *   page + cardId：卡须 citing 该页且属范围，否则空数组（页面侧琥珀诚实）。
 */
export function collectStudyAtoms(opts?: {
  chapterId?: string;
  bookId?: string;
  cardId?: string;
  page?: number;
}): StudyAtom[] {
  const { cardId, page, ...scope } = opts ?? {};

  let cards: EntityCard[];
  if (cardId != null) {
    const card = loadCard(cardId);
    if (!card) return [];
    const inBook =
      scope.bookId == null ||
      loadBooks().some(
        (b) => b.id === scope.bookId && b.chapterIds.includes(card.chapterId ?? ""),
      );
    const inChapter = scope.chapterId == null || card.chapterId === scope.chapterId;
    if (!inBook || !inChapter) return [];
    cards = [card];
  } else {
    cards = loadCards(scope);
  }

  // page 过滤（T27 A）：与 cardsCitingPage 同口径的卡级命中（见上注释），交集不留分叉。
  if (page != null) {
    const citingIds = new Set(
      cardsCitingPage(page, { bookId: scope.bookId }).map((c) => c.cardId),
    );
    cards = cards.filter((c) => citingIds.has(c.id));
  }

  return cards.flatMap((c) =>
    c.atoms.map((a) => ({
      cardId: c.id,
      cardName: c.name_zh,
      cardNameEn: c.name_en,
      chapterId: c.chapterId,
      atomId: a.id,
      prompt: a.prompt,
      answer: a.answer,
      difficulty: a.difficulty,
      cite: a.cite,
    })),
  );
}

// ---- ingest：物料记录 + 诚实状态推导 ----

export function loadMaterials(): Material[] {
  const dir = path.join(repoRoot(), "data", "materials");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".material.json"))
    .sort()
    .flatMap((f) => {
      const m = readJson<Material>(path.join(dir, f));
      return m ? [m] : [];
    });
}

/** 章是否已有真实 OCR blocks（至少一页带正文文本）。无 blocks 一律不算 parsed。 */
export function chapterHasBlocks(chapterId: string): boolean {
  const file = path.join(repoRoot(), "data", "chapters", `${chapterId}.blocks.json`);
  const doc = readJson<ChapterDoc>(file);
  return !!doc?.pages?.some((p) => (p.text ?? "").trim().length > 0);
}

/** 章是否已有抽取产出的实体卡。 */
export function chapterHasCards(chapterId: string): boolean {
  const file = path.join(repoRoot(), "data", "cards", `${chapterId}.entities.json`);
  const doc = readJson<{ cards?: unknown[] }>(file);
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