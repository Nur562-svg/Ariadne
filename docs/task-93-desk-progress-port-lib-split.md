# Task 93 — desk-progress-port-lib-split-01

**Slug**: `desk-progress-port-lib-split-01`
**Title**: progress-port.ts 诚实 mid-split · 156 行单文件按既有分区机械抽成 `progress-port-types` + `progress-port-pure` + `progress-port-persist`，主文件收口为 barrel（铁合同 header 留此）；`@/lib/progress-port` 全部 7 个既有 named exports 守恒；ProgressPortability 消费者入口零改；PROGRESS_PAYLOAD_VERSION = 1 / merge「t 较新者胜」/ replace 整键 / fail-closed 拒写 / 写后双 notify / 两既有键名（经 @/lib/study · @/lib/heye-store）逐字零改；UI 零 diff；两处会话冻结（HeYeSession:88 · StudySession:106）零触碰
**Tip**: `83820ed`（docs T92 desk-study-lib-split-01）atop `5aaef53`（feat T92）atop `cec4272`（T91 docs）
**体量**: 诚实 mid · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T92 收掉 study lib 后，`apps/web/lib/progress-port.ts`（T24 C 本机进度可移植——把 ariadne.study.v1 / ariadne.heye.v1 打包明文 JSON 导出、merge/replace 导入，fail-closed 拒写、写后双 notify，纯客户端无云同步）仍是 156 行单文件，含三段**清晰分区边界**：types（:26–41 版本常量 + 三类型）· pure（:53–103 私有 isRecord / isValidStudyMark / isValidHeYeMark + parseProgressPayload）· persist（:43–51 exportProgressPayload + :105–156 importProgressPayload，独占 IO + 广播）。本刀按任务书推荐拆三件 + barrel：**types**（PROGRESS_PAYLOAD_VERSION / ProgressPayload / ParseResult / ImportResult，DAG 根、仅 type-only 跨 lib 引 HeYeStore/GradeMap、零 sibling import）← **pure**（parseProgressPayload，三私有 helpers 随行不外泄；← types；HeYeMark/HeYeStore/GradeMap type-only 跨 lib；无 setItem / notify*）← **persist**（exportProgressPayload / importProgressPayload；← types；值引 @/lib/study + @/lib/heye-store；禁 import pure）。函数体与 tip 逐段一致（写手以只读 diff 实证四段——header / types / pure / persist（:43–51 + :105–156 双缝拼接）——逐字节 IDENTICAL，零声明级改动）；ProgressPortability 消费者仍零改路径；merge「t 较新者胜」· replace 整键 · fail-closed · 写后双 notify · 两键名逐字未动；HeYeSession:88 / StudySession:106 零触碰。

三件 DAG 实测（无环）：types 0 sibling import（仅 type-only ← @/lib/heye-store · ← @/lib/study）；pure 3（← types 值+type · ← @/lib/heye-store type-only · ← @/lib/study type-only）；persist 3（← types 值+type · ← @/lib/heye-store 值+type · ← @/lib/study 值+type）。同 T83–T92：兄弟件 `.ts` 扩展名相对路径（tsconfig `allowImportingTsExtensions` 已开，本刀零 tsconfig 改动）；四件均**无 `"use client"`**（tip 无指令，保持无）。types / pure 无 localStorage / 无 setItem / 无 notify*；persist 独占 IO + 广播；persist ↛ pure。

## 铁合同（硬 · 铁 · 与任务书逐条对齐）

