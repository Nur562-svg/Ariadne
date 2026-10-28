/**
 * T92 机械抽出：原 lib/study.ts persist 分区（loadGrades · listeners（私）·
 * subscribeStudyGrades · emitGradesChanged（私）· notifyGradesExternalChange ·
 * saveGrade · deleteGrade）整段迁此——「拼 next → try setItem → emit」先落盘后广播
 * 逐字一致（T71 use-study-grades 微任务订阅契约依赖此序）；deleteGrade 单 key
 * 回退口径零改；私有 listeners / emitGradesChanged 不经 barrel 外泄。
 * 本件独占 IO + 订阅总线（← ./study-types.ts；禁 import pure / entities）。
 * 无 "use client"（tip 无指令，保持无）。
 */

import { STUDY_STORE_KEY, type GradeMap } from "./study-types.ts";

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

/**
 * 删除一条评分（T25 撤销用）：本评分为新增（无 prevGrade）时回退即删 key。
 * 隐私模式写失败不阻塞；广播让页头计数等订阅组件跟上。
 */
export function deleteGrade(key: string): GradeMap {
  const next = { ...loadGrades() };
  delete next[key];
  try {
    window.localStorage.setItem(STUDY_STORE_KEY, JSON.stringify(next));
  } catch {
    /* 写失败不阻塞；返回值仍供本会话使用 */
  }
  emitGradesChanged();
  return next;
}
