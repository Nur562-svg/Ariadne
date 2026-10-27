# Task 79 — desk-studysession-split-01

**Slug**: `desk-studysession-split-01`
**Title**: StudySession 诚实 mega-split · 743 行单文件机械拆成 ModeChips + EmptyPool + EmptyMode（+props 类型段）+ 编排器收口；冻结 order effect 字节 KEEP
**Tip**: `1f6f2f4`（docs T78）atop `f9774d7`（feat T78）atop `181671c`（T77 docs）
**体量**: MEGA · A–J 全交
**定稿**: 2026-10-27 Asia/Shanghai (CST)

## 一句话

T78 收掉 HeYeSession 后，`apps/web/components/StudySession.tsx` 仍是 743 行单文件（lint 护栏 2/2e/0w/SSE2，两处会话冻结 KEEP）。本刀是 T78 的 Study 侧对称刀，只做机械拆分：三处清晰本地缝（StudyModeChips 本地函数 · 队列空 early-return · 本轮完成 early-return）整段抽到 `apps/web/components/` 同级文件；三缝落地后编排器 534 行仍高于 ≤520 硬线，故与 T78 同法加第 4 件纯类型抽出——内联 props 类型段（逐 prop JSDoc）整段迁 `study-session-props.ts`（结构类型等价、零语义）。冻结 order effect（`setOrder` + 游标恢复）**字节 KEEP 留编排器**；`study/page.tsx` 零 diff；评分只写本机 `ariadne.study.v1`，不改 cite 语义。

## 铁合同（硬 · 铁）

1. **机械抽出 only**：只搬既有本地缝；ungradedDone 分型 / pendingCount 门禁 / widen CTA 优先级 / T58·T60 旁挂 / 文案 / class / href 逐字节搬（仅 dedent 2 与 props 形参化：`atoms.length`→`atomTotal`、`order.length`→`orderLength`）；禁止借拆 densify。
2. **公共 API 守恒**：`export default StudySession` 仍自 `@/components/StudySession` 导出；props 全表语义零改（destructure 留编排器，类型段整段迁 `StudySessionProps`——结构等价）；`study/page.tsx` **零 diff**。
3. **冻结 :234 字节级 KEEP**：order 冻结 effect（`setOrder(ordered)` + `loadCursor` 游标恢复 + `setResumed` + `setReady`）留编排器、函数体与前导注释逐字节一致（diff 实证）；因上方抽出体移位，其在文件内行号 234→**106**——effect 本体原样，SSE 计数不劣化。`HeYeSession:88` 零触碰。
4. **T71 uSES KEEP**：继续 `useStudyGrades`（grades 只此一源）；无 setTick 回退 / 无本地 setGrades 镜像复活。
5. **评分语义铁律**：评分只写本机 `ariadne.study.v1`（`saveGrade`/`deleteGrade` 走 `@/lib/study`，lib 零触碰）；不改 cite 语义；禁止 verified:true / 回写 seed。
6. **两处冻结 KEEP**：HeYeSession:88 cursor · StudySession order（234→106）——不 gut、不 disable 捂；本刀主题不是 lint-zero。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿（新件 eslint-disable 0；编排器 1 = 原有键盘环 exhaustive-deps 原位）。
8. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动。
9. 不 redo Clew T66–T70；不拆 DocumentPane / ClewPane / ChapterPageReader / HeYe 主流程当主题；不碰 T73/T75/T76/T78 extracts、T74/T77 entities memo。
10. J 必记：before 743 → after ≤520（目标 ≤500）；抽出件 ≥3；study/page 零 diff；冻结 effect 仍在（字节 KEEP，行号 234→106）；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；clew-check 绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip StudySession.tsx 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 26–80 | StudyModeChips 本地函数（T25 A + T26 C 档位芯片 · T38 E N=0 纯文门禁 · aria-current） | `StudyModeChips.tsx`（named export） |
| 344–453 | 队列空 early-return（T52 B ungradedDone 分型 · T28 C 诚实池大小文案 · T58/T60 评完族旁挂 · T25 A 一颗主 CTA · T28 C 放宽链 · T51 I pendingCount 门禁 · 档位芯片） | `StudyEmptyPool.tsx`（default export；`ungradedDone` 计算随迁（对称 T78 `backToOpen`）；pool/atomTotal/hrefs/pendingCount/widen/T58·T60/ret/rememberLeave 经 props） |
| 513–614 | 本轮完成 early-return（「本轮完成」+ run 计数 · T58/T60 完成态旁挂 · 续位提示 · 「再来一轮」主 CTA · 「只练不熟」次级 · 同门禁 CTA 行 · 档位芯片） | `StudyEmptyMode.tsx`（default export；restart/rememberLeave 经 props） |
| 114–188 | 内联 props 类型段（逐 prop JSDoc，75 行） | `study-session-props.ts`（`export type StudySessionProps`，整段逐字迁移——结构类型等价；为压 ≤520 硬线的 T78 对称第 4 件纯类型抽出） |
| 189–343 | hooks/store · **冻结 order effect** · 键盘/游标/焦点 effects · deskBack 页源 · rememberLeave · atoms=0 / !ready 守卫 | **留** `StudySession.tsx`（diff 实证逐字一致） |
| 455–511 | done/cur/curDeskBookId · grade · undo · restart | **留** `StudySession.tsx`（diff 实证逐字一致） |
| 616–743 | 会话主流程（进度/题面/揭示/评分/键帽/CitePeek） | **留** `StudySession.tsx`（diff 实证逐字一致） |

