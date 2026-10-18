"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useDeskContext } from "@/components/desk/DeskContext";
import type { ClewContextData } from "@/components/desk/DeskContext";

type Msg = { role: "user" | "assistant"; text: string };

/** 建议问：静态模板插真名（书名/章/可见实体/当前页），无 LLM。 */
function buildSuggestions(clew: ClewContextData): string[] {
  if (!clew.book) {
    return ["导入一本教材后，Clew 才有可问的上下文。"];
  }
  const b = clew.book.title;
  const list: string[] = [];
  if (clew.visibleEntityName) {
    list.push(`《${b}》中「${clew.visibleEntityName}」的核心机制是什么？`);
  }
  if (clew.chapter) {
    list.push(`「${clew.chapter.title}」这一章有哪些易混概念？`);
  }
  if (clew.page != null) {
    list.push(`中栏印刷页 p.${clew.page} 这段在讲什么？`);
  }
  list.push(`这本书从哪一章开始读比较顺？`);
  return list.slice(0, 3);
}

/** stub 回复规则：有页码上下文 → 提示对页；无 → 建议先开章页/卡。绝不宣称已核/verified。 */
function stubReply(clew: ClewContextData): string {
  const pages = [
    ...(clew.page != null ? [clew.page] : []),
    ...clew.citePages.filter((p) => p != null),
  ];
  if (pages.length > 0) {
    return `（stub · 未接模型）本地占位回复。可以到中栏章页或实体卡 CiteChip 对着看 p.${pages.join(
      "、p.",
    )}；本面板不生成已核对结论，回答以教材印刷页为准。`;
  }
  return `（stub · 未接模型）本地占位回复。先把中栏切到「章页」或打开一张实体卡再问，便于对照印刷页核对；本面板不生成已核对结论。`;
}

/**
 * Clew 右栏（~400）：UI 壳 + 本地 stub 对话（升级版）。
 * 上下文来自 DeskContext（书/章/当前页/可见卡名/示例 cite 页）；
 * 无 LLM 调用、无假 verified cite；底部常驻「不做诊断」脚注。
 */
export default function ClewPane() {
  const { clew } = useDeskContext();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  const suggestions = buildSuggestions(clew);

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "assistant", text: stubReply(clew) },
    ]);
    setDraft("");
    requestAnimationFrame(() => {
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
    });
  }

  const bookHref = clew.book ? `/desk?book=${encodeURIComponent(clew.book.id)}` : "/desk";
  const studyHref = clew.book ? `/study?book=${encodeURIComponent(clew.book.id)}` : "/study";

  return (
    <aside
      className="flex h-full w-[400px] shrink-0 flex-col border-l border-line bg-card"
      aria-label="Clew 问答面板"
    >
      <header className="border-b border-line px-4 pb-2 pt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Clew</h2>
          <span className="text-xs text-muted">
            {clew.book ? "本地 stub" : "书库为空"}
            {clew.page != null ? ` · p.${clew.page}` : ""}
          </span>
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
            <p className="text-xs leading-6 text-muted">
              还没接模型（stub）。清问带页码对照的问题；先按这条路径走通：
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted">
              <Link href="/ingest" className="text-cinnabar no-underline hover:underline underline-offset-4">导入教材</Link>
              <span>→</span>
              <Link href="/" className="text-cinnabar no-underline hover:underline underline-offset-4">书架打开</Link>
              <span>→</span>
              <Link href={bookHref} className="text-cinnabar no-underline hover:underline underline-offset-4">书桌读实体卡/章页</Link>
              <span>→</span>
              <Link href={studyHref} className="text-cinnabar no-underline hover:underline underline-offset-4">学习环自测</Link>
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