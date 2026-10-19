"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDeskContext } from "@/components/desk/DeskContext";
import type { ClewContextData } from "@/components/desk/DeskContext";
import { loadGrades, subscribeStudyGrades, type GradeMap } from "@/lib/study";
import { loadHeYeStore, subscribeHeYeStore, type HeYeStore } from "@/lib/heye-store";
import LocalProgressStrip from "@/components/LocalProgressStrip";

type Msg = { role: "user" | "assistant"; text: string };
type Tab = "chat" | "changes" | "queue";

const SURFACE_ZH: Record<string, string> = {
  desk: "书桌",
  card: "本卡",
  study: "学习",
  review: "核页",
  library: "书架",
};

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

/** 本轮本机活动条目（只读 study.v1 + heye.v1，t >= sessionStartedAt；不写任何 seed/教材字段）。 */
type Act = { t: number; kind: "study" | "heye"; text: string };

/**
 * Clew 右栏（~400）：会话条 + 三 tab（对话 | 本轮变更 | 复习队列）+ 本地 stub 对话。
 * 上下文来自 DeskContext（书/章/当前页/卡/表面）；无 LLM 调用、无假写入；
 * 「本轮变更」只读本浏览器 session 开始以来的 study/heye 标记。「复习队列」只诚实跳转。
 * 底部常驻「不做诊断」脚注。
 */
