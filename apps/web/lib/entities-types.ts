/**
 * T95 机械抽出：原 lib/entities.ts types 分区（Cite · Atom · EntityCard · PageDoc · ChapterDoc ·
 * ChapterConfig · BookConfig · ArtifactFingerprint · Material · MaterialStage）整段迁此——
 * 类型形状一字不改；MaterialStage 联合字面量 uploaded|parsed|extracted|ready|failed 守恒。
 * 本件为 DAG 根：零 import · 无 fs · 零 sibling；StudyAtom / PageCiteHit / PageCitingCard
 * 随 cardsCitingPage / collectStudyAtoms 留在 ./entities-query.ts（仍经 barrel 导出）。
 * tip 无 "use client" / "server-only" 指令，保持无。
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
