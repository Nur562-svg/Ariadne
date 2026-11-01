import type { Material, MaterialStage } from "@/lib/entities";
import {
  deriveMaterialStage,
  loadBooks,
  loadCards,
  loadChapterPages,
  materialChapterHasBlocks,
  materialChapterHasCards,
} from "@/lib/entities";
import {
  cardCiteMisses,
  scoreChapter,
  type CiteQuality,
} from "@/lib/cite-ocr-quality";
import { loadParseCoverage } from "@/lib/parse-ocr-coverage-server";
import { loadExtractPageCoverage } from "@/lib/extract-page-coverage-server";
import type { ExtractPageCoverage } from "@/lib/extract-page-coverage";
import { loadExtractPageDensity } from "@/lib/extract-page-density-server";
import type { ExtractPageDensity } from "@/lib/extract-page-density";
import { atomIncomplete } from "@/lib/atom-draft";

/** 反查包含该物料全部章的已注册书目（用于 ready → 书桌 CTA）；未注册返回 undefined。 */
export function findDeskBook(m: Material) {
  return loadBooks().find((b) => m.chapters.every((c) => b.chapterIds.includes(c.id)));
}

/**
 * T45 E：hint 拆 { text, command }——命令进可复制 mono 块（CopyCommand 岛）；
 * uploaded/parsed 只列**仍缺**的章 id（缺 blocks → parse 子集；全 blocks 缺 cards → extract
 * 子集；全缺时即全部），不再恒铺全章。不假进度条、不改 deriveMaterialStage。
 */
export function missingChapterIds(m: Material, kind: "blocks" | "cards"): string[] {
  const has = kind === "blocks" ? materialChapterHasBlocks : materialChapterHasCards;
  const missing = m.chapters.filter((c) => !has(m, c.id)).map((c) => c.id);
  return missing.length > 0 ? missing : m.chapters.map((c) => c.id);
}

export const STAGE_UI: Record<
  MaterialStage,
  { label: string; badge: string; hint: (m: Material) => { text: string; command?: string } }
> = {
  uploaded: {
    label: "已上传 · 待本机 OCR",
    badge: "border-amber-300 bg-status-warn-bg text-status-warn",
    hint: (m) => {
      const ids = missingChapterIds(m, "blocks");
      return {
        text: `下一步：在本机（macOS）对仍缺 blocks 的 ${ids.length} 章跑 Apple Vision OCR（命令可复制）。没有云端 OCR；未跑解析不会标记 parsed。`,
        command: `pnpm parse ${ids.join(" ")}`,
      };
    },
  },
  parsed: {
    label: "已解析 · 待 LLM 抽取",
    badge: "border-line bg-card text-foreground",
    hint: (m) => {
      const ids = missingChapterIds(m, "cards");
      return {
        text: `blocks 就绪。下一步：对仍缺 cards 的 ${ids.length} 章跑 LLM 直连抽取，产出 data/cards/<ch>.entities.json（命令可复制）。`,
        command: `DEEPSEEK_API_KEY=… pnpm extract -- ${ids.join(" ")}`,
      };
    },
  },
  extracted: {
    label: "已抽取 · 未注册书库",
    badge: "border-line bg-card text-foreground",
    hint: () => ({
      text: "实体卡已生成。点下方「注册进书库 →」一键把章写入 config/chapter.json + config/books.json（本机落盘）；注册成功后这里直接给出「打开书桌 →」，即可开章页读页、练卡、核 cite——无需刷新等待。",
    }),
  },
  ready: {
    label: "就绪 · 已在书库",
    badge: "border-status-ok/40 bg-status-ok-bg text-status-ok",
    hint: () => ({ text: "就绪。可在书桌（三栏学习面）打开阅读，或进入卡浏览器与学习环。" }),
  },
  failed: {
    label: "失败",
    badge: "border-status-error/40 bg-status-error-bg text-status-error",
    hint: (m) => ({ text: m.failure ?? "见 material 记录 failure 字段。" }),
  },
};

