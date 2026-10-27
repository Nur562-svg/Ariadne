# Task 82 — desk-atom-draft-editor-split-01

**Slug**: `desk-atom-draft-editor-split-01`
**Title**: AtomDraftEditor 诚实 mid-split · 366 行单文件机械拆成 AtomDraftLine + FieldDraftLine + FillAtomQuoteDraft 三岛（+ shared 常量/PersistWarn/nonBlank）+ 主文件收口；`@/components/AtomDraftEditor` named re-export 守恒；EntityCardDetail 零 diff；两处会话冻结零触碰
**Tip**: `bffd3ee`（docs T81）atop `0dd090a`（feat T81）atop `e694eff`（T80 docs）
**体量**: mid · A–J 全交
**定稿**: 2026-10-27 Asia/Shanghai (CST)

## 一句话

T73–T81 mega/mid 波次收掉后，`apps/web/components/AtomDraftEditor.tsx` 仍是 366 行单文件，内含三处清晰**已命名 export 缝**（`AtomDraftLine` :147–237 原子行草稿岛 · `FieldDraftLine` :244–326 字段草稿岛 · `FillAtomQuoteDraft` :333–366 填入草稿 quote）、一个非导出内联编辑器（`AtomDraftEditor` :52–138，被 AtomDraftLine 展开调用）与四者共用的顶部常量/小件（`DIFF_ZH` · `DRAFT_DISCLAIMER` · `PersistWarn` · `btnMuted/btnQuiet/textareaCls` · `nonBlank` :18–43）。本刀只做机械拆分：三岛整段抽到同级同名文件（named export 名不变），共用件迁 `atom-draft-editor-shared.tsx`（named export；**后缀 .tsx 而非任务书字面 .ts，因 PersistWarn 含 JSX，.ts 无法编译**）。主文件留内联编辑器（加 named export 供 AtomDraftLine 引用）+ 三岛 named re-export + 必要 import。唯一消费者 `EntityCardDetail.tsx`（:13 三岛 named import · :308 / :402 / :474 用点）零 diff；HeYeSession:88 / StudySession:106 两处冻结零触碰。

**结构性事实（写给下一位读者）**：任务布局 = 编辑器留主文件 + 三岛抽出 + 主文件 re-export。`AtomDraftLine.tsx` 必须 import 主文件的编辑器，主文件又 re-export `AtomDraftLine` → 一条 ESM 环。环仅在**渲染期**访问（`<AtomDraftEditor …/>` 在 AtomDraftLine 函数体内），`export function` 声明提升，模块求值期无引用——benign。eslint 无 `import/no-cycle` 规则（仅 next core-web-vitals + typescript）；build 无 circular 告警；两条卡详路由 SSR 冒烟经 barrel 真渲染三岛、服务端 stderr 0。

## 铁合同（硬 · 铁）

