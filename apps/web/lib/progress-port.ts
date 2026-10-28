/**
 * 本机进度可移植（Task 24 C）：把 ariadne.study.v1 / ariadne.heye.v1 打包成明文 JSON
 * 导出带走、再合并或替换导入。只读写这两个既有键（STUDY_STORE_KEY / HEYE_STORE_KEY），
 * 禁止改名；绝不写 seed、绝不碰 verified；纯客户端，无任何云同步语义。
 *
 * payload 形状（v1）：
 * {
 *   "v": 1,
 *   "exportedAt": "2026-10-19T05:00:00.000Z",
 *   "study": { "<cardId>/<atomId>": { "k": 0 | 1, "t": 1760000000000 } },
 *   "heye":  { "<cardId>|<page>|…":  { "s": "checked" | "doubt", "t": 1760000000000 } }
 * }
 *
 * 导入规则（固化）：
 * - merge：按键逐条合并，**t 较新者胜**——导入条 t > 本机条 t 才覆盖；本机没有该键直接收入；
 *   本机多出的键保留。适合「换浏览器后把新评过的记录并回来」。
 * - replace：两个键整体覆盖为导入内容（本机原有记录清零）。适合「确认要迁移」。
 * - 非法 JSON / v != 1 / study·heye 缺失或条目形状不符 → 返回错误且**不写任何键**
 *   （fail-closed，绝不静默清空本机库）。
 * 写入后广播既有订阅（LocalProgressStrip 等）重读本机库，UI 立即如实更新。
 */

/*
 * T93 desk-progress-port-lib-split-01：本文件收口为 barrel——铁合同 header 留此，消费者入口不变
 * （ProgressPortability 一律 `from "@/lib/progress-port"`）。
 * 实现按既有分区机械抽出为三件，全部既有 named exports 经此 re-export 守恒：
 *   lib/progress-port-types.ts   PROGRESS_PAYLOAD_VERSION / ProgressPayload / ParseResult /
 *                                ImportResult（DAG 根；仅 type-only 引 @/lib/heye-store
 *                                HeYeStore · @/lib/study GradeMap；零 sibling import）
 *   lib/progress-port-pure.ts    parseProgressPayload（私有 isRecord · isValidStudyMark ·
 *                                isValidHeYeMark 随行不外泄；← types；HeYeMark/HeYeStore/
 *                                GradeMap type-only 跨 lib；无 setItem / notify*）
 *   lib/progress-port-persist.ts exportProgressPayload / importProgressPayload（← types；
 *                                值引 @/lib/study + @/lib/heye-store；merge t 较新者胜 ·
 *                                replace 整键 · fail-closed · 写后双 notify 逐字未动）
 * 三件彼此只有相对 `.ts` import（同 T83–T92：tsconfig allowImportingTsExtensions 已开）；
 * 两既有键名仍经 @/lib/study（STUDY_STORE_KEY）/ @/lib/heye-store（HEYE_STORE_KEY）守恒。
 */
export * from "./progress-port-types.ts";
export * from "./progress-port-pure.ts";
export * from "./progress-port-persist.ts";
