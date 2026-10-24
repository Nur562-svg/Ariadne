/**
 * T64 A：seed-apply dry-run 纯对照（只读，零写盘）。输入 = T62 统一补丁包
 * ariadne.atom-draft-pack.v1（或展平 entries），对照真源 = 现有 entities
 * （cardsById / loadCard 由调用方注入——本模块不 import 任何含 fs 的模块，
 * 同 lib/cite-ocr-quality.ts 的纯函数方式；无 "use client"，server / client 均可引）。
 *
 * dry-run-only 合同（T64，写死在此 · 任何改动不得触碰）：
 * 1. 永不写 data/cards/*.entities.json / data/chapters/* / config/*——本模块零 fs；
 *    唯一可写产物是 CLI 侧 data/qa/*.seed-apply-dryrun.json 报告（报告非真源）。
 * 2. 永不 verified:true——对照结果不翻 verified，报告也不含 verified 翻改指令；
 *    人核后由人自行改 seed / 开 PR。
 * 3. 永不 auto PATCH entities / blocks——本函数只分类，不生成任何可执行写操作。
 * 4. 永不 invent 原子——pack 引用的原子在 seed 缺失 → invalid / missing，不装成功。
 * 5. 永不「一键写回仓库」——没有也不允许出现 apply / write 模式。
 *
 * 字段口径与 buildSeedApplyGuide（T62）完全同源：target = `atom:<atomId>` |
 * `field:<N>`；field = prompt | answer | citeQuote | value；before/after 均为文本。
 * 孪生实现：scripts/lib/seed-apply-dry-run.mjs（pnpm seed-apply-check 用，纯 JS
 * 同算法）——**两处必须同步改**（keep in sync）；判定口径只有这一份，禁止分叉。
 */

/** dry-run 分列结果（五种互斥；禁止合成「应用成功率%」——分列即诚实）。 */
export type SeedApplyDryRunStatus =
  | "would-change" // seed 现值 ≠ 草稿值 → 人核后改 seed 才会变
  | "already-matches" // seed 现值已 === 草稿值 → 无需再改（可能已人工落盘）
  | "missing-card" // 章文件在、卡不在（卡可能已被重抽/删除）
  | "missing-seed-file" // data/cards/<chapterId>.entities.json 缺失
  | "invalid"; // 条目形状坏 / target 解析不了 / 引用的原子·字段在当前 seed 不存在

/** 与打分相关的最小原子/字段形状（结构兼容 lib/entities；不 import 含 fs 的模块）。 */
export type DryRunCardLike = {
  id?: string;
  atoms?: { id?: string; prompt?: string; answer?: string; cite?: { quote?: string } | null }[];
  fields?: { value?: string }[];
};

/** pack 内单条补丁（与 T62 DraftPatchEntry 同形状；宽容 unknown——坏条目 → invalid）。 */
export type DryRunPackEntry = {
  target?: unknown;
  field?: unknown;
  before?: unknown;
  after?: unknown;
};

/** pack 内单卡文档（与 T62 AtomDraftPatchDoc 同形状、宽容解析）。 */
export type DryRunPackCard = {
  cardId?: unknown;
  chapterId?: unknown;
  entries?: unknown;
};

export type SeedApplyDryRunEntry = {
  cardId: string;
  chapterId?: string;
  /** `atom:<atomId>` | `field:<N>`（原样自 pack）。 */
  target: string;
  field: string;
  /** **当前 seed 现值**（不是 pack 记忆的 before；null = seed 无此文本——新增候选）。 */
  before: string | null;
  /** pack 草稿值（人核后欲写入 seed 的文本）。 */
  after: string;
  status: SeedApplyDryRunStatus;
  /** seed 现值 ≠ pack 记忆 before（导出后 seed 又被人改过）——人核提示，不改分列。 */
  drift?: boolean;
};

export type SeedApplyDryRunCounts = Record<SeedApplyDryRunStatus, number>;

export type SeedApplyDryRunReport = {
  schema: "ariadne.seed-apply-dryrun.v1";
  generatedAt: string;
  /** pack 覆盖的卡数（含无条目卡按 0 计不影响——只数 pack.cards 长度）。 */
  packCardCount: number;
  counts: SeedApplyDryRunCounts;
  entries: SeedApplyDryRunEntry[];
  note: string;
};

