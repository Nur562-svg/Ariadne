/**
 * T93 机械抽出：原 lib/progress-port.ts persist 分区（exportProgressPayload（原 :43–51）+
 * importProgressPayload（原 :105–156））整段迁此——merge「t 较新者胜」· replace 整键
 * 覆盖 · fail-closed 拒写 · 写后双 notify 逐字一致；只读写 STUDY_STORE_KEY /
 * HEYE_STORE_KEY 两既有键（键名经 @/lib/study / @/lib/heye-store 守恒）。
 * 本件独占 IO + 广播（← ./progress-port-types.ts；值引 @/lib/study +
 * @/lib/heye-store；禁 import pure）。无 "use client"（tip 无指令，保持无）。
 */

import { HEYE_STORE_KEY, loadHeYeStore, notifyHeYeExternalChange, type HeYeStore } from "@/lib/heye-store";
import { STUDY_STORE_KEY, loadGrades, notifyGradesExternalChange, type GradeMap } from "@/lib/study";
import { PROGRESS_PAYLOAD_VERSION, type ImportResult, type ProgressPayload } from "./progress-port-types.ts";

/** 导出当前本机进度（只读两个既有键；读取失败按空处理，不抛）。 */
export function exportProgressPayload(): ProgressPayload {
  return {
    v: PROGRESS_PAYLOAD_VERSION,
    exportedAt: new Date().toISOString(),
    study: loadGrades(),
    heye: loadHeYeStore(),
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
