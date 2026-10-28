# Task 86 — desk-cite-ocr-quality-lib-split-01

**Slug**: `desk-cite-ocr-quality-lib-split-01`
**Title**: cite-ocr-quality.ts 诚实 mid-split · 351 行单文件按既有 export 组机械抽成 `cite-ocr-quality-match` + `cite-ocr-quality-neighborhood` + `cite-ocr-quality-score`，主文件收口为 barrel（铁合同 header 留此）；`@/lib/cite-ocr-quality` 全部 14 个既有 named exports 守恒；7 个消费者（EntityCardDetail / HeYeSession / DocumentCardTile / desk·ingest page / chapter-quality-rollup*）入口零改；孪生 scripts/lib/cite-ocr-quality.mjs 零触；UI 零 diff；两处会话冻结零触碰
**Tip**: `fecfe93`（docs T85 desk-clew-answer-audit-lib-split-01）atop `e474742`（feat T85）atop `48bf085`（T84 docs）
**体量**: mid · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T85 收掉 clew-answer-audit lib 后，`apps/web/lib/cite-ocr-quality.ts`（T54/T55 cite↔OCR 机检质量纯函数）仍是 351 行单文件，含三段**清晰 export 组边界**：match（:13–95）· neighborhood（:97–248）· score（:250–351）。本刀按任务书推荐拆三件 + barrel：**match**（CiteLike / QualityCardLike / normalizeText / bigramCoverage / quoteInOcr / citeOcrMiss / enumerateCardCites，DAG 根、无 import）← **neighborhood**（CiteQuality / emptyQuality / OcrNeighborhood / normalizeWithMap（私）/ ocrNeighborhood / suggestQuoteFromOcr；自 match import normalizeText）← **score**（scoreCard / scoreChapter / cardCiteMisses；自 match import enumerateCardCites·normalizeText·quoteInOcr·bigramCoverage·QualityCardLike，自 neighborhood import emptyQuality·ocrNeighborhood·suggestQuoteFromOcr·CiteQuality）。函数体与 tip 逐段一致（写手以只读 diff 逐段实证：四段对照三段 IDENTICAL，唯一差异 = `function emptyQuality` → `export function emptyQuality`）；7 个消费者仍 `from "@/lib/cite-ocr-quality"` 零改路径；孪生 `scripts/lib/cite-ocr-quality.mjs` 算法体不变（keep-in-sync 合同仍同真，cite-ocr-check.mjs / extract_cards.mjs 走孪生不直载 .ts）；HeYeSession:88 / StudySession:106 零触碰。

**结构性事实（写给下一位读者）——一处声明级迁位（保 DAG「neighborhood ← score」不复制分叉，有依赖实证）**：

`emptyQuality`（原 :123–136，neighborhood 区私有零值构造）被 **score** 的 `scoreCard`（:255）与 `scoreChapter`（:290）**双用**；按任务书 E.2 两选项取「留 neighborhood 加 `export`」（与 A.2 DAG 字面「neighborhood ← score（…emptyQuality…）」一致）：零值构造与 CiteQuality 形状同件，score 经相对 `.ts` import 取用，不复制分叉。这是全刀唯一声明行改动（`function` → `export function`；T84/T85 `isPrintedPage` 同款）。`normalizeWithMap` 仍私有（ocrNeighborhood 唯一调用）；match 13 原有符号、score 3 原有符号声明零改。

三件 DAG 实测：match 0 import；neighborhood 1（← match）；score 2（← match、← neighborhood）；barrel 3 × `export * from "./….ts"`。同 T83–T85：`.ts` 扩展名相对路径是 Node 直载与 tsc 双解的唯一形式（tsconfig `allowImportingTsExtensions` 已开，本刀零 tsconfig 改动）。

## 铁合同（硬 · 铁 · 与任务书逐条对齐）

