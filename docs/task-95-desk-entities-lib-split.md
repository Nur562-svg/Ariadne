# Task 95 — desk-entities-lib-split-01

**Slug**: `desk-entities-lib-split-01`
**Title**: entities.ts 诚实 MEGA lib split · 586 行（wc -l；物理 587，末行无换行）服务端数据层按五条既有分区缝机械抽成 `entities-types`（10 型 · 零 import · 无 fs）+ `entities-io`（repoRoot / T74 进程内指纹门控 memo / entitiesCacheStats / clearEntitiesCache）+ `entities-loaders`（9 loader + 私有 isUsableCard）+ `entities-query`（3 型 + cardsCitingPage / collectStudyAtoms）+ `entities-materials`（T77 物料读 / fingerprintFile / snapshotArtifactBaseline / deriveMaterialStage 状态机），barrel 收口 **37 行**（≤100 达标，目标 ≤70 亦达成）；`@/lib/entities` 全量 named re-export（`export * from "./….ts"` 带扩展名）守恒；**48 文件 / 49 import 行消费者零改路径**；UI / HeYeSession / StudySession / ClewPane\* / DocumentPane / EntityCardDetail / 已闭 T80–T94 barrel 零 diff；两处会话冻结（HeYeSession:88 · StudySession:106）零触碰
**Tip**: `e40da34`（docs T94 desk-clewpane-chat-split-01）atop `609a238`（feat T94）atop `29ac5b2`（T93 docs）
**体量**: 诚实 MEGA · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T88–T93 连切六刀 ~100–160 行薄 lib mid-split 后用户明令「prefer honest LARGER knives」，T94 已切 ClewPane chat；本刀挑剩余最大的 lib——`apps/web/lib/entities.ts`（tip e40da34：586 行，全库 48 文件 / 49 行消费 `from "@/lib/entities"`，从未拆过）按任务书点名的五条既有分区缝机械抽出五件 + barrel：**types**（tip :9–99 十型：Cite / Atom / EntityCard / PageDoc / ChapterDoc / ChapterConfig / BookConfig / ArtifactFingerprint / Material / MaterialStage）→ `entities-types.ts` 100 行（DAG 根，零 import）；**io-cache**（:101–181 repoRoot · 私有 readJson · T74 指纹 memo 合同注 · JsonMemoEntry / jsonMemo（私）· entitiesCacheStats · clearEntitiesCache · 私有 deepFreeze · 私有 statFingerprint · readJsonMemoized）→ `entities-io.ts` 96 行；**loaders**（:183–326 loadChapters / loadBooks / 私有 isUsableCard / loadCards / loadCard / loadCardDocMeta / loadChapterPages / loadAllChapterPages / findPageByPrinted / loadBookValidPages）→ `entities-loaders.ts` 159 行；**query**（:328–465 StudyAtom / PageCiteHit / PageCitingCard / cardsCitingPage / collectStudyAtoms）→ `entities-query.ts` 151 行；**materials**（:467–587 loadMaterials / chapterHasBlocks / chapterHasCards / fingerprintFile / snapshotArtifactBaseline / 私有 fingerprintsDiffer / 私有 materialOwnsArtifact / materialChapterHasBlocks / materialChapterHasCards / deriveMaterialStage）→ `entities-materials.ts` 139 行。barrel `entities.ts` 只留铁合同 header（「换掉 loadCards/loadPage 即可，页面不动」）+ T95 块注 + 5 条 `export * from "./entities-*.ts"` = **37 行**。写手以 `diff <(git show HEAD:apps/web/lib/entities.ts | sed -n 'A,Bp') <(抽出件正文)` 实证：**五段正文 575 行 100% 逐字守恒**——types / loaders / query / materials 四件 **exit 0**，io 件**唯一差异 1 行**（`readJsonMemoized` 加 `export` 关键字，本刀唯一可见性变更，供 loaders / materials 跨文件 import；签名 / 语义 / 函数体零改）。净增 95 行 = 五件头注（house style，同 T92/T93）+ 13 行跨文件 import + 27 行 barrel T95 块注，正文零增——**非 densify、无 fake pad**。

