"use client";

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

const STUB_REPLY =
  "（占位回复）Clew 对话尚未接入模型——这是本地 stub，不代表已核对的内容。回答请以教材印刷页（p.N）为准。";

/**
 * Clew 右栏（~400）：UI 壳 + 本地 stub 对话。
 * 无 LLM 调用、无假 verified cite；底部常驻「不做诊断」脚注。
 */
export default function ClewPane({ bookTitle }: { bookTitle?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  const suggestions = bookTitle
    ? [
        "固有免疫和适应性免疫的核心区别是什么？",
        "抗原、表位、抗原决定簇是什么关系？",
        "对比细胞免疫与体液免疫的应答过程。",
      ]
    : ["书库为空——先到 /ingest 导入教材，Clew 才有可问的上下文。"];

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    setMessages((prev) => [...prev, { role: "user", text: q }, { role: "assistant", text: STUB_REPLY }]);
    setDraft("");
    requestAnimationFrame(() => {
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
    });
  }

  return (
    <aside
      className="flex h-full w-[400px] shrink-0 flex-col border-l border-line bg-card"
      aria-label="Clew 问答面板"
    >
      <header className="border-b border-line px-4 pb-2 pt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Clew</h2>
          <span className="text-xs text-muted">{bookTitle ? "本地 stub" : "书库为空"}</span>
        </div>
        <nav className="mt-2 flex gap-4 text-sm" aria-label="Clew 标签页">
          <span className="border-b-2 border-cinnabar pb-1.5 font-medium text-cinnabar">对话</span>
          <span className="cursor-default pb-1.5 text-muted" title="后续版本">
            本轮变更
          </span>
          <span className="cursor-default pb-1.5 text-muted" title="后续版本">
            复习队列
          </span>
        </nav>
      </header>

      <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div>
            <p className="text-sm leading-7 text-muted">
              可以问当前教材的内容。现在还只是本地占位对话（stub）——不接模型、不编页码。
            </p>
            <ul className="mt-4 space-y-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    onClick={() => send(s)}
                    className="w-full rounded-lg border border-line bg-background px-3 py-2 text-left text-sm leading-6 text-foreground/90 transition-colors hover:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                className="rounded-lg border border-line bg-background px-3 py-2 text-sm leading-6"
              >
                {m.text}
              </div>
            ) : (
              <div
                key={i}
                className="border-l-2 border-cinnabar/40 pl-3 text-sm leading-6 text-foreground/90"
              >
                <span className="mono mr-1 text-[10px] text-muted">stub</span>
                {m.text}
              </div>
            ),
          )
        )}
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={2}
            placeholder="问点什么…（Enter 发送）"
            aria-label="Clew 输入"
            className="min-h-[2.75rem] w-full resize-y rounded-lg border border-line bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted focus:border-cinnabar motion-reduce:transition-none"
          />
          <button
            onClick={() => send(draft)}
            disabled={!draft.trim()}
            className="shrink-0 rounded-lg bg-cinnabar px-4 py-2 text-sm text-white transition-opacity disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
          >
            发送
          </button>
        </div>
      </div>

      <p className="border-t border-line px-4 py-2 text-xs text-muted">
        不做诊断 · 回答以教材页码为准
      </p>
    </aside>
  );
}
