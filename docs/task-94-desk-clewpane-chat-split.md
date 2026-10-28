# Task 94 — desk-clewpane-chat-split-01

**Slug**: `desk-clewpane-chat-split-01`
**Title**: ClewPane.tsx 诚实 MEGA chat further split · 930 行编排器按三条既有机械缝抽成 `use-clew-chat-engine`（hook：会话态 + 探针 + 档位 + run/send/retry/stop/fillDrafts）+ `ClewChatThread`（空态 / 气泡四态 / 核账 / 补丁块 / 行动链）+ `ClewChatComposer`（档位芯片 / textarea / 发送 / 停止），编排器收口 222 行（≤550 达标，目标 ≤500 亦达成）；`export default function ClewPane()` 零 props 守恒；DeskShellClient 零 diff；T75 四成品件（clew-pane-helpers / ClewAuditView / ClewChangesPanel / ClewQueuePanel）内容零触只 import 接线；T66–T70 Clew 合同 / T71 uSES 双仓口逐条 KEEP；UI / className / 文案零 diff；两处会话冻结（HeYeSession:88 · StudySession:106）零触碰
**Tip**: `29ac5b2`（docs T93 desk-progress-port-lib-split-01）atop `4660f21`（feat T93）atop `83820ed`（T92 docs）
**体量**: 诚实 MEGA · A–J 全交
**定稿**: 2026-10-28 Asia/Shanghai (CST)

## 一句话

T88–T93 连切六刀 lib mid barrel 后，用户明令「不要再交 ~100–160 LOC 薄 lib barrel，prefer honest LARGER knives」。本刀挑 `apps/web/components/desk/ClewPane.tsx`（tip 930 行：T75 已抽掉模块层纯函数 / 核账视图 / Changes·Queue 两面板后，编排器仍背着**整个对话引擎 + 整段线程 JSX + 整段输入区**）按三条任务书点名的既有机械缝切出 ≥3 sibling：**缝 1 引擎 hook**（tip :62–91 会话态 + fillDrafts · :93–154 status 探针 + pickTier/tierAvailable · :171–245 上下文切换 note + scrollThread/updatePending/appendPending · :246–457 async run（NDJSON meta→delta*→done|error · 502 bump · 503 no_provider→stub）+ send + retry）→ `use-clew-chat-engine.ts` 461 行；**缝 2 线程**（tip :552–820 `<div ref={threadRef}>` 容器：有书/无书两空态 + 建议问 + note/user/assistant 四态气泡 + AuditedProse/AuditFace 预览·终态 + live 答底复制/填草稿/补丁明细 + 行动链；:162·164–169 suggestions/atomN/pendingN 随行）→ `ClewChatThread.tsx` 339 行；**缝 3 输入区**（tip :822–893 档位芯片 + textarea + 发送/停止）→ `ClewChatComposer.tsx` 111 行。编排器只留 tab 态 + header/tabs/会话条 + hook 解构 + Thread/Composer 接线 + Changes/Queue + 诚实脚注 → **222 行**。写手以 `git show 29ac5b2` 取 tip 原段与三抽出件逐段 `diff -w` 实证：hook 四段（A :62–91 · B :93–154 · C :171–235 · run+send+retry :246–457）**逐字一致**，仅 send 内三处 `pageHref/studyHref/reviewHref` 改为 hook 参数 `hrefs.*`；Thread 整段仅 7 处预期 props 改名（`send→onSend` · `retry→onRetry` · `fillDrafts→onFillDrafts` · `rememberClewReturn→rememberReturn` ×2 onClick + ×2 注释对齐 prop 名）；Composer 整段仅 5 处（`pickTier→onPickTier` · `setDraft→onDraftChange` · `send→onSend` ×2 · `abortRef.current?.abort()→onStop`）；编排器保留段（header :480–548 · 面板+脚注 :895–929 · rememberClewReturn/capLabel/capIntro :463–478）**逐字一致**。className / aria / 文案 / JSX 结构零改。

DAG 实测（无环）：`use-clew-chat-engine` ← react · DeskContext(type) · @/lib/clew-suggest · @/lib/clew-answer-audit · @/lib/atom-draft · clew-pane-helpers（不引 Thread/Composer/ClewPane）；`ClewChatThread` ← next/link · react(type RefObject) · DeskContext(type) · CopyTextButton · @/lib/clew-suggest · clew-pane-helpers · ClewAuditView（AuditedProse/AuditFace 继续从 T75 件 import，不复制）；`ClewChatComposer` ← clew-pane-helpers 一件；`ClewPane` ← 三新件 + helpers + ChangesPanel + QueuePanel + DeskContext + return-stack + clew-suggest。四件均带 `"use client"`（与 ClewAuditView / ClewChangesPanel / ClewQueuePanel 先例同）；import 路径统一 `@/components/desk/*` 别名（与 T75 件同式，无 `.ts` 扩展名相对路径——组件层先例如此，tsconfig 零改）。

