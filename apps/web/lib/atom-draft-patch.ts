/**
 * T83 机械抽出：原 lib/atom-draft.ts patch 分区（剪贴板 JSON patch 导出 · T62 A 跨卡补丁包 +
 * 收件箱摘要 · T62 B 人核落盘清单 · T67 G 补丁粘贴解析·校验·应用）整段迁此——行为零改。
 * human-apply-only：只生成文档 / 只写本机草稿键，永不自动落盘 seed。
 * pushIfChanged 随 patch 迁此，nonEmptyDraft 自 atom-draft-overlay import（同一口径不分叉）。
 * 五禁合同与消费者入口仍在 @/lib/atom-draft（barrel）：消费者一律从 barrel import。
 */

import type { EntityCard } from "@/lib/entities";
import {
  atomDraftKey,
  fieldDraftKey,
  mergeAtomDraft,
  type AtomDraftStore,
  type DraftEntry,
} from "./atom-draft-store.ts";
import { cardDraftCount, listIncompleteDraftTargets, nonEmptyDraft } from "./atom-draft-overlay.ts";

// ---- 剪贴板 JSON patch 导出（只生成字符串，不碰任何写文件 API） ----

/** 一处草稿字段的 before/after（人核后自行改 seed；before 永远是 seed 原文）。 */
export type DraftPatchEntry = {
  target: string;
  field: "prompt" | "answer" | "citeQuote" | "value";
  before: string | null;
  after: string;
};

export type AtomDraftPatchDoc = {
  schema: "ariadne.atom-draft-patch.v1";
  cardId: string;
  chapterId?: string;
  note: string;
  entries: DraftPatchEntry[];
};

/** 只发真改动的字段（trim 比较：草稿 === seed 的字段不发，空草稿字段不发）。 */
function pushIfChanged(
  entries: DraftPatchEntry[],
  target: string,
  field: DraftPatchEntry["field"],
  seed: string | null,
  draft: string | undefined,
) {
  if (!nonEmptyDraft(draft)) return;
  const d = draft as string;
  if (seed != null && d.trim() === seed.trim()) return;
  entries.push({ target, field, before: seed, after: d });
}

/**
 * 组可读 JSON patch 文档——给人核后手动改 seed / 开 PR 用；不是 git apply 格式，也永远
 * 不会被本应用自动执行。只发真改动的字段（草稿 === seed 的 no-op 不发）；空草稿 →
 * entries 为空数组（调用方诚实「无草稿可导出」）。永不包含 verified 翻改指令。
 */
export function buildAtomDraftPatchDoc(card: EntityCard, store: AtomDraftStore): AtomDraftPatchDoc {
  const doc: AtomDraftPatchDoc = {
    schema: "ariadne.atom-draft-patch.v1",
    cardId: card.id,
    ...(card.chapterId ? { chapterId: card.chapterId } : {}),
    note: "本机草稿导出 · 人核后自行改 seed / 开 PR · 本浏览器不会写回仓库 · 不含 verified 翻改",
    entries: [],
  };
  for (const a of card.atoms) {
    const entry = store[atomDraftKey(card.id, a.id)];
    if (!entry) continue;
    pushIfChanged(doc.entries, `atom:${a.id}`, "prompt", a.prompt, entry.prompt);
    pushIfChanged(doc.entries, `atom:${a.id}`, "answer", a.answer, entry.answer);
    // citeQuote 的 before 取 seed cite 原文；seed 无 cite → null（表示「新增 quote」候选）。
    pushIfChanged(doc.entries, `atom:${a.id}`, "citeQuote", a.cite?.quote ?? null, entry.citeQuote);
  }
  card.fields.forEach((f, i) => {
    const entry = store[fieldDraftKey(card.id, i)];
    if (!entry) return;
    pushIfChanged(doc.entries, `field:${i}`, "value", f.value, entry.value);
  });
  return doc;
}

