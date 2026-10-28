# Task 89 — desk-clew-usage-lib-split-01

**Slug**: `desk-clew-usage-lib-split-01`
**Title**: clew-usage.ts 诚实 mid-split · 166 行单文件按既有分区机械抽成 `clew-usage-types` + `clew-usage-pure` + `clew-usage-fs`，主文件收口为 barrel（铁合同 header 留此）；`@/lib/clew-usage` 全部 11 个既有 named exports 守恒；2 个 route 消费者（api/clew/status · api/clew/suggest）入口零改；scripts/clew-suggest-check.mjs 仍相对 import barrel（Node 剥类型直载链路实证无恙）；用量文件名/行形状/session_cap 自设顶口径零改；UI 零 diff；两处会话冻结零触碰
**Tip**: `eea8ccd`（docs T88 desk-last-opened-lib-split-01）atop `8ce303c`（feat T88）atop `5cd0d39`（T87 docs）
**体量**: 诚实 mid · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T88 收掉 last-opened lib 后，`apps/web/lib/clew-usage.ts`（T68 E Clew 本机用量记数——gitignored `data/qa/clew-usage.jsonl` append-only 旁观者口径 + T69 F 按档分计 + F3 自设顶 session_cap）仍是 166 行单文件，含三段**清晰分区边界**（fs 区自带 `// ---- 服务端 fs 面` banner）：types（:16–33 CLEW_USAGE_FILE + ClewUsageLine）· pure（:35–111 组行/解析/今日计数）· fs（:113–166 usagePath（私）/append/today*/sessionCap）。本刀按任务书推荐拆三件 + barrel：**types**（CLEW_USAGE_FILE / ClewUsageLine，DAG 根；跨 lib 仅 `import type` ClewTierId）← **pure**（buildUsageLine / parseUsageLine / startOfToday / countToday / countTodayByTier；**零 import fs / path / process.env**）← **fs**（appendUsage / todayUsageCount / todayUsageByTier / sessionCapReached；私有 usagePath 随行；持既有 node:fs · node:path · ARIADNE_DATA · CLEW_SESSION_MAX_CALLS 服务端面职责）。函数体与 tip 逐段一致（写手以只读 diff 逐段实证四段 IDENTICAL，零声明级改动）；2 个 route 消费者仍 `from "@/lib/clew-usage"` 零改路径；**clew-check 69/69 实证 .mjs 直载新 barrel 链路无恙**（Node 原生剥类型下 `import type` 全擦除、兄弟件相对 `.ts` 值导入可解析）；HeYeSession:88 / StudySession:106 零触碰。

三件 DAG 实测（无环）：types 0 兄弟 import（1 跨 lib type-only）；pure 1（← types，type-only）+ 1 跨 lib type-only；fs 2（← types 值 + type · ← pure 值）+ 1 跨 lib type-only；**pure 零 import fs**（合同 D.2）；usagePath 强制在 fs。同 T83–T88：兄弟件 `.ts` 扩展名相对路径（tsconfig `allowImportingTsExtensions` 已开，本刀零 tsconfig 改动）；fs 件允许既有 node:fs / node:path / ARIADNE_DATA / CLEW_SESSION_MAX_CALLS（合同 4 服务端面职责）；原 :1–2 的 node:fs/node:path 顶部 import 随 fs 分区迁至 fs 件。

## 铁合同（硬 · 铁 · 与任务书逐条对齐）