1. **机械抽出 only**：只搬既有命名缝；DRAFT_DISCLAIMER / 「本机草稿 · 未写回 seed …」横幅 / 按钮文案 / 琥珀「已改草稿」旁挂 / 「待补草稿」入口 / class / aria / title 逐字节搬（三岛函数与 tip 逐字节一致，声明行本就是 `export function`，零改；编辑器仅声明行加 `export`）；禁止借拆 densify。
2. **公共 API 守恒**：`AtomDraftLine` / `FieldDraftLine` / `FillAtomQuoteDraft` 仍可自 `@/components/AtomDraftEditor` 导入（主文件 `export { X } from "@/components/X"` 三行）；props 语义零改；`EntityCardDetail.tsx` **零 diff**。新增一个 named export `AtomDraftEditor`（原非导出；AtomDraftLine 跨文件引用所需）——只加不减。
3. **两处冻结 KEEP**：HeYeSession:88 cursor · StudySession:106 order——本刀零触碰（git diff 为空）；不 gut、不 eslint-disable 捂 SSE。
4. **T71 uSES KEEP**：AtomDraftLine / FieldDraftLine 继续 `useAtomDraftStore`；无 setTick 回退 / 无本地镜像 store 复活；草稿键名零改（键名字面只出现在编辑器 tip 原有 JSDoc，写路径全在 `@/lib/atom-draft`，`lib/` 零 diff）。
5. **草稿语义铁律**：本机草稿 only；草稿 ≠ seed 已核 · ≠ heye 本机已对 · ≠ study 练分（`DRAFT_DISCLAIMER` 三分列原样）；禁止 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」。
6. **抽出 ≠ densify**：各岛 JSX 同 tip（形参表同 tip）；不新增 CTA、不改空表诚实句（T47 0 字段句仍由服务端保留）。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；五件 eslint-disable 0；五件无 `useEffect`（lazy `useState` 初值 T72 口径原样）。
8. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动。
9. 不 redo Clew T66–T70；不拆 DocumentPane / ClewPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit / EntityCardDetail 当主题；不碰 T73–T81 extracts、T74/T77 entities memo。
10. J 必记：before 366 → after ≤200（目标 ≤150）；抽出件 ≥2；EntityCardDetail 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在（HeYe:88 · Study:106）；tsc 0；build PASS；clew-check 绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip AtomDraftEditor.tsx 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 18–43 | `DIFF_ZH` 难度中文 · `DRAFT_DISCLAIMER` 三分列短句 · `PersistWarn` 隐私模式未持久化 alert · `btnMuted` / `btnQuiet` / `textareaCls` · `nonBlank` | `atom-draft-editor-shared.tsx`（named export；字符串 / class / PersistWarn 行为零改，仅加 `export`；26 行 diff IDENTICAL） |
| 140–237 | `AtomDraftLine` JSDoc + export 函数（seed ⊕ draft overlay · 琥珀「已改草稿」· 「待补草稿」入口 · 「编辑草稿（本机）」展开内联编辑器） | `AtomDraftLine.tsx`（named export 同名；`cardId / atomId / seedPrompt / seedAnswer / seedDifficulty / seedCitePage / seedCiteQuote / incomplete` 经 props，形参表同 tip；98 行 diff IDENTICAL） |
| 239–326 | `FieldDraftLine` JSDoc + export 函数（value overlay · 极简编辑器 · lazy 初值 · PersistWarn · label 只读） | `FieldDraftLine.tsx`（named export 同名；`cardId / fieldIndex / seedValue` 经 props；88 行 diff IDENTICAL） |
| 328–366 | `FillAtomQuoteDraft` JSDoc + export 函数（merge citeQuote · 已填入旁注 · 未持久化 alert） | `FillAtomQuoteDraft.tsx`（named export 同名；`cardId / atomId / quote` 经 props；39 行 diff IDENTICAL） |
| 45–138 | 内联编辑器 `AtomDraftEditor` JSDoc + 函数（prompt / answer / cite.quote 三 textarea · 保存/放弃 · 硬横幅） | **留** `AtomDraftEditor.tsx`（94 行 diff IDENTICAL 模声明行加 `export`） |
| 3–16 | import 区 | 整理：`@/lib/atom-draft` 10 名 → 编辑器实用 4 名（atomDraftKey / clearAtomDraft / loadAtomDraftStore / setAtomDraft）单行；删 `useAtomDraftStore`（编辑器不用 hook，用 lazy loadAtomDraftStore）；加 shared 7 名 import 块 |
| — | 新增 | 7 行 T82 头注 + 3 行 named re-export |

搬运完整性（`git show bffd3ee` 对照，写手脚本实证 **5 段 IDENTICAL**）：shared 26 行（模 `export`）；AtomDraftLine 98 行；FieldDraftLine 88 行；FillAtomQuoteDraft 39 行；编辑器 94 行（模 `export function`）。`git diff -U0` **5 hunk** = 1 处单行 atom-draft import 加入 + 1 处 12 行旧 import 块 ↔ 8 行 shared import 块 + 1 处 26 行 shared 块删除 ↔ 10 行（7 行 T82 注 + 3 行 re-export）+ 1 处单 token `export`（`:52`）+ 1 处尾部 228 行三岛删除。

