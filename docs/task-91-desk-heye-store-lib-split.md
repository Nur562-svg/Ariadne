# Task 91 — desk-heye-store-lib-split-01

**Slug**: `desk-heye-store-lib-split-01`
**Title**: heye-store.ts 诚实 mid-split · 120 行单文件按既有分区机械抽成 `heye-store-types` + `heye-store-persist` + `heye-store-pure`，主文件收口为 barrel（铁合同 header 留此）；`@/lib/heye-store` 全部 13 个既有 named exports 守恒；12 个消费者入口零改；HEYE_STORE_KEY = "ariadne.heye.v1" / Mark 形 / 三档 id / emit→save 顺序 / clearHeYeMarks 范围清除口径逐字零改（T71 use-heye-store 订阅契约依赖 emit-then-save）；UI 零 diff；两处会话冻结（HeYeSession:88 · StudySession:106）零触碰
**Tip**: `48d3757`（docs T90 desk-clew-provider-lib-split-01）atop `90f248e`（feat T90）atop `1540cc5`（T89 docs）
**体量**: 诚实 mid · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T90 收掉 clew-provider lib 后，`apps/web/lib/heye-store.ts`（T12 核页本机态——localStorage `ariadne.heye.v1` 读写 + 同页订阅总线 + 档位纯过滤，客户端专用、SSR fail-closed 空仓）仍是 120 行单文件，含三段**清晰分区边界**：types（:9–17 键常量 + 四类型）· persist（:19–93 IO + 订阅总线 + 三个写 API，私有 saveHeYeStore / emitHeYeStoreChanged / listeners）· pure（:95–121 filterItemsByMode / countPoolMarks 纯函数）。本刀按任务书推荐拆三件 + barrel：**types**（HEYE_STORE_KEY / HeYeMark / HeYeStore / HeYeMode / HeYeFilterable，DAG 根、零 import）← **persist**（loadHeYeStore / subscribeHeYeStore / notifyHeYeExternalChange / setHeYeMark / setHeYeMarks / clearHeYeMarks，私有三符号随行不外泄；← types 值+type；**禁 import pure**）← **pure**（← types type-only；**无 window / 无 localStorage**）。函数体与 tip 逐段一致（写手以只读 diff 实证四段——header / types / persist / pure——逐字节 IDENTICAL，零声明级改动）；12 个消费者仍零改路径；emit→save 顺序与 clearHeYeMarks「只删给定 keys、空 keys 无操作、有变更才 emit」口径逐字未动；HeYeSession:88 / StudySession:106 零触碰。

三件 DAG 实测（无环）：types 0 import；persist 1（← types，值 HEYE_STORE_KEY + type HeYeMark/HeYeStore）；pure 1（← types，type-only）。同 T83–T90：兄弟件 `.ts` 扩展名相对路径（tsconfig `allowImportingTsExtensions` 已开，本刀零 tsconfig 改动）；四件均**无 `"use client"`**（tip 无指令，保持无）。types / pure 无 window / 无 localStorage / 无 listeners；persist 独占 IO + 订阅总线。

## 铁合同（硬 · 铁 · 与任务书逐条对齐）

