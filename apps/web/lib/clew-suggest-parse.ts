/**
 * T84 机械抽出：原 lib/clew-suggest.ts 请求体校验分区（ParseResult / JOB_SHAPE_KEYS / SURFACES /
 * idTitle / findJobShapeKey / sanitizeContext / parseSuggestBody）整段迁此——拒 bulk 422 口径 /
 * 白名单投影零改。isPrintedPage 自 clew-suggest-types import（原本分区私有；grounding 双用）。
 * 纯函数；无 fs / 无 process.env / 无 "use client"。
 * 铁合同七条与消费者入口仍在 @/lib/clew-suggest（barrel）。
 */

import {
  CITE_PAGES_MAX,
  QUESTION_MAX_CHARS,
  isPrintedPage,
  type ClewSuggestContext,
  type ClewSuggestRequest,
} from "./clew-suggest-types.ts";

// ---- 请求体校验（拒 bulk / 作业形） ----

export type ParseResult =
  | { ok: true; value: ClewSuggestRequest }
  | { ok: false; status: 400 | 413 | 422; error: string; message: string };

/**
 * 作业形键：出现在 body 顶层或 context 内即 422 拒——哪怕是空数组。
 * 本路只收「一问 + 当前书桌上下文」；整章/多章/全书 parse·extract·ingest 与任何写意图不走这里。
 */
export const JOB_SHAPE_KEYS = [
  "chapters",
  "pages",
  "questions",
  "items",
  "batch",
  "jobs",
  "extract",
  "parse",
  "ingest",
  "cards",
  "blocks",
  "entities",
  "write",
  "apply",
  "patch",
  "verified",
] as const;

const SURFACES = new Set(["desk", "card", "study", "review", "library"]);

function idTitle(v: unknown): { id: string; title: string } | undefined {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id.trim() || typeof o.title !== "string") return undefined;
  return { id: o.id.trim().slice(0, 128), title: o.title.trim().slice(0, 200) };
}

function findJobShapeKey(o: Record<string, unknown>): string | null {
  for (const k of JOB_SHAPE_KEYS) if (k in o) return k;
  return null;
}

/** 白名单投影：未知键一律丢弃；非法值丢弃（不抛）。pageText 只收字符串，截断交给 truncatePageText。 */
export function sanitizeContext(raw: unknown): ClewSuggestContext {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const c = raw as Record<string, unknown>;
  const out: ClewSuggestContext = {};
  const book = idTitle(c.book);
  if (book) out.book = book;
  const chapter = idTitle(c.chapter);
  if (chapter) out.chapter = chapter;
  if (isPrintedPage(c.page)) out.page = c.page;
  if (Array.isArray(c.citePages)) {
    const ps = [...new Set(c.citePages.filter(isPrintedPage))].slice(0, CITE_PAGES_MAX);
    if (ps.length) out.citePages = ps;
  }
  if (typeof c.visibleEntityName === "string" && c.visibleEntityName.trim()) {
    out.visibleEntityName = c.visibleEntityName.trim().slice(0, 80);
  }
  const card = c.card;
  if (card !== null && typeof card === "object" && !Array.isArray(card)) {
    const k = card as Record<string, unknown>;
    if (typeof k.id === "string" && k.id.trim() && typeof k.name_zh === "string") {
      out.card = { id: k.id.trim().slice(0, 128), name_zh: k.name_zh.trim().slice(0, 80) };
    }
  }
  if (typeof c.surface === "string" && SURFACES.has(c.surface)) out.surface = c.surface;
  if (typeof c.pageText === "string" && c.pageText.trim()) out.pageText = c.pageText;
  return out;
}

/**
 * 解析 POST body：对象 + question 字符串（非空、≤ QUESTION_MAX_CHARS）+ 可选 context。
 * 顶层或 context 内含作业形键 → 422 bulk_rejected（永不 bulk）。
 */
export function parseSuggestBody(raw: unknown): ParseResult {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, status: 400, error: "bad_body", message: "请求体须是 JSON 对象" };
  }
  const o = raw as Record<string, unknown>;
  const topJob = findJobShapeKey(o);
  if (topJob) {
    return {
      ok: false,
      status: 422,
      error: "bulk_rejected",
      message: `本路只收单问 + 当前书桌上下文；不接「${topJob}」作业形（整章/多章/写入一律拒）`,
    };
  }
  if (o.context !== undefined && o.context !== null && typeof o.context === "object" && !Array.isArray(o.context)) {
    const ctxJob = findJobShapeKey(o.context as Record<string, unknown>);
    if (ctxJob) {
      return {
        ok: false,
        status: 422,
        error: "bulk_rejected",
        message: `context 内不接「${ctxJob}」作业形；只收书/章/页/卡/表面/citePages`,
      };
    }
  }
  const q = o.question;
  if (typeof q !== "string") {
    return { ok: false, status: 400, error: "missing_question", message: "缺 question（字符串）" };
  }
  const question = q.trim();
  if (!question) {
    return { ok: false, status: 400, error: "empty_question", message: "question 为空" };
  }
  if (question.length > QUESTION_MAX_CHARS) {
    return {
      ok: false,
      status: 413,
      error: "question_too_long",
      message: `question 超过 ${QUESTION_MAX_CHARS} 字`,
    };
  }
  return { ok: true, value: { question, context: sanitizeContext(o.context) } };
}
