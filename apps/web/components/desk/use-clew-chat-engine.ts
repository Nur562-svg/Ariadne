"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { ClewContextData } from "@/components/desk/DeskContext";
import {
  splitStructuredPatch,
  type ClewSeedBefore,
  type ClewSuggestContext,
} from "@/lib/clew-suggest";
import { buildAuditBasis, coerceClewAnswerAudit, safeAuditClewAnswer } from "@/lib/clew-answer-audit";
import { atomDraftKey, fieldDraftKey, mergeAtomDraft } from "@/lib/atom-draft";
import {
  CLEW_TIER_KEY,
  clewReturnPayload,
  parseCardAtoms,
  pickSuggestContext,
  stubReply,
  type ActionLink,
  type AssistantMsg,
  type Capability,
  type Msg,
  type PlainLink,
  type TierInfo,
} from "@/components/desk/clew-pane-helpers";

/**
 * T94 机械抽出：原 ClewPane.tsx 编排器内对话引擎整段迁此（hook）——会话态
 * （messages/draft/sending/abortRef/fillStates/cap/tier/threadRef）+ status 探针 +
 * 档位选择/可用性 + 上下文切换 note + fillDrafts/updatePending/appendPending +
 * async run（NDJSON 流式 · 502 bump · 503 no_provider → stub）+ send/retry/stop。
 * 函数体零改，仅从组件体搬入 hook、以参数接 clew 与三条 CTA href（行动链快照同源）。
 * T66–T70 合同原样：客户端永不写 store / 不 PATCH / 不碰钥；填草稿只认用户点击。
 */

/** T94：hook 对外形状（ClewPane 编排器解构消费；Thread/Composer 经 props 间接吃）。 */
export type ClewChatEngine = {
  messages: Msg[];
  draft: string;
  setDraft: (v: string) => void;
  /** T66 E：在途锁——sending 时 Enter / 发送钮 / 建议问都不再发第二问。 */
  sending: boolean;
  fillStates: Record<number, "done" | "unpersisted">;
  cap: Capability | null;
  tier: string;
  threadRef: RefObject<HTMLDivElement | null>;
  pickTier: (id: string) => void;
  tierAvailable: (id: string) => boolean;
  send: (text: string) => void;
  retry: (index: number) => void;
  fillDrafts: (i: number, m: AssistantMsg) => void;
  stop: () => void;
};

export function useClewChatEngine(
  clew: ClewContextData,
  hrefs: { pageHref: string; studyHref: string; reviewHref: string },
): ClewChatEngine {
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
      links.push({ label: `对页 p.${clew.page} →`, href: hrefs.pageHref });
    }
    links.push(
      (clew.progressAtoms?.length ?? 0) > 0
        ? { label: "去学习环 →", href: hrefs.studyHref, returnTo }
        : { label: "暂无原子", plain: true },
      (clew.progressItems?.length ?? 0) > 0
        ? { label: "去核页 →", href: hrefs.reviewHref, returnTo }
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

  /** T67 B：在途「停止」——Composer onStop 接线（原编排器内联 abortRef.current?.abort()）。 */
  function stop() {
    abortRef.current?.abort();
  }

  return {
    messages,
    draft,
    setDraft,
    sending,
    fillStates,
    cap,
    tier,
    threadRef,
    pickTier,
    tierAvailable,
    send,
    retry,
    fillDrafts,
    stop,
  };
}
