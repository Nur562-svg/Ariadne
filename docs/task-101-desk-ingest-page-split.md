# Task 101 · desk-ingest-page-split-01 · 诚实 MEGA

tip：`db1a845`（docs T100 desk-first-screen-polish-01）atop `02c116e`（feat T100）。主题：
导入教材页 `apps/web/app/(shell)/ingest/page.tsx`（**656** 行）诚实 MEGA-split——物料模型装配 /
质量·补救面板 JSX / 物料卡壳 JSX 三段机械抽出 + 瘦 page 收口。只搬既有组、跨文件边界零语义
改写；无 densify、无新 CTA、无产品视觉改动、不碰冻结、零触 HeYeSession.tsx / StudySession.tsx。

inventory honesty：T97–T99 拆完 Library / study / review，T100 首屏打磨后，本 tip 最大剩余诚实 fat page
即为 ingest（656 行，三条清晰机械缝：模型装配 :34–93 + :135–280 / 质量补救面板 :371–551 /
卡壳 :281–370 + :552–642）。本刀抬起此前 DEFER 的 ingest，遵守 OUT「Register 硬门禁改动」——
只搬不改门禁语义，Register 软门禁口径与 qualityWarn 完全守恒。不交薄 scrap 充刀，不造第四空壳。

## before → after LOC

| 文件 | before | after | 说明 |
| --- | --- | --- | --- |
| `apps/web/app/(shell)/ingest/page.tsx` | 656 | **77** | 瘦 page（≤200 达标，≤160 目标达成） |
| `apps/web/lib/ingest-material-model.ts` | — | 262 | 新抽出 Seam A（服务端模型装配 · 零 JSX · 禁 `"use client"`） |
| `apps/web/components/IngestMaterialQualityPanels.tsx` | — | 208 | 新抽出 Seam B（质量·补救面板 · RSC） |
| `apps/web/components/IngestMaterialCard.tsx` | — | 238 | 新抽出 Seam C（物料卡壳 · RSC · 嵌 QualityPanels） |

抽出件恰好 3 个（≥3 达标，禁第四空壳）；page:抽出件行数比 77 : 708。tracked diff 仅 page.tsx。
总行 656 → 785：净增均为 header 注释 / imports / 函数签名 / 解构 / `return {…}` 模型尾 / 类型别名——无 fake pad。

## 缝映射（源行段 → 目标文件，tip db1a845 行号）

| tip 行段 | 内容 | 去向 |
| --- | --- | --- |
| :1–31 | imports | page 收窄为 6 条；其余随抽出件迁移（`entities` / `cite-ocr-quality` / coverage / density / `atom-draft` 迁移至 `ingest-material-model.ts`；`Link` / `CopyCommand` 迁移至 panels；`RegisterMaterialButton` / `IngestReadyLinks` / `CopyCommand` 迁移至 card） |
| :32 | `dynamic = "force-dynamic"` | page 留（逐字） |
| :34–37 | `findDeskBook(m)` | 迁移至 `lib/ingest-material-model.ts` 并命名导出；`IngestMaterialCard.tsx` 消费 |
| :39–48 | `missingChapterIds(m, kind)` | 迁移至 `lib/ingest-material-model.ts` 并命名导出 |
| :50–93 | `STAGE_UI` 常量映射与 hint 构造 | 迁移至 `lib/ingest-material-model.ts` 并命名导出 |
| :95–108 | `IngestPage` 入口与四池条件装载 | page 留（`materials` · `bookValidPages` · `allOcrPages` · `allAtoms` · `allQueue` 装载门禁与条件逐字保持） |
| :109–133 | `<main>` 标题 / 四步说明 / `IngestUpload` 区域 / 物料列表开壳与空态 | page 留（逐字） |
| :135–280 | map 内模型装配（stage / ui / hint / blocksN / cardsN / chapterChecks / materialWarn / weakChapters / chapterCoverage / weakParseChapters / covEmpty / covSparse / chapterExtractPage / darkChapters / darkTotal / substantialTotal / bookDarkRate / chapterDensity / shallowChapters / shallowTotal / densitySubstantialTotal / bookShallowRate） | 迁移至 `lib/ingest-material-model.ts` 内 `buildIngestMaterialModel(m)`；导出 `IngestMaterialModel = ReturnType<typeof buildIngestMaterialModel>` 与 `ChCheck` 类型 |
| :281–370 | 卡头、物料 meta、章清单四列及质量点名 | 迁移至 `components/IngestMaterialCard.tsx`（消费 model + 页面四池 props） |
| :371–551 | 四大质量·补救面板（T56 parse 覆盖偏弱 · T57 抽出页覆盖偏稀/暗页 · T59 抽出密度偏稀/浅页 · T55 补救展开与命令） | 迁移至 `components/IngestMaterialQualityPanels.tsx`（消费 model，Fragment `<> ... </>` 收口） |
| :552–642 | hint 文本 / CopyCommand / ready·register CTA（`IngestReadyLinks` 或 `RegisterMaterialButton` 含完整 `qualityWarn`） / 卡脚创建时间与 PDF 路径 | 迁移至 `components/IngestMaterialCard.tsx`（嵌入 `<IngestMaterialQualityPanels model={model} />`） |
| :643–656 | 列表闭合 / 诚实说明 / 页尾书库链接 / `</main>` | page 留（逐字） |