1. **机械抽出 only**：只搬既有分区；铁合同 header（:1–21，只读写两既有键 · 不写 seed · 不碰 verified · 无云同步 · merge t 较新者胜 · replace · fail-closed）原文留 barrel。写手实证：barrel :1–21 ≡ tip :1–21；types 体 ≡ :26–41；pure 体 ≡ :53–103；persist 体 ≡ :43–51 + :105–156——**逐字节 IDENTICAL · 零声明级改动**（isRecord / isValidStudyMark / isValidHeYeMark 仍私有）。PROGRESS_PAYLOAD_VERSION = 1 as const 一字不改；merge 同键「导入 t > 本机 t 才覆盖、本机独有键保留」、replace 整键覆盖、任一条目不符整体拒绝不写任何键、写后 notifyGradesExternalChange + notifyHeYeExternalChange 双广播——逐字未动。
2. **公共 API 守恒**：7 个既有 named exports 全部仍可自 `@/lib/progress-port` 导入（barrel `export * from "./….ts"` ×3，带扩展名）。Public surface：PROGRESS_PAYLOAD_VERSION · ProgressPayload · ParseResult · ImportResult · exportProgressPayload · parseProgressPayload · importProgressPayload。消费者入口零改（grep 全仓实证无深路径 / 无 .mjs 直载）：`components/ProgressPortability.tsx`（exportProgressPayload · importProgressPayload · parseProgressPayload · type ProgressPayload）。
3. **两处冻结 KEEP**：HeYeSession:88 setIndex · StudySession:106 setOrder——零触碰（git diff 全仓 tracked 改动仅 lib/progress-port.ts 一件 + 3 新抽出件，components / app 零 diff）；不 gut、不 eslint-disable 捂 SSE。
4. **types / pure 无 localStorage.setItem / 无 notify***；persist 独占 IO + 广播——抽出件仅相对 `.ts` import（跨 lib：types 仅 type-only study/heye-store；pure type-only；persist 值引）；四件 grep 零 `"use client"`（tip 无，保持无）。
5. **只读铁律**：本刀只搬文件、无任何新增写路径；永不 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM·Auto·BYOK·云墙；钥永不入仓 / 永不 NEXT_PUBLIC_*。
6. **抽出 ≠ densify**：函数体逐段一致；不新增 CTA、不改 UI、不改书架徽列（UI 零 diff）。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；不引入新的同步 effect 内 setState。
8. 美学：先读 `docs/frontend-aesthetics.md`（本会话已读）；无产品视觉改动（纯 lib）。
9. 不 redo Clew T66–T70 语义 / T24 progress-port v:1 merge/replace fail-closed / T91–T92 heye-store·study 键名契约；不拆 EntityCardDetail / CitePeek / ClewChangesPanel / Sidebar / ClewPane / DocumentPane / HeYe·Study 主流程 / clew-pane-helpers（T75 BAN）/ entities / heye.ts / study* / heye-store* / return-stack 当主题；不碰 T73–T92 extracts、T74/T77 entities memo。
10. J 必记：before 156 → after barrel ≤80（目标 ≤50）；抽出件 ≥3（三件）；消费者路径零改；UI 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；既有 qa/cite/parse 夹具不因本刀红。

## 抽出映射（源缝 → 目标文件）

| 源（tip progress-port.ts 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 1–21 | 铁合同 header（两既有键 · merge/replace 规则 · fail-closed · 写后广播） | **留** `progress-port.ts`（barrel；原文零改；原 :23–24 双 import 按需分入三件） |
| 26–41 | PROGRESS_PAYLOAD_VERSION · ProgressPayload · ParseResult · ImportResult | `progress-port-types.ts`（29 行；DAG 根；仅 type-only ← @/lib/heye-store HeYeStore · ← @/lib/study GradeMap） |
| 53–103 | isRecord（私）· isValidStudyMark（私）· isValidHeYeMark（私）· parseProgressPayload | `progress-port-pure.ts`（65 行；← types；HeYeMark/HeYeStore/GradeMap type-only 跨 lib；无 setItem / notify*） |
| 43–51 + 105–156 | exportProgressPayload · importProgressPayload | `progress-port-persist.ts`（75 行；← types；值引 @/lib/study + @/lib/heye-store；禁 import pure） |
| — | 新增 | barrel：21 行铁合同原文 + 16 行 T93 注（三件地图 + 键名守恒声明）+ 3 行 `export *` |

私有符号（isRecord · isValidStudyMark · isValidHeYeMark）在新家仍私有，不经 barrel 外泄。

## OUT（本刀 + forever）

