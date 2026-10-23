# Task 49 / desk-ingest-opendesk-citepeek-empty-01 — ingest 打开书桌 0-OCR · 就绪三连空池 · CitePeek 浮层练/核 CTA 空池（zcode）

**模型**：zcode · **GLM5.3 max thinking**（brief 格式同历史 Trae paste）  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**`741102b`**（`feat(desk) Task 48 desk-review-gate-rail-sticky-01`）。  
- `git log -1 --oneline` 须含 `741102b` / T48。若仍停在 `3bd3401`（仅 T47）或更早——**停下来对齐，不要开工**。  
- 其后仍须含：T47 desk-toc-kind-empty-gate、T46 desk-shelf-ocr-mode-switcher、T45 desk-quiz-scope-card-ingest、T44–T28 既有。  
**前置**：Task 48 + … 已落 tip。**保留** shell-01 + Task 08–48。本任务**不是**又一轮 return densify，**不是**重做 T46–T48；只让 **ingest 开书桌与书架同真 OCR、就绪三连不装空池、摘浮层 CTA 与轨/枢纽同真空池**。  
**不 push**。验收后再定。用户 **自行粘贴**（无 auto-paste）。

> **Slug**：`desk-ingest-opendesk-citepeek-empty-01` · 对照 SCOPE：`/workspace/reports/ariadne-task-49/SCOPE.md`（或仓库 `docs/`）。  
> **体量（硬）**：用户刀子必须更大；GLM 5.3 扛 3–4 组相关 utility。目标 **约 90–150 分钟真实编码**，交 **A–F 全部**。**若 15–30 分钟收工 = 漏做切片**。**若做成以 saveReturn 为主或重做 T46–T48 = 主题偏了，拒收**。

先读 `docs/frontend-aesthetics.md`（朱红唯一 · 精炼书桌 · 效用文）。

---

## 背景（为何现在做）

| 已有（T48 @ `741102b`） | 缺口 |
|------------------------|------|
| CardCard/EntitySearch/轨「核」pending 门禁；CardVs 零原子；Sticky 标 N；Overview 章行空池 | **勿重做 T48** |
| T47 TOC/KINDS/Continuity 0-OCR 续开/CardDetail | **勿重做 T47** |
| T46 书架 OCR 四格；0-OCR「打开书桌（尚无 OCR）」；换书 p.N；模式 tab；Overview 开章 | **对齐基准（书架）** — ingest 未跟 |
| T45 ingest N/M + CopyCommand；练门禁 | **勿重做**（本刀只动就绪三连 CTA） |
| IngestReadyLinks / Register 成功三连 | **打开书桌恒可点**；无视 0-OCR；学习环/核页无视书级空池 |
| CitePeek 浮层「核本页/练本页/核本卡」 | **恒可点** — 与轨顶/CardHub 互谎；**禁碰正文** |

---

## 一句话目标

**ingest 就绪/注册「打开书桌」对 0-OCR 与书架同真；就绪三连学习环/核页对书级空池门禁；CitePeek 浮层练/核 CTA 对空池与轨/枢纽同真（只动 nav，不动 quote/trap）。**

---

## 用户路径（验收脑内电影）

```
tip 741102b 确认含 T48

/ingest · ready · 0-OCR 书（或验收夹具）
  → 「打开书桌（尚无 OCR）」outline/muted；>0 朱红（A）

extracted → 注册成功 · 0-OCR
  → 成功态「打开书桌」点名尚无 OCR（B）

ready · 书级 0 原子或 0 pending
  → 「学习环」/「核页」对应纯文；N/M+CopyCommand 未毁（C）

章页轨「摘」· 本页 0 原子 / 0 pending / 卡 0 pending
  → 浮层对应 CTA 纯文；quote/trap/定位未毁（D/E）

卡详情 / 瓷砖「摘」· 卡 0 pending
  → 「核本卡」纯文；CardHub 未毁（E）

study/review 内「摘」（有 counts 时）
  → 空池降级或未传保持链；正文未毁（F）

build PASS；未 push
```

---

## IN（硬 · A+B+C+D+E+F 全部 · 按序）

### A. IngestReadyLinks「打开书桌」0-OCR（核心）

**文件**：`apps/web/components/IngestReadyLinks.tsx`

1. props 增 `ocrPageCount?: number`（缺省当 0 · fail-closed）。  
2. `===0` → outline/muted「打开书桌（尚无 OCR）→」+ title 点名章页/分栏暂读不了；可保留次级「去解析」链（勿第二颗大红）；`>0` 保持朱红。  
3. T39 `rememberUploadReturn` 只回归。  
4. **不做**：重做书架；阻断进桌；假 OCR。

### B. RegisterMaterialButton 成功开书桌 0-OCR（核心）

**文件**：`apps/web/components/RegisterMaterialButton.tsx`

1. props 增 `ocrPageCount?: number`。  
2. 成功三连「打开书桌」：`===0` → 点名尚无 OCR 降级；`>0` 保持。  
3. 注册按钮 / API / refresh 只回归。  
4. **不做**：改 register-book；假进度。

### C. ingest 装配 + 三连学习环/核页书级空池（核心）

**文件**：`apps/web/app/(shell)/ingest/page.tsx` · IngestReadyLinks ·（± Register）

