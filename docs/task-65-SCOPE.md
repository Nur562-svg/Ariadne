# Ariadne Task 65 — SCOPE（推荐下一刀 · T64 后 · **MEGA** ~180–300+ min）

**定稿**：2026-10-24 23:14 Asia/Shanghai（CST）· **after T64 `a1f1f72`**  
**调度**：Grok Bot（executor）· 用户「Scope Ariadne MEGA Task 65 ONLY」· **MEGA** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息 · 不 commit T65 docs**）  
**Tip 前置（硬）**：目标 tip = **`a1f1f72`**（`docs(pipeline) Task 64 seed-apply-dry-run-01` atop feat `4c3621c` seed-apply-dry-run-01 atop `c8c8dbc` T63 docs）。  
- box `/workspace/Ariadne-push` 与 `origin/main` 定稿时对齐 **`a1f1f72`**。  
- 开工时 `git log -1 --oneline` 须含 `a1f1f72` / T64 docs。其下仍含 feat `4c3621c`、T63 `c8c8dbc`/`08da7c4`、T62–T28 既有。若仍停在 `4c3621c`（仅 feat）或 `c8c8dbc` 或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3 max thinking（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。  
**Standing**：验收 PASS 后 **auto-push**（写手/验收方按站规；本 SCOPE 仍不 push）。用户 zcode 配额充足——**刀子必须更大**。

**用户策略（2026-10-24）**：诚实井 T43–T53 已干；**材料→原子 pipeline 脊梁十一刀已闭**（T54 detect → T55 remediate → T56 parse → T57 dark → T58 study dark → T59 shallow prod → T60 study shallow → T61 local-draft editor → T62 draft inbox/pack/apply/port → T63 chapter quality cockpit → **T64 seed-apply dry-run + Mac-PR docs + DraftInbox CopyCommand**）。下一刀必须诚实评估 **T63 目视 QA 留下的书桌诚实缺口**：① 书架书卡徽标英键泄露 `darkRate`/`shallowRate` + 书级 4% 与驾驶舱章级 24% 看起来「对不上」（实为书级合计稀释，缺「本书」范围标注）；② DraftInbox 在 incomplete 空且无草稿时岛空白（portability 应仍可见）；③ 书卡「本机进度读取中…」疑似永挂。三者合成一条 **书架/进度诚实 MEGA**，杠杆高于纯视觉朱砂、批量重抽、Register 硬门禁、Clew suggest-only（真写 OUT；suggest-only 不敌诚实 UI leftover）。**勿**再堆 empty-CTA / return densify，**勿** redo T54–T64（可**复用** shelf 三分列 / DraftInbox / ProgressPortability / LocalProgressStrip / cockpit 深链），**勿**写 `verified:true` / Clew LLM 真写 / 自动 PATCH entities，**勿**第四书架徽列 densify，**勿**改名既有 storage keys，**勿**把章级比率假贴到书卡上「对齐观感」。

---

## 空池 CTA / return / OCR 深链 / T54–T64 井状态（硬声明）

