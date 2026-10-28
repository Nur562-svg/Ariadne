# Task 85 — desk-clew-answer-audit-lib-split-01

**Slug**: `desk-clew-answer-audit-lib-split-01`
**Title**: clew-answer-audit.ts 诚实 mid-split · 581 行单文件按既有分区机械抽成 `clew-answer-audit-types` + `clew-answer-audit-extract` + `clew-answer-audit-core` + `clew-answer-audit-surface`，主文件收口为 barrel（铁合同五条留此）；`@/lib/clew-answer-audit` 全部 24 个既有 named exports 守恒；5 个消费者（route / ClewPane / ClewAuditView / clew-pane-helpers / clew-suggest-check.mjs）入口零改；UI 零 diff；两处会话冻结零触碰
**Tip**: `48bf085`（docs T84 desk-clew-suggest-lib-split-01）atop `25f328f`（feat T84）atop `32ace43`（T83 docs）
**体量**: mid · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T84 收掉 clew-suggest lib 后，`apps/web/lib/clew-answer-audit.ts`（T70 A·B 答面事后核账纯函数）仍是 581 行单文件，含四段**清晰 export 组边界**：types+常量（:16–99）· extract 抽出（:101–281）· core 核账（:283–450）· surface 答面（:452–581）。本刀按任务书推荐拆四件 + barrel：**types**（版本常量 / PAGE_RANGE_MAX / 全量形状，DAG 根、无 import）← **extract**（全角归一 / 围栏跳过 / 自标识别 / collect / extractAnswerRefs）← **core**（numList / buildAuditBasis / classPage / auditClewAnswer / safe / coerce / isAuditUnavailable）；**surface**（formatAuditTakeawayLine / AnswerSegment / segmentAnswerRefs / relatedCardAtoms / 两条既有深链）← types + extract（extractAnswerRefs）+ core（isAuditUnavailable）。函数体与 tip 逐段一致（写手以只读 diff 逐段实证：六段对照五段 IDENTICAL，唯一差异 = `function isPrintedPage` → `export function isPrintedPage`）；`scripts/clew-suggest-check.mjs` 仍直载 barrel（Node 原生 type-strip，运行时导出 14 全到）；route / ClewPane / ClewAuditView / clew-pane-helpers 零 diff；HeYeSession:88 / StudySession:106 零触碰。

**结构性事实（写给下一位读者）——一处声明级迁位（保 DAG「types 为根」且不复制分叉，有依赖实证）**：

`isPrintedPage`（原 :101–103，extract 区私有）被 **extract**（extractAnswerRefs 四处页码识别）与 **core**（numList 合法值过滤）**双用**；归 types（随其唯一私有常量 `PAGE_MAX` :99）加 `export`，避免 core ← extract 之外再复制一份守卫。这是全刀唯一声明行改动（`function` → `export function`；T84 同款决策）。`AnswerSegment`（原 :465–476）仅 `segmentAnswerRefs` 使用，按任务书 C.2 选择**随 surface**（不入 types），已在 barrel 经 `export *` 守恒。

四件 DAG 实测：types 0 import；extract 1（← types）；core 2（← types、← extract）；surface 3（← types type-only、← extract、← core）；barrel 4 × `export * from "./….ts"`。同 T83/T84：`.ts` 扩展名相对路径是 Node 直载与 tsc 双解的唯一形式（tsconfig `allowImportingTsExtensions` T83 已开，本刀零 tsconfig 改动）。

## 铁合同（硬 · 铁 · 与任务书逐条对齐）

