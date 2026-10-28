import Link from "next/link";
import type { CiteQuality } from "@/lib/cite-ocr-quality";
import type {
  ShelfBookDensitySignal,
  ShelfBookExtractPageSignal,
  ShelfBookParseSignal,
} from "@/lib/library-shelf-data";

/**
 * T97 desk-library-shelf-split-01：书架单书卡三行信号徽——自 app/(desk)/page.tsx :343–416
 * 机械抽出。T55 cite 质量 · T56 OCR 覆盖 · T57+T59 抽出偏稀（暗 + 浅旁挂同一点名行）
 * 三分列骨架 KEEP；好书 / 未检各行 return null 静音口径 ≡ tip；次级 /ingest 链保留；
 * 不造第四大红独立列、无掌握% / Due / 圆环。四切片由 ShelfBookCard 自 page 同池下传。
 */
export default function ShelfBookSignalBadges({
  quality,
  parseCoverage,
  extractPage,
  density,
}: {
  quality: CiteQuality | null;
  parseCoverage: ShelfBookParseSignal;
  extractPage: ShelfBookExtractPageSignal;
  density: ShelfBookDensitySignal;
}) {
  return (
    <>
      {/* T55 H：书级质量徽——弱书（OCR未见 / 零原子卡 / 不完备原子 任一 >0）琥珀
          点名（只列 >0 项），好书不吵；次级 /ingest 去补救（miss 样例 / 重抽命令在
          物料面板）。非掌握% / 非 Due 角标 / 无圆环；未检（无 entities）不出徽。 */}
      {(() => {
        const q = quality;
        if (q == null) return null;
        if (q.ocrMiss === 0 && q.zeroAtomCards === 0 && q.incompleteAtoms === 0) return null;
        const parts: string[] = [];
        if (q.ocrMiss > 0) parts.push(`OCR未见 ${q.ocrMiss}`);
        if (q.zeroAtomCards > 0) parts.push(`零原子卡 ${q.zeroAtomCards}`);
        if (q.incompleteAtoms > 0) parts.push(`空原子字段 ${q.incompleteAtoms}`);
        return (
          <p className="mt-3 flex flex-wrap items-baseline gap-2 text-xs leading-6 text-status-warn">
            <span className="rounded border border-amber-300 bg-status-warn-bg px-2 py-0.5">
              质量偏弱 · {parts.join(" · ")}
            </span>
            <Link href="/ingest" className="text-muted no-underline hover:text-cinnabar">
              去补救 →
            </Link>
          </p>
        );
      })()}
      {/* T56 G：书级 parse 覆盖徽——与上方 T55 cite 质量徽**分列**（独立一行、独立口径：
          空页/稀页是 OCR 阶段信号，OCR未见是 cite↔OCR 比对信号）。任章 weak 才出，
          好书/未检不吵；次级 /ingest 补扫；无掌握% / Due / 圆环。 */}
      {(() => {
        const bp = parseCoverage;
        if (!bp || !bp.weak) return null;
        return (
          <p className="mt-2 flex flex-wrap items-baseline gap-2 text-xs leading-6 text-status-warn">
            <span className="rounded border border-amber-300 bg-status-warn-bg px-2 py-0.5">
              OCR覆盖偏弱
              {bp.empty > 0 ? ` · 空 ${bp.empty}` : ""}
              {bp.sparse > 0 ? ` · 稀 ${bp.sparse}` : ""}
            </span>
            <Link href="/ingest" className="text-muted no-underline hover:text-cinnabar">
              去补扫 →
            </Link>
          </p>
        );
      })()}
      {/* T57 G：书级抽出页覆盖徽——第三枚，与 T55 cite / T56 parse 徽三分列（独立
          一行、独立口径：暗页 = 实质 OCR 页 chars≥40 零 cite，抽出后未成原子）。
          任章 weak 才出（D=书级合计）；好书/未检不吵；次级 /ingest 重抽；
          无掌握% / Due / 圆环；不自动发明 cite 填暗页。
          T59 G：浅信号**旁挂**本行（暗与浅同点名行分列；书级 shallowCount 合计，
          loadExtractPageDensity 与 pnpm density-check 同真）——只任暗或任浅才出，
          好书静音；缺 cards/blocks 章＝未检不抬假阳；仍不拆 cite|parse|暗 三分列
          骨架、不造第四大红独立列。
          T65 A：徽内比率是**本书**实质页口径的合计（如 4/89≈4%），与章级驾驶舱的
          单章 24% 是两套分母——文案改中文「占实质页」并标「本书」防误读；数学仍
          bookExtractPage/bookDensity 书级合计，不假贴章级数。 */}
      {(() => {
        const be = extractPage;
        const bd = density;
        if ((!be || !be.weak) && (!bd || !bd.weak)) return null;
        return (
          <p className="mt-2 flex flex-wrap items-baseline gap-2 text-xs leading-6 text-status-warn">
            <span className="rounded border border-amber-300 bg-status-warn-bg px-2 py-0.5">
              抽出偏稀
              {be && be.dark > 0
                ? ` · 暗页 ${be.dark}（本书占实质页 ${(be.darkRate * 100).toFixed(0)}%）`
                : ""}
              {bd && bd.shallow > 0
                ? ` · 浅页 ${bd.shallow}（本书占实质页 ${(bd.shallowRate * 100).toFixed(0)}%）`
                : ""}
            </span>
            <Link href="/ingest" className="text-muted no-underline hover:text-cinnabar">
              去重抽 →
            </Link>
            <span className="text-muted">弱章明细见下方章质检驾驶舱</span>
          </p>
        );
      })()}
    </>
  );
}
