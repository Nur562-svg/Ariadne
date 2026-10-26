"use client";

import { useSyncExternalStore } from "react";
import { STUDY_STORE_KEY, loadGrades, subscribeStudyGrades, type GradeMap } from "@/lib/study";

/**
 * T71：共享 useSyncExternalStore 口（订阅 ariadne.study.v1，键名与写 API 一概不动）。
 * - 快照稳定：按 localStorage 原串缓存——同串同引用（照搬 ChapterQualityCockpit 的
 *   draftSnap 模式），绝不每次 loadGrades() 新对象触发重渲染环。
 * - SSR fail-closed：getServerSnapshot 恒空对象（同引用）；首帧空仓是合法口径
 *   （计数如实 0，不造假正数，不永挂「读取中」）。
 * - 订阅延一拍：study.ts 本就「先落盘后广播」，同步核快照即正确；这里与另两仓
 *   统一延到微任务，行为不变（写与广播都在同一事件循环内完成，微任务必见新串）。
 *   getSnapshot 永不抛（隐私模式读失败 = 空仓）。
 */

const EMPTY_GRADE_MAP: GradeMap = {};
let snapRaw: string | null | undefined;
let snapStore: GradeMap = EMPTY_GRADE_MAP;

function getStudyGradesSnapshot(): GradeMap {
  if (typeof window === "undefined") return EMPTY_GRADE_MAP;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STUDY_STORE_KEY);
  } catch {
    raw = null; // 隐私模式读失败 = 空仓（fail-closed，不抛）
  }
  if (raw !== snapRaw) {
    snapRaw = raw;
    snapStore = loadGrades();
  }
  return snapStore;
}

function subscribeGradesAfterWrite(notify: () => void): () => void {
  return subscribeStudyGrades(() => {
    queueMicrotask(notify);
  });
}

export function useStudyGrades(): GradeMap {
  return useSyncExternalStore(
    subscribeGradesAfterWrite,
    getStudyGradesSnapshot,
    () => EMPTY_GRADE_MAP,
  );
}