1. **机械抽出 only**：只搬既有 export 组；铁合同五条 header（:1–14）原文留 barrel；页码四类口径（grounded / context / self_marked / unmarked_out；过宽区间不算窗内）零改；clean 定义（unmarked_out = 0 且 unknown = 0）零改；fail-closed（异常 / 坏形 / 错版本 → `{ error: "audit_unavailable" }`，绝不默认全绿）零改；`PAGE_RANGE_MAX = 20` 零改。写手实证：barrel :1–14 ≡ tip :1–14；types 体 ≡ :16–99；extract 体 ≡ :105–281；core 体 ≡ :283–450；surface 体 ≡ :452–581——**逐字节 IDENTICAL**。
2. **公共 API 守恒**：24 个既有 named exports（13 值 + 11 类型）全部仍可自 `@/lib/clew-answer-audit` 导入（barrel `export * from "./….ts"` ×4；Node 直载 barrel 运行时导出 14 = 13 值 + isPrintedPage，与 clew-check `A.*` 11 名逐一在列）；新增 `isPrintedPage` 一个 export（只加不减）。消费者入口零改：`app/api/clew/suggest/route.ts:34`、`components/desk/ClewPane.tsx:16`、`components/desk/ClewAuditView.tsx:14`、`components/desk/clew-pane-helpers.ts:13` 仍 `from "@/lib/clew-answer-audit"`；`scripts/clew-suggest-check.mjs:34` 仍 `import("../apps/web/lib/clew-answer-audit.ts")`（入口零改）。
3. **两处冻结 KEEP**：HeYeSession:88 cursor · StudySession:106 order——零触碰（两文件 git diff 为空）；不 gut、不 eslint-disable 捂 SSE（五件 clew-answer-audit*.ts eslint-disable 0）。
4. **Node 直 import 守恒**：四抽出件彼此只有相对 `.ts` import；**无 fs / 无 process.env / 无 `"use client"` / 无 Date / 无网络 / 无 require**（grep 实证，命中仅头注文字）；**不改 clew-suggest\***（T84 双份同构 `formatAuditTakeawayLine` 刻意保留，不合并 compose 私有副本）。
5. **Clew 只读铁律**：无任何新增写路径；审计 ≠ 核验文案逐字零改（「核账：接地 … · 越窗未标 … · 无此原子 …（≠ 内容已核）」「核账：不可用」）；永不 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / bulk。
6. **抽出 ≠ densify**：函数体逐段一致；不新增 CTA、不改空表诚实句、不改 UI、不改 route 流式主路径（route 零 diff）。
7. **不 quiet-disable**：不关 SSE 规则、不降 eslint 装绿；纯函数 lib 无 effect / setState。
8. 美学：先读 `docs/frontend-aesthetics.md`；无产品视觉改动（纯 lib）。
9. 不 redo Clew T66–T70 语义；不拆 ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit / AtomDraftEditor / atom-draft* / clew-suggest* / EntityCardDetail 当主题；不碰 T73–T84 extracts、T74/T77 entities memo。
10. J 必记：before 581 → after barrel ≤80（目标 ≤50）；抽出件 ≥3（四件）；消费者路径零改；UI/ClewPane/ClewAuditView/route 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS；clew-check 绿；cite/parse/page/density/qa/seed-apply-check 绿。

## 抽出映射（源缝 → 目标文件）

| 源（tip clew-answer-audit.ts 行段） | 内容 | 目标（同目录新文件） |
|---|---|---|
| 1–14 | 铁合同 header（五条 JSDoc） | **留** `clew-answer-audit.ts`（barrel；原文零改） |
| 16–99 | CLEW_ANSWER_AUDIT_VERSION · PAGE_RANGE_MAX · ClewPageClass / ClewIdClass · ExtractedPageRef / ExtractedIdRef · ClewAuditBasis / ClewAuditRef / ClewAuditCounts / ClewAnswerAudit / ClewAuditUnavailable / ClewCardAtomRef · PAGE_MAX（私） | `clew-answer-audit-types.ts`（97 行；**无 import**，DAG 根） |
| （+101–103 迁入） | isPrintedPage（extract 区私有 → **加 export**；extract / core 双用） | 同上 types（唯一声明行改动） |
| 105–281 | normChar / normalize（私）· fenceSpans / inSpans / overlaps（私）· SENT_BREAK / isSelfMarked（私）· collect（私）· extractAnswerRefs | `clew-answer-audit-extract.ts`（192 行；import 4 名 ← types） |
| 283–450 | numList / idList（私）· buildAuditBasis · classPage（私）· auditClewAnswer · safeAuditClewAnswer · isCount（私）· coerceClewAnswerAudit · isAuditUnavailable | `clew-answer-audit-core.ts`（190 行；import 9 名 ← types + 1 名 ← extract） |
| 452–581 | formatAuditTakeawayLine · AnswerSegment（仅 segment 用，随本件）· segmentAnswerRefs · relatedCardAtoms · existingStudyHrefForCard · clewCitedPageHref | `clew-answer-audit-surface.ts`（149 行；type-only import 5 名 ← types + 1 名 ← extract + 1 名 ← core） |
| — | 新增 | barrel：14 行铁合同原文（:1–14 零改）+ 12 行 T85 注（四件地图 + `.ts` 相对路径约束）+ 4 行 `export *` |

私有符号（normChar / normalize / fenceSpans / inSpans / overlaps / SENT_BREAK / isSelfMarked / collect / numList / idList / classPage / isCount / PAGE_MAX）在新家仍私有，不经 barrel 外泄。

## OUT（本刀 + forever）

不 push · 不改 Clew 核账五条铁合同 / 页码四类口径 / fail-closed / clean 定义 / PAGE_RANGE_MAX / 围栏跳过 · 不给 clew-suggest* 加 audit 依赖或合并 compose 私有 formatAuditTakeawayLine（T84 双份同构刻意）· 不加 fs / process.env / "use client" / Date / 网络 · 不 densify · 不写 seed · 不造掌握% / Due / 单一健康分 / 健康圆环 / 第四书架徽列 · 不 gut 冻结 / 不 disable 捂 SSE · 不拆 ClewPane / DocumentPane / ChapterPageReader / HeYe·Study 主流程 / DraftInbox / Cockpit / AtomDraftEditor / atom-draft* / clew-suggest* / EntityCardDetail 当主题 · 不改任何消费者 import 为深路径 · 不改 scripts/clew-suggest-check.mjs 入口 · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM / Auto / BYOK / 云墙 / 批量重抽 / 钥入仓 / Next 升级 · 不发明或改名既有 storage keys。