1. **机械抽出 only**：只搬既有分区；铁合同 header（:1–7，键名 ariadne.heye.v1 · 不 import lib/entities / lib/heye · 不做 FSRS/Due · 绝不回写 seed JSON · 不改 cite / verified 语义）原文留 barrel。写手实证：barrel :1–7 ≡ tip :1–7；types 体 ≡ :9–17；persist 体 ≡ :19–93；pure 体 ≡ :95–121——**逐字节 IDENTICAL · 零声明级改动**（saveHeYeStore / emitHeYeStoreChanged / listeners 仍私有）。HEYE_STORE_KEY 字符串一字不改；HeYeMode 三档 id（open | checked | doubt）零改；setHeYeMark / setHeYeMarks「拼 next → emit → save」与 clearHeYeMarks「有变更才 emit → save」顺序逐字一致。
2. **公共 API 守恒**：13 个既有 named exports 全部仍可自 `@/lib/heye-store` 导入（barrel `export * from "./….ts"` ×3，带扩展名）。Public surface：HEYE_STORE_KEY · HeYeMark · HeYeStore · HeYeMode · HeYeFilterable · loadHeYeStore · subscribeHeYeStore · notifyHeYeExternalChange · setHeYeMark · setHeYeMarks · clearHeYeMarks · filterItemsByMode · countPoolMarks。消费者入口零改（12 件，grep 全仓实证无深路径 / 无 .mjs 直载）：`lib/use-heye-store.ts` · `lib/progress-port.ts` · `components/HeYeSession.tsx` · `components/HeYeScopeCounts.tsx` · `components/LocalProgressStrip.tsx` · `components/desk/StickyHeYeModeTabs.tsx` · `components/desk/ClewQueuePanel.tsx` · `components/HeYeModeChips.tsx` · `components/HeYeEmptyPool.tsx` · `components/HeYeEmptyMode.tsx` · `components/heye-session-props.ts` · `app/(desk)/review/page.tsx`（type-only）。
3. **两处冻结 KEEP**：HeYeSession:88 setIndex · StudySession:106 setOrder——零触碰（git diff 全仓 tracked 改动仅 lib/heye-store.ts 一件 + 3 新抽出件，components / app 零 diff）；不 gut、不 eslint-disable 捂 SSE。
4. **types / pure 无 window / 无 localStorage / 无 listeners**；persist 独占 IO + 总线——抽出件仅相对 `.ts` import；四件 grep 零 `"use client"`（tip 无，保持无）。
5. **只读铁律**：无任何新增写路径（本刀只搬文件）；永不 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM·Auto·BYOK·云墙；钥永不入仓 / 永不 NEXT_PUBLIC_*。
6. **抽出 ≠ densify**：函数体逐段一致；不新增 CTA、不改 UI、不改书架徽列（UI 零 diff）。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；不引入新的同步 effect 内 setState。
8. 美学：先读 `docs/frontend-aesthetics.md`（本会话已读）；无产品视觉改动（纯 lib）。
9. 不 redo Clew T66–T70 语义 / T12·T71 heye-store 键名与订阅契约；不拆 EntityCardDetail / CitePeek / ClewChangesPanel / Sidebar / ClewPane / DocumentPane / HeYe·Study 主流程 / clew-pane-helpers（T75 BAN）/ entities / study.ts / heye.ts / clew-provider* 当主题；不碰 T73–T90 extracts、T74/T77 entities memo。
10. J 必记：before 120 → after barrel ≤80（目标 ≤50）；抽出件 ≥3（三件）；消费者路径零改；UI 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；既有 qa/cite/parse 夹具不因本刀红。

## 抽出映射（源缝 → 目标文件）

| 源（tip heye-store.ts 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 1–7 | 铁合同 header（键名 · 不 import entities/heye · 不 FSRS/Due · 不回写 seed / 不改 cite·verified） | **留** `heye-store.ts`（barrel；原文零改） |
| 9–17 | HEYE_STORE_KEY · HeYeMark · HeYeStore · HeYeMode · HeYeFilterable | `heye-store-types.ts`（18 行；DAG 根，零 import） |
| 19–93 | loadHeYeStore · saveHeYeStore（私）· listeners（私）· subscribeHeYeStore · emitHeYeStoreChanged（私）· notifyHeYeExternalChange · setHeYeMark · setHeYeMarks · clearHeYeMarks | `heye-store-persist.ts`（86 行；← types 值+type；禁 import pure） |
| 95–121 | filterItemsByMode · countPoolMarks | `heye-store-pure.ts`（36 行；← types type-only；无 window / localStorage） |
| — | 新增 | barrel：7 行铁合同原文 + 17 行 T91 注（三件地图 + 消费者清单 + emit-then-save 契约声明）+ 3 行 `export *` |

私有符号（saveHeYeStore · emitHeYeStoreChanged · listeners）在新家仍私有，不经 barrel 外泄。

## OUT（本刀 + forever）