**Empty-pool CTA densify 已饱和（T43–T51）**。  
**Return densify 已饱和（T35–T42）**。  
**T52–T53 已闭**：空·完成对称 / Quiz 书空 / Viewer←书桌 / Entity「对页」/ `pageInOcr` 鬼页 / HeYe u/z。  
**T54 已闭**：`cite-ocr-quality` · `pnpm cite-check` · extract `--strict` · ingest 质量条 · Register 软门禁 · Entity/HeYe/CiteChip「OCR 未见」。**不写 verified:true**。  
**T55 已闭**：`ocrNeighborhood` / `suggestQuoteFromOcr` / incompleteAtoms · CLI `--misses`/`--book` · ingest 补救面板 · Register incomplete · Entity/HeYe 复制级补救 · 书架 **cite** 质量徽。**剪贴板-only；不 PATCH entities**。  
**T56 已闭**：`parse-ocr-coverage` 孪生 · `pnpm parse-check` · parse.py 后置 · ingest 抽出前覆盖条 · extract 预检 · Overview/书架 **parse** 覆盖徽 · Reader 稀页提示。**不改 deriveMaterialStage 二元**。  
**T57 已闭**：`extract-page-coverage` 孪生 · `pnpm page-check` · extract 后置暗页 · ingest extracted 暗页条 · Register dark 旁挂 · Overview/书架 **暗页**徽 · Reader 暗页提示。**不发明 cite 填暗页**。  
**T58 已闭**：`examinable-coverage` 薄适配（消费 T57）· Study 页头/orphan/完成态 · HeYe orphan 旁挂 · ingest ready 暗D · Overview 练入口。**不** `emptyKind:'dark'`。  
**T59 已闭**：`extract-page-density` 孪生 · `pnpm density-check` · extract 后置浅 · ingest extracted 浅条 · Register shallow 旁挂 · Overview/书架抽出行旁挂浅 S · Reader 浅页提示（稀>暗>浅）。**不发明原子补浅**；**不**第四书架徽列 densify。  
**T60 已闭**：学习环浅密度诚实（消费 T59）· Study 页头/本页浅/完成态 · HeYe 浅旁挂 · ready 浅S · Overview 练入口浅。**不** `emptyKind:'shallow'`。  
**T61 已闭**：`ariadne.atom-draft.v1` · AtomDraftEditor · CardDraftBar · EntityCardDetail overlay · 剪贴板 `ariadne.atom-draft-patch.v1`。**永不 verified / auto PATCH / Clew 真写 / 改名键**。Atom editor **DONE**。  
**T62 已闭**：`DraftInbox` · `ariadne.atom-draft-pack.v1` · `buildSeedApplyGuide` · `ariadne.atom-draft-port.v1`（独立于 progress-port）。**人核落盘；永不一键写回仓库**。Inbox/pack/apply/port **DONE** — **本刀禁止 redo T62 收件箱主路径**（可**扩展**空岛常显壳 / 次级文案，禁止重写 inbox 列表/pack/port 形状）。  
**T63 已闭**：`chapter-quality-rollup` · `ChapterQualityCockpit` · `pnpm qa-check` · desk 六信号驾驶舱。**consume-only；无健康分圆环；无第四书架 densify；无 verified**。Cockpit **DONE** — **本刀禁止 redo T63 驾驶舱 / 重写六信号算法**（可**微调**弱面次级链色阶 / 深链文案，禁止拆六列 / 造健康分）。  
**T64 已闭**：`seed-apply-dry-run` · `pnpm seed-apply-check` · `docs/seed-apply-mac-pr.md` · DraftInbox 次级 CopyCommand。**dry-run only；无 --write/--apply；无一键写回**。seed-apply **DONE** — **本刀禁止 redo T64 dry-run / 可写 apply / Mac-PR 主文**。  
**本刀不是**又一轮 empty-CTA densify、**不是** return densify、**不是** CitePeek 正文/trap redo、**不是**重做 T46–T64（可**复用** shelf 徽装配 / DraftInbox / LocalProgressStrip / cockpit，禁止重写算法 / 拆 cockpit / 拆 DraftInbox 主路径 / 拆 seed-apply）、**不是** Clew LLM 真写（含 suggest→写实体）、**不是**自动 PATCH seed、**不是** seed-apply 可写模式、**不是**批量重抽队列 chrome densify、**不是** Register API 硬门禁、**不是**第四书架徽列、**不是**把书卡比率改成章级假数「对齐观感」、**不是**健康分圆环 / 掌握%。

相邻最强产品主题 = **T63 目视留下的书桌诚实三连：书架徽标中文+书/章范围诚实 · DraftInbox 空岛常显壳（portability 可发现）· 本机进度条不永挂读取中**（朱砂弱面降噪可作小字母）。

### 真源对照（tip `a1f1f72` 实测 · 写进合同）

| 信号 | 章 ch01 | 书 immunology-3rd（6 章合计） |
|------|---------|-------------------------------|
| 暗 | 暗 4 · darkRate **23.5%**（实质 17） | 暗 4 · darkRate **4.5%**（实质 89） |
| 浅 | 浅 3 · shallowRate **17.6%** | 浅 3 · shallowRate **3.4%** |

书级 4%/3% **数学正确**（`pnpm page-check -- --book immunology-3rd`）。UI 当前在 `(desk)/page.tsx` L401–404 字面嵌入英文键：`暗${n}（darkRate X%）` / `浅${n}（shallowRate Y%）`；同漏在 `RegisterMaterialButton.tsx` L174/181、`ingest/page.tsx` L350/363。驾驶舱已用中文「（24%）」无英键——书架应对齐中文 + 明示「本书」。

