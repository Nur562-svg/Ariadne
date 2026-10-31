# Task 99 · desk-review-page-split-01 · 诚实 MEGA

tip：`a1bf73e`（docs T98 desk-study-page-split-01）atop `37d2816`（feat T98）atop `f177290`（T97 docs）。主题：
/review 核页 `apps/web/app/(desk)/review/page.tsx`（**633** 行）诚实 MEGA-split——服务端
装配 / 页铬 JSX / sticky 工具带 JSX 三段机械抽出 + 瘦 page 收口。只搬既有组、跨文件边界零语义
改写；无 densify、无新 CTA、无产品视觉改动、不碰冻结、零触 HeYeSession.tsx / StudySession.tsx。

inventory honesty：T73–T98 之后 UI/lib 清单已明显变薄；用户偏好 LARGER fat page。本刀
选 tip 上最大的诚实剩余 fat page（review 633，三条清晰机械缝：数据装配 :72–324 / chrome
JSX :327–495 / sticky JSX :497–602），**不**交 ~100–160 薄 lib scrap 冒充主题，**不**硬切
已无 ≥3 新命名缝的 DocumentPane（277）/ ClewPane（222），**不**以 EntityCardDetail 两根
薄 helper 充刀，**不**同刀拆 ingest Register（655）（见 DEFER）。空态正文已在 HeYeSession
内（`emptyKind` prop），本刀**不**另造 Empty 文件充数。

## before → after LOC

| 文件 | before | after | 说明 |
| --- | --- | --- | --- |
| `apps/web/app/(desk)/review/page.tsx` | 633 | **105** | 瘦 page（≤300 达标，≤250 目标达成） |
| `apps/web/lib/review-page-scope.ts` | — | 351 | 新抽出（服务端装配 · 无 `"use client"`） |
| `apps/web/components/ReviewPageChrome.tsx` | — | 226 | 新抽出（页铬 · RSC） |
| `apps/web/components/ReviewPageSticky.tsx` | — | 149 | 新抽出（sticky 工具带 · RSC） |

抽出件 3 个（≥3 达标）；page:抽出件行数比 105 : 726。tracked diff 仅 page.tsx
（+37 / −565）。总行 633 → 831：+198 全为 header 注释 / imports / 函数签名 / 解构 /
`return {…}` 模型尾 / 类型别名——无 fake pad，无空壳第四文件。

## 缝映射（源行段 → 目标文件，tip a1bf73e 行号）

| tip 行段 | 内容 | 去向 |
| --- | --- | --- |
| :1–26 | imports | page 收窄为 6 条；其余随抽出件迁移（entities / heye / examinable-coverage-server / heye-store 类型 → scope；Link / withQsMode / HeYeScopeCounts / LocalProgressStrip / DeskSurfaceBridge / StickyModeGate / LastOpenedTouch → Chrome；Link / StickyPageLoopKeys / StickyHeYeModeTabs / ReturnNav / CrossScopeReturnLink / SessionKeyHint → Sticky） |
| :27 | `dynamic = "force-dynamic"` | page 留（逐字） |
| :29–36 | header 注释 | page 留（逐字；追加 T99 段） |
| :37–55 | `export default function ReviewPage` wrapper → Suspense → ReviewBody | page 留（唯一改写：内联 `Promise<{book?…mode?}>` → `Promise<ReviewPageSearchParams>`，形状逐字） |
| :57–71 | `async function ReviewBody` 签名 | page 留（同上类型别名化） |
| :72–73 | `const { book: bookId, … } = await searchParams;` | page `await searchParams` → `buildReviewPageScope(sp, chapters, books)`；解构落 scope `= sp;` |
| :74–324 | T16–T60 QS 消毒 · invalidBook/Card/Page/Mode/Chapter · chapterOutsideBook · effChapter · heyeScopeKey · heyeStickyScope · items · wanted · pages · cardBook · scopeBook · orphanReview · scopeLabel · cardHref · studyHref · deskPageHref · deskHref · scopeBookValidPages · chipChapters · qs helper · clearPageHref · chipIndex · prev/nextChapterHref · pageStudyAtoms · scopeStudyAtoms · scopeItems · stripStudyPageScope · stripHeYePageScope · sideScopeLabel · stripScopeLabel · stripAtoms · stripItemKeys · progressStudyQs · progressStudyHref · progressReviewQs · progressReviewHref · reviewReturnTo · crossStudyAtomCount · cardWidePending · emptyKind · stickyKeys · clearChapterHref · pageExam · orphanDark · pageShallow | `lib/review-page-scope.ts` :31–350（**250+ 行 `diff` 逐字零差**，同 2 空格缩进）；尾部 `return {…}` 导出字段；`ReviewPageScope = ReturnType<…>` |
| :325–326 | `return (` + `<div className="mx-auto w-full max-w-5xl px-8 py-10">` | page 留（外层包装 div 不入 Chrome——会话必须在包装内） |
| :327–495 | DeskSurfaceBridge · StickyModeGate · LastOpenedTouch · `<header>`（标题/说明/坏 QS·orphan 琥珀/范围文案/HeYeScopeCounts）· LocalProgressStrip | `components/ReviewPageChrome.tsx` :56–224（Fragment 收口；**168 行 `diff` 逐字零差**，整段缩进 6→4） |
| :497–602 | StickyPageLoopKeys + sticky 工具带 `div` 整块：本页 pill·清本页 / 章芯片 / StickyHeYeModeTabs / ReturnNav+CrossScopeReturnLink / SessionKeyHint | `components/ReviewPageSticky.tsx` :46–147（Fragment 收口；**102 行 `diff` 逐字零差**，整段缩进 6→4） |
| :604–632 | `<HeYeSession key={heyeScopeKey} … leaveReturnTo={reviewReturnTo} />` 29 行含注释 | page 留 :54–81（**29 行 `diff` 逐字零差**，同 6 空格缩进） |