export default function ClewPane() {
  const { clew, sessionStartedAt } = useDeskContext();
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  // 本轮变更面板：订阅两个本机 store，随打标刷新（只读）。
  const [, setTick] = useState(0);
  useEffect(
    () =>
      subscribeStudyGrades(() => setTick((n) => n + 1)),
    [],
  );
  useEffect(
    () =>
      subscribeHeYeStore(() => setTick((n) => n + 1)),
    [],
  );

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
  const reviewHref = clew.book ? `/review?book=${encodeURIComponent(clew.book.id)}` : "/review";
  const pageHref =
    clew.book && clew.page != null
      ? `/desk?book=${encodeURIComponent(clew.book.id)}&page=${clew.page}`
      : bookHref;

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
          {(
            [
              ["chat", "对话"],
              ["changes", "本轮变更"],
              ["queue", "复习队列"],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-selected={tab === t}
              role="tab"
              className={`pb-1.5 focus-visible:outline-2 focus-visible:outline-cinnabar ${
                tab === t
                  ? "border-b-2 border-cinnabar font-medium text-cinnabar"
                  : "border-b-2 border-transparent text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* 会话条：书 · 章 · p.N · 卡（可点回跳）+ 本地上下文免责。 */}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-t border-line pt-2 text-xs text-muted">
          {clew.book ? (
            <Link
              href={bookHref}
              className="text-foreground/90 no-underline hover:text-cinnabar"
            >
              《{clew.book.title}》
            </Link>
          ) : null}
          {clew.chapter ? <span>{clew.chapter.title}</span> : null}
          {clew.page != null ? (
            <Link href={pageHref} className="mono text-cinnabar no-underline hover:underline underline-offset-4">
              p.{clew.page}
            </Link>
          ) : null}
          {clew.card ? (
            <Link
              href={`/desk/card/${encodeURIComponent(clew.card.id)}`}
              className="font-medium text-cinnabar no-underline hover:underline underline-offset-4"
            >
              {clew.card.name_zh}
            </Link>
          ) : null}
          {clew.surface ? (
            <span className="mono text-[10px]">面：{SURFACE_ZH[clew.surface] ?? clew.surface}</span>
          ) : null}
          <span className="ml-auto text-[11px] text-muted">本地上下文 · 未接模型</span>
        </div>
      </header>

      {tab === "chat" ? (
        <>
          <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div>
                <p className="text-xs leading-6 text-muted">
                  还没接模型（stub）。请带着页码对照的问题发问；先按这条路径走通：
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
        </>
      ) : tab === "changes" ? (
        <ChangesPanel
          since={sessionStartedAt}
          clew={clew}
          studyHref={studyHref}
          reviewHref={reviewHref}
        />
      ) : (
        <QueuePanel reviewHref={reviewHref} studyHref={studyHref} />
      )}

      <p className="border-t border-line px-4 py-2 text-xs text-muted">
        不做诊断 · 回答以教材页码为准
      </p>
    </aside>
  );
}

/** 本轮变更：未接模型诚实空心——只读本浏览器 session 开始以来的 study/heye 标记。 */
function ChangesPanel({
  since,
  clew,
  studyHref,
  reviewHref,
}: {
  since: number;
  /** T19：Clew compact 进度条接上下文池（书桌 DocumentPane 随章/页写）；无池 → 全局计数。 */
  clew: ClewContextData;
  studyHref: string;
  reviewHref: string;
}) {
  const [, setTick] = useState(0);
  const [grades, setGrades] = useState<GradeMap>({});
  const [heye, setHeYe] = useState<HeYeStore>({});

  useEffect(() => {
    setGrades(loadGrades());
    setHeYe(loadHeYeStore());
    const u1 = subscribeStudyGrades(() => {
      setGrades(loadGrades());
      setTick((n) => n + 1);
    });
    const u2 = subscribeHeYeStore(() => {
      setHeYe(loadHeYeStore());
      setTick((n) => n + 1);
    });
    return () => {
      u1();
      u2();
    };
  }, []);

  const acts: Act[] = [];
  for (const [key, g] of Object.entries(grades)) {
    if (typeof g?.t !== "number" || g.t < since) continue;
    acts.push({
      t: g.t,
      kind: "study",
      text: `自评「${key.split("/")[0] ?? key}」 · ${g.k === 1 ? "认识" : "不熟"}`,
    });
  }
  for (const [key, m] of Object.entries(heye)) {
    if (typeof m?.t !== "number" || m.t < since) continue;
    const page = /^[^|]*\|(\d+)\|/.exec(key)?.[1];
    acts.push({
      t: m.t,
      kind: "heye",
      text: `核页${page ? ` p.${page}` : ""} · ${m.s === "checked" ? "本机已对" : "本机存疑"}`,
    });
  }
  acts.sort((a, b) => b.t - a.t);
  const shown = acts.slice(0, 20);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <p className="rounded-lg border border-line bg-background px-3 py-2 text-xs leading-6 text-muted">
        <span className="font-medium text-foreground/80">未接模型。</span>
        这里没有可确认的写入提议；下列只读本浏览器本轮自评/核页标记。
      </p>

      {/* T19 Clew compact 章作用域：有池（DocumentPane 随章/页写）按池收窄，数字应明显小于全书；
          无池保持全局计数并给一句诚实说明。scopeLabel/href 与中栏 Strip 同一来源。 */}
      <LocalProgressStrip
        compact
        atoms={clew.progressAtoms}
        items={clew.progressItems}
        scopeLabel={clew.progressScopeLabel}
        studyHref={clew.progressStudyHref}
        reviewHref={clew.progressReviewHref}
      />
      {!clew.progressAtoms && !clew.progressItems ? (
        <p className="mt-1 text-[11px] leading-5 text-muted">
          未定位章 · 全书本机记录；到书桌打开书目后按章/页收窄。
        </p>
      ) : null}

      {shown.length === 0 ? (
        <div className="mt-6 border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
          本轮还没有本机标记——去学习环自评或核页对页后回到这里。
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <Link href={studyHref} className="text-cinnabar no-underline hover:underline underline-offset-4">
              去学习环自评 →
            </Link>
            <Link href={reviewHref} className="text-cinnabar no-underline hover:underline underline-offset-4">
              去核页对页 →
            </Link>
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {shown.map((a, i) => (
            <li
              key={i}
              className="flex items-baseline gap-2 rounded-lg border border-line bg-background px-3 py-2 text-sm leading-6"
            >
              <span
                className={`mono shrink-0 text-[10px] ${a.kind === "study" ? "text-cinnabar" : "text-status-warn"}`}
              >
                {a.kind === "study" ? "练" : "核"}
              </span>
              <span className="min-w-0 flex-1 text-foreground/90">{a.text}</span>
              <span className="mono shrink-0 text-[10px] text-muted">
                {new Date(a.t).toLocaleTimeString("zh-CN", { hour12: false })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 复习队列：诚实跳转——核页工作台按本机三档统计；这里不生成到期/Due 文案。 */
function QueuePanel({ reviewHref, studyHref }: { reviewHref: string; studyHref: string }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <p className="text-sm leading-7 text-foreground/90">
        复习队列 = 核页工作台（章过滤 + 本机三档：待核｜已对｜存疑）与学习环三档（全部｜未评｜不熟）。
        两者都是本机态过滤，不是到期调度——这里不显示 Due / FSRS。
      </p>
      <p className="mt-3 text-xs leading-6 text-muted">
        本面板不存自己的队列；打开工作台看实时池数与本机标记。
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href={reviewHref}
          className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
        >
          打开核页工作台 →
        </Link>
        <Link
          href={studyHref}
          className="text-sm text-muted no-underline hover:text-cinnabar"
        >
          去学习环 →
        </Link>
      </div>
    </div>
  );
}