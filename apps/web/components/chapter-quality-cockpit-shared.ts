/**
 * T81 机械抽出：原 ChapterQualityCockpit.tsx 顶部诚实文案 / 表格 class 常量 / pct 整段迁此——
 * 字符串 / class / pct 行为零改（仅加 export）；编排器与 ChapterQualityCockpitRow 共用。
 */

/** H：诚实文案——一次说清四个 ≠，禁止掌握% / Due / 单一健康分。 */
export const COCKPIT_DISCLAIMER =
  "机检 ≠ verified 抽查 · cockpit ≠ seed 已核 · 草稿 ≠ 已写回 · data/qa 报告 ≠ 真源";

export const th = "px-2 py-1.5 font-normal whitespace-nowrap";
export const td = "px-2 py-1.5 align-top whitespace-nowrap";
export const muted = "text-muted";
export const amber = "text-status-warn";

export function pct(x: number): string {
  return `${(x * 100).toFixed(0)}%`;
}
