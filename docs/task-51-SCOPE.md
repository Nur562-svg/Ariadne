# Ariadne Task 51 — SCOPE（推荐下一刀 · T50 后 · **MEGA** ~180–300+ min）

**定稿**：2026-10-24 00:09 Asia/Shanghai（CST）· **after T50 `c99d7ec`**  
**调度**：Grok Bot（executor）· 用户「Scope and write Ariadne Task 51 — MUCH LARGER…试着把一刀砍的更大，很大很大」· **MEGA** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息**）  
**Tip 前置（硬）**：目标 tip = **`c99d7ec`**（`feat(desk) Task 50 desk-shelf-continuity-empty-01`：书架续开页级练/核空池；Footer/LibraryContinuity/Sidebar 空池；`book-pools.ts` + page/layout 装配）。  
- box `/workspace/Ariadne-push` 定稿时停在 **`c99d7ec`**（`origin/main` 对齐）。  
- 开工时 `git log -1 --oneline` 须含 `c99d7ec` / T50 desk-shelf-continuity-empty；其下仍含 T49 desk-ingest-opendesk-citepeek-empty、T48 desk-review-gate-rail-sticky、T47–T28 既有。若仍停在 `691915a`（仅 T49）或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。  
**Standing**：验收 PASS 后 **auto-push**（写手/验收方按站规；本 SCOPE 仍不 push）。用户 zcode 配额充足——**刀子必须更大**。

**用户反馈（2026-10-24）**：「试着把一刀砍的更大，很大很大」；配额充足。本刀选 **ONE** 连贯 **MEGA** 主题（**A–J** · ~180–300+ min · 3 个共享池口径的诚实子主题捆成一刀）：

1. **Clew 右栏练/核 CTA 空池**（T50 ACCEPT soft leftover：Clew stub「去学习环/去核页」densify —— 扩成 stub 气泡 + chat 空态 + Changes 空态 + Queue 主 CTA 一整包）  
2. **书桌中栏 Strip / 书头 / Quiz 空池**（LocalProgressStrip「练此范围/核此范围」恒可点；书头「学习环 · 自评」无视 chapterAtoms；Quiz「去核页」T45 只门禁了练侧）  
3. **练↔核交叉离面空池**（sticky CrossScope「去核/去练同范围」；StudySession/HeYeSession 空·完成态交叉链；study 空态「核本卡」）

**不是** return densify、**不是** 重做 T46–T50、**不是** 洗衣单无关杂务。复用 `progressAtoms` / `progressItems` / `collectStudyAtoms` / `collectCiteQueue` /（可选）`book-pools` 同族 —— fail-closed 缺省当 0。

**诚实评估**：T35–T42 return 井饱和；T43–T50 已闭 QS/键帽/Clew 列表文案/quiz-scope/书架 OCR/TOC·kind·Continuity/核门禁·sticky N/ingest·CitePeek/书架续开·footer·侧栏空池。Empty-pool densify 在 shelf/continuity/CitePeek/ingest **大体闭**。审计 tip `c99d7ec` 上**下一最大**「恒可点 / 装能进空」残差：

| # | 面 | 撒谎 |
|---|----|------|
| ① | Clew stub 气泡「去学习环 →」「去核页 →」 | **恒 push**——不看 `progressAtoms`/`progressItems`（T50 soft leftover） |
| ② | Clew chat 空态「学习环自测 / 核页对页」（有书路径） | **恒可点**——同族 |
| ③ | Clew Changes 空态 / 筛空侧「去学习环自评 / 去核页对页」 | **恒可点**——同族 |
| ④ | Clew QueuePanel 主 CTA「打开核页工作台 / 去学习环」 | **恒可点**——分段 N=0 已纯文，主 CTA 仍装能进空范围池 |
| ⑤ | LocalProgressStrip「练此范围 →」「核此范围 →」 | **有 href 即链**——`atoms.length===0` / `items.length===0` 仍可进空（书桌章空原子、孤儿页回落章池为空时） |
| ⑥ | DocumentPane 书头「学习环 · 自评 →」 | **恒可点**——Overview 章行已对 `chAtoms===0` 门禁，书头同章仍装能进空练 |
| ⑦ | QuizPanel「去核页 →」 | **恒可点**——T45 已门禁练侧 atomCount；核侧 `items.length===0` 未跟 |
| ⑧ | sticky CrossScope「去核同范围 / 去练同范围」 | **恒可点**——对侧 `stripItemKeys`/`stripAtoms` 可为 0 |
| ⑨ | StudySession 空·完成态「核本卡 / 去核页」+ study 空态「核本卡」 | **恒可点**——对侧 pending 可为 0（轨/CardHub/T48–T50 已门禁同池族） |
| ⑩ | HeYeSession 空·完成态「去学习环 / 去学习本卡」 | **恒可点**——对侧原子可为 0 |

