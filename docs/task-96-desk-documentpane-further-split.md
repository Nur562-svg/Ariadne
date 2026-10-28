# Task 96 · desk-documentpane-further-split-01 · 诚实 MEGA

tip：`5bad94d`（docs T95）atop `bbc3ca8`（feat T95）。主题：DocumentPane（649 行）诚实
further MEGA-split——scope 派生 / 书头 chrome / 内容区三段机械抽出 + 瘦编排器收口。
只搬既有组、跨文件边界零语义改写；无 densify、无新 CTA、无产品视觉改动。

## before → after LOC

| 文件 | before | after | 说明 |
| --- | --- | --- | --- |
| `apps/web/components/desk/DocumentPane.tsx` | 649 | **277** | 瘦编排器（≤350 达标，≤300 目标达成） |
| `apps/web/components/desk/use-document-pane-scope.ts` | — | 261 | 新抽出（scope hook） |
| `apps/web/components/desk/DocumentPaneChrome.tsx` | — | 252 | 新抽出（书头 chrome） |
| `apps/web/components/desk/DocumentPaneBody.tsx` | — | 195 | 新抽出（内容区） |

抽出件 3 个（≥3 达标）；编排器:抽出件行数比 277 : 708。

## 缝映射（源行段 → 目标文件，tip 5bad94d 行号）

| tip 行段 | 内容 | 去向 |
| --- | --- | --- |
| :1–35 | imports + T73 header 注释 | 编排器留（注释追加 T96 段） |
| :36–123 | props + T72 pickedMode/adoptedMode/section/chapterId/pageNo 状态 + 渲染期补位 + visibleCards/activeChapter/readingPage | 编排器留 |
| :111–181 | saveViewMode · URL replaceState · touchLastOpened · invalidPage scrub effects | 编排器留（scrub 的 exhaustive-deps disable 原样保留） |
| :183–371 | pageCitingCards … stripReviewHref 派生 + setClew effect + deskReturnPayload/rememberDeskCardReturn | `use-document-pane-scope.ts` |
| :372–541 | 外层 div + 书名/BookSwitcher · 练核深链 · LocalProgressStrip · heye-only/稀疏/invalidPage 诚实条 · 模式芯片 · SectionToc | `DocumentPaneChrome.tsx`（内容区经 `children` 嵌入——唯一新增缝） |
| :542–649 | 内容区注释 + overview/quiz/pages/split/cards 条件组装 + 收口 | `DocumentPaneBody.tsx`（Fragment 收口） |

hook 入参 = 编排器已有 props/state（book/cards/pages/chapterId/readingPage/visibleCards/
activeChapter/citingByPage/pendingByPage/heyePool/setClew）；返回 19 个派生值供 Chrome/Body
与编排器同池消费。Chrome/Body 不 import 编排器，hook 不 import Chrome/Body——无循环。

## KEEP 铁律（本刀遵守）

- `export default DocumentPane` 仍自 `@/components/desk/DocumentPane`；props 形状 ≡ tip；
  **desk/page.tsx import · `key={\`${book.id}:${initialPage ?? ""}\`}` · 传参零 diff**。
- T72 viewMode/pageNo 真模式整块留在编排器（pickedMode/adoptedMode/渲染期补位/saveViewMode）。
- setClew 字段集 ≡ tip：book/chapter/page/citePages/visibleEntityName/card/surface/
  progressAtoms/progressItems/progressScopeLabel/progressStudyHref/progressReviewHref。
- deskReturnPayload 单一来源（T39 E）随 hook 迁移仍是同一份——Strip returnTo、QuizPanel
  returnTo、卡瓷砖/自测/书头 CTA 写点共用，无第二套口径。
- Strip study/review href 与 progress* 同口径（stripStudyHref/stripReviewHref 在 hook 单点派生）。
- T73 五抽出件 + document-pane-helpers **内容**零改（Chrome/Body/hook 只 import 消费；
  Mode 类型仍自 document-pane-helpers，未另起第二套）。
- HeYeSession:88 setIndex · StudySession:106 setOrder 两处冻结零触碰；lint 2/2e/0w/SSE2
  与 tip 基线一致，无 eslint-disable 捂 SSE、无新增同步 effect 内 setState（setClew effect
  为 tip 既有整段搬迁）。
- 派生口径一字不改：studyPageScope/reviewPageScope/stripAtoms/stripItems/sectionCounts/
  pendingByCard/pageTextByBook/chapterCitedPages/chapterAtomCountByPage/stripStudyHref/
  stripReviewHref/filterCards/firstPageOf。
- Clew/seed 只读铁律不受影响（本刀未触碰任何 seed/provider/usage 路径）。

## 验证（tip 5bad94d 工作区）

- `pnpm --filter web exec tsc --noEmit` → 0。
- `pnpm --filter web lint` → 2 problems（2 errors / 0 warnings）= 基线；两处恰为
  HeYeSession.tsx:88:9 与 StudySession.tsx:106:5（冻结 KEEP 原样）。
- `pnpm --filter web build` → PASS（全部路由产出）。
- 既有夹具：parse-check / cite-check / page-check / density-check / qa-check / clew-check
  全 PASS；seed-apply-check 空 stdin 退出 1 —— 在干净 tip worktree（5bad94d）复跑同命令
  输出逐字相同，为 tip 既有行为（该检查需 stdin 补丁包输入，T64 次级面），非本刀回归。
- `git diff`（tracked）：仅 `DocumentPane.tsx`（+98/−470）；desk/page.tsx、HeYeSession、
  StudySession、ClewPane*、EntityCardDetail、entities*、CitePeek、Sidebar、ClewChangesPanel
  及全部 T73–T95 抽出件零 diff。

## DEFER

- **EntityCardDetail（552 行）DEFER**：tip 复测仅 citeStats(17–43)/firstPagedCitePage(46–51)
  薄 helpers；fields/atoms/OCR 补救/草稿条 JSX 缝稠，未出现 ≥3 清晰机械 extract 缝——
  citeStats + firstPagedCitePage alone 不足以下刀（会滑向薄 scrap）。
- ClewPane（222 行）further：无 ≥3 新命名机械缝，再切 = densify，OUT。

## OUT（本刀不做）

densify · 掌握%/健康圆环 · gut 冻结 · 可写 seed-apply · 拆 EntityCardDetail/CitePeek/
ClewChangesPanel/Sidebar/ClewPane further/HeYe 主流程/Study 主流程/entities*/
clew-pane-helpers/已闭 barrel · verified:true · LiteLLM/Auto/BYOK/云墙 · 改 T72/T73 内容 ·
薄 scrap 冒充 · push（验收方 auto-push）。
