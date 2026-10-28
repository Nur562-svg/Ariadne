/**
 * 核页本机态存取（客户端专用；与 lib/study.ts 对称，跑在浏览器）：
 * key 仍是 ariadne.heye.v1（与 T12 HeYeSession 一致，勿丢已有本机记录）——
 * Record<citeKey, { s: "checked"|"doubt"; t: number }>。
 * 本模块不 import lib/entities / lib/heye（二者含 fs），保证可被客户端安全引入；
 * 不做 FSRS / Due；「本机已对/存疑」绝不回写 seed JSON，也不改变 cite / verified 语义。
 */

/*
 * T91 desk-heye-store-lib-split-01：本文件收口为 barrel——铁合同 header 留此，消费者入口不变
 * （use-heye-store · progress-port · HeYeSession · HeYeScopeCounts · LocalProgressStrip ·
 * StickyHeYeModeTabs · ClewQueuePanel · HeYeModeChips · HeYeEmptyPool · HeYeEmptyMode ·
 * heye-session-props · review/page（type-only）一律 `from "@/lib/heye-store"`）。
 * 实现按既有分区机械抽出为三件，全部既有 named exports 经此 re-export 守恒：
 *   lib/heye-store-types.ts   HEYE_STORE_KEY / HeYeMark / HeYeStore / HeYeMode /
 *                             HeYeFilterable（DAG 根：零 import）
 *   lib/heye-store-persist.ts loadHeYeStore / subscribeHeYeStore / notifyHeYeExternalChange /
 *                             setHeYeMark / setHeYeMarks / clearHeYeMarks（私有 save·emit·
 *                             listeners 随行不外泄；← types；禁 import pure）
 *   lib/heye-store-pure.ts    filterItemsByMode / countPoolMarks（← types type-only；
 *                             无 window / localStorage）
 * 三件彼此只有相对 `.ts` import（同 T83–T90：Node 原生 type-strip 直载不解析 `@/` 别名
 * 也不补扩展名；tsconfig allowImportingTsExtensions 已开）；emit→save 顺序与
 * clearHeYeMarks 范围清除口径逐字未动（T71 use-heye-store 订阅契约依赖 emit-then-save）。
 */
export * from "./heye-store-types.ts";
export * from "./heye-store-persist.ts";
export * from "./heye-store-pure.ts";
