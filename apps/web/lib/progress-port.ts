/**
 * 本机进度可移植（Task 24 C）：把 ariadne.study.v1 / ariadne.heye.v1 打包成明文 JSON
 * 导出带走、再合并或替换导入。只读写这两个既有键（STUDY_STORE_KEY / HEYE_STORE_KEY），
 * 禁止改名；绝不写 seed、绝不碰 verified；纯客户端，无任何云同步语义。
 *
 * payload 形状（v1）：
 * {
 *   "v": 1,
 *   "exportedAt": "2026-10-19T05:00:00.000Z",
 *   "study": { "<cardId>/<atomId>": { "k": 0 | 1, "t": 1760000000000 } },
 *   "heye":  { "<cardId>|<page>|…":  { "s": "checked" | "doubt", "t": 1760000000000 } }
 * }
 *
 * 导入规则（固化）：
 * - merge：按键逐条合并，**t 较新者胜**——导入条 t > 本机条 t 才覆盖；本机没有该键直接收入；
 *   本机多出的键保留。适合「换浏览器后把新评过的记录并回来」。
 * - replace：两个键整体覆盖为导入内容（本机原有记录清零）。适合「确认要迁移」。
 * - 非法 JSON / v != 1 / study·heye 缺失或条目形状不符 → 返回错误且**不写任何键**
 *   （fail-closed，绝不静默清空本机库）。
 * 写入后广播既有订阅（LocalProgressStrip 等）重读本机库，UI 立即如实更新。
 */

import { HEYE_STORE_KEY, loadHeYeStore, notifyHeYeExternalChange, type HeYeMark, type HeYeStore } from "@/lib/heye-store";
import { STUDY_STORE_KEY, loadGrades, notifyGradesExternalChange, type GradeMap } from "@/lib/study";

export const PROGRESS_PAYLOAD_VERSION = 1 as const;

export type ProgressPayload = {
  v: typeof PROGRESS_PAYLOAD_VERSION;
  exportedAt: string;
  study: GradeMap;
  heye: HeYeStore;
};

export type ParseResult =
  | { ok: true; payload: ProgressPayload }
  | { ok: false; error: string };

export type ImportResult =
  | { ok: true; studyEntries: number; heyeEntries: number }
  | { ok: false; error: string };

/** 导出当前本机进度（只读两个既有键；读取失败按空处理，不抛）。 */
export function exportProgressPayload(): ProgressPayload {
  return {
    v: PROGRESS_PAYLOAD_VERSION,
    exportedAt: new Date().toISOString(),
    study: loadGrades(),
    heye: loadHeYeStore(),
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isValidStudyMark(v: unknown): v is GradeMap[string] {
  return (
    isRecord(v) &&
    (v.k === 0 || v.k === 1) &&
    typeof v.t === "number" &&
    Number.isFinite(v.t)
  );
}

function isValidHeYeMark(v: unknown): v is HeYeMark {
  return (
    isRecord(v) &&
    (v.s === "checked" || v.s === "doubt") &&
    typeof v.t === "number" &&
    Number.isFinite(v.t)
  );
}

/** 校验导入数据形状；任何一条不符即整体拒绝（fail-closed）。 */
export function parseProgressPayload(data: unknown): ParseResult {
  if (!isRecord(data)) return { ok: false, error: "不是合法的进度 JSON（应为对象）。" };
  if (data.v !== PROGRESS_PAYLOAD_VERSION) {
    return { ok: false, error: `版本不符：需要 v${PROGRESS_PAYLOAD_VERSION}，文件是 ${String(data.v)}。` };
  }
  if (!isRecord(data.study) || !isRecord(data.heye)) {
    return { ok: false, error: "缺少 study / heye 字段，未做任何改动。" };
  }
  for (const [k, v] of Object.entries(data.study)) {
    if (!isValidStudyMark(v)) {
      return { ok: false, error: `study 条目「${k}」形状不符（需要 k:0|1 与数值 t）。` };
    }
  }
  for (const [k, v] of Object.entries(data.heye)) {
    if (!isValidHeYeMark(v)) {
      return { ok: false, error: `heye 条目「${k}」形状不符（需要 s:checked|doubt 与数值 t）。` };
    }
  }
  return {
    ok: true,
    payload: {
      v: PROGRESS_PAYLOAD_VERSION,
      exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : "",
      study: data.study as GradeMap,
      heye: data.heye as HeYeStore,
    },
  };
}

/**
 * 导入已校验的 payload。merge = t 较新者胜（见模块头注释）；replace = 整键覆盖。
 * 任一写失败（隐私模式等）→ 返回错误并停止，已写部分如实报告前先整体尝试；
 * localStorage 整键写是原子的，本实现先算好两份完整内容再各写一次。
 */
export function importProgressPayload(
  payload: ProgressPayload,
  mode: "merge" | "replace",
): ImportResult {
  if (typeof window === "undefined") {
    return { ok: false, error: "导入只能在浏览器本机进行。" };
  }

  let nextStudy: GradeMap;
  let nextHeYe: HeYeStore;
  if (mode === "replace") {
    nextStudy = { ...payload.study };
    nextHeYe = { ...payload.heye };
  } else {
    // merge：t 较新者胜——同键比较 t，导入更新才覆盖；本机独有键保留。
    nextStudy = { ...loadGrades() };
    for (const [k, v] of Object.entries(payload.study)) {
      const cur = nextStudy[k];
      if (!cur || v.t > cur.t) nextStudy[k] = v;
    }
    nextHeYe = { ...loadHeYeStore() };
    for (const [k, v] of Object.entries(payload.heye)) {
      const cur = nextHeYe[k];
      if (!cur || v.t > cur.t) nextHeYe[k] = v;
    }
  }

  try {
    window.localStorage.setItem(STUDY_STORE_KEY, JSON.stringify(nextStudy));
  } catch {
    return { ok: false, error: "本机写入失败（隐私模式或存储受限），study 保持原样。" };
  }
  try {
    window.localStorage.setItem(HEYE_STORE_KEY, JSON.stringify(nextHeYe));
  } catch {
    return { ok: false, error: "本机写入失败（隐私模式或存储受限），请检查后重试。" };
  }

  // 广播既有订阅组件（LocalProgressStrip / 会话计数）重读本机库。
  notifyGradesExternalChange();
  notifyHeYeExternalChange();
  return {
    ok: true,
    studyEntries: Object.keys(nextStudy).length,
    heyeEntries: Object.keys(nextHeYe).length,
  };
}
