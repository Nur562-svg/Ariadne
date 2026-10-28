# Task 90 — desk-clew-provider-lib-split-01

**Slug**: `desk-clew-provider-lib-split-01`
**Title**: clew-provider.ts 诚实 mid-split · 139 行单文件按既有分区机械抽成 `clew-provider-types` + `clew-provider-defaults` + `clew-provider-resolve`，主文件收口为 barrel（铁合同 header 留此）；`@/lib/clew-provider` 全部 17 个既有 named exports 守恒；2 route + clew-usage 三件（type-only）消费者入口零改；scripts/clew-suggest-check.mjs 仍相对 import barrel（Node 剥类型直载链路实证无恙）；三档 id / 不串档 fail-closed / 缺省模型表零改；**不交** LiteLLM/Auto/BYOK/云墙；UI 零 diff；两处会话冻结零触碰
**Tip**: `1540cc5`（docs T89 desk-clew-usage-lib-split-01）atop `84eb985`（feat T89）atop `eea8ccd`（T88 docs）
**体量**: 诚实 mid · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T89 收掉 clew-usage lib 后，`apps/web/lib/clew-provider.ts`（T66 B / T68 A Clew provider 与三档注册表——纯函数 env 入参 → 配置或 null，不串档 fail-closed）仍是 139 行单文件，含三段**清晰分区边界**：types（:20–44 七符号）· defaults（:46–57 缺省 URL/model/每档模型表）· resolve（:59–139 私有三 helpers + 五公共面）。本刀按任务书推荐拆三件 + barrel：**types**（ClewProviderName / ClewTierId / CLEW_TIERS / CLEW_DEFAULT_TIER / ClewProviderConfig / ClewTierConfig / EnvLike，DAG 根、零 import）← **defaults**（ZHIPU_DEFAULT_* / MINIMAX_DEFAULT_* / TIER_DEFAULT_MODELS；← types type-only；**禁 import resolve**）← **resolve**（私有 nonEmpty · tierEnvPrefix · pickProvider 随行 + resolveClewTier / ClewTierSummary / clewTierSummaries / resolveClewProvider / publicProviderInfo；← types · ← defaults）。函数体与 tip 逐段一致（写手以只读 diff 逐段实证四段 IDENTICAL，零声明级改动）；2 route + clew-usage-{types,pure,fs} 消费者仍零改路径；**clew-check 69/69 实证 .mjs 直载新 barrel 链路无恙**；HeYeSession:88 / StudySession:106 零触碰。

三件 DAG 实测（无环）：types 0 import；defaults 1（← types，type-only）；resolve 2（← types 值+type · ← defaults 值）。全纯函数（EnvLike 入参），**无顶层 process.env 读**（合同 4）；同 T83–T89：兄弟件 `.ts` 扩展名相对路径（tsconfig `allowImportingTsExtensions` 已开，本刀零 tsconfig 改动）。三档 id（fast | reasoning | long-context）与 CLEW_DEFAULT_TIER = "fast" 一字不改；缺省模型表逐字一致。

## 铁合同（硬 · 铁 · 与任务书逐条对齐）

