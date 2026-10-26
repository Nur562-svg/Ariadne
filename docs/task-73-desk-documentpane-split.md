# Task 73 — desk-documentpane-split-01

**Slug**: `desk-documentpane-split-01`
**Title**: DocumentPane 诚实 mega-split · ~1299 行单文件机械拆成 desk/ 同级五件 + 编排器收口
**Tip**: `7a70843`（docs T72）atop `3487978`（feat T72）atop `ed95557`（docs T71）
**体量**: MEGA · A–J 全交
**定稿**: 2026-10-26 Asia/Shanghai (CST)

## 一句话

T72 收掉 DeskContext 与非冻结 SSE 后，`DocumentPane.tsx` 仍是 ~1299 行单文件（lint 护栏 2/2e/0w/SSE2，仅剩两处会话冻结 KEEP）。本刀只做机械拆分：把文件里**已存在的本地缝**（helpers / CardCard / OverviewPanel / QuizPanel / SectionCards）整段抽到 `apps/web/components/desk/` 同级文件，编排器保留 default export 与全部 props。零产品行为与视觉改动；不改业务逻辑、文案、className、门禁、href 构造；不借拆文件做任何「顺手优化」。

## 铁合同（硬 · 铁）

1. **机械抽出 only**：只搬既有函数/组件；禁止重写过滤规则（`filterCards`/`groupByKind`）、空池门禁、统计、文案、className、href 构造。
2. **公共 API 守恒**：`export default DocumentPane` 仍从 `@/components/desk/DocumentPane`；props（`book/books/chapters/cards/pages/invalidBook/badBookId/initialPage/initialMode/citingByPage/pendingByPage/heyePool/bookValidPages`）语义不变；`desk/page.tsx` 零 diff（remount key 与传参原样）。
3. **T72 真模式保留**：viewMode URL 胜出 + `useClientOnce` 采纳；`pageNo` lazy 初值 + 渲染期补位；`firstPageOf` 仍模块层纯函数（随 helpers 文件走）。
4. **Clew/return/空池零退化**：`setClew` · `deskReturnPayload` · `rememberReturn` · TOC 零段 no-op · Overview/Quiz/瓷砖门禁 · BookSwitcher 幽灵页——行为同 tip。
5. **两处冻结 KEEP**：HeYeSession:218 cursor · StudySession:234 order——不 gut、不 disable、不评分重排；本刀主题不是 lint-zero。
6. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿。
7. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动（除文件边界强迫的 import 整理）。
8. 不 redo Clew T66–T70；不拆 ClewPane / ChapterPageReader 大结构；不 entities SSR cache；不改 entities `force-dynamic`。
9. 禁 LiteLLM/Auto/BYOK/云墙；禁 verified:true / Clew 真写 / seed-apply 可写 / bulk；钥不入仓 / 不 NEXT_PUBLIC_*。

## 抽出映射（源缝 → 目标文件）

| 源（tip DocumentPane.tsx 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 32–85 | `KIND_ZH` · `Mode` 类型 · `firstPageOf` · `filterCards` · `groupByKind`（模块层纯函数/常量） | `document-pane-helpers.ts` |
| 87–225 | `CardCard`（实体卡瓷砖：CitePeek / 对页 / 练核门禁 / OCR 未见点名） | `DocumentCardTile.tsx`（named export `CardCard`） |
| 846–1087 | `OverviewPanel`（四格 + 章行页/卡/练核门禁 + parse/暗/浅徽 + 练本章 title 旁挂） | `OverviewPanel.tsx`（default export） |
| 1089–1214 | `QuizPanel`（atomCount/bookAtomCount 放宽链 + 内嵌 Strip + returnTo） | `DocumentQuizPanel.tsx`（default export；文件名加 Document 前缀避让同名歧义） |
| 1216–1300 | `SectionCards`（空段诚实文 / map 按 kind 分组 / compact 分栏窄列；消费 helpers + CardCard） | `SectionCards.tsx`（default export） |
| 227–844 | `DocumentPane` 编排器（状态、深链、viewMode/pageNo、Clew bridge、书头 chrome、TOC、按 section/mode 组装） | **留** `DocumentPane.tsx`（import 组装） |

## OUT（本刀 + forever）

不 push · 不拆 ClewPane / ChapterPageReader · 不 entities SSR cache / 不改 entities force-dynamic · 不 gut 两处冻结 KEEP · 不 lint-zero（禁 disable 捂）· 不 densify redo（empty-CTA / return / CitePeek / Clew 流式·补丁·三档·接地·核账全禁 redo）· 不借拆文件改业务逻辑/文案/class/门禁/href · 不改 storage keys · 不动 T71 三 uSES hook · 不回退 T72 viewMode/pageNo 真模式 · 禁 LiteLLM/Auto/BYOK/云墙/verified:true/Clew 真写/seed-apply 可写/bulk/批量重抽/Register 硬门禁/quiz densify/钥入仓。

## DEFER（后续刀）

entities SSR cache · ClewPane mega-split · ChapterPageReader 再拆 · 两处冻结 effect 的更深非 effect 化（本刀明确 KEEP）· 全仓 lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent heye-only · Register 硬门禁 · quiz densify。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 7a70843） | after（写手树） | 验收复核 |
|---|---|---|---|
| `DocumentPane.tsx` 行数 | **1299** | **649**（≤700 达标；目标 ≤650 压线） | ___ |
| 抽出文件数（≥4） | — | **5**：helpers 63 · CardTile 152 · Overview 254 · Quiz 137 · SectionCards 96 | ___ |
| `desk/page.tsx` diff | — | **零 diff**（import / key / 传参原样） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:218 · StudySession:234 冻结 KEEP 原样在；无 disable 新增） | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级） | ___ |
| clew-check | 69/69 | **69/69** | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（各数与 tip 同） | ___ |
| seed-apply-check（夹具） | 绿 | **绿**（would-change 1 / already-matches 1 分列正确；dry-run 报告非真源） | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-73/lint-baseline.md`（tip 7a70843 · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:218 cursor + StudySession:234 order，KEEP）。
