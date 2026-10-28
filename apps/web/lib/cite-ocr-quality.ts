/**
 * T54 A：cite quote ↔ OCR 原文机检质量算法（bigram 覆盖 ≥0.6，与 data/qa 抽查口径同族）。
 * 无 "use client"——server 页与 client 岛共用；不 import 任何含 fs 的模块（类型 import
 * 编译期擦除），故 HeYeSession / DocumentPane 等客户端组件可直接引用。
 *
 * 只读：绝不把结果写回 data/cards 的 verified——「OCR 未见」是与 seed 抽查 verified
 * **分列**的机检信号（可能 OCR 误差，也可能抽取出错），两个概念互不写入。
 *
 * 孪生实现：scripts/lib/cite-ocr-quality.mjs（CLI / extract 后置用，纯 JS 同算法）——
 * **两处必须同步改**（keep in sync）；判定口径只有这一份，禁止 substring-only 分叉。
 */

/*
 * T86 desk-cite-ocr-quality-lib-split-01：本文件收口为 barrel——铁合同 header 留此，消费者入口不变
 * （EntityCardDetail / HeYeSession / DocumentCardTile / desk·ingest page / chapter-quality-rollup*
 * 一律 `from "@/lib/cite-ocr-quality"`）。实现按既有 export 组机械抽出为三件，全部既有 named exports
 * 经此 re-export 守恒：
 *   lib/cite-ocr-quality-match.ts         CiteLike / QualityCardLike / normalizeText / bigramCoverage /
 *                                         quoteInOcr / citeOcrMiss / enumerateCardCites（DAG 根：无 import）
 *   lib/cite-ocr-quality-neighborhood.ts  CiteQuality / emptyQuality / OcrNeighborhood / ocrNeighborhood /
 *                                         suggestQuoteFromOcr（← match）
 *   lib/cite-ocr-quality-score.ts         scoreCard / scoreChapter / cardCiteMisses（← match · ← neighborhood）
 * 三件彼此只有相对 `.ts` import（同 T83–T85：Node 原生 type-strip 直载不解析 `@/` 别名也不补扩展名；
 * tsconfig allowImportingTsExtensions 已开）；无 fs / 无 process.env / 无 "use client" / 无 Date / 无网络 / 无 LLM。
 * 孪生 scripts/lib/cite-ocr-quality.mjs 本刀零触：算法体逐字未变，keep-in-sync 合同仍同真。
 */
export * from "./cite-ocr-quality-match.ts";
export * from "./cite-ocr-quality-neighborhood.ts";
export * from "./cite-ocr-quality-score.ts";