搬运完整性（git show HEAD 对照，写手脚本实证 7/7 True）：ModeChips 体一致（模 `export` 前缀）；EmptyPool 体一致（模 dedent 2 + `atoms.length`→`atomTotal`）；EmptyMode 体一致（模 dedent 2 + `order.length`→`orderLength`）；props 类型段逐字一致；编排器保留的 189–343 / 455–511 / 616–743 三块逐字一致。`git diff -U0` 8 个 hunk 全落在 imports / ModeChips 块 / props 类型段 / 两处空态缝，冻结 effect 与主流程零 hunk。

## OUT（本刀 + forever）

不 push · 不 densify 空态（empty-CTA 已饱和）· 不 gut 冻结 / 不 disable 捂 SSE · 不拆 HeYe 主流程 / ClewPane / DocumentPane / ChapterPageReader 当主题 · 不改 study/page 传参 · 不写 verified:true / 自动写 entities / seed-apply 可写 / bulk / LiteLLM / Auto / BYOK / 云墙 / 批量重抽 / 钥入仓 / Next 升级。

## DEFER（后续刀）

ClewPane 编排器再拆（禁作主题）· DocumentPane 再 densify（禁）· ChapterPageReader 再拆（禁）· HeYe 主流程再拆（另开）· EntityCardDetail · 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 1f6f2f4） | after（写手树） | 验收复核 |
|---|---|---|---|
| `StudySession.tsx` 行数 | **743** | **460**（≤520 达标；目标 ≤500 亦达成；三缝单独落地为 534，第 4 件类型抽出后 460） | ___ |
| 抽出文件数（≥3） | — | **4**：StudyModeChips 60 · StudyEmptyPool 177 · StudyEmptyMode 174 · study-session-props 82 | ___ |
| `study/page.tsx` diff | — | **零 diff**（default import + 传参原样） | ___ |
| 冻结 order effect | :234 `setOrder` + 游标恢复 | **字节 KEEP 留编排器**（diff 实证逐字一致；行号 234→106 纯上方抽出移位）；HeYeSession:88 原位零触碰 | ___ |
| T71 uSES / 评分语义 | useStudyGrades · ariadne.study.v1 | **同**（useStudyGrades 在用；无 setGrades/setTick 镜像；lib/study 零触碰；新件无 verified 写入） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:88 cursor · StudySession:106 order；两处冻结 KEEP 原样在；4 新文件零新增问题；无 disable） | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 16.4.0 未升级；/study 动态路由正常） | ___ |
| clew-check | 69/69 | **69/69** | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（cite ch01 卡40·原子57·有页cite195·OCR未见0；parse ch07 覆盖100.0%；page ch07 暗0；density ch07 浅0；qa ch01 不完备0，与 tip 同） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 分列正确（dry-run 报告非真源，报告文件 gitignored） | ___ |
| 未碰复核（HeYeSession/DocumentPane/ClewPane/ChapterPageReader/entities.ts） | 606/649/930/353/586 行 | **零触碰**（git status 仅 StudySession.tsx M + 4 新件；lib/ · desk/ · clew/ 零 diff） | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-79/lint-baseline.md`（tip 1f6f2f4 · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 cursor + StudySession:234 order，KEEP）；Mac 侧写手开工前实跑复核同值。
