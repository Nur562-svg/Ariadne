import {
  materialChapterHasBlocks,
  materialChapterHasCards,
  type collectStudyAtoms,
  type loadAllChapterPages,
} from "@/lib/entities";
import type { collectCiteQueue } from "@/lib/heye";
import RegisterMaterialButton from "@/components/RegisterMaterialButton";
import IngestReadyLinks from "@/components/IngestReadyLinks";
import CopyCommand from "@/components/CopyCommand";
import IngestMaterialQualityPanels from "@/components/IngestMaterialQualityPanels";
import {
  findDeskBook,
  type IngestMaterialModel,
} from "@/lib/ingest-material-model";

interface IngestMaterialCardProps {
  model: IngestMaterialModel;
  bookValidPages: Record<string, number[]>;
  allOcrPages: ReturnType<typeof loadAllChapterPages>;
  allAtoms: ReturnType<typeof collectStudyAtoms>;
  allQueue: ReturnType<typeof collectCiteQueue>;
}

export default function IngestMaterialCard({
  model,
  bookValidPages,
  allOcrPages,
  allAtoms,
  allQueue,
}: IngestMaterialCardProps) {
  const {
    m,
    stage,
    ui,
    hint,
    blocksN,
    cardsN,
    chapterChecks,
    materialWarn,
    chapterCoverage,
    weakParseChapters,
    covEmpty,
    covSparse,
    chapterExtractPage,
    darkChapters,
    darkTotal,
    bookDarkRate,
    chapterDensity,
    shallowChapters,
    shallowTotal,
    bookShallowRate,
  } = model;

  return (
    <li className="rounded-lg border border-line bg-card p-5">
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
                    抽出页 实质 {epc.substantialPages} · 已cite {epc.citedPages} · 暗 {epc.darkCount} · 暗率 {(epc.darkRate * 100).toFixed(0)}%
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
                    浅密度 实质 {den.substantialPages} · 有原子 {den.citedAtomPages} · 浅 {den.shallowCount} · 浅率 {(den.shallowRate * 100).toFixed(0)}%
                  </span>
                );
              })()}
            </li>
          );
        })}
      </ul>
      <IngestMaterialQualityPanels model={model} />
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
}