捆成 **ONE MEGA** Clew·Strip·交叉离面空池诚实刀（产品脊梁：顾客材料 → 可考原子/待核 cite → **右栏 Clew / 书桌中栏 / 练核交叉离面同真不进空池**）。

---

## 推荐一刀（ONE · MEGA）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`desk-clew-strip-cross-empty-01`** |
| **Title** | Clew 右栏练核 CTA 空池 · 书桌 Strip/书头/Quiz 空池 · 练核交叉离面空池 |
| **体量** | **~180–300+ min** 真实编码（**A–J** = 10 相关切片 · 3 子主题）。**若 90–150 分钟就收工且只做 Clew 一包 = 漏做中栏/交叉切片**。**若 15–30 分钟收工 = 严重漏做**。 |
| **产品脊梁** | 顾客材料 → 注册 → 可考原子/待核 → **日用：Clew 点练核、书桌 Strip/书头/自测、练完去核 / 核完去练 —— 与轨顶·Overview·书架·ingest 同真空池**。 |

**一句话**：在 **`c99d7ec`（T50）** 上，让 **Clew stub/空态/Changes/Queue 练核 CTA 对 `progressAtoms`/`progressItems` 空池门禁**、让 **LocalProgressStrip 条末 + 书头「学习环·自评」+ Quiz「去核页」对当前 strip 池空门禁**、让 **sticky CrossScope + Study/HeYe 空·完成态交叉链对对侧池空门禁**。**禁止** 又一轮 saveReturn densify、重做 T46–T50、FSRS、Clew LLM 真写、`verified:true`、掌握 %、OCR canvas、exam-anchor、ch08+ seed、nur-landing、重做 CitePeek **正文**/trap、QueuePanel→Due、⌘K、DeskShell 重写、invent heye-only seed、改名 storage keys、强制清空整栈、整段 port ariadnemini版 verify/clew-API、ModeChips 会话中插队、ScopeCounts 再加 return、Entity「对页」return、ShortcutSheet、push。

**为何选这主题（对照候选）**：

| 候选 | 判定 |
|------|------|
| **Clew CTA 空池 + Strip/书头/Quiz + 交叉离面（本刀 · A–J）** | T50 显式 soft leftover（Clew stub）+ 审计新见中栏/交叉同族谎；最高杠杆**非 return、非 T46–T50-redo**；共享 progress*/collect*；体量天然 MEGA |
| 只做 Clew stub 一处 densify | **拒** — 太薄；用户要很大很大 |
| 又一轮 saveReturn / remember* | **拒** — return 井干 |
| 重做 T46–T50（书架/Continuity/ingest/CitePeek/…） | **拒** — 刚闭；只回归 |
| heye-only invent / Clew LLM / FSRS / Queue→Due | **OUT forever** / DEFER invent |
| Next.js security upgrade | **ops note** — 非刀主题 |
| 纯 a11y / DeskShell 质感 | **拒** |

**Avoid**：重做 T50 Shelf/Footer/LibraryContinuity/Sidebar/`book-pools`；重做 T49 ingest/CitePeek；重做 T48 核门禁/sticky N/CardVs/Overview 章行；重做 T47 Continuity **0-OCR 壳**/TOC/KINDS；重做 T46 书架 OCR/换书/模式；重做 T45 QuizPanel **练侧** atomCount 门禁语义（本刀只补核侧）；重做 T43–T44 Clew Changes 筛选/截断/空态分型文案骨架（本刀只给 CTA 加空池门禁）；Queue→Due；ModeChips 会话插队；只给 Clew stub 一处降级或只改 Strip 一处就收工。