1. **机械抽出 only**：只搬既有分区；铁合同 header（:4–12，唯一可写文件声明 / 非云账单 / 旁观者非门 / session_cap 自设顶非云墙）原文留 barrel；CLEW_USAGE_FILE 字符串一字不改（`clew-usage.jsonl`）；行 JSON 形状零改（ts · tier · provider · model · ok | fail(code) · tokens? · auditUnmarkedOut?）；session_cap 自设顶口径零改（未设/非正整数 → null；各档共用——换档不能绕过）；不是云账单口径零改。写手实证：barrel :1–9 ≡ tip :4–12；types 体 ≡ :16–33；pure 体 ≡ :35–111；fs 体 ≡ :113–166（含 `// ---- 服务端 fs 面` banner 原文）——**逐字节 IDENTICAL · 零声明级改动**（usagePath 仍私有）。
2. **公共 API 守恒**：11 个既有 named exports（1 常量 + 1 类型 + 9 函数）全部仍可自 `@/lib/clew-usage` 导入（barrel `export * from "./….ts"` ×3，带扩展名）；grep 集合对照逐名一致，零新增零删减零改名。Public surface：CLEW_USAGE_FILE · ClewUsageLine · buildUsageLine · parseUsageLine · startOfToday · countToday · countTodayByTier · appendUsage · todayUsageCount · todayUsageByTier · sessionCapReached。消费者入口零改：`app/api/clew/status/route.ts:7`（todayUsageByTier · todayUsageCount）、`app/api/clew/suggest/route.ts:11`（appendUsage · sessionCapReached）、`scripts/clew-suggest-check.mjs:33`（`await import("../apps/web/lib/clew-usage.ts")` 相对 barrel，零触零改）。
3. **两处冻结 KEEP**：HeYeSession:88 setIndex · StudySession:106 setOrder——零触碰（两文件 git diff 为空）；不 gut、不 eslint-disable 捂 SSE。
4. **pure 无 fs / 无 path / 无 process.env**（grep 实证代码零命中，仅头注文案提及禁令）；fs 件允许既有 node:fs / node:path / ARIADNE_DATA / CLEW_SESSION_MAX_CALLS（本模块服务端面职责）；抽出件无 `"use client"` / 无网络 / 无 LLM；兄弟件仅相对 `.ts` import + 跨 lib 仅 `import type`（ClewTierId，剥类型下擦除）。
5. **只读铁律（除既有 gitignored usage jsonl）**：无任何新增写路径（本刀只搬文件）；永不 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM·Auto·BYOK·云墙；把 session_cap 改成云墙 = 拒收。
6. **抽出 ≠ densify**：函数体逐段一致；不新增 CTA、不改 UI、不改书架徽列（2 route / UI 零 diff）。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；不引入新的同步 effect 内 setState。
8. 美学：先读 `docs/frontend-aesthetics.md`（本会话已读，无变更）；无产品视觉改动（纯 lib）。
9. 不 redo Clew T66–T70 语义 / T68 用量 jsonl 旁观者口径；不拆 EntityCardDetail / CitePeek / ClewChangesPanel / Sidebar / ClewPane / DocumentPane / HeYe·Study 主流程 / clew-pane-helpers（T75 BAN）/ entities 当主题；不碰 T73–T88 extracts、T74/T77 entities memo。
10. J 必记：before 166 → after barrel ≤80（目标 ≤50）；抽出件 ≥3（三件）；消费者路径零改；UI 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；既有 qa/cite/parse/clew 夹具不因本刀红。

## 抽出映射（源缝 → 目标文件）

| 源（tip clew-usage.ts 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 4–12 | 铁合同 header（唯一可写文件 · 非云账单 · 旁观者 · session_cap 自设顶） | **留** `clew-usage.ts`（barrel；原文零改） |
| 1–2 · 14 | node:fs / node:path 顶部 import → 迁 fs 件；`import type ClewTierId` → types 件（剥类型擦除） | 见下三行 |
| 16–33 | CLEW_USAGE_FILE · type ClewUsageLine | `clew-usage-types.ts`（29 行；DAG 根） |
| 35–111 | buildUsageLine · parseUsageLine · startOfToday · countToday · countTodayByTier | `clew-usage-pure.ts`（89 行；← types · type-only） |
| 113–166 | `// ---- 服务端 fs 面` banner · usagePath（私）· appendUsage · todayUsageCount · todayUsageByTier · sessionCapReached | `clew-usage-fs.ts`（77 行；← types 值+type · ← pure 值） |
| — | 新增 | barrel：9 行铁合同原文 + 16 行 T89 注（三件地图 + Node 剥类型直载声明）+ 3 行 `export *` |

私有符号（usagePath）在新家仍私有，不经 barrel 外泄。

## OUT（本刀 + forever）

