# Task 50 / desk-shelf-continuity-empty-01 — 书架续开页级练/核空池 · Footer · LibraryContinuity 空池门禁 · 侧栏在读（zcode）

**模型**：zcode · **GLM5.3 max thinking**（brief 格式同历史 Trae paste）  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**`691915a`**（`feat(desk) Task 49 desk-ingest-opendesk-citepeek-empty-01`）。  
- `git log -1 --oneline` 须含 `691915a` / T49。若仍停在 `741102b`（仅 T48）或更早——**停下来对齐，不要开工**。  
- 其后仍须含：T48 desk-review-gate-rail-sticky、T47 desk-toc-kind-empty-gate、T46 desk-shelf-ocr-mode-switcher、T45–T28 既有。  
**前置**：Task 49 + … 已落 tip。**保留** shell-01 + Task 08–49。本任务**不是**又一轮 return densify，**不是**重做 T46–T49；只让 **书架续开/footer/书库继续上次/侧栏在读进练核与轨顶·Overview 同真空池**。  
**不 push**。验收后再定。用户 **自行粘贴**（无 auto-paste）。

> **Slug**：`desk-shelf-continuity-empty-01` · 对照 SCOPE：`/workspace/reports/ariadne-task-50/SCOPE.md`（或仓库 `docs/`）。  
> **体量（硬）**：用户刀子必须更大；GLM 5.3 扛 3–4 组相关 utility。目标 **约 90–150 分钟真实编码**，交 **A–F 全部**。**若 15–30 分钟收工 = 漏做切片**。**若做成以 saveReturn 为主或重做 T46–T49 = 主题偏了，拒收**。

先读 `docs/frontend-aesthetics.md`（朱红唯一 · 精炼书桌 · 效用文）。

---

## 背景（为何现在做）

| 已有（T49 @ `691915a`） | 缺口 |
|------------------------|------|
| IngestReady/Register 0-OCR 开书桌；ingest 三连空池；CitePeek 浮层 CTA | **勿重做 T49** |
| T48 轨/瓷砖/搜索核门禁；sticky N；Overview 章行空池 | **对齐基准（轨顶/章行）** — 书架续开未跟 |
| T47 Continuity 0-OCR「继续上次（尚无 OCR）」 | **勿重做 Continuity 壳** — 只补学习环/核页空池 |
| T46 书架 OCR 四格；0-OCR「打开书桌」；换书 p.N | **勿重做** |
| ShelfBookContinuity「练本页/核本页」 | **恒可点** — 0 原子/0 pending 仍进空页池 |
| ShelfBookFooterLinks「学习环/核页」 | **恒可点** — 页级/书级都不看池 |
| LibraryContinuity「学习环/核页」 | **恒可点** — soft leftover |
| Sidebar 在读「学习/核页」 | **恒可点** — 同族 |

---

## 一句话目标

**书架续开「练本页/核本页」、Footer 学习环/核页、LibraryContinuity 学习环/核页、侧栏在读学习/核页——对空池与章页轨顶/Overview 同真；书架页 + desk layout 装配书级/页级 counts 下传（只动 CTA 诚实，不重做 Continuity OCR 壳、不 return densify）。**

---

## 用户路径（验收脑内电影）

```
tip 691915a 确认含 T49

/ 书架 · 有续开页 · 该页 0 原子或 0 pending（或验收夹具）
  → 「本页暂无原子」/「本页暂无待核」纯文；续开 p.N 仍可点（A）

同书 footer · 页级或书级空池
  → 学习环/核页对应纯文；Strip 未毁（B）

LibraryContinuity · 空池
  → 学习环/核页纯文；继续上次 0-OCR 壳未毁（C）

侧栏在读 · 空池
  → 学习/核页纯文；换书/主导航未毁（D）

有池 → 链保持 + return 未拆（A–D）

build PASS；未 push；heye-only DEFER（F）
```

---

## IN（硬 · A+B+C+D+E+F 全部 · 按序）

### A. ShelfBookContinuity「练本页 / 核本页」页级空池（核心）

**文件**：`apps/web/components/ShelfBookContinuity.tsx`

1. props：页级原子/待核（直接 count 或 `Record<number,number>` map 按 healed page 查；缺省/缺 key → 0 · fail-closed）。  
2. ===0 → muted 纯文不可点；>0 保持 Link + rememberPageReturn。  
3. 「续开 p.N」保持。  
4. **不做**：重做 heal；拆 return。

### B. ShelfBookFooterLinks 页级/书级空池（核心）

**文件**：同文件 `ShelfBookFooterLinks`

1. 有 page → 用页级 counts；无 page → 用书级 `atomCount`/`pendingCount`。  
2. ===0 → 纯文；>0 保持链 + rememberFooterReturn。  
3. **不做**：改 Strip。

### C. LibraryContinuity 学习环/核页空池（核心 · 禁动 0-OCR 壳）

**文件**：`apps/web/components/LibraryContinuity.tsx`

1. 同族 props；有 `last.page` 用页级否则书级。  
2. ===0 → 纯文；>0 保持。  
3. **硬禁**：改 T47 E 继续上次（尚无 OCR）/去解析；重做壳。

### D. Sidebar 在读「学习 / 核页」空池（核心）

**文件**：`apps/web/components/desk/Sidebar.tsx`

1. SidebarBook（或并行 props）带 atom/pending ± 页表；按 `currentEntry?.page` 选池。  
2. ===0 → 纯文；>0 保持 + rememberDeskReturn。  
3. **不做**：DeskShell 重写；Due 角标。

### E. 书架页 + layout 装配下传（核心）

**文件**：`apps/web/app/(desk)/page.tsx` · `layout.tsx` ·（±）`DeskShellClient.tsx`

1. 每书书级长度 + validPages 页→原子/待核 map（`collectStudyAtoms` / `collectCiteQueue` 同池族；禁造假）。  
2. 下传 Continuity / Footer / LibraryContinuity / Sidebar。  
3. **不做**：重做书架四格；第二套池口径。

### F. build / DEFER / 回归（收口）

1. `pnpm --filter web build` PASS；不 push。  
2. heye-only DEFER；禁 invent seed。  
3. 回归 T49–T28；Continuity 0-OCR 壳；return 未拆；ModeChips 未插队。

---

## OUT（硬）

- FSRS / Due / Clew LLM 真写 / verified:true / 掌握% / invent heye-only / OCR canvas / CitePeek 正文·trap / ⌘K / Queue→Due / DeskShell 重写 / exam-anchor / ch08+ / nur-landing / 改名 storage keys / 强制清空整栈 / port ariadnemini verify·clew-API / ModeChips 会话插队  
- saveReturn densify / 重做 T46–T49 / 重做 Continuity 0-OCR 壳 / 只改一处就收工 / push  

---

## 验收口令

做完叫验收。A–F 全交才过。