跨边界唯一改写（机检：四文件所有非 tip 逐字行恰好只落在下列类别）：
import 行；函数签名 / props 类型；内联 QS 类型提升为命名导出 `ReviewPageSearchParams`
（形状逐字）；scope 尾部 `return {…}` + `ReviewPageScope = ReturnType<…>`；三处
`const { … } = scope;` / `= sp;` 解构（变量名与 tip 一致，JSX 内引用零改）；Chrome
Fragment `<>`/`</>` 收口；Sticky Fragment `<>`/`</>` 收口；T99 header 注释。
**无任何 className / 文案 / href 构造 / 门禁 / aria / title 行变化。**

### `qs` 跨边界处理

tip 的 `qs` 是 ReviewBody 内闭包（捕获 book / card / effChapter / pageNum / mode）。
本刀把它作为模型字段 `scope.qs` 原样导出，Chrome / Sticky / page 三方调用点
（`/review${qs({ mode: … })}` × 6 = Chrome 4 + Sticky 2、`qs({ clearPage: true })` × 2、
`qs({ chapter: null })` × 2、`qs({ chapter: c.id })` map）**模板字面量逐字**——不预算第二套 hrefs 表、不改任何
URL 构造点。RSC → RSC 传函数 prop 合法（三件均无 `"use client"`，无序列化边界）。

## 装配 / import 图

page → `lib/entities`（loadChapters / loadBooks）+ `lib/review-page-scope`（builder + QS 类型）
+ `components/HeYeSession` + `components/ReviewPageChrome` + `components/ReviewPageSticky`；
Chrome → `lib/review-page-scope`（type-only）+ `lib/qs-mode` + 5 个既有 UI 消费方
（DeskSurfaceBridge / StickyModeGate / LastOpenedTouch / HeYeScopeCounts / LocalProgressStrip）；
Sticky → `lib/review-page-scope`（type-only）+ 5 个既有 UI 消费方
（StickyPageLoopKeys / StickyHeYeModeTabs / ReturnNav / CrossScopeReturnLink / SessionKeyHint）；
scope → `lib/entities` / `lib/heye` / `lib/examinable-coverage-server` / `lib/heye-store`（type）——
纯 lib，零 component import。
scope ↛ Chrome/Sticky/page · Chrome ↛ Sticky/page · Sticky ↛ Chrome/page——无循环。
`buildReviewPageScope` 与 tip 同序：`await searchParams` 之后、`return (` 之前一次调用；
所有 loader（loadCard / collectCiteQueue × ≤2 / loadAllChapterPages / loadBookValidPages /
collectStudyAtoms × ≤2 / loadPageExaminable）调用次数与条件 ≡ tip。

## 公共 API / 铁合同（B）

- `export default function ReviewPage` 仍在 `app/(desk)/review/page.tsx`；`ReviewBody` 保留；
  `dynamic = "force-dynamic"` KEEP（build 产物 `/review` 为 ƒ Dynamic）。
- 仍渲染 `<HeYeSession …/>`，**全部 17 个 props（含 key）名与值表达式逐字 ≡ tip**（含 T52
  `emptyKind={emptyKind}`、T51 `atomCount={crossStudyAtomCount}`、T58 `orphanDark={orphanDark}`、
  T60 `pageShallow={pageShallow}`、`leaveReturnTo={reviewReturnTo}`）；**HeYeSession.tsx
  零 diff**。
- QS 消毒（invalidBook/Card/Page/Mode/Chapter · chapterOutsideBook · effChapter）/ orphanReview 判定
  / emptyKind 三态 / stickyKeys / studyHref（T39 恒 `&mode=all`）· deskPageHref · deskHref ·
  progress* 深链 / cross-scope `reviewReturnTo` 口径 ≡ tip（250+ 行派生逐字）。