/** patch 文档的 pretty JSON 字符串（剪贴板导出用）。 */
export function buildAtomDraftPatch(card: EntityCard, store: AtomDraftStore): string {
  return JSON.stringify(buildAtomDraftPatchDoc(card, store), null, 2);
}

// ---- T62 A：跨卡统一补丁包 + 收件箱索引（human-apply-only：只生成文档，永不自动落盘） ----

/** 统一补丁包：多卡真改动一次带走（cards[] 复用 AtomDraftPatchDoc；空包诚实 entries=[]）。 */
export type AtomDraftPackDoc = {
  schema: "ariadne.atom-draft-pack.v1";
  exportedAt: string;
  note: string;
  cards: AtomDraftPatchDoc[];
};

/** pack 的 pretty JSON 字符串（剪贴板/下载导出用）。 */
export function buildAtomDraftPack(cards: EntityCard[], store: AtomDraftStore): AtomDraftPackDoc {
  const out: AtomDraftPatchDoc[] = [];
  for (const c of cards) {
    const doc = buildAtomDraftPatchDoc(c, store);
    if (doc.entries.length > 0) out.push(doc); // 跳过无真改动的卡（空转草稿不发）
  }
  return {
    schema: "ariadne.atom-draft-pack.v1",
    exportedAt: new Date().toISOString(),
    note: "本机草稿统一补丁包 · 人核后自行改 seed / 开 PR · 本浏览器不会写回仓库 · 不含 verified 翻改",
    cards: out,
  };
}

/** 收件箱行摘要：每张**有草稿**的卡一条（draftCount>0 才入列；与 E 的 seed 口径 incomplete 摘要分列）。 */
export type CardDraftSummary = {
  cardId: string;
  nameZh?: string;
  chapterId?: string;
  /** 本机草稿条目数（含与 seed 无差异的空转条目——显示与清账口径）。 */
  draftCount: number;
  /** 真改动字段条数（= patch entries；补丁包只含这些）。 */
  realEntryCount: number;
  /** seed 口径待补（空 prompt/answer）且尚无草稿的原子数（T55 incompleteAtoms 同口径）。 */
  incompleteNoDraft: number;
};

export function summarizeDraftStore(
  cards: EntityCard[],
  store: AtomDraftStore,
): CardDraftSummary[] {
  const out: CardDraftSummary[] = [];
  for (const c of cards) {
    const draftCount = cardDraftCount(store, c.id);
    if (draftCount === 0) continue;
    out.push({
      cardId: c.id,
      nameZh: c.name_zh,
      chapterId: c.chapterId,
      draftCount,
      realEntryCount: buildAtomDraftPatchDoc(c, store).entries.length,
      incompleteNoDraft: listIncompleteDraftTargets(c, store).filter((t) => !t.hasDraft).length,
    });
  }
  return out;
}

// ---- T62 B：人核落盘清单（markdown 文本；不是 git apply，不触任何写文件 API） ----

/** 补丁字段 → seed 内定位说明（人核时按此找位置；不臆造 per-card 文件路径）。 */
const GUIDE_FIELD_LOC: Record<DraftPatchEntry["field"], string> = {
  prompt: "atoms[].prompt",
  answer: "atoms[].answer",
  citeQuote: "atoms[].cite.quote（该原子的 cite.quote）",
  value: "fields[N].value（N = 卡内字段序）",
};

function guideOneLine(s: string): string {
  return s.replace(/\r?\n/g, " ⏎ ");
}

/**
 * 人核落盘 markdown 清单：每卡 seedPath = data/cards/<chapterId>.entities.json
 * （entities 按章存；缺 chapterId → 诚实降级「按卡 id 在 data/cards/*.entities.json 内搜索」），
 * 每条 target · field · before → after。文首硬声明人核后自行改 seed / 开 PR ·
 * 本浏览器不会写回仓库 · 不含 verified 翻改。无真改动 → 只有头部说明 + 「无真改动条目」。
 */