DraftInbox：`draftedIds.length===0` 且 `incompleteNoDraft.length===0` 时仅剩折叠 `DraftPortBlock`，无常显标题壳 → 岛看似空白（T62 gap；ProgressPortability 有常显 h2，DraftInbox 无对称壳）。

LocalProgressStrip：`ready===false` 时固定「本机进度读取中…」；若 hydrate / localStorage 异常导致永 false 或极慢，书卡永挂。合同 = **永不永挂**；失败 → 静默 0 计数或「本机暂无进度」，不装掌握%。

---

## 诚实评估 · 候选对照（挑 ONE）

| 候选 | 杠杆 | 风险 | 判定 |
|------|------|------|------|
| **书架徽诚实 + DraftInbox 空岛壳 + 进度条不永挂（本刀 · 可并朱砂小字母）** | T63 目视最高 leftover：英键泄露 + 书/章比率误解 + 空岛不可发现 portability + 疑似永挂读取中。三薄刀合成一条 MEGA 诚实面。 | 若滑向第四书架 densify / 假贴章级%到书卡 / empty-CTA densify / redo DraftInbox 主路径 / 健康分 = 拒收。合同可写死「中文+范围标注 + 常显壳 + fail-closed 进度」。 | **开作本刀主题** |
| 书架徽英键/比率 **单独** | 中 | 真 bug 但单独偏薄；比率误解需文案+范围，并空岛更完整 | **拒单独**（并进本刀） |
| DraftInbox 空岛 **单独** | 中 | T62 gap 真；单独不够 MEGA | **拒单独**（并进本刀） |
| 卡住「本机进度读取中…」**单独** | 中低 | 可能是 hydrate 闪现；需 fail-closed 合同；并进更稳 | **拒单独**（并进本刀） |
| 弱面朱砂密度 **单独** | 低 | 美学 alone 弱；可作本刀小字母 | **拒单独**（可并 G/H 小面） |
| Clew read-only suggest / dry-run knife | 中 | 用户给了 API 试能力但禁大量解析；真写 OUT；suggest-only 易滑写实体；**不敌**诚实 UI leftover | **拒本刀**（DEFER；铁合同另开） |
| 批量重抽 UX | 低中 | chrome densify | **拒** |
| Register API 硬门禁 | 中 | Soft leftover；硬阻断伤导入 | **DEFER** |
| invent heye-only | — | OUT 邻域 | **OUT/DEFER** |
| quiz densify / empty-CTA / return densify | 无 | 井饱和 | **拒** |
| 重做 T54–T64 / cockpit / DraftInbox redo / seed-apply redo | 无 | 刚闭 | **拒** — 只复用/最小扩展 |
| CitePeek / OCR canvas / verified:true / Clew 真写 / FSRS / 改名键 / 掌握% / 健康分圆环 / 第四书架 densify / seed-apply 可写 | — | OUT forever | **OUT** |

**结论**：开 **`shelf-progress-honesty-01`**。合同必须写死进 SCOPE / paste / J。若写手滑向第四书架 densify / 书卡假贴章级% / empty-CTA densify / verified:true / Clew 真写 / auto PATCH / 改名键 / redo DraftInbox 主路径 / redo cockpit 六列 / seed-apply 可写 / 健康分圆环 = **拒收**。

**残余风险（写进 SCOPE）**：写手把书级 darkRate 改成 ch01 的 24%「好看」、或加第四大红徽列、或 DraftInbox 空态做成大红 empty-CTA、或进度条失败时装掌握%、或借机 Clew 真写 / 批量重抽队列 / Register 硬门禁 / 发明视觉 polish 主题 = 拒收。英键清理须覆盖 shelf + ingest + Register（同漏）。Next.js security = ops not theme。Clew suggest-only / invent heye-only / Register 硬门禁 / quiz densify = leftover → 后续刀。

---

