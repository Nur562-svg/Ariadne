# Task 80 — desk-draftinbox-split-01

**Slug**: `desk-draftinbox-split-01`
**Title**: DraftInbox 诚实 mid-split · 473 行单文件机械拆成 PatchPaste + Port 两折叠块（+ shared 常量/downloadText）+ 编排器收口；两处会话冻结零触碰
**Tip**: `63a46ef`（docs T79）atop `630f2ea`（feat T79）atop `1f6f2f4`（T78 docs）
**体量**: mid · A–J 全交
**定稿**: 2026-10-27 Asia/Shanghai (CST)

## 一句话

T73–T79 会话壳 mega 波次收掉后，`apps/web/components/DraftInbox.tsx` 仍是 473 行单文件，内含两处清晰本地 function 缝（`PatchPasteBlock` Clew patch.v1 粘贴导入折叠块 · `DraftPortBlock` draft-port.v1 带走/导入折叠块）与三件主条 + 两块共用的顶部常量/工具（`INBOX_DISCLAIMER` · `btnQuiet` · `downloadText`）。本刀只做机械拆分：两折叠块整段抽到同级 `DraftInboxPatchPaste.tsx` / `DraftInboxPort.tsx`（函数名对齐文件名，T78/T79 ModeChips 同例），三共用件迁 `draft-inbox-shared.ts`（named export）。编排器留 default export · props · `useAtomDraftStore` · seed 快照 **Promise 回调** `setSeeds` effect（字节 KEEP，不改成同步 effect 内 setState）· 琥珀收件箱主条 · 不完备引导 · T65 空岛常显壳（渲染 JSX 同 tip）。`desk/page.tsx` 零 diff；HeYeSession:88 / StudySession:106 两处冻结零触碰。

## 铁合同（硬 · 铁）

1. **机械抽出 only**：只搬既有本地缝；pack / guide / 空岛 / incomplete 引导 / schema 名 / INBOX_DISCLAIMER / class / href 逐字节搬（两块函数体与 tip 逐字节一致，仅声明行 `function X(` → `export default function DraftInboxX(`）；禁止借拆 densify。
2. **公共 API 守恒**：`export default DraftInbox` 仍自 `@/components/DraftInbox`；props（`incompleteCardSummaries?`）语义零改；`desk/page.tsx` **零 diff**（`:21` default import · `:474` 传参原样）。
3. **两处冻结 KEEP**：HeYeSession:88 cursor · StudySession:106 order——本刀零触碰（git diff 为空）；不 gut、不 eslint-disable 捂 SSE。
4. **T71 uSES KEEP**：继续 `useAtomDraftStore`（`:38`）；无 setTick 回退 / 无本地镜像 store 复活。
5. **草稿语义铁律**：只写本机 `ariadne.atom-draft.v1` / port.v1 / patch.v1（写路径全在 `@/lib/atom-draft` · `@/lib/atom-draft-port`，`lib/` 零 diff）；禁止 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」；draft-port ≠ progress-port 文案原样。
6. **空岛抽出 ≠ densify**：T65 空岛常显壳留编排器，渲染 JSX（class / 文案 / href）与 tip 逐字节一致；两折叠块 JSX 同 tip。编排器 tip :45–261 区段**仅 4 处单词级替换**：:69 与 :238 两条注释里的旧组件名改新名（非渲染）、:255 与 :258 两个 JSX 标签名改新名。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；新件 eslint-disable 0；**不把 Promise 回调 `setSeeds` 改成同步 effect 内 setState**（tip :77–101 effect 逐字节 KEEP）。
8. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动。
9. 不 redo Clew T66–T70；不拆 DocumentPane / ClewPane / ChapterPageReader / HeYe·Study 主流程 / EntityCardDetail 当主题；不碰 T73–T79 extracts、T74/T77 entities memo。
10. J 必记：before 473 → after ≤300（目标 ≤280）；组件抽出件 ≥2；desk/page 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在（HeYe:88 · Study:106）；tsc 0；build PASS；clew-check 绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip DraftInbox.tsx 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 25–27 · 32–33 · 35–43 | `INBOX_DISCLAIMER` 四分列短句 · `btnQuiet` 静默按钮 class · `downloadText` 浏览器本地下载（主条 + 两块共用） | `draft-inbox-shared.ts`（named export；字符串 / class / download 行为零改，仅加 `export`） |
| 263–372 | `PatchPasteBlock`（T67 G：patch.v1 粘贴 → parseAtomDraftPatch 整包严格形 → 已有快照 / 只读 GET 取 seed → applyAtomDraftPatch 合并进本机草稿；整包拒收 / 未知 target / 永不写 seed） | `DraftInboxPatchPaste.tsx`（default export `DraftInboxPatchPaste`；`seeds` / `fetchState` 经 props，形参表同 tip；函数体逐字节一致） |
| 374–473 | `DraftPortBlock`（G：port.v1 整卡草稿带走 / 合并导入 / replace 武装确认 / CopyTextButton / 本地下载 / draft-port ≠ progress-port） | `DraftInboxPort.tsx`（default export `DraftInboxPort`；`store` 经 props；函数体逐字节一致） |
| 29–30 | `EMPTY_SEEDS` 稳定空 seed map（T72，仅编排器用） | **留** `DraftInbox.tsx`（逐字一致） |
| 45–261 | 编排器：JSDoc · default export · props · `useAtomDraftStore` · **Promise 回调 setSeeds effect（:77–101）** · 派生三态 · 琥珀收件箱主条 · T64 次级 CLI 面 · 不完备引导 · T65 空岛常显壳 · 组装两块 | **留** `DraftInbox.tsx`（diff 实证逐字一致，模 4 处名替换 @69/238/255/258） |
| 3–23 | import 区 | 整理：删随块迁走的 `useMemo` / `applyAtomDraftPatch` / `parseAtomDraftPatch` / `type AtomDraftStore` / `atom-draft-port` 三符号（否则 lint 新增 unused 错误）；加 2 件 + shared 共 3 行 import |

