# Task 78 — desk-heyesession-split-01

**Slug**: `desk-heyesession-split-01`
**Title**: HeYeSession 诚实 mega-split · 996 行单文件机械拆成 ModeChips + EmptyPool + EmptyMode（+props 类型段）+ 编排器收口；冻结游标 effect 字节 KEEP
**Tip**: `181671c`（docs T77）atop `79da162`（feat T77）atop `9fdce29`（T76 docs）
**体量**: MEGA · A–J 全交
**定稿**: 2026-10-27 Asia/Shanghai (CST)

## 一句话

T73/T75/T76 收掉三大桌面文件后，`apps/web/components/HeYeSession.tsx` 仍是 996 行单文件（lint 护栏 2/2e/0w/SSE2，仅剩两处会话冻结 KEEP）。本刀只做机械拆分：三处清晰本地缝（HeYeModeChips 本地函数 · 池空 early-return · 档空/完成 early-return）整段抽到 `apps/web/components/` 同级文件，外加内联 props 类型段（逐 prop JSDoc）整段迁 `heye-session-props.ts`（结构类型等价、零语义；为压 ≤650/≤620 行数硬线的第 4 件纯类型抽出）。冻结 mount effect（setIndex 游标恢复 + 既有 exhaustive-deps disable）**字节 KEEP 留编排器**；`curCite.verified === false` 恒定；`review/page.tsx` 零 diff。

## 铁合同（硬 · 铁）

1. **机械抽出 only**：只搬既有本地缝；emptyKind 三分型 / orphan CTA 优先级 / atomCount 池门禁 / 文案 / class / href 逐字节搬（仅 dedent 与 props 形参化）；禁止借拆 densify。
2. **公共 API 守恒**：`export default HeYeSession` 仍自 `@/components/HeYeSession` 导出；props 全表语义零改（destructure 留编排器，类型段整段迁 `HeYeSessionProps`——结构等价）；`review/page.tsx` **零 diff**。
3. **冻结 :218 字节级 KEEP**：mount effect（setIndex 游标恢复 + exhaustive-deps disable）留编排器、函数体逐字节一致（diff 实证）；因上方抽出体移位，其在文件内行号 218→**88**——effect 本体与 disable 原样，SSE 计数不劣化。`StudySession:234` 零触碰。
4. **T71 uSES KEEP**：继续 `useHeYeStore`（store 只此一源）；无 setTick 回退 / 无本地 setStore 镜像。
5. **verified 铁律**：`curCite.verified === false` 恒定（主流程逐字节保留，diff 实证）；本机已对只写 localStorage；禁止 verified:true / 回写 seed。
6. **两处冻结 KEEP**：HeYeSession 游标 effect · StudySession:234 order——不 gut、不 disable 捂；本刀主题不是 lint-zero。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿。
8. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动。
9. 不 redo Clew T66–T70；不拆 DocumentPane / ClewPane / ChapterPageReader / StudySession 当主题；不碰 T73/T75/T76 extracts、T74/T77 entities memo。
10. J 必记：before 996 → after ≤650（目标 ≤620）；抽出件 ≥3；review/page 零 diff；冻结 effect 仍在（字节 KEEP，行号 218→88）；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；clew-check 绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip HeYeSession.tsx 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 28–82 | HeYeModeChips 本地函数（T25 A 档位芯片 · T38 E N=0 纯文门禁） | `HeYeModeChips.tsx`（named export） |
| 347–519 | 池空 early-return（T52 C emptyKind 三分型 · T58 F orphan×dark 旁挂 · T29 C orphan 主 CTA 优先级 · T51 J atomCount 门禁 · T28 A 清本页次级） | `HeYeEmptyPool.tsx`（default export；emptyKind/orphan/atomCount/CTA/芯片经 props） |
| 521–653 | 档空/完成 early-return（open 完成绿条 + resetStore 链 · 非 open「这个档还没有本机记录」· 同门禁 CTA 行） | `HeYeEmptyMode.tsx`（default export；resetStore/rememberLeave 经 props；backToOpen 计算随迁） |
| 113–189 | 内联 props 类型段（逐 prop JSDoc，77 行） | `heye-session-props.ts`（`export type HeYeSessionProps`，整段逐字迁移——结构类型等价） |
| 190–343 | hooks/store · **冻结 mount effect** · 游标/键盘/焦点 effects · advance/resetStore/rememberLeave | **留** `HeYeSession.tsx`（diff 实证逐字一致） |
| 655–996 | 会话主流程（进度/键帽/左右栏/打标/同页批量/OCR） | **留** `HeYeSession.tsx`（diff 实证逐字一致） |

搬运完整性（git show HEAD 对照，写手 diff 实证）：三 JSX 迁移体逐字节一致（模 dedent 2 / props 形参化）；ModeChips 体一致（模 `export` 前缀）；props 类型段逐字一致（模 `}: {` → `export type … = {` 两行包装）；冻结 mount effect 与 190–343 逻辑块、655–996 主流程块逐字一致。

## OUT（本刀 + forever）

不 push · 不 densify 空态（empty-CTA 已饱和）· 不 gut 冻结 / 不 disable 捂 SSE · 不拆 StudySession / ClewPane / DocumentPane / ChapterPageReader 当主题 · 不改 review/page 传参 · 不写 verified:true / 自动写 entities / seed-apply 可写 / bulk / LiteLLM / Auto / BYOK / 云墙 / 批量重抽 / 钥入仓 / Next 升级。

## DEFER（后续刀）

StudySession mega-split（另开）· HeYe 主流程再拆（同页批量块/OCR 右栏）· ClewPane 编排器再拆（禁作主题）· DocumentPane 再 densify（禁）· ChapterPageReader 再拆（禁）· EntityCardDetail · 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· invent heye-only · Register 硬门禁 · quiz densify。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 181671c） | after（写手树） | 验收复核 |
|---|---|---|---|
| `HeYeSession.tsx` 行数 | **996** | **606**（≤650 达标；目标 ≤620 亦达成） | ___ |
| 抽出文件数（≥3） | — | **4**：HeYeModeChips 60 · HeYeEmptyPool 227 · HeYeEmptyMode 187 · heye-session-props 85 | ___ |
| `review/page.tsx` diff | — | **零 diff**（default import + 传参原样） | ___ |
| 冻结 mount effect | :218 setIndex + exhaustive-deps disable | **字节 KEEP 留编排器**（diff 实证逐字一致；行号 218→88 纯上方抽出移位）；StudySession:234 原位零触碰 | ___ |
| `curCite.verified === false` | 恒 false | **恒 false**（主流程逐字节保留） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession 游标 effect :88 · StudySession:234；两处冻结 KEEP 原样在；新文件零新增问题；无 disable） | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级） | ___ |
| clew-check | 69/69 | **69/69** | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（cite ch01 卡40·原子57·有页cite195·OCR未见0；parse ch07 覆盖100.0%；page ch07 暗0；density ch07 浅0；qa ch01 不完备0，与 tip 同） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 分列正确（dry-run 报告非真源） | ___ |
| 未碰复核（DocumentPane/ClewPane/ChapterPageReader/StudySession/entities） | 649/930/353/743/586 行 | **零触碰**（git status 仅 HeYeSession.tsx + 4 新件） | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-78/lint-baseline.md`（tip 181671c · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:218 cursor + StudySession:234 order，KEEP）。