DAG 实测（无环）：`entities-types`（0 import）← `entities-io`（仅 node:fs / node:path，零 sibling）← `entities-loaders`（← types type-only + io 值引）；`entities-query`（← types type-only + loaders 值引；无 fs / path / 不直引 io）与 `entities-materials`（← types type-only + io + loaders(loadBooks)）并列。私有 helper 各留所属模块不经 barrel 外泄：readJson / JsonMemoEntry / jsonMemo / deepFreeze / statFingerprint 留 io；isUsableCard 留 loaders；fingerprintsDiffer / materialOwnsArtifact 留 materials。五件 + barrel 均无 `"use client"` / `"server-only"` 指令（tip 无，保持无）；相对 import 全带 `.ts` 扩展名（同 T83–T94，tsconfig `allowImportingTsExtensions` 已开，零改）。

## 铁合同（硬 · 铁 · 与任务书逐条对齐）

1. **机械抽出 only**：只搬既有五分区；deriveMaterialStage 磁盘事实推导状态机、T74 指纹 memo 口径（`${floor(mtimeMs)}:${size}` · null 永不命中 · 无 TTL / 无 revalidate · deepFreeze 只读）、clearEntitiesCache 清 Map+计数合同、T77 同 jsonMemo 键空间跨通道命中——**逐字一致**（五段 `diff` vs `git show e40da34` 见抽出映射）。无 TTL-only / 无指纹 cache、无状态机改写、无 force-dynamic 丢失、无 generateStaticParams 复活。
2. **Public API 守恒**：`@/lib/entities` barrel 五条 `export * from "./….ts"`（带 `.ts` 扩展名）；类型导出 tip 13 = after 13（diff 空）；值导出 tip 22 = after 22 + **1 additive**（readJsonMemoized，跨文件所需私有升 export）；消费者 import 路径零改、禁 deep-import（实测 0）。（注：Node 26 裸跑 `.ts` 的 `Object.keys` 多出合成键 `module.exports`——源码 grep 计数 0、apps/web/package.json 无 `"type"` 字段所致的 CJS-interop 探测产物，SWC / Turbopack 不受影响；T77 夹具消费的 6 个真实符号全部在位。）
3. **两处冻结 KEEP**：HeYeSession:88 setIndex · StudySession:106 setOrder——零触碰（git 全仓 tracked 改动仅 `apps/web/lib/entities.ts` 一件；lint 仍精确报这两处）；无 gut、无 eslint-disable（六件 grep 计数 0）、不关 SSE 规则装绿。
4. **types 无 fs**（0 import）；io 持 memo Map + clearEntitiesCache；loaders / query / materials 按单向 DAG，抽出件仅相对 `.ts` import——全实测见上。
5. **Clew / seed 只读铁律**：本刀纯搬文件、无任何新写路径；永不 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk pages[]·chapters[] / LiteLLM·Auto·BYOK·云墙；钥永不入仓 / 永不 NEXT_PUBLIC_\*。
6. **抽出 ≠ densify**：函数体与 tip 逐段一致（仅跨文件 import + 1 个 export 关键字）；不新增 CTA、不改 UI、不改书架徽列；正文零净增。
7. **不 quiet-disable**：lint 输出 before/after **全文逐字相同**（diff 空），未动任何规则配置。
8. **美学**：本刀纯 lib 无产品视觉改动（`docs/frontend-aesthetics.md` 先读；UI 零 diff 自动满足）。
9. **不 redo**：Clew T66–T70 语义 / DocumentPane / ClewPane further（222 无新缝）/ ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit UI / AtomDraftEditor / EntityCardDetail（DEFER）/ CitePeek / ClewChangesPanel / Sidebar / clew-pane-helpers（T75 BAN）/ 已闭 T80–T94 extracts——零触碰。
10. **J 必记**：before 586 → after barrel **37**；抽出件 **5**（100 / 96 / 159 / 151 / 139）；消费者路径零改（48 文件 / 49 行）；UI 零 diff；lint 护栏 before = after（2 problems / 2e / 0w / SSE 2，冻结仍在）；tsc 0；build PASS；既有夹具不红（T77 memo / stage 夹具直跑新 barrel EXIT=0；根 qa / cite / parse / page / density / clew-check 全 EXIT=0）。

## 抽出映射（源缝 → 目标文件 · 写手 diff 实证）

