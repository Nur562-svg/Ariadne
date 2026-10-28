# Task 97 · desk-library-shelf-split-01 · 诚实 MEGA

tip：`31b6b23`（docs T96）atop `f1e11d9`（feat T96）。主题：Library 书库页
`apps/web/app/(desk)/page.tsx`（492 行）诚实 MEGA-split——服务端装配 / 单书卡 JSX /
三行信号徽 JSX 三段机械抽出 + 瘦 page 收口。只搬既有组、跨文件边界零语义改写；
无 densify、无新 CTA、无产品视觉改动、不造第四书架徽列、不碰冻结。

inventory honesty：T73–T96 之后 UI/lib 清单已明显变薄；用户偏好 LARGER fat page。本刀
选 tip 上最大的诚实剩余 fat page（Library 492，三条清晰机械缝），**不**交 ~100–160 薄 lib
scrap 冒充主题，**不**硬切已无 ≥3 新命名缝的 DocumentPane（277）/ ClewPane（222），
**不**以 EntityCardDetail 两根薄 helper 充刀（见 DEFER）。

## before → after LOC

| 文件 | before | after | 说明 |
| --- | --- | --- | --- |
| `apps/web/app/(desk)/page.tsx` | 492 | **121** | 瘦 page（≤200 达标，≤180 目标达成） |
| `apps/web/lib/library-shelf-data.ts` | — | 245 | 新抽出（服务端装配 · 无 `"use client"`） |
| `apps/web/components/ShelfBookCard.tsx` | — | 172 | 新抽出（单书卡） |
| `apps/web/components/ShelfBookSignalBadges.tsx` | — | 104 | 新抽出（三行信号徽） |

抽出件 3 个（≥3 达标）；page:抽出件行数比 121 : 521。tracked diff 仅 page.tsx（+35 / −407）。

## 缝映射（源行段 → 目标文件，tip 31b6b23 行号）

| tip 行段 | 内容 | 去向 |
| --- | --- | --- |
| :1–31 | imports + header 注释 + `dynamic = "force-dynamic"` | page 留（imports 收窄为 8 条；注释追加 T97 段） |
| :33–34 | `export default function Library()` + `loadBooks()` | page 留 |
| :35–220 | T31 validPages · T50 poolsByBook · T62 inboxCards/draftCardIndex · T63 chapterTitles/rollupByChapter/incompleteCardSummaries · T55 chapterCheck + bookQuality 折叠 · T56 bookParse · T57 bookExtractPage · T59 bookDensity | `lib/library-shelf-data.ts` → `buildLibraryShelfData(books)` 返回同名十字段 |
| :222–244 | 空库分支（文案 / ol 三步 / 去导入教材 CTA） | page 留（逐字；未另造 LibraryEmpty 空壳） |
| :246–261 | 主返回头 + T21/T31/T50 注释 + `<LibraryContinuity>` | page 留（逐字） |
| :262–273 | `<ul>` + `books.map` + 每书派生 cards/atoms/ocrPages/deskHref/studyHref/reviewHref | `<ul>`/map 留 page（map 体 → `<ShelfBookCard key={b.id} …/>`）；派生随 Card |
| :274–342 | `<li>` 头：标题链 · T25/T46 打开书桌 OCR 门禁 + 去解析 · ShelfBookContinuity · T46 四格 dl | `components/ShelfBookCard.tsx`（`<li>` 去 key，key 上提到 page map） |
| :343–416 | T55 质量偏弱 · T56 OCR覆盖偏弱 · T57+T59+T65 抽出偏稀（暗+浅旁挂）三 IIFE + 注释 | `components/ShelfBookSignalBadges.tsx`（Fragment 收口；三 IIFE 逐字） |
| :417–461 | 章列表 `<p>` · T21/T36/T39 注释 + LocalProgressStrip · footer 卡浏览器 + T34/T37/T50 注释 + ShelfBookFooterLinks | `components/ShelfBookCard.tsx` |
| :467–490 | T24 ProgressPortability · T62 DraftInbox · T63 ChapterQualityCockpit · 底注 | page 留（逐字；未另造 UtilityZone 空壳） |

跨边界唯一改写（机检：四文件所有非 tip 逐字行恰好只落在下列类别）：
import 行；函数签名 / props 类型；三处内联 Record 值类型提升为命名导出
`ShelfBookParseSignal` / `ShelfBookExtractPageSignal` / `ShelfBookDensitySignal`（形状逐字）；
data 尾部 `return {…}` + `LibraryShelfData = ReturnType<…>`；`bookQuality[b.id]` 等查表
→ 同名 prop 别名（`const q = quality;` 等）；`bookValidPages[b.id]` → `validPages`、
`poolsByBook[b.id].*` → `pools.*`；`<li key>` 去 key；三 IIFE → `<ShelfBookSignalBadges>`。
**无任何 className / 文案 / href / 门禁 / title 行变化。**

## 装配 / import 图

