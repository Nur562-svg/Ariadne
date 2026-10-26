# Task 75 — desk-clewpane-split-01

**Slug**: `desk-clewpane-split-01`
**Title**: ClewPane 诚实 mega-split · ~1782 行单文件机械拆成 helpers + AuditView + Changes/Queue 两面板 + 编排器收口
**Tip**: `52ccdc9`（docs T74）atop `6817c8f`（feat T74）atop `c335d0e`（docs T73）
**体量**: MEGA · A–J 全交
**定稿**: 2026-10-26 Asia/Shanghai (CST)

## 一句话

T74 收掉 entities 指纹 memo 后，`apps/web/components/desk/ClewPane.tsx` 仍是 ~1782 行单文件（lint 护栏 2/2e/0w/SSE2，仅剩两处会话冻结 KEEP）。本刀只做机械拆分：把文件里**已存在的本地缝**（模块层类型/纯函数 · AuditedProse/AuditFace · ChangesPanel · QueuePanel，外加编排器内纯 href 推导）整段抽到 `apps/web/components/desk/` 同级文件，编排器只留会话态 + send/stream/retry + fillDrafts + 档位芯片 + 补丁建议/复制/填草稿块 + 组装。零产品行为与视觉改动；`export default ClewPane` 无 props 契约与 `DeskShellClient` 零 diff。

## 铁合同（硬 · 铁）

1. **机械抽出 only**：只搬既有函数/组件/类型；禁止重写流式 NDJSON 消费（meta→delta*→done｜error）、补丁白名单、fillDrafts 显式点击、档位 fail-closed、核账预览/终态、空池门禁、文案、class、href 构造。
2. **公共 API 守恒**：`export default ClewPane` 仍从 `@/components/desk/ClewPane` 导出且**无 props**；`DeskShellClient.tsx` 零 diff（`<ClewPane />` 原样）。
3. **KEEP T66–T70**：NDJSON 事件机 · patch.v1 白名单 + seed before · PatchPasteBlock（不在本文件，未碰）· 仅点击 fillDrafts · resolveClewTier 不串档（服务端，未碰）· 档位芯片（TIER_IDS/TIER_LABEL/置灰同源 tierAvailable）· 用量 bump+byTier · grounding · audit/meta.audit/auditPreview 灰预览/终态覆盖。
4. **KEEP T71 uSES**：ChangesPanel/QueuePanel 继续 `useStudyGrades` + `useHeYeStore`；空仓如实 0；无 setTick 回退。
5. **两处冻结 KEEP**：HeYeSession:218 cursor · StudySession:234 order——不 gut、不 disable、不评分重排；本刀主题不是 lint-zero。
6. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿（拆分中曾引入 1 个 unused-import warning，已按「删多余导入」正路修复，非 disable）。
7. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动（仅文件边界 + import 整理）。
8. 不 redo Clew T66–T70 语义；不拆 DocumentPane（T73 五件不再拆）/ ChapterPageReader；不碰 T73 extracts、T74 entities memo / force-dynamic / generateStaticParams 缺席。
9. 禁 LiteLLM/Auto/BYOK/云墙；禁 verified:true / Clew 真写 / seed-apply 可写 / bulk；钥不入仓 / 不 NEXT_PUBLIC_*。
10. J 必记：before 1782 → after ≤950（目标 ≤900）；抽出文件 ≥4；DeskShellClient 契约；lint 护栏 2/2e/0w/SSE2 不劣于且冻结仍在；tsc 0；build PASS；clew-check 绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip ClewPane.tsx 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 44–105 | 类型/常量：TierInfo · ActionLink · PlainLink · AssistantMsg · Msg · Tab · Capability · CLEW_TIER_KEY · TIER_IDS · TIER_LABEL | `clew-pane-helpers.ts`（export 化） |
| 107–267 | 纯函数：fireLinkReturn · SURFACE_ZH · buildSuggestions · stubReply · Act · clewReturnPayload · pickSuggestContext · parseCardAtoms · bubbleReturnTo | `clew-pane-helpers.ts` |
| 801–844 | 编排器内 href 推导（bookHref/cardQ/pageQ/studyHref/reviewHref/pageHref，progress* 优先回落链） | `clew-pane-helpers.ts` 新纯函数 `clewCtaHrefs(clew)`（体逐字同源，加 return 包装） |
| 269–316 / 318–390 | AuditedProse（答文页码就地标注）/ AuditFace（核账行 + 相关原子链） | `ClewAuditView.tsx`（named exports） |
| 1315–1616 | ChangesPanel（uSES 双仓 + 筛选芯片 + 空池门禁 + 截断诚实 + actLinks 深链） | `ClewChangesPanel.tsx`（named export） |
| 1618–1783 | QueuePanel（uSES 双仓 + 分段点击 + 清完分写 + 主 CTA 门禁） | `ClewQueuePanel.tsx`（named export） |
| 392–1313 | ClewPane 编排器（会话态/探针/send·stream·retry/fillDrafts/档位芯片/补丁块/组装） | **留** `ClewPane.tsx`（import 组装；href 段换 `clewCtaHrefs` 解构一行） |