## 推荐一刀（ONE · MEGA）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`shelf-progress-honesty-01`** |
| **Title** | 书架/进度诚实 · 徽标去英键 + 本书范围标注 · DraftInbox 空岛常显壳 · 本机进度条不永挂 · 弱面朱砂降噪（小）· 永不第四徽列 / 健康分 / Clew 真写 |
| **体量** | **~180–300+ min** 真实编码（**A–J** = 10 切片 · 3 子主题）。**若只交文案替换不修空岛/不修进度 fail-closed 就收工 = 漏做 = 拒收**。**若 15–30 / 90 分钟假装收工 = 漏做**。**若滑向第四书架 densify / 假贴章级% / empty-CTA densify / redo DraftInbox/cockpit/seed-apply = 主题偏了，拒收**。 |
| **产品脊梁** | 顾客材料 → OCR → 抽出 → 质量可见（T54–T60）→ 草稿+收件箱+驾驶舱+干跑（T61–T64）→ **本刀：书架书卡徽标诚实中文+本书范围 · 效用区 DraftInbox 空岛可发现 · 书卡本机进度条 fail-closed 不永挂 → 顾客一眼信书卡数字、找得到草稿带走、进度条不再卡死**。 |

**一句话**：在 **`a1f1f72`（T64）** 上，修 **书架/ingest/Register 英键泄露 + 书级比率「本书」诚实标注（数学保持书级合计，不假贴章级）** + **DraftInbox 空岛常显静默壳（portability 可发现）** + **LocalProgressStrip（书卡）永不永挂「本机进度读取中…」** + **可选弱面朱砂降噪**。**禁止** empty-CTA densify、return densify、CitePeek 正文/trap redo、重做 T46–T64、写 `verified:true`、自动写 entities/blocks、Clew LLM 真写、FSRS、invent heye-only、ModeChips 插队、Queue→Due、⌘K、DeskShell 重写、改名既有 storage keys、把 draft 塞进 progress-port、第四书架徽列 densify、`emptyKind:'dark'|:'shallow'`、seed-apply 可写、「一键写回仓库」、掌握%、健康分圆环、把书卡比率改成章级假数、push。

---

## honesty 合同（硬 · 写进每个字母）

1. **英键出 UI**：顾客可见文案禁止字面 `darkRate` / `shallowRate` / `missRate` 等英键；改中文「暗率」「浅率」或「占实质页 X%」（CLI stdout / `data/qa` JSON 字段名可保留英键——那是机读）。覆盖：`(desk)/page.tsx` 书卡徽、`ingest/page.tsx` 章行、`RegisterMaterialButton.tsx` 软确认旁挂。  
2. **书级 ≠ 章级**：书卡数字 = 书级合计（与 `pnpm page-check -- --book <id>` 同真）；须带「本书」范围；可选一行次级「弱章见章质检驾驶舱」——**禁止**把 ch01 的 24% 假贴到书卡。  
3. **不造第四书架徽列**：cite | parse | 暗（浅旁挂）骨架不动；不新增大红独立列；不健康分圆环。  
4. **DraftInbox 空岛常显壳**：无草稿且 incomplete 空时仍有静默 utility 壳（标题 + 免责 + 空态短句 + `DraftPortBlock` 可发现）；对齐 ProgressPortability「常显 h2」节奏；**禁止**大红 empty-CTA densify / 「去抽卡」营销主 CTA。  
5. **不 redo DraftInbox 主路径**：有草稿列表 / pack 导出 / guide / port import / T64 CopyCommand 形状保留；本刀只补空态壳与诚实文案。  
6. **进度条永不永挂**：`LocalProgressStrip`（书卡必交；Study/HeYe/Clew 同文案组件建议同修）`ready` 路径 fail-closed——localStorage 抛错 / 不可用 → 仍 `ready=true` + 空计数或「本机暂无进度」；**禁止**永挂「本机进度读取中…」；**禁止**装掌握%/Due。  
7. **不 redo cockpit 算法**：六信号 / rollup / qa-check 不动；弱面次级链色阶可降噪（朱砂→muted/琥珀，精炼书桌）。  
8. **永不** Clew LLM 真写 / invent 原子 / 批量重抽写回 / Register 硬 API / seed-apply 可写 / verified:true / 改名键 / draft→progress-port。  
9. **不 redo T54–T64**：禁止重写 cite/parse/dark/shallow 算法、拆 cockpit、拆 seed-apply dry-run、重做 AtomDraftEditor。  
10. **精炼**：无营销英雄；无新朱砂主 CTA；效用文。

---

## 三子主题