- 既有消费方 **内容**零改：StickyModeGate / StickyHeYeModeTabs / StickyPageLoopKeys /
  HeYeScopeCounts / ReturnNav / CrossScopeReturnLink / SessionKeyHint / DeskSurfaceBridge /
  LastOpenedTouch / LocalProgressStrip 文件零 diff，Chrome / Sticky / page 继续传同等 props。

## KEEP 铁律（本刀遵守）

- HeYeSession:88 `setIndex` · StudySession:106 `setOrder` 两处冻结零触碰；lint 2/2e/0w/SSE2
  与 tip 基线一致（恰为 HeYeSession.tsx:88:9 / StudySession.tsx:106:5），无 eslint-disable
  捂 SSE、无关 SSE 规则、无新增同步 effect 内 setState（三件抽出均为 RSC，无 effect）。
- 零 diff：HeYeSession / StudySession / EntityCardDetail / CitePeek / Sidebar / ClewChangesPanel /
  ClewPane* / DocumentPane* / Library shelf*（T97 三件）/ Study T98 extracts（三件）/ entities* 五件 + barrel /
  clew-pane-helpers（T75 BAN）/ ingest / T80–T98 全部已闭 extracts。
- 抽出 ≠ densify：无新 CTA、无 sticky/empty/return densify、无掌握%圆环、无 UI 文案 /
  className / href 构造 / 门禁变化；视觉 ≡ tip（页头 / sticky 工具带 / 会话壳）。
- Clew / seed 只读铁律不受影响：未触碰 seed / provider / usage / entities JSON / seed-apply
  任何路径；无 verified:true、无 LiteLLM/Auto/BYOK/云墙、无 NEXT_PUBLIC_*、无 key 入仓、
  无 bulk pages[]·chapters[]。
- 存储键零改：ariadne.heye.v1 / ariadne.desk.return.v1 / sticky·cursor 键只经既有消费方，
  本刀未发明或改名任何 key。

## 验证（tip a1bf73e 工作区）

- `pnpm --filter web exec tsc --noEmit` → exit 0。
- `pnpm --filter web lint` → 2 problems（2 errors / 0 warnings）= 基线；两处恰为
  HeYeSession.tsx:88:9 与 StudySession.tsx:106:5（`react-hooks/set-state-in-effect`，冻结 KEEP）。
- 既有夹具：cite-check / parse-check 全 exit 0；运行后 tracked 无副作用 diff。
- `git status`：tracked 仅 `apps/web/app/(desk)/review/page.tsx`（M，+37/−565）；新增
  untracked 三件 `lib/review-page-scope.ts` / `components/ReviewPageChrome.tsx` /
  `components/ReviewPageSticky.tsx` 及本文档草稿。
- 逐字机检（`git show a1bf73e:…` 三段 vs 新文件对应段 `diff`）：scope 体 250+ 行零差；
  Chrome JSX 168 行零差（de-indent 2）；Sticky JSX 102 行零差（de-indent 2）；
  HeYeSession 调用 29 行零差；ReviewPage wrapper 唯一差异 = QS 类型别名化。
- 三件新文件 + page 均无 `"use client"` 指令、无 eslint-disable。

## DEFER

- **EntityCardDetail（552 行）DEFER**：tip a1bf73e 复测仍仅 citeStats(17–43) /
  firstPagedCitePage(46–51) 两根薄 helpers；fields / atoms / OCR 补救 / 草稿条 JSX 缝稠——
  citeStats + firstPagedCitePage alone 不足以下刀（会滑向薄 scrap）。
- **DocumentPane 第三刀 DEFER**：tip 277 行编排器无 ≥3 NEW 命名机械缝，再切 = densify
  状态机。
- **ClewPane further DEFER**：tip 222 行编排器无 ≥3 NEW 命名机械缝，OUT。
- **HeYeSession / StudySession further DEFER**：核心会话组件，冻结点所在，不轻切。
- **study page further DEFER**：T98 已闭 · page 115 已瘦 · 禁 redo extracts。
- **ingest Register（655）DEFER**：Register 硬门禁风险，不入 UI 拆分序列。

## OUT（本刀不做）

densify · 空池 CTA / return / sticky densify · 掌握%/健康圆环 · gut 冻结 · 可写 seed-apply
（--write/--apply）· 「一键写回仓库」· 拆 EntityCardDetail/CitePeek/ClewChangesPanel/Sidebar/
ClewPane further/DocumentPane 第三/Library shelf/Study T98 extracts/HeYe 主流程/StudySession.tsx/entities*/
DocumentPane*/clew-pane-helpers/已闭 barrel/study further/ingest Register · verified:true ·
LiteLLM/Auto/BYOK/云墙 · 改 orphan/emptyKind/QS/sticky/return/cross-scope 口径 ·
预算第二套 hrefs 表 · 薄 ~100–160 lib scrap 冒充 · 另造 Empty 文件充数 · push（验收方 auto-push）。