跨边界唯一改写（机检核实）：
- import 行与 export 签名
- `buildIngestMaterialModel(m)` 包装与 `IngestMaterialModel` 类型导出
- `IngestMaterialCard` 与 `IngestMaterialQualityPanels` 的 props 接口声明与解构
- `qualityWarn`、`CopyCommand`、`STAGE_UI`、className、UI 文案多重集 Δ0

## 装配 / import 图

- `page.tsx` → `lib/entities`（loadMaterials / loadBookValidPages / loadAllChapterPages / collectStudyAtoms）+ `lib/heye`（collectCiteQueue）+ `components/IngestUpload` + `components/IngestMaterialCard` + `lib/ingest-material-model`（buildIngestMaterialModel）
- `IngestMaterialCard.tsx` → `lib/entities`（materialChapterHasBlocks / materialChapterHasCards）+ `components/RegisterMaterialButton` + `components/IngestReadyLinks` + `components/CopyCommand` + `components/IngestMaterialQualityPanels` + `lib/ingest-material-model`（findDeskBook / IngestMaterialModel）
- `IngestMaterialQualityPanels.tsx` → `next/link` + `components/CopyCommand` + `lib/ingest-material-model`（IngestMaterialModel）
- `ingest-material-model.ts` → `lib/entities` + `lib/cite-ocr-quality` + `lib/parse-ocr-coverage-server` + `lib/extract-page-coverage-server` + `lib/extract-page-density-server` + `lib/atom-draft`（纯 lib，零 JSX，零 component 依赖）

无循环依赖。所有 loader 条件、调用次数与执行时机与 tip 严格恒等。

## 公共 API / 铁合同

- 页面路由保持 `apps/web/app/(shell)/ingest/page.tsx`，`export const dynamic = "force-dynamic"` 保持（build 产物 `/ingest` 仍为 `ƒ Dynamic`）。
- Register 软门禁守恒：`qualityWarn` 包含的全部字段（`ocrMiss` / `zeroAtomCards` / `missRate` / `nullPage` / `parseWeak` / `emptyPages` / `sparsePages` / `darkPages` / `darkCount` / `darkRate` / `shallowPages` / `shallowCount` / `shallowRate`）形状与推导逻辑逐字 ≡ tip。
- `RegisterMaterialButton` / `IngestReadyLinks` / `IngestUpload` / `CopyCommand` 四个组件零触碰（零 diff）。
- 冻结文件 `HeYeSession.tsx` / `StudySession.tsx` 零触碰（零 diff）。

## KEEP 铁律（本刀遵守）

- `pnpm --filter web lint` 保持恰好 2 problems (2 errors, 0 warnings)，定位严格锁定在 `HeYeSession.tsx:88` 和 `StudySession.tsx:106`（`react-hooks/set-state-in-effect`）。
- `pnpm --filter web exec tsc --noEmit` 保持 exit 0。
- `pnpm --filter web build` 保持 exit 0，无新依赖。
- 未改动任何颜色、Tailwind token、全局 CSS 或 UI 文本。朱砂（cinnabar）仍是唯一品牌强调色。
- 无 `git commit` / `push` / `stash` / `reset` / `clean` / `rebase`，保持 dirty tree 交付。

## 验证

- `pnpm --filter web exec tsc --noEmit` → exit 0。
- `pnpm --filter web lint` → 2 problems (2 errors, 0 warnings)，与 tip 基线严格一致。
- `pnpm --filter web build` → exit 0，`/ingest` 路由为 `ƒ (Dynamic)`。
- 既有校验脚本 `pnpm cite-check`、`pnpm parse-check`、`pnpm page-check`、`pnpm density-check`、`pnpm qa-check`、`pnpm clew-check` 全部 exit 0。
- className 多重集比对：tip (67) ≡ after (67)，Δ0。
- `CopyCommand` command 属性比对：tip (5) ≡ after (5)，多重集 100% 严格一致。
- `qualityWarn` 属性表达式机检：100% 逐字吻合。
- `IngestReadyLinks` 与 `RegisterMaterialButton` 标签及 props 机检：100% 严格吻合。
- 视觉与渲染验证：无物料空态与有物料卡片状态在 1280×800 下均正常渲染（curl / headless Chrome 截图确认），无任何运行时错误或样式漂移。

## DEFER

- **EntityCardDetail（552 行）DEFER**：仍 <3 顶层清晰机械缝，本阶段不碰。
- **DocumentPane 第三刀 DEFER**：无 ≥3 NEW 命名机械缝，不 densify 状态机。
- **ClewPane further DEFER**：OUT。
- **HeYeSession / StudySession further DEFER**：核心会话组件，冻结点所在，零触碰。
- **study / review / library pages further DEFER**：已拆页面保持稳定。

## OUT（本刀不做）

- Register 硬门禁改动（OUT）
- Clew 真写 / verified:true / 自动 PATCH entities / 一键写回仓库（OUT）
- Next.js 升级 / pnpm up / 新依赖（OUT）
- 改动朱砂以外的任何颜色或增加新样式 token（OUT）
- 篡改 ESLint 配置或 eslint-disable 掩盖问题（OUT）
- git commit / push / stash / reset / clean / rebase（OUT）
