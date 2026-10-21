"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDeskContext } from "@/components/desk/DeskContext";
import type { ClewContextData } from "@/components/desk/DeskContext";
import { loadGrades, subscribeStudyGrades, type GradeMap } from "@/lib/study";
import {
  countPoolMarks,
  loadHeYeStore,
  subscribeHeYeStore,
  type HeYeStore,
} from "@/lib/heye-store";
import { saveReturn } from "@/lib/return-stack";
import LocalProgressStrip, { poolGrades } from "@/components/LocalProgressStrip";
import { withQsMode } from "@/lib/qs-mode";

/** T33 D：stub 气泡内的 muted 行动链（对页/练/核）。returnTo 有值时点前写 return 短链。 */
type ActionLink = { label: string; href: string; returnTo?: { href: string; label: string } };
type Msg =
  | { role: "user" | "assistant"; text: string; links?: ActionLink[] }
  | { role: "note"; text: string };
type Tab = "chat" | "changes" | "queue";

/** T33 D：点气泡行动链时兑现发送时快照的 return（无快照 = 无可回上下文，不写）。 */
function fireLinkReturn(l: ActionLink) {
  if (l.returnTo) saveReturn({ ...l.returnTo, at: Date.now() });
}

const SURFACE_ZH: Record<string, string> = {
  desk: "书桌",
  card: "本卡",
  study: "学习",
  review: "核页",
  library: "书架",
};

/**
 * 建议问：静态模板插真名（书名/章/可见实体/当前页），无 LLM。
 * T29 D：页码问句按当前表面说真话——核页问核、学习问练、书桌问中栏章页；
 * 全部读当前 clew（Bridge 已跟 qs），无页时不残留旧页文案。
 */
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
    list.push(
      clew.surface === "review"
        ? `p.${clew.page} 这一页的引用核到哪了？`
        : clew.surface === "study"
          ? `p.${clew.page} 这一页的知识原子练得怎么样？`
          : `中栏印刷页 p.${clew.page} 这段在讲什么？`,
    );
  }
  list.push(`这本书从哪一章开始读比较顺？`);
  return list.slice(0, 3);
}

/**
 * stub 回复规则：有页码上下文 → 提示对页；无 → 建议先开章页/卡。绝不宣称已核/verified。
 * T29 D：对照去处按当前表面说真话——核页有本页 OCR 原文，学习环有题目 CiteChip，
 * 书桌才是「中栏章页」；不再对 study/review 说「到中栏章页看」。
 */
function stubReply(clew: ClewContextData): string {
  const pages = [
    ...(clew.page != null ? [clew.page] : []),
    ...clew.citePages.filter((p) => p != null),
  ];
  if (pages.length > 0) {
    const where =
      clew.surface === "review"
        ? "本页 OCR 原文"
        : clew.surface === "study"
          ? "题目里的 CiteChip"
          : "中栏章页或实体卡 CiteChip";
    return `（stub · 未接模型）本地占位回复。可以对着${where}看 p.${pages.join(
      "、p.",
    )}；本面板不生成已核对结论，回答以教材印刷页为准。`;
  }
  return `（stub · 未接模型）本地占位回复。先把中栏切到「章页」或打开一张实体卡再问，便于对照印刷页核对；本面板不生成已核对结论。`;
}

/**
 * 本轮本机活动条目（只读 study.v1 + heye.v1，t >= sessionStartedAt；不写任何 seed/教材字段）。
 * T33 B：附 fail-closed 深链解析结果——study 键 `${cardId}/${atomId}` 取 cardId；
 * heye 键 `${cardId}|${page}|…` 取 cardId+page+标记档。解析不出 → 无链（纯文行），不编造。
 */
type Act = {
  t: number;
  kind: "study" | "heye";
  text: string;
  /** 解析出的卡 id（study 取首段 / heye 取首段；解析失败 undefined → 该行无链）。 */
  cardId?: string;
  /** heye 键第二段的印刷页（正整数才采信）。 */
  page?: number;
  /** heye 标记档（核链 mode 选择用）。 */
  mark?: "checked" | "doubt";
};

