# Task 98 · desk-study-page-split-01 · 诚实 MEGA

tip：`f177290`（docs T97）atop `7617aae`（feat T97）atop `31b6b23`（T96 docs）。主题：
/study 学习页 `apps/web/app/(desk)/study/page.tsx`（**794** 行）诚实 MEGA-split——服务端
装配 / 页铬 JSX / 空态 JSX 三段机械抽出 + 瘦 page 收口。只搬既有组、跨文件边界零语义
改写；无 densify、无新 CTA、无产品视觉改动、不碰冻结、零触 StudySession.tsx。

inventory honesty：T73–T97 之后 UI/lib 清单已明显变薄；用户偏好 LARGER fat page。本刀
选 tip 上最大的诚实剩余 fat page（study 794，三条清晰机械缝：数据装配 :66–355 / chrome
JSX :359–629 / empty JSX :632–755），**不**交 ~100–160 薄 lib scrap 冒充主题，**不**硬切
已无 ≥3 新命名缝的 DocumentPane（277）/ ClewPane（222），**不**以 EntityCardDetail 两根
薄 helper 充刀，**不**同刀拆 review twin（634）/ ingest Register（656）（见 DEFER）。

## before → after LOC

| 文件 | before | after | 说明 |
| --- | --- | --- | --- |
| `apps/web/app/(desk)/study/page.tsx` | 794 | **115** | 瘦 page（≤350 达标，≤300 目标达成） |
| `apps/web/lib/study-page-scope.ts` | — | 379 | 新抽出（服务端装配 · 无 `"use client"`） |
| `apps/web/components/StudyPageChrome.tsx` | — | 343 | 新抽出（页铬 · RSC） |
| `apps/web/components/StudyPageEmpty.tsx` | — | 159 | 新抽出（空态正文 + CTA 行 · RSC） |

抽出件 3 个（≥3 达标）；page:抽出件行数比 115 : 881。tracked diff 仅 page.tsx
（+37 / −716）。总行 794 → 996：+202 全为 header 注释 / imports / 函数签名 / 解构 /
`return {…}` 模型尾 / 类型别名——无 fake pad，无空壳第四文件。

## 缝映射（源行段 → 目标文件，tip f177290 行号）

| tip 行段 | 内容 | 去向 |
| --- | --- | --- |
| :1–18 | imports | page 收窄为 6 条；其余随抽出件迁移（Link / withQsMode / 10 个 UI 消费方 → Chrome；Link / ReturnNav / CrossScopeReturnLink → Empty；entities / heye / examinable-coverage-server / study 类型 → scope） |
| :20–22 | `dynamic = "force-dynamic"` · `DIFF_ZH` | page 留（逐字） |
| :24–30 | header 注释 | page 留（逐字；追加 T98 段） |
| :31–49 | `export default function StudyPage` wrapper → Suspense → StudyBody | page 留（唯一改写：内联 `Promise<{book?…page?}>` → `Promise<StudyPageSearchParams>`，形状逐字） |
| :51–65 | `async function StudyBody` 签名 | page 留（同上类型别名化） |
| :66–72 | `const { book: bookId, … } = await searchParams;` | page `await searchParams` → `buildStudyPageScope(sp, chapters, books)`；解构落 scope `= sp;` |
| :73–355 | T43 QS 消毒 · effChapter · bookByChapter · scopeBook · chipChapters · T27 本页池 atoms / heyeItems · T29 orphanStudy · T43 cardOutOfRange · T20 双键 · T27/T29 deskPageHint · qs helper · T28 widenPageHref / prev·next ChapterHref / stickyKeys · scopeLabel · deskHref · T39 reviewHref · cardHref · T31 scopeBookValidPages · T29 strip* 同源池与标签 · progressStudy/ReviewHref · T40 studyReturnTo · T58 pageOwner / examCoverage · T60 pageExam | `lib/study-page-scope.ts` :43–325（**283 行 `diff` 逐字零差**，同 2 空格缩进）；尾部 `return {…}` 导出 47 字段；`StudyPageScope = ReturnType<…>` |
| :357–358 | `return (` + `<div className="mx-auto w-full max-w-3xl px-8 py-10">` | page 留（外层包装 div 不入 Chrome——空态/会话必须在包装内） |
| :359–629 | DeskSurfaceBridge · StickyModeGate · LastOpenedTouch · `<header>`（标题/范围说明/7 条坏 QS 琥珀/StudyScopeCounts/LocalProgressStrip）· StickyPageLoopKeys · sticky 工具带（本页 pill+清本页 / 章芯片 / StickyStudyModeTabs / ReturnNav+CrossScopeReturnLink / SessionKeyHint）· 原子计数 · T58 暗条 · T60 浅条 · T60 本页浅旁挂 | `components/StudyPageChrome.tsx` :69–341（Fragment 收口；**271 行 `diff` 逐字零差**，同 6 空格缩进） |
| :631 / :756 / :791 | `{atoms.length === 0 ? (` … `) : (` … `)}` 三元骨架 | page 留 |
| :632–755 | 空态 `<div className="mt-8">`：T43 B 四型正文（T58 D 暗页 orphan / 普通 orphan+sparse / 卡出界 / T52 F 无书全局 / 真无原子）+ CTA 行（回本卡 · T51 I 核本卡门禁 · T27 C 放宽主 CTA 三选 · T23 A ReturnNav showReturn） | `components/StudyPageEmpty.tsx` :33–158（**124 行 `diff` 逐字零差**，整段缩进 8→4） |
| :757–790 | `<StudySession key={studyScopeKey} … shallowCount={…} />` 34 行含 T51/T58/T60 注释 | page 留 :78–111（**34 行 `diff` 逐字零差**，同 8 空格缩进） |

