"use client";

import { useState } from "react";

/**
 * T55 F/G：小客户端复制岛——对齐 CopyCommand（T45 E）诚实契约：navigator.clipboard
 * 写入，无假进度条；失败静默保持「复制」（不假装已复制）；成功 1.5s 换「已复制」真反馈。
 * 与 CopyCommand 的差别：复制任意短文本（建议摘录 / OCR 附近），非 mono 命令块——
 * 按钮为 muted 次级，不占朱红强调。
 */
export default function CopyTextButton({
  text,
  label = "复制",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => setCopied(false));
      }}
      className={
        className ??
        "shrink-0 rounded border border-line px-1.5 py-0.5 text-xs text-cinnabar transition-colors hover:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
      }
    >
      {copied ? "已复制" : label}
    </button>
  );
}
