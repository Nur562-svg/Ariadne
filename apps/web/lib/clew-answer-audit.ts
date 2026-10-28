/**
 * T70 A·B：Clew 答面事后核账（纯函数）。
 * 无 "use client"、无 fs、无 process.env、无 Date、无网络：服务端 route 与客户端 ClewPane
 * 同源 import；scripts/clew-suggest-check.mjs 直接 import 本 .ts。
 *
 * 铁合同（本文件每个函数都遵守）：
 *   1. 只标注，不改写：不修改入参文本的任何字符；不写 entities / blocks / verified / PATCH。
 *   2. 审计 ≠ 核验：grounded 只表示该页在本次给模型的窗内。文案与返回值禁用
 *      「已核 / 正确 / verified:true」。
 *   3. 永不 bulk：只看本次答文 + 调用方给的 basis。不扫全书、不跨章、不调 LLM。
 *   4. 原子 / 实体只认既有 id 的精确相等：不新建、不大小写折叠、不前缀/模糊匹配到别的 id。
 *   5. fail-closed：safeAuditClewAnswer / coerceClewAnswerAudit 遇异常或坏形 →
 *      { error: "audit_unavailable" }，绝不默认全绿。
 */

/*
 * T85 desk-clew-answer-audit-lib-split-01：本文件收口为 barrel——铁合同五条留此，消费者入口不变
 * （route / ClewPane / ClewAuditView / clew-pane-helpers 一律 `from "@/lib/clew-answer-audit"`；
 * clew-suggest-check.mjs 仍直接 import 本 .ts）。实现按既有 export 组机械抽出为四件，全部既有
 * named exports 经此 re-export 守恒：
 *   lib/clew-answer-audit-types.ts    形状 types + 常量 + isPrintedPage（DAG 根：无 import）
 *   lib/clew-answer-audit-extract.ts  normalize / fence / collect / extractAnswerRefs
 *   lib/clew-answer-audit-core.ts     buildAuditBasis / audit / safe / coerce / isAuditUnavailable
 *   lib/clew-answer-audit-surface.ts  takeaway / AnswerSegment / segment / relatedCardAtoms / hrefs
 * 四件彼此只有相对 `.ts` import（同 T83/T84：Node 原生 type-strip 直载不解析 `@/` 别名也不补扩展名；
 * tsconfig allowImportingTsExtensions 已开）；无 fs / 无 process.env / 无 "use client"。
 */
export * from "./clew-answer-audit-types.ts";
export * from "./clew-answer-audit-extract.ts";
export * from "./clew-answer-audit-core.ts";
export * from "./clew-answer-audit-surface.ts";
