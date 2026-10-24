/**
 * T62 C：草稿单独可移植（客户端专用）——与 lib/progress-port 的 study/heye 包**分离**。
 * 合同（硬）：
 * - 只读写 ATOM_DRAFT_STORE_KEY（ariadne.atom-draft.v1），经 lib/atom-draft 的
 *   loadAtomDraftStore / saveWholeAtomDraftStore 整库口进出。
 * - 永不修改 progress-port.ts / ProgressPayload 把 draft 并进 study/heye 包；
 *   draft-port ≠ progress-port（文案必须分列）。
 * - 永不 verified / auto PATCH / Clew 真写 / 改名既有 keys（同 lib/atom-draft.ts 五禁）。
 * 本模块不 import 任何含 fs 的模块（类型 import 编译期擦除），客户端安全。
 */

import {
  loadAtomDraftStore,
  saveWholeAtomDraftStore,
  type AtomDraftStore,
  type DraftEntry,
} from "@/lib/atom-draft";

export const ATOM_DRAFT_PORT_SCHEMA = "ariadne.atom-draft-port.v1";

export type AtomDraftPortDoc = {
  schema: typeof ATOM_DRAFT_PORT_SCHEMA;
  exportedAt: string;
  draft: AtomDraftStore;
};

/** 组导出 payload（draft = 当前本机草稿库快照；SSR/隐私读失败 → 空库，诚实空导出）。 */
export function exportAtomDraftPort(store?: AtomDraftStore): AtomDraftPortDoc {
  return {
    schema: ATOM_DRAFT_PORT_SCHEMA,
    exportedAt: new Date().toISOString(),
    draft: store ?? loadAtomDraftStore(),
  };
}

export type ParsePortResult = { ok: true; doc: AtomDraftPortDoc } | { ok: false; error: string };

/** fail-closed 形状校验：t 须数字；可编辑字段只可是字符串（多余字段忽略，向前兼容）。 */
function isDraftEntry(v: unknown): v is DraftEntry {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.t !== "number" || !Number.isFinite(o.t)) return false;
  for (const k of ["prompt", "answer", "value", "citeQuote"] as const) {
    const x = o[k];
    if (x !== undefined && typeof x !== "string") return false;
  }
  return true;
}

/**
 * 严格解析：JSON 解析失败 / schema 不符 / draft 非对象 / 任一条目形状不合法 → 整包拒收
 * （ok:false + 指名首个坏 key；绝不部分写入）。本机草稿保持原样。
 */
export function parseAtomDraftPort(text: string): ParsePortResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "不是合法 JSON——整包拒收，本机草稿保持原样。" };
  }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "顶层不是对象——整包拒收，本机草稿保持原样。" };
  }
  const o = raw as Record<string, unknown>;
  if (o.schema !== ATOM_DRAFT_PORT_SCHEMA) {
    return {
      ok: false,
      error: `schema 不符（期望 ${ATOM_DRAFT_PORT_SCHEMA}）——不是本机草稿包，拒收。`,
    };
  }
  if (o.draft === null || typeof o.draft !== "object" || Array.isArray(o.draft)) {
    return { ok: false, error: "draft 字段不是对象——整包拒收，本机草稿保持原样。" };
  }
  for (const [k, v] of Object.entries(o.draft as Record<string, unknown>)) {
    if (!isDraftEntry(v)) {
      return {
        ok: false,
        error: `条目 ${k} 形状不合法（须含数字 t；prompt/answer/value/citeQuote 只可是字符串）——整包拒收。`,
      };
    }
  }
  return {
    ok: true,
    doc: {
      schema: ATOM_DRAFT_PORT_SCHEMA,
      exportedAt: typeof o.exportedAt === "string" ? o.exportedAt : "",
      draft: o.draft as AtomDraftStore,
    },
  };
}

export type ImportPortResult = {
  persisted: boolean;
  mode: "merge" | "replace";
  /** merge：本机原本没有、新写入的条数；replace：整包写入条数。 */
  added: number;
  /** merge：导入条目 t 比本机新、被更新的条数（t 不新不动）。 */
  updated: number;
};

/**
 * 导入（merge|replace）：merge 按条目 t 较新者胜（平局保留本机，稳定不抖动）；
 * replace 整库覆写（破坏性——UI 须二次确认）。隐私模式写失败 → persisted:false，
 * 会话内已生效但不装已持久化。只写 ATOM_DRAFT_STORE_KEY。
 */
export function importAtomDraftPort(doc: AtomDraftPortDoc, mode: "merge" | "replace"): ImportPortResult {
  if (mode === "replace") {
    const r = saveWholeAtomDraftStore({ ...doc.draft });
    return { persisted: r.persisted, mode, added: Object.keys(doc.draft).length, updated: 0 };
  }
  const next: AtomDraftStore = { ...loadAtomDraftStore() };
  let added = 0;
  let updated = 0;
  for (const [k, entry] of Object.entries(doc.draft)) {
    const prev = next[k];
    if (!prev) {
      next[k] = entry;
      added++;
      continue;
    }
    if (entry.t > prev.t) {
      next[k] = entry;
      updated++;
    }
  }
  const r = saveWholeAtomDraftStore(next);
  return { persisted: r.persisted, mode, added, updated };
}
