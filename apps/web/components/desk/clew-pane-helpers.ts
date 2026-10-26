import type { ClewContextData } from "@/components/desk/DeskContext";
import { saveReturn } from "@/lib/return-stack";
import type {
  ClewAnswerMeta,
  ClewSuggestContext,
  SuggestPatchEntry,
} from "@/lib/clew-suggest";
import type {
  ClewAnswerAudit,
  ClewAuditBasis,
  ClewAuditUnavailable,
  ClewCardAtomRef,
} from "@/lib/clew-answer-audit";

/**
 * T75 机械抽出：原 ClewPane.tsx 模块层类型/常量/纯函数（TierInfo…bubbleReturnTo +
 * 编排器 href 推导）整段迁此——函数体零改，仅换文件并加 export；
 * ClewPane / ClewAuditView / ClewChangesPanel / ClewQueuePanel 共用同一份，
 * 不出现第二套上下文投影或 return payload 口径。
 */

/** T68 D：/api/clew/status 的档位行（不含钥）。 */
export type TierInfo = { id: string; label: string; zh?: string; available: boolean; provider?: string | null; model?: string | null };

/** T33 D：stub 气泡内的 muted 行动链（对页/练/核）。returnTo 有值时点前写 return 短链。 */
export type ActionLink = { label: string; href: string; returnTo?: { href: string; label: string } };
/**
 * T51 A：空池占位行——发送时对侧池 ===0 的 muted 纯文（无 href 不可点、不写 return），
 * 与可点链同位渲染占住「去学习环/去核页」的位置，不装能进空环。
 */
export type PlainLink = { label: string; plain: true };
/**
 * T66 D / T67 B：助手气泡四态——live（模型只读答，流式逐 chunk 到达）| stub（缺钥/未接模型
 * 诚实占位，保留 stubReply 族）| pending（在途，禁双发）| error（上游/网络/中断：保留已收文本
 * 与原问可重试，**不**装成功答）。
 * question/ctx 在发送时快照：带走文本与重试都吃当时的问与书桌上下文，不随后续切页漂移。
 * T67 E/F：patchEntries = 模型结构化建议（splitStructuredPatch 白名单过滤后，仅既有 target）；
 * 永不出现在发送回调里自动写草稿——「填入本机草稿」只认用户点击。
 */
export type AssistantMsg = {
  role: "assistant";
  text: string;
  links?: (ActionLink | PlainLink)[];
  mode: "live" | "stub" | "pending" | "error";
  question: string;
  ctx: ClewSuggestContext;
  meta?: ClewAnswerMeta;
  errorText?: string;
  patchEntries?: SuggestPatchEntry[];
  /** T68 D：发送时快照的档（重试复用；live 短标点名）。 */
  tier?: string;
  /**
   * T70 E：核账。流式中 auditPreview=true（灰，纯函数预览）；done 后以服务端 meta.audit 覆盖。
   * error 形 = 核账不可用，不出芯片。
   */
  audit?: ClewAnswerAudit | ClewAuditUnavailable;
  auditPreview?: boolean;
  /** 流式预览 basis（meta 事件带来；与服务端审计同源）。 */
  auditBasis?: ClewAuditBasis;
  /** 当前卡原子 id + cite 页（服务端已 load 的只读投影）。 */
  cardAtoms?: ClewCardAtomRef[];
};
export type Msg = { role: "user"; text: string } | AssistantMsg | { role: "note"; text: string };
export type Tab = "chat" | "changes" | "queue";
/** T66 G / T68 B：/api/clew/status 探针结果（不调模型、不含钥）；null = 探测中。 */
export type Capability = {
  mode: "live" | "stub";
  provider?: string;
  model?: string;
  /** T68：三档可用性（芯片置灰用）+ 本机今日用量（底栏行）。 */
  tiers?: TierInfo[];
  usageToday?: number;
  /** T69 F：本机今日用量分档计数（status.usage.byTier；缺 → 底栏退回总数形）。 */
  usageByTier?: Record<string, number>;
};
/** T68 D：上次档选择的 sessionStorage 新键（不动 study/heye/atom-draft 任何既有键）。 */
export const CLEW_TIER_KEY = "ariadne.clew.tier.v1";
export const TIER_IDS = ["fast", "reasoning", "long-context"] as const;
export const TIER_LABEL: Record<string, string> = {
  fast: "Fast",
  reasoning: "Reasoning",
  "long-context": "Long-context",
};

/** T33 D：点气泡行动链时兑现发送时快照的 return（无快照 = 无可回上下文，不写）。 */
export function fireLinkReturn(l: ActionLink) {
  if (l.returnTo) saveReturn({ ...l.returnTo, at: Date.now() });
}

export const SURFACE_ZH: Record<string, string> = {
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
export function buildSuggestions(clew: ClewContextData): string[] {
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
export function stubReply(clew: ClewContextData): string {
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
export type Act = {
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
export function clewReturnPayload(clew: ClewContextData): { href: string; label: string } | null {
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
 * T66 D：发给 /api/clew/suggest 的书桌上下文——只投影书/章/页/cite 页/可见实体/卡名/表面
 * （白名单；**不**带 progress* 池、不带任何本机 store、不带 pageText——页 OCR 小窗由服务端自取）。
 */
export function pickSuggestContext(clew: ClewContextData): ClewSuggestContext {
  return {
    ...(clew.book ? { book: clew.book } : {}),
    ...(clew.chapter ? { chapter: clew.chapter } : {}),
    ...(clew.page != null ? { page: clew.page } : {}),
    ...(clew.citePages.length ? { citePages: clew.citePages } : {}),
    ...(clew.visibleEntityName ? { visibleEntityName: clew.visibleEntityName } : {}),
    ...(clew.card ? { card: clew.card } : {}),
    ...(clew.surface ? { surface: clew.surface } : {}),
  };
}

export function parseCardAtoms(raw: unknown): ClewCardAtomRef[] {
  if (!Array.isArray(raw)) return [];
  const out: ClewCardAtomRef[] = [];
  for (const item of raw) {
    if (item === null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.id !== "string" || !o.id.trim()) continue;
    const cite = o.citePage;
    out.push({
      id: o.id,
      citePage: typeof cite === "number" && Number.isInteger(cite) && cite > 0 ? cite : null,
    });
  }
  return out;
}

/** 气泡上已快照的 return（练/核链）。没有就不写——不另造回程。 */
export function bubbleReturnTo(m: AssistantMsg): { href: string; label: string } | undefined {
  for (const l of m.links ?? []) {
    if ("plain" in l) continue;
    if (l.returnTo) return l.returnTo;
  }
  return undefined;
}

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
 * T75 机械抽出：原 ClewPane.tsx 编排器内同一推导整段迁此（纯函数，零改行为）。
 */
export function clewCtaHrefs(clew: ClewContextData): {
  bookHref: string;
  pageHref: string;
  studyHref: string;
  reviewHref: string;
} {
  const bookHref = clew.book ? `/desk?book=${encodeURIComponent(clew.book.id)}` : "/desk";
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
  return { bookHref, pageHref, studyHref, reviewHref };
}
