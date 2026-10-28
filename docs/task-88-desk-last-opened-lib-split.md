# Task 88 — desk-last-opened-lib-split-01

**Slug**: `desk-last-opened-lib-split-01`
**Title**: last-opened.ts 诚实 mid-split · 186 行单文件按既有分区机械抽成 `last-opened-types` + `last-opened-persist` + `last-opened-heal`，主文件收口为 barrel（边界铁律 header 留此）；`@/lib/last-opened` 全部 11 个既有 named exports 守恒；9 个消费者（LastOpenedTouch · StudySession · RegisterMaterialButton · LibraryContinuity · ShelfBookContinuity · desk/BookSwitcher · desk/DocumentPane · desk/ReturnNav · desk/Sidebar）入口零改；key 字符串一字不改；heal 单条 peel 口径零改；UI 零 diff；两处会话冻结零触碰
**Tip**: `5cd0d39`（docs T87 desk-chapter-quality-rollup-lib-split-01）atop `7d033d1`（feat T87）atop `f8406f3`（T86 docs）
**体量**: 诚实 mid · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T87 收掉 chapter-quality-rollup lib 后，`apps/web/lib/last-opened.ts`（T21 续开指针 + T22 最近书栈 + T31/T32 读侧消毒 heal 的 localStorage 纯客户端 lib）仍是 186 行单文件，含三段**清晰分区边界**：types（:17–18 keys + :21–29 LastOpened）· persist（:19 RECENT_MAX + :31–129 读写六函数 + :175–187 订阅三件）· heal（:131–173 消毒三函数）。本刀按任务书推荐拆三件 + barrel：**types**（LAST_OPENED_KEY / RECENT_BOOKS_KEY / LastOpened，DAG 根、无 import）← **persist**（parseEntry（私）· loadLastOpened · loadRecentBooks · persistLastOpened（私）· saveLastOpened · touchLastOpened · clearLastOpened · listeners（私）· subscribeLastOpened · emitLastOpenedChanged（私）；自 types import 两 key + LastOpened）← **heal**（pageInHref（私）· sanitizeOpenedPage · healOpenedIfDirty；自 types import LastOpened、自 persist import saveLastOpened）。函数体与 tip 逐段一致（写手以只读 diff 逐段实证四段 IDENTICAL——含原文件 EOF 无尾换行的字节级细节；**零声明级改动**，六个私有符号在新家仍私有）；9 个消费者仍 `from "@/lib/last-opened"` 零改路径；StudySession 仅保留既有 import（effect 体零 diff）；HeYeSession:88 / StudySession:106 零触碰。

三件 DAG 实测（无环）：types 0 import；persist 1（← types）；heal 2（← types · ← persist）；**persist 零 import heal**（合同 D.2）；subscribe 与 emit 同件（emit 仅 persistLastOpened / clearLastOpened 路径调用，与 tip 同）。同 T83–T87：兄弟件 `.ts` 扩展名相对路径（tsconfig `allowImportingTsExtensions` 已开，本刀零 tsconfig 改动）。persist 职责允许既有 `typeof window` / localStorage / `Date.now()` / try-catch（合同 4）；heal 的 `Date.now()` 为 tip 既有行为（healOpenedIfDirty 单条写回戳，E.3 明令保留）。

## 铁合同（硬 · 铁 · 与任务书逐条对齐）