/**
 * T31 B / T33 D 共用：当前上下文的 return 短链 payload（有页回书桌本页，卡表面回卡枢纽，
 * 仅书回书级；书架/无上下文 null 不写）。key 不变（ariadne.desk.return.v1）。
 * T33 D 把它抽成纯函数——stub 气泡在**发送时**快照 payload，点旧气泡回「当时问的」上下文。
 */
function clewReturnPayload(clew: ClewContextData): { href: string; label: string } | null {
  if (clew.book && clew.page != null) {
    return {
      href: `/desk?book=${encodeURIComponent(clew.book.id)}&page=${clew.page}`,
      label: `书桌 p.${clew.page}`,
    };
  }
  if (clew.surface === "card" && clew.card) {
    return {
      href: `/desk/card/${encodeURIComponent(clew.card.id)}`,
      label: `卡《${clew.card.name_zh}》`,
    };
  }
  if (clew.book) {
    return {
      href: `/desk?book=${encodeURIComponent(clew.book.id)}`,
      label: `书桌《${clew.book.title}》`,
    };
  }
  return null;
}

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

  // 审计结论（review-fix-integrity G）：外层曾同时订阅 study/heye 两 store 打 tick，
  // 但 ClewPane 自身渲染只消费 clew context（书/章/页/卡/表面），不读任何本机 store——
  // 那两路订阅只会让整个右栏（含三 tab 与 stub 对话）每评一题/每标一条全量重渲染。
  // 订阅的合法消费者是**自带订阅+读盘的面板**（ChangesPanel；T33 C 起 QueuePanel 计数同模式），
  // 故外层仍不订阅，收敛为单路。

  const suggestions = buildSuggestions(clew);

  /**
   * T29 D：上下文键（书/章/页）变了且线程非空 → 追加一条 muted「上下文已换到 …」
   * （新气泡，不改写历史气泡）；首次挂载不记。progress* 池变化不改键，不触发。
   */
  const ctxKey = `${clew.book?.id ?? ""}|${clew.chapter?.id ?? ""}|${clew.page ?? ""}`;
  const seenCtxKey = useRef<string | null>(null);
  useEffect(() => {
    if (seenCtxKey.current === ctxKey) return;
    const first = seenCtxKey.current == null;
    seenCtxKey.current = ctxKey;
    if (first) return;
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const label = [
        clew.book ? `《${clew.book.title}》` : null,
        clew.chapter ? clew.chapter.title : null,
        clew.page != null ? `p.${clew.page}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return [
        ...prev,
        { role: "note", text: `上下文已换到${label ? ` ${label}` : "书架/空范围"}` },
      ];
    });
  }, [ctxKey, clew]);

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    /**
     * T33 D：stub 气泡附 muted 行动链——对页（有书+页）/ 去学习环 / 去核页（T31 回落链）。
     * 练/核链的 return payload 在发送时快照：气泡是历史，点旧气泡回「当时问的」上下文，
     * 不随后续上下文切换漂移；无页/无书时 stubReply 文案仍走「先开章页/卡」，不伪造行动。
     */
    const returnTo = clewReturnPayload(clew) ?? undefined;
    const links: ActionLink[] = [];
    if (clew.book && clew.page != null) {
      links.push({ label: `对页 p.${clew.page} →`, href: pageHref });
    }
    links.push(
      { label: "去学习环 →", href: studyHref, returnTo },
      { label: "去核页 →", href: reviewHref, returnTo },
    );
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "assistant", text: stubReply(clew), links },
    ]);
    setDraft("");
    requestAnimationFrame(() => {
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
    });
  }

  const bookHref = clew.book ? `/desk?book=${encodeURIComponent(clew.book.id)}` : "/desk";
  /**
   * T31 A：供 Changes 空态 / QueuePanel 的默认练/核深链——与中栏同真，按序回落：
   * 1) 优先 progress*（书桌=章/页 Strip 同款、卡面=本卡、study/review=同面池——各面写入）；
   * 2) surface=card 且有卡 → T30 卡作用域（卡枢纽页不回退）；
   * 3) 有书+页 → 本页书级（练 mode=all · 核 mode=open，与 Strip 深链同族）；
   * 4) 书级 / 全局。
   * 书桌面不再因段首可见卡（DocumentPane 把 card 设成 visibleCards[0]）把空态绑去
   * 卡作用域盖过本页 progress*——同栏不互谎。
   */
  const cardQ =
    clew.surface === "card" && clew.card?.id
      ? `card=${encodeURIComponent(clew.card.id)}${clew.book ? `&book=${encodeURIComponent(clew.book.id)}` : ""}`
      : null;
  const pageQ =
    clew.book && clew.page != null
      ? `book=${encodeURIComponent(clew.book.id)}&page=${clew.page}`
      : null;
  const studyHref =
    clew.progressStudyHref ??
    (cardQ
      ? `/study?${cardQ}`
      : pageQ
        ? `/study?${pageQ}&mode=all`
        : clew.book
          ? `/study?book=${encodeURIComponent(clew.book.id)}`
          : "/study");
  const reviewHref =
    clew.progressReviewHref ??
    (cardQ
      ? `/review?${cardQ}`
      : pageQ
        ? `/review?${pageQ}&mode=open`
        : clew.book
          ? `/review?book=${encodeURIComponent(clew.book.id)}`
          : "/review");
  const pageHref =
    clew.book && clew.page != null
      ? `/desk?book=${encodeURIComponent(clew.book.id)}&page=${clew.page}`
      : bookHref;

  /**
   * T31 B：Clew 练/核 CTA 点前写 return 短链——练/核完成态「回到刚才」能回当前上下文
   * （对齐 ChapterPageReader / CardHubReturnLinks 口径：有页回书桌本页，卡表面回卡枢纽，
   * 仅书回书级；书架/无上下文不写）。key 不变（ariadne.desk.return.v1）。
   * T33 D：payload 逻辑抽 clewReturnPayload（stub 气泡链发送时快照同一份）。
   */
  function rememberClewReturn() {
    const p = clewReturnPayload(clew);
    if (p) saveReturn({ ...p, at: Date.now() });
  }

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
                m.role === "note" ? (
                  // T29 D：上下文切换 muted 小字——不占气泡位、无新强调色，历史气泡不重写。
                  <p key={i} className="text-center text-[11px] leading-5 text-muted">
                    — {m.text} —
                  </p>
                ) : m.role === "user" ? (
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
                    {/* T33 D：行动链 muted 文字（非实心、非裸 URL）——对页/练/核可点；点练/核前兑现快照 return。 */}
                    {m.links?.length ? (
                      <span className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        {m.links.map((l) => (
                          <Link
                            key={`${l.label}|${l.href}`}
                            href={l.href}
                            onClick={() => fireLinkReturn(l)}
                            className="text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                          >
                            {l.label}
                          </Link>
                        ))}
                      </span>
                    ) : null}
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
          rememberReturn={rememberClewReturn}
        />
      ) : (
        <QueuePanel
          clew={clew}
          reviewHref={reviewHref}
          studyHref={studyHref}
          rememberReturn={rememberClewReturn}
        />
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
  rememberReturn,
}: {
  since: number;
  /** T19：Clew compact 进度条接上下文池（书桌 DocumentPane 随章/页写）；无池 → 全局计数。 */
  clew: ClewContextData;
  studyHref: string;
  reviewHref: string;
  /** T31 B：练/核 CTA 点前写 return 短链（回当前上下文）。 */
  rememberReturn: () => void;
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
    // T33 B：`${cardId}/${atomId}` 取首段 cardId（fail-closed：无斜杠/空段 → 无链纯文行）。
    const slash = key.indexOf("/");
    acts.push({
      t: g.t,
      kind: "study",
      cardId: slash > 0 ? key.slice(0, slash) : undefined,
      text: `自评 · ${g.k === 1 ? "认识" : "不熟"}`,
    });
  }
  for (const [key, m] of Object.entries(heye)) {
    if (typeof m?.t !== "number" || m.t < since) continue;
    // T33 B：`${cardId}|${page}|…` 取 cardId + page（页段正整数才采信）+ 标记档。
    const seg = key.split("|");
    const pageStr = /^\d+$/.test(seg[1] ?? "") ? seg[1] : undefined;
    acts.push({
      t: m.t,
      kind: "heye",
      cardId: seg[0] ? seg[0] : undefined,
      page: pageStr != null ? Number(pageStr) : undefined,
      mark: m.s,
      text: `核页${pageStr != null ? ` p.${pageStr}` : ""} · ${
        m.s === "checked" ? "本机已对" : "本机存疑"
      }`,
    });
  }
  acts.sort((a, b) => b.t - a.t);
  const shown = acts.slice(0, 20);

  /**
   * T33 B：条目深链（fail-closed）：解析不出 cardId → 空数组（纯文行，不编造）。
   * - study：主链开卡 /desk/card/<id>；有当前书 → 次级 /study?card=&book=&mode=all（点前 rememberReturn）。
   * - heye：核链 /review?card=&page=&book=&mode=按标记档（checked/doubt，无标记态回落 open）；
   *   无书时省 book=（review 面按 card+page 交集过滤）；开卡互补始终给。
   * 客户端无卡表：只展示 mono cardId，不编造中文卡名；card 与当前书不匹配时 review 面自己诚实警告。
   */
  function actLinks(a: Act): { label: string; href: string; remember?: boolean }[] {
    if (!a.cardId) return [];
    const cardQ = `card=${encodeURIComponent(a.cardId)}`;
    const bookQ = clew.book ? `&book=${encodeURIComponent(clew.book.id)}` : "";
    if (a.kind === "study") {
      const links: { label: string; href: string; remember?: boolean }[] = [
        { label: "开卡 →", href: `/desk/card/${encodeURIComponent(a.cardId)}` },
      ];
      if (clew.book) {
        links.push({ label: "练该卡 →", href: `/study?${cardQ}${bookQ}&mode=all`, remember: true });
      }
      return links;
    }
    const mode = a.mark === "checked" || a.mark === "doubt" ? a.mark : "open";
    return [
      {
        label: a.page != null ? "核该页 →" : "核该卡 →",
        href: `/review?${cardQ}${a.page != null ? `&page=${a.page}` : ""}${bookQ}&mode=${mode}`,
        remember: true,
      },
      { label: "开卡 →", href: `/desk/card/${encodeURIComponent(a.cardId)}` },
    ];
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <p className="rounded-lg border border-line bg-background px-3 py-2 text-xs leading-6 text-muted">
        <span className="font-medium text-foreground/80">未接模型。</span>
        这里没有可确认的写入提议；下列只读本浏览器本轮自评/核页标记。
      </p>

      {/* T19 Clew compact 章作用域：有池（DocumentPane 随章/页写）按池收窄，数字应明显小于全书；
          无池保持全局计数并给一句诚实说明。scopeLabel/href 与中栏 Strip 同一来源。
          T36 E：有 progress* href 时下传 mode 分段——有池分段 N>0 可点进同范围档；
          无 progress*（未定位章）不下传，全局计数保持纯文。 */}
      <LocalProgressStrip
        compact
        atoms={clew.progressAtoms}
        items={clew.progressItems}
        scopeLabel={clew.progressScopeLabel}
        studyHref={clew.progressStudyHref}
        reviewHref={clew.progressReviewHref}
        studyModeHrefs={
          clew.progressStudyHref
            ? {
                all: withQsMode(clew.progressStudyHref, "all"),
                unknown: withQsMode(clew.progressStudyHref, "unknown"),
                ungraded: withQsMode(clew.progressStudyHref, "ungraded"),
              }
            : undefined
        }
        heyeModeHrefs={
          clew.progressReviewHref
            ? {
                open: withQsMode(clew.progressReviewHref, "open"),
                checked: withQsMode(clew.progressReviewHref, "checked"),
                doubt: withQsMode(clew.progressReviewHref, "doubt"),
              }
            : undefined
        }
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
            <Link
              href={studyHref}
              onClick={rememberReturn}
              className="text-cinnabar no-underline hover:underline underline-offset-4"
            >
              去学习环自评 →
            </Link>
            <Link
              href={reviewHref}
              onClick={rememberReturn}
              className="text-cinnabar no-underline hover:underline underline-offset-4"
            >
              去核页对页 →
            </Link>
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {shown.map((a, i) => (
            <li
              key={i}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border border-line bg-background px-3 py-2 text-sm leading-6"
            >
              <span
                className={`mono shrink-0 text-[10px] ${a.kind === "study" ? "text-cinnabar" : "text-status-warn"}`}
              >
                {a.kind === "study" ? "练" : "核"}
              </span>
              {/* T33 B densify：mono 短 id 替代「自评「生 cardId」」整串引号文案；无卡表不编中文名。 */}
              {a.cardId ? (
                <span className="mono shrink-0 text-[11px] text-muted">{a.cardId}</span>
              ) : null}
              <span className="min-w-0 flex-1 text-foreground/90">{a.text}</span>
              {/* T33 B：可点回——开卡（次级 muted）；练/核链点前 rememberReturn（与空态 CTA 同）。 */}
              {actLinks(a).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={l.remember ? rememberReturn : undefined}
                  className="shrink-0 text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                >
                  {l.label}
                </Link>
              ))}
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

/**
 * 复习队列：诚实跳转 + 当前 progress* 池本机计数（T33 C densify，非 Due）。
 * 口径与 LocalProgressStrip / countPoolMarks / poolGrades 同一——不另写分叉计数；
 * 无池（书架等未定位章）→ 全局已记录条数 + 诚实说明，与 Changes 空池文案同族。
 * 不做成 Due 列表：不显示到期日、不引入 FSRS、不新建 storage。
 * T36 E：有池分段 N>0 可点进档——mode-swap 自 progress*（props studyHref/reviewHref 即
 * progress* 优先的回落链，withQsMode 只换 mode 不另解析 scope）；N=0 纯文、无池全局
 * 计数保持纯文。CTA 与 rememberReturn 不动；文案继续明示非 Due / 非 FSRS。
 */
function QueuePanel({
  clew,
  reviewHref,
  studyHref,
  rememberReturn,
}: {
  /** T33 C：读 progress* 池（各面 Bridge 写入）报当前范围本机数。 */
  clew: ClewContextData;
  reviewHref: string;
  studyHref: string;
  /** T31 B：练/核 CTA 点前写 return 短链（回当前上下文）。 */
  rememberReturn: () => void;
}) {
  const [grades, setGrades] = useState<GradeMap>({});
  const [heye, setHeYe] = useState<HeYeStore>({});
  const [ready, setReady] = useState(false);

  // 只读双 store 的唯一消费者（外层 ClewPane 已收敛为单路订阅，见其审计注释）。
  useEffect(() => {
    setGrades(loadGrades());
    setHeYe(loadHeYeStore());
    setReady(true);
    const u1 = subscribeStudyGrades(() => setGrades(loadGrades()));
    const u2 = subscribeHeYeStore(() => setHeYe(loadHeYeStore()));
    return () => {
      u1();
      u2();
    };
  }, []);

  const hasPool = (clew.progressAtoms?.length ?? 0) + (clew.progressItems?.length ?? 0) > 0;
  const pool = clew.progressAtoms ? poolGrades(clew.progressAtoms, grades) : null;
  const marks = clew.progressItems ? countPoolMarks(clew.progressItems, heye) : null;
  const globalKnown = Object.values(grades).filter((g) => g.k === 1).length;
  const globalUnknown = Object.values(grades).filter((g) => g.k === 0).length;
  const globalChecked = Object.values(heye).filter((m) => m.s === "checked").length;
  const globalDoubt = Object.values(heye).filter((m) => m.s === "doubt").length;

  /** T36 E 分段：N>0 且有 href → 文字链（同色 + hover 下划线，对齐 Strip/ScopeCounts seg 族）。 */
  function seg(n: number, label: string, href: string, toneCls: string) {
    const text = (
      <>
        {label} {n}
      </>
    );
    if (n > 0) {
      return (
        <Link
          href={href}
          className={`${toneCls} no-underline hover:underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-cinnabar`}
        >
          {text}
        </Link>
      );
    }
    return <span className={toneCls}>{text}</span>;
  }
  /** 三档深链：progress*（或回落链）mode-swap——范围与计数池同源，不另写解析。 */
  const studyModes = {
    all: withQsMode(studyHref, "all"),
    unknown: withQsMode(studyHref, "unknown"),
    ungraded: withQsMode(studyHref, "ungraded"),
  };
  const heyeModes = {
    open: withQsMode(reviewHref, "open"),
    checked: withQsMode(reviewHref, "checked"),
    doubt: withQsMode(reviewHref, "doubt"),
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <p className="text-sm leading-7 text-foreground/90">
        复习队列 = 核页工作台（章过滤 + 本机三档：待核｜已对｜存疑）与学习环三档（全部｜未评｜不熟）。
        两者都是本机态过滤，不是到期调度——这里不显示 Due / FSRS。
      </p>

      {/* T33 C：当前 progress* 池本机计数（与 Changes 内 compact Strip 同池同口径）；无池 → 全局。
          T36 E：有池分段 N>0 可点进对应档（见 seg/studyModes/heyeModes）；N=0 纯文。 */}
      {!ready ? (
        <p className="mt-3 text-xs leading-6 text-muted">本机进度读取中…</p>
      ) : hasPool ? (
        <p className="mt-3 text-xs leading-6 text-muted" aria-label="当前范围本机标记计数">
          {clew.progressScopeLabel ? (
            <span className="mr-2 text-foreground/80">{clew.progressScopeLabel}</span>
          ) : null}
          {marks ? (
            <>
              核 {seg(marks.open, "待核", heyeModes.open, "")}
              <span className="text-status-ok"> · </span>
              {seg(marks.checked, "已对", heyeModes.checked, "text-status-ok")}
              <span className="text-status-warn"> · </span>
              {seg(marks.doubt, "存疑", heyeModes.doubt, "text-status-warn")}
            </>
          ) : null}
          {marks && pool ? <span className="mx-2 text-line">|</span> : null}
          {pool ? (
            <>
              练 {seg(pool.known, "认识", studyModes.all, "text-status-ok")}
              <span className="text-status-warn"> · </span>
              {seg(pool.unknown, "不熟", studyModes.unknown, "text-status-warn")}
              <span> · </span>
              {seg(pool.ungraded, "未评", studyModes.ungraded, "")}
            </>
          ) : null}
          <span className="ml-2">· 仅这个浏览器 · 非 Due</span>
        </p>
      ) : (
        <p className="mt-3 text-xs leading-6 text-muted">
          未定位章 · 全书本机记录：练 认识 {globalKnown} · 不熟 {globalUnknown}；
          核 已对 {globalChecked} · 存疑 {globalDoubt}。到书桌打开书目后按章/页收窄。
        </p>
      )}

      <p className="mt-3 text-xs leading-6 text-muted">
        本面板不存自己的队列；打开工作台看实时池数与本机标记。
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href={reviewHref}
          onClick={rememberReturn}
          className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
        >
          打开核页工作台 →
        </Link>
        <Link
          href={studyHref}
          onClick={rememberReturn}
          className="text-sm text-muted no-underline hover:text-cinnabar"
        >
          去学习环 →
        </Link>
      </div>
    </div>
  );
}