跨边界唯一改写（机检：四文件所有非 tip 逐字行恰好只落在下列类别）：
import 行；函数签名 / props 类型；内联 QS 类型提升为命名导出 `StudyPageSearchParams`
（形状逐字）；scope 尾部 `return {…}` + `StudyPageScope = ReturnType<…>`；三处
`const { … } = scope;` / `= sp;` 解构（变量名与 tip 一致，JSX 内引用零改）；Chrome
Fragment `<>`/`</>` 收口；空态分支体 → `<StudyPageEmpty scope={scope} />`；T98 header 注释。
**无任何 className / 文案 / href 构造 / 门禁 / aria / title 行变化。**

### `qs` 跨边界处理

tip 的 `qs` 是 StudyBody 内闭包（捕获 scopedCard / activeBook / effChapter / pageNum /
mode）。本刀把它作为模型字段 `scope.qs` 原样导出，Chrome / Empty / page 三方调用点
（`/study${qs({ mode: … })}` × 12 = Chrome 9 + page 3、`qs({ clearPage: true })` × 2、
`qs({ chapter: null })` × 2、`qs({ chapter: c.id })` map）**模板字面量逐字**——不预算第二套 hrefs 表、不改任何
URL 构造点。RSC → RSC 传函数 prop 合法（三件均无 `"use client"`，无序列化边界）。

## 装配 / import 图

page → `lib/entities`（loadChapters / loadBooks）+ `lib/study-page-scope`（builder + QS 类型）
+ `components/StudySession` + `components/StudyPageChrome` + `components/StudyPageEmpty`；
Chrome → `lib/study-page-scope`（type-only）+ `lib/qs-mode` + 10 个既有 UI 消费方
（DeskSurfaceBridge / StickyModeGate / LastOpenedTouch / StudyScopeCounts / LocalProgressStrip /
StickyPageLoopKeys / StickyStudyModeTabs / ReturnNav / CrossScopeReturnLink / SessionKeyHint）；
Empty → `lib/study-page-scope`（type-only）+ ReturnNav + CrossScopeReturnLink；
scope → `lib/entities` / `lib/heye` / `lib/examinable-coverage-server` / `lib/study`（type）——
纯 lib，零 component import。
scope ↛ Chrome/Empty/page · Chrome ↛ Empty/page · Empty ↛ Chrome/page——无循环。
`buildStudyPageScope` 与 tip 同序：`await searchParams` 之后、`return (` 之前一次调用；
所有 loader（loadCard / collectStudyAtoms × ≤2 / collectCiteQueue × ≤2 / loadBookValidPages /
findPageByPrinted / scopeExaminableCoverage / loadPageExaminable）调用次数与条件 ≡ tip。

## 公共 API / 铁合同（B）

- `export default function StudyPage` 仍在 `app/(desk)/study/page.tsx`；`StudyBody` 保留；
  `dynamic = "force-dynamic"` KEEP（build 产物 `/study` 为 ƒ Dynamic）。
- 非空态仍渲染 `<StudySession …/>`，**全部 25 个 props（含 key）名与值表达式逐字 ≡ tip**（含 T60
  E/I `densityWeak` / `shallowCount` 旁挂、T58 E/I `examinableWeak` / `darkCount`、T51 I
  `pendingCount={heyeItems.length}`、`key={studyScopeKey}` remount 契约）；**StudySession.tsx
  零 diff**。
- QS 消毒（invalidBook/Card/Page/Chapter/Mode · chapterOutsideBook · effChapter）/ orphan 判定
  / cardOutOfRange / examCoverage weak·densityWeak / pageExam shallow·dark·sparse / stickyKeys /
  studyScopeKey·studyStickyScope 双键 / deskHref·reviewHref（T39 恒 `&mode=open`）·
  widenPageHref·progress* 深链 / cross-scope `studyReturnTo` 口径 ≡ tip（283 行派生逐字）。
- 既有消费方 **内容**零改：StickyModeGate / StickyStudyModeTabs / StickyPageLoopKeys /
  StudyScopeCounts / ReturnNav / CrossScopeReturnLink / SessionKeyHint / DeskSurfaceBridge /
  LastOpenedTouch / LocalProgressStrip 文件零 diff，Chrome / Empty / page 继续传同等 props。