1. **机械抽出 only**：只搬既有分区；铁合同 header（:1–18，不串档铁律 · env 映射 · 缺省模型表 · 「不交 LiteLLM/Auto/BYOK/云配额」声明）原文留 barrel。写手实证：barrel :1–18 ≡ tip :1–18；types 体 ≡ :20–44；defaults 体 ≡ :46–57；resolve 体 ≡ :59–139——**逐字节 IDENTICAL · 零声明级改动**（nonEmpty / tierEnvPrefix / pickProvider 仍私有）。不串档 fail-closed（缺该档可用钥 → null，永不静默回落其它档）、显式厂商缺钥不悄换、publicProviderInfo 永不含 apiKey / baseURL——逐字未动。
2. **公共 API 守恒**：17 个既有 named exports（types 7 + defaults 5 + resolve 5）全部仍可自 `@/lib/clew-provider` 导入（barrel `export * from "./….ts"` ×3，带扩展名）；grep 集合对照逐名一致，零新增零删减零改名。Public surface：ClewProviderName · ClewTierId · CLEW_TIERS · CLEW_DEFAULT_TIER · ClewProviderConfig · ClewTierConfig · EnvLike · ZHIPU_DEFAULT_BASE_URL · ZHIPU_DEFAULT_MODEL · MINIMAX_DEFAULT_BASE_URL · MINIMAX_DEFAULT_MODEL · TIER_DEFAULT_MODELS · ClewTierSummary · resolveClewTier · clewTierSummaries · resolveClewProvider · publicProviderInfo。消费者入口零改：`app/api/clew/status/route.ts` · `app/api/clew/suggest/route.ts` · `lib/clew-usage-{types,pure,fs}.ts`（type-only ClewTierId）· `scripts/clew-suggest-check.mjs:32`（`await import("../apps/web/lib/clew-provider.ts")` 相对 barrel，零触零改）。
3. **两处冻结 KEEP**：HeYeSession:88 setIndex · StudySession:106 setOrder——零触碰（两文件 git diff 为空）；不 gut、不 eslint-disable 捂 SSE。
4. **types / defaults 无 fs / 无网络 / 无 LLM；resolve 亦纯函数（EnvLike 入参）**——grep 实证三件零 `process.env` 顶层读、零 `"use client"`；抽出件仅相对 `.ts` import。
5. **只读铁律**：无任何新增写路径（本刀只搬文件）；永不 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM·Auto·BYOK·云墙；钥永不入仓 / 永不 NEXT_PUBLIC_*。
6. **抽出 ≠ densify**：函数体逐段一致；不新增 CTA、不改 UI、不改书架徽列（2 route / UI 零 diff）。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；不引入新的同步 effect 内 setState。
8. 美学：先读 `docs/frontend-aesthetics.md`（本会话已读，无变更）；无产品视觉改动（纯 lib）。
9. 不 redo Clew T66–T70 语义 / T66–T68 provider 不串档铁律；不拆 EntityCardDetail / CitePeek / ClewChangesPanel / Sidebar / ClewPane / DocumentPane / HeYe·Study 主流程 / clew-pane-helpers（T75 BAN）/ entities / clew-usage* 当主题；不碰 T73–T89 extracts、T74/T77 entities memo。
10. J 必记：before 139 → after barrel ≤80（目标 ≤50）；抽出件 ≥3（三件）；消费者路径零改；UI 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；既有 qa/cite/parse/clew 夹具不因本刀红（`pnpm clew-check` 仍绿）。

## 抽出映射（源缝 → 目标文件）

| 源（tip clew-provider.ts 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 1–18 | 铁合同 header（不串档 · env 映射 · 缺省模型表 · 不交 LiteLLM/Auto/BYOK/云配额） | **留** `clew-provider.ts`（barrel；原文零改） |
| 20–44 | ClewProviderName · ClewTierId · CLEW_TIERS · CLEW_DEFAULT_TIER · ClewProviderConfig · ClewTierConfig · EnvLike | `clew-provider-types.ts`（35 行；DAG 根，零 import） |
| 46–57 | ZHIPU_DEFAULT_BASE_URL · ZHIPU_DEFAULT_MODEL · MINIMAX_DEFAULT_BASE_URL · MINIMAX_DEFAULT_MODEL · TIER_DEFAULT_MODELS | `clew-provider-defaults.ts`（23 行；← types · type-only；禁 import resolve） |
| 59–139 | nonEmpty（私）· tierEnvPrefix（私）· pickProvider（私）· resolveClewTier · ClewTierSummary · clewTierSummaries · resolveClewProvider · publicProviderInfo | `clew-provider-resolve.ts`（107 行；← types 值+type · ← defaults 值） |
| — | 新增 | barrel：18 行铁合同原文 + 19 行 T90 注（三件地图 + Node 剥类型直载声明）+ 3 行 `export *` |

私有符号（nonEmpty · tierEnvPrefix · pickProvider）在新家仍私有，不经 barrel 外泄。

## OUT（本刀 + forever）

不 push · 不改三档 id / CLEW_DEFAULT_TIER / 不串档 fail-closed / 缺钥 null / 厂商优先序 / 缺省模型表 / publicProviderInfo 无钥投影 · **不交** LiteLLM 网关 / Auto 路由 / BYOK / 云配额（云墙）· 不加 fs / 顶层 process.env 读 / "use client" 指令 / 网络 / LLM · 不 densify · 不写 seed · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 EntityCardDetail / CitePeek / ClewChangesPanel / Sidebar / ClewPane / DocumentPane / HeYe·Study 主流程 / clew-pane-helpers / entities / clew-usage* 当主题 · 不改任何消费者 import 为深路径 · 不把 scripts/clew-suggest-check.mjs 改成主题 · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / 批量重抽 / 钥入仓 / NEXT_PUBLIC_* / Next 升级。