---

## 为何现在 · 为何是 MEGA（~180–300+）

T20–T50 把「读页→练→核→回」与 **mode / return / QS·键帽·Clew 列表·quiz·书架 OCR·TOC/kind·核空池·sticky·ingest·CitePeek·书架续开/侧栏** 做厚后，日用路径上仍露**非 return、非 T46–T50-redo**撒谎，且卡在**右栏 Clew + 中栏 Strip/书头/自测 + 练核交叉**：

1. **入口已诚实、Clew 未跟**：轨顶/Overview/书架/ingest/CitePeek CTA 已空池门禁——Clew stub/空态/Changes/Queue **仍恒可点进空练/空核**（T50 ACCEPT 点名 leftover）。  
2. **书桌中栏互谎**：Overview「练本章」已门禁 `chAtoms`；书头「学习环 · 自评」同章恒链；Strip 条末有 href 即链，无视 `atoms`/`items` 长度；Quiz 练侧已门禁、核侧未跟。  
3. **交叉离面互谎**：sticky「去核/去练同范围」与会话空·完成态「去核页/去学习环」不看对侧池——轨/CardHub/T48–T50 已对同池族门禁。  
4. **共享装配**：三子主题都吃 `progressAtoms`/`progressItems` 或同页 `stripAtoms`/`stripItems`/`chapterAtoms`/`heyeItems`——一次口径、多面下传；自然扩成 A–J。  
5. **heye-only 活页**：仍 DEFER；勿 invent。Next.js 安全升级 = ops，非主题。

体量：A–D Clew 四切 · E–G 中栏三切 · H–J 交叉+收口 —— **不是** 90–150 薄 XL；**不是** return 刀；**不是** T46–T50 重做。

---

## 代码缺口（对照 `c99d7ec`，开工前再对一眼）

| 面 | 现状 | 撒谎 / 残差 |
|----|------|-------------|
| 书架续开/Footer/Continuity/Sidebar 空池 | T50 已闭 | **已闭** — 只回归 |
| ingest 开书桌 / CitePeek 浮层 CTA | T49 已闭 | **已闭** |
| 轨顶/瓷砖/搜索/Overview 章行核练门禁 | T48 已闭 | **已闭** — 对齐基准 |
| Clew stub 气泡「去学习环/去核页」 | **恒可点** | progress* 空 → **A** |
| Clew chat 空态自测/核页 | **恒可点** | 同族 → **B** |
| Clew Changes 空态/筛空 CTA | **恒可点** | 同族 → **C** |
| Clew Queue 主 CTA | **恒可点** | 同族 → **D** |
| LocalProgressStrip 条末练/核 | **有 href 即链** | atoms/items===0 → **E** |
| DocumentPane 书头「学习环 · 自评」 | **恒可点** | chapterAtoms===0 → **F** |
| QuizPanel「去核页」 | **恒可点** | items===0 → **G** |
| sticky CrossScope | **恒可点** | 对侧池 0 → **H** |
| StudySession / study 空态交叉核 | **恒可点** | 对侧 pending 0 → **I** |
| HeYeSession 交叉练 | **恒可点** | 对侧 atoms 0 → **J**（+build） |
| heye-only 活页 | immunology-3rd 无 | **DEFER**；勿 invent |
| 又一轮 return / 重做 T46–T50 | — | **OUT** |

---

## IN（硬 · 一 zcode 会话必须全部做完 · **A+B+C+D+E+F+G+H+I+J**）

### A. Clew stub 气泡「去学习环 / 去核页」空池（核心 · T50 leftover）

1. `ClewPane.tsx` `send()`：组装 `links` 时读 `clew.progressAtoms?.length ?? 0`、`clew.progressItems?.length ?? 0`（缺省 0 · fail-closed）。  
2. 原子===0 → 不推可点「去学习环 →」；改 muted 纯文「暂无原子」（或「本范围暂无原子」）；pending===0 → 「去核页 →」同理「暂无待核」。`>0` 保持 ActionLink + 既有 returnTo 快照。  
3. 「对页 p.N」有页即保持（非空池主题）。  
4. **不做**：Clew LLM；改 stubReply 长文骨架（可极小对齐用词）；Queue→Due；拆 T33 return 快照。

