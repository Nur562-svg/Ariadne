# Task 83 — desk-atom-draft-lib-split-01

**Slug**: `desk-atom-draft-lib-split-01`
**Title**: atom-draft.ts 诚实 mid-split · 568 行单文件按既有三分区机械抽成 `atom-draft-store` + `atom-draft-overlay` + `atom-draft-patch`，主文件收口为 barrel（五禁 header 留此）；`@/lib/atom-draft` 全部 39 个既有 named exports 守恒；16 个消费者 import 路径零改；UI / EntityCardDetail 零 diff；两处会话冻结零触碰
**Tip**: `62894d7`（docs T82）atop `69a7183`（feat T82）atop `bffd3ee`（T81 docs）
**体量**: mid · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T82 收掉 AtomDraftEditor 后，`apps/web/lib/atom-draft.ts` 仍是 568 行单文件，内含三段**已有分区注释**的清晰缝：store（:19–141 键 / 类型 / load·persist·subscribe·set·merge·clear·clearCard·saveWhole）· overlay helpers（:143 分区注释起：Draftable* / nonEmptyDraft / apply* / cardDraftCount / incomplete* / *Differs，另 listDraftedCardIds :344–356 为 store 扫描型 helper）· patch（:232 分区注释起：DraftPatchEntry / AtomDraftPatchDoc / pushIfChanged / buildAtomDraftPatchDoc·Patch · T62 A pack / listDraftedCardIds 除外的摘要 · T62 B 人核落盘清单 · T67 G 粘贴解析·校验·应用）。本刀只做机械抽出：三段按**声明归属**整段搬到同级三件（函数体与 tip 逐段一致，仅跨文件 import），主文件收口为 barrel——五禁 header :1–17 原文留此 + 三行 `export *` re-export。唯一语义性改动：模块私有 `nonEmptyDraft` 加 `export`（overlay 覆盖判定与 patch 真改动判定同口径，供 patch 的 `pushIfChanged` import，**不复制分叉两份**）。16 个消费者（desk/page · ingest/page · Cockpit · AtomDraftLine · EntityCardDetail · DraftInbox · CardDraftBar · FillAtomQuoteDraft · FieldDraftLine · AtomDraftEditor · DraftInboxPort · DraftInboxPatchPaste · ClewPane · chapter-quality-rollup-server · use-atom-draft-store · atom-draft-port）共用 27 个符号，全部仍自 `@/lib/atom-draft` 解析，路径零改、文件零 diff；HeYeSession:88 / StudySession:106 两处冻结零触碰。

**结构性事实（写给下一位读者）**：`scripts/clew-suggest-check.mjs:32` 以 **Node 原生 type-strip 直接 `import("../apps/web/lib/atom-draft.ts")`**。tip 上该文件唯一 import 是 `import type`（编译期擦除），所以 Node 从不解析任何路径；拆成 barrel 后 `export *` 是**值级** re-export，Node ESM **既不解析 tsconfig 的 `@/` 别名，也不补扩展名**（写手实证：`@/lib/...` → `ERR_MODULE_NOT_FOUND '@/lib'`；无扩展名 `./atom-draft-store` 同样失败；仓内 5 处无扩展名相对引用的 lib 实际由 `.mjs` 孪生供 node 脚本使用，不是 .ts 直载先例；clew 四件 lib 彼此只有 `import type` / `node:`，亦无值级互引先例）。唯一同时满足 Node 与 tsc 的形式是**带 `.ts` 扩展名的相对路径**（`./atom-draft-store.ts`），TS 5.9 对此要求 `allowImportingTsExtensions`（`noEmit: true` 下合法，本仓已是 noEmit）。故本刀在 `apps/web/tsconfig.json` 加**一行纯许可性开关** `"allowImportingTsExtensions": true`——对既有 import 零影响（仓内此前无任何 `.ts` 扩展名 import），Next 16.4 build 接受且未改写 tsconfig，lint 无相关规则。替代路径均不成立：改 check 脚本加 loader = 篡改护栏；`.js` 映射 Node 无文件；复制 store/overlay 函数进 patch = 分叉语义（合同 D.3 明禁）。barrel 注释写明此约束。

## 铁合同（硬 · 铁）

