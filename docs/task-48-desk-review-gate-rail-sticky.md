# Task 48 / desk-review-gate-rail-sticky-01 — 卡面/轨/搜索「核」空池门禁 · 易混零原子 · sticky 档位计数 · Overview 章行空池（zcode）

**模型**：zcode · **GLM5.3 max thinking**（brief 格式同历史 Trae paste）  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**`3bd3401`**（`feat(desk) Task 47 desk-toc-kind-empty-gate-01`）。  
- `git log -1 --oneline` 须含 `3bd3401` / T47。若仍停在 `ec0aed5`（仅 T46）或更早——**停下来对齐，不要开工**。  
- 其后仍须含：T46 desk-shelf-ocr-mode-switcher、T45 desk-quiz-scope-card-ingest、T44 desk-keyhint-clew-empty-focus、T43 desk-qs-empty-honesty、T42 leaveReturn parity、T41–T28 既有。  
**前置**：Task 47 + … 已落 tip。**保留** shell-01 + Task 08–47。本任务**不是**又一轮 return densify，**不是**重做 T43–T47；只让 **瓷砖/搜索/轨/章行「核·练」空池与枢纽同真、易混零原子不装能练、练中 sticky 档位看得见 N**。  
**不 push**。验收后再定。

> **Slug**：`desk-review-gate-rail-sticky-01` · 对照 SCOPE：`/workspace/reports/ariadne-task-48/SCOPE.md`（或仓库 `docs/`）。  
> **体量（硬）**：用户刀子必须更大；GLM 5.3 扛 3–4 组相关 utility。目标 **约 90–150 分钟真实编码**，交 **A–F 全部**。**若 15–30 分钟收工 = 漏做切片**。**若做成以 saveReturn 为主或重做 T43–T47 = 主题偏了，拒收**。

先读 `docs/frontend-aesthetics.md`（朱红唯一 · 精炼书桌 · 效用文）。

---

## 背景（为何现在做）

| 已有（T47 @ `3bd3401`） | 缺口 |
|------------------------|------|
| SectionToc counts+0 demote；KINDS 张数；EntitySearch 筛空；Continuity 0-OCR；CardDetail 空壳 | **勿重做 T47** |
| T46 书架 OCR；换书 p.N；模式 tab；Overview 开章 0-OCR | **勿重做 T46** |
| T45 Quiz strip；CardCard/EntitySearch **练** 0 原子门禁；ingest N/M | **勿重做 T45**（本刀对齐**核**侧） |
| CardHubReturnLinks pending===0「暂无待核 cite」 | **对齐基准** — 瓷砖/搜索/轨未跟 |
| StickyStudy/HeYeModeTabs N=0 降级（T41） | **有门禁无数字** — ModeChips/TOC/ScopeCounts 有 N |
| Overview 章行练/核 | **只看 cardCount** — 章内 0 原子/0 pending 仍可点 |
| CardVsStudyLink | **恒可点** — vs 0 原子漏门禁 |

---

## 一句话目标

**瓷砖/搜索/轨「核」在 pending=0 时与枢纽同真不进空池；易混练对零原子门禁；sticky 档位标 N；Overview 章行练/核按章内原子与 pending 诚实。**

---

## 用户路径（验收脑内电影）

```
tip 3bd3401 确认含 T47

/desk?book=immunology-3rd · 实体卡 · pending=0 卡（或验收夹具）
  → CardCard「核」纯文；「练」门禁未毁（A）

/entities 搜索命中 pending=0 卡
  → 「核」纯文；练/筛空未毁（B）

章页轨 · pending=0 卡
  → 轨「核」降级；页顶核本页 / 轨练未毁（C）

卡详情易混 · vs 0 原子
  → 「练易混卡」纯文（D）

/study · /review sticky
  → 档位可见 N；N=0 非当前不可点（E）

Overview 章 · 0 原子或 0 pending
  → 练/核章行对应降级；0 OCR 开章未毁（F）

build PASS；未 push
```

---

## IN（硬 · A+B+C+D+E+F 全部 · 按序）

### A. CardCard「核 →」pending 空池门禁（核心）

