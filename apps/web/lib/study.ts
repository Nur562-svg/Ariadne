/**
 * 学习环本机自评存取（客户端专用；与 lib/heye.ts 对称但只跑在浏览器）：
 * key 仍是 ariadne.study.v1 —— Record<`${cardId}/${atomId}`, { k: 0|1; t: number }>。
 * 这里不做 FSRS / Due 调度：只有「认识 / 不熟 / 未评」本机三态，
 * 评分绝不回写 seed JSON，也不改变 cite / verified 语义。
 */

/*
 * T92 desk-study-lib-split-01：本文件收口为 barrel——铁合同 header 留此，消费者入口不变
 * （use-study-grades · progress-port · StudySession · StudyScopeCounts · LocalProgressStrip ·
 * StickyStudyModeTabs · StudyModeChips · StudyEmptyPool · StudyEmptyMode · study-session-props ·
 * study/page（type-only）一律 `from "@/lib/study"`）。
 * 实现按既有分区机械抽出为三件，全部既有 named exports 经此 re-export 守恒：
 *   lib/study-types.ts   STUDY_STORE_KEY / GradeMap / StudyMode（DAG 根：零 import；零 entities）
 *   lib/study-persist.ts loadGrades / subscribeStudyGrades / notifyGradesExternalChange /
 *                       saveGrade / deleteGrade（私有 listeners · emitGradesChanged 随行不外泄；
 *                       ← types；禁 import pure / entities）
 *   lib/study-pure.ts    atomKey / filterAtomsByMode / countPoolGrades / orderAtoms
 *                       （← types type-only · StudyAtom type-only 自 @/lib/entities；
 *                       无 window / localStorage）
 * 三件彼此只有相对 `.ts` import（同 T83–T91：tsconfig allowImportingTsExtensions 已开）；
 * saveGrade / deleteGrade「拼 next → try setItem → emit」先落盘后广播逐字未动
 * （T71 use-study-grades 微任务订阅契约依赖此序）；StudyAtom 仍 type-only 引、不经 barrel 再导出。
 */
export * from "./study-types.ts";
export * from "./study-persist.ts";
export * from "./study-pure.ts";
