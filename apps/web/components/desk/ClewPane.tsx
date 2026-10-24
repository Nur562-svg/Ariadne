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
/**
 * T51 A：空池占位行——发送时对侧池 ===0 的 muted 纯文（无 href 不可点、不写 return），
 * 与可点链同位渲染占住「去学习环/去核页」的位置，不装能进空环。
 */
type PlainLink = { label: string; plain: true };
type Msg =
  | { role: "user" | "assistant"; text: string; links?: (ActionLink | PlainLink)[] }
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
 * stub 回复规则：有页码上下文 → 提示对页；无 → 按表面说真话。绝不宣称已核/verified。
 * T29 D：对照去处按当前表面说真话——核页有本页 OCR 原文，学习环有题目 CiteChip，
 * 书桌才是「中栏章页」；不再对 study/review 说「到中栏章页看」。
 * T44 D：无页分支同样按表面（及有无书）分写——study/review/library 不再统一说「中栏章页」。
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
  const noPageHint = !clew.book
    ? "书库还没有已注册书目——先到 /ingest 导入并注册教材，再从书架打开一本书后回来问"
    : clew.surface === "study"
      ? "学习环先练到带 CiteChip 的题目，对着题目引用来问，便于对照印刷页"
      : clew.surface === "review"
        ? "核页还没定位到印刷页——可按章/页收窄队列，或回书桌打开章页对照本页 OCR 原文"
        : clew.surface === "library"
          ? "先从书架打开一本书，带着章/页上下文再问，便于对照印刷页"
          : "先把中栏切到「章页」或打开一张实体卡再问，便于对照印刷页核对";
  return `（stub · 未接模型）本地占位回复。${noPageHint}；本面板不生成已核对结论。`;
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
   * T51：Clew 右栏四处练核 CTA（stub 气泡 / chat 空态 / Changes / Queue）共用同一池口径——
   * progress* 缺 key / 缺省当 0（fail-closed），===0 不装能进空环；不造假正数。
   */
  const atomN = clew.progressAtoms?.length ?? 0;
  const pendingN = clew.progressItems?.length ?? 0;

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
     * T51 A：练/核链吃发送时 progress* 池（fail-closed 缺省 0）——池===0 该侧降 PlainLink
     * 纯文「暂无原子/暂无待核」（不可点、不写 return）；>0 保持 ActionLink + return 快照。
     */
    const returnTo = clewReturnPayload(clew) ?? undefined;
    const links: (ActionLink | PlainLink)[] = [];
    if (clew.book && clew.page != null) {
      links.push({ label: `对页 p.${clew.page} →`, href: pageHref });
    }
    links.push(
      (clew.progressAtoms?.length ?? 0) > 0
        ? { label: "去学习环 →", href: studyHref, returnTo }
        : { label: "暂无原子", plain: true },
      (clew.progressItems?.length ?? 0) > 0
        ? { label: "去核页 →", href: reviewHref, returnTo }
        : { label: "暂无待核", plain: true },
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
   * T38 C：cardQ 与书级无页两条回落也恒拼默认档（练 &mode=all · 核 &mode=open）——
   * 消裸 ?card= / ?book= 被 StickyModeGate restore 成空档的撒谎面；progress* 与
   * pageQ 的优先序、既有 mode 只回归不动。Queue/Changes 的 withQsMode 分段派生自
   * 同一对 href，mode 参数只被覆盖、不受影响。
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
      ? `/study?${cardQ}&mode=all`
      : pageQ
        ? `/study?${pageQ}&mode=all`
        : clew.book
          ? `/study?book=${encodeURIComponent(clew.book.id)}&mode=all`
          : "/study");
  const reviewHref =
    clew.progressReviewHref ??
    (cardQ
      ? `/review?${cardQ}&mode=open`
      : pageQ
        ? `/review?${pageQ}&mode=open`
        : clew.book
          ? `/review?book=${encodeURIComponent(clew.book.id)}&mode=open`
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
                {clew.book ? (
                  /* T44 C：有书空态不主推「导入教材」——点名当前书的日用链（桌/练/核）；
                     自测/核页点前 rememberClewReturn（T42/T31 接线不拆）；「另导入」只作次级 muted。 */
                  <>
                    <p className="text-xs leading-6 text-muted">
                      还没接模型（stub）。当前书《{clew.book.title}
                    》——日用路径：
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted">
                      <Link
                        href={pageHref}
                        className="text-cinnabar no-underline hover:underline underline-offset-4"
                      >
                        回书桌{clew.page != null ? `本页` : "读实体卡/章页"}
                      </Link>
                      <span>→</span>
                      {/* T42 E：stub 空态路径的「学习环自测」点前 rememberClewReturn——与空态 CTA /
                          stub 气泡链同一函数，离面即记回程（回当前 Clew 上下文）。
                          T51 B：双链吃 progress* 池（fail-closed 0）——===0 降 muted 纯文
                          「暂无原子/暂无待核」不可点；>0 保持 Link + return 接线。 */}
                      {atomN > 0 ? (
                        <Link
                          href={studyHref}
                          onClick={rememberClewReturn}
                          className="text-cinnabar no-underline hover:underline underline-offset-4"
                        >
                          学习环自测
                        </Link>
                      ) : (
                        <span title="当前范围没有可练原子">暂无原子</span>
                      )}
                      <span>→</span>
                      {pendingN > 0 ? (
                        <Link
                          href={reviewHref}
                          onClick={rememberClewReturn}
                          className="text-cinnabar no-underline hover:underline underline-offset-4"
                        >
                          核页对页
                        </Link>
                      ) : (
                        <span title="当前范围没有待核 cite">暂无待核</span>
                      )}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-muted">
                      另导入其他教材：
                      <Link
                        href="/ingest"
                        className="ml-1 text-muted no-underline hover:text-cinnabar hover:underline underline-offset-4"
                      >
                        /ingest →
                      </Link>
                    </p>
                  </>
                ) : (
                  /* T44 C：无书才走 ingest 冷启动首环（与 buildSuggestions 无书句同真）。
                     T51 B：撤掉尾环「学习环自测」——无书时 studyHref 回落裸 /study（全书空池），
                     朱红链装作能练是谎言；冷启动止于「导入→书架→书桌」，练核等有书有池再给。 */
                  <>
                    <p className="text-xs leading-6 text-muted">
                      还没接模型（stub）。书库为空——请带着页码对照的问题发问；先按这条路径走通：
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted">
                      <Link href="/ingest" className="text-cinnabar no-underline hover:underline underline-offset-4">导入教材</Link>
                      <span>→</span>
                      <Link href="/" className="text-cinnabar no-underline hover:underline underline-offset-4">书架打开</Link>
                      <span>→</span>
                      <Link href={bookHref} className="text-cinnabar no-underline hover:underline underline-offset-4">书桌读实体卡/章页</Link>
                    </p>
                  </>
                )}
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
                    {/* T33 D：行动链 muted 文字（非实心、非裸 URL）——对页/练/核可点；点练/核前兑现快照 return。
                        T51 A：PlainLink（空池占位）渲染 muted 纯文——无 href 不可点、不写 return。 */}
                    {m.links?.length ? (
                      <span className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        {m.links.map((l) =>
                          "plain" in l ? (
                            <span key={l.label} className="text-xs text-muted">
                              {l.label}
                            </span>
                          ) : (
                            <Link
                              key={`${l.label}|${l.href}`}
                              href={l.href}
                              onClick={() => fireLinkReturn(l)}
                              className="text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                            >
                              {l.label}
                            </Link>
                          ),
                        )}
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
                placeholder="问点什么…（Enter 发送 · Shift+Enter 换行）"
                aria-label="Clew 输入"
                className="min-h-[2.75rem] w-full resize-y rounded-lg border border-line bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted focus:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
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
  /** T43 D：本地面 kind 筛选（全部｜练｜核）——只影响展示，不改本机记录、不新建 storage。 */
  const [kindFilter, setKindFilter] = useState<"all" | "study" | "heye">("all");

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
  /**
   * T51 C：空态双链 / 筛空单侧 CTA 的池门禁——与 stub 气泡 / chat 空态 / Queue 主 CTA
   * 同一 progress* 口径（fail-closed 缺省 0）；===0 降 muted 纯文不可点，>0 保持 +
   * rememberReturn。只门禁 CTA，不动 T43 筛选芯片 /「还有 N」截断 / 本轮标记模型。
   */
  const atomN = clew.progressAtoms?.length ?? 0;
  const pendingN = clew.progressItems?.length ?? 0;
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
  /**
   * T43 D：筛选先于截断——按 kind 过滤后再 slice(0, 20)；筛后超过 20 条如实报「还有 N 条」
   * （本机标记，非 Due）。练/核分计数随 acts 全量算，筛前就能看出核是不是 0。
   */
  const studyCount = acts.filter((a) => a.kind === "study").length;
  const heyeCount = acts.length - studyCount;
  const filtered = kindFilter === "all" ? acts : acts.filter((a) => a.kind === kindFilter);
  const shown = filtered.slice(0, 20);
  const hiddenCount = filtered.length - shown.length;

  /**
   * T33 B：条目深链（fail-closed）：解析不出 cardId → 空数组（纯文行，不编造）。
   * - study：主链开卡 /desk/card/<id>；有当前书 → 次级 /study?card=&book=&mode=all（点前 rememberReturn）。
   * - heye：核链 /review?card=&page=&book=&mode=按标记档（checked/doubt，无标记态回落 open）；
   *   无书时省 book=（review 面按 card+page 交集过滤）；开卡互补始终给。
   * T41 C：「开卡 →」同样 remember: true——与「练该卡 →」「核该* →」同真回程（渲染侧
   * onClick={l.remember ? rememberReturn : undefined} 已就绪，只改数据）。
   * 客户端无卡表：只展示 mono cardId，不编造中文卡名；card 与当前书不匹配时 review 面自己诚实警告。
   */
  function actLinks(a: Act): { label: string; href: string; remember?: boolean }[] {
    if (!a.cardId) return [];
    const cardQ = `card=${encodeURIComponent(a.cardId)}`;
    const bookQ = clew.book ? `&book=${encodeURIComponent(clew.book.id)}` : "";
    if (a.kind === "study") {
      const links: { label: string; href: string; remember?: boolean }[] = [
        { label: "开卡 →", href: `/desk/card/${encodeURIComponent(a.cardId)}`, remember: true },
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
      { label: "开卡 →", href: `/desk/card/${encodeURIComponent(a.cardId)}`, remember: true },
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
          无 progress*（未定位章）不下传，全局计数保持纯文。
          T40 D：returnTo=clewReturnPayload——条末练/核与 N>0 分段点前写 return，与空态
          CTA / stub 气泡链同一 payload（有页→书桌 p.N；卡面→卡枢纽；仅书→书级；
          书架/无上下文 null 不传不写，行为与前同）。 */}
      <LocalProgressStrip
        compact
        atoms={clew.progressAtoms}
        items={clew.progressItems}
        scopeLabel={clew.progressScopeLabel}
        studyHref={clew.progressStudyHref}
        reviewHref={clew.progressReviewHref}
        returnTo={clewReturnPayload(clew) ?? undefined}
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

      {/* T43 D：本地面 kind 筛选芯片（全部｜练｜核）——当前档朱红 soft（对齐 ModeChips/章芯片
          气质，勿第二品牌色）；只筛展示不改记录，右侧如实给本轮练/核分计数。 */}
      {acts.length > 0 ? (
        <div
          className="mt-3 flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="按练/核筛选本轮标记"
        >
          {(
            [
              ["all", "全部"],
              ["study", "练"],
              ["heye", "核"],
            ] as ["all" | "study" | "heye", string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              aria-pressed={kindFilter === k}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                kindFilter === k
                  ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                  : "border-line text-muted hover:border-cinnabar hover:text-cinnabar"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-1 text-[11px] leading-5 text-muted">
            本轮 练 {studyCount} · 核 {heyeCount}
          </span>
        </div>
      ) : null}

      {acts.length === 0 ? (
        <div className="mt-6 border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
          本轮还没有本机标记——去学习环自评或核页对页后回到这里。
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {atomN > 0 ? (
              <Link
                href={studyHref}
                onClick={rememberReturn}
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                去学习环自评 →
              </Link>
            ) : (
              <span className="text-muted" title="当前范围没有可练原子">
                暂无原子
              </span>
            )}
            {pendingN > 0 ? (
              <Link
                href={reviewHref}
                onClick={rememberReturn}
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                去核页对页 →
              </Link>
            ) : (
              <span className="text-muted" title="当前范围没有待核 cite">
                暂无待核
              </span>
            )}
          </p>
        </div>
      ) : shown.length === 0 ? (
        /* T43 D 筛空诚实句：本轮只有另一侧写入了本机标记，不假装空无一物；
           CTA 随筛给对应侧（return 接线沿用 rememberReturn，不拆 T40/T41）。 */
        <div className="mt-6 border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
          本轮暂无「{kindFilter === "study" ? "练" : "核"}」标记——
          {kindFilter === "study"
            ? `只有核页标记（${heyeCount} 条）写入了本机记录。`
            : `只有学习环自评（${studyCount} 条）写入了本机记录。`}
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {/* T43 D 筛空只给对应侧 CTA；T51 C 同池门禁——===0 纯文（不装能进空环），
                >0 保持 + rememberReturn（T40/T41 接线不拆）。 */}
            {kindFilter === "study" ? (
              atomN > 0 ? (
                <Link
                  href={studyHref}
                  onClick={rememberReturn}
                  className="text-cinnabar no-underline hover:underline underline-offset-4"
                >
                  去学习环自评 →
                </Link>
              ) : (
                <span className="text-muted" title="当前范围没有可练原子">
                  暂无原子
                </span>
              )
            ) : pendingN > 0 ? (
              <Link
                href={reviewHref}
                onClick={rememberReturn}
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                去核页对页 →
              </Link>
            ) : (
              <span className="text-muted" title="当前范围没有待核 cite">
                暂无待核
              </span>
            )}
          </p>
        </div>
      ) : (
        <>
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
          {/* T43 D 截断诚实：筛选后超过 20 条——只列前 20，余下如实报数（本机标记，非 Due）。 */}
          {hiddenCount > 0 ? (
            <p className="mt-2 text-[11px] leading-5 text-muted">
              还有 {hiddenCount} 条本轮未列——只读本机标记，非 Due。
            </p>
          ) : null}
        </>
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
  // T65 G：fail-closed——装载/订阅抛错仍 setReady(true)（空计数），绝不永挂「读取中」。
  useEffect(() => {
    try {
      setGrades(loadGrades());
      setHeYe(loadHeYeStore());
      setReady(true);
      const u1 = subscribeStudyGrades(() => setGrades(loadGrades()));
      const u2 = subscribeHeYeStore(() => setHeYe(loadHeYeStore()));
      return () => {
        u1();
        u2();
      };
    } catch {
      setGrades({});
      setHeYe({});
      setReady(true);
      return;
    }
  }, []);

  const hasPool = (clew.progressAtoms?.length ?? 0) + (clew.progressItems?.length ?? 0) > 0;
  /**
   * T51 D：主 CTA / 去学习环的池门禁（fail-closed 缺省 0）——待核池===0 时「打开核页工作台」
   * 降 muted 纯文（无池 →「未定位章 · 暂无范围池」，与上方同句族；有池 0 →「暂无待核」）；
   * 原子池===0 时「去学习环」同理「暂无原子」。>0 保持朱红主钮 / 次级链 + rememberReturn。
   * 分段 seg N>0/N=0（T36/T40）只回归；非 Due、非 FSRS。
   */
  const atomN = clew.progressAtoms?.length ?? 0;
  const pendingN = clew.progressItems?.length ?? 0;
  const pool = clew.progressAtoms ? poolGrades(clew.progressAtoms, grades) : null;
  const marks = clew.progressItems ? countPoolMarks(clew.progressItems, heye) : null;
  const globalKnown = Object.values(grades).filter((g) => g.k === 1).length;
  const globalUnknown = Object.values(grades).filter((g) => g.k === 0).length;
  const globalChecked = Object.values(heye).filter((m) => m.s === "checked").length;
  const globalDoubt = Object.values(heye).filter((m) => m.s === "doubt").length;

  /** T36 E 分段：N>0 且有 href → 文字链（同色 + hover 下划线，对齐 Strip/ScopeCounts seg 族）。
      T40 E：N>0 可点段是进练/核档的出发点——点前 rememberReturn（与主 CTA 同函数，
      父级已传入，payload=clewReturnPayload 同一来源）；N=0 纯文、无池全局计数保持纯文。 */
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
          onClick={rememberReturn}
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
        <>
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
          {/* T43 E 有池清完分写：待核与未评都为 0 才说「已清」——与下方「未定位章」分支两句不互拷；
              明示本机记录、非 Due / 非 FSRS，不做掌握%绿条。 */}
          {marks && pool && marks.open === 0 && pool.ungraded === 0 ? (
            <p className="mt-1 text-xs leading-6 text-muted">
              本范围待核与未评已清——可到「已对 · 存疑」或「认识 · 不熟」档复查改动；仅本机记录，非 Due、非 FSRS。
            </p>
          ) : null}
        </>
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
        {pendingN > 0 ? (
          <Link
            href={reviewHref}
            onClick={rememberReturn}
            className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
          >
            打开核页工作台 →
          </Link>
        ) : (
          <span
            className="text-sm text-muted"
            title={hasPool ? "当前范围没有待核 cite" : "未定位章，无章/页范围池可开"}
          >
            {hasPool ? "暂无待核" : "未定位章 · 暂无范围池"}
          </span>
        )}
        {atomN > 0 ? (
          <Link
            href={studyHref}
            onClick={rememberReturn}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            去学习环 →
          </Link>
        ) : (
          <span className="text-sm text-muted" title="当前范围没有可练原子">
            暂无原子
          </span>
        )}
      </div>
    </div>
  );
}