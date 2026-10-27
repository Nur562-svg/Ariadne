# Task 84 — desk-clew-suggest-lib-split-01

**Slug**: `desk-clew-suggest-lib-split-01`
**Title**: clew-suggest.ts 诚实 mid-split · 831 行单文件按既有分区机械抽成 `clew-suggest-types` + `clew-suggest-grounding` + `clew-suggest-parse` + `clew-suggest-compose`，主文件收口为 barrel（铁合同七条留此）；`@/lib/clew-suggest` 全部 50 个既有 named exports 守恒；4 个消费者（route / ClewPane / clew-pane-helpers / clew-suggest-check.mjs）入口零改；UI 零 diff；两处会话冻结零触碰
**Tip**: `32ace43`（docs T83）atop `25e8228`（feat T83）atop `62894d7`（T82 docs）
**体量**: mid · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T83 收掉 atom-draft lib 后，`apps/web/lib/clew-suggest.ts` 仍是 831 行单文件，含五段**已有分区注释**的清晰缝：形状（:25 types + 全量常量至 :191）· T69 A 按档 grounding 策略（:193–281）· 请求体校验（:283–405）· 截断（:407–417）· 系统提示（:419）/ T67 D·E（:436）/ 上下文（:484）/ F 带走（:573）/ T67 C 流事件（:790）。本刀按任务书推荐拆四件 + barrel：**types**（形状 + 常量，DAG 根、无 import）← **grounding**（policy/select/assemble/footnote + truncate）← **compose**（系统提示 / 补丁指令·白名单·解析 / 上下文 / buildPrompt / 带走·信封 / 流事件）；**parse**（JOB_SHAPE 拒 bulk / sanitizeContext / parseSuggestBody）← types。函数体与 tip 逐段一致（仅跨文件 `.ts` 相对 import）；`scripts/clew-suggest-check.mjs` 仍直载 barrel（Node 原生 type-strip，37 运行时导出全到）；route / ClewPane / clew-pane-helpers 零 diff；HeYeSession:88 / StudySession:106 零触碰。

**结构性事实（写给下一位读者）——三处声明级迁位（保 DAG「types 为根」且不复制分叉，均有依赖实证）**：
1. `SuggestPatchEntry`（原 :575–585）与 `ClewSeedBefore`（原 :587–588）原在 F 带走区，但 `ClewGrounding.seedBefore`（types 区 :121）引用 `ClewSeedBefore`、`ClewSeedBefore` 又引用 `SuggestPatchEntry["field"]`——留在 compose 会逼 types ← compose 反向边（或 type-only 环）；二者是纯形状，故随形状入 types。
2. `isPrintedPage`（原 :314–316，校验区私有）被 grounding（selectGroundPages / assembleChapterGround）与 parse（sanitizeContext）**双用**；归 types 加 `export`（形状守卫），避免 grounding ↔ parse 互倚，也不复制分叉。这是全刀唯一声明行改动（`function` → `export function`）。
3. `formatAuditTakeawayLine`（原 :60–65，形状区私有）按任务书随 compose（唯一调用点 buildTakeawayText），迁至 compose 顶部 import 后；仍私有。
四件 DAG 实测（去注释后 import 语句计数）：types 0 import；grounding 1（← types）；parse 1（← types）；compose 2（← types、← grounding footnote）；barrel 4 × `export * from "./….ts"`。同 T83：`.ts` 扩展名相对路径是 Node 直载与 tsc 双解的唯一形式（tsconfig `allowImportingTsExtensions` T83 已开，本刀零 tsconfig 改动）。

## 铁合同（硬 · 铁 · 与任务书逐条对齐）