| 源（tip entities.ts 行段 @ e40da34） | 内容 | 目标（同目录新文件） | wc -l | diff vs tip |
|---|---|---|---|---|
| :1–2（删）· :4–7（留） | `import fs/path`（barrel 无逻辑，删）；铁合同 header | **barrel** `entities.ts`（+ T95 块注 + 5 条 `export *`） | **37** | header 原文保留 |
| :9–99 | Cite · Atom · EntityCard · PageDoc · ChapterDoc · ChapterConfig · BookConfig · ArtifactFingerprint · Material · MaterialStage | `entities-types.ts` | 100 | **exit 0**（逐字一致） |
| :101–181 | repoRoot · 私有 readJson · T74 memo 合同注 · 私有 JsonMemoEntry/jsonMemo · entitiesCacheStats · clearEntitiesCache · 私有 deepFreeze · 私有 statFingerprint · readJsonMemoized | `entities-io.ts` | 96 | **仅 1 行**：`function readJsonMemoized<` → `export function readJsonMemoized<`（唯一可见性变更） |
| :183–326 | loadChapters · loadBooks · 私有 isUsableCard · loadCards · loadCard · loadCardDocMeta · loadChapterPages · loadAllChapterPages · findPageByPrinted · loadBookValidPages | `entities-loaders.ts` | 159 | **exit 0** |
| :328–465 | StudyAtom · PageCiteHit · PageCitingCard · cardsCitingPage · collectStudyAtoms | `entities-query.ts` | 151 | **exit 0** |
| :467–587 | `// ---- ingest ----` · loadMaterials · chapterHasBlocks · chapterHasCards · fingerprintFile · snapshotArtifactBaseline · 私有 fingerprintsDiffer · 私有 materialOwnsArtifact · materialChapterHasBlocks · materialChapterHasCards · deriveMaterialStage | `entities-materials.ts` | 139 | **exit 0**（末行 tip 无换行，抽出件规范化补换行） |

五段之外 tip 只剩 :1–2（barrel 已删的 fs/path import）、:4–7 header（留 barrel）、:100/:182/:327/:466 空行——**覆盖 100%**。行数守恒：正文 575 行逐字；非正文 12 → 107（barrel 37 + 五件头注/import 70），物理 587 → 682。

## Public surface（供验收对照）

- **类型（13，tip = after，diff 空）**：Cite · Atom · EntityCard · PageDoc · ChapterDoc · ChapterConfig · BookConfig · ArtifactFingerprint · Material · MaterialStage · StudyAtom · PageCiteHit · PageCitingCard
- **值（22，tip = after 全在位）**：repoRoot · entitiesCacheStats · clearEntitiesCache · loadChapters · loadBooks · loadCards · loadCard · loadCardDocMeta · loadChapterPages · loadAllChapterPages · findPageByPrinted · loadBookValidPages · cardsCitingPage · collectStudyAtoms · loadMaterials · chapterHasBlocks · chapterHasCards · fingerprintFile · snapshotArtifactBaseline · materialChapterHasBlocks · materialChapterHasCards · deriveMaterialStage
- **+1 additive**：readJsonMemoized（io 件私有升 named export；经 barrel `export *` 可达但不是页面消费面——48 消费者零使用，loaders / materials 已封装读路径）

## OUT（本刀 + forever）

不 push · 不改消费者 `@/lib/entities` 路径（禁 deep-import）· 不 densify（空池 CTA / return / OCR 诚实句 / 补救面板 / cockpit UI / EntityCardDetail / ClewPane further）· 不 gut 冻结 / 不 eslint-disable 捂 SSE · 不改 deriveMaterialStage / memo 指纹口径 / clearEntitiesCache · 不丢 force-dynamic · 不复活 generateStaticParams · 不做 TTL-only 无指纹 cache · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / 批量重抽 / 用试钥 parse·extract·ingest / 钥入仓 / NEXT_PUBLIC_\* / LiteLLM 网关 / Auto 路由 / BYOK / Mentrix 式云额度墙 / Next 升级 · 不接客户端 pages[]·chapters[] 作业形 · 不拆 EntityCardDetail / CitePeek / ClewChangesPanel / Sidebar / ClewPane further / HeYe·Study 主流程 / DocumentPane / ChapterPageReader / clew-pane-helpers / 已闭 T80–T94 extracts · 不发明或改名既有 storage keys · 不重做 T46–T94 · 不交 ~100–160 薄 lib scrap 当主题。

