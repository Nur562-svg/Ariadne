# Task 87 — desk-chapter-quality-rollup-lib-split-01

**Slug**: `desk-chapter-quality-rollup-lib-split-01`
**Title**: chapter-quality-rollup.ts 诚实 mid-split · 288 行单文件按既有 export 组机械抽成 `chapter-quality-rollup-types` + `chapter-quality-rollup-build` + `chapter-quality-rollup-helpers`，主文件收口为 barrel（铁合同 header 留此）；`@/lib/chapter-quality-rollup` 全部 16 个既有 named exports 守恒；4 个消费者（ChapterQualityCockpit / ChapterQualityCockpitRow / chapter-quality-rollup-server / desk page）入口零改；server 与孪生 scripts/chapter-quality-check.mjs 零触；UI 零 diff；两处会话冻结零触碰
**Tip**: `f8406f3`（docs T86 desk-cite-ocr-quality-lib-split-01）atop `56952c1`（feat T86）atop `fecfe93`（T85 docs）
**体量**: 诚实 mid · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T86 收掉 cite-ocr-quality lib 后，`apps/web/lib/chapter-quality-rollup.ts`（T63 章级质量 rollup 纯聚合）仍是 288 行单文件，含三段**清晰 export 组边界**（已有 `// ----` 分段注释）：types（:31–99）· build（:101–176）· helpers（:178–288）。本刀按任务书推荐拆三件 + barrel：**types**（ROLLUP_MISS_CARD_SAMPLE / ROLLUP_PAGE_SAMPLE · RollupCite/Parse/Dark/Shallow/Draft · ChapterQualityRollup，DAG 根、跨 lib 仅 type-only import cite-ocr-quality / parse-ocr-coverage）← **build**（私有 uniqueCardIds · buildChapterQualityRollup；自 types import 两常量 + ChapterQualityRollup）← **helpers**（RollupWeakFlags / rollupWeakFlags · rollupIsWeak · rollupAllUnchecked · RollupFold / foldChapterRollups · rollupCliCommands；自 types import ChapterQualityRollup + RollupDraft）。函数体与 tip 逐段一致（写手以只读 diff 逐段实证四段 IDENTICAL，**零声明级改动**——私有 uniqueCardIds 仍私有不经 barrel 外泄，与 T86 的 emptyQuality 加 export 不同款、更干净）；4 个消费者仍 `from "@/lib/chapter-quality-rollup"` 零改路径；`chapter-quality-rollup-server.ts`（90 行）与孪生 `scripts/chapter-quality-check.mjs`（245 行）零触（算法体逐字未变 → keep-in-sync 合同仍同真）；HeYeSession:88 / StudySession:106 零触碰。

三件 DAG 实测：types 0 兄弟 import（2 个跨 lib type-only）；build 1（← types）+ 4 个跨 lib type-only；helpers 1（← types）。同 T83–T86：兄弟件 `.ts` 扩展名相对路径是 Node 直载与 tsc 双解的唯一形式（tsconfig `allowImportingTsExtensions` 已开，本刀零 tsconfig 改动）；跨 lib import 保持 `@/lib/` 别名（T83 atom-draft-* 同款先例）。

## 铁合同（硬 · 铁 · 与任务书逐条对齐）

