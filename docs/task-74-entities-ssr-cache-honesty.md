# Task 74 — entities-ssr-cache-honesty-01

**Slug**: `entities-ssr-cache-honesty-01`
**Title**: entities SSR cache honesty · load* 进程内 mtime+size 指纹门控 memo，force-dynamic 原地不动
**Tip**: `c335d0e`（docs T73）atop `36f3758`（feat T73）atop `7a70843`（docs T72）
**体量**: MEGA · A–J 全交
**定稿**: 2026-10-26 Asia/Shanghai (CST)

## 一句话

tip 上 `apps/web/lib/entities.ts` 的 `loadCards` 每次调用都 readdir+readFile+JSON.parse（`loadCard = loadCards().find`，desk/heye/api/entities 各页一天几十次全量重扫），而数据页的正确性策略是 `force-dynamic` 请求时读盘——不是构建期冻结。本刀给读侧加一层**进程内指纹门控 memo**：命中条件只有「stat 指纹（floor(mtimeMs)+size，与 `fingerprintFile` 同口径）未变」，指纹变或 stat 不可读一律 miss 重读；`force-dynamic` 全部原地不动、`generateStaticParams` 维持缺席。零产品视觉改动、调用方零 diff、公共 API 语义守恒。

## 铁合同（硬 · 铁）

1. **force-dynamic KEEP**：`entities/page.tsx` · `entities/[id]/page.tsx` 及既有 desk 数据页的 `export const dynamic = "force-dynamic"` 一字不动；不改 force-static；`entities/[id]` 不复活 `generateStaticParams`（review-fix-integrity F 注释原样）。
2. **指纹门控 only**：memo key = 文件绝对路径；命中 ⇔ 当前指纹非空且与缓存一致（`${floor(mtimeMs)}:${size}`）。新增/删除/改写/touch/坏文件/不可读全部 miss 重读；**无 TTL、无 revalidate 秒数充当新鲜度**。目录（data/cards、data/chapters）文件名集合每调用 readdir 现取——增删文件天然 miss；省的是每文件 readFile+JSON.parse，stat/readdir 元数据照常付。
3. **公共 API 守恒**：`loadCards / loadCard / loadChapters / loadBooks / loadChapterPages / loadAllChapterPages` 签名与返回语义不变——bookId∩chapterId 交集空、坏文件 skip+warn（warn 仍每次调用触发）、`isUsableCard`、页合并去重排序全保留；调用方文件零 diff。
4. **不陈旧绿 / 不假计数**：命中 ≡ 指纹未变时磁盘结果的解析；pending/kind/张数仍由真实卡派生，不硬编码正数，不吞坏卡装满库。缓存文档 deepFreeze——调用方约定只读（已审计全库无就地改动），冻结让任何未来就地改动当场抛错而非静默污染缓存。
5. **两处冻结 KEEP**：HeYeSession:218 cursor · StudySession:234 order——不 gut、不 eslint-disable；本刀主题不是 lint-zero。
6. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿。
7. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动。
8. 不 redo Clew T66–T70；不拆 ClewPane / DocumentPane / T73 extracts；物料归因（`fingerprintFile` / `snapshotArtifactBaseline` / `materialOwnsArtifact` / `deriveMaterialStage`）不走 memo 层、语义不动（memo 的指纹键与之同口径对齐）。
9. 禁 LiteLLM/Auto/BYOK/云墙；禁 verified:true / Clew 真写 / seed-apply 可写 / bulk；钥不入仓 / 不 NEXT_PUBLIC_*。
10. J 必记：force-dynamic 仍在 + generateStaticParams 仍无；同请求二次 loadCards 命中或读盘次数下降；改 cards 文件 mtime/size 后 miss+新数据；lint 护栏 before 2/2e/0w/SSE2 → after 不劣于且冻结仍在；tsc 0；build PASS；clew-check 绿。

## 真源缝（改了什么 · 没改什么）

