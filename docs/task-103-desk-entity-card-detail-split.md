# Task 103 · desk-entity-card-detail-split-01 · 诚实 MEGA

tip：`b2ac7b7`（T102 docs + Next 16.4.3）。主题：
卡片详情正文组件 `apps/web/components/EntityCardDetail.tsx`（**552** 行）诚实 MEGA-split——cite/miss 纯装配 /「引用状态」section / 字段+易混+原子 body 三段机械抽出 + 瘦编排器收口。只搬既有组；entities 与 desk card 双面共用零语义改写；无 densify、无新 CTA、无产品视觉改动、不碰冻结、零触 HeYeSession.tsx / StudySession.tsx。

inventory honesty：T97–T101 拆完 Library / study / review / ingest；T102 焦点环统合已过。本 tip 最大剩余诚实非 OUT/freeze 面是 EntityCardDetail（552 行）。AGENTS.md 阶段 DEFER 的 EntityCardDetail 本刀抬起（复检：helpers+miss · aria 引用状态 · 连续 body ≥3 缝；不再只数 2 个顶函数）。不拆 HeYe/Study further（freeze），不拆 routes/suggest（OUT），不拆 CitePeek/ChapterPageReader，不交薄 scrap 充刀，不造第四空壳。

## before → after LOC

| 文件 | before | after | 说明 |
| --- | --- | --- | --- |
| `apps/web/components/EntityCardDetail.tsx` | 552 | **267** | 瘦编排器（≤280 达标，目标达成） |
| `apps/web/lib/entity-card-detail-model.ts` | — | 106 | 新抽出 Seam A（服务端模型装配 · 零 JSX · 禁 `"use client"`） |
| `apps/web/components/EntityCardCiteStatus.tsx` | — | 114 | 新抽出 Seam B（引用状态 section · RSC） |
| `apps/web/components/EntityCardDetailBody.tsx` | — | 212 | 新抽出 Seam C（字段·易混·原子正文三段 · RSC） |

抽出件恰好 3 个（≥3 达标，禁第四空壳）；编排器:抽出件行数比 267 : 432。tracked diff 仅 EntityCardDetail.tsx（+34 / −319）。
总行 552 → 699：净增均为 header 注释 / imports / 函数签名 / 解构 / `return {…}` 模型尾 / 类型别名——无 fake pad。

## 缝映射（源行段 → 目标文件，tip b2ac7b7 行号）

| tip 行段 | 内容 | 去向 |
| --- | --- | --- |
| :1–15 | imports | 编排器收窄为 13 条；`CopyTextButton` / `FillAtomQuoteDraft` 迁至 `EntityCardCiteStatus.tsx`；`CardVsStudyLink` / `AtomDraftLine` / `FieldDraftLine` / `atomIncomplete` 迁至 `EntityCardDetailBody.tsx`；`cardCiteMisses` / `enumerateCardCites` / `quoteInOcr` 迁至 `entity-card-detail-model.ts` |
| :16–51 | `citeStats` 与 `firstPagedCitePage` helper 函数 | 迁移至 `lib/entity-card-detail-model.ts` 命名导出；编排器消费 |
| :53–119 | JSDoc 注释、`EntityCardDetail` 导出函数签名及 13 项 props 接口声明 | 编排器 `apps/web/components/EntityCardDetail.tsx` 保留（逐字保持公共面签名） |
| :120–127 | `stats = citeStats(card)` 与 `ocrMissOf` 定义 | 编排器保留；`ocrMissOf` 亦透传给 `EntityCardDetailBody` |
| :128–155 | miss 装配体（`ocrMissCount` IIFE · `missDetails` · `atomTargetOfMiss`） | 迁移至 `lib/entity-card-detail-model.ts` 内 `buildEntityCardMissModel(card, pageTextByPage)`；未检/去重/`slice(0,8)`/首匹配原子规则 ≡ tip；导出 `EntityCardMissModel` / `EntityCardCiteStats` / `findAtomTargetOfMiss` |
| :156–177 | studyHref / reviewHref / firstPage / ocrHas / deskPageKnown / deskPageHref | 编排器保留；`normName` 随易混迁入 `EntityCardDetailBody` |
| :178–234 | backLink、header、「本卡操作」hub section（含 CardHubReturnLinks、DeskOpenReturnLink 两岛、本页无 OCR 文案、三面诚实句） | 编排器保留 |
| :235–319 | `aria-label="引用状态"` section（含 stats 诚实计数、T54 OCR 未见列、T55 补救 details 展开、T61 建议摘录与一键填入草稿） | 迁移至 `components/EntityCardCiteStatus.tsx`（RSC，消费 card / stats / missModel 字段） |
| :321–353 | `LocalProgressStrip` 本卡进度条与 `CardDraftBar` 草稿条 | 编排器保留 |
| :354–408 | 字段 section（0 字段诚实句 · CitePeek · 对页直跳 / 本页无 OCR 门禁 · FieldDraftLine） | 迁移至 `components/EntityCardDetailBody.tsx` |
| :410–457 | 易混点 section（vsId 查表与深链 · CardVsStudyLink 岛） | 迁移至 `components/EntityCardDetailBody.tsx` |
| :459–517 | 知识原子 section（0 原子诚实句 · AtomDraftLine · CitePeek · 对页直跳 / 本页无 OCR 门禁） | 迁移至 `components/EntityCardDetailBody.tsx` |
| :518–552 | 页脚 cite 计数与反向对页行、闭合标签 | 编排器保留 |

跨边界唯一改写（机检核实）：
- import 行与 export 签名
- `buildEntityCardMissModel(card, pageTextByPage)` 包装与类型导出
- `EntityCardCiteStatus` 与 `EntityCardDetailBody` 的 props 接口声明与解构
- className、UI 文案、aria 标签、href 构造、草稿 props 多重集 Δ0

