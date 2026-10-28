/**
 * T68 E：Clew 本机用量记数——**本刀唯一可写文件** `data/qa/clew-usage.jsonl`（.gitignore 已列；
 * 报告非真源）。append-only 单行 JSON：ts · tier · provider · model · ok | fail(code) · tokens?
 * · auditUnmarkedOut?（T70 可选；缺字段的旧行照常解析）。
 * 永不写 entities / blocks / verified；不是云账单（不拉上游计量 API，只记本地调用事实）；
 * 非掌握度 / 非 Due。记数失败（盘只读等）只 warn 不影响答——用量是旁观者，不是门。
 * 可选 CLEW_SESSION_MAX_CALLS（服务端 env，正整数）：「本机今日」调用 ≥ 顶 → 429 session_cap
 * （自设顶，非云墙）；**各档共用计数**——换档不能绕过。
 */

/*
 * T89 desk-clew-usage-lib-split-01：本文件收口为 barrel——铁合同 header 留此，消费者入口不变
 * （app/api/clew/status/route.ts · app/api/clew/suggest/route.ts 一律 `from "@/lib/clew-usage"`；
 * scripts/clew-suggest-check.mjs 仍相对 import 本 barrel——Node 原生剥类型下 `import type` 全擦除、
 * 兄弟件相对 `.ts` 值导入可解析，可脱离 Next 直载）。实现按既有分区机械抽出为三件，全部既有
 * named exports 经此 re-export 守恒：
 *   lib/clew-usage-types.ts  CLEW_USAGE_FILE / ClewUsageLine（DAG 根；跨 lib 仅 type-only ClewTierId）
 *   lib/clew-usage-pure.ts   buildUsageLine / parseUsageLine / startOfToday / countToday /
 *                            countTodayByTier（← types；**零 import fs / path / env**）
 *   lib/clew-usage-fs.ts     appendUsage / todayUsageCount / todayUsageByTier / sessionCapReached
 *                            （私有 usagePath 随行；← types · ← pure；持既有 node:fs · node:path ·
 *                            ARIADNE_DATA · CLEW_SESSION_MAX_CALLS 服务端面职责）
 * 三件彼此只有相对 `.ts` import（同 T83–T88：Node 原生 type-strip 直载不解析 `@/` 别名也不补
 * 扩展名；tsconfig allowImportingTsExtensions 已开）；无 "use client" 指令 / 无网络 / 无 LLM。
 */
export * from "./clew-usage-types.ts";
export * from "./clew-usage-pure.ts";
export * from "./clew-usage-fs.ts";