搬运完整性：四抽出文件的迁移体与 `git show HEAD` 原文**逐字节一致**（仅差 `export` 前缀与 EOF 换行；clewCtaHrefs 另差注释上移 + return 包装）；编排器保留段 401–799 / 846–1313 与原文逐字一致（diff 实证）。

## OUT（本刀 + forever）

不 push · 不拆 DocumentPane / ChapterPageReader · 不 entities SSR 再刀 · 不 gut 两处冻结 KEEP · 不 lint-zero（禁 disable 捂）· 不 densify redo（empty-CTA / return / CitePeek / Clew 流式·补丁·三档·接地·核账全禁 redo）· 不借拆文件改业务逻辑/文案/class/门禁/href/流式消费/白名单/fillDrafts 语义 · 不改 storage keys（CLEW_TIER_KEY 原值原位）· 不动 T71 三 uSES hook 实现 · 不回退 T72 真模式 · 不 verified:true / Clew 真写 / seed-apply 可写 / bulk / 批量重抽 / Register 硬门禁 / quiz densify / LiteLLM / Auto / BYOK / 云墙 / 钥入仓 / Next 升级。

## DEFER（后续刀）

ChapterPageReader 再拆 · DocumentPane 再 densify（禁）· 编排器 chat 空态/气泡 JSX 进一步分件（当前 929 行达标，非必要不开刀）· 两处冻结 effect 更深非 effect 化（KEEP）· 全仓 lint-zero（禁 gut）· loadMaterials 进 memo（T74 DEFER 承接）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent heye-only · Register 硬门禁 · quiz densify。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 52ccdc9） | after（写手树） | 验收复核 |
|---|---|---|---|
| `ClewPane.tsx` 行数 | **1782** | **930**（≤950 达标；目标 ≤900 未压到，差 30——补丁明细/档位芯片/空态按合同须留在编排器） | ___ |
| 抽出文件数（≥4） | — | **4**：clew-pane-helpers 299 · ClewAuditView 143 · ClewChangesPanel 319 · ClewQueuePanel 181 | ___ |
| `DeskShellClient.tsx` diff | — | **零 diff**（`<ClewPane />` 无 props 原样；import 路径未变） | ___ |
| 搬运完整性（git show 逐字节 diff） | — | 四迁移体 IDENTICAL（模 export 前缀/EOF 换行）；编排器保留段 401–799/846–1313 IDENTICAL；clewCtaHrefs 体同源 | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:218 · StudySession:234 冻结 KEEP 原样在；拆分曾引入 1 unused-import warning 已正路修复，无 disable） | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级；路由全 ƒ Dynamic） | ___ |
| clew-check | 69/69 | **69/69** | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（cite ch01 卡40·原子57·有页cite195·OCR未见0，与 tip 同） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 分列正确（dry-run 报告非真源） | ___ |
| force-dynamic / generateStaticParams（未碰复核） | 12 处 / 0 实现 | **12 处 / 0 实现**（页面零改动） | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-75/lint-baseline.md`（tip 52ccdc9 · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:218 cursor + StudySession:234 order，KEEP）。