## DEFER（后续刀）

EntityCardDetail（552；tip 复测仍仅 citeStats / firstPagedCitePage 薄 helpers，fields/atoms/OCR 补救/草稿条 JSX 缝稠——DEFER）· ClewPane 编排器再拆（禁作主题）· DocumentPane 再 densify（禁）· ChapterPageReader 再拆（禁）· HeYe/Study 主流程再拆（禁）· DraftInbox / Cockpit / AtomDraftEditor / atom-draft* / clew-suggest* 再拆（禁 · T80–T84 刚闭）· route 再拆（禁）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent study-only · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 48bf085） | after（写手树） | 验收复核 |
|---|---|---|---|
| `lib/clew-answer-audit.ts` 行数 | **581** | **31**（barrel；≤80 达标，目标 ≤50 亦达成：14 行铁合同原文 + 12 行 T85 注 + 4 行 re-export + 界空行） | ___ |
| 抽出件（≥3） | — | **4**：types 97 · extract 192 · core 190 · surface 149（合计 628 = 581 − 14 header + 四件头注 / 跨文件 import / export 前缀） | ___ |
| 代码行守恒（逐段只读 diff vs `git show HEAD`） | — | barrel :1–14 ≡ :1–14；types 体 ≡ :16–99；extract 体 ≡ :105–281；core 体 ≡ :283–450；surface 体 ≡ :452–581——**逐字节 IDENTICAL**；唯一声明差异 `function isPrintedPage` → `export function isPrintedPage`（≡ :101–103 + export 前缀） | ___ |
| `@/lib/clew-answer-audit` named exports | 24（13 值 + 11 类型） | **24 全守恒** + 新增 `isPrintedPage`（只加不减）；Node 直载 barrel 运行时导出 14 = 13 值 + isPrintedPage | ___ |
| 消费者入口 | route 4 名 · ClewPane 3 名 · ClewAuditView 8 名 · clew-pane-helpers 4 名（type-only）· clew-check `A.*` 11 名 | **零改**（全仓 tracked 修改仅 barrel 一件 + 4 新抽出件；components/ · app/ · scripts/ 零 diff） | ___ |
| UI / ClewPane / ClewAuditView / route diff | — | **零 diff**（ClewPane 930 · route 638 · helpers 299 · ClewAuditView 143 原样） | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（diff 为空；lint 仍精确报 :88 setIndex / :106 setOrder） | ___ |
| tsconfig | （T83 含 allowImportingTsExtensions） | **零改**（本刀不需要任何配置变更） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：exit 1 · **2（2e / 0w）** · SSE 2（HeYeSession + StudySession 各一）；clew-answer-audit* 零提及 | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级） | ___ |
| clew-check（Node 直载 barrel） | 69/69 | **69/69**（pass 69 · fail 0） | ___ |
| cite-check -- ch01 · parse-check · page-check · density-check · qa-check -- ch01 | 绿 | **绿**（cite 卡 40 · 原子 57 · 有页 cite 195 · OCR未见 0（0.0%）；parse 覆盖 100.0%；page / density 全章绿；qa ch01 不完备 0 ·「草稿 —（本机）」口径不变） | ___ |
| seed-apply-check（stdin 夹具包） | 绿 | **绿**：would-change 1 / already-matches 1 / missing 0 / invalid 0（报告 gitignored；data/cards · chapters · config 零脏） | ___ |
| 未碰复核（HeYe / Study / DocumentPane / ClewPane / ChapterPageReader / EntityCardDetail / DraftInbox / Cockpit / AtomDraftEditor / atom-draft barrel / clew-suggest barrel） | 606/460/649/930/353/552/239/151/119/32/41 行 | **零触碰** | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-85/lint-baseline.md`（tip 48bf085 · pnpm --filter web lint · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 cursor + StudySession:106 order，KEEP）；Mac 侧写手开工前实跑复核同值。

## 过程备注（诚实记录）

写手首轮尝试经 Write/Edit 落盘抽出件时，被 Mimosa 安全 hook 以「命令注入」拦截——触发行为 `while ((m = re.exec(s)))`（`RegExp.prototype.exec` 标准正则迭代，与 tip 已提交的 :187 逐字节相同，全文件无 shell / child_process；hook 建议为 Python `subprocess.run` 修法，不适用）。经用户解锁后五件落盘，写手完成全部核验（上述逐段 diff / DAG / 导出清单 / J 全量检查）。此插曲零代码后果：最终文件逐字节守恒，无任何为绕过扫描器产生的改写。