1. **机械抽出 only**：只搬既有分区（store / overlay helpers / T62 patch·pack）；五禁文案 / schema 名（`ariadne.atom-draft-patch.v1` · `ariadne.atom-draft-pack.v1`）/ storage key / overlay 语义（seed ⊕ draft；seed 无 cite 不造 cite）/ patch human-apply-only 逐字节零改。写手脚本实证：去注释·去 import 后**代码行 416 → 416 order-insensitive IDENTICAL**，唯一差异 = `function nonEmptyDraft` → `export function nonEmptyDraft`。
2. **公共 API 守恒**：39 个既有 named exports（27 值 + 12 类型）全部仍可自 `@/lib/atom-draft` 导入（barrel `export *` ×3；写手以 39 符号临时 .ts 校验文件过 tsc 0 后删除）；新增 `nonEmptyDraft` 一个 export（只加不减）。16 个消费者 import 路径零改；UI 组件（EntityCardDetail / AtomDraft* / DraftInbox* / Cockpit / ClewPane / CardDraftBar）与 `atom-draft-port.ts` / `use-atom-draft-store.ts` **零 diff**。
3. **两处冻结 KEEP**：HeYeSession:88 cursor · StudySession:106 order——本刀零触碰（两文件 git diff 为空）；不 gut、不 eslint-disable 捂 SSE（五件 atom-draft*.ts eslint-disable 0）。
4. **T71 uSES KEEP**：`use-atom-draft-store.ts` 零 diff，继续 `useAtomDraftStore`；无 setTick 回退；键名 `ariadne.atom-draft.v1` 字面只在 store 件一处（原 :21 搬运）；`atom-draft-port.ts` 零逻辑改。
5. **草稿语义铁律（五禁）**：本机草稿 only；草稿 ≠ seed 已核 · ≠ heye 本机已对 · ≠ study 练分；禁止 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ 与 progress-port 合并——三件无任何新增写路径；parseAtomDraftPatch 的 verified/write/apply 拒收逻辑原样。
6. **抽出 ≠ densify**：函数体与 tip 逐段一致；不新增 CTA、不改空表诚实句、不改 UI（纯 lib 刀，产品面零像素改动）。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；不引入任何 effect / setState（纯函数 lib）。
8. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动。
9. 不 redo Clew T66–T70；不拆 DocumentPane / ClewPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit / AtomDraftEditor / EntityCardDetail 当主题；不碰 T73–T82 extracts、T74/T77 entities memo。
10. J 必记：before 568 → after barrel ≤80（目标 ≤50）；抽出件 ≥2；消费者路径零改；UI 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；clew-check 绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip atom-draft.ts 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 1–17 | 五禁 header（T61 合同 JSDoc） | **留** `atom-draft.ts`（barrel；原文零改） |
| 19 | `import type { Atom, Cite, EntityCard } from "@/lib/entities"` | 按需分到 overlay（三名）/ patch（EntityCard）；store 无需 entities 类型 |
| 21–141 | `ATOM_DRAFT_STORE_KEY` · `DraftEntry` · `AtomDraftStore` · `atomDraftKey` / `fieldDraftKey` / `draftCardId` · `loadAtomDraftStore` · `persistAtomDraftStore`（私有）· `listeners` / `subscribeAtomDraftStore` / `emitAtomDraftChanged`（私有）· `DraftWriteResult` · `setAtomDraft` / `mergeAtomDraft` / `clearAtomDraft` / `clearCardDrafts` / `saveWholeAtomDraftStore` | `atom-draft-store.ts`（127 行；无 import；私有三件仍私有） |
| 143–230 + 264–283 + 344–356 | :143 overlay 分区注释 · `DraftableAtom` / `DraftableField` · `nonEmptyDraft`（**加 export**）· `applyAtomDraft` / `applyFieldDraft` · `cardDraftCount` · `atomIncomplete` · `IncompleteDraftTarget` / `listIncompleteDraftTargets` · `atomDraftDiffers` / `fieldDraftDiffers` · `listDraftedCardIds` | `atom-draft-overlay.ts`（135 行；import type 三名 ← entities；`atomDraftKey` / `draftCardId` / 两类型 ← `./atom-draft-store.ts`；声明保持 tip 相对顺序） |
| 232–262 + 285–342 + 358–443 + 445–568 | :232 patch 分区注释 · `DraftPatchEntry` / `AtomDraftPatchDoc` · `pushIfChanged`（私有，随 patch）· `buildAtomDraftPatchDoc` / `buildAtomDraftPatch` · :319 T62 A 注释 · `AtomDraftPackDoc` / `buildAtomDraftPack` · `CardDraftSummary` / `summarizeDraftStore` · :391 T62 B 注释 · `GUIDE_FIELD_LOC` / `guideOneLine`（私有）/ `buildSeedApplyGuide` · :445 T67 G 注释 · `ParsePatchResult` / `parseAtomDraftPatch` · `validateAtomDraftPatch` · `ApplyPatchResult` / `applyAtomDraftPatch` | `atom-draft-patch.ts`（320 行；import type EntityCard ← entities；`atomDraftKey` / `fieldDraftKey` / `mergeAtomDraft` / 两类型 ← `./atom-draft-store.ts`；`nonEmptyDraft` / `cardDraftCount` / `listIncompleteDraftTargets` ← `./atom-draft-overlay.ts`） |
| — | 新增 | barrel：11 行 T83 注（含 `.ts` 扩展名约束说明）+ 3 行 `export * from "./atom-draft-*.ts"`；三件各 4–6 行 T83 头注；overlay `nonEmptyDraft` 1 行 JSDoc；tsconfig +1 行 `allowImportingTsExtensions` |

归属说明：任务书行段 143–285 / 286–568 为近似；按任务书**语义清单**归属——`*Differs`（:264–283）与 `listDraftedCardIds`（:344–356）归 overlay，`DraftPatchEntry` / `AtomDraftPatchDoc`（:234–248）与 `pushIfChanged`（:250–262）随 patch。私有符号（persist / listeners / emit / pushIfChanged / GUIDE_FIELD_LOC / guideOneLine）在新家仍私有，不经 barrel 外泄。