1. **机械抽出 only**：只搬既有分区；边界铁律 header（:1–15，两条 key 说明 + 存储正交声明 + 客户端安全引入声明）原文留 barrel；key 字符串一字不改（`ariadne.desk.last-opened.v1` / `ariadne.desk.recent-books.v1`）；RECENT_MAX 语义零改且仍私有（不入 types）；heal 单条 peel 口径零改（禁 clearLastOpened 整栈代 heal）；sanitize 干净条目原引用返回（`!==` 判脏防 heal 循环）零改；validPages 缺省原引用返回不写盘零改；touch 同书保留 deskHref/page、换书不残留零改。写手实证：barrel :1–15 ≡ tip :1–15；types 体 ≡ :17–18+:21–29；persist 体 ≡ :19+:31–129+:175–187；heal 体 ≡ :131–173——**逐字节 IDENTICAL（含 EOF 尾换行细节对齐）**。
2. **公共 API 守恒**：11 个既有 named exports（2 常量 + 1 类型 + 8 函数）全部仍可自 `@/lib/last-opened` 导入（barrel `export * from "./….ts"` ×3，带扩展名）；grep 集合对照逐名一致，零新增零删减零改名。Public surface：LAST_OPENED_KEY · RECENT_BOOKS_KEY · LastOpened · loadLastOpened · loadRecentBooks · saveLastOpened · touchLastOpened · clearLastOpened · sanitizeOpenedPage · healOpenedIfDirty · subscribeLastOpened。消费者入口零改：`components/LastOpenedTouch.tsx:4`、`components/StudySession.tsx:18`、`components/RegisterMaterialButton.tsx:6`、`components/LibraryContinuity.tsx:11`、`components/ShelfBookContinuity.tsx:9`、`components/desk/BookSwitcher.tsx:10`、`components/desk/DocumentPane.tsx:22`、`components/desk/ReturnNav.tsx:4`、`components/desk/Sidebar.tsx:12`。
3. **两处冻结 KEEP**：HeYeSession:88 setIndex · StudySession:106 setOrder——零触碰（两文件 git diff 为空）；不 gut、不 eslint-disable 捂 SSE。
4. **抽出件无 fs / 无 process.env / 无 `"use client"` 指令 / 无网络 / 无 LLM**；persist 允许既有 typeof window / localStorage / Date.now / try-catch（本模块职责）；兄弟件仅相对 `.ts` import。
5. **只读铁律**：无任何新增写路径（本刀只搬文件）；永不 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM·Auto·BYOK·云墙。
6. **抽出 ≠ densify**：函数体逐段一致；不新增 CTA、不改 UI、不改书架徽列（9 消费者零 diff）。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；不引入新的同步 effect 内 setState。
8. 美学：先读 `docs/frontend-aesthetics.md`（本会话已读，无变更）；无产品视觉改动（纯 lib）。
9. 不 redo T21–T32 last-opened·recent·heal 语义 / Clew T66–T70 语义；不拆 EntityCardDetail / CitePeek / ClewChangesPanel / Sidebar / ClewPane / DocumentPane / HeYe·Study 主流程 / clew-pane-helpers（T75 BAN）当主题；不碰 T73–T87 extracts、T74/T77 entities memo。
10. J 必记：before 186 → after barrel ≤80（目标 ≤50）；抽出件 ≥3（三件）；消费者路径零改；UI 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；既有 qa/cite/parse 夹具不因本刀红。

## 抽出映射（源缝 → 目标文件）

| 源（tip last-opened.ts 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 1–15 | 边界/铁合同 header（两条 key 说明 · 存储正交 · 客户端安全引入） | **留** `last-opened.ts`（barrel；原文零改） |
| 17–18 · 21–29 | LAST_OPENED_KEY · RECENT_BOOKS_KEY · type LastOpened | `last-opened-types.ts`（20 行；DAG 根，0 import） |
| 19 · 31–129 · 175–187 | RECENT_MAX（仍私有）· parseEntry（私）· loadLastOpened · loadRecentBooks · persistLastOpened（私）· saveLastOpened · touchLastOpened · clearLastOpened · listeners（私）· subscribeLastOpened · emitLastOpenedChanged（私） | `last-opened-persist.ts`（129 行；import ← types） |
| 131–173 | pageInHref（私）· sanitizeOpenedPage · healOpenedIfDirty | `last-opened-heal.ts`（56 行；import ← types · ← persist） |
| — | 新增 | barrel：15 行铁合同原文 + 16 行 T88 注（三件地图 + DAG 单向声明 + persist 职责白名单）+ 3 行 `export *` |

私有符号（RECENT_MAX · parseEntry · persistLastOpened · listeners · emitLastOpenedChanged · pageInHref）在新家仍私有，不经 barrel 外泄。

## OUT（本刀 + forever）

不 push · 不改 key 字符串 / RECENT_MAX 语义 / heal 单条 peel 口径 / sanitize 原引用返回 / validPages 缺省语义 · 不用 clearLastOpened 整栈替代 heal 单条 · 不打破干净条目原引用返回（!== 防循环）· 不加 fs / process.env / "use client" 指令 / 网络 / LLM · 不 densify · 不写 seed · 不改名既有 storage keys · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 EntityCardDetail / CitePeek / ClewChangesPanel / Sidebar / ClewPane / DocumentPane / HeYe·Study 主流程 / clew-pane-helpers 当主题 · 不改任何消费者 import 为深路径 · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM / Auto / BYOK / 云墙 / 批量重抽 / 钥入仓 / Next 升级。

