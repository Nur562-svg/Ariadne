"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDeskContext } from "@/components/desk/DeskContext";
import { saveReturn } from "@/lib/return-stack";
import CopyTextButton from "@/components/CopyTextButton";
import {
  CLEW_HONESTY_FOOTNOTE,
  buildSuggestPatchText,
  buildTakeawayText,
  splitStructuredPatch,
  type ClewSeedBefore,
  type ClewSuggestContext,
} from "@/lib/clew-suggest";
import { buildAuditBasis, coerceClewAnswerAudit, safeAuditClewAnswer } from "@/lib/clew-answer-audit";
import { atomDraftKey, fieldDraftKey, mergeAtomDraft } from "@/lib/atom-draft";
import {
  CLEW_TIER_KEY,
  SURFACE_ZH,
  TIER_IDS,
  TIER_LABEL,
  bubbleReturnTo,
  buildSuggestions,
  clewCtaHrefs,
  clewReturnPayload,
  fireLinkReturn,
  parseCardAtoms,
  pickSuggestContext,
  stubReply,
  type ActionLink,
  type AssistantMsg,
  type Capability,
  type Msg,
  type PlainLink,
  type Tab,
  type TierInfo,
} from "@/components/desk/clew-pane-helpers";
import { AuditedProse, AuditFace } from "@/components/desk/ClewAuditView";
import { ChangesPanel } from "@/components/desk/ClewChangesPanel";
import { QueuePanel } from "@/components/desk/ClewQueuePanel";

/**
 * T75 机械抽出后编排器：只留会话态（tab/messages/draft/sending/abort/fillStates/cap/tier）
 * + status 探针 + send/stream/retry + fillDrafts + 档位芯片 + 补丁建议/复制/填草稿块 + 组装。
 * 模块层类型/纯函数在 clew-pane-helpers；核账视图在 ClewAuditView；Changes/Queue 两面板
 * 各自成文件。export default 路径与零 props 契约不变（DeskShellClient <ClewPane />）。
 */

/**
 * Clew 右栏（~400）：会话条 + 三 tab（对话 | 本轮变更 | 复习队列）+ 对话。
 * 上下文来自 DeskContext（书/章/当前页/卡/表面）；
 * T66：对话经 POST /api/clew/suggest 取只读 live 答（单问 + 当前上下文；服务端缺钥 503 →
 * 诚实降 stubReply；上游/网络错 → 失败条保留原问可重试）。无假写入：永不写 entities /
 * verified / atom-draft 仓；带走只靠剪贴板。
 * 「本轮变更」只读本浏览器 session 开始以来的 study/heye 标记。「复习队列」只诚实跳转。
 * 底部常驻诚实脚注（CLEW_HONESTY_FOOTNOTE）。
 */