**文件**：`apps/web/components/desk/DocumentPane.tsx`（`CardCard`）

1. props 增 `pendingCiteCount?: number`；父用既有 `heyePool` 按 `card.id` 计数（与 CardHub / `collectCiteQueue({cardId})` 同池族）。  
2. `===0` → muted「暂无待核」（或同义），不可点 `/review?card=&mode=open`；`>0` 保持链 + rememberReturn。  
3. **不做**：重做 T45 练门禁；Due；CitePeek 正文。

### B. EntitySearch「核 →」+ pendingByCard（核心）

**文件**：`apps/web/app/(shell)/entities/page.tsx` · `apps/web/components/EntitySearch.tsx`

1. page：一次 `collectCiteQueue()`（或合理收窄）→ `pendingByCard` 传入。  
2. EntitySearch：有 deskBookId 且 pending===0 →「核」纯文；>0 保持 + rememberListReturn。  
3. **不做**：重做练门禁 / 筛空；重做 search。

### C. 章页轨卡级「核」pending 门禁（核心）

**文件**：`ChapterPageReader.tsx` ± `entities.ts` `PageCitingCard` ± `desk/page.tsx` / DocumentPane 旁路 map

1. 每卡 pending 与 A/B 同源（扩 `pendingCiteCount` 或传 `pendingByCard`）。  
2. 轨「核」仅 pending>0 可点；===0 纯文/隐藏须诚实。页顶核本页、轨练只回归。  
3. **不做**：重做 RailMarks；Due；CitePeek 正文/trap。

### D. 易混 CardVsStudyLink 零原子门禁（核心）

**文件**：`CardVsStudyLink.tsx` · `EntityCardDetail.tsx` · desk/shell card 页装配

1. 装配 vs `atomCount`（`confusionAtomCounts` 与 confusionLinks 同遍历，或 prop）。  
2. atomCount===0 → 纯文「易混卡暂无原子」；>0 保持链 + return。  
3. **不做**：invent vs；重做本卡 CardHub 练门禁。

### E. Sticky 档位标 N（核心）

**文件**：`StickyStudyModeTabs.tsx` · `StickyHeYeModeTabs.tsx`

1. 标签旁/后缀标门控 N（与现 countOf 同源）；未 ready 勿造假正数。  
2. N=0 非当前档：保持既有纯文降级（T41 契约）。  
3. **不做**：ModeChips 会话插队；改 StickyModeGate；ScopeCounts return。

### F. Overview 章行练/核空池 + build / DEFER / 回归（收口）

**文件**：`DocumentPane.tsx` Overview

1. 章内原子===0 → 练本章纯文；章内 pending===0 → 核本章纯文；cardCount===0 / 0-OCR 开章只回归。  
2. heye-only DEFER；`pnpm --filter web build` PASS；不 push。  
3. 回归：T47–T28 列于 SCOPE；CitePeek 正文未毁；return 未拆；ModeChips 未插队。

---

## OUT（硬 · 摘要）

FSRS/Due · Clew LLM · verified:true · 掌握% · invent heye-only · 改名 keys · 清空整栈 · CitePeek **正文**/trap · OCR canvas · Queue→Due · DeskShell 重写 · ⌘K · exam-anchor · ch08+ · nur-landing · ModeChips 会话插队 · ScopeCounts/「对页」return · ShortcutSheet · return 主题 densify · 重做 T43–T47 · IngestReady 0-OCR（DEFER）· CitePeek 浮层 CTA 门禁（soft DEFER）· 假 OCR 进度 · ariadnemini 整栈 port · push。

---

## 自测（回复须勾）

1. CardCard pending=0 → 核纯文；练门禁未毁  
2. EntitySearch 同族；筛空/练未毁  
3. 轨核降级；页顶/练未毁  
4. 易混 0 原子纯文  
5. Sticky 可见 N；N=0 门禁未毁  
6. Overview 章行原子/pending 降级；0-OCR 开章未毁  
7. build PASS；未 push；T47–T28 未毁  

**验收口令**：做完叫验收。A–F 全交才过。