### B. Clew chat 空态「学习环自测 / 核页对页」空池（核心）

1. 有书空态路径（T44 C）：「学习环自测」「核页对页」同 A 池门禁；===0 → muted 纯文；`>0` 保持 Link + `rememberClewReturn`。  
2. 无书冷启动路径：无 progress 池——「学习环自测」降纯文或保持仅在有书后出现（推荐：无书路径不推练核链进空全局池；保留「导入→书架→书桌」；若保留自测链则必须对全局/无池说真话「书库未定位范围」类纯文，**禁止**朱红进裸 `/study` 装能练）。  
3. **不做**：重做 T44 有书/无书分型文案骨架；拆 return。

### C. Clew Changes 空态 / 筛空 CTA 空池（核心）

1. `ChangesPanel`：空态「去学习环自评 / 去核页对页」与筛空单侧 CTA 同 A 池门禁。  
2. ===0 → 纯文；`>0` 保持 + `rememberReturn`。  
3. **不做**：重做 T43 D 筛选/截断「还有 N」逻辑；改本轮标记数据模型。

### D. Clew QueuePanel 主 CTA 空池（核心）

1. 「打开核页工作台 →」：`progressItems` 长度===0（或 `!hasPool`）→ muted 纯文「暂无待核」/「未定位章 · 暂无范围池」（与上方无池文案同族）；`>0` 保持朱红主 CTA + rememberReturn。  
2. 「去学习环 →」：`progressAtoms` 长度===0 同理纯文「暂无原子」。  
3. 分段 N>0/N=0（T36/T40）只回归。  
4. **硬禁**：QueuePanel→Due / FSRS / 掌握%。

### E. LocalProgressStrip「练此范围 / 核此范围」空池（核心）

1. `LocalProgressStrip.tsx`：`studyHref` 存在且 `atoms.length===0` → 不渲可点「练此范围 →」，改 muted「暂无原子」（或省略）；`items` 同理「核此范围 →」/「暂无待核」。  
2. `>0` 保持链 + 既有 returnTo。分段 seg N=0 纯文只回归。  
3. **不做**：重做 Strip 视觉；发明第二套计数；拆 returnTo。

### F. DocumentPane 书头「学习环 · 自评」章空池（核心）

1. 书头「学习环 · 自评 →」：`chapterAtoms.length===0`（与 Overview `chAtoms` / strip 章回落同池）→ muted 纯文「本章暂无原子」（或「暂无原子」）；`>0` 保持链 + `rememberDeskCardReturn`。  
2. 「练本页 p.N」已由 `studyPageScope` 门禁——只回归。  
3. **不做**：重做 Overview 章行（T48 F）；重做 T46/T47 Continuity；假原子。

### G. QuizPanel「去核页」空池（核心）

1. `items.length===0` →「去核页 →」muted 纯文「暂无待核」；`>0` 保持 + rememberReturn。  
2. 练侧 atomCount 门禁（T45 A）只回归——勿改降级放宽链语义。  
3. 内嵌 Strip 吃 E 后自动诚实——只回归接线。

### H. sticky CrossScope 对侧空池（核心）

1. `/study` sticky「去核同范围 →」：对侧 `stripItemKeys.length===0`（或同页 heye 池长度）→ muted 纯文「同范围暂无待核」；`>0` 保持 `CrossScopeReturnLink`。  
2. `/review` sticky「去练同范围 →」：对侧 `stripAtoms.length===0` →「同范围暂无原子」。  
3. 实现：扩展 `CrossScopeReturnLink` 支持 `empty?: boolean` + `emptyLabel` **或** 宿主三元渲染纯文——二选一，须 fail-closed。  
4. **不做**：DeskShell 重写；改 sticky 铬件布局大改；拆 returnTo。

### I. StudySession + study 空态交叉核空池（核心）