## DEFER（后续刀）

EntityCardDetail（552；tip 复测仍仅 citeStats / firstPagedCitePage 薄 helpers ~35 LOC，未出现 ≥3 清晰机械 extract 缝）· CitePeek（361）· ClewChangesPanel（319）· Sidebar（302）再拆（缝弱）· ClewPane 编排器再拆（禁作主题）· clew-pane-helpers（T75 BAN）· DocumentPane 再 densify（禁）· HeYe/Study 主流程再拆（禁）· DraftInbox / Cockpit UI / AtomDraftEditor / atom-draft* / clew-suggest* / clew-answer-audit* / cite-ocr* / chapter-quality-rollup* 再拆（禁 · T80–T87 刚闭）· CardDraftBar（98 thin）· clew-usage（166 更薄）· route 再拆（禁）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 5cd0d39） | after（写手树） | 验收复核 |
|---|---|---|---|
| `lib/last-opened.ts` 行数 | **186** | **34**（barrel；≤80 达标，目标 ≤50 亦达成：15 行铁合同原文 + 16 行 T88 注 + 3 行 re-export + 界空行） | ___ |
| 抽出件（≥3） | — | **3**：types 20 · persist 129 · heal 56（合计 205 = 186 − 15 header + 三件头注 / 跨文件 import） | ___ |
| 代码行守恒（逐段只读 diff vs `git show 5cd0d39`） | — | barrel :1–15 ≡ :1–15；types 体 ≡ :17–18+:21–29；persist 体 ≡ :19+:31–129+:175–187；heal 体 ≡ :131–173——**逐字节 IDENTICAL · 零声明级改动**（六私有符号仍私有） | ___ |
| `@/lib/last-opened` named exports | 11（2 常量 + 1 类型 + 8 函数） | **11 全守恒**（grep 集合对照逐名一致；零新增零删减零改名） | ___ |
| 消费者入口（9） | LastOpenedTouch · StudySession · RegisterMaterialButton · LibraryContinuity · ShelfBookContinuity · BookSwitcher · DocumentPane · ReturnNav · Sidebar | **零改**（全仓 tracked 修改仅 barrel 一件 + 3 新抽出件；components/ · app/ · scripts/ 零 diff；StudySession 仅既有 :18 import 保留，effect 体零 diff） | ___ |
| UI / EntityCardDetail / Clew* / CitePeek / ClewChangesPanel / Sidebar diff | — | **零 diff** | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（diff 为空；lint 仍精确报 HeYeSession.tsx:88:9 setIndex / StudySession.tsx:106:5 setOrder） | ___ |
| DAG | 单文件 | types 0 import · persist 1（← types，**零 import heal**）· heal 2（← types · ← persist）——无环 | ___ |
| tsconfig | （T83 含 allowImportingTsExtensions） | **零改** | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:88:9 + StudySession:106:5）；last-opened* 零提及 | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级；16 路由齐） | ___ |
| cite-check（ch01 行） | 卡 40 · 原子 57 · 有页 cite 195 · OCR未见 0 | **同值绿**（exit 0） | ___ |
| parse-check · page-check · density-check | 绿 | **绿**（exit 0 ×3；不因本刀红） | ___ |
| qa-check -- ch01（= chapter-quality-check） | 绿 | **绿**（exit 0 直跑 3/3 稳定；ch01 诚实行逐字同：暗 4（23.5%）· 浅 3（17.6%）· 不完备 0 · weak） | ___ |
| clew-check | 69/69 | **69/69**（exit 0） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**（missing-card 1 · invalid 0 · exit 0；报告落 data/qa 未跟踪面） | ___ |
| 未碰复核（HeYe 606 / Study 460 / DocumentPane 649 / Sidebar 302 / ClewPane 930 / EntityCardDetail 552） | — | **零触碰** | ___ |

工程旁注：验收复跑 `pnpm run qa-check -- ch01` 请用引号整串或逐词直跑——zsh 不对未加引号的循环变量分词，`c="run qa-check -- ch01"; pnpm $c` 会把整串当单脚本名报 not found（写手实测 3/3 直跑 exit 0，循环形态 exit 1 纯属 shell 分词伪红）。

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-88/lint-baseline.md`（tip 5cd0d39 · pnpm --filter web lint · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 setIndex + StudySession:106 setOrder，KEEP）；Mac 侧写手实跑复核同值（Mac 无 /workspace 目录，以任务书内锚数字 + 实跑双证）。
