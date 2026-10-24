import Link from "next/link";
import type { Material, MaterialStage } from "@/lib/entities";
import {
  collectStudyAtoms,
  deriveMaterialStage,
  loadAllChapterPages,
  loadBooks,
  loadBookValidPages,
  loadCards,
  loadChapterPages,
  loadMaterials,
  materialChapterHasBlocks,
  materialChapterHasCards,
} from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
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
import IngestUpload from "@/components/IngestUpload";
import RegisterMaterialButton from "@/components/RegisterMaterialButton";
import IngestReadyLinks from "@/components/IngestReadyLinks";
import CopyCommand from "@/components/CopyCommand";

export const dynamic = "force-dynamic";

/** 反查包含该物料全部章的已注册书目（用于 ready → 书桌 CTA）；未注册返回 undefined。 */
function findDeskBook(m: Material) {
  return loadBooks().find((b) => m.chapters.every((c) => b.chapterIds.includes(c.id)));
}

/**
 * T45 E：hint 拆 { text, command }——命令进可复制 mono 块（CopyCommand 岛）；
 * uploaded/parsed 只列**仍缺**的章 id（缺 blocks → parse 子集；全 blocks 缺 cards → extract
 * 子集；全缺时即全部），不再恒铺全章。不假进度条、不改 deriveMaterialStage。
 */
function missingChapterIds(m: Material, kind: "blocks" | "cards"): string[] {
  const has = kind === "blocks" ? materialChapterHasBlocks : materialChapterHasCards;
  const missing = m.chapters.filter((c) => !has(m, c.id)).map((c) => c.id);
  return missing.length > 0 ? missing : m.chapters.map((c) => c.id);
}

const STAGE_UI: Record<
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