1. `StudySession` 空队列 / 完成态「核本卡 →」「去核页 →」：props 增 `pendingCount?: number`（或 `reviewPoolCount`；缺省 0 fail-closed）——===0 → 纯文「暂无待核」/「本卡暂无待核」；`>0` 保持 + leaveReturnTo。  
2. `study/page.tsx` 空原子分支「核本卡 →」CrossScope：同对侧 pending（`heyeItems.length` 或 card 级 collectCiteQueue）门禁。  
3. 父页装配：用已有 `heyeItems` / `stripItemKeys.length` / `collectCiteQueue` 同池族——**禁造假正数**。  
4. **不做**：重做 ModeChips；重做 orphan 文案骨架（T43）；拆 leaveReturnTo。

### J. HeYeSession 交叉练空池 + build / DEFER / 回归（收口）

1. `HeYeSession` 空/完成态「去学习环 →」「去学习本卡 →」：props 增 `atomCount?: number`（缺省 0）——===0 → 纯文「暂无原子」/「本卡暂无原子」；`>0` 保持 + leaveReturnTo。  
2. `review/page.tsx` 装配对侧 `collectStudyAtoms` / `stripAtoms.length` 同池。  
3. `pnpm --filter web build` PASS；**不要 push**（站规 auto-push 由验收 PASS 后处理）；朱红唯一；精炼书桌。  
4. heye-only：**DEFER**——禁止 invent seed；回复写明 deferred。  
5. 回归：T50 Shelf/Footer/Continuity/Sidebar/`book-pools`；T49 ingest/CitePeek；T48 核门禁/sticky N/CardVs/Overview；T47 Continuity 0-OCR 壳；T46 书架；T45 Quiz **练侧**；T44 Clew 空态分型骨架；T43 Changes 筛选/截断；T42–T28 leaveReturn / sticky CrossScope **return 接线未拆**；ModeChips 未会话插队；CitePeek **正文/trap 未毁**；Queue **未改 Due**。

---

## OUT（显式 · Standing forever + 本刀）

| 不做 | 原因 |
|------|------|
| FSRS / Due / Clew LLM 真写 / Proposal 真写 / verified:true / 掌握% / invent heye-only | **OUT forever** |
| OCR canvas / CitePeek **正文**/trap redo / ⌘K / QueuePanel→Due / DeskShell 重写 / exam-anchor full / ch08+ / nur-landing | **OUT forever** |
| 改名 storage keys / 强制清空整栈 / 整段 port ariadnemini版 verify/clew-API / ModeChips 会话中插队 | **OUT forever** |
| 又一轮 saveReturn / returnTo densify 为主题 | **拒** — 饱和 |
| 重做 T46–T50 已交（书架/Continuity 壳/ingest/CitePeek/续开侧栏/`book-pools` 语义） | 已落；勿毁 |
| ScopeCounts 再加 return；Entity「对页」return；ShortcutSheet | soft OUT 延续 |
| Next.js security upgrade 当刀主题 | ops note |
| 假池 / 假 OCR / 只改 Clew stub 一处或只改 Strip 一处就收工 | 拒 |
| push（由本写手） | 禁（验收 PASS 后站规 auto-push） |

---

## Soft leftovers 收录表

| 来源 | 本刀 |
|------|------|
| T50 ACCEPT：Clew stub「去学习环/去核页」densify | **IN** — A（并扩 B/C/D 成连贯 Clew 包） |
| 审计：Strip 条末 / 书头学习环 / Quiz 去核页 | **IN** — E/F/G |
| 审计：CrossScope + Study/HeYe 交叉 | **IN** — H/I/J |
| heye-only 无活页 | **DEFER** — J |
| Next.js security upgrade | ops — **OUT** 主题 |
| 又一轮 return / 重做 T46–T50 | **OUT** |

---

## 建议改动路径（zcode 可微调，但这些面都要碰到）

```
apps/web/components/desk/ClewPane.tsx              # A stub气泡 · B chat空态 · C Changes · D Queue
apps/web/components/LocalProgressStrip.tsx         # E 条末练/核空池
apps/web/components/desk/DocumentPane.tsx          # F 书头学习环 · G QuizPanel 去核页
apps/web/components/desk/CrossScopeReturnLink.tsx  # H 可选 empty 态（或宿主三元）
apps/web/app/(desk)/study/page.tsx                 # H sticky · I 空态核本卡 + 下传 pendingCount
apps/web/app/(desk)/review/page.tsx                # H sticky · J 下传 atomCount
apps/web/components/StudySession.tsx               # I 空/完成态交叉核门禁
apps/web/components/HeYeSession.tsx                # J 空/完成态交叉练门禁
# 可选：若多处复用「空→纯文」小组件可抽，但禁第二套池口径
# T46–T50 已交面：只回归
```

