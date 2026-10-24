/**
 * T59 A：抽出后页→原子「浅密度」机检（纯函数，无 fs、无 "use client"——server 页与
 * client 岛共用；DocumentPane / ChapterPageReader 等客户端组件可直接 import 值）。
 *
 * 孪生实现：scripts/lib/extract-page-density.mjs（含 fs 版 loadExtractPageDensity，
 * CLI / extract 用）+ apps/web/lib/extract-page-density-server.ts（web server 页用的
 * fs 版）——**三处算法必须同步改**（keep in sync）；口径只有这一份。
 *
 * 浅页（SHALLOW）定义（文档化，勿私改）：页 OCR 正文 trim 后 chars ≥ SPARSE_CHAR_THR
 * （复用 T56 parse-ocr-coverage 的 40，同口径不漂移）∧ 该页**可考原子数** 1 ≤ atomCount
 * ≤ SHALLOW_ATOM_MAX ∧ chars/atomCount ≥ SHALLOW_CHARS_PER_ATOM——即「实质页已抽出
 * 原子、但原子极稀，每原子扛的字太多」。四概念分列，互不伪装：
 *   - 暗页（T57）：chars≥40 ∧ 任何 cite（cites/fields/atoms）零命中 → 不进浅；
 *   - 稀页（T56）：chars<40 → 不进浅；
 *   - cite↔OCR miss（T54）：quote↔OCR 比对 → 与浅无关。
 * 原子计数口径（勿私改）：**只计 atoms[].cite.page**（可考密度 = 该页能练出几题）；
 * card 级 cites / fields[].cite 不单独膨胀计数（那是「被引用」不是「可考」）。
 *
 * 只读：绝不写回 data/cards/*.entities.json / blocks.json；不自动发明原子「补浅」；
 * 不写 verified:true；不改 deriveMaterialStage；不改 T57 暗页算法。
 */
import { SPARSE_CHAR_THR } from "./parse-ocr-coverage";

/** 浅页原子数上限：atomCount ≤ 2 且均摊字数超阈值才算浅（文档化，勿私改）。 */
export const SHALLOW_ATOM_MAX = 2;
/** 浅页均摊字数阈值：chars/atomCount ≥ 400（每原子至少扛 400 字才算「极稀」）。 */
export const SHALLOW_CHARS_PER_ATOM = 400;

/** 与打分相关的最小页形状（结构兼容 lib/entities 的 PageDoc）。 */
export type DensityPageLike = { page: number | null; text: string };
/** 与打分相关的最小卡形状（原子计数只需 atoms[].cite.page；结构兼容 EntityCard）。 */
export type DensityCardLike = {
  atoms?: { cite?: { page?: number | null } }[];
};

/**
 * 页 → 可考原子数：只计 cards 的 atoms[].cite.page（每原子一题）。
 * card 级 cites / fields[].cite 不计入——浅密度问「能练几题」，不问「被引几次」。
 */
export function collectAtomCountByPage(cards: DensityCardLike[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const card of cards ?? []) {
    for (const a of card.atoms ?? []) {
      const pg = a.cite?.page;
      if (typeof pg === "number") out.set(pg, (out.get(pg) ?? 0) + 1);
    }
  }
  return out;
}

/** 单个浅页（有序列表元素）：页码 + trim 字数 + 原子数 + 均摊字数 + 截断预览。 */
export type ShallowPage = {
  page: number;
  chars: number;
  atomCount: number;
  charsPerAtom: number;
  preview: string;
};

/** 章/文件级抽出密度汇总。 */
export type ExtractPageDensity = {
  /** 实质页数（chars ≥ SPARSE_CHAR_THR；与 T57 substantialPages 同口径）。 */
  substantialPages: number;
  /** 有原子页数（atomCount ≥ 1 的实质页——「已抽出且可考」的页）。 */
  citedAtomPages: number;
  /** 浅页（SHALLOW 定义命中，按页码升序）。 */
  shallowPages: ShallowPage[];
  /** 浅页数 = shallowPages.length。 */
  shallowCount: number;
  /** 浅页率 = shallowCount / substantialPages（substantial=0 → 0，无实质页可浅）。 */
  shallowRate: number;
  /**
   * weak 口径（文档化，勿私改）：shallowCount > 0——任一实质页已 cite 但原子极稀即点名。
   * 只作「点名/警告」信号（extract --strict 才在 shallowRate≥0.35 或 shallowCount≥5
   * 时拒写，见 scripts/extract_cards.mjs C），不阻断注册、不改 stage。
   */
  weak: boolean;
};

/** 章级抽出密度评分（server 页从 blocks/entities 读入后传入；client 从 props 派生）。 */
export function scoreExtractPageDensity(input: {
  pages: DensityPageLike[];
  cards: DensityCardLike[];
}): ExtractPageDensity {
  const pages = input.pages ?? [];
  const atomByPage = collectAtomCountByPage(input.cards ?? []);
  let substantialPages = 0;
  let citedAtomPages = 0;
  const shallowPages: ShallowPage[] = [];
  for (const p of pages) {
    if (p.page == null) continue;
    const chars = (p.text ?? "").trim().length;
    if (chars < SPARSE_CHAR_THR) continue; // 空/稀页归 T56 口径，不进浅
    substantialPages++;
    const atomCount = atomByPage.get(p.page) ?? 0;
    if (atomCount === 0) continue; // 暗页（零 cite）归 T57 口径，不进浅
    citedAtomPages++;
    const charsPerAtom = chars / atomCount;
    if (atomCount <= SHALLOW_ATOM_MAX && charsPerAtom >= SHALLOW_CHARS_PER_ATOM) {
      shallowPages.push({
        page: p.page,
        chars,
        atomCount,
        charsPerAtom: Math.round(charsPerAtom),
        preview: (p.text ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
      });
    }
  }
  shallowPages.sort((a, b) => a.page - b.page);
  const shallowCount = shallowPages.length;
  const shallowRate = substantialPages > 0 ? shallowCount / substantialPages : 0;
  return {
    substantialPages,
    citedAtomPages,
    shallowPages,
    shallowCount,
    shallowRate,
    weak: shallowCount > 0,
  };
}
