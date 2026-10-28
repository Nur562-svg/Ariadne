/**
 * T93 机械抽出：原 lib/progress-port.ts types 分区（PROGRESS_PAYLOAD_VERSION ·
 * type ProgressPayload / ParseResult / ImportResult）整段迁此——v:1 常量一字不改、
 * payload 形（study: GradeMap · heye: HeYeStore）零改。
 * 本件是三件 DAG 的根：仅 type-only 跨 lib 引（@/lib/heye-store HeYeStore ·
 * @/lib/study GradeMap）；零 sibling import。
 * 无 "use client" / 无 window / 无 localStorage / 无 setItem / 无 notify*。
 * 边界铁合同 header 与消费者入口仍在 @/lib/progress-port（barrel）。
 */

import type { HeYeStore } from "@/lib/heye-store";
import type { GradeMap } from "@/lib/study";

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