1. `loadBookValidPages()`；ready → `ocrPageCount`；extracted → 物料章 ∩ 已解析页数作 `ocrPageCount`。  
2. 书级 `atomCount` / `pendingCount`（`collectStudyAtoms({bookId})` · `collectCiteQueue({bookId})` 同池族）传入三连。  
3. `atomCount===0` →「学习环」纯文「暂无原子」；`pendingCount===0` →「核页」纯文「暂无待核」；`>0` 保持 mode=all/open + return。  
4. **不做**：重做 T45 N/M+CopyCommand；改 stage 机；LibraryContinuity。

### D. CitePeek 浮层 CTA 空池门禁（核心 · 禁正文）

**文件**：`apps/web/components/CitePeek.tsx`

1. 可选 `pageAtomCount?` · `pendingPageCount?` · `pendingCiteCount?`。  
2. 父传入且对应 `===0` → 该 CTA muted 纯文不可点；未传入 → 保持既有链。  
3. 「在书桌打开」有页保持。  
4. **硬禁**：quote / trap / 定位 / verified 文案 / 布局 / Esc·点外·focus；OCR canvas。

### E. 宿主接线 · 轨 / 瓷砖 / 卡详情（核心）

**文件**：`ChapterPageReader.tsx` · `DocumentPane.tsx` · `EntityCardDetail.tsx`

1. 轨 CitePeek：下传页级 atom/pending + 卡级 pending（T48 已有则复用）。  
2. CardCard CitePeek：下传卡级 pending（± atom）。  
3. EntityCardDetail 三处：下传 `pendingCiteCount` + 卡原子数。  
4. **不做**：重做 T48 轨/瓷砖「核」门禁；重做 CardHub。

### F. Study/HeYe 接线 + build / DEFER / 回归（收口）

**文件**：`StudySession.tsx` · `HeYeSession.tsx`

1. 能取到 scope/池计数则下传；不能则省略 prop——**禁止**造假正数。  
2. heye-only **DEFER**——禁止 invent seed；回复写明 deferred。  
3. `pnpm --filter web build` PASS；**不要 push**。  
4. 回归：T48 核门禁/sticky N/CardVs/Overview 章行；T47 TOC/KINDS/Continuity 0-OCR/CardDetail；T46 书架/换书/模式/开章；T45 Quiz/练/ingest N/M；T44–T28；CitePeek 正文未毁；IngestReady return 未拆；ModeChips 未插队。

---

## 硬保留

Task 07–48 + review-fix：书架 DeskShell、开书 /desk?book=、三栏、DocumentPane 三模（含 T46 无页降级）、TOC（含 T47 counts）、Clew stub、卡页 CitePeek **正文与 trap**、/review·/study 诚实切片、StickyPageLoopKeys、StickyModeGate、DeskSurfaceBridge、collectStudyAtoms/collectCiteQueue、loadBookValidPages、healOpenedIfDirty、ariadne.study.v1 / heye.v1 / session.v1 / last-opened.v1 / recent-books.v1 / return.v1 / view.v1、CardHubReturnLinks、IngestReadyLinks return、CopyCommand、LibraryContinuity/ShelfBookContinuity、T34–T48 已交切片、T26 稀疏琥珀、T41 sticky N=0 门禁、T48 sticky 标 N。勿 verified:true 过关。**A+B+C+D+E+F 范围保持完整；主题是 ingest 开书桌 OCR 诚实 + 三连空池 + CitePeek 浮层 CTA，不是 return，不是 T46–T48 重做。**

---

## 不做（硬）

- FSRS / Due / Clew LLM 真写 / verified:true / 掌握% / invent heye-only 页  
- 改名 storage keys / 强制清空整栈  
- CitePeek **正文**/trap/定位重做 / OCR canvas / ⌘K / DeskShell 重写 / Queue→Due  
- exam-anchor / ch08+ / nur-landing / PWA  
- ModeChips 会话插队；ScopeCounts return；「对页」return；ShortcutSheet  
- 以 saveReturn 为主题 densify / 重做 T46 书架·换书·模式 / 重做 T47 TOC·KINDS·Continuity·CardDetail / 重做 T48 核门禁·sticky·CardVs·Overview 章行 / 只改一处「尚无 OCR」或只门禁 CitePeek 一链就收工  
- ShelfBookContinuity 页级练/核空池 densify（**DEFER→T50**）  
- LibraryContinuity 学习环/核页再 densify  
- 假云端 OCR / 假进度 / 改 stage 机  
- 整段 port ariadnemini版 verify/clew-API  
- push  

---

## 自测（回复须勾）

1) `/ingest` ready · 0-OCR →「打开书桌（尚无 OCR）」；>0 朱红；T46 书架未毁  
2) extracted 注册成功 · 0-OCR → 成功开书桌点名尚无 OCR  
3) ready · 0 原子/0 pending → 学习环/核页纯文；N/M+CopyCommand 未毁  
4) 章页轨「摘」空池 → 浮层 CTA 降级；quote/trap 未毁；轨顶门禁未毁  
5) 卡详情/瓷砖「摘」· 0 pending →「核本卡」纯文；CardHub 未毁  
6) study/review「摘」· 有 counts 时降级；正文未毁  
7) build PASS；未 push；T48–T28 回归；heye-only DEFER 已声明  

做完叫验收。A–F 全交才过。