export type ChCheck = {
  quality: CiteQuality;
  misses: {
    cardId: string;
    page: number;
    coverage: number;
    quote: string;
    ocrSnippet?: string;
  }[];
  zeroAtomCardIds: string[];
  /** T61 G：含 seed 口径不完备原子（空 prompt ∨ 空 answer，同 T55 口径）的卡 id——
      补救面板「到卡详开草稿」次级链用；只链不阻断 register API。 */
  incompleteCardIds: string[];
};

export function buildIngestMaterialModel(m: Material) {
  const stage = deriveMaterialStage(m);
  const ui = STAGE_UI[stage];
  const hint = ui.hint(m);
  /** T45 E：分章就绪 N/M（磁盘事实推导；纯文本计数，不做假进度条）。 */
  const blocksN = m.chapters.filter((c) => materialChapterHasBlocks(m, c.id)).length;
  const cardsN = m.chapters.filter((c) => materialChapterHasCards(m, c.id)).length;
  /**
   * T54 D/I + T55 D/I：章级 cite↔OCR 机检（只对**有 cards** 的章实算——
   * uploaded/parsed 不装假 0 条）；算法与 pnpm cite-check / extract 后置同真
   * （lib/cite-ocr-quality，bigram≥0.6）。缺该章 OCR 文本的 cite 不计 miss
   * （未检不抬假阳）。T55 增完备计数 + miss 样例（≤8，含 OCR 附近窗）与
   * 零原子卡 id——补救面板 / 章清单质量行 / 注册软门禁（qualityWarn）共用。
   */
  const chapterChecks = new Map<string, ChCheck>();
  for (const c of m.chapters) {
    if (!materialChapterHasCards(m, c.id)) continue;
    const chCards = loadCards({ chapterId: c.id });
    if (chCards.length === 0) continue;
    const textByPage: Record<number, string> = {};
    for (const p of loadChapterPages(c.id)) {
      if (p.page != null) textByPage[p.page] = p.text;
    }
    chapterChecks.set(c.id, {
      quality: scoreChapter(chCards, textByPage),
      misses: chCards
        .flatMap((cd) => cardCiteMisses(cd, textByPage))
        .slice(0, 8),
      zeroAtomCardIds: chCards
        .filter((cd) => (cd.atoms ?? []).length === 0)
        .map((cd) => cd.id),
      incompleteCardIds: chCards
        .filter((cd) => (cd.atoms ?? []).some((a) => atomIncomplete(a)))
        .map((cd) => cd.id),
    });
  }
  const warnQs = [...chapterChecks.values()].map((ck) => ck.quality);
  const warnCites = warnQs.reduce((n, q) => n + q.cites, 0);
  const warnMiss = warnQs.reduce((n, q) => n + q.ocrMiss, 0);
  const materialWarn =
    warnQs.length > 0
      ? {
          ocrMiss: warnMiss,
          zeroAtomCards: warnQs.reduce((n, q) => n + q.zeroAtomCards, 0),
          missRate: warnCites > 0 ? warnMiss / warnCites : 0,
          nullPage: warnQs.reduce((n, q) => n + q.nullPage, 0),
          emptyPromptAtoms: warnQs.reduce((n, q) => n + q.emptyPromptAtoms, 0),
          emptyAnswerAtoms: warnQs.reduce((n, q) => n + q.emptyAnswerAtoms, 0),
          incompleteAtoms: warnQs.reduce((n, q) => n + q.incompleteAtoms, 0),
        }
      : undefined;
  /** T55 D：弱章集合（OCR未见/零原子/不完备 任一 >0）——补救面板与重抽命令子集。 */
  const weakChapters = [...chapterChecks.entries()].filter(
    ([, ck]) =>
      ck.quality.ocrMiss > 0 ||
      ck.quality.zeroAtomCards > 0 ||
      ck.quality.incompleteAtoms > 0,
  );
  /**
   * T56 D：parse 覆盖（只对**已有 blocks** 的章装载；缺文件 null=未检不装完美）。
   * uploaded 缺 blocks 章走既有 parse 命令；已解析子集如实显示各自覆盖，
   * 不假装整物料 parsed；uploaded/parsed 章无 cards → 不装 cite 假 0 条
   * （chapterChecks 只装有 cards 的章）。
   */
  const chapterCoverage = new Map<string, ReturnType<typeof loadParseCoverage>>();
  for (const c of m.chapters) {
    if (!materialChapterHasBlocks(m, c.id)) continue;
    chapterCoverage.set(c.id, loadParseCoverage(c.id));
  }
  const weakParseChapters = [...chapterCoverage.entries()].filter(
    ([, cov]) => cov != null && cov.weak,
  );
  const covEmpty = [...chapterCoverage.values()].reduce(
    (n, cov) => n + (cov?.emptyPages ?? 0),
    0,
  );
  const covSparse = [...chapterCoverage.values()].reduce(
    (n, cov) => n + (cov?.sparsePages ?? 0),
    0,
  );
  /**
   * T57 D/I：抽出页覆盖（只对**有 cards** 的章装载——与 T54 chapterChecks 同
   * 门禁；缺 blocks/entities → null=未检不装完美）。uploaded/parsed 无 cards 章
   * 不出暗假 0 条（未抽出 ≠ 零暗页）；算法与 pnpm page-check / extract 后置同真
   * （lib/extract-page-coverage，暗页 = chars≥40 实质页零 cite）。
   */
  const chapterExtractPage = new Map<string, ExtractPageCoverage | null>();
  for (const c of m.chapters) {
    if (!materialChapterHasCards(m, c.id)) continue;
    chapterExtractPage.set(c.id, loadExtractPageCoverage(c.id));
  }
  /** T57 D：弱章集合（任暗页）——暗页面板与重抽命令子集；样例 ≤6。 */
  const darkChapters = [...chapterExtractPage.entries()].filter(
    ([, cov]) => cov != null && cov.weak,
  );
  const darkTotal = [...chapterExtractPage.values()].reduce(
    (n, cov) => n + (cov?.darkCount ?? 0),
    0,
  );
  const substantialTotal = [...chapterExtractPage.values()].reduce(
    (n, cov) => n + (cov?.substantialPages ?? 0),
    0,
  );
  const bookDarkRate =
    substantialTotal > 0 ? darkTotal / substantialTotal : 0;
  /**
   * T59 D/I：抽出后浅密度（只对**有 cards** 的章装载——与 T54 chapterChecks /
   * T57 chapterExtractPage 同门禁；缺 blocks/entities → null=未检不装完美）。
   * uploaded/parsed 无 cards 章不出浅假 0 条（未抽出 ≠ shallowCount=0）；
   * 算法与 pnpm density-check / extract 后置同真（lib/extract-page-density，
   * 浅页 = 已 cite 实质页原子极稀；原子只计 atoms[].cite.page）。
   */
  const chapterDensity = new Map<string, ExtractPageDensity | null>();
  for (const c of m.chapters) {
    if (!materialChapterHasCards(m, c.id)) continue;
    chapterDensity.set(c.id, loadExtractPageDensity(c.id));
  }
  /** T59 D：弱章集合（任浅页）——浅密度面板与重抽命令子集；样例 ≤6。 */
  const shallowChapters = [...chapterDensity.entries()].filter(
    ([, den]) => den != null && den.weak,
  );
  const shallowTotal = [...chapterDensity.values()].reduce(
    (n, den) => n + (den?.shallowCount ?? 0),
    0,
  );
  const densitySubstantialTotal = [...chapterDensity.values()].reduce(
    (n, den) => n + (den?.substantialPages ?? 0),
    0,
  );
  const bookShallowRate =
    densitySubstantialTotal > 0
      ? shallowTotal / densitySubstantialTotal
      : 0;

  const book = stage === "ready" ? findDeskBook(m) : undefined;

  return {
    m,
    stage,
    ui,
    hint,
    blocksN,
    cardsN,
    chapterChecks,
    materialWarn,
    weakChapters,
    chapterCoverage,
    weakParseChapters,
    covEmpty,
    covSparse,
    chapterExtractPage,
    darkChapters,
    darkTotal,
    substantialTotal,
    bookDarkRate,
    chapterDensity,
    shallowChapters,
    shallowTotal,
    densitySubstantialTotal,
    bookShallowRate,
    book,
  };
}

export type IngestMaterialModel = ReturnType<typeof buildIngestMaterialModel>;
