/**
 * T91 机械抽出：原 lib/heye-store.ts types 分区（HEYE_STORE_KEY · type HeYeMark ·
 * HeYeStore · HeYeMode · HeYeFilterable）整段迁此——key 字符串一字不改
 * （ariadne.heye.v1）、Mark 形零改、三档 id（open | checked | doubt）零改。
 * 本件是三件 DAG 的根：零 import（兄弟件与跨 lib 均 zero）。
 * 无 "use client" / 无 window / 无 localStorage / 无 fs / 无网络。
 * 边界铁合同 header 与消费者入口仍在 @/lib/heye-store（barrel）。
 */

export const HEYE_STORE_KEY = "ariadne.heye.v1";

export type HeYeMark = { s: "checked" | "doubt"; t: number };
export type HeYeStore = Record<string, HeYeMark>;

/** 档位：待核（本机未标）｜已对｜存疑。本机态过滤，非到期调度。 */
export type HeYeMode = "open" | "checked" | "doubt";

export type HeYeFilterable = { key: string };