不 push · 不改 HEYE_STORE_KEY / Mark 形 / 三档 id / emit→save 顺序 / clearHeYeMarks 范围清除口径 · 不改任何消费者 import 为深路径 · 不 densify · 不写 seed · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 EntityCardDetail / CitePeek / ClewChangesPanel / Sidebar / ClewPane / DocumentPane / HeYe·Study 主流程 / clew-pane-helpers / entities / study.ts / heye.ts / clew-provider* 当主题 · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / 批量重抽 / 钥入仓 / NEXT_PUBLIC_* / LiteLLM 网关 / Auto 路由 / BYOK / 云配额墙 / Next 升级。

## DEFER（后续刀）

EntityCardDetail（552；tip 复测仍仅 citeStats（17–43）/ firstPagedCitePage（46–51）薄 helpers，未出现 ≥3 清晰机械 extract 缝）· CitePeek（361）· ClewChangesPanel（319）· Sidebar（302）再拆（缝弱）· entities（586 padded MEGA · 非本刀）· ClewPane 编排器再拆（禁作主题）· clew-pane-helpers（T75 BAN）· DocumentPane 再 densify（禁）· HeYe/Study 主流程再拆（禁）· study.ts（121 twin 可候 · 非本刀）· heye.ts（162 单大函数 · 非本刀）· atom-draft* / clew-suggest* / clew-answer-audit* / cite-ocr* / chapter-quality-rollup* / last-opened* / clew-usage* / clew-provider* 再拆（禁 · T83–T90 刚闭）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 48d3757） | after（写手树） | 验收复核 |
|---|---|---|---|
| `lib/heye-store.ts` 行数 | **120** | **28**（barrel；≤80 达标，目标 ≤50 亦达成：7 行铁合同原文 + 17 行 T91 注 + 3 行 re-export + 界空行） | ___ |
| 抽出件（≥3） | — | **3**：types 18 · persist 86 · pure 36 | ___ |
| 代码行守恒（逐段只读 diff vs `git show 48d3757`） | — | header ≡ :1–7 · types ≡ :9–17 · persist ≡ :19–93 · pure ≡ :95–121——**逐字节 IDENTICAL · 零声明级改动**（三私有符号仍私有） | ___ |
| `@/lib/heye-store` named exports | 13 | **13 全守恒**（grep 集合对照逐名一致：HEYE_STORE_KEY · HeYeMark · HeYeStore · HeYeMode · HeYeFilterable · loadHeYeStore · subscribeHeYeStore · notifyHeYeExternalChange · setHeYeMark · setHeYeMarks · clearHeYeMarks · filterItemsByMode · countPoolMarks） | ___ |
| 消费者入口 | 12 件（见铁合同 2） | **零改**（全仓 tracked 修改仅 barrel 一件 + 3 新抽出件；components / app / scripts 零 diff） | ___ |
| UI / EntityCardDetail / Clew* / CitePeek / ClewChangesPanel / Sidebar diff | — | **零 diff** | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（diff 为空；lint 仍精确报 HeYeSession.tsx:88:9 setIndex / StudySession.tsx:106:5 setOrder） | ___ |
| DAG | 单文件 | types 0 import · persist 1（← types，值+type）· pure 1（← types，type-only）——无环 | ___ |
| 纯净约束 | — | types / pure grep 零 window / 零 localStorage / 零 listeners；四件零 `"use client"` | ___ |
| tsconfig | （T83 含 allowImportingTsExtensions） | **零改** | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:88:9 + StudySession:106:5）；heye-store* 零提及 | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级；exit 0） | ___ |
| qa-check · cite-check · parse-check | 绿 | **绿**（exit 0 ×3；不因本刀红） | ___ |
| 未碰复核（HeYeSession / StudySession / progress-port / use-heye-store / EntityCardDetail / ClewPane / CitePeek 等 12 消费者） | — | **零触碰** | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-91/lint-baseline.md`（tip 48d3757 · pnpm --filter web lint · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 setIndex + StudySession:106 setOrder，KEEP）；Mac 侧写手实跑复核同值（Mac 无 /workspace 目录，以任务书内锚数字 + 实跑双证）。