1. **机械抽出 only**：只搬既有 export 组；铁合同 header（:1–24，consume-only 五条 + 孪生声明）原文留 barrel；六信号分列口径零改（null=未检 fail-closed；cite 未见 ≠ parse 空/稀 ≠ 暗 ≠ 浅 ≠ incomplete ≠ draft）；零新算法、零第二套阈值、零合成健康分/掌握%/圆环。写手实证：barrel :1–24 ≡ tip :1–24；types 体 ≡ tip :31–99；build 体 ≡ tip :101–176；helpers 体 ≡ tip :178–288——**逐字节 IDENTICAL**。
2. **公共 API 守恒**：16 个既有 named exports（8 值 + 8 类型）全部仍可自 `@/lib/chapter-quality-rollup` 导入（barrel `export * from "./….ts"` ×3，带扩展名）；零新增、零删减、零改名。消费者入口零改：`app/(desk)/page.tsx:17`（type ChapterQualityRollup）、`components/ChapterQualityCockpit.tsx:7-11`（foldChapterRollups · rollupAllUnchecked · rollupIsWeak · type ChapterQualityRollup）、`components/ChapterQualityCockpitRow.tsx:5`（rollupCliCommands · type ChapterQualityRollup）、`lib/chapter-quality-rollup-server.ts:24-27`（buildChapterQualityRollup · type ChapterQualityRollup）。
3. **两处冻结 KEEP**：HeYeSession:88 cursor · StudySession:106 order——零触碰（两文件 git diff 为空）；不 gut、不 eslint-disable 捂 SSE。
4. **抽出件无 fs / 无 process.env / 无 `"use client"` / 无 Date / 无网络 / 无 LLM**；兄弟件仅相对 `.ts` import；**`chapter-quality-rollup-server.ts`（90 行）与孪生 `scripts/chapter-quality-check.mjs`（245 行）零 diff 零触**——本刀 web 纯函数层 only，算法体不变 → 孪生仍同真。
5. **只读铁律**：无任何新增写路径；永不 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk pages[]·chapters[] / LiteLLM·Auto·BYOK·云墙；data/qa 报告非真源口径零改。
6. **抽出 ≠ densify**：函数体逐段一致；不新增 CTA、不改 cockpit 诚实句、不改 UI、不改第四书架徽列（cockpit 消费者零 diff）。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；纯函数 lib 无 effect / setState。
8. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动（纯 lib）。
9. 不 redo T63 语义；不拆 EntityCardDetail / ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit UI / AtomDraftEditor / atom-draft* / clew-suggest* / clew-answer-audit* / cite-ocr-quality* 当主题；不碰 T73–T86 extracts、T74/T77 entities memo。
10. J 必记：before 288 → after barrel ≤80（目标 ≤50）；抽出件 ≥3（三件）；消费者路径零改；Cockpit / server / .mjs / UI 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；qa-check -- ch01 绿；cite/parse/page/density/chapter-quality-check（= qa-check 同一脚本）/clew-check/seed-apply-check（夹具）绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip chapter-quality-rollup.ts 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 1–24 | 铁合同 header（consume-only 五条 + 孪生声明） | **留** `chapter-quality-rollup.ts`（barrel；原文零改） |
| 26–29 | 4 个跨 lib type-only import | 按各段实际使用分入 types（CiteQuality · ParseCoverage）与 build（CiteQuality · ParseCoverage · ExtractPageCoverage · ExtractPageDensity），`@/lib/…` 别名保持 |
| 31–99 | ROLLUP_MISS_CARD_SAMPLE · ROLLUP_PAGE_SAMPLE · RollupCite · RollupParse · RollupDark · RollupShallow · RollupDraft · ChapterQualityRollup | `chapter-quality-rollup-types.ts`（81 行；DAG 根，0 兄弟 import） |
| 101–176 | uniqueCardIds（仍私有）· buildChapterQualityRollup | `chapter-quality-rollup-build.ts`（96 行；import ← types） |
| 178–288 | RollupWeakFlags · rollupWeakFlags · rollupIsWeak · rollupAllUnchecked · RollupFold · foldChapterRollups · rollupCliCommands | `chapter-quality-rollup-helpers.ts`（123 行；import ← types） |
| — | 新增 | barrel：24 行铁合同原文（:1–24 零改）+ 16 行 T87 注（三件地图 + `.ts` 相对路径约束 + server/孪生零触声明）+ 3 行 `export *` |

私有符号（uniqueCardIds）在新家仍私有，不经 barrel 外泄。

## OUT（本刀 + forever）

不 push · 不改六分列口径 / null=未检语义 / citeMiss 去重上限 / samplePages slice 上限 / fold 按合计重算率口径 / draft 不计弱 / 未检不抬假阳 / CLI 只读命令集 · 不拆改 `chapter-quality-rollup-server.ts` · 不拆改孪生 `scripts/chapter-quality-check.mjs` · 不加 fs / process.env / "use client" / Date / 网络 / LLM · 不 densify · 不写 seed · 不造掌握% / Due / 单一健康分 / 健康圆环 / 第四书架徽列 · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 EntityCardDetail / ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit UI / AtomDraftEditor / atom-draft* / clew-suggest* / clew-answer-audit* / cite-ocr-quality* 当主题 · 不改任何消费者 import 为深路径 · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM / Auto / BYOK / 云墙 / 批量重抽 / 钥入仓 / Next 升级 · 不发明或改名既有 storage keys。