## DEFER（后续刀）

EntityCardDetail（552；tip 复测仍仅 citeStats / firstPagedCitePage 薄 helpers ~35 LOC，未出现 ≥3 清晰机械 extract 缝）· CitePeek（361）· ClewChangesPanel（319）· Sidebar（302）再拆（缝弱）· entities（586 padded MEGA · 非本刀）· ClewPane 编排器再拆（禁作主题）· clew-pane-helpers（T75 BAN）· DocumentPane 再 densify（禁）· HeYe/Study 主流程再拆（禁）· atom-draft* / clew-suggest* / clew-answer-audit* / cite-ocr* / chapter-quality-rollup* / last-opened* / clew-usage* 再拆（禁 · T83–T89 刚闭）· route 再拆（禁）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 1540cc5） | after（写手树） | 验收复核 |
|---|---|---|---|
| `lib/clew-provider.ts` 行数 | **139** | **40**（barrel；≤80 达标，目标 ≤50 亦达成：18 行铁合同原文 + 19 行 T90 注 + 3 行 re-export + 界空行） | ___ |
| 抽出件（≥3） | — | **3**：types 35 · defaults 23 · resolve 107（合计 165 = 139 − 18 header + 三件头注 / 跨文件 import） | ___ |
| 代码行守恒（逐段只读 diff vs `git show 1540cc5`） | — | barrel :1–18 ≡ :1–18；types 体 ≡ :20–44；defaults 体 ≡ :46–57；resolve 体 ≡ :59–139——**逐字节 IDENTICAL · 零声明级改动**（三私有 helpers 仍私有） | ___ |
| `@/lib/clew-provider` named exports | 17（types 7 + defaults 5 + resolve 5） | **17 全守恒**（grep 集合对照逐名一致） | ___ |
| 消费者入口 | status/route · suggest/route · clew-usage-{types,pure,fs} · check.mjs:32 | **零改**（全仓 tracked 修改仅 barrel 一件 + 3 新抽出件；routes / components / scripts 零 diff） | ___ |
| UI / EntityCardDetail / Clew* / CitePeek / ClewChangesPanel / Sidebar diff | — | **零 diff** | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（diff 为空；lint 仍精确报 HeYeSession.tsx:88:9 setIndex / StudySession.tsx:106:5 setOrder） | ___ |
| DAG | 单文件 | types 0 import · defaults 1（← types，type-only；零 import resolve）· resolve 2（← types · ← defaults）——无环 | ___ |
| 纯函数约束 | env 入参 | 三件 grep 零顶层 `process.env` / 零 `"use client"` / 零 fs / 零网络 / 零 LLM | ___ |
| Node 剥类型直载（clew-check 实证） | .mjs → 单文件 | .mjs → barrel → types/defaults/resolve 链路：**69/69 pass** | ___ |
| tsconfig | （T83 含 allowImportingTsExtensions） | **零改** | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:88:9 + StudySession:106:5）；clew-provider* 零提及 | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级；exit 0） | ___ |
| cite-check · parse-check · page-check · density-check | 绿 | **绿**（exit 0 ×4；不因本刀红） | ___ |
| qa-check -- ch01 | 绿 | **绿**（exit 0；ch01 诚实行逐字同） | ___ |
| clew-check | 69/69 | **69/69**（pass 69 · fail 0 · exit 0） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**（missing-card 1 · invalid 0 · exit 0） | ___ |
| 未碰复核（HeYe 606 / Study 460 / DocumentPane 649 / Sidebar 302 / ClewPane 930 / EntityCardDetail 552 / .mjs 检查脚本） | — | **零触碰** | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-90/lint-baseline.md`（tip 1540cc5 · pnpm --filter web lint · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 setIndex + StudySession:106 setOrder，KEEP）；Mac 侧写手实跑复核同值（Mac 无 /workspace 目录，以任务书内锚数字 + 实跑双证）。
