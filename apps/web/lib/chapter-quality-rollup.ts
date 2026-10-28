/**
 * T63 A：章级质量 rollup 纯聚合（纯函数，无 fs、无 "use client"——server 页与 client 岛
 * 共用；ChapterQualityCockpit 等客户端组件可直接 import 类型与 helper）。
 *
 * consume-only 合同（写死 · 任何改动不得触碰）：
 * 1. **零新质量算法**——本模块只拼装既有返回值：cite-ocr-quality（scoreChapter /
 *    cardCiteMisses）、parse-ocr-coverage（scoreParseChapter）、extract-page-coverage
 *    （scoreExtractPageCoverage）、extract-page-density（scoreExtractPageDensity）、
 *    T55 incomplete 口径（atomIncomplete / scoreCard.incompleteAtoms）、T62 draft
 *    （client 用 listDraftedCardIds / cardDraftCount 后填）。禁止复制第二套阈值
 *    （SPARSE_CHAR_THR / SHALLOW_* / bigram 0.6）或另算任何分叉。
 * 2. **六概念分列**：cite 未见 ≠ parse 空/稀 ≠ 暗 ≠ 浅 ≠ incomplete ≠ draft——
 *    类型按信号分字段，缺信号用 null=未检；禁止合成单一「健康分 / 掌握% / 圆环」。
 * 3. **永不 verified:true**——rollup 没有 verified 语义；报告不得含 verified→true 指令。
 *    机检 ≠ seed 抽查 verified。
 * 4. **永不 auto PATCH / fs / fetch 写** data/cards/*.entities.json / blocks / 任何 seed。
 *    data/qa/<ch>.quality-rollup.json 是**报告非真源**（与既有 cite-ocr.json 同族）。
 * 5. **永不** Clew LLM 真写 / invent 原子补浅补暗；**永不**第四书架徽列 densify——
 *    cockpit 是书库效用区另一面，不塞进 shelf cite|parse|暗 三分列骨架。
 *
 * 孪生：scripts/chapter-quality-check.mjs（CLI `pnpm qa-check`）用 scripts/lib 同真算法
 * 拼同一形状（draft 字段 CLI 不可见——浏览器本机草稿）；server 装载见
 * apps/web/lib/chapter-quality-rollup-server.ts。
 */

/*
 * T87 desk-chapter-quality-rollup-lib-split-01：本文件收口为 barrel——铁合同 header 留此，消费者入口不变
 * （ChapterQualityCockpit / ChapterQualityCockpitRow / chapter-quality-rollup-server / desk page
 * 一律 `from "@/lib/chapter-quality-rollup"`）。实现按既有 export 组机械抽出为三件，全部既有 named
 * exports 经此 re-export 守恒：
 *   lib/chapter-quality-rollup-types.ts    ROLLUP_MISS_CARD_SAMPLE / ROLLUP_PAGE_SAMPLE / RollupCite /
 *                                          RollupParse / RollupDark / RollupShallow / RollupDraft /
 *                                          ChapterQualityRollup（DAG 根：跨 lib 仅 type-only import）
 *   lib/chapter-quality-rollup-build.ts    buildChapterQualityRollup（私有 uniqueCardIds 随行；← types）
 *   lib/chapter-quality-rollup-helpers.ts  RollupWeakFlags / rollupWeakFlags / rollupIsWeak /
 *                                          rollupAllUnchecked / RollupFold / foldChapterRollups /
 *                                          rollupCliCommands（← types）
 * 三件彼此只有相对 `.ts` import（同 T83–T86：Node 原生 type-strip 直载不解析 `@/` 别名也不补扩展名；
 * tsconfig allowImportingTsExtensions 已开）；无 fs / 无 process.env / 无 "use client" / 无 Date / 无网络 / 无 LLM。
 * 孪生 scripts/chapter-quality-check.mjs 与 chapter-quality-rollup-server.ts 本刀零触：算法体逐字未变。
 */
export * from "./chapter-quality-rollup-types.ts";
export * from "./chapter-quality-rollup-build.ts";
export * from "./chapter-quality-rollup-helpers.ts";
