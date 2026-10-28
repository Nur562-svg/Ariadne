/**
 * T92 机械抽出：原 lib/study.ts types 分区（STUDY_STORE_KEY · type GradeMap · StudyMode）
 * 整段迁此——key 字符串一字不改（ariadne.study.v1）、GradeMap 形零改、
 * 三档 id（all | ungraded | unknown）零改。
 * 本件是三件 DAG 的根：零 import（兄弟件与跨 lib 均 zero；零 entities）。
 * 无 "use client" / 无 window / 无 localStorage / 无 fs / 无网络。
 * 边界铁合同 header 与消费者入口仍在 @/lib/study（barrel）。
 */

export const STUDY_STORE_KEY = "ariadne.study.v1";

export type GradeMap = Record<string, { k: 0 | 1; t: number }>;

/** 队列三档：全部｜未评｜不熟再练（本机态过滤，非到期调度）。 */
export type StudyMode = "all" | "ungraded" | "unknown";