## KEEP 铁律（本刀遵守）

- HeYeSession:88 `setIndex` · StudySession:106 `setOrder` 两处冻结零触碰；lint 2/2e/0w/SSE2
  与 tip 基线一致（恰为 HeYeSession.tsx:88:9 / StudySession.tsx:106:5），无 eslint-disable
  捂 SSE、无关 SSE 规则、无新增同步 effect 内 setState（三件抽出均为 RSC，无 effect）。
- 零 diff：HeYeSession / StudySession / EntityCardDetail / CitePeek / Sidebar / ClewChangesPanel /
  ClewPane* / DocumentPane* / Library shelf*（T97 三件）/ entities* 五件 + barrel /
  clew-pane-helpers（T75 BAN）/ review/page / ingest / T80–T97 全部已闭 extracts。
- 抽出 ≠ densify：无新 CTA、无 sticky/empty/return densify、无掌握%圆环、无 UI 文案 /
  className / href 构造 / 门禁变化；视觉 ≡ tip（页头 / sticky 工具带 / 空态 / 会话壳）。
- Clew / seed 只读铁律不受影响：未触碰 seed / provider / usage / entities JSON / seed-apply
  任何路径；无 verified:true、无 LiteLLM/Auto/BYOK/云墙、无 NEXT_PUBLIC_*、无 key 入仓、
  无 bulk pages[]·chapters[]。
- 存储键零改：ariadne.study.v1 / ariadne.desk.return.v1 / sticky·cursor 键只经既有消费方，
  本刀未发明或改名任何 key。

## 验证（tip f177290 工作区）

- `pnpm --filter web exec tsc --noEmit` → exit 0。
- `pnpm --filter web lint` → 2 problems（2 errors / 0 warnings）= 基线；两处恰为
  HeYeSession.tsx:88:9 与 StudySession.tsx:106:5（`react-hooks/set-state-in-effect`，冻结 KEEP）。
- `pnpm --filter web build` → PASS（16 条路由全产出；`/study` ƒ Dynamic）。
- 既有夹具：cite-check / parse-check / page-check / density-check / qa-check / clew-check
  全 exit 0；运行后 tracked 无副作用 diff。seed-apply-check exit 1 = 「pack 输入为空（stdin
  无内容）——没有可对照的补丁包，不写报告」（T64 次级面需 stdin 补丁包，T96/T97 已记为
  tip 既有行为），与本刀无关。
- `git status`：tracked 仅 `apps/web/app/(desk)/study/page.tsx`（M，+37/−716）；新增
  untracked 三件 `lib/study-page-scope.ts` / `components/StudyPageChrome.tsx` /
  `components/StudyPageEmpty.tsx`。
- 逐字机检（`git show f177290:…` 四段 vs 新文件对应段 `diff`）：scope 体 283 行零差；
  Chrome JSX 271 行零差；Empty JSX 124 行零差（de-indent 4）；StudySession 调用 34 行零差；
  StudyPage wrapper 唯一差异 = QS 类型别名化。
- 三件新文件 + page 均无 `"use client"` 指令、无 eslint-disable。

## DEFER

- **EntityCardDetail（552 行）DEFER**：tip f177290 复测仍仅 citeStats(17–43) /
  firstPagedCitePage(46–51) 两根薄 helpers；fields / atoms / OCR 补救 / 草稿条 JSX 缝稠——
  citeStats + firstPagedCitePage alone 不足以下刀（会滑向薄 scrap）。
- **DocumentPane 第三刀 DEFER**：tip 277 行编排器无 ≥3 NEW 命名机械缝，再切 = densify
  状态机。
- **ClewPane further DEFER**：tip 222 行编排器无 ≥3 NEW 命名机械缝，OUT。
- **review twin（634）DEFER**：与 study 同构（qs / invalid* / orphan 核侧），但本刀只拆
  study；双页同刀 = 两套 scope 模型并行改写，偏题风险 > 收益，留下一刀单独评估。
- **ingest Register（656）DEFER**：Register 硬门禁风险，不入 UI 拆分序列。

## OUT（本刀不做）

densify · 空池 CTA / return / sticky densify · 掌握%/健康圆环 · gut 冻结 · 可写 seed-apply
（--write/--apply）· 「一键写回仓库」· 拆 EntityCardDetail/CitePeek/ClewChangesPanel/Sidebar/
ClewPane further/DocumentPane 第三/Library shelf/HeYe 主流程/StudySession.tsx/entities*/
DocumentPane*/clew-pane-helpers/已闭 barrel/review twin/ingest Register · verified:true ·
LiteLLM/Auto/BYOK/云墙 · 改 orphan/examCoverage/density/QS/sticky/return/cross-scope 口径 ·
预算第二套 hrefs 表 · 薄 ~100–160 lib scrap 冒充 · 第四空壳文件充数 · push（验收方 auto-push）。