export type SeedApplyDryRunInput = {
  /** T62 统一补丁包（ariadne.atom-draft-pack.v1 解析后的对象；pack 与 entries 都给时以 pack 为准）。 */
  pack?: { cards?: unknown } | null;
  /** 展平卡文档（与 pack.cards 同形状；无 pack 时用）。 */
  entries?: DryRunPackCard[];
  /** 卡索引（只读；优先于 loadCard）。 */
  cardsById?: Record<string, DryRunCardLike | undefined | null>;
  /** 按卡 id 只读取卡（cardsById 未命中时回落；返回空 = 没找到）。带 pack 声明的
   * chapterId——调用方可实现「只在该章文件内解析，不跨章代找」（guide 指向该章文件）。 */
  loadCard?: (cardId: string, chapterId?: string) => DryRunCardLike | null | undefined;
  /** 这些章的 data/cards/<ch>.entities.json 缺失（CLI 实测后传入；纯函数自己不读盘）。 */
  missingSeedChapters?: ReadonlySet<string> | string[];
};

const DRY_RUN_FIELDS = new Set(["prompt", "answer", "citeQuote", "value"]);

function trimOrNull(s: unknown): string | null {
  return typeof s === "string" && s.trim().length > 0 ? s : null;
}

function emptyCounts(): SeedApplyDryRunCounts {
  return {
    "would-change": 0,
    "already-matches": 0,
    "missing-card": 0,
    "missing-seed-file": 0,
    invalid: 0,
  };
}

/**
 * 只读对照：pack/entries ↔ 现有 entities，逐条分列五种 status。零写盘、零网络、
 * 零 verified 翻改。比较口径与 T62 pushIfChanged 同源（trim 比较；空草稿字段不发）。
 */
export function buildSeedApplyDryRun(input: SeedApplyDryRunInput): SeedApplyDryRunReport {
  const packCards: DryRunPackCard[] = input.pack
    ? Array.isArray(input.pack.cards)
      ? (input.pack.cards as DryRunPackCard[])
      : []
    : Array.isArray(input.entries)
      ? input.entries
      : [];

  const missingChapters =
    input.missingSeedChapters instanceof Set
      ? input.missingSeedChapters
      : new Set<string>(input.missingSeedChapters ?? []);

  const entries: SeedApplyDryRunEntry[] = [];
  const counts = emptyCounts();

  for (const doc of packCards) {
    const cardId = typeof doc?.cardId === "string" ? doc.cardId : "";
    const chapterId = typeof doc?.chapterId === "string" ? doc.chapterId : undefined;
    const docEntries = Array.isArray(doc?.entries) ? (doc.entries as DryRunPackEntry[]) : [];

    for (const e of docEntries) {
      const target = typeof e?.target === "string" ? e.target : String(e?.target ?? "");
      const field = typeof e?.field === "string" ? e.field : String(e?.field ?? "");
      const after = trimOrNull(e?.after);
      const base: Omit<SeedApplyDryRunEntry, "status"> = {
        cardId: cardId || "（pack 卡缺 cardId）",
        ...(chapterId ? { chapterId } : {}),
        target,
        field,
        before: null,
        after: typeof e?.after === "string" ? e.after : "",
      };
      const push = (status: SeedApplyDryRunStatus, extra?: Partial<SeedApplyDryRunEntry>) => {
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

      // 解析 target（与 buildSeedApplyGuide 的 GUIDE_FIELD_LOC 同口径定位）。
      let seedVal: string | null;
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
          field === "citeQuote"
            ? (atom.cite?.quote ?? null)
            : ((atom[field as "prompt" | "answer"] as string | undefined) ?? null);
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
      if (seedT === (after as string).trim()) {
        push("already-matches", { before: seedVal });
      } else {
        // pack 记忆 before ≠ 当前 seed 现值 → 导出后 seed 又被人改过，人核留意（不改分列）。
        const packBefore = typeof e?.before === "string" ? e.before : null;
        const sameText = (a: string | null, b: string | null) =>
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