## DEFER（后续刀）

EntityCardDetail（552；tip 复测仍仅 citeStats / firstPagedCitePage 薄 helpers ~35 LOC，未出现 ≥3 清晰机械 extract 缝）· ClewPane 编排器再拆（禁作主题）· DocumentPane 再 densify（禁）· ChapterPageReader 再拆（禁）· HeYe/Study 主流程再拆（禁）· DraftInbox / Cockpit UI / AtomDraftEditor / atom-draft* / clew-suggest* / clew-answer-audit* / cite-ocr-quality* 再拆（禁 · T80–T86 刚闭）· server 再拆（90 行已薄）· CitePeek / ClewChangesPanel / Sidebar（缝弱）· route 再拆（禁）· 孪生 .mjs 策略（非本刀）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip f8406f3） | after（写手树） | 验收复核 |
|---|---|---|---|
| `lib/chapter-quality-rollup.ts` 行数 | **288** | **44**（barrel；≤80 达标，目标 ≤50 亦达成：24 行铁合同原文 + 16 行 T87 注 + 3 行 re-export + 界空行） | ___ |
| 抽出件（≥3） | — | **3**：types 81 · build 96 · helpers 123（合计 300 = 288 − 24 header − 4 原跨 lib import + 三件头注 / 跨文件 import） | ___ |
| 代码行守恒（逐段只读 diff vs `git show f8406f3`） | — | barrel :1–24 ≡ :1–24；types 体 ≡ :31–99；build 体 ≡ :101–176；helpers 体 ≡ :178–288——**逐字节 IDENTICAL · 零声明级改动**（私有 uniqueCardIds 仍私有） | ___ |
| `@/lib/chapter-quality-rollup` named exports | 16（8 值 + 8 类型） | **16 全守恒**（零新增零删减零改名） | ___ |
| 消费者入口 | desk/page 1 名（type-only）· Cockpit 4 名 · CockpitRow 2 名 · rollup-server 2 名 | **零改**（全仓 tracked 修改仅 barrel 一件 + 3 新抽出件；components/ · app/ · scripts/ 零 diff） | ___ |
| Cockpit / CockpitRow / desk page / UI diff | — | **零 diff** | ___ |
| `chapter-quality-rollup-server.ts` / 孪生 `scripts/chapter-quality-check.mjs` | 90 / 245 | **零 diff**（算法体不变 → keep-in-sync 仍同真） | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（diff 为空；lint 仍精确报 HeYeSession.tsx:88:9 setIndex / StudySession.tsx:106:5 setOrder） | ___ |
| tsconfig | （T83 含 allowImportingTsExtensions） | **零改** | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:88:9 + StudySession.tsx:106:5）；chapter-quality-rollup* 零提及 | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级；16 路由齐） | ___ |
| cite-check（ch01 行） | 卡 40 · 原子 57 · 有页 cite 195 · OCR未见 0（0.0%） | **同值绿**（exit 0；与 T86 记录逐字同——算法未动的旁证） | ___ |
| parse-check · page-check · density-check | 绿 | **绿**（6 章全过：parse 覆盖 100.0% ×6 · page / density 各 6 章无新增异常） | ___ |
| qa-check -- ch01（= chapter-quality-check 同一脚本） | 绿 | **绿**（ch01 诚实行与 before 逐字同：cite未见 0/195（0.0%）· 零原子卡 0 · parse 空0·稀1·覆盖100.0% · 暗 4（23.5%）· 浅 3（17.6%）· 不完备 0 · 草稿 —（本机）· weak）；全章 6 行齐 | ___ |
| clew-check | 69/69 | **69/69**（pass 69 · fail 0） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：missing-card 1 / would-change 0 / invalid 0（exit 0；报告落 data/qa 未跟踪面，非真源；data/cards · chapters · config 零脏） | ___ |
| 未碰复核（HeYe / Study / Cockpit / CockpitRow / server / 孪生 .mjs） | 606/460/151(Cockpit T81 后)/—/90/245 行 | **零触碰** | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-87/lint-baseline.md`（tip f8406f3 · pnpm --filter web lint · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 cursor + StudySession:106 order，KEEP）；Mac 侧写手开工前实跑复核同值（Mac 无 /workspace 目录，以任务书内锚数字 + 实跑双证）。