## 铁合同（硬 · 铁 · 与任务书逐条对齐）

1. **机械抽出 only**：只搬既有三缝；函数体 / JSX 体零改。写手 `diff -w` 实证见「抽出映射」逐段 exit 码。唯一的新增代码：hook 签名与 `ClewChatEngine` 返回型、`stop()` 一行包装（原 Composer 内联 `abortRef.current?.abort()`，语义等价）、Thread/Composer 的 props 类型块、三件文件头注释、编排器文件头由 T75 注改写为 T75→T94 注（组件 doc 注 :50–58 原文留）。
2. **Public surface 守恒**：`export default function ClewPane()` **零 props**；DeskShellClient `import ClewPane from "@/components/desk/ClewPane"` + `<ClewPane />` **零 diff**（git diff --quiet 实证）。全仓 ClewPane 导入方仅 DeskShellClient 一处（grep 实证）。
3. **T75 四成品件内容零触**：`clew-pane-helpers.ts` / `ClewAuditView.tsx` / `ClewChangesPanel.tsx` / `ClewQueuePanel.tsx` git diff 为空；本刀只 **import 接线**（helpers 的 TierInfo/ActionLink/PlainLink/AssistantMsg/Msg/Tab/Capability/CLEW_TIER_KEY/TIER_IDS/TIER_LABEL/SURFACE_ZH/buildSuggestions/stubReply/clewReturnPayload/pickSuggestContext/parseCardAtoms/bubbleReturnTo/fireLinkReturn/clewCtaHrefs 按需分入四件）。**不**再切 helpers 任何一段（T75 BAN）。
4. **T66–T70 Clew 合同逐条 KEEP**（代码逐字搬入 hook，无语义改动）：streamText NDJSON meta→delta*→done|error · 502 bump · 503 `no_provider`→stub + 同源 audit · patch.v1 白名单 `splitStructuredPatch(allowed, seedBefore)` · `fillDrafts` **仅**用户点击（发送回调零 setAtomDraft）· `tierAvailable` fail-closed（探针未回不拦 / 已回按 tiers[].available）· 用量 bump 只对 200/502 · byTier 分档 · grounding/seedBefore/`auditClewAnswer`/auditPreview · 永不 Clew 真写 seed · 永不 `verified:true` · 钥不入仓 · storage 键 `ariadne.clew.tier.v1` 逐字不改。
5. **T71 uSES 双仓口合同不改**：ChangesPanel / QueuePanel 文件内容零触，编排器对二者的 props 接线（since/clew/studyHref/reviewHref/rememberReturn）逐字同 tip；外层仍不订阅 study/heye store（审计结论注 :156–160 原文留编排器）。
6. **两处冻结 KEEP**：HeYeSession:88 setIndex · StudySession:106 setOrder——零触碰（git diff 全仓 tracked 改动仅 ClewPane.tsx 一件 + 3 新件；components/ 其余 / app/ / lib/ 零 diff）；lint 仍精确报这两处，无新 eslint-disable（四件 grep 计数 0），无 gut。
7. **effect 顺序守恒**：hook 内两 effect 声明序与 tip 同（status 探针 :93 在前、ctx-note :177 在后）；hook 在编排器内紧随 `useState<Tab>` 调用，编排器自身无其它 effect → React 挂载/依赖触发顺序与 tip 一致。`queueMicrotask(() => setTier(saved))` / `setMessages((prev)=>…)` 更新器形原样——lint SSE 计数不增。
8. **抽出 ≠ densify**：不新增 CTA、不改文案、不「美化」；EntityCardDetail **DEFER**（tip 仍仅 citeStats + firstPagedCitePage 两顶层缝，< 3）。
9. **只读铁律**：本刀只搬文件、无任何新增写路径；永不 verified:true / 回写 seed / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / LiteLLM·Auto·BYOK·云墙；钥永不入仓 / 永不 NEXT_PUBLIC_*。
10. 美学：本刀为纯机械抽出，无产品视觉改动——四件 className / aria / 文案与 tip 逐字一致（`diff -w` 实证），`docs/frontend-aesthetics.md` 约束（editorial desk · 禁 AI slop 装饰 · 不引新 UI 库）由零视觉 diff 自动满足；写手未改任何样式决策。
11. J 必记：before 930 → after 222（≤550 达标 · ≤500 目标达标）；抽出件 ≥3（三件 461/339/111）；消费者路径零改；UI 零 diff；lint 护栏 2/2e/0w/SSE2 不劣于且两处冻结仍在；tsc 0；build PASS。