export function buildSeedApplyGuide(cards: EntityCard[], store: AtomDraftStore): string {
  const lines: string[] = [
    "# Ariadne 草稿人核落盘清单",
    "",
    "> 人核后自行改 seed / 开 PR · 本浏览器不会写回仓库 · 不含 verified 翻改。",
    "> 本清单不是 git apply；entities 按章存于 data/cards/<chapterId>.entities.json。",
    "> 草稿 ≠ seed 已核 · ≠ heye 本机已对 · ≠ study 练分；核对无误再改。",
    "",
  ];
  let total = 0;
  for (const c of cards) {
    const doc = buildAtomDraftPatchDoc(c, store);
    if (doc.entries.length === 0) continue;
    total += doc.entries.length;
    lines.push(`## ${c.name_zh}（${c.id}）`);
    lines.push("");
    lines.push(
      c.chapterId
        ? `- seedPath: \`data/cards/${c.chapterId}.entities.json\`（按章存，卡 ${c.id} 在其 cards 数组内）`
        : `- seedPath: （缺 chapterId——请按卡 id \`${c.id}\` 在 data/cards/*.entities.json 内搜索）`,
    );
    for (const e of doc.entries) {
      lines.push("");
      lines.push(`- [ ] \`${e.target}\` · ${e.field} → ${GUIDE_FIELD_LOC[e.field]}`);
      lines.push(`  - before: ${e.before == null ? "（seed 无此文本——新增候选）" : guideOneLine(e.before)}`);
      lines.push(`  - after: ${guideOneLine(e.after)}`);
    }
    lines.push("");
  }
  if (total === 0) lines.push("（无真改动条目——草稿与 seed 无差异，无需落盘。）");
  lines.push(`--- 共 ${total} 条真改动 · 收件箱/补丁包 ≠ 已落盘`);
  return lines.join("\n");
}

// ---- T67 G：Clew 建议补丁粘贴导入（patch.v1 → merge 进 ariadne.atom-draft.v1；人点才写） ----

export type ParsePatchResult =
  | { ok: true; doc: AtomDraftPatchDoc }
  | { ok: false; error: string };

/**
 * 解析粘贴的 ariadne.atom-draft-patch.v1 JSON（Clew「复制为草稿补丁」产物 / 卡详导出同形）。
 * 严格整包校验：非法 JSON / 顶层非对象 / schema 不符 / cardId 缺 / entries 非数组 / 任一条
 * target/field/before/after 形状不对 / 带 verified 等写入意图键 → **整包拒收**（本机草稿
 * 保持原样）。不校验 target 是否存在于某卡——那要卡上下文，归 validateAtomDraftPatch。
 */
export function parseAtomDraftPatch(text: string): ParsePatchResult {
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
  if (o.schema !== "ariadne.atom-draft-patch.v1") {
    return {
      ok: false,
      error: "schema 不符（期望 ariadne.atom-draft-patch.v1；整卡草稿带走走 port.v1，见下方折叠区）——拒收。",
    };
  }
  if (typeof o.cardId !== "string" || !o.cardId.trim()) {
    return { ok: false, error: "缺 cardId——整包拒收，本机草稿保持原样。" };
  }
  if (!Array.isArray(o.entries)) {
    return { ok: false, error: "entries 不是数组——整包拒收，本机草稿保持原样。" };
  }
  const entries: DraftPatchEntry[] = [];
  for (const item of o.entries) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: "entries 含非对象条目——整包拒收，本机草稿保持原样。" };
    }
    const e = item as Record<string, unknown>;
    if ("verified" in e || "write" in e || "apply" in e) {
      return { ok: false, error: "条目带 verified/write/apply 写入意图键——整包拒收（本面板永不翻 verified）。" };
    }
    if (typeof e.target !== "string" || !e.target.trim()) {
      return { ok: false, error: "条目缺 target——整包拒收，本机草稿保持原样。" };
    }
    if (e.field !== "prompt" && e.field !== "answer" && e.field !== "citeQuote" && e.field !== "value") {
      return { ok: false, error: `条目 ${e.target} 的 field 不在 prompt|answer|citeQuote|value——整包拒收。` };
    }
    if (e.before !== null && typeof e.before !== "string") {
      return { ok: false, error: `条目 ${e.target} 的 before 须为 string|null——整包拒收。` };
    }
    if (typeof e.after !== "string" || !e.after.trim()) {
      return { ok: false, error: `条目 ${e.target} 的 after 为空——整包拒收（宁拒不造）。` };
    }
    entries.push({ target: e.target, field: e.field, before: e.before as string | null, after: e.after });
  }
  return {
    ok: true,
    doc: {
      schema: "ariadne.atom-draft-patch.v1",
      cardId: o.cardId.trim(),
      ...(typeof o.chapterId === "string" && o.chapterId.trim() ? { chapterId: o.chapterId.trim() } : {}),
      note: typeof o.note === "string" ? o.note : "",
      entries,
    },
  };
}

