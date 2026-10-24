/**
 * T64 A（CLI 孪生）：seed-apply dry-run 纯对照算法——**与 apps/web/lib/seed-apply-dry-run.ts
 * 同一算法的纯 JS 版**（pnpm seed-apply-check 用）——**两处必须同步改**（keep in sync）；
 * 判定口径只有这一份，禁止分叉。
 *
 * dry-run-only 合同（T64，写死）：永不写 entities/blocks/config；永不 verified:true；
 * 永不 auto PATCH；永不 invent 原子（pack 引用缺失 → invalid/missing，不装成功）；
 * 永不「一键写回仓库」。唯一可写产物 = 调用方（CLI）落 data/qa/*.seed-apply-dryrun.json
 * 报告（报告非真源）。零 fs——文件装载由 CLI 负责。
 */

export const DRY_RUN_STATUSES = [
  "would-change",
  "already-matches",
  "missing-card",
  "missing-seed-file",
  "invalid",
];

const DRY_RUN_FIELDS = new Set(["prompt", "answer", "citeQuote", "value"]);

function trimOrNull(s) {
  return typeof s === "string" && s.trim().length > 0 ? s : null;
}

function emptyCounts() {
  const c = {};
  for (const s of DRY_RUN_STATUSES) c[s] = 0;
  return c;
}

/**
 * 只读对照 pack/entries ↔ 现有 entities，逐条分列五种 status（与 TS 版逐行同义）。
 * 比较口径与 T62 pushIfChanged 同源（trim 比较）。零写盘。
 */
export function buildSeedApplyDryRun(input) {
  const packCards = input.pack
    ? Array.isArray(input.pack.cards)
      ? input.pack.cards
      : []
    : Array.isArray(input.entries)
      ? input.entries
      : [];

  const missingChapters = new Set(input.missingSeedChapters ?? []);
  const entries = [];
  const counts = emptyCounts();

  for (const doc of packCards) {
    const cardId = typeof doc?.cardId === "string" ? doc.cardId : "";
    const chapterId = typeof doc?.chapterId === "string" ? doc.chapterId : undefined;
    const docEntries = Array.isArray(doc?.entries) ? doc.entries : [];

    for (const e of docEntries) {
      const target = typeof e?.target === "string" ? e.target : String(e?.target ?? "");
      const field = typeof e?.field === "string" ? e.field : String(e?.field ?? "");
      const after = trimOrNull(e?.after);
      const base = {
        cardId: cardId || "（pack 卡缺 cardId）",
        ...(chapterId ? { chapterId } : {}),
        target,
        field,
        before: null,
        after: typeof e?.after === "string" ? e.after : "",
      };
      const push = (status, extra) => {
        entries.push({ ...base, status, ...extra });
        counts[status]++;
      };

      // 坏条目防御：字段名非法 / after 非字符串 / 卡缺 cardId → invalid，不装成功。
      if (!cardId || !DRY_RUN_FIELDS.has(field) || after == null) {
        push("invalid");
        continue;
      }
      // 声明章的 seed 文件缺失 → 整卡条目 missing-seed-file（对照真源不存在）。
      if (chapterId && missingChapters.has(chapterId)) {
        push("missing-seed-file");
        continue;
      }
      const card = input.cardsById?.[cardId] ?? input.loadCard?.(cardId, chapterId);
      if (card == null) {
        push("missing-card");
        continue;
      }

      let seedVal;
      if (target.startsWith("atom:")) {
        const atomId = target.slice("atom:".length);
        const atom = (card.atoms ?? []).find((a) => a?.id === atomId);
        if (!atom) {
          push("invalid"); // pack 引用的原子在当前 seed 不存在（可能已被重抽/改名）——不 invent。
          continue;
        }
        // 原子目标只对应 prompt/answer/citeQuote（T61 编辑口径）——value 属字段目标，非法组合。
        if (field === "value") {
          push("invalid");
          continue;
        }
        // citeQuote 的 seed 值取 cite.quote——seed 无 cite → null（before=null 即「新增 quote 候选」）。
        seedVal =
          field === "citeQuote" ? (atom.cite?.quote ?? null) : (atom[field] ?? null);
      } else if (target.startsWith("field:")) {
        const idx = Number(target.slice("field:".length));
        const f = Number.isInteger(idx) && idx >= 0 ? (card.fields ?? [])[idx] : undefined;
        // 字段目标只对应 value（T61 编辑口径）——field 名不是 value / 序号越界 → invalid。
        if (!f || field !== "value") {
          push("invalid");
          continue;
        }
        seedVal = f.value ?? null;
      } else {
        push("invalid");
        continue;
      }

      const seedT = (seedVal ?? "").trim();
      if (seedT === after.trim()) {
        push("already-matches", { before: seedVal });
      } else {
        // pack 记忆 before ≠ 当前 seed 现值 → 导出后 seed 又被人改过，人核留意（不改分列）。
        const packBefore = typeof e?.before === "string" ? e.before : null;
        const sameText = (a, b) =>
          a == null || b == null ? a == null && b == null : a.trim() === b.trim();
        const drift = !sameText(packBefore, seedVal);
        push("would-change", { before: seedVal, ...(drift ? { drift: true } : {}) });
      }
    }
  }

  return {
    schema: "ariadne.seed-apply-dryrun.v1",
    generatedAt: new Date().toISOString(),
    packCardCount: packCards.length,
    counts,
    entries,
    note:
      "dry-run 对照报告 · 非种子真源 · 浏览器/CLI 都不会写回仓库 · 不回写 entities/blocks · 不含 verified 翻改 · dry-run ≠ 已落盘",
  };
}
