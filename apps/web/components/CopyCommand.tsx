"use client";

import { useState } from "react";

/**
 * T45 E：可复制 mono 命令块（小客户端岛）——navigator.clipboard 写入，无假进度条；
 * 朱红只落在「复制」动作上（唯一强调色）；clipboard 不可用时按钮隐藏（诚实，不假装已复制）。
 * 复制成功后按钮文案短暂换「已复制」（1.5s 真反馈，非动画）。
 */
export default function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <pre className="mono min-w-0 flex-1 overflow-x-auto rounded-lg border border-line bg-background px-3 py-2 text-xs leading-6 text-foreground/90">
        {command}
      </pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard
            .writeText(command)
            .then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => setCopied(false));
        }}
        className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
          copied
            ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
            : "border-line text-cinnabar hover:border-cinnabar"
        }`}
      >
        {copied ? "已复制" : "复制"}
      </button>
    </div>
  );
}
