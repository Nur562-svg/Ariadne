/**
 * T66 C / T67 C·D·E / T69 A·B·C·D / T70 D·F：Clew 只读建议——请求体校验 + 系统提示 + 书桌上下文拼装 +
 * 按档 grounding 策略（long-context 同章有界多页；全超顶仍报 pagesOmitted）+ 剪贴板带走 +
 * 流事件编码 + 结构化补丁解析（before 从 seed 只读对齐）（纯函数）。
 * 无 "use client"、无 import、无 fs、无 process.env：服务端 route 与客户端 ClewPane 共用形状，
 * scripts/clew-suggest-check.mjs 直接 import 本 .ts（Node ≥ 23.6 原生剥类型）。
 * 核账纯函数在 clew-answer-audit.ts；本文件只留与它对齐的带走行，避免给本文件加 import。
 *
 * 铁合同（本文件每个函数都遵守；route.ts / ClewPane 同守）：
 *   1. 只读答：只产出提示串与文本；永不指示模型或调用方写 entities / blocks / verified:true / PATCH。
 *   2. 永不 bulk：一次请求 = 一问 + 当前书桌上下文；chapters[] / pages[] / questions[] /
 *      extract·parse·ingest 作业形一律 4xx 拒收（parseSuggestBody）。
 *   3. 不做诊断：系统提示写死；回答 ≠ seed verified ≠ heye 已对 ≠ study 已练。
 *   4. 页码只采信请求上下文：模型自造页码须标「未核验」；系统提示明示只能引用给定页。
 *   5. 钥不经此文件：不读 env、不碰 key；流事件（encodeClewStreamEvent）只携带公开投影
 *      （provider 名 + 模型名），永不携带 apiKey / baseURL。
 *   6. T67 结构化补丁：仅可对**服务端 grounding 列出的既有原子/字段**建议填空；解析侧
 *      （parseSuggestPatchEntries）target 白名单过滤——发明 id / 未知 field / verified 意图
 *      一律丢弃；进本机草稿永远要用户显式粘贴或点击（G），发送回调永不静默 setAtomDraft。
 *   7. T69 Long-context 有界铁顶：接地扩窗**同章 only**（LONG_PAGES_MAX 页 / LONG_TOTAL_CHARS_MAX
 *      字，常量写死）；单页仍 truncate；缺章/缺 blocks 诚实降级单页；fast/reasoning 恒单页。
 *      扩窗是服务端自取，**不是**客户端作业——pages[] 作业形仍 422（铁合同 2）。
 */

/*
 * T84 desk-clew-suggest-lib-split-01：本文件收口为 barrel——铁合同七条留此，消费者入口不变
 * （route / ClewPane / clew-pane-helpers 一律 `from "@/lib/clew-suggest"`；clew-suggest-check.mjs
 * 仍直接 import 本 .ts）。实现按既有分区机械抽出为四件，全部既有 named exports 经此 re-export 守恒：
 *   lib/clew-suggest-types.ts      形状 types + 全量常量 + isPrintedPage（DAG 根：无 import；
 *                                  wire 同构类型仍字面声明，不 import clew-answer-audit）
 *   lib/clew-suggest-grounding.ts  T69 A 按档 grounding 策略 / 选页 / 装窗收口 / 诚实脚注 + 截断
 *   lib/clew-suggest-parse.ts      请求体校验（JOB_SHAPE 拒 bulk 422 / sanitizeContext / parseSuggestBody）
 *   lib/clew-suggest-compose.ts    系统提示 / T67 补丁指令·白名单·解析 / 上下文拼装 / buildPrompt /
 *                                  F 带走·补丁信封 / T67 C 流事件编码
 * 四件彼此只有相对 `.ts` import（同 T83：Node 原生 type-strip 直载不解析 `@/` 别名也不补扩展名；
 * tsconfig allowImportingTsExtensions 已开）；无 fs / 无 process.env / 无 "use client"。
 */
export * from "./clew-suggest-types.ts";
export * from "./clew-suggest-grounding.ts";
export * from "./clew-suggest-parse.ts";
export * from "./clew-suggest-compose.ts";