1. **机械抽出 only**：只搬既有 export 组；铁合同 header（:1–11，含只读 / OCR≠verified 分列 / 孪生 keep-in-sync 三段声明）原文留 barrel；bigram thr 默认 **0.6** 零改（quoteInOcr 与 cardCiteMisses 两处 `thr = 0.6`）；缺文本未检不抬假阳（pageText == null → true / pageTextByPage[c.page] == null → skip）零改；空引文 vacuous 命中零改；incompleteAtoms 与 zeroAtomCards 互斥不双计零改；missRate 按合计重算零改；snippet·suggest ≤120 零改。写手实证：barrel :1–11 ≡ tip :1–11；match 体 ≡ :13–95；neighborhood 体 ≡ :97–248；score 体 ≡ :250–351——**逐字节 IDENTICAL**。
2. **公共 API 守恒**：14 个既有 named exports（10 值 + 4 类型）全部仍可自 `@/lib/cite-ocr-quality` 导入（barrel `export * from "./….ts"` ×3；Node 直载 barrel 运行时导出 11 = 10 值 + emptyQuality）；新增 `emptyQuality` 一个 export（只加不减）。消费者入口零改：`app/(desk)/page.tsx:12`（scoreChapter + type CiteQuality）、`app/(shell)/ingest/page.tsx:16-20`（cardCiteMisses · scoreChapter · type CiteQuality）、`components/EntityCardDetail.tsx:10`（citeOcrMiss · cardCiteMisses · enumerateCardCites · quoteInOcr）、`components/HeYeSession.tsx:25`（ocrNeighborhood · quoteInOcr）、`components/desk/DocumentCardTile.tsx:7`（citeOcrMiss）、`lib/chapter-quality-rollup-server.ts:19`（cardCiteMisses · scoreChapter）、`lib/chapter-quality-rollup.ts:26`（type CiteQuality，type-only）。
3. **两处冻结 KEEP**：HeYeSession:88 cursor · StudySession:106 order——零触碰（两文件 git diff 为空）；不 gut、不 eslint-disable 捂 SSE（四件 cite-ocr-quality*.ts eslint-disable 0）。
4. **抽出件无 fs / 无 process.env / 无 `"use client"` / 无 Date / 无网络 / 无 LLM**（grep 实证零命中）；内部仅相对 `.ts` import；**孪生 `scripts/lib/cite-ocr-quality.mjs`（241 行）零 diff 零触**——算法体逐字未变，keep-in-sync 合同仍同真（本刀 web-only）。
5. **只读铁律**：无任何新增写路径；「OCR 未见」与 seed 抽查 verified **分列**的口径零改；suggestQuote 仍是「人核候选建议」，绝不自动写回 entities / verified；永不 seed-apply --write/--apply / bulk / LiteLLM·Auto·BYOK·云墙。
6. **抽出 ≠ densify**：函数体逐段一致；不新增 CTA、不改空表诚实句、不改 UI、不改 ingest 补救面板、不改 EntityCardDetail OCR 诚实句（消费者零 diff）。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；纯函数 lib 无 effect / setState。
8. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动（纯 lib）。
9. 不 redo T54/T55 语义；不拆 EntityCardDetail / ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit / AtomDraftEditor / atom-draft* / clew-suggest* / clew-answer-audit* 当主题；不碰 T73–T85 extracts、T74/T77 entities memo。
10. J 必记：before 351 → after barrel ≤80（目标 ≤50）；抽出件 ≥3（三件）；消费者路径零改；UI/EntityCardDetail/HeYe/ingest/desk/.mjs 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；cite-check -- ch01 绿；parse/page/density/qa（ch01 与全章）/chapter-quality-check（= qa-check 同一脚本）/clew-check/seed-apply-check（夹具）绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip cite-ocr-quality.ts 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 1–11 | 铁合同 header（只读 / OCR≠verified 分列 / 孪生 keep-in-sync） | **留** `cite-ocr-quality.ts`（barrel；原文零改） |
| 13–95 | CiteLike · QualityCardLike · normalizeText · bigramCoverage · quoteInOcr · citeOcrMiss · enumerateCardCites | `cite-ocr-quality-match.ts`（92 行；**无 import**，DAG 根） |
| 97–248 | CiteQuality · emptyQuality（→ **加 export**，score 双调用点）· OcrNeighborhood · normalizeWithMap（私）· ocrNeighborhood · suggestQuoteFromOcr | `cite-ocr-quality-neighborhood.ts`（165 行；import 1 名 ← match） |
| 250–351 | scoreCard · scoreChapter · cardCiteMisses | `cite-ocr-quality-score.ts`（127 行；import 5 名 ← match + 4 名 ← neighborhood） |
| — | 新增 | barrel：11 行铁合同原文（:1–11 零改）+ 14 行 T86 注（三件地图 + `.ts` 相对路径约束 + 孪生零触声明）+ 3 行 `export *` |

私有符号（normalizeWithMap）在新家仍私有，不经 barrel 外泄。

## OUT（本刀 + forever）