---

## 自测表（zcode 回复须勾）

| # | 路由 / 面 | 期望 |
|---|-----------|------|
| 1 | Clew 对话 · 发问 stub · progress* 空 | 气泡「暂无原子/待核」纯文；有池保持链+return 快照（A） |
| 2 | Clew chat 空态 · 有书 · 空池 | 自测/核页纯文；有书/无书分型骨架未毁（B） |
| 3 | Clew Changes 空 / 筛空 | CTA 纯文；筛选/截断未毁（C） |
| 4 | Clew Queue · 无池或 atoms/items=0 | 主 CTA 纯文；分段 N=0 未毁；非 Due（D） |
| 5 | 书桌 Strip · 章/页 atoms 或 items=0 | 「练/核此范围」纯文；分段未毁（E） |
| 6 | 书桌书头 · chapterAtoms=0 | 「学习环 · 自评」纯文；练本页门禁未毁；Overview 章行未毁（F） |
| 7 | Quiz · items=0 | 「去核页」纯文；练侧 T45 未毁（G） |
| 8 | /study 或 /review sticky · 对侧池 0 | CrossScope 纯文；return 未拆（H） |
| 9 | StudySession 空/完成 · pending=0；study 空态核本卡 | 纯文；leaveReturn 未拆（I） |
| 10 | HeYeSession 空/完成 · atoms=0；build PASS；heye-only DEFER；T50–T28 回归 | J |

---

## 验收清单

- [ ] A：Clew stub 气泡空池  
- [ ] B：Clew chat 空态空池  
- [ ] C：Clew Changes CTA 空池  
- [ ] D：Clew Queue 主 CTA 空池  
- [ ] E：LocalProgressStrip 条末空池  
- [ ] F：书头「学习环 · 自评」章空池  
- [ ] G：QuizPanel「去核页」空池  
- [ ] H：sticky CrossScope 对侧空池  
- [ ] I：StudySession + study 空态交叉核空池  
- [ ] J：HeYeSession 交叉练空池 + build + heye-only DEFER + 回归  
- [ ] 体量：**A–J 全交**；**不是** 只做 Clew 就收工；**不是** return 主题；**不是** T46–T50 重做  

---

## Size rationale（给 parent · 为何 MEGA）

| 切片组 | 预估 |
|--------|------|
| A Clew stub 气泡 | ~20–30 min |
| B Clew chat 空态 | ~20–30 min |
| C Clew Changes CTA | ~15–25 min |
| D Clew Queue 主 CTA | ~20–30 min |
| E LocalProgressStrip 条末 | ~15–25 min |
| F 书头学习环章空池 | ~15–25 min |
| G Quiz 去核页 | ~10–20 min |
| H sticky CrossScope | ~20–35 min |
| I StudySession + study 空态 | ~25–40 min |
| J HeYeSession + build/回归/DEFER | ~25–40 min |
| **合计** | **~185–300+ min** |

若实现只改 Clew stub 一处降级、或只做 A–D 不做 E–J 就停——**拒收**（未达 MEGA）。若做成又一轮 saveReturn 或重做 T46–T50——**拒收**。

**为何 MEGA 不是薄 XL**：T50 leftover 单独做 Clew stub = 薄；本刀把 **同池族** 的中栏 Strip/书头/Quiz + 交叉离面一并收口，形成 3 子主题 × 10 切片，共享 progress*/collect* 装配模式——用户「很大很大」的硬目标。

---

## Deliverables / 边界

| 本 SCOPE | 不做 |
|----------|------|
| `/workspace/reports/ariadne-task-51/SCOPE.md` · brief · trae-prompt ·（可选）Mac/box `docs/` 副本 | 实现、commit、push、启动 zcode、给用户发消息 |
| tip `c99d7ec` + A–J | |

**验收口令（交给用户后）**：做完叫验收。A–J 全交才过。
