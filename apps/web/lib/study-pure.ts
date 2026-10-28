/**
 * T92 机械抽出：原 lib/study.ts pure 分区（atomKey（原 :17–20）+ :85–121 的
 * filterAtomsByMode · countPoolGrades · orderAtoms）整段迁此——all / ungraded /
 * unknown 过滤口径、认识/不熟/未评三计口径与章→卡→prompt 确定性排序逐字一致。
 * 本件纯函数：← ./study-types.ts（type-only）· StudyAtom type-only 自 @/lib/entities
 * （type-only 经编译剥除，不引 fs 进客户端束）；禁 import persist；
 * 无 window / 无 localStorage / 无 "use client"。
 */

import type { StudyAtom } from "@/lib/entities";
import type { GradeMap, StudyMode } from "./study-types.ts";

/** atomId 在卡内唯一；跨卡用 cardId 组合成全局键。 */
export function atomKey(a: Pick<StudyAtom, "cardId" | "atomId">): string {
  return `${a.cardId}/${a.atomId}`;
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