export default function ClewPane() {
  const { clew, sessionStartedAt } = useDeskContext();
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  /** T66 E：在途锁——sending 时 Enter / 发送钮 / 建议问都不再发第二问。 */
  const [sending, setSending] = useState(false);
  /** T67 B：在途请求的 AbortController（「停止」钮用；取消只中止读流，无任何写副作用）。 */
  const abortRef = useRef<AbortController | null>(null);
  /**
   * T67 F：显式「填入本机草稿」反馈（气泡下标 → done|unpersisted）；只由用户点击写入——
   * 发送回调永不 setAtomDraft（铁合同 2）。
   */
  const [fillStates, setFillStates] = useState<Record<number, "done" | "unpersisted">>({});
  function fillDrafts(i: number, m: AssistantMsg) {
    const cardId = m.ctx.card?.id;
    const entries = m.patchEntries ?? [];
    if (!cardId || entries.length === 0 || sending) return;
    let persisted = true;
    for (const e of entries) {
      const fields: Record<string, string> = { [e.field]: e.after };
      const r = e.target.startsWith("field:")
        ? mergeAtomDraft(fieldDraftKey(cardId, Number(e.target.slice(6))), fields)
        : mergeAtomDraft(atomDraftKey(cardId, e.target.slice(5)), fields);
      persisted = persisted && r.persisted;
    }
    setFillStates((prev) => ({ ...prev, [i]: persisted ? "done" : "unpersisted" }));
  }
  /** T66 G / T68 B：挂载探一次 /api/clew/status（不调模型）；失败 → stub（fail-closed）。 */
  const [cap, setCap] = useState<Capability | null>(null);
  /** T68 D：当前档（fast 缺省；sessionStorage 记上次选择；非法值回落 fast）。 */
  const [tier, setTier] = useState<string>("fast");
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 恢复上次档选择：微任务里 set——不在 effect 体内同步 setState（级联渲染），也不进
    // useState 初始化器（SSR/客户端初值不一致会 hydration mismatch；mount 后一帧生效即可）。
    try {
      const saved = window.sessionStorage.getItem(CLEW_TIER_KEY);
      if (saved === "fast" || saved === "reasoning" || saved === "long-context") {
        queueMicrotask(() => setTier(saved));
      }
    } catch {
      /* 隐私模式读失败 → 缺省 fast */
    }
    let alive = true;
    fetch("/api/clew/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (j: {
          mode?: string;
          provider?: string | null;
          model?: string | null;
          tiers?: TierInfo[];
          usage?: { today?: number; byTier?: Record<string, number> };
        } | null) => {
          if (!alive) return;
          if (j && j.mode === "live") {
            setCap({
              mode: "live",
              provider: j.provider ?? undefined,
              model: j.model ?? undefined,
              tiers: Array.isArray(j.tiers) ? j.tiers : undefined,
              usageToday: typeof j.usage?.today === "number" ? j.usage.today : undefined,
              usageByTier:
                j.usage?.byTier && typeof j.usage.byTier === "object" ? j.usage.byTier : undefined,
            });
          } else {
            setCap({ mode: "stub", tiers: Array.isArray(j?.tiers) ? j.tiers : undefined });
          }
        },
      )
      .catch(() => {
        if (alive) setCap({ mode: "stub" });
      });
    return () => {
      alive = false;
    };
  }, []);

  /** T68 D：选档（sessionStorage 记忆；新键，不动既有 storage）。 */
  function pickTier(id: string) {
    setTier(id);
    try {
      window.sessionStorage.setItem(CLEW_TIER_KEY, id);
    } catch {
      /* 写失败不影响本次会话选择 */
    }
  }

  /** T68 D：档可用性——探针未回（null）不拦（服务端最终把关）；已回则按 tiers[].available。 */
  function tierAvailable(id: string): boolean {
    if (!cap?.tiers) return true;
    const t = cap.tiers.find((x) => x.id === id);
    return t ? t.available : true;
  }

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

  function scrollThread() {
    requestAnimationFrame(() => {
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
    });
  }

  /** T66 D / T67 B：改写最后一条 pending 助手气泡（在途锁保证同一时刻至多一条 pending）。 */
  function updatePending(upd: Partial<Omit<AssistantMsg, "role">> | ((cur: AssistantMsg) => Partial<Omit<AssistantMsg, "role">>)) {
    setMessages((prev) => {
      let i = prev.length - 1;
      while (i >= 0) {
        const m = prev[i];
        if (m.role === "assistant" && m.mode === "pending") break;
        i--;
      }
      if (i < 0) return prev;
      const cur = prev[i] as AssistantMsg;
      const patch = typeof upd === "function" ? upd(cur) : upd;
      const next: AssistantMsg = { ...cur, ...patch };
      return [...prev.slice(0, i), next, ...prev.slice(i + 1)];
    });
  }

  /** T67 B / T70 E：pending 气泡随流式 chunk 增长，并用同源纯函数做灰色核账预览。 */
  function appendPending(piece: string) {
    updatePending((cur) => {
      const text = cur.text + piece;
      const basis =
        cur.auditBasis ??
        buildAuditBasis({
          groundPages: cur.meta?.groundPages ?? (cur.meta?.pageWindow ? [cur.meta.pageWindow.page] : []),
          contextPage: cur.ctx.page,
          citePages: cur.ctx.citePages,
          entityIds: cur.ctx.card ? [cur.ctx.card.id] : [],
        });
      return { text, audit: safeAuditClewAnswer(text, basis), auditPreview: true };
    });
  }

  /**
   * T66 D/E · T67 B：发请求——POST /api/clew/suggest 流式主路径（NDJSON：meta → delta* → done｜error）。
   *  - meta → 记 provider/model/页小窗与补丁 target 白名单；
   *  - delta → pending 气泡逐 chunk 增长；
   *  - done → live：全文剥尾随 ```json 围栏 → answer + patchEntries（白名单过滤，发明 target 丢弃）；
   *  - error 事件 / 流中断 / 停止 → error 态：已收文本保留 + 原问可重试，**不**装成功答；
   *  - 503 no_provider → 诚实 stub（stubReply 族）；其它 4xx/5xx → error（服务端短讯）。
   * 客户端永不写任何 store / 不 PATCH / 不碰钥；「填入本机草稿」只认用户点击（F）。
   */
  async function run(q: string, ctx: ClewSuggestContext, stubText: string, tierUsed: string) {
    setSending(true);
    const ac = new AbortController();
    abortRef.current = ac;
    /** T68 F / T69 F：本机用量近似 bump——只对真打了上游的（200 / 502）+1（总分 + 该档）；
        4xx/503/429 不计。有 byTier 时分档同 bump；无（旧 status 形）保持总数形。 */
    const bumpUsage = (t: string) => {
      setCap((c) =>
        c && c.usageToday != null
          ? {
              ...c,
              usageToday: c.usageToday + 1,
              ...(c.usageByTier
                ? { usageByTier: { ...c.usageByTier, [t]: (c.usageByTier[t] ?? 0) + 1 } }
                : {}),
            }
          : c,
      );
    };
    try {
      const res = await fetch("/api/clew/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context: ctx, tier: tierUsed }),
        signal: ac.signal,
      });
      if (!res.ok) {
        if (res.status === 502) bumpUsage(tierUsed);
        const j: Record<string, unknown> | null = await res.json().catch(() => null);
        if (res.status === 503 && j?.error === "no_provider") {
          // T70 E：stub 文本也可能带页码。没给模型窗，ground 为空；请求页/cite 算上下文。
          const audit = safeAuditClewAnswer(
            stubText,
            buildAuditBasis({
              groundPages: [],
              contextPage: ctx.page,
              citePages: ctx.citePages,
              entityIds: ctx.card ? [ctx.card.id] : [],
            }),
          );
          updatePending({
            mode: "stub",
            text: stubText,
            audit,
            auditPreview: false,
            meta: { mode: "stub", audit },
          });
        } else {
          const msg = typeof j?.message === "string" ? j.message : `请求失败（HTTP ${res.status}）`;
          updatePending({ mode: "error", errorText: msg });
        }
        return;
      }
      bumpUsage(tierUsed);
      if (!res.body) {
        updatePending({ mode: "error", errorText: "响应无流体——原问已保留，可重试" });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let allowed: string[] = [];
      /** T69 D：meta 随白名单带来的 seed 现值（before 对齐；done 剥围栏时用）。 */
      let seedBefore: ClewSeedBefore | null = null;
      let sawDone = false;
      let doneAuditRaw: unknown;
      let sawError: string | null = null;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          let ev: Record<string, unknown> | null = null;
          try {
            ev = JSON.parse(line) as Record<string, unknown>;
          } catch {
            continue; // 脏行丢弃（流仍续）
          }
          if (ev?.type === "meta") {
            allowed = Array.isArray(ev.incompleteTargets) ? (ev.incompleteTargets as string[]) : [];
            const sb = ev.seedBefore;
            seedBefore =
              sb !== null && typeof sb === "object" && !Array.isArray(sb) ? (sb as ClewSeedBefore) : null;
            const pw = ev.pageWindow as { page: number; chars: number; truncated: boolean } | null | undefined;
            const gp = Array.isArray(ev.groundPages)
              ? (ev.groundPages as unknown[]).filter((x): x is number => typeof x === "number")
              : undefined;
            const pagesOmitted =
              typeof ev.pagesOmitted === "number" && Number.isInteger(ev.pagesOmitted) && ev.pagesOmitted > 0
                ? ev.pagesOmitted
                : undefined;
            const basisRaw = ev.auditBasis;
            const auditBasis =
              basisRaw && typeof basisRaw === "object" && !Array.isArray(basisRaw)
                ? buildAuditBasis(basisRaw as Parameters<typeof buildAuditBasis>[0])
                : undefined;
            const cardAtoms = parseCardAtoms(ev.cardAtoms);
            updatePending({
              ...(auditBasis ? { auditBasis } : {}),
              cardAtoms,
              meta: {
                mode: "live",
                provider: typeof ev.provider === "string" ? ev.provider : undefined,
                model: typeof ev.model === "string" ? ev.model : undefined,
                ...(pw ? { pageWindow: { page: pw.page, chars: pw.chars, truncated: pw.truncated } } : {}),
                ...(gp && gp.length > 1 ? { groundPages: gp } : {}),
                ...(pagesOmitted ? { pagesOmitted } : {}),
              },
            });
          } else if (ev?.type === "delta" && typeof ev.text === "string") {
            appendPending(ev.text);
          } else if (ev?.type === "done") {
            sawDone = true;
            const meta = ev.meta;
            doneAuditRaw =
              meta && typeof meta === "object" && !Array.isArray(meta)
                ? (meta as Record<string, unknown>).audit
                : undefined;
          } else if (ev?.type === "error" && typeof ev.message === "string") {
            sawError = ev.message;
          }
        }
      }
      if (sawError) {
        updatePending({ mode: "error", errorText: sawError ?? "上游流中断" });
      } else if (sawDone) {
        updatePending((cur) => {
          const { answer, entries } = splitStructuredPatch(cur.text, allowed, seedBefore);
          // 无 meta.audit / 坏形 → 不可用，不用流式预览凑一版全绿。
          const audit = coerceClewAnswerAudit(doneAuditRaw);
          return {
            mode: "live",
            text: answer,
            audit,
            auditPreview: false,
            meta: { ...(cur.meta ?? { mode: "live" }), mode: "live", audit },
            ...(entries.length ? { patchEntries: entries } : {}),
          };
        });
      } else {
        updatePending({ mode: "error", errorText: "流提前结束（未收到 done）——已收文本保留，可重试" });
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        updatePending((cur) => ({
          mode: "error",
          errorText: cur.text ? "已停止——已收文本保留，可重试" : "已停止（未收到文本）——可重试",
        }));
      } else {
        updatePending({ mode: "error", errorText: "网络不可达——原问已保留，可重试" });
      }
    } finally {
      abortRef.current = null;
      setSending(false);
      scrollThread();
    }
  }

  function send(text: string) {
    const q = text.trim();
    if (!q || sending) return;
    /** T68 D：所选档探针已判不可用 → 不发（置灰同源；探针未回不拦，服务端把关）。 */
    if (!tierAvailable(tier)) return;
    /**
     * T33 D：stub 气泡附 muted 行动链——对页（有书+页）/ 去学习环 / 去核页（T31 回落链）。
     * 练/核链的 return payload 在发送时快照：气泡是历史，点旧气泡回「当时问的」上下文，
     * 不随后续上下文切换漂移；无页/无书时 stubReply 文案仍走「先开章页/卡」，不伪造行动。
     * T51 A：练/核链吃发送时 progress* 池（fail-closed 缺省 0）——池===0 该侧降 PlainLink
     * 纯文「暂无原子/暂无待核」（不可点、不写 return）；>0 保持 ActionLink + return 快照。
     * T66 D：行动链同样挂在 live 答下；问与上下文一并快照进气泡（带走/重试用）。
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
    const ctx = pickSuggestContext(clew);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "assistant", mode: "pending", text: "", links, question: q, ctx, tier },
    ]);
    setDraft("");
    scrollThread();
    void run(q, ctx, stubReply(clew), tier);
  }

  /** T66 E：失败条重试——复用快照的问与上下文（不是当前页），气泡回 pending 再跑一次。 */
  function retry(index: number) {
    if (sending) return;
    const m = messages[index];
    if (!m || m.role !== "assistant" || m.mode !== "error") return;
    setMessages((prev) =>
      prev.map((x, i): Msg => {
        if (i !== index || x.role !== "assistant") return x;
        return { ...x, mode: "pending", errorText: undefined, patchEntries: undefined, audit: undefined, auditPreview: false };
      }),
    );
    void run(m.question, m.ctx, stubReply(clew), m.tier ?? tier);
  }

  // T75：bookHref/pageHref/studyHref/reviewHref 四链推导整体迁 clew-pane-helpers.clewCtaHrefs
  //（progress* 优先 / 卡作用域 / 本页书级 / 书级回落与 mode 默认档零改），此处只解构。
  const { bookHref, pageHref, studyHref, reviewHref } = clewCtaHrefs(clew);

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

  /** T66 G：头部短标——探测中 | live · provider | stub · 未接模型（探针失败即 stub，fail-closed）。 */
  const capLabel =
    cap == null ? "探测模型…" : cap.mode === "live" ? `live · ${cap.provider ?? "模型"}` : "stub · 未接模型";
  /** T66 G：空态首句按探针说真话——已接只读小能力 / 还没接模型；两种空态（有书/无书）共用。 */
  const capIntro = cap?.mode === "live" ? "已接小能力模型（只读 · 不写 seed）。" : "还没接模型（stub）。";

  return (
    <aside
      className="flex h-full w-[400px] shrink-0 flex-col border-l border-line bg-card"
      aria-label="Clew 问答面板"
    >
      <header className="border-b border-line px-4 pb-2 pt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Clew</h2>
          <span className="text-xs text-muted">
            {capLabel}
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
          <span className="ml-auto text-[11px] text-muted">
            本地上下文 · {cap?.mode === "live" ? "小能力只读" : "未接模型"}
          </span>
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
                      {capIntro}当前书《{clew.book.title}
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
                      {capIntro}书库为空——请带着页码对照的问题发问；先按这条路径走通：
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
                  /* T66 D/E/F：助手气泡四态——live（模型只读答，pre-wrap 保留分点）| stub（缺钥诚实占位）|
                     pending（在途 aria-busy）| error（status-error 左线 + 可见短讯 + 重试：保留原问，不装成功）。
                     live 答面次级复制（纯文本 / 补丁形）只写剪贴板——永不 setAtomDraft / PATCH。
                     mono 短标区分 live·provider / stub / 失败；朱砂仍只做动作与状态强调。 */
                  <div
                    key={i}
                    aria-busy={m.mode === "pending" || undefined}
                    className={`border-l-2 pl-3 text-sm leading-6 text-foreground/90 ${
                      m.mode === "error" ? "border-status-error/60" : "border-cinnabar/40"
                    }`}
                  >
                    <span
                      className={`mono mr-1 text-[10px] ${m.mode === "error" ? "text-status-error" : "text-muted"}`}
                    >
                      {m.mode === "live"
                        ? `live · ${m.tier ?? "fast"} · ${m.meta?.provider ?? "模型"}`
                        : m.mode === "pending"
                          ? "…"
                          : m.mode === "error"
                            ? "失败"
                            : "stub"}
                    </span>
                    {m.mode === "pending" ? (
                      <span className="whitespace-pre-wrap text-muted">
                        {m.text ? (
                          <AuditedProse text={m.text} audit={m.audit} bookId={m.ctx.book?.id} preview />
                        ) : (
                          "正在问模型（只读）…"
                        )}
                      </span>
                    ) : m.mode === "error" ? (
                      <span>
                        {/* T67 B：中断/停止时已收的部分文本如实保留（live 前缀的流式草稿），不装成功答。 */}
                        {m.text ? <span className="whitespace-pre-wrap">{m.text}</span> : null}
                        <span className="text-muted">
                          {m.text ? " …" : ""}
                          {m.errorText ?? "请求失败"}
                          <button
                            type="button"
                            onClick={() => retry(i)}
                            disabled={sending}
                            className="ml-2 rounded border border-line px-1.5 py-0.5 text-xs text-cinnabar transition-colors hover:border-cinnabar disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                          >
                            重试
                          </button>
                        </span>
                      </span>
                    ) : (
                      <span className={m.mode === "live" ? "whitespace-pre-wrap" : undefined}>
                        <AuditedProse text={m.text} audit={m.audit} bookId={m.ctx.book?.id} />
                      </span>
                    )}
                    {/* T70 E：流式灰预览；live/stub 终态以服务端（stub 为同源纯函数）为准。失败条不装核账。 */}
                    {m.mode === "pending" && m.meta?.pagesOmitted ? (
                      <span className="mt-1 block text-[11px] leading-5 text-muted">
                        另有 {m.meta.pagesOmitted} 页因总字顶未装
                      </span>
                    ) : null}
                    {m.mode === "pending" || m.mode === "live" || m.mode === "stub" ? (
                      <AuditFace
                        audit={m.audit}
                        preview={m.mode === "pending" || m.auditPreview === true}
                        cardAtoms={m.cardAtoms}
                        cardId={m.ctx.card?.id}
                        bookId={m.ctx.book?.id}
                        returnTo={bubbleReturnTo(m)}
                      />
                    ) : null}
                    {/* T66 F/G + T67 E/F + T69 C·E：live 答底——对照小窗来源（>1 页标注同章有界）+
                        「未核」+ 剪贴板带走（纯文本恒有；补丁恒有卡时给；entries 非空=模型建议填空）。
                        T69 D：补丁条目逐条 before→after 一行（before=当前卡 seed 现值，空=（空））——
                        人核面：是「填空」还是「改既有」一眼可比，全文在复制出的补丁 JSON 里。
                        「填入本机草稿（未核）」只认用户点击（mergeAtomDraft 同族 T55），永不静默写。 */}
                    {m.mode === "live" && m.meta ? (
                      <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px] text-muted">
                        <span>
                          {m.meta.pageWindow
                            ? `对照 p.${m.meta.pageWindow.page} 小窗${m.meta.pageWindow.truncated ? "（已截断）" : ""}`
                            : "无页小窗"}
                          {m.meta.groundPages?.length
                            ? ` · 接地 p.${m.meta.groundPages.join("、p.")}（同章有界）`
                            : ""}
                          {m.meta.pagesOmitted ? ` · 另有 ${m.meta.pagesOmitted} 页因总字顶未装` : ""}
                          {" · 未核"}
                          {m.patchEntries?.length ? ` · 补丁建议 ${m.patchEntries.length} 条` : ""}
                        </span>
                        <CopyTextButton
                          text={buildTakeawayText(m.question, m.text, m.ctx, m.meta)}
                          label="复制纯文本"
                          className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                        />
                        {m.ctx.card ? (
                          <CopyTextButton
                            text={buildSuggestPatchText(m.question, m.text, m.ctx, m.meta, m.patchEntries) ?? ""}
                            label={`复制为草稿补丁${m.patchEntries?.length ? `（${m.patchEntries.length} 条）` : ""}`}
                            className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                          />
                        ) : null}
                        {m.ctx.card && m.patchEntries?.length ? (
                          <button
                            type="button"
                            onClick={() => fillDrafts(i, m)}
                            disabled={sending || fillStates[i] != null}
                            title={`只写本机草稿（卡 ${m.ctx.card.id} 的既有原子/字段空位）；不写回 seed、不翻 verified`}
                            className="rounded border border-line px-1.5 py-0.5 text-[11px] text-cinnabar transition-colors hover:border-cinnabar disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                          >
                            填入本机草稿（未核）
                          </button>
                        ) : null}
                        {fillStates[i] === "done" ? (
                          <span className="text-status-ok">已填入 {m.patchEntries?.length ?? 0} 条（未写回 seed）</span>
                        ) : null}
                        {fillStates[i] === "unpersisted" ? (
                          <span role="alert" className="text-status-warn">
                            本浏览器存储不可用——草稿仅本次会话生效
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                    {/* T69 E：补丁建议人核明细——每条一行 before→after（before=seed 现值截显，
                        空=（空）；全文见 title 与「复制为草稿补丁」JSON）。muted mono，不抢答面。 */}
                    {m.mode === "live" && m.patchEntries?.length ? (
                      <span className="mt-1 flex w-full flex-col gap-0.5 text-[11px] leading-5 text-muted">
                        {m.patchEntries.map((e, k) => (
                          <span
                            key={`${e.target}|${e.field}|${k}`}
                            className="mono break-all"
                            title={`${e.target} · ${e.field}：${e.before ?? "（空）"} → ${e.after}`}
                          >
                            {e.target} · {e.field}：
                            {e.before
                              ? `${e.before.slice(0, 48)}${e.before.length > 48 ? "…" : ""} → `
                              : "（空）→ "}
                            {e.after.slice(0, 80)}
                            {e.after.length > 80 ? "…" : ""}
                          </span>
                        ))}
                      </span>
                    ) : null}
                    {/* T33 D：行动链 muted 文字（非实心、非裸 URL）——对页/练/核可点；点练/核前兑现快照 return。
                        T51 A：PlainLink（空池占位）渲染 muted 纯文——无 href 不可点、不写 return。
                        T66：pending 态不挂链（在途噪音）；live/stub/error 都挂（发送时快照）。 */}
                    {m.links?.length && m.mode !== "pending" ? (
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
            {/* T68 D：档位芯片（status.tiers 驱动可用/置灰；选中朱砂 soft，对齐 Changes 筛选芯片
                气质——一种处理一种含义，不引第二品牌色）。上次选择记 sessionStorage 新键
                ariadne.clew.tier.v1（不动任何既有键）。置灰档不可发。 */}
            <div className="mb-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Clew 档位">
              {TIER_IDS.map((id) => {
                const info = cap?.tiers?.find((t) => t.id === id);
                const on = tier === id;
                const usable = tierAvailable(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => usable && pickTier(id)}
                    disabled={!usable}
                    aria-pressed={on}
                    title={
                      usable
                        ? info?.model
                          ? `${info.model}${info.provider ? ` · ${info.provider}` : ""}`
                          : "默认档 fast"
                        : "该档未配置可用钥（服务端 env）——不静默换档"
                    }
                    className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                      on
                        ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                        : usable
                          ? "border-line text-muted hover:border-cinnabar hover:text-cinnabar"
                          : "cursor-not-allowed border-line text-muted opacity-40"
                    }`}
                  >
                    {TIER_LABEL[id]}
                  </button>
                );
              })}
            </div>
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
                disabled={!draft.trim() || sending || !tierAvailable(tier)}
                aria-busy={sending || undefined}
                className="shrink-0 rounded-lg bg-cinnabar px-4 py-2 text-sm text-white transition-opacity disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
              >
                {sending ? "发送中…" : "发送"}
              </button>
              {/* T67 B：在途「停止」次级钮——只中止读流（服务端 cancel 连带上游 abort），无写副作用；
                  停止后气泡转 error 态保留已收文本，可重试。 */}
              {sending ? (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                >
                  停止
                </button>
              ) : null}
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

      {/* T66 G：诚实脚注同源常量（lib/clew-suggest.ts）——不做诊断 · 回答≠已核 · 永不写 seed ·
          页码以印刷页为准 · 小能力只读。禁掌握% / Due。
          T68 F / T69 F：本机今日用量次级行（status.usage 计数 + 本会话增量）——有 byTier 时给
          分档括注（快 a · 推 b · 长 c），无则退回总数形；非云账单 · 非掌握度。 */}
      <p className="border-t border-line px-4 py-2 text-xs text-muted">
        {CLEW_HONESTY_FOOTNOTE}
        {cap?.usageToday != null ? (
          <span className="ml-2 text-[11px]">
            本机今日 {cap.usageToday} 次
            {cap.usageByTier
              ? `（快 ${cap.usageByTier.fast ?? 0} · 推 ${cap.usageByTier.reasoning ?? 0} · 长 ${cap.usageByTier["long-context"] ?? 0}）`
              : ""}
            {" · 非云账单 · 非掌握度"}
          </span>
        ) : null}
      </p>
    </aside>
  );
}