| # | 子主题 | 字母 |
|---|--------|------|
| 1 | 书架/ingest/Register 徽标诚实（去英键 + 本书范围） | A · B · C |
| 2 | DraftInbox 空岛常显壳 + portability 可发现 | D · E · F |
| 3 | 进度条 fail-closed + 诚实文案 + 弱面朱砂小降噪 | G · H |
| — | 装配收口 + build + DEFER + 回归 | I · J |

---

## 字母一览（A–J）

| 字母 | 切片 | 估分 |
|------|------|------|
| **A** | 书架书卡抽出偏稀徽（`(desk)/page.tsx` L392–411 一带）：① 去掉字面 `darkRate`/`shallowRate`；② 文案带「本书」；③ 比率用中文「暗率 X% / 占实质页 X%」；④ 可选次级 muted「弱章见下方章质检驾驶舱」（勿新按钮列）；⑤ **数学保持** bookExtractPage/bookDensity 书级合计（4/89≈4%），禁止假贴章级 24%；⑥ **不**拆 cite\|parse\|暗 三分列、**不**造第四徽列 | 30–45 |
| **B** | ingest 章行英键清理（`ingest/page.tsx` L350/363）：暗/浅行顾客文案去 `darkRate`/`shallowRate` 字面；口径与 CLI 同真；弱章琥珀不变；**不**改 deriveMaterialStage / 不造重抽队列 chrome | 20–35 |
| **C** | `RegisterMaterialButton.tsx` 软确认旁挂英键清理（L174/181）；保持软门禁（非硬 4xx）；文案中文；**不** Register API 硬门禁 | 15–25 |
| **D** | DraftInbox 空岛常显壳：当 `draftedIds.length===0` 且 `incompleteNoDraft.length===0` 时仍渲染静默 `<section>` 壳——标题「本机草稿收件箱」、`INBOX_DISCLAIMER`、一行 muted「暂无本机草稿 · 无不完备待补」、保留 `DraftPortBlock`（折叠可发现）；视觉对齐 ProgressPortability 常显节奏（border/card/h2 级克制，勿大红）；**禁止** empty-CTA densify | 35–50 |
| **E** | 有草稿 / incomplete 路径回归：列表、pack/guide 导出、T64 CopyCommand、port import **形状保留**（最小 diff）；空壳与非空态切换不闪；注释写明 T62/T64 主路径不 redo | 20–30 |
| **F** | （可选增强，建议交）空壳内一行次级链到「本机进度带走」或驾驶舱说明「草稿 ≠ 进度包」——纯文案/锚点，勿新 SPA 路由；可砍 | 10–20 |
| **G** | `LocalProgressStrip` fail-closed：① `useEffect` 内 try/catch loadGrades/loadHeYeStore，异常仍 `setReady(true)`；② 永不可用 storage → 静默空计数或「本机暂无进度」（勿永挂读取中）；③ 书卡必交；建议同修 `StudyScopeCounts` / `HeYeScopeCounts` / ClewPane 同文案分支（同族）；④ **禁止**掌握%/Due/圆环 | 30–45 |
| **H** | 诚实文案 + 主题短文 `docs/task-65-shelf-progress-honesty.md` + **小**：cockpit 弱面次级 Copy/viewer 链朱砂降噪（`text-cinnabar` → muted/琥珀 hover，主强调留给真动作）——精炼书桌；**禁止**以视觉 polish 当主题膨胀 | 20–35 |
| **I** | 装配：shelf / ingest / Register / DraftInbox / LocalProgressStrip（±同族）最小 diff；**勿**毁 DraftInbox 主路径 / AtomDraftEditor / CardDraftBar / ChapterQualityCockpit 六列算法 / ProgressPortability / shelf 三分列 / cite/parse/暗/浅算法 / deriveMaterialStage / study/heye 键 / ProgressPayload / seed-apply-check | 25–40 |
| **J** | `pnpm --filter web build` PASS；`pnpm cite-check -- ch01` + `parse-check` + `page-check` + `density-check` + `qa-check -- ch01` + `seed-apply-check`（夹具）回归绿；目视/文案断言：书卡无英键 `darkRate`/`shallowRate`、含「本书」、空 DraftInbox 仍见壳、进度条不永挂；明示合同；DEFER：Clew suggest-only / 批量重抽 / invent heye-only / Register 硬门禁 / quiz densify；禁止 verified/写 seed/第四书架/改名键/假贴章级%/健康分；写手不 push | 20–30 |