1. **机械抽出 only**：只搬既有分区；铁合同七条 header（:1–23）原文留 barrel；系统提示 `CLEW_SYSTEM_PROMPT` 逐字零改；`JOB_SHAPE_KEYS` 十六键与 422 文案零改；grounding 常量顶（LONG_PAGES_MAX 5 / LONG_TOTAL_CHARS_MAX 12000 / PAGE_TEXT_MAX_CHARS 3000）零改；补丁白名单（SUGGEST_PATCH_FIELDS / verified·write·apply 整条丢弃）零改。写手脚本实证：去注释·去 import 后**代码行 607 → 607 order-insensitive IDENTICAL**，唯一差异 = `function isPrintedPage` → `export function isPrintedPage`。
2. **公共 API 守恒**：50 个既有 named exports（36 值 + 14 类型）全部仍可自 `@/lib/clew-suggest` 导入（barrel `export * from "./….ts"` ×4；写手以 50 符号临时校验文件过 tsc 0 后删除）；新增 `isPrintedPage` 一个 export（只加不减）。消费者入口零改：`app/api/clew/suggest/route.ts`（20 名）、`components/desk/ClewPane.tsx`（6 名）、`components/desk/clew-pane-helpers.ts`（3 名）仍 `from "@/lib/clew-suggest"`；`scripts/clew-suggest-check.mjs:30` 仍 `import("../apps/web/lib/clew-suggest.ts")`（入口零改）。
3. **两处冻结 KEEP**：HeYeSession:88 cursor · StudySession:106 order——零触碰（两文件 git diff 为空）；不 gut、不 eslint-disable 捂 SSE（五件 clew-suggest*.ts eslint-disable 0）。
4. **Node 直 import 守恒**：五件（含 barrel）去注释后 import/export-from 语句共 8 条，全部相对 `.ts`；**无 fs / 无 process.env / 无 `"use client"` / 无 require / 无 `clew-answer-audit` import**（wire 同构类型 ClewAnswerAuditWire / ClewAuditBasisWire / ClewCardAtomWire 仍字面声明在 types）；`@/` 零出现（barrel 注释中的 `` `from "@/lib/clew-suggest"` `` 为说明文字非语句）。
5. **Clew 只读铁律**：无任何新增写路径；流事件类型与编码原样（永不携带 apiKey / baseURL）；Node 直载实测 `parseSuggestBody({question:"q",pages:[]})` → 422 bulk_rejected（拒 bulk 口径经 barrel 不变）。
6. **抽出 ≠ densify**：不新增 CTA、不改空表诚实句、不改 UI、不改 route 流式主路径（route 零 diff）。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；纯函数 lib 无 effect / setState。
8. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动（纯 lib）。
9. 不 redo Clew T66–T70 语义；不拆 DocumentPane / ClewPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit / AtomDraftEditor / atom-draft* / EntityCardDetail 当主题；不碰 T73–T83 extracts、T74/T77 entities memo。
10. J 必记：before 831 → after barrel ≤80（目标 ≤50）；抽出件 ≥3；消费者路径零改；UI/route 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；clew-check 绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip clew-suggest.ts 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 1–23 | 铁合同 header（七条 JSDoc） | **留** `clew-suggest.ts`（barrel；原文零改） |
| 25–191 | `// ---- 形状 ----`：ClewAnswerAuditWire / ClewAuditBasisWire / ClewCardAtomWire（wire 同构字面）· ClewSuggestContext / ClewSuggestRequest / ClewGrounding / ClewAnswerMeta / ClewIncompleteGrounding · 18 常量（QUESTION/PAGE_TEXT/CITE_PAGES/ANSWER_MAX_OUTPUT/STREAM×2/UPSTREAM/GROUND×3/PATCH×2/LONG×2/SEED_BEFORE） | `clew-suggest-types.ts`（189 行；**无 import**，DAG 根） |
| （+575–588 迁入） | SuggestPatchEntry · ClewSeedBefore（F 区形状；ClewGrounding 引用） | 同上 types（声明零改，仅迁位） |
| （+314–316 迁入） | isPrintedPage（校验区私有 → **加 export**；grounding/parse 双用） | 同上 types（唯一声明行改动） |
| 193–281 | `// ---- T69 A ----`：GroundingPolicy · groundingPolicyForTier · selectGroundPages · groundPagesOf · assembleChapterGround · CLEW_HONESTY_FOOTNOTE | `clew-suggest-grounding.ts`（118 行；import 4 名 ← types） |
| 407–417 | `// ---- 截断 ----`：truncatePageText | 同上 grounding |
| 283–405 | `// ---- 请求体校验 ----`：ParseResult · JOB_SHAPE_KEYS · SURFACES（私）· idTitle（私）· findJobShapeKey（私）· sanitizeContext · parseSuggestBody | `clew-suggest-parse.ts`（135 行；import 4 名 ← types；− isPrintedPage 迁出） |
| 60–65 | formatAuditTakeawayLine（形状区私有；唯一调用点 buildTakeawayText） | `clew-suggest-compose.ts`（随入，仍私有） |
| 419–831 | `// ---- 系统提示 ----` CLEW_SYSTEM_PROMPT · `// ---- T67 D/E ----` incompleteTargets / buildPatchInstructionBlock · `// ---- 上下文 ----` SURFACE_ZH（私）/ buildContextBlock / buildPrompt · `// ---- F 带走 ----` cutSeedBefore（私）/ buildSeedBeforeMap / SUGGEST_PATCH_FIELDS（私）/ parseSuggestPatchEntries / splitStructuredPatch / contextLine（私）/ buildTakeawayText / ClewPatchEnvelope / buildSuggestPatchEnvelope / buildSuggestPatchText · `// ---- T67 C 流事件 ----` ClewStreamEvent / encodeClewStreamEvent | `clew-suggest-compose.ts`（431 行；import 13 名 ← types + 1 名 ← grounding footnote；− SuggestPatchEntry/ClewSeedBefore 迁出） |
| — | 新增 | barrel：18 行 T84 注（四件地图 + `.ts` 相对路径约束）+ 4 行 `export *` |