## 抽出映射（源缝 → 目标文件 · 写手 `diff -w` 实证）

| 源（tip ClewPane.tsx 行段 @ 29ac5b2） | 内容 | 目标（同目录新文件） | diff -w |
|---|---|---|---|
| 62–91 | messages/draft/sending/abortRef/fillStates 态 + `fillDrafts` + cap/tier 态 + threadRef | `use-clew-chat-engine.ts` | **exit 0**（逐字一致） |
| 93–154 | status 探针 effect（sessionStorage 恢复档 + fetch /api/clew/status → cap）+ `pickTier` + `tierAvailable` | `use-clew-chat-engine.ts` | **exit 0** |
| 171–245 | ctxKey 切换 note effect + `scrollThread` + `updatePending` + `appendPending` | `use-clew-chat-engine.ts` | **exit 0** |
| 246–457 | `async run`（NDJSON 流 · bumpUsage · 503 stub · meta/delta/done/error · Abort）+ `send`（行动链快照）+ `retry` | `use-clew-chat-engine.ts` | 仅 3 行：send 内 `pageHref/studyHref/reviewHref` → `hrefs.pageHref/studyHref/reviewHref`（hook 参数，值同源 `clewCtaHrefs(clew)`） |
| —（新增） | `stop()` 一行包装 + `ClewChatEngine` 返回型 + hook 签名 `(clew, {pageHref, studyHref, reviewHref})` | `use-clew-chat-engine.ts` | 新增约 40 行（含文件头注） |
| 162 · 164–169 | `suggestions = buildSuggestions(clew)` + T51 池注 + atomN/pendingN | `ClewChatThread.tsx`（函数体顶） | **exit 0** |
| 552–820 | `<div ref={threadRef}>` 线程容器：有书/无书空态 + 建议问 + note/user/assistant 气泡 + AuditedProse/AuditFace + live 答底（复制纯文本 / 复制为草稿补丁 / 填入本机草稿 + done/unpersisted 反馈）+ 补丁明细 + 行动链 | `ClewChatThread.tsx`（return 体） | 仅 7 处 props 改名：`send(s)→onSend(s)` · `retry(i)→onRetry(i)` · `fillDrafts(i,m)→onFillDrafts(i,m)` · `onClick={rememberClewReturn}`→`{rememberReturn}` ×2 · 注释内 `rememberClewReturn`→`rememberReturn` ×2 |
| 822–893 | `<div className="border-t border-line p-3">` 输入区：TIER_IDS 档位芯片（title/置灰/aria-pressed）+ textarea（Enter/Shift+Enter）+ 发送钮 + 在途停止钮 | `ClewChatComposer.tsx`（return 体） | 仅 5 处 props 改名：`pickTier(id)→onPickTier(id)` · `setDraft(…)→onDraftChange(…)` · `send(draft)→onSend(draft)` ×2 · `abortRef.current?.abort()→onStop` |
| 1–41（裁）· 43–48（改写）· 50–61 · 156–160 · 459–478 · 480–551 · 894–930 | import（按需裁到 11 行）· 文件头注 T75→T94 · 组件 doc 注原文 · tab 态 · hrefs 解构 · 审计结论注 · rememberClewReturn · capLabel/capIntro · header/tabs/会话条 · `<>` 片段（内含 Thread + Composer 两元素）· Changes/Queue · 诚实脚注 | **留** `ClewPane.tsx`（编排器 222 行） | header **exit 0** · 面板+脚注 **exit 0** · remember/capLabel/capIntro **exit 0** |

Thread props：`threadRef · messages · sending · fillStates · clew · capIntro · bookHref · pageHref · studyHref · reviewHref · rememberReturn · onSend · onRetry · onFillDrafts`。Composer props：`draft · onDraftChange · sending · tier · cap · tierAvailable · onPickTier · onSend · onStop`。hook 返回：`messages · draft · setDraft · sending · fillStates · cap · tier · threadRef · pickTier · tierAvailable · send · retry · fillDrafts · stop`。

## OUT（本刀 + forever）

不 push · 不改 ClewPane export default / 零 props 契约 · 不改 DeskShellClient · 不再切 clew-pane-helpers（T75 BAN）/ ClewAuditView / ClewChangesPanel / ClewQueuePanel 任何内容 · 不改 API routes / stream handler · 不 densify EntityCardDetail（< 3 缝 DEFER）/ DocumentPane / ChapterPageReader / HeYe / Study · 不 gut 冻结 / 不 disable 捂 SSE · 不写 verified:true / 自动写 entities / PATCH entities / seed-apply --write/--apply / 「一键写回仓库」/ bulk / 批量重抽 / 钥入仓 / NEXT_PUBLIC_* / LiteLLM 网关 / Auto 路由 / BYOK / 云配额墙 / Next 升级 / twin cite-ocr .mjs / rollup -server·check.mjs 主题 · 不交又一个 ~100–160 LOC 薄 lib barrel。

