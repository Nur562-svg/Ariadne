import type { StudyAtom } from "@/lib/entities";

/**
 * 学习环本机自评存取（客户端专用；与 lib/heye.ts 对称但只跑在浏览器）：
 * key 仍是 ariadne.study.v1 —— Record<`${cardId}/${atomId}`, { k: 0|1; t: number }>。
 * 这里不做 FSRS / Due 调度：只有「认识 / 不熟 / 未评」本机三态，
 * 评分绝不回写 seed JSON，也不改变 cite / verified 语义。
 */

export const STUDY_STORE_KEY = "ariadne.study.v1";

export type GradeMap = Record<string, { k: 0 | 1; t: number }>;

/** 队列三档：全部｜未评｜不熟再练（本机态过滤，非到期调度）。 */
export type StudyMode = "all" | "ungraded" | "unknown";

/** atomId 在卡内唯一；跨卡用 cardId 组合成全局键。 */
export function atomKey(a: Pick<StudyAtom, "cardId" | "atomId">): string {
  return `${a.cardId}/${a.atomId}`;
}

/** 读本机评分；SSR / 隐私模式读失败一律 {}，不抛。 */
export function loadGrades(): GradeMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STUDY_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as GradeMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** 同页多个客户端组件（页头计数 / 学习会话）共享本机态的轻量订阅。 */
const listeners = new Set<() => void>();

export function subscribeStudyGrades(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitGradesChanged() {
  for (const l of listeners) l();
}

/** 进度导入（lib/progress-port）等绕过 saveGrade 的外部整键写入后广播，让订阅组件重读本机库。 */
export function notifyGradesExternalChange(): void {
  emitGradesChanged();
}

/**
 * 写一条评分并广播。返回最新 GradeMap；隐私模式写失败时仍返回内存态并广播，
 * 本机进度仅本会话有效，不阻塞自评。
 */
export function saveGrade(key: string, k: 0 | 1): GradeMap {
  const next: GradeMap = { ...loadGrades(), [key]: { k, t: Date.now() } };
  try {
    window.localStorage.setItem(STUDY_STORE_KEY, JSON.stringify(next));
  } catch {
    /* 写失败不阻塞；会话内仍可见 */
  }
  emitGradesChanged();
  return next;
}

/** 按队列档位过滤原子：ungraded = 无本机记录；unknown = 记录存在且 k===0（不熟）。 */
export function filterAtomsByMode(
  atoms: StudyAtom[],
  grades: GradeMap,
  mode: StudyMode,
): StudyAtom[] {
  if (mode === "ungraded") return atoms.filter((a) => !grades[atomKey(a)]);
  if (mode === "unknown") return atoms.filter((a) => grades[atomKey(a)]?.k === 0);
  return atoms;
}

/** 范围进度面：认识 / 不熟 / 未评（当前池子，本机态）。 */
export function countPoolGrades(
  atoms: StudyAtom[],
  grades: GradeMap,
): { known: number; unknown: number; ungraded: number } {
  let known = 0;
  let unknown = 0;
  for (const a of atoms) {
    const g = grades[atomKey(a)];
    if (!g) continue;
    if (g.k === 1) known++;
    else unknown++;
  }
  return { known, unknown, ungraded: atoms.length - known - unknown };
}

/** 确定性顺序（章 → 卡 → 按 prompt），服务端/客户端一致，避免 hydration 错位。 */
export function orderAtoms(atoms: StudyAtom[]): StudyAtom[] {
  return atoms.slice().sort((a, b) => {
    const byChapter = (a.chapterId ?? "").localeCompare(b.chapterId ?? "");
    if (byChapter !== 0) return byChapter;
    const byCard = a.cardId.localeCompare(b.cardId);
    if (byCard !== 0) return byCard;
    return a.prompt.localeCompare(b.prompt);
  });
}