不 push · 不改 PROGRESS_PAYLOAD_VERSION / merge t 较新者胜 / replace / fail-closed / 两键名 · 不改任何消费者 import 为深路径 · 不 densify · 不写 seed · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 EntityCardDetail / CitePeek / ClewChangesPanel / Sidebar / ClewPane / DocumentPane / HeYe·Study 主流程 / clew-pane-helpers / entities / heye.ts / study* / heye-store* / return-stack 当主题 · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / 批量重抽 / 钥入仓 / NEXT_PUBLIC_* / LiteLLM 网关 / Auto 路由 / BYOK / 云配额墙 / Next 升级 / twin cite-ocr .mjs / rollup -server·check.mjs 主题。

## DEFER（后续刀）

EntityCardDetail（552；tip 复测仍仅 citeStats（17–43）/ firstPagedCitePage（46–51）薄 helpers，未出现 ≥3 清晰机械 extract 缝；citeStats+firstPagedCitePage alone = DEFER）· CitePeek（361）· ClewChangesPanel（319）· Sidebar（302）再拆（缝弱）· entities（586 padded MEGA · 非本刀）· ClewPane 编排器再拆（禁作主题）· clew-pane-helpers（T75 BAN）· DocumentPane 再 densify（禁）· HeYe/Study 主流程再拆（禁）· heye.ts（162 单大函数 · 非本刀）· return-stack（85 过薄）· atom-draft* / clew-suggest* / clew-answer-audit* / cite-ocr* / chapter-quality-rollup* / last-opened* / clew-usage* / clew-provider* / heye-store* / study* 再拆（禁 · T83–T92 刚闭）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 83820ed） | after（写手树） | 验收复核 |
|---|---|---|---|
| `lib/progress-port.ts` 行数 | **156** | **41**（barrel；≤80 达标，目标 ≤50 亦达成：21 行铁合同原文 + 16 行 T93 注 + 3 行 re-export + 界空行） | ___ |
| 抽出件（≥3） | — | **3**：types 29 · pure 65 · persist 75 | ___ |
| 代码行守恒（逐段只读 diff vs `git show 83820ed`） | — | header ≡ :1–21 · types ≡ :26–41 · pure ≡ :53–103 · persist ≡ :43–51 + :105–156——**逐字节 IDENTICAL · 零声明级改动**（三私有 helpers 仍私有） | ___ |
| `@/lib/progress-port` named exports | 7 | **7 全守恒**（grep 集合对照逐名一致：PROGRESS_PAYLOAD_VERSION · ProgressPayload · ParseResult · ImportResult · exportProgressPayload · parseProgressPayload · importProgressPayload） | ___ |
| 消费者入口 | ProgressPortability.tsx | **零改**（全仓 tracked 修改仅 barrel 一件 + 3 新抽出件；components / app / scripts 零 diff） | ___ |
| UI / EntityCardDetail / Clew* / CitePeek / ClewChangesPanel / Sidebar / study* / heye-store* diff | — | **零 diff** | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（diff 为空；lint 仍精确报 HeYeSession.tsx:88:9 setIndex / StudySession.tsx:106:5 setOrder） | ___ |
| DAG | 单文件 | types 0 sibling（仅 type-only 跨 lib ×2）· pure 3（← types · ← heye-store type-only · ← study type-only）· persist 3（← types · ← heye-store 值+type · ← study 值+type）——无环；persist ↛ pure | ___ |
| 纯净约束 | — | types / pure grep 零 localStorage / 零 setItem / 零 notify*；四件零 `"use client"` | ___ |
| tsconfig | （T83 含 allowImportingTsExtensions） | **零改** | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:88:9 + StudySession:106:5）；progress-port* 零提及 | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级；exit 0） | ___ |
| qa-check · cite-check · parse-check | 绿 | **绿**（exit 0 ×3；不因本刀红） | ___ |
| 未碰复核（ProgressPortability / study* / heye-store* / HeYeSession / StudySession 等） | — | **零触碰** | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-93/lint-baseline.md`（tip 83820ed · pnpm --filter web lint · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 setIndex + StudySession:106 setOrder，KEEP）；Mac 侧写手实跑复核同值（Mac 无 /workspace 目录，以任务书内锚数字 + 实跑双证）。