/**
 * 对具体卡校验补丁 targets：cardId 必须匹配；每条 target 必须命中**既有**原子 id / 字段下标，
 * 且 field 与 target 类型匹配（atom:→prompt|answer|citeQuote；field:N→value）。任一未知/越界/
 * 错配 → 返回拒收原因（整包拒，一条不并）。纯函数（不触 localStorage），供单测与 UI 共用。
 */
export function validateAtomDraftPatch(
  card: Pick<EntityCard, "id" | "atoms" | "fields">,
  doc: Pick<AtomDraftPatchDoc, "cardId" | "entries">,
): string | null {
  if (doc.cardId !== card.id) {
    return `cardId 不符（补丁 ${doc.cardId} ≠ 本卡 ${card.id}）——整包拒收。`;
  }
  const atomIds = new Set((card.atoms ?? []).map((a) => a.id));
  const fieldCount = (card.fields ?? []).length;
  for (const e of doc.entries) {
    if (e.target.startsWith("atom:")) {
      const id = e.target.slice(5);
      if (!atomIds.has(id)) return `target ${e.target} 不是本卡既有原子 id——整包拒收（永不发明原子）。`;
      if (e.field === "value") return `target ${e.target} 只可 prompt|answer|citeQuote——整包拒收。`;
    } else if (e.target.startsWith("field:")) {
      const idx = Number(e.target.slice(6));
      if (!Number.isInteger(idx) || idx < 0 || idx >= fieldCount) {
        return `target ${e.target} 超出本卡字段下标（0–${Math.max(fieldCount - 1, 0)}）——整包拒收。`;
      }
      if (e.field !== "value") return `target ${e.target} 只可 value——整包拒收。`;
    } else {
      return `target ${e.target} 形如 atom:<id> 或 field:<N>——整包拒收。`;
    }
  }
  return null;
}

export type ApplyPatchResult =
  | { ok: true; merged: number; persisted: boolean }
  | { ok: false; error: string };

/**
 * 应用补丁到本机草稿（mergeAtomDraft 逐条合并；只写 ATOM_DRAFT_STORE_KEY）：先整包
 * validate，任一拒因 → 一条不写；全过 → merge 全部 entries 并返回合并条数。
 * 只由**用户显式点击**触发（DraftInbox 粘贴导入）；永不 entities / verified / 自动调用。
 */
export function applyAtomDraftPatch(card: EntityCard, doc: AtomDraftPatchDoc): ApplyPatchResult {
  const bad = validateAtomDraftPatch(card, doc);
  if (bad != null) return { ok: false, error: bad };
  let persisted = true;
  for (const e of doc.entries) {
    const fields: Partial<Omit<DraftEntry, "t">> = { [e.field]: e.after };
    const r = e.target.startsWith("field:")
      ? mergeAtomDraft(fieldDraftKey(card.id, Number(e.target.slice(6))), fields)
      : mergeAtomDraft(atomDraftKey(card.id, e.target.slice(5)), fields);
    persisted = persisted && r.persisted;
  }
  return { ok: true, merged: doc.entries.length, persisted };
}