私有符号（SURFACES / idTitle / findJobShapeKey / cutSeedBefore / SUGGEST_PATCH_FIELDS / SURFACE_ZH / contextLine / formatAuditTakeawayLine）在新家仍私有，不经 barrel 外泄。

## OUT（本刀 + forever）

不 push · 不改 Clew 铁合同七条 / 系统提示语义 / 拒 bulk 口径 / 档位接地策略 / 补丁白名单 · 不给 clew-suggest 加 clew-answer-audit import（破坏 Node 无 audit 依赖）· 不加 fs / process.env / "use client" · 不 densify · 不造掌握% / Due / 单一健康分 / 健康圆环 / 第四书架徽列 · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit / AtomDraftEditor / atom-draft* / EntityCardDetail 当主题 · 不改任何消费者 import 为深路径 · 不改 scripts/clew-suggest-check.mjs 入口 · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM / Auto / BYOK / 云墙 / 批量重抽 / 钥入仓 / Next 升级 · 不发明或改名既有 storage keys。

## DEFER（后续刀）

EntityCardDetail（552；缝稠、缠 OCR/草稿 densify）· clew-answer-audit 再拆（缝弱）· ClewPane 编排器再拆（禁作主题）· DocumentPane 再 densify（禁）· ChapterPageReader 再拆（禁）· HeYe/Study 主流程再拆（禁）· DraftInbox / Cockpit / AtomDraftEditor / atom-draft* 再拆（禁 · T80–T83 刚闭）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 32ace43） | after（写手树） | 验收复核 |
|---|---|---|---|
| `lib/clew-suggest.ts` 行数 | **831** | **41**（barrel；≤80 达标，目标 ≤50 亦达成：23 行铁合同原文 + 14 行 T84 注 + 4 行 re-export） | ___ |
| 抽出件（≥3） | — | **4**：types 189 · grounding 118 · parse 135 · compose 431（合计 873 = 831 − 23 header + 四件头注/跨文件 import/isPrintedPage JSDoc） | ___ |
| 代码行守恒（去注释·去 import·order-insensitive） | 607 | **607 IDENTICAL**；唯一差异 `function isPrintedPage` → `export function isPrintedPage` | ___ |
| `@/lib/clew-suggest` named exports | 50（36 值 + 14 类型） | **50 全守恒** + 新增 `isPrintedPage`（只加不减；50 符号校验文件 tsc 0）；Node 直载 barrel 运行时导出 37 = 36 值 + isPrintedPage | ___ |
| 消费者入口 | route 20 名 · ClewPane 6 名 · clew-pane-helpers 3 名 · clew-check `S.*` 27 名 | **零改**（`git status`：components/ · app/ · scripts/ · atom-draft* · clew-answer-audit/provider/usage 全零 diff；唯一 M = clew-suggest.ts + 4 新件） | ___ |
| UI / ClewPane / route diff | — | **零 diff**（ClewPane 930 · route 638 · helpers 299 原样） | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（diff 为空；lint 仍精确报 `:88:9 setIndex` / `:106:5 setOrder`） | ___ |
| tsconfig | 35 行（T83 含 allowImportingTsExtensions） | **零改**（本刀不需要任何配置变更） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（:88:9 · :106:5）；normalized diff **IDENTICAL**；clew-suggest* 零提及 | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 16.4.0 未升级；Compiled successfully · TypeScript finished） | ___ |
| Next 运行时冒烟（`next start` · POST /api/clew/suggest） | — | 顶层 `pages[]` **422** bulk_rejected · 嵌套 `context.chapters[]` **422** · 缺 question **400** · 空 question **400**（四条文案逐字同 tip；经 route → barrel → parse）；服务端 stderr 0 | ___ |
| clew-check（Node 直载） | 69/69 | **69/69** | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（cite 卡40·原子57·OCR未见0；parse 覆盖100.0%；page 暗4；density 浅3；qa 不完备0 ·「草稿 —（本机）」口径不变） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 / missing 0 / invalid 0（报告 gitignored；data/ 零脏） | ___ |
| 未碰复核（HeYeSession/StudySession/DocumentPane/ClewPane/ChapterPageReader/EntityCardDetail/route/clew-pane-helpers/atom-draft barrel） | 606/460/649/930/353/552/638/299/32 行 | **零触碰** | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-84/lint-baseline.md`（tip 32ace43 · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 cursor + StudySession:106 order，KEEP）；Mac 侧写手开工前实跑复核同值（`/tmp/t84-lint-before.txt`）。
