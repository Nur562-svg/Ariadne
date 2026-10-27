# Task 81 — desk-cockpit-split-01

**Slug**: `desk-cockpit-split-01`
**Title**: ChapterQualityCockpit 诚实 mid-split · 377 行单文件机械拆成 Row（+UncheckedCell）+ shared 常量/pct + 编排器收口；两处会话冻结零触碰
**Tip**: `e694eff`（docs T80）atop `4b928eb`（feat T80）atop `63a46ef`（T79 docs）
**体量**: mid · A–J 全交
**定稿**: 2026-10-27 Asia/Shanghai (CST)

## 一句话

T73–T80 mega/mid 波次收掉后，`apps/web/components/ChapterQualityCockpit.tsx` 仍是 377 行单文件，内含一处清晰本地 function 缝（`ChapterRow` :174–377，单章六分列 + 弱章展开行）、一个 fail-closed 小件（`UncheckedCell` :43–49）与编排器/Row 共用的顶部常量（`COCKPIT_DISCLAIMER` · `th/td/muted/amber` · `pct` :30–40）。本刀只做机械拆分：`UncheckedCell` + `ChapterRow` 整段抽到同级 `ChapterQualityCockpitRow.tsx`（函数名对齐文件名，T80 DraftInboxPort 同例），五共用件迁 `chapter-quality-cockpit-shared.ts`（named export）。编排器留 default export · props · `useAtomDraftStore` · `draftByChapter/fold/weakIds` useMemo · details 折叠壳 · 汇总 summary · 表头 · map Row（渲染 JSX 同 tip，模一处标签名）。`desk/page.tsx` 零 diff；HeYeSession:88 / StudySession:106 两处冻结零触碰。

## 铁合同（硬 · 铁）

1. **机械抽出 only**：只搬既有本地缝；disclaimer / 六信号 cell / 弱章展开 / CLI 标签 / why·title 文案 / class / href 逐字节搬（Row 函数体与 tip 逐字节一致，仅声明行 `function ChapterRow(` → `export default function ChapterQualityCockpitRow(`）；禁止借拆 densify。
2. **公共 API 守恒**：`export default ChapterQualityCockpit` 仍自 `@/components/ChapterQualityCockpit`；props（`books` / `chapterTitles` / `rollupByChapter` / `cardIndex`）语义零改；`desk/page.tsx` **零 diff**（`:22` default import · `:481` 传参原样）。
3. **两处冻结 KEEP**：HeYeSession:88 cursor · StudySession:106 order——本刀零触碰（git diff 为空）；不 gut、不 eslint-disable 捂 SSE。
4. **T71 uSES KEEP**：继续 `useAtomDraftStore`；无 setTick 回退 / 无本地镜像 store 复活；草稿列交叉口径（`listDraftedCardIds ∩ 本章卡` · `cardDraftCount` 求和）零改。
5. **驾驶舱语义铁律**：consume-only；六信号分列；`COCKPIT_DISCLAIMER` 四 ≠ 文案原样（机检 ≠ verified · cockpit ≠ seed 已核 · 草稿 ≠ 已写回 · data/qa ≠ 真源）；禁止 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键重抽写回」；禁止掌握% / Due / 单一健康分 / 第四书架徽列。
6. **抽出 ≠ densify**：折叠壳 / 汇总 / 表头留编排器，渲染 JSX 与 tip 逐字节一致（编排器函数 :51–171 区段**仅 1 处单词级替换**：`:145` JSX 标签 `<ChapterRow` → `<ChapterQualityCockpitRow`）；Row JSX 同 tip。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；新件 eslint-disable 0；不引入新的同步 effect 内 setState（本件本就无 effect）。
8. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动。
9. 不 redo Clew T66–T70；不拆 DocumentPane / ClewPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / EntityCardDetail 当主题；不碰 T73–T80 extracts、T74/T77 entities memo。
10. J 必记：before 377 → after ≤220（目标 ≤180）；抽出件 ≥1（ChapterRow）；desk/page 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在（HeYe:88 · Study:106）；tsc 0；build PASS；clew-check 绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip ChapterQualityCockpit.tsx 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 29–40 | `COCKPIT_DISCLAIMER` 四 ≠ 诚实文案（含 H 注释）· `th` / `td` / `muted` / `amber` 表格 class · `pct` 百分比格式 | `chapter-quality-cockpit-shared.ts`（named export；字符串 / class / pct 行为零改，仅加 `export`；12 行 diff IDENTICAL） |
| 42–49 | `UncheckedCell`（未检 fail-closed，缺 blocks/entities 不装完美 0；why title 文案零改） | `ChapterQualityCockpitRow.tsx`（**非导出**本地 function——仅 Row 用，编排器不引用；8 行 diff IDENTICAL） |
| 173–377 | `ChapterRow` JSDoc + 函数（六分列 cell · 弱章展开行 · /desk/card/<id> · /viewer/<page> 深链 · CopyCommand 只读机检命令 · 草稿链 · lastCliCheckAt 旁注） | `ChapterQualityCockpitRow.tsx`（default export `ChapterQualityCockpitRow`；`chapterId / title / rollup / draft / weak / allUnchecked` 经 props，形参表同 tip；205 行 diff IDENTICAL 模声明行） |
| 16–27 | T63 编排器 JSDoc | **留**（逐字一致；块内续写 4 行 T81 旁注——注释非 JSX） |
| 51–171 | 编排器：default export · props · `useAtomDraftStore` · `draftByChapter` / `allRollups` / `fold` / `weakIds` useMemo · `<details>` 折叠壳 · 弱章/机检净 summary · 表头 · map Row · CLI 孪生脚注 | **留** `ChapterQualityCockpit.tsx`（121 行 diff IDENTICAL 模 `:145` 标签名） |
| 3–14 | import 区 | 整理：删随 Row 迁走的 `Link` / `CopyCommand` / `rollupCliCommands`（否则 lint 新增 unused 错误）；加 Row + shared 共 2 行 import |

