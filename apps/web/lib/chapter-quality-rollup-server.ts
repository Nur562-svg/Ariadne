/**
 * T63 B：fs 版章级质量 rollup 装载（**server 专用**——含 node:fs，勿从 client 组件 import；
 * client 只读纯函数版 @/lib/chapter-quality-rollup 的类型 / helper）。
 *
 * loadChapterQualityRollup(chapterId) 只**组装**既有同真算法，零重算：
 *   - scoreChapter + cardCiteMisses（lib/cite-ocr-quality，与 pnpm cite-check 同真；缺 OCR 文本的
 *     cite 不计 miss——未检不抬假阳；pageTextByPage 装配与书架 T55 徽 / ingest 章清单同口径）
 *   - loadParseCoverage（T56）· loadExtractPageCoverage（T57）· loadExtractPageDensity（T59）
 *   - incomplete 卡枚举：atomIncomplete（T55 同口径；与 DraftInbox incompleteCardSummaries 一致）
 * 缺 entities → cite/incomplete null/[]＝未检；缺 blocks → parse null；缺任一 → dark/shallow null。
 * **不装完美 0**。
 *
 * 只读：绝不写 entities / blocks / verified；data/qa/<ch>.*.json 只读 generatedAt 作
 * 「上次 CLI 戳」旁注——报告 ≠ 真源，缺文件 / 坏 JSON 一律 null 不炸。
 */
import fs from "node:fs";
import path from "node:path";
import { loadCards, loadChapterPages, repoRoot } from "@/lib/entities";
import { cardCiteMisses, scoreChapter } from "@/lib/cite-ocr-quality";
import { loadParseCoverage } from "@/lib/parse-ocr-coverage-server";
import { loadExtractPageCoverage } from "@/lib/extract-page-coverage-server";
import { loadExtractPageDensity } from "@/lib/extract-page-density-server";
import { atomIncomplete } from "@/lib/atom-draft";
import {
  buildChapterQualityRollup,
  type ChapterQualityRollup,
} from "@/lib/chapter-quality-rollup";

/** 既有四条 CLI 的报告文件后缀 + 本刀 qa-check 孪生（只读 generatedAt）。 */
const QA_REPORT_SUFFIXES = [
  "cite-ocr",
  "parse-ocr",
  "extract-page",
  "extract-density",
  "quality-rollup",
] as const;

/** data/qa/<ch>.*.json 里最新的 generatedAt（ISO）；全缺 / 全坏 → null。 */
export function readLastCliCheckAt(chapterId: string): string | null {
  const qaDir = path.join(repoRoot(), "data", "qa");
  let latest: string | null = null;
  let latestMs = -Infinity;
  for (const suffix of QA_REPORT_SUFFIXES) {
    const file = path.join(qaDir, `${chapterId}.${suffix}.json`);
    if (!fs.existsSync(file)) continue;
    try {
      const doc = JSON.parse(fs.readFileSync(file, "utf8")) as { generatedAt?: unknown };
      if (typeof doc.generatedAt !== "string") continue;
      const ms = Date.parse(doc.generatedAt);
      if (Number.isFinite(ms) && ms > latestMs) {
        latestMs = ms;
        latest = doc.generatedAt;
      }
    } catch {
      // 坏 JSON = 没戳；报告非真源，不炸页面
    }
  }
  return latest;
}

export function loadChapterQualityRollup(chapterId: string): ChapterQualityRollup {
  // cite / incomplete：只对有 cards 的章实算（无 entities＝未检，不装 0 假数——与书架 T55 徽同门禁）。
  const cards = loadCards({ chapterId });
  let cite = null;
  let citeMisses: { cardId: string }[] = [];
  let incompleteCardIds: string[] = [];
  if (cards.length > 0) {
    const textByPage: Record<number, string> = {};
    for (const p of loadChapterPages(chapterId)) {
      if (p.page != null) textByPage[p.page] = p.text;
    }
    cite = scoreChapter(cards, textByPage);
    citeMisses = cards.flatMap((c) => cardCiteMisses(c, textByPage));
    incompleteCardIds = cards
      .filter((c) => (c.atoms ?? []).some((a) => atomIncomplete(a)))
      .map((c) => c.id);
  }

  const rollup = buildChapterQualityRollup({
    chapterId,
    cite,
    citeMisses,
    parse: loadParseCoverage(chapterId),
    dark: loadExtractPageCoverage(chapterId),
    shallow: loadExtractPageDensity(chapterId),
    incompleteCardIds,
  });
  rollup.lastCliCheckAt = readLastCliCheckAt(chapterId);
  return rollup;
}
