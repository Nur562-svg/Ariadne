/**
 * T93 机械抽出：原 lib/progress-port.ts pure 分区（私有 isRecord · isValidStudyMark ·
 * isValidHeYeMark + parseProgressPayload）整段迁此——fail-closed「任何一条不符即整体
 * 拒绝、不写任何键」口径逐字一致；三私有 helpers 仍私有，不经 barrel 外泄。
 * 本件纯函数：← ./progress-port-types.ts · HeYeMark / HeYeStore / GradeMap type-only
 * 跨 lib 引（@/lib/heye-store · @/lib/study）；禁 import persist；
 * 无 localStorage.setItem / 无 notify* / 无 window。
 * 无 "use client"（tip 无指令，保持无）。
 */

import type { HeYeMark, HeYeStore } from "@/lib/heye-store";
import type { GradeMap } from "@/lib/study";
import { PROGRESS_PAYLOAD_VERSION, type ParseResult } from "./progress-port-types.ts";

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