搬运完整性（git show HEAD 对照，写手脚本实证 **9/9 True**）：shared 三段一致（模 `export`）；PatchPaste JSDoc 随迁 + 函数体一致（仅声明行改名）；Port JSDoc 随迁 + 函数体一致（仅声明行改名）；编排器 45–261 一致（模 4 处名替换）；`EMPTY_SEEDS` 一致；setSeeds effect :77–101 字节一致。`git diff -U0` 12 hunk = 7 处 import 区 + 1 处 shared 块删除 + 4 处单行名替换 + 1 处尾部 212 行删除。

## OUT（本刀 + forever）

不 push · 不 densify 空岛（T65 壳常显、禁大红 empty-CTA）· 不 gut 冻结 / 不 disable 捂 SSE · 不把 setSeeds 改同步 effect 内 setState · 不拆 ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 主流程 / EntityCardDetail 当主题 · 不改 desk/page 传参 · 不写 verified:true / 自动写 entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM / Auto / BYOK / 云墙 / 批量重抽 / 钥入仓 / Next 升级 · 不发明或改名既有 storage keys · 不把 draft 塞进 progress-port。

## DEFER（后续刀）

ClewPane 编排器再拆（禁作主题）· DocumentPane 再 densify（禁）· ChapterPageReader 再拆（禁）· HeYe/Study 主流程再拆（禁）· EntityCardDetail（另开）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 63a46ef） | after（写手树） | 验收复核 |
|---|---|---|---|
| `DraftInbox.tsx` 行数 | **473** | **239**（≤300 达标；目标 ≤280 亦达成） | ___ |
| 组件抽出件（≥2）+ shared | — | **2 + 1**：DraftInboxPatchPaste 121 · DraftInboxPort 119 · draft-inbox-shared 21 | ___ |
| `desk/page.tsx` diff | — | **零 diff**（default import + `incompleteCardSummaries` 传参原样） | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（两文件 git diff 为空；lint 仍精确报 :88 / :106） | ___ |
| Promise 回调 setSeeds effect | tip :77–101 | **字节 KEEP**（未改成同步 effect 内 setState） | ___ |
| T71 uSES / 草稿语义 | useAtomDraftStore · atom-draft.v1 / port.v1 / patch.v1 | **同**（hook 在用；写路径全在 lib，lib 零 diff；新件无 verified 写入） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:88 · StudySession:106；3 新文件零新增问题；无 disable） | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 16.4.0 未升级；/desk 动态路由正常） | ___ |
| clew-check | 69/69 | **69/69** | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（cite ch01 卡40·原子57·有页cite195·OCR未见0；parse ch07 覆盖100.0%；page ch07 暗0；density ch07 浅0；qa ch01 不完备0，与 tip 同） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 分列正确（dry-run 报告非真源，gitignored） | ___ |
| 未碰复核（HeYeSession/StudySession/DocumentPane/ClewPane/ChapterPageReader/EntityCardDetail/entities.ts） | 606/460/649/930/353/552/586 行 | **零触碰**（git status 仅 DraftInbox.tsx M + 3 新件；`desk/` · `clew/` · `lib/` 零 diff） | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-80/lint-baseline.md`（tip 63a46ef · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 cursor + StudySession:106 order，KEEP）；Mac 侧写手开工前实跑复核同值。
