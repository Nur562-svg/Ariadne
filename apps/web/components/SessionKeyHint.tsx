/**
 * 练/核会话底栏键说明（T25 B）：muted 小字 + mono 键帽的一族风格。
 * 只是当前会话面的键位扫视说明——不是 ⌘K / ShortcutSheet / 全站命令面板。
 */
export default function SessionKeyHint({
  keys,
  className = "",
}: {
  /** [键帽, 说明] 有序列表，按展示顺序渲染；键帽可含组合写法（如 "1/j"）。 */
  keys: [string, string][];
  className?: string;
}) {
  return (
    <p className={`text-xs leading-6 text-muted ${className}`}>
      键：
      {keys.map(([k, label], idx) => (
        <span key={k}>
          {idx > 0 ? <span className="mx-1.5">·</span> : null}
          <kbd className="mono rounded border border-line bg-card px-1 py-px text-[10px] leading-4 text-foreground/80">
            {k}
          </kbd>{" "}
          {label}
        </span>
      ))}
    </p>
  );
}