## OUT（本刀 + forever）

不 push · 不 densify 草稿文案 / CTA / 琥珀旁挂 / 空表诚实句 · 不造掌握% / Due / 单一健康分 / 健康圆环 / 第四书架徽列 · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit / EntityCardDetail 当主题 · 不改 EntityCardDetail import · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM / Auto / BYOK / 云墙 / 批量重抽 / 钥入仓 / Next 升级 · 不发明或改名既有 storage keys · 不把 draft 塞进 progress-port。

## DEFER（后续刀）

EntityCardDetail（tip 复测仍仅 citeStats/firstPagedCite 薄 helpers；fields/atoms/OCR 补救/草稿条 JSX 缝稠且缠 OCR/草稿 densify——另开）· ClewPane 编排器再拆（禁作主题）· DocumentPane 再 densify（禁）· ChapterPageReader 再拆（禁）· HeYe/Study 主流程再拆（禁）· DraftInbox 再拆（禁）· Cockpit 再拆（禁 · T81 刚闭）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip bffd3ee） | after（写手树） | 验收复核 |
|---|---|---|---|
| `AtomDraftEditor.tsx` 行数 | **366** | **119**（≤200 达标；目标 ≤150 亦达成） | ___ |
| 抽出件（≥2）+ shared | — | **3 + 1**：AtomDraftLine 113 · FieldDraftLine 115 · FillAtomQuoteDraft 51 · atom-draft-editor-shared 33（.tsx） | ___ |
| `@/components/AtomDraftEditor` named exports | AtomDraftLine · FieldDraftLine · FillAtomQuoteDraft | **三者守恒**（re-export）+ 新增 `AtomDraftEditor`（只加不减） | ___ |
| `EntityCardDetail.tsx` diff | — | **零 diff**（`:13` 三岛 named import · `:308` / `:402` / `:474` 用点原样） | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（两文件 git diff 为空；lint 仍精确报 `:88:9` / `:106:5`） | ___ |
| T71 uSES / 草稿语义 | useAtomDraftStore · 本机草稿 only · 三分列 disclaimer | **同**（两岛 hook 在用；写路径全在 lib，`lib/` 零 diff；五件无 verified 写入、无 effect） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:88:9 · StudySession:106:5；5 件零新增问题；无 disable） | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 16.4.0 未升级；Compiled successfully；无 circular 告警；/desk/card/[id] · /entities/[id] ƒ dynamic） | ___ |
| SSR 冒烟 `/desk/card/immunity` · `/entities/immunity` | — | **200 ×2**：AtomDraftLine ×2（编辑草稿/显示答案/识记·机制芯片）· FieldDraftLine ×4（编辑字段草稿 · `label 只读 · <!-- -->`DRAFT_DISCLAIMER ×4）· shared `btnMuted` ×6 = 2+4 · 服务端 stderr 0；`.next` 产物含三岛独有文案（FillAtomQuoteDraft 「填入草稿 quote」7 文件——数据面全章 OCR 未见 0 故 SSR 不渲 T55 面板，为数据态） | ___ |
| clew-check | 69/69 | **69/69** | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（cite ch01 卡40·原子57·有页cite195·OCR未见0；parse ch07 覆盖100.0%；page ch07 暗0；density ch07 浅0；qa ch01 不完备0，与 tip 同） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 分列正确（dry-run 报告非真源，gitignored；data/cards·chapters·config 零脏） | ___ |
| 未碰复核（HeYeSession/StudySession/DocumentPane/ClewPane/ChapterPageReader/EntityCardDetail/DraftInbox/Cockpit/entities.ts） | 606/460/649/930/353/552/239/151/586 行 | **零触碰**（git status 仅 AtomDraftEditor.tsx M + 4 新件 + 本文；`app/` · `desk/` · `clew/` · `lib/` 零 diff） | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-82/lint-baseline.md`（tip bffd3ee · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 cursor + StudySession:106 order，KEEP）；Mac 侧写手开工前实跑复核同值。