不 push · 不改 bigram thr 0.6 / 缺文本未检口径 / OCR≠verified 分列 / incompleteAtoms·zeroAtomCards 互斥 / missRate 合计口径 · 不拆改孪生 `scripts/lib/cite-ocr-quality.mjs` · 不加 fs / process.env / "use client" / Date / 网络 / LLM · 不 densify · 不写 seed · 不造掌握% / Due / 单一健康分 / 健康圆环 / 第四书架徽列 · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 EntityCardDetail / ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit / AtomDraftEditor / atom-draft* / clew-suggest* / clew-answer-audit* 当主题 · 不改任何消费者 import 为深路径 · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM / Auto / BYOK / 云墙 / 批量重抽 / 钥入仓 / Next 升级 · 不发明或改名既有 storage keys。

## DEFER（后续刀）

EntityCardDetail（552；tip 复测仍仅 citeStats / firstPagedCitePage 薄 helpers ~35 LOC，未出现 ≥3 清晰机械 extract 缝）· ClewPane 编排器再拆（禁作主题）· DocumentPane 再 densify（禁）· ChapterPageReader 再拆（禁）· HeYe/Study 主流程再拆（禁）· DraftInbox / Cockpit / AtomDraftEditor / atom-draft* / clew-suggest* / clew-answer-audit* 再拆（禁 · T80–T85 刚闭）· chapter-quality-rollup 再拆（体量偏小）· route 再拆（禁）· 孪生 .mjs 策略（非本刀）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip fecfe93） | after（写手树） | 验收复核 |
|---|---|---|---|
| `lib/cite-ocr-quality.ts` 行数 | **351** | **29**（barrel；≤80 达标，目标 ≤50 亦达成：11 行铁合同原文 + 14 行 T86 注 + 3 行 re-export + 界空行） | ___ |
| 抽出件（≥3） | — | **3**：match 92 · neighborhood 165 · score 127（合计 384 = 351 − 11 header + 三件头注 / 跨文件 import / export 前缀） | ___ |
| 代码行守恒（逐段只读 diff vs `git show HEAD`） | — | barrel :1–11 ≡ :1–11；match 体 ≡ :13–95；neighborhood 体 ≡ :97–248；score 体 ≡ :250–351——**逐字节 IDENTICAL**；唯一声明差异 `function emptyQuality` → `export function emptyQuality` | ___ |
| `@/lib/cite-ocr-quality` named exports | 14（10 值 + 4 类型） | **14 全守恒** + 新增 `emptyQuality`（只加不减）；Node 直载 barrel 运行时导出 11 = 10 值 + emptyQuality | ___ |
| 消费者入口 | desk/page 2 名 · ingest/page 3 名 · EntityCardDetail 4 名 · HeYeSession 2 名 · DocumentCardTile 1 名 · rollup-server 2 名 · rollup 1 名（type-only） | **零改**（全仓 tracked 修改仅 barrel 一件 + 3 新抽出件；components/ · app/ · scripts/ 零 diff） | ___ |
| UI / EntityCardDetail / HeYe / ingest / desk diff | — | **零 diff** | ___ |
| 孪生 `scripts/lib/cite-ocr-quality.mjs` | 241 | **零 diff**（算法体不变 → keep-in-sync 仍同真；cite-ocr-check.mjs / extract_cards.mjs 走孪生不直载 .ts） | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（diff 为空；lint 仍精确报 :88 setIndex / :106 setOrder） | ___ |
| tsconfig | （T83 含 allowImportingTsExtensions） | **零改** | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession + StudySession 各一）；cite-ocr-quality* 零提及 | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级；Compiled successfully · TypeScript finished） | ___ |
| cite-check -- ch01 | 卡 40 · 原子 57 · 有页 cite 195 · OCR未见 0（0.0%） | **同值绿**（exit 0；经孪生 .mjs——本刀零触，数字不变为孪生同真的旁证） | ___ |
| parse-check · page-check · density-check | 绿 | **绿**（6 章全过：parse 覆盖 100.0% ×6 · page / density 各 6 章无新增异常） | ___ |
| qa-check -- ch01 · qa-check 全章（= chapter-quality-check 同一脚本） | 绿 | **绿**（ch01 诚实行与 before 逐字同：暗 4（23.5%）· 浅 3（17.6%）· 不完备 0 ·「草稿 —（本机）」口径不变；全章 6 行齐） | ___ |
| clew-check | 69/69 | **69/69**（pass 69 · fail 0） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 / missing 0 / invalid 0（报告 gitignored；data/cards · chapters · config 零脏） | ___ |
| 未碰复核（HeYe / Study / EntityCardDetail / ClewPane / DocumentPane / ChapterPageReader / 孪生 .mjs） | 606/460/552/930/649/353/241 行 | **零触碰** | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-86/lint-baseline.md`（tip fecfe93 · pnpm --filter web lint · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 cursor + StudySession:106 order，KEEP）；Mac 侧写手开工前实跑复核同值。