export default function IngestPage() {
  const materials = loadMaterials();
  /**
   * T49 C：就绪/注册三连空池计数装配（只在有物料时读，空页不扫盘）——
   * - bookValidPages：ready 书「打开书桌」0-OCR 门禁（与 T46 书架四格/CTA 同表）；
   * - allOcrPages/allAtoms/allQueue：全库一次读出，按书或物料章集合过滤——与
   *   collectStudyAtoms({bookId}) / collectCiteQueue({bookId}) 同池族（loadCards 按
   *   chapterIds 文件归属，章间无重复卡，过滤结果与 scoped 调用等值，不造第二套定义）。
   */
  const bookValidPages = materials.length > 0 ? loadBookValidPages() : {};
  const allOcrPages = materials.length > 0 ? loadAllChapterPages() : [];
  const allAtoms = materials.length > 0 ? collectStudyAtoms() : [];
  const allQueue = materials.length > 0 ? collectCiteQueue() : [];
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="brand-rule pb-2 text-3xl font-bold">导入教材</h1>
      <p className="mt-2 text-sm leading-7 text-foreground/90">
        顾客自带材料是目标模型。上传 PDF 只落盘与建档，<span className="font-semibold">不会</span>触发任何云端
        OCR / 抽取——状态机器完全由本机文件事实推导，没有「假解析成功」。
      </p>

      <ol className="mt-6 space-y-2 border-l-2 border-line pl-5 text-sm leading-7 text-foreground/90">
        <li><span className="mono mr-1 text-cinnabar">1</span>上传 PDF + 填写 pageOffset 与章物理页范围（此处）→ 状态 <span className="mono">uploaded</span>，PDF 落盘 data/uploads/（已 gitignore）。</li>
        <li><span className="mono mr-1 text-cinnabar">2</span>本机（macOS）跑 <span className="mono">pnpm parse &lt;ch&gt;</span> —— Apple Vision OCR，产出 data/chapters/&lt;ch&gt;.blocks.json → <span className="mono">parsed</span>。</li>
        <li><span className="mono mr-1 text-cinnabar">3</span>本机跑 <span className="mono">pnpm extract -- &lt;ch&gt;</span> —— LLM 直连抽取实体卡 → <span className="mono">extracted</span>。</li>
        <li><span className="mono mr-1 text-cinnabar">4</span>在 extracted 物料上点「注册进书库 →」，一键写入 config/chapter.json 与 config/books.json → <span className="mono">ready</span>，书库 / 卡浏览器 / 学习环直接可用（无需改 React 代码）。</li>
      </ol>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-muted">上传 PDF</h2>
        <IngestUpload />
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-semibold text-muted">物料记录（{materials.length}）</h2>
        {materials.length === 0 ? (
          <p className="mt-3 text-sm text-muted">还没有上传记录。</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {materials.map((m) => {
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
              type ChCheck = {
                quality: CiteQuality;
                misses: {
                  cardId: string;
                  page: number;
                  coverage: number;
                  quote: string;
                  ocrSnippet?: string;
                }[];
                zeroAtomCardIds: string[];
              };
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
              return (
                <li key={m.id} className="rounded-lg border border-line bg-card p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold">{m.title}</h3>
                    <span className={`mono shrink-0 rounded border px-2 py-0.5 text-xs ${ui.badge}`}>
                      {ui.label}
                    </span>
                  </div>
                  <p className="mono mt-1 text-xs text-muted">
                    {m.id} · pageOffset {m.pageOffset} · {m.chapters.map((c) => c.id).join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    blocks {blocksN}/{m.chapters.length} · cards {cardsN}/{m.chapters.length}
                    {blocksN < m.chapters.length || cardsN < m.chapters.length
                      ? "——未全就绪，见下方仍缺章命令"
                      : ""}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    章范围：{m.chapters.map((c) => `${c.id} 物理页 ${c.physicalStart}–${c.physicalEnd}`).join(" · ")}
                  </p>
                  {/* T22 A：每章清单（id · 标题 · 物理页起止 · blocks/有 无 · cards 有/无）。
                      blocks/cards 均由「本物料」磁盘事实推导（fail-closed，禁止假进度条 / 假 OCR 动画）。 */}
                  <ul className="mt-3 space-y-1 border-l-2 border-line pl-4">
                    {m.chapters.map((c) => {
                      const hasBlocks = materialChapterHasBlocks(m, c.id);
                      const hasCards = materialChapterHasCards(m, c.id);
                      const q = hasCards ? chapterChecks.get(c.id)?.quality : undefined;
                      /** T54 D + T55 D：有 cards 的章给机检真数（卡/原子/OCR未见/无页/零原子卡/
                          不完备原子）；任一弱项 > 0 琥珀点名——弱稿注册前可见；不装 0。 */
                      const qWarn =
                        q != null &&
                        (q.ocrMiss > 0 ||
                          q.nullPage > 0 ||
                          q.zeroAtomCards > 0 ||
                          q.incompleteAtoms > 0);
                      return (
                        <li
                          key={c.id}
                          className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted"
                        >
                          <span className="mono text-foreground/80">{c.id}</span>
                          <span className="text-foreground/80">{c.title}</span>
                          <span className="mono">页 {c.physicalStart}–{c.physicalEnd}</span>
                          <span>blocks {hasBlocks ? "有" : "无"}</span>
                          <span>cards {hasCards ? "有" : "无"}</span>
                          {q ? (
                            <span className={qWarn ? "text-status-warn" : undefined}>
                              机检 卡 {q.cards} · 原子 {q.atoms} · OCR未见 {q.ocrMiss} · 无页 p.? {q.nullPage} · 零原子卡 {q.zeroAtomCards} · 不完备原子 {q.incompleteAtoms}
                            </span>
                          ) : null}
                          {(() => {
                            /* T56 D：有 blocks 的章给 parse 覆盖真数（期望/实有/空/稀/块/覆盖率）；
                                weak 琥珀点名；未检（缺文件）不装完美覆盖。 */
                            const cov = chapterCoverage.get(c.id);
                            if (!cov) return null;
                            return (
                              <span className={cov.weak ? "text-status-warn" : undefined}>
                                OCR 期望 {cov.expectedPages} · 实有 {cov.pagesPresent} · 空 {cov.emptyPages} · 稀 {cov.sparsePages} · 块 {cov.blockCount} · 覆盖 {(cov.coverageRate * 100).toFixed(0)}%
                              </span>
                            );
                          })()}
                          {(() => {
                            /* T57 D：有 cards 的章给抽出页覆盖真数（实质/已cite/暗/darkRate）；
                                weak 琥珀点名；未抽出（无 cards）不装暗假 0——与 T54 机检条、
                                T56 OCR 覆盖条三分列，勿吞勿改写。 */
                            const epc = chapterExtractPage.get(c.id);
                            if (!epc) return null;
                            return (
                              <span className={epc.weak ? "text-status-warn" : undefined}>
                                抽出页 实质 {epc.substantialPages} · 已cite {epc.citedPages} · 暗 {epc.darkCount} · darkRate {(epc.darkRate * 100).toFixed(0)}%
                              </span>
                            );
                          })()}
                          {(() => {
                            /* T59 D：有 cards 的章给抽出密度真数（实质/有原子页/浅/shallowRate）；
                                weak 琥珀点名；未抽出（无 cards）不装浅假 0——与 T54 机检、
                                T56 OCR 覆盖、T57 暗页四概念分列，勿吞勿改写（浅 ≠ 暗：浅是
                                已 cite 页原子极稀，暗是零 cite）。 */
                            const den = chapterDensity.get(c.id);
                            if (!den) return null;
                            return (
                              <span className={den.weak ? "text-status-warn" : undefined}>
                                浅密度 实质 {den.substantialPages} · 有原子 {den.citedAtomPages} · 浅 {den.shallowCount} · shallowRate {(den.shallowRate * 100).toFixed(0)}%
                              </span>
                            );
                          })()}
                        </li>
                      );
                    })}
                  </ul>
                  {/* T56 D：parse 覆盖偏弱块（任 weak 章才渲）——琥珀点名 + 补扫命令可复制
                      （弱章子集，区别于 T55 抽取弱章命令）；与 T55 cite 补救面板分列。 */}
                  {weakParseChapters.length > 0 ? (
                    <div className="mt-3 rounded-lg border border-amber-300/60 px-3 py-2">
                      <p className="text-xs leading-6 text-status-warn">
                        OCR 覆盖偏弱 · 空 {covEmpty} 页 · 稀 {covSparse} 页（弱章：
                        {weakParseChapters.map(([id]) => id).join(" ")}）——稀页/空页常为
                        分隔页或漏扫，补扫后重跑 parse-check 复核；不阻断抽出/注册。
                      </p>
                      <div className="mt-2">
                        <CopyCommand
                          command={`pnpm parse ${weakParseChapters.map(([id]) => id).join(" ")}`}
                        />
                      </div>
                    </div>
                  ) : null}
                  {/* T57 D：抽出页覆盖偏弱块（任暗页章才渲；与 T56 parse 覆盖块 / T55 补救
                      面板**分列**）——琥珀点名 + 顶层暗页样例 ≤6（页码 mono + chars）+ 重抽
                      命令可复制（弱章子集）。只展示 + 剪贴板——不自动 PATCH entities /
                      不发明 cite 填暗页；扉页/小结/跨章扉可能合理暗，不阻断注册。 */}
                  {darkChapters.length > 0 ? (
                    <div className="mt-3 rounded-lg border border-amber-300/60 px-3 py-2">
                      <p className="text-xs leading-6 text-status-warn">
                        抽出页覆盖偏稀 · 暗页未成原子（暗 {darkTotal} 页 · 弱章：
                        {darkChapters.map(([id]) => id).join(" ")}）——实质 OCR 页没有任何卡
                        cite；扉页/小结/跨章扉可能合理暗，重抽或人工补 seed 后 pnpm page-check
                        复核；不阻断注册。
                      </p>
                      {(() => {
                        const darkSamples = darkChapters
                          .flatMap(([id, cov]) =>
                            (cov?.darkPages ?? []).map((d) => ({ ch: id, ...d })),
                          )
                          .slice(0, 6);
                        if (darkSamples.length === 0) return null;
                        return (
                          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs leading-5 text-muted">
                            <span>暗页样例：</span>
                            {darkSamples.map((s) => (
                              <span key={`${s.ch}:${s.page}`} className="mono">
                                {s.ch} p.{s.page}（{s.chars}字）
                              </span>
                            ))}
                          </p>
                        );
                      })()}
                      <div className="mt-2">
                        <CopyCommand
                          command={`pnpm extract -- ${darkChapters.map(([id]) => id).join(" ")}`}
                        />
                      </div>
                    </div>
                  ) : null}
                  {/* T59 D：抽出密度偏稀块（任浅页章才渲；与 T57 暗页块 / T56 parse 覆盖块 /
                      T55 补救面板**分列**）——琥珀点名 + 顶层浅页样例 ≤6（页码 mono + 原子数 +
                      字数）+ 重抽命令可复制（弱章子集）。浅 ≠ 暗：浅是已 cite 实质页原子极稀
                      （可考密度不足），暗是零 cite。只展示 + 剪贴板——不自动 PATCH entities /
                      不发明原子「补浅」；浅不伪装成暗/稀/cite miss，不阻断注册。 */}
                  {shallowChapters.length > 0 ? (
                    <div className="mt-3 rounded-lg border border-amber-300/60 px-3 py-2">
                      <p className="text-xs leading-6 text-status-warn">
                        抽出密度偏稀 · 已 cite 页原子极少（浅 {shallowTotal} 页 · 弱章：
                        {shallowChapters.map(([id]) => id).join(" ")}）——这些实质页已被
                        cite 但每页只扛 1–2 个原子，可考密度不足；重抽或人工补 seed 后
                        pnpm density-check 复核；不阻断注册。
                      </p>
                      {(() => {
                        const shallowSamples = shallowChapters
                          .flatMap(([id, den]) =>
                            (den?.shallowPages ?? []).map((s) => ({ ch: id, ...s })),
                          )
                          .slice(0, 6);
                        if (shallowSamples.length === 0) return null;
                        return (
                          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs leading-5 text-muted">
                            <span>浅页样例：</span>
                            {shallowSamples.map((s) => (
                              <span key={`${s.ch}:${s.page}`} className="mono">
                                {s.ch} p.{s.page}（{s.atomCount}原子·{s.chars}字）
                              </span>
                            ))}
                          </p>
                        );
                      })()}
                      <div className="mt-2">
                        <CopyCommand
                          command={`pnpm extract -- ${shallowChapters.map(([id]) => id).join(" ")}`}
                        />
                      </div>
                    </div>
                  ) : null}
                  {/* T55 D：补救面板（extracted/ready 且有弱章才渲；uploaded/parsed 不装假表）——
                      每弱章 <details> 展开 miss 样例（≤8，链卡 + p.N + cov + OCR 附近 mono）+
                      零原子卡 id 链 + 不完备原子点名；重抽命令可复制（多章按弱章子集拼）。
                      只展示 + 剪贴板——不自动 PATCH entities / 不写 verified。 */}
                  {weakChapters.length > 0 ? (
                    <div className="mt-3 rounded-lg border border-amber-300/60 px-3 py-2">
                      {weakChapters.map(([chId, ck]) => (
                        <details key={chId} className="py-1">
                          <summary className="cursor-pointer select-none text-xs leading-6 text-status-warn">
                            补救 · {chId}：OCR未见 {ck.quality.ocrMiss} · 零原子卡{" "}
                            {ck.quality.zeroAtomCards} · 不完备原子 {ck.quality.incompleteAtoms}
                          </summary>
                          {ck.misses.length > 0 ? (
                            <ul className="mt-1.5 space-y-1.5">
                              {ck.misses.map((mm, i) => (
                                <li key={`${mm.cardId}:${mm.page}:${i}`} className="text-xs leading-5 text-muted">
                                  <Link
                                    href={`/desk/card/${encodeURIComponent(mm.cardId)}`}
                                    className="mono mr-1 text-cinnabar no-underline hover:underline underline-offset-4"
                                  >
                                    {mm.cardId}
                                  </Link>
                                  · p.{mm.page} · cov {mm.coverage} · “{mm.quote}”
                                  {mm.ocrSnippet ? (
                                    <span className="mono mt-0.5 block text-[11px] leading-5 text-foreground/80">
                                      OCR附近：{mm.ocrSnippet}
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1.5 text-xs leading-5 text-muted">
                              （本章无 OCR 未见样例——弱项为零原子卡 / 不完备原子，见下）
                            </p>
                          )}
                          {ck.zeroAtomCardIds.length > 0 ? (
                            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs leading-5 text-muted">
                              <span>零原子卡（练不出题）：</span>
                              {ck.zeroAtomCardIds.map((id) => (
                                <Link
                                  key={id}
                                  href={`/desk/card/${encodeURIComponent(id)}`}
                                  className="mono text-cinnabar no-underline hover:underline underline-offset-4"
                                >
                                  {id}
                                </Link>
                              ))}
                            </p>
                          ) : null}
                          {ck.quality.incompleteAtoms > 0 ? (
                            <p className="mt-1.5 text-xs leading-5 text-status-warn">
                              不完备原子 {ck.quality.incompleteAtoms}（空 prompt{" "}
                              {ck.quality.emptyPromptAtoms} / 空 answer{" "}
                              {ck.quality.emptyAnswerAtoms}）——重抽或人工补 seed 后再注册。
                            </p>
                          ) : null}
                        </details>
                      ))}
                      <div className="mt-2">
                        <CopyCommand
                          command={`pnpm extract -- ${weakChapters.map(([id]) => id).join(" ")}`}
                        />
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-muted">
                        补救 = 展示 + 剪贴板：建议摘录 / 重抽命令由人核后手动执行，不自动写 entities。
                      </p>
                    </div>
                  ) : null}
                  <p className="mt-3 text-sm leading-7 text-foreground/90">{hint.text}</p>
                  {/* T45 E：下一步命令进可复制 mono 块（CopyCommand 客户端岛，朱红只强调复制动作）。 */}
                  {hint.command ? <CopyCommand command={hint.command} /> : null}
                  {stage === "ready" || stage === "extracted" ? (
                    (() => {
                      // ready → 显示就绪三连（反查该书）；extracted → 一键注册进书库（T22 C）。
                      const book = stage === "ready" ? findDeskBook(m) : undefined;
                      /** T49 C：书（ready）或物料章（extracted）集合——OCR/原子/待核三数同集合过滤。 */
                      const chIds = new Set(
                        (book ?? { chapterIds: m.chapters.map((c) => c.id) }).chapterIds,
                      );
                      const ocrPageCount =
                        stage === "ready" && book
                          ? (bookValidPages[book.id]?.length ?? 0)
                          : allOcrPages.filter((p) => p.chapterId != null && chIds.has(p.chapterId))
                              .length;
                      const atomCount = allAtoms.filter(
                        (a) => a.chapterId != null && chIds.has(a.chapterId),
                      ).length;
                      const pendingCount = allQueue.filter(
                        (it) => it.chapterId != null && chIds.has(it.chapterId),
                      ).length;
                      return (
                        <p className="mt-3">
                          {/* T39 B：就绪三连抽薄客户端岛 IngestReadyLinks——Server 页的 <Link>
                              不能挂 onClick（RSC 边界函数 props 即 500）；岛内三条链点前
                              saveReturn → /ingest（label 上传），完成态「回到刚才」回上传面。
                              书桌仍唯一朱红实心；学习/核次级；练 mode=all · 核 mode=open（T37 D 只回归）。
                              T49 A/C：ocr/atom/pending 三数下传——0-OCR 开书桌降级点名、
                              0 原子/0 待核学习环·核页纯文（与书架/T48 门禁同真，注册前后不互谎）。 */}
                          {book ? (
                            <IngestReadyLinks
                              bookId={book.id}
                              ocrPageCount={ocrPageCount}
                              atomCount={atomCount}
                              pendingCount={pendingCount}
                              /* T58 G：ready 三连旁挂书级暗 D（与上方 T57 暗页条/书架暗徽
                                 同数）——只短徽不阻断；T49 三门禁不动。 */
                              darkCount={darkTotal}
                              /* T60 G：ready 三连旁挂书级浅 S（与上方 T59 浅密度条/
                                 书架浅徽同数）——与暗D 徽并列可同真；只旁挂不阻断。 */
                              shallowCount={shallowTotal}
                            />
                          ) : (
                            <RegisterMaterialButton
                              materialId={m.id}
                              title={m.title}
                              ocrPageCount={ocrPageCount}
                              atomCount={atomCount}
                              pendingCount={pendingCount}
                              /* T54 E/I + T56 E/I：物料章机检汇总（有 cards 的章实算）+ parse
                                 覆盖弱标记（有 blocks 的章装载）——软门禁只点名不阻断，
                                 API 不因质量 4xx；低风险保持一键注册。 */
                              qualityWarn={{
                                ...(materialWarn ?? {
                                  ocrMiss: 0,
                                  zeroAtomCards: 0,
                                  missRate: 0,
                                  nullPage: 0,
                                }),
                                parseWeak: weakParseChapters.length > 0,
                                emptyPages: covEmpty,
                                sparsePages: covSparse,
                                /* T57 E/I：抽出页覆盖旁挂（有 cards 的章实算；darkPages 点名
                                   ≤8 供琥珀短句）——软二次触发 OR 入族，API 不 4xx。 */
                                darkPages: darkChapters
                                  .flatMap(([, cov]) => (cov?.darkPages ?? []).map((d) => d.page))
                                  .slice(0, 8),
                                darkCount: darkTotal,
                                darkRate: bookDarkRate,
                                /* T59 E/I：抽出密度旁挂（有 cards 的章实算；shallowPages 点名
                                   ≤8）——shallowCount>0 **OR 入**既有软二次触发族，API 不 4xx；
                                   浅与暗分列点数，不吞不改写既有条件。 */
                                shallowPages: shallowChapters
                                  .flatMap(
                                    ([, den]) => (den?.shallowPages ?? []).map((s) => s.page),
                                  )
                                  .slice(0, 8),
                                shallowCount: shallowTotal,
                                shallowRate: bookShallowRate,
                              }}
                            />
                          )}
                        </p>
                      );
                    })()
                  ) : null}
                  <p className="mt-2 text-xs text-muted">
                    创建于 {m.createdAt} · PDF：<span className="mono">{m.pdfFile}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-10 text-sm leading-7 text-muted">
        诚实说明：状态由「本物料」磁盘事实推导（上传时快照 artifactBaseline；blocks/cards 相对基线变化且有正文/卡才算 parsed/extracted）——同名 seed 章不会让新上传显示 ready。
        尚无云端 OCR / MinerU 生产管线。
        回 <Link className="text-cinnabar no-underline hover:underline underline-offset-4" href="/">书库</Link> 查看已注册书目。
      </p>
    </main>
  );
}