**合计估**：约 **225–395** 分钟（落在 180–300+ MEGA 窗；偏紧可压 F 为「不做空壳锚点」、压 H 朱砂降噪为「仅文档不改色」——**不可**砍 A/B/C/D/E/G/I/J；H 主题短文最小面仍须交）。若写手体感超额，优先保 A–E–G–I–J，B/C 最小面仍须交（同漏），F 可砍，H 朱砂可砍、短文不可砍。

---

## 硬 OUT（本刀 + 站规 forever）

FSRS/Due · Clew LLM 真写（含 suggest 后自动写实体）· **写 `verified:true` 过关** · **自动写回 / PATCH entities.json 或 blocks.json** · **seed-apply 可写 / `--write` / `--apply`** · OCR canvas · CitePeek **正文/trap** redo · ⌘K · Queue→Due · DeskShell 重写 · exam-anchor 全量 · invent heye-only seed · ch08+ · nur-landing · 掌握% · **改名既有 storage keys** · 强制清空整栈 · ModeChips 中插队 · **return densify 当主题** · **empty-CTA densify 当主题** · **重做 T46–T64（含 DraftInbox 主路径 redo / cockpit 六列 redo / AtomDraftEditor redo / seed-apply redo）** · Next.js upgrade 当主题 · 假池 · 只交空 docs 无 UI 诚实修复就收工 · 写手 push · 硬阻断 register API · 把草稿伪造成 seed 已核或 heye 已对 · 假云端 OCR / 假进度条 · 改 `deriveMaterialStage` · 自动给浅/暗页发明原子 · 吞改 HeYe orphan 分型 · `emptyKind:'dark'` · `emptyKind:'shallow'` · **第四书架徽列 densify** · 借机给空池加新大红主 CTA densify · **把 draft 键塞进 progress-port study/heye 包** · 「一键写回仓库」CTA · 合成单一「健康分/掌握%」圆环 · **把书卡书级比率假改成章级 %「对齐观感」** · Clew 用用户 API 做大量解析当本刀主题。

Soft：Clew read-only suggest-only 铁合同刀 / 批量重抽队列 UX / invent heye-only / Register API 硬门禁 / quiz·study 深度 densify = leftover → 后续刀；Next.js security = ops not theme。

---

## 建议路径

```
apps/web/app/(desk)/page.tsx                 # A 书卡徽文案（本书 + 中文率；数学不动）
apps/web/app/(shell)/ingest/page.tsx         # B 章行去英键
apps/web/components/RegisterMaterialButton.tsx # C 软确认旁挂去英键
apps/web/components/DraftInbox.tsx           # D/E 空岛常显壳（主路径最小 diff）
apps/web/components/LocalProgressStrip.tsx   # G fail-closed 不永挂
apps/web/components/StudyScopeCounts.tsx     # G 建议同修（同文案）
apps/web/components/HeYeScopeCounts.tsx      # G 建议同修
apps/web/components/desk/ClewPane.tsx        # G 建议同修读取中分支（勿 Clew 真写）
apps/web/components/ChapterQualityCockpit.tsx # H 可选弱面链色降噪（勿拆六列）
docs/task-65-shelf-progress-honesty.md       # H 主题短文
# 勿毁：DraftInbox 主路径 · AtomDraftEditor · CardDraftBar · ChapterQualityCockpit 算法 ·
#       ProgressPortability · shelf cite|parse|暗 · cite/parse/dark/shallow libs ·
#       buildSeedApplyGuide / seed-apply-dry-run · ClewPane 写路径禁区 · ModeChips ·
#       book-pools · return-stack · deriveMaterialStage · progress-port study/heye 形状
# 勿写：data/cards/*.entities.json · verified:true · Clew 真写 API · ProgressPayload.draft
# 勿假数：书卡 darkRate/shallowRate 改成章级 % 
# 可复用：ProgressPortability 常显壳节奏 · INBOX_DISCLAIMER · bookExtractPage/bookDensity ·
#         rollup / qa-check · CopyCommand · LocalProgressStrip 池计数
```

---

## 验收口令

做完叫验收。A–J 全交才过。