## DEFER（后续刀）

EntityCardDetail（552；tip 复测仍仅 citeStats / firstPagedCitePage 两薄 helpers，未出现 ≥3 清晰机械 extract 缝）· CitePeek（361）· ClewChangesPanel（319）· Sidebar（302）再拆（缝弱）· entities（586 padded MEGA · 非本刀）· clew-pane-helpers（T75 BAN）· DocumentPane 再 densify（禁）· HeYe/Study 主流程再拆（禁）· heye.ts（162 单大函数）· return-stack（85 过薄）· atom-draft* / clew-suggest* / clew-answer-audit* / cite-ocr* / chapter-quality-rollup* / last-opened* / clew-usage* / clew-provider* / heye-store* / study* / progress-port* 再拆（禁 · T83–T93 刚闭）· 冻结更深非 effect 化（KEEP）· lint-zero（禁 gut）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · Register 硬门禁 · quiz densify · 掌握%/健康圆环 · 第四书架徽列。写手不 push；验收 PASS 后由验收方按站规 auto-push。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip 29ac5b2） | after（写手树） | 验收复核 |
|---|---|---|---|
| `ClewPane.tsx` 行数 | **930** | **222**（编排器；≤550 达标，目标 ≤500 亦达成） | ___ |
| 抽出件（≥3） | — | **3**：`use-clew-chat-engine.ts` 461 · `ClewChatThread.tsx` 339 · `ClewChatComposer.tsx` 111（四件合计 1133；净增 203 = hook 签名/返回型 + 两件 props 类型块 + 三文件头注 + stop 包装） | ___ |
| 代码行守恒（逐段 `diff -w` vs `git show 29ac5b2`） | — | hook A/B/C 三段 **exit 0**；run+send+retry 仅 3 处 `hrefs.*`；Thread 仅 7 处 props 改名；Composer 仅 5 处 props 改名；编排器 header / 面板+脚注 / remember+capLabel+capIntro **exit 0** | ___ |
| `export default function ClewPane()` | 零 props | **零 props**（grep 实证 :38） | ___ |
| DeskShellClient 契约 | `import ClewPane from "@/components/desk/ClewPane"` + `<ClewPane />` | **零 diff**（git diff --quiet 实证；:5 import · :31 `<ClewPane />` 原样） | ___ |
| T75 四成品件（helpers / AuditView / Changes / Queue）diff | — | **零 diff**（git diff --name-only 为空） | ___ |
| DocumentPane / entities / HeYeSession / StudySession / EntityCardDetail / CitePeek / Sidebar / app/ / lib/ diff | — | **零 diff**（全仓 tracked 改动仅 ClewPane.tsx 一件 + 3 新 untracked 件） | ___ |
| 两处冻结 | HeYeSession:88 · StudySession:106 | **零触碰**（diff 为空；lint 仍精确报 HeYeSession.tsx:88:9 setIndex / StudySession.tsx:106:5 setOrder） | ___ |
| className / aria / 文案 / JSX 结构 | — | **零改**（diff -w 差异全为标识符改名） | ___ |
| DAG | 单文件 | engine ↛ Thread/Composer/ClewPane；Thread ↛ engine/Composer；Composer ← helpers 一件；ClewPane ← 三件——无环 | ___ |
| `"use client"` | ClewPane 有 | 四件均有（与 T75 面板件先例同） | ___ |
| eslint-disable | 0 | **0**（四件 grep 计数 0） | ___ |
| `pnpm --filter web lint` | exit 1 · **2 problems（2e / 0w）** · SSE 2 | 同：**2（2e / 0w）** · SSE 2（HeYeSession:88:9 + StudySession:106:5）；Clew* / use-clew-* 零提及 | ___ |
| `pnpm --filter web exec tsc --noEmit` | 0 | **0** | ___ |
| `pnpm --filter web build` | PASS | **PASS**（Next 未升级；路由表完整；exit 0） | ___ |
| tsconfig | — | **零改** | ___ |

Lint 护栏与冻结 KEEP 基线见 box `/workspace/reports/ariadne-task-94/lint-baseline.md`（tip 29ac5b2 · pnpm --filter web lint · 2 problems（2 errors / 0 warnings）· set-state-in-effect 2 = HeYeSession:88 setIndex + StudySession:106 setOrder，KEEP）；Mac 侧写手改前/改后双实跑复核同值（Mac 无 /workspace 目录，以任务书内锚数字 + 实跑双证）。