## DEFER（后续刀）

EntityCardDetail（552；tip 复测仍仅 citeStats(17–43) / firstPagedCitePage(46–51) 两薄 helpers，fields / atoms / OCR 补救 / 草稿条 JSX 缝稠——< 3 清晰机械 extract 缝）· ClewPane further（222 编排器无 ≥3 NEW 命名机械缝，再切 = densify）· CitePeek（361）· ClewChangesPanel（319）· Sidebar（302）再拆（缝弱）· heye.ts（162 单大函数）· return-stack（85 过薄）· session-continuity（薄）· 薄 return-stack / session-continuity 不接 · 已闭 T80–T94 extracts 再拆（禁）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· 掌握% / 健康分圆环 / 第四书架徽列（不接）。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip e40da34） | after（写手树） | 验收复核 |
|---|---|---|---|
| `entities.ts` 行数 | **586**（wc -l；物理 587，末行无换行） | **37**（barrel；≤100 达标，目标 ≤70 亦达成） | ___ |
| 抽出件（≥4） | — | **5**：types 100 · io 96 · loaders 159 · query 151 · materials 139（六件合计 682；净增 95 = 头注 + import + barrel 块注，正文零增） | ___ |
| 正文逐字守恒（diff vs `git show e40da34`） | — | types / loaders / query / materials **exit 0**；io **仅 1 行** export 关键字；五段覆盖 tip 100%（段外仅 import/header/空行） | ___ |
| 类型导出 | 13 | **13**（diff 空） | ___ |
| 值导出 | 22 | **22 + 1 additive**（readJsonMemoized） | ___ |
| 消费者 `from "@/lib/entities"` | 48 文件 / 49 行 | **48 文件 / 49 行零改**（排除 barrel 头注字样；naive grep 多 1 文件 = barrel 注释含 `from "@/lib/entities"` 字样，house style 同 T92/T93） | ___ |
| deep-import `entities-*` | 0 | **0**（apps/ 全扫） | ___ |
| DAG | 单文件 | types(0 import) ← io(fs/path) ← loaders(types+io) ← query(types+loaders) ∥ materials(types+io+loaders)——**无环** | ___ |
| UI / HeYeSession / StudySession / ClewPane\* / DocumentPane / EntityCardDetail / 已闭 barrel diff | — | **零 diff**（git tracked 改动仅 `apps/web/lib/entities.ts` 一件：32 insertions / 582 deletions；+ 5 新 untracked 件） | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（:88 setIndex / :106 setOrder 原位；lint 仍精确报 HeYeSession.tsx:88:9 / StudySession.tsx:106:5） | ___ |
| eslint-disable / 新指令 | 0 / 无 | **0 / 无**（六件 grep 计数 0；无 "use client" / "server-only"） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | **全文逐字相同**（diff 空；2 / 2e / 0w / SSE 2 = HeYe:88 + Study:106） | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 16.4.0 Turbopack；Compiled successfully；15 路由表完整；entities 消费页仍全 ƒ Dynamic——force-dynamic 未丢；EXIT=0） | ___ |
| T77 夹具直跑新 barrel（Node v24 strip-types） | （对 old 编译跑） | **memo-fixture EXIT=0**（五断言组过；hits/misses 轨迹 0/0→1/1→2/2→2/3→0/1——T74 指纹 memo / 跨通道键空间 / 改写 miss / clear 清零全守恒）· **stage-fixture EXIT=0**（uploaded / parsed / extracted / ready / failed 五态全对） | ___ |
| 根夹具 | — | qa-check · cite-check · parse-check · page-check · density-check · clew-check **全 EXIT=0**；seed-apply-check EXIT=1 = 自身空 stdin fail-closed 守卫（scripts/seed-apply-check.mjs:107；不 import entities）——非本刀回归 | ___ |
| tsconfig | — | **零改** | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-95/lint-baseline.md`（tip e40da34 · pnpm --filter web lint · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 setIndex + StudySession:106 setOrder，KEEP）；Mac 侧写手改前 / 改后双实跑输出 **全文 diff 空**（Mac 无 /workspace 目录，以任务书锚数字 + 实跑双证）。写手侧 Mimosa 护栏拒绝 Bash heredoc 直写源码——五件 + barrel 经 Write 工具提交，正文逐字性由上表 diff 列实证。