## OUT（本刀 + forever）

不 push · 不 densify 草稿文案 / CTA / 琥珀旁挂 / 空表诚实句 · 不造掌握% / Due / 单一健康分 / 健康圆环 / 第四书架徽列 · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit / AtomDraftEditor / EntityCardDetail 当主题 · 不改任何消费者 `@/lib/atom-draft` import 为深路径 · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM / Auto / BYOK / 云墙 / 批量重抽 / 钥入仓 / Next 升级 · 不发明或改名既有 storage keys（`ariadne.atom-draft.v1` 零改）· 不把 draft 塞进 progress-port · 不改 check 脚本装绿。

## DEFER（后续刀）

EntityCardDetail（552；tip 复测仍仅 citeStats(17–43)/firstPagedCitePage(46–51) 薄 helpers；fields/atoms/OCR 补救/草稿条 JSX 缝稠且缠 OCR/草稿 densify——另开）· ClewPane 编排器再拆（禁作主题）· DocumentPane 再 densify（禁）· ChapterPageReader 再拆（禁）· HeYe/Study 主流程再拆（禁）· DraftInbox 再拆（禁）· Cockpit 再拆（禁）· AtomDraftEditor 再拆（禁 · T82 刚闭）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 62894d7） | after（写手树） | 验收复核 |
|---|---|---|---|
| `lib/atom-draft.ts` 行数 | **568** | **32**（barrel；≤80 达标，目标 ≤50 亦达成：17 行五禁原文 + 11 行 T83 注 + 3 行 re-export + 空行） | ___ |
| 抽出件（≥2） | — | **3**：atom-draft-store 127 · atom-draft-overlay 135 · atom-draft-patch 320（合计 582 = 568 原文 − 17 header − 1 import + 三件头注/跨文件 import/nonEmptyDraft JSDoc） | ___ |
| 代码行守恒（去注释·去 import·order-insensitive） | 416 | **416 IDENTICAL**；唯一差异 `function nonEmptyDraft` → `export function nonEmptyDraft` | ___ |
| `@/lib/atom-draft` named exports | 39（27 值 + 12 类型） | **39 全守恒** + 新增 `nonEmptyDraft`（只加不减；写手 39 符号校验文件 tsc 0）；Node 直载 barrel 运行时导出 28 = 27 值 + nonEmptyDraft | ___ |
| 消费者（16 文件 / 27 符号）import 路径 | `from "@/lib/atom-draft"` | **零改**（git status：components/ · app/ · atom-draft-port.ts · use-atom-draft-store.ts · scripts/ 全部零 diff） | ___ |
| UI / EntityCardDetail diff | — | **零 diff**（EntityCardDetail 552 · AtomDraftEditor 119 · Cockpit 151 · DraftInbox 239 · ClewPane 930 原样） | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（两文件 git diff 为空；lint 仍精确报 `:88:9 setIndex` / `:106:5 setOrder`） | ___ |
| 键名 / schema / 五禁 | `ariadne.atom-draft.v1` · patch.v1 · pack.v1 · header :1–17 | **同**（键名字面仅 store 件 1 处；header 原文留 barrel；三件 eslint-disable 0 · verified 写入 0） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession:88:9 · StudySession:106:5）；before/after 输出 normalized diff **IDENTICAL**；atom-draft* 零提及 | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0**（含 tsconfig +1 行 `allowImportingTsExtensions`；无此行则 6 × TS5097——结构性事实见上） | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 16.4.0 未升级；Compiled successfully · TypeScript finished；next build 未改写 tsconfig） | ___ |
| SSR 冒烟（`next start` 产物） | — | `/desk/card/immunity` **200** · `/entities/immunity` **200**：经 barrel 真渲 AtomDraftLine ×2（「编辑草稿」）+ FieldDraftLine ×4（disclaimer），与 T82 观察一致；`/desk` 200；服务端 stderr 0 | ___ |
| clew-check（Node 直载 `atom-draft.ts`） | 69/69 | **69/69**（`@/` 别名或无扩展名形式下为 ERR_MODULE_NOT_FOUND——`.ts` 相对路径修正后绿） | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（cite ch01 卡40·原子57·有页cite195·OCR未见0·不完备0；qa ch01 「草稿 —（本机）」诚实口径不变；parse/page/density exit 0） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 / missing 0 / invalid 0 分列正确（dry-run 报告非真源，gitignored；data/cards·chapters·config 零脏） | ___ |
| 未碰复核（HeYeSession/StudySession/DocumentPane/ClewPane/ChapterPageReader/EntityCardDetail/DraftInbox/Cockpit/AtomDraftEditor） | 606/460/649/930/353/552/239/151/119 行 | **零触碰**（git status 仅 atom-draft.ts M + tsconfig.json M(+1) + 3 新件 + 本文） | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-83/lint-baseline.md`（tip 62894d7 · pnpm --filter web lint exit 1 · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 cursor + StudySession:106 order，KEEP）；Mac 侧写手开工前实跑复核同值（`/tmp/t83-lint-before.txt`）。