搬运完整性（`git show e694eff` 对照，写手脚本实证 **5 段**）：shared 12 行一致（模 `export`）；UncheckedCell 8 行一致；ChapterRow 205 行一致（仅声明行改名 + export）；编排器 121 行一致（模 1 处标签名）；T63 JSDoc 11/12 行一致（末行 `*/` → ` *` 因块内续写旁注）。`git diff -U0` **8 hunk** = 3 处 import 删除 + 1 处 2 行 import 加入 + 1 处 4 行头注续写 + 1 处 23 行 shared+UncheckedCell 块删除 + 1 处单行标签名替换（`:145`）+ 1 处尾部 206 行 ChapterRow 删除。

## OUT（本刀 + forever）

不 push · 不 densify 六信号（文案 / class / href / 弱章门禁原样）· 不造掌握% / Due / 单一健康分 / 健康圆环 / 第四书架徽列 · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / EntityCardDetail 当主题 · 不改 desk/page 传参 · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键重抽写回」/ bulk / LiteLLM / Auto / BYOK / 云墙 / 批量重抽 / 钥入仓 / Next 升级 · 不发明或改名既有 storage keys · 不把 draft 塞进 progress-port。

## DEFER（后续刀）

EntityCardDetail（tip 复测仅 citeStats/firstPagedCite 薄 helpers；fields/atoms/补救 JSX 缝稠且缠 OCR/草稿 densify——另开）· ClewPane 编排器再拆（禁作主题）· DocumentPane 再 densify（禁）· ChapterPageReader 再拆（禁）· HeYe/Study 主流程再拆（禁）· DraftInbox 再拆（禁）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip e694eff） | after（写手树） | 验收复核 |
|---|---|---|---|
| `ChapterQualityCockpit.tsx` 行数 | **377** | **151**（≤220 达标；目标 ≤180 亦达成） | ___ |
| 抽出件（≥1）+ shared | — | **1 + 1**：ChapterQualityCockpitRow 228（含 UncheckedCell）· chapter-quality-cockpit-shared 17 | ___ |
| `desk/page.tsx` diff | — | **零 diff**（`:22` default import + `:481` books/chapterTitles/rollupByChapter/cardIndex 传参原样） | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（两文件 git diff 为空；lint 仍精确报 `:88:9` / `:106:5`） | ___ |
| T71 uSES / 草稿交叉 | useAtomDraftStore · listDraftedCardIds ∩ cardIndex · cardDraftCount 求和 | **同**（hook 在用；`draftByChapter` useMemo 逐字一致；`lib/` 零 diff） | ___ |
| 驾驶舱语义 | consume-only · 六信号分列 · 四 ≠ disclaimer · 未检 fail-closed | **同**（字符串/class/href 零改；无 verified 写入；无掌握%/健康分） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:88:9 · StudySession:106:5；3 件零新增问题；无 disable） | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 16.4.0 未升级；Compiled successfully；/desk · /entities 仍 ƒ dynamic） | ___ |
| clew-check | 69/69 | **69/69** | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（cite ch01 卡40·原子57·有页cite195·OCR未见0；parse ch07 覆盖100.0%；page ch07 暗0；density ch07 浅0；qa ch01 不完备0，与 tip 同） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 分列正确（dry-run 报告非真源，gitignored；data/cards·chapters·config 零脏） | ___ |
| 未碰复核（HeYeSession/StudySession/DocumentPane/ClewPane/ChapterPageReader/EntityCardDetail/DraftInbox/entities.ts） | 606/460/649/930/353/552/239/586 行 | **零触碰**（git status 仅 ChapterQualityCockpit.tsx M + 2 新件 + 本文；`desk/` · `clew/` · `lib/` 零 diff） | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-81/lint-baseline.md`（tip e694eff · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 cursor + StudySession:106 order，KEEP）；Mac 侧写手开工前实跑复核同值。