page → `lib/library-shelf-data`（builder）+ `components/ShelfBookCard`；
Card → `components/ShelfBookSignalBadges` + `lib/library-shelf-data`（type-only）+ 既有
LocalProgressStrip / ShelfBookContinuity / heye / entities / qs-mode；
Badges → `lib/cite-ocr-quality` + `lib/library-shelf-data`（type-only）。
data ↛ Card/Badges/page · Badges ↛ Card/page · Card ↛ page——无循环。
`buildLibraryShelfData(books)` 与 tip 同序在空库分支**之前**调用（空库时同样执行全部
loader，语义 ≡ tip）。三件均无 `"use client"`（与 tip page 同为服务端模块；Card/Badges
内 Link 与既有 client 岛的用法 ≡ tip page）。

## KEEP 铁律（本刀遵守）

- `export default function Library` 仍在 `app/(desk)/page.tsx`；`dynamic = "force-dynamic"`
  KEEP（build 产物 `/` 为 ƒ Dynamic）；空库分支文案 / ol / CTA ≡ tip。
- 徽三分列：T55 质量 · T56 OCR覆盖 · T57+T59 抽出偏稀（暗+浅旁挂同一点名行，T65「本书占
  实质页」文案）——不拆第四大红独立列；好书 / 未检各行 `return null` 静音 ≡ tip；次级
  /ingest 去补救 / 去补扫 / 去重抽 链保留；无掌握% / Due / 圆环。
- 折叠算法一字不改：missRate / darkRate / shallowRate 书级合计重算、未检 `null` / `unchecked`
  计数、`chapterCheck` 跨书 Map 缓存、`qs.length === 0 → null`；不在 data 模块改写
  scoreChapter / loadParseCoverage / loadExtractPage* 语义、不发明第二套池。
- poolsByBook / bookValidPages / mode=all|open / heal 读侧口径 ≡ tip：Card 内 deskHref /
  studyHref(`&mode=all`) / reviewHref(`&mode=open`) / `withQsMode` 三档 / `returnTo` 书架
  label / `collectStudyAtoms` · `collectCiteQueue` 书级池 逐字；T46 OCR 门禁 ≡ tip。
- 既有消费方 **内容**零改：ShelfBookContinuity / ShelfBookFooterLinks / LocalProgressStrip /
  LibraryContinuity / DraftInbox / ChapterQualityCockpit / ProgressPortability 文件零 diff，
  page / Card 继续传同等 props。
- HeYeSession:88 `setIndex` · StudySession:106 `setOrder` 两处冻结零触碰；lint 2/2e/0w/SSE2
  与 tip 基线一致，无 eslint-disable 捂 SSE、无新增同步 effect 内 setState。
- 零 diff：HeYeSession / StudySession / EntityCardDetail / CitePeek / Sidebar / ClewChangesPanel /
  ClewPane* / DocumentPane* / entities* 五件 + barrel / clew-pane-helpers / T80–T96 全部
  已闭 extracts。
- Clew / seed 只读铁律不受影响：本刀未触碰 seed / provider / usage / entities JSON / seed-apply
  任何路径；无 verified:true、无 LiteLLM/Auto/BYOK/云墙、无 NEXT_PUBLIC_*、无 key 入仓。

## 验证（tip 31b6b23 工作区）

- `pnpm --filter web exec tsc --noEmit` → exit 0。
- `pnpm --filter web lint` → 2 problems（2 errors / 0 warnings）= 基线；两处恰为
  HeYeSession.tsx:88:9 与 StudySession.tsx:106:5（`react-hooks/set-state-in-effect`，冻结 KEEP）。
- `pnpm --filter web build` → PASS（16 条路由全产出；`/` ƒ Dynamic）。
- 既有夹具：parse-check / cite-check / page-check / density-check / qa-check / clew-check
  全 exit 0；运行后 tracked 无副作用 diff。seed-apply-check 需 stdin 补丁包（T64 次级面，
  T96 已记为 tip 既有行为），与本刀无关未跑。
- `git status`：tracked 仅 `apps/web/app/(desk)/page.tsx`（M）；新增 untracked 三件
  `lib/library-shelf-data.ts` / `components/ShelfBookCard.tsx` /
  `components/ShelfBookSignalBadges.tsx`。
- 逐字机检：四文件每行去缩进后与 tip 原文集合比对，非命中行全部属于上节「跨边界唯一
  改写」类别。

## DEFER

- **EntityCardDetail（552 行）DEFER**：tip 31b6b23 复测仍仅 citeStats(17–43) /
  firstPagedCitePage(46–51) 两根薄 helpers；fields / atoms / OCR 补救 / 草稿条 JSX 缝稠——
  citeStats + firstPagedCitePage alone 不足以下刀（会滑向薄 scrap）。
- **DocumentPane 第三刀 DEFER**：tip 277 行编排器无 ≥3 NEW 命名机械缝，再切 = densify
  状态机。
- ClewPane further（222）：无 ≥3 NEW 命名机械缝，OUT。

## OUT（本刀不做）

densify · 空池 CTA / return densify · 第四书架徽列 · 掌握%/健康圆环 · gut 冻结 · 可写
seed-apply · 拆 EntityCardDetail/CitePeek/ClewChangesPanel/Sidebar/ClewPane further/
DocumentPane 第三/HeYe 主流程/Study 主流程/entities*/DocumentPane*/clew-pane-helpers/
已闭 barrel · verified:true · LiteLLM/Auto/BYOK/云墙 · 改 bookQuality 第二套口径 ·
薄 ~100–160 lib scrap 冒充 · push（验收方 auto-push）。
