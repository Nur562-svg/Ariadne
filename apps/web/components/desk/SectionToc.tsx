"use client";

/**
 * 六段讲义导航：静态结构标签，点击驱动真实面板（过滤/锚点/面板切换），
 * 高亮反映用户当前选择——不是永远亮「概览」，也没有假正文。
 * 映射（见 DocumentPane）：
 *   概览 → 书头统计+章列表 | 实体图谱 → 卡网格按 kind 分组 | 机制串讲 → process 过滤
 *   易混对照 → 有 confusions 的卡 | 应用与病例 → case 原子/disease/pathogen | 自测 → /study CTA
 */
export type SectionId = "overview" | "map" | "process" | "confusions" | "case" | "quiz";

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "overview", label: "概览" },
  { id: "map", label: "实体图谱" },
  { id: "process", label: "机制串讲" },
  { id: "confusions", label: "易混对照" },
  { id: "case", label: "应用与病例" },
  { id: "quiz", label: "自测" },
];

export default function SectionToc({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (s: SectionId) => void;
}) {
  return (
    <nav aria-label="六段讲义目录" className="mt-6 rounded-xl border border-line bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">六段讲义</h2>
        <span className="text-xs text-muted">过渡文档 · 生成管线未接入（点击段落只看真数据）</span>
      </div>
      <ol className="mt-3 flex flex-wrap gap-2">
        {SECTIONS.map((s, i) => {
          const isActive = s.id === active;
          return (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s.id)}
                aria-current={isActive ? "step" : undefined}
                className={`rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                  isActive
                    ? "border-cinnabar bg-cinnabar-soft font-medium text-cinnabar"
                    : "border-line text-muted hover:text-foreground"
                }`}
              >
                {i + 1} {s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}