## 装配 / import 图

- `EntityCardDetail.tsx` → `next/link` + `lib/entities`（Cite / EntityCard）+ `components/CitePeek` + `components/LocalProgressStrip` + `components/CardHubReturnLinks` + `components/DeskOpenReturnLink` + `lib/qs-mode` + `lib/ocr-page` + `lib/cite-ocr-quality`（citeOcrMiss）+ `components/CardDraftBar` + `lib/entity-card-detail-model` + `components/EntityCardCiteStatus` + `components/EntityCardDetailBody`
- `EntityCardCiteStatus.tsx` → `lib/entities`（EntityCard）+ `lib/entity-card-detail-model`（types）+ `components/CopyTextButton` + `components/AtomDraftEditor`（FillAtomQuoteDraft）
- `EntityCardDetailBody.tsx` → `next/link` + `lib/entities`（Cite / EntityCard）+ `components/CitePeek` + `components/CardVsStudyLink` + `components/AtomDraftEditor`（AtomDraftLine / FieldDraftLine）+ `lib/atom-draft`（atomIncomplete）
- `entity-card-detail-model.ts` → `lib/entities`（EntityCard）+ `lib/cite-ocr-quality`（cardCiteMisses / enumerateCardCites / quoteInOcr）（纯 lib，零 JSX，零 component 依赖）

无循环依赖。三抽出件均无 `"use client"`。所有 loader 条件、引用机检算法、草稿匹配时机与 tip 严格恒等。

## 公共 API / 铁合同

- 组件入口保持 `apps/web/components/EntityCardDetail.tsx`，命名导出 `export function EntityCardDetail`。
- 调用方零改：
  - `apps/web/app/(desk)/desk/card/[id]/page.tsx`
  - `apps/web/app/(shell)/entities/[id]/page.tsx`
  两处页面调用与 props 传参完全零 diff。
- 零触碰文件（严格无 tracked / untracked diff）：
  - `HeYeSession.tsx`
  - `StudySession.tsx`
  - `CitePeek.tsx`
  - `CardHubReturnLinks.tsx`
  - `CardVsStudyLink.tsx`
  - `DeskOpenReturnLink.tsx`
  - `LocalProgressStrip.tsx`
  - `CardDraftBar.tsx`
  - `AtomDraftEditor.tsx`（及同族）
  - `CopyTextButton.tsx`
  - DocumentPane* / Clew* / study / review / library / ingest extracts / `app/api/**` / `globals.css` / 任何 `package.json` 或 lockfile。

## KEEP 铁律（本刀遵守）

- `pnpm --filter web lint` 保持恰好 2 problems (2 errors, 0 warnings)，定位严格锁定在 `HeYeSession.tsx:88` 和 `StudySession.tsx:106`（`react-hooks/set-state-in-effect`）。
- `pnpm --filter web exec tsc --noEmit` 保持 exit 0。
- `pnpm --filter web build` 保持 exit 0，无新依赖。
- 未改动任何颜色、Tailwind token、全局 CSS 或 UI 文本。朱砂（cinnabar）仍是唯一品牌强调色。
- 无 `git commit` / `push` / `stash` / `reset` / `clean` / `rebase`，保持 dirty tree 交付。

## 验收 A–J 自检

- **A** `pnpm --filter web exec tsc --noEmit` → exit 0
- **B** `pnpm --filter web lint` → 恰好 2 problems (2 errors, 0 warnings)，定位严格为 HeYe:88 / Study:106
- **C** `pnpm --filter web build` → exit 0，`/desk/card/[id]` 与 `/entities/[id]` 均正常构建
- **D** move-as-is：
  - className 多重集比对：tip (58) ≡ after (58)，Δ0
  - aria-label 多重集比对：tip (2: "本卡操作", "引用状态") ≡ after (2)，Δ0
  - href 构造多重集比对：tip (5) ≡ after (5)，Δ0
  - 草稿 props（FieldDraftLine / AtomDraftLine / FillAtomQuoteDraft）字段逐字保持
- **E** 调用方与岛源文件零 diff；`EntityCardDetail` 仍从原路径命名导出
- **F** miss 未检（`pageTextByPage == null` 兜底）/ 去重 / ≤8 条截断 / 首匹配原子规则 ≡ tip
- **G** 字段·原子·页脚「对页」+ ocrMiss 同真（三处 CitePeek 下传 `ocrMissOf`，三处对页经由 `ocrHas` 判断）
- **H** `/desk/card/immunity` 与 `/entities/immunity` 服务端渲染 HTTP 200，HTML 各 section 结构、文案与交互岛正常输出，无视觉漂移
- **I** `HeYeSession.tsx` / `StudySession.tsx` git diff 空；仅 whitelist 5 文件存在变更
- **J** 本文档完成，完工报告符合 AGENTS.md §8 规范

## DEFER

- **DocumentPane 第三刀 DEFER**：无 ≥3 NEW 命名机械缝，不 densify 状态机。
- **ClewPane further DEFER**：OUT。
- **HeYeSession / StudySession further DEFER**：核心会话组件，冻结点所在，零触碰。
- **study / review / library / ingest pages further DEFER**：已拆页面保持稳定。

## OUT（本刀不做）

- Clew 真写 / verified:true / 自动 PATCH entities / 一键写回仓库（OUT）
- Next.js 升级 / pnpm up / 新依赖（OUT）
- 改动朱砂以外的任何颜色或增加新样式 token（OUT）
- 篡改 ESLint 配置或 eslint-disable 掩盖问题（OUT）
- git commit / push / stash / reset / clean / rebase（OUT）
