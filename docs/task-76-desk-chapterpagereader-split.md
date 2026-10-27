# Task 76 — desk-chapterpagereader-split-01

**Slug**: `desk-chapterpagereader-split-01`
**Title**: ChapterPageReader 诚实 mega-split · 677 行单文件机械拆成 helpers + StickyChrome / EmptyChapter / CardRail + 编排器收口
**Tip**: `d417bcf`（docs T75）atop `c45dd4f`（feat T75）atop `52ccdc9`（docs T74）atop `6817c8f`（feat T74）atop `c335d0e`（docs T73）
**体量**: MEGA · A–J 全交
**定稿**: 2026-10-27 Asia/Shanghai (CST)

## 一句话

T73/T75 收掉 DocumentPane / ClewPane 后，`apps/web/components/desk/ChapterPageReader.tsx` 仍是 677 行单文件（lint 护栏 2/2e/0w/SSE2，仅剩两处会话冻结 KEEP）。本刀只做机械拆分：把文件里**已存在的本地缝**（模块层常量/纯函数 · sticky 页铬 · 无页章空态 · 本页卡轨）整段抽到 `apps/web/components/desk/` 同级文件，编排器只留索引/跳页态 + 键盘 effect + 暗浅提示 + OCR article + 组装。零产品行为与视觉改动；`export default ChapterPageReader` props 契约不变，`DocumentPane.tsx` 零 diff。

## 铁合同（硬 · 铁）

1. **机械抽出 only**：只搬既有本地缝；禁止重写纸面键（←/→ 跨章 · [ ] 切章 · g// 聚焦）、跳页精确命中·琥珀不动位、邻章跳过无页章、稀>暗>浅优先序、OCR 正文呈现、pendingByCard 空池门禁、CitePeek 不编造、文案、class、href。
2. **公共 API 守恒**：`export default ChapterPageReader` 仍从 `@/components/desk/ChapterPageReader` 导出，props 全表（pages / chapters / chapterId / pageNo / onChapterChange / onPageChange / bookId / citingCards / pendingPageCount / pendingByCard / citedPages / atomCountByPage / onOpenOverview / variant）签名与语义零改；`DocumentPane.tsx` 两处调用（variant full 572 行段 / column 614 行段）**零 diff**。
3. **KEEP 纸面/卡轨（T15–T59）**：OCR only · sticky 同族 · ←/→ 跨章 · [ ] · g// · 跳页琥珀不动位 · 无页章 CTA · 稀>暗>浅 · 练本页 mode=all / 核本页 mode=open · pendingByCard 门禁 · CitePeek 三数+validPages 不编造 · RailMarks 只读 · rememberDeskReturn。
4. **KEEP T66–T75**：ClewPane 930+4 · DocumentPane 649+5 · entities memo/force-dynamic · HeYe/Study 冻结 · T71 三 uSES hook —— 零触碰。
5. **两处冻结 KEEP**：HeYeSession:218 cursor · StudySession:234 order——不 gut、不 disable；本刀主题不是 lint-zero。
6. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；既有键盘 effect exhaustive-deps disable 原样 KEEP（T18 起同位）。
7. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动（仅文件边界 + import 整理）。
8. 不 redo 纸面语义；不拆 DocumentPane / ClewPane 当主题；不碰 T73/T75 extracts；不碰 T74 entities memo / force-dynamic / generateStaticParams 缺席 / loadMaterials 当主题。
9. 禁 LiteLLM/Auto/BYOK/云墙；禁 verified:true / Clew 真写 / seed-apply 可写 / bulk；钥不入仓 / 不 NEXT_PUBLIC_*。
10. J 必记：before 677 → after ≤400（目标 ≤360）；抽出文件 ≥4；DocumentPane props 契约；lint 护栏 2/2e/0w/SSE2 不劣于且冻结仍在；tsc 0；build PASS；clew-check 绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip ChapterPageReader.tsx 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 14–32 | 常量/类型：KIND_ZH · hitSummary · NeighborChapter | `chapter-page-reader-helpers.ts`（export 化） |
| 114–124 | pagesByChapter useMemo 体（filter+sort 建索引） | `chapter-page-reader-helpers.ts` 纯函数 `buildPagesByChapter(pages)` |
| 156–159 | readerValidPages flatMap | `chapter-page-reader-helpers.ts` 纯函数 `validPagesOf(pages)` |
| 197–203 | firstPageOf / lastPageOf（闭包参 pagesByChapter 显式化） | `chapter-page-reader-helpers.ts` |
| 209–223 | chIndex + prevReadable / nextReadable IIFE 扫描 | `chapter-page-reader-helpers.ts` 纯函数 `findPrevReadable` / `findNextReadable` |
| 313–458 | sticky 页铬（T24 A 工具带 · T26 A 跳页表单/章芯片 · T56 稀页徽章 · 翻页 nav · SessionKeyHint） | `ChapterPageStickyChrome.tsx`（default export；跳页 draft/error/ref/submit 经 props 下传——键盘 g// 聚焦留编排器） |
| 461–496 | 无页章空态（主 CTA 下一/上一有页章 + 回概览 + 全书无页纯文） | `ChapterPageEmptyChapter.tsx`（default export） |
| 535–673 | 本页卡轨（练本页/核本页 · pendingByCard 门禁 · RailMarks · CitePeek 三数+validPages · rememberDeskReturn） | `ChapterPageCardRail.tsx`（default export；rememberDeskReturn 经 props 下传） |
| 52–308 | 编排器：props 签名 + 索引/跳页态 + rememberDeskReturn + 键盘 effect | **留** `ChapterPageReader.tsx` |
| 499–531 | 暗页/浅页提示 + OCR article | **留** `ChapterPageReader.tsx`（合同 F2） |

