/**
 * T59 A（孪生）：抽出后页→原子「浅密度」机检——与 apps/web/lib/extract-page-density.ts
 * **逐函数同真**（collectAtomCountByPage / scoreExtractPageDensity）；SPARSE_CHAR_THR
 * 复用 ./parse-ocr-coverage.mjs 的 40（T56 同口径，**不**复制第二套常量防漂移）。另含
 * fs 版 loadExtractPageDensity（web server 版在 apps/web/lib/extract-page-density-server.ts）。
 * 改任何一处必须同步其余两处（keep in sync）；口径只有这一份。
 *
 * 浅页 = 实质 OCR 页（chars≥40）∧ 1 ≤ atoms[].cite.page 计数 ≤ SHALLOW_ATOM_MAX(2) ∧
 * chars/atomCount ≥ SHALLOW_CHARS_PER_ATOM(400)。原子计数**只计 atoms[].cite.page**
 * （可考密度），不计 card cites / fields[].cite。暗页（零 cite）归 T57、稀页（<40 字）
 * 归 T56，均不进浅。只读：绝不写回 entities / blocks；不发明原子「补浅」；不写 verified。
 */
import fs from "node:fs";
import path from "node:path";
import { SPARSE_CHAR_THR } from "./parse-ocr-coverage.mjs";

export { SPARSE_CHAR_THR };

/** 浅页原子数上限（文档化，勿私改；与 web 孪生同步）。 */
export const SHALLOW_ATOM_MAX = 2;
/** 浅页均摊字数阈值（每原子至少扛 400 字才算「极稀」；与 web 孪生同步）。 */
export const SHALLOW_CHARS_PER_ATOM = 400;

export function collectAtomCountByPage(cards) {
  const out = new Map();
  for (const card of cards ?? []) {
    for (const a of card.atoms ?? []) {
      const pg = a.cite?.page;
      if (typeof pg === "number") out.set(pg, (out.get(pg) ?? 0) + 1);
    }
  }
  return out;
}

export function scoreExtractPageDensity(input) {
  const pages = input.pages ?? [];
  const atomByPage = collectAtomCountByPage(input.cards ?? []);
  let substantialPages = 0;
  let citedAtomPages = 0;
  const shallowPages = [];
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

/**
 * fs 版章密度装载：读 data/chapters/<id>.blocks.json + data/cards/<id>.entities.json；
 * **缺 blocks 或缺 entities → null**（未抽出/未解析＝未检，不装 shallowCount=0 完美）。
 */
export function loadExtractPageDensity(rootDir, chapterId) {
  const blocksFile = path.join(rootDir, "data", "chapters", `${chapterId}.blocks.json`);
  const cardsFile = path.join(rootDir, "data", "cards", `${chapterId}.entities.json`);
  if (!fs.existsSync(blocksFile) || !fs.existsSync(cardsFile)) return null;
  try {
    const blocksDoc = JSON.parse(fs.readFileSync(blocksFile, "utf8"));
    const cardsDoc = JSON.parse(fs.readFileSync(cardsFile, "utf8"));
    return scoreExtractPageDensity({
      pages: blocksDoc.pages ?? [],
      cards: cardsDoc.cards ?? [],
    });
  } catch {
    return null; // 读/解析失败 = 未检（fail-closed，不装完美密度）
  }
}
