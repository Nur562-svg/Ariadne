/**
 * 服务端数据层：直接读仓库根 config/ + data/ 下的 JSON 文件。
 * 生产化路线（Postgres + pgvector）留接口：换掉 loadCards/loadPage 即可，页面不动。
 */

/*
 * T95 desk-entities-lib-split-01：本文件收口为 barrel——铁合同 header 留此，消费者入口不变
 * （study / review / desk / ingest / entities pages · api routes · layout · DocumentPane / Overview /
 * ChapterPage* · EntityCardDetail / CiteChip / CitePeek / HeYe·Study props（type-only）· heye ·
 * book-pools · register-book · *-coverage-server · chapter-quality-rollup-server 等一律
 * `from "@/lib/entities"`）。
 * 实现按既有分区机械抽出为五件，全部既有 named exports 经此 re-export 守恒：
 *   lib/entities-types.ts     Cite / Atom / EntityCard / PageDoc / ChapterDoc / ChapterConfig /
 *                             BookConfig / ArtifactFingerprint / Material / MaterialStage
 *                             （DAG 根：零 import · 无 fs · 零 sibling）
 *   lib/entities-io.ts        repoRoot / entitiesCacheStats / clearEntitiesCache / readJsonMemoized
 *                             + 私有 readJson · JsonMemoEntry · jsonMemo · deepFreeze · statFingerprint
 *                             （T74 指纹 memo 口径逐字：`${floor(mtimeMs)}:${size}` · null 永不命中 ·
 *                             无 TTL；← node:fs / node:path only；禁 import loaders / query / materials）
 *   lib/entities-loaders.ts   loadChapters / loadBooks / loadCards / loadCard / loadCardDocMeta /
 *                             loadChapterPages / loadAllChapterPages / findPageByPrinted /
 *                             loadBookValidPages + 私有 isUsableCard（← types + io；禁 import query / materials）
 *   lib/entities-query.ts     StudyAtom / PageCiteHit / PageCitingCard / cardsCitingPage /
 *                             collectStudyAtoms（← types + loaders；无 fs；禁 import materials）
 *   lib/entities-materials.ts loadMaterials / chapterHasBlocks / chapterHasCards / fingerprintFile /
 *                             snapshotArtifactBaseline / materialChapterHasBlocks / materialChapterHasCards /
 *                             deriveMaterialStage + 私有 fingerprintsDiffer · materialOwnsArtifact
 *                             （← types + io + loaders；T77 memo 口径 · 状态机磁盘事实推导逐字；禁 import query）
 * 五件彼此只有相对 `.ts` import（同 T83–T94：tsconfig allowImportingTsExtensions 已开）；
 * 唯一可见性变更：readJsonMemoized 由私有升 named export 供 loaders / materials 跨文件使用
 * （签名 / 语义零改）。tip 无 "use client" / "server-only" 指令，五件与 barrel 保持无。
 */
export * from "./entities-types.ts";
export * from "./entities-io.ts";
export * from "./entities-loaders.ts";
export * from "./entities-query.ts";
export * from "./entities-materials.ts";