搬运完整性（写手 diff 实证）：StickyChrome / EmptyChapter / CardRail 三段 JSX 迁移体与 `git show HEAD` 原文**逐字节一致**（仅差 dedent 与 props 形参化改名：switchChapter→onSwitchChapter · submitJump→onSubmitJump · setJumpDraft(v)→onJumpDraftChange(v) · pages.length>0→hasPages · idx/chPages.length→pagePos/pageTotal）；键盘 effect 51/51 行一致（exhaustive-deps disable 原位）；暗浅 IIFE + OCR article 一致；props 签名块一致；prevJumpChapter（T72 渲染期清错）/ rememberDeskReturn / switchChapter / submitJump 逻辑块逐字一致；helpers 函数体一致（模 map 参数化 + IIFE→function 包装）。

## OUT（本刀 + forever）

不 push · 不拆 DocumentPane（T73 五件不再拆）/ ClewPane（T75 四件不再拆）· 不 entities SSR / loadMaterials 再刀 · 不 gut 两处冻结 KEEP · 不 lint-zero（禁 disable 捂）· 不 densify redo（empty-CTA / return / CitePeek / 纸面键·跳页·邻章·稀暗浅全禁 redo）· 不借拆文件改业务逻辑/文案/class/门禁/href/键盘语义 · 不动 T71 三 uSES hook · 不回退 T72 真模式 · 不丢 force-dynamic / 不复活 generateStaticParams · 不 verified:true / Clew 真写 / seed-apply 可写 / bulk / 批量重抽 / Register 硬门禁 / quiz densify / LiteLLM / Auto / BYOK / 云墙 / 钥入仓 / Next 升级 / API key 入仓或前端 / 接受客户端 pages[]·chapters[] 作业形。

## DEFER（后续刀）

loadMaterials 进 memo（T74 DEFER 承接）· DocumentPane 再 densify（禁）· ClewPane 编排器再拆 · ChapterPageReader 再拆（本刀后 353 行达标，非必要不开刀）· 两处冻结 effect 更深非 effect 化（KEEP）· 全仓 lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent heye-only · Register 硬门禁 · quiz densify · HeYe/Study 大拆。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip d417bcf） | after（写手树） | 验收复核 |
|---|---|---|---|
| `ChapterPageReader.tsx` 行数 | **677** | **353**（≤400 达标；目标 ≤360 亦达成） | ___ |
| 抽出文件数（≥4） | — | **4**：chapter-page-reader-helpers 91 · ChapterPageStickyChrome 211 · ChapterPageEmptyChapter 62 · ChapterPageCardRail 185 | ___ |
| `DocumentPane.tsx` diff | — | **零 diff**（两处 `<ChapterPageReader …>` variant full/column 原样；import 路径未变） | ___ |
| 搬运完整性（git show 逐字节 diff） | — | 三 JSX 迁移体 IDENTICAL（模 dedent/props 改名）；键盘 effect 51/51；暗浅+article、props 签名、四逻辑块、helpers 体一致 | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:218 · StudySession:234 冻结 KEEP 原样在；新文件零新增问题；无 disable） | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级；路由全 ƒ Dynamic） | ___ |
| clew-check | 69/69 | **69/69** | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（cite ch01 卡40·原子57·有页cite195·OCR未见0；parse ch07 覆盖100.0%；page ch07 暗0；density ch07 浅0；qa ch01 不完备0，与 tip 同） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 分列正确（dry-run 报告非真源） | ___ |
| force-dynamic / generateStaticParams（未碰复核） | 10 处 / 0 实现（app 内实测；另有 1 处注释提及移除） | **10 处 / 0 实现**（页面零改动，与 tip 同） | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-76/lint-baseline.md`（tip d417bcf · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:218 cursor + StudySession:234 order，KEEP）。