| 缝 | 处理 |
|---|---|
| `entities.ts` 新增 memo 段（readJson 后）：`jsonMemo` Map · `statFingerprint` · `readJsonMemoized` · `deepFreeze` · `clearEntitiesCache`（夹具/测试钩子）· `entitiesCacheStats`（只读命中/未命中计数） | 唯一实现新增 |
| `loadChapters` / `loadBooks`：`readJson` → `readJsonMemoized`（config/chapter.json · config/books.json） | 一行替换 |
| `loadCards`：`readJson` → `readJsonMemoized`（逐卡文件）；`loadCard` 经由 loadCards 共享同一语料，语义仍 find | 一行替换 |
| `loadCardDocMeta`：同上（读同一批卡文件，保持「同文件单次解析」；tip 上无外部调用方） | 一行替换 |
| `loadChapterPages` / `loadAllChapterPages`：`readJson` → `readJsonMemoized`（blocks 文件）；每调用的 `{...p, chapterId}` spread 与合并排序原样（顶层对象每次新建，不共享可变结构） | 各一行替换 |
| 物料路径（`loadMaterials` · `chapterHasBlocks` · `chapterHasCards` · `snapshotArtifactBaseline` · `materialOwnsArtifact` · `deriveMaterialStage`） | **零 diff**，不进 memo 层 |
| 全部调用方（entities/desk/study/review/ingest/viewer/api/heye/book-pools/coverage/rollup/last-opened 装配层） | **零 diff** |

## OUT（本刀 + forever）

不 push · 不丢/改 force-dynamic · 不复活 generateStaticParams · 不 TTL-only / revalidate 秒数装新鲜 · 不借 cache 改业务计数·门禁·文案·视觉 · 不拆 ClewPane（T73 DocumentPane 五件不再拆）· 不 gut HeYe cursor / Study order 冻结 · 不 eslint-disable 装绿 · 不破坏 T71 三 uSES hook · 不 redo T46–T73 主路径（五禁 / bulk 422 / streamText NDJSON / 补丁白名单 / PatchPasteBlock / 显式 fillDrafts / resolveClewTier / 档位芯片 / 用量 append+byTier / groundingPolicyForTier / selectGroundPages / buildSeedBeforeMap / auditClewAnswer / meta.audit / useHeYeStore / useStudyGrades / useAtomDraftStore / useClientOnce / T72 viewMode·pageNo 真模式 / desk remount key）· 不发明或改名 storage keys · 不 LiteLLM/Auto/BYOK/云墙/verified:true/Clew 真写/seed-apply 可写/bulk/批量重抽/Register 硬门禁/quiz densify/钥入仓。

## DEFER（后续刀）

ClewPane mega-split · ChapterPageReader 再拆 · 两处冻结 effect 更深非 effect 化（KEEP）· 全仓 lint-zero（禁 gut）· `loadMaterials` / `chapterHasBlocks` / `chapterHasCards` 是否进 memo 层（当前零收益压力，不动物料归因路径优先）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent heye-only · Register 硬门禁 · quiz densify。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip c335d0e） | after（写手树） | 验收复核 |
|---|---|---|---|
| `export const dynamic = "force-dynamic"`（web，非注释） | 12 处 | **12 处**（grep 复核，零增删） | ___ |
| `generateStaticParams` 实现 | 0（仅 entities/[id] 移除注释提及） | **0** | ___ |
| 沙箱探针：二次 `loadCards`（同指纹） | 每次 readdir+readFile+parse | **命中：readFile 1→0，hits+1，内容一致** | ___ |
| 沙箱探针：六 load* 暖路径（loadCard/loadBooks/loadChapters/loadChapterPages/loadAllChapterPages 连呼两轮） | 每轮全量读盘 | **readFile=0，hits+5** | ___ |
| 沙箱探针：改卡文件（size+mtime 变） | 重读见新数据 | **miss+重读，card-a→card-a2 新内容即时可见** | ___ |
| 沙箱探针：touch-only（mtime 变 size 不变） | 重读同内容 | **miss+重读，内容一致** | ___ |
| 沙箱探针：坏 JSON fail-closed | skip+warn→0 卡 | **miss+skip+warn→0 卡（不吃缓存陈旧绿卡）；修复后 miss 恢复** | ___ |
| 沙箱探针：API 守恒（交集空/章过滤/未知书空/ghost undefined/未知章 []/页合并去重） | — | **7/7 PASS** | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:218 · StudySession:234 冻结 KEEP 原样在；无 disable 新增） | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级） | ___ |
| clew-check · cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 · seed-apply-check | 绿 | **绿**：clew 69/69；cite ch01 卡40·原子57·有页cite195·OCR未见0；parse ch07 覆盖100.0%；page ch07 暗0；density ch07 浅0；qa ch01 不完备0；seed-apply（stdin 夹具包）would-change 1 / already-matches 1 分列正确（dry-run 报告非真源） | ___ |
| 调用方文件 diff | — | **零 diff**（仅 entities.ts + 本文档 + /tmp 探针不入仓） | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-74/lint-baseline.md`（tip c335d0e · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:218 cursor + StudySession:234 order，KEEP）。
