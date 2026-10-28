/**
 * 书库「上次打开的书」续开指针（T21 desk-library-shelf-continuity-01）
 * + 最近书栈（T22 desk-ingest-shelf-register，多书换书 / 换书保留他书停留页）。
 *
 * 两条 localStorage key（与既有存储正交，勿混）：
 * - ariadne.desk.last-opened.v1 — 单一 bookId 指针（T21 骨架，loadLastOpened 仍返回栈顶）。
 * - ariadne.desk.recent-books.v1 — 最近栈（最多 5 条，去重，栈顶即「继续上次」）。
 *
 * 边界：
 * - 不是 ariadne.study.v1 / ariadne.heye.v1（本机练/核记录）——不得改名/迁移它们。
 * - 不是 ariadne.desk.session.v1（T20 sessionStorage 游标桶，关标签即清）——那是「本标签续位」，
 *   这是「跨日书架读哪本 + 换书不丢他书续开」，语义/生命周期不同，绝不复用。
 *
 * 本模块不 import fs / entities（客户端安全引入）；全部读写 try/catch（隐私模式 localStorage 可能不可用）。
 */

/*
 * T88 desk-last-opened-lib-split-01：本文件收口为 barrel——边界铁律 header 留此，消费者入口不变
 * （LastOpenedTouch · StudySession · RegisterMaterialButton · LibraryContinuity · ShelfBookContinuity ·
 * desk/BookSwitcher · desk/DocumentPane · desk/ReturnNav · desk/Sidebar 一律 `from "@/lib/last-opened"`）。
 * 实现按既有分区机械抽出为三件，全部既有 named exports 经此 re-export 守恒：
 *   lib/last-opened-types.ts    LAST_OPENED_KEY / RECENT_BOOKS_KEY / LastOpened（DAG 根：无 import）
 *   lib/last-opened-persist.ts  loadLastOpened / loadRecentBooks / saveLastOpened / touchLastOpened /
 *                               clearLastOpened / subscribeLastOpened（私有 RECENT_MAX · parseEntry ·
 *                               persistLastOpened · listeners · emitLastOpenedChanged 随行；← types）
 *   lib/last-opened-heal.ts     sanitizeOpenedPage / healOpenedIfDirty（私有 pageInHref 随行；
 *                               ← types · ← persist；persist 零 import heal，DAG 无环）
 * 三件彼此只有相对 `.ts` import（同 T83–T87：Node 原生 type-strip 直载不解析 `@/` 别名也不补扩展名；
 * tsconfig allowImportingTsExtensions 已开）；persist 职责允许既有 typeof window / localStorage /
 * Date.now / try-catch；无 fs / 无 process.env / 无 "use client" 指令 / 无网络 / 无 LLM。
 */
export * from "./last-opened-types.ts";
export * from "./last-opened-persist.ts";
export * from "./last-opened-heal.ts";