不 push · 不改 CLEW_USAGE_FILE 字符串 / 行 JSON 形状 / session_cap 自设顶口径 / 各档共用计数 / append 失败只 warn / 无文件 today* → 0 / ok·fail 都算一次调用 / byTier 三键恒在 · 不把用量写成云账单 / 云墙 · 不加 "use client" 指令 / 网络 / LLM（fs 件 node:fs·path·env 为既有职责除外）· 不 densify · 不写 seed · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 EntityCardDetail / CitePeek / ClewChangesPanel / Sidebar / ClewPane / DocumentPane / HeYe·Study 主流程 / clew-pane-helpers / entities 当主题 · 不改任何消费者 import 为深路径 · 不把 scripts/clew-suggest-check.mjs 改成主题 · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM / Auto / BYOK / 批量重抽 / 钥入仓 / Next 升级。

## DEFER（后续刀）

EntityCardDetail（552；tip 复测仍仅 citeStats / firstPagedCitePage 薄 helpers ~35 LOC，未出现 ≥3 清晰机械 extract 缝）· CitePeek（361）· ClewChangesPanel（319）· Sidebar（302）再拆（缝弱）· entities（586 padded MEGA · 非本刀）· ClewPane 编排器再拆（禁作主题）· clew-pane-helpers（T75 BAN）· DocumentPane 再 densify（禁）· HeYe/Study 主流程再拆（禁）· atom-draft* / clew-suggest* / clew-answer-audit* / cite-ocr* / chapter-quality-rollup* / last-opened* 再拆（禁 · T83–T88 刚闭）· CardDraftBar（98 thin）· route 再拆（禁）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip eea8ccd） | after（写手树） | 验收复核 |
|---|---|---|---|
| `lib/clew-usage.ts` 行数 | **166** | **28**（barrel；≤80 达标，目标 ≤50 亦达成：9 行铁合同原文 + 16 行 T89 注 + 3 行 re-export + 界空行） | ___ |
| 抽出件（≥3） | — | **3**：types 29 · pure 89 · fs 77（合计 195 = 166 − 9 header + 三件头注 / 跨文件 import） | ___ |
| 代码行守恒（逐段只读 diff vs `git show eea8ccd`） | — | barrel :1–9 ≡ :4–12；types 体 ≡ :16–33；pure 体 ≡ :35–111；fs 体 ≡ :113–166（含 banner）——**逐字节 IDENTICAL · 零声明级改动**（usagePath 仍私有） | ___ |
| `@/lib/clew-usage` named exports | 11（1 常量 + 1 类型 + 9 函数） | **11 全守恒**（grep 集合对照逐名一致） | ___ |
| 消费者入口 | status/route:7 · suggest/route:11 · scripts/clew-suggest-check.mjs:33 | **零改**（全仓 tracked 修改仅 barrel 一件 + 3 新抽出件；routes / components / scripts 零 diff） | ___ |
| UI / EntityCardDetail / Clew* / CitePeek / ClewChangesPanel / Sidebar diff | — | **零 diff** | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（diff 为空；lint 仍精确报 HeYeSession.tsx:88:9 setIndex / StudySession.tsx:106:5 setOrder） | ___ |
| DAG | 单文件 | types 0 兄弟（1 跨 lib type-only）· pure 1（← types，type-only；**零 import fs**）· fs 2（← types · ← pure，值导入）——无环 | ___ |
| Node 剥类型直载（clew-check 实证） | .mjs → 单文件 | .mjs → barrel → types/pure/fs 链路：**69/69 pass**（`import type` 擦除 · 相对 `.ts` 值导入可解析） | ___ |
| tsconfig | （T83 含 allowImportingTsExtensions） | **零改** | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:88:9 + StudySession:106:5）；clew-usage* 零提及 | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级；exit 0） | ___ |
| cite-check · parse-check · page-check · density-check | 绿 | **绿**（exit 0 ×4；不因本刀红） | ___ |
| qa-check -- ch01 | 绿 | **绿**（exit 0；ch01 诚实行逐字同） | ___ |
| clew-check | 69/69 | **69/69**（exit 0；pass 69 · fail 0） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**（missing-card 1 · invalid 0 · exit 0） | ___ |
| 未碰复核（HeYe 606 / Study 460 / DocumentPane 649 / Sidebar 302 / ClewPane 930 / EntityCardDetail 552 / .mjs 检查脚本） | — | **零触碰** | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-89/lint-baseline.md`（tip eea8ccd · pnpm --filter web lint · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 setIndex + StudySession:106 setOrder，KEEP）；Mac 侧写手实跑复核同值（Mac 无 /workspace 目录，以任务书内锚数字 + 实跑双证）。
