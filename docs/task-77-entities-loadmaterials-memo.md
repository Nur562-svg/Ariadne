# Task 77 — entities-loadmaterials-memo-01

**Slug**: `entities-loadmaterials-memo-01`
**Title**: loadMaterials / chapterHasBlocks / chapterHasCards 补齐 T74 指纹 memo —— 物料读路径三入口一行接线，同请求双通道命中可证
**Tip**: `9fdce29`（docs T76）atop `d3663ca`（feat T76）atop `d417bcf`（T75 docs）atop `c45dd4f`（feat T75）
**体量**: 诚实中刀 · A–J 全交
**定稿**: 2026-10-27 Asia/Shanghai (CST)

## 一句话

T74 把 cards/config/pages 读路径收进指纹门控 memo 后，物料读路径三入口（`loadMaterials` · `chapterHasBlocks` · `chapterHasCards`）仍是 ungated `readJson`——ingest 同一请求里 `materialChapterHas*`（内部走 `chapterHas*`）与 `loadChapterPages` / `loadCards` 对**同一绝对路径文件**各读各的（双通道重复 readFile+JSON.parse）。本刀只做一行接线：三函数改走 `readJsonMemoized`（T74 同一 `jsonMemo` 键空间，无 TTL / 无第二套 cache）；`deriveMaterialStage` / `materialOwnsArtifact` / `fingerprintFile` / `snapshotArtifactBaseline` 语义零改；`force-dynamic` KEEP。

## 铁合同（硬 · 铁）

1. **复用 T74 memo only**：三函数改走 `readJsonMemoized`；禁止另起 TTL / 无指纹 cache / 第二套键空间。
2. **KEEP force-dynamic**：ingest / entities / entities/[id] / desk 数据页不得删；entities/[id] 禁止 `generateStaticParams`（本刀后实测 0 实现）。
3. **不改判定语义**：`deriveMaterialStage` / `materialOwnsArtifact` / `materialChapterHas*` / `fingerprintFile` / `snapshotArtifactBaseline` / `fingerprintsDiffer` 函数体零改（git diff 实证仅三处 `readJson` → `readJsonMemoized` + 指向 memo 的注释）。
4. **目录合同**：`loadMaterials` 的 `data/materials` readdir 每调用现取——增删 `.material.json` 天然可见（memo 只省每文件 readFile+parse，stat/readdir 照付）。
5. **fail-closed**：stat 不可读 → `statFingerprint` null → 必 miss 重读（T74 合同原样）；坏 material 文件缓存 undefined、指纹未变时命中返回 undefined 走同一 skip 分支；不陈旧绿 stage、不假计数。
6. **两处冻结 KEEP**：HeYeSession:218 cursor · StudySession:234 order——不 gut、不 disable；本刀主题不是 lint-zero。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿。
8. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动（纯数据层，UI 零触碰）。
9. 不 redo Clew T66–T70；不拆 DocumentPane / ClewPane / ChapterPageReader / HeYe·Study 当主题；不碰 T73/T75/T76 extracts。
10. J 必记：三函数已 memo；同请求 hits 证据；mtime/size 变更 miss 证据；stage 夹具 old≡new；force-dynamic 仍在；lint 护栏 before 2/2e/0w/SSE2 → after 不劣于且冻结仍在；tsc 0；build PASS；clew-check 绿。

## 接线（before → after）

| 函数 | before（tip 9fdce29） | after |
|---|---|---|
| `loadMaterials(): Material[]` | `readJson<Material>`（ungated，每调用重 parse 全部物料文件） | `readJsonMemoized<Material>`（readdir 仍每调用；坏文件 skip 分支不变） |
| `chapterHasBlocks(chapterId): boolean` | `readJson<ChapterDoc>`（ungated） | `readJsonMemoized<ChapterDoc>`（与 `loadChapterPages` / `loadAllChapterPages` 同路径同键） |
| `chapterHasCards(chapterId): boolean` | `readJson<{cards?}>`（ungated） | `readJsonMemoized<{cards?}>`（与 `loadCards` 逐文件读同路径同键） |

「有正文页」谓词（`pages.some(text.trim().length>0)`）与「`cards?.length`」谓词零改；`Material` 类型与字段推导零改。ingest 同请求双通道：`materials.map` → `materialChapterHasBlocks/Cards`（内部 `chapterHas*`）与章清单循环里的 `loadCards({chapterId})` / `loadChapterPages(c.id)` 现共享同一缓存条目——第二读命中，省的是重复 readFile+JSON.parse。

## OUT（本刀 + forever）

不 push · 不改 deriveMaterialStage / materialOwns* / fingerprintFile / snapshotArtifactBaseline 判定 · 不丢 force-dynamic / 不复活 generateStaticParams · 不另起 TTL 或无指纹 unstable_cache · 不拆 ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 当主题 · 不 gut 冻结 · 不 lint-zero（禁 disable 捂）· 不 densify redo · 不 verified:true / Clew 真写 / seed-apply 可写 / bulk / 批量重抽 / LiteLLM / Auto / BYOK / 云墙 / 钥入仓 / Next 升级。

## DEFER（后续刀）

ClewPane 编排器再拆（禁作主题）· DocumentPane 再 densify（禁）· ChapterPageReader 再拆（禁）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent heye-only · Register 硬门禁 · quiz densify · HeYe/Study 大拆。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 9fdce29） | after（写手树） | 验收复核 |
|---|---|---|---|
| 物料读入口 memo | 0/3（loadMaterials · chapterHasBlocks · chapterHasCards 全 ungated） | **3/3** 走 readJsonMemoized（git diff +9/−3，仅 entities.ts） | ___ |
| 同请求命中（memo 夹具 ②③） | — | loadMaterials 二连读 hits 1/misses 1；跨通道 loadChapterPages→chapterHasBlocks 命中 +1、loadCards→chapterHasCards 命中 +1（ARIADNE_DATA 沙箱，断言全过） | ___ |
| 失效证据（memo 夹具 ④⑤） | — | 改写 material（size 变）→ 下一读 miss + 新 title v2（不回旧 v1）；clearEntitiesCache 后重读 miss 重计 | ___ |
| stage 守恒（stage 夹具 old≡new） | old 编译五态：uploaded/parsed/extracted/ready/failed + owns/has 布尔全表 | **old ≡ new diff 空**（同沙箱磁盘事实；断言全过） | ___ |
| deriveMaterialStage / materialOwns* / fingerprintFile / snapshotArtifactBaseline | — | **函数体零改**（diff 实证） | ___ |
| force-dynamic / generateStaticParams | ingest/entities/entities[id]/desk 在 | **仍在**（ingest 1 · entities 1 · entities/[id] 1+注释 1 · desk 1；generateStaticParams 实现 0） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:218 · StudySession:234 冻结 KEEP 原样在；entities.ts 零新问题；无 disable） | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级） | ___ |
| clew-check | 69/69 | **69/69** | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（cite ch01 卡40·原子57·有页cite195·OCR未见0；parse ch07 覆盖100.0%；page ch07 暗0；density ch07 浅0；qa ch01 不完备0，与 tip 同） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 分列正确（dry-run 报告非真源） | ___ |

夹具（`.acceptance-task77/`，不入库）：`stage-fixture.mjs`（old/new 双编译对跑）· `memo-fixture.mjs`（命中/失效/清缓存）· `old/` `new/` tsc 单文件编译产物；沙箱走 `ARIADNE_DATA` 指向 `.acceptance-task77/fixtures/`，零触碰仓库 data/。

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-77/lint-baseline.md`（tip 9fdce29 · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:218 cursor + StudySession:234 order，KEEP）。
