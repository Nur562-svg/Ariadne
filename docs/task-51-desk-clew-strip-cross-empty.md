# Task 51 / desk-clew-strip-cross-empty-01 — Clew 右栏练核 CTA 空池 · 书桌 Strip/书头/Quiz 空池 · 练核交叉离面空池（zcode · MEGA）

**模型**：zcode · **GLM5.3 max thinking**（brief 格式同历史 Trae paste）  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**`c99d7ec`**（`feat(desk) Task 50 desk-shelf-continuity-empty-01`）。  
- `git log -1 --oneline` 须含 `c99d7ec` / T50。若仍停在 `691915a`（仅 T49）或更早——**停下来对齐，不要开工**。  
- 其后仍须含：T49 desk-ingest-opendesk-citepeek-empty、T48 desk-review-gate-rail-sticky、T47–T28 既有。  
**前置**：Task 50 + … 已落 tip。**保留** shell-01 + Task 08–50。本任务**不是**又一轮 return densify，**不是**重做 T46–T50；只让 **Clew 右栏 / 书桌 Strip·书头·Quiz / 练核交叉离面** 与轨顶·Overview·书架·ingest **同真空池**。  
**不 push**（写手）。验收 PASS 后站规 **auto-push**（勿问「推」）。用户 **自行粘贴**（无 auto-paste）。

> **Slug**：`desk-clew-strip-cross-empty-01` · 对照 SCOPE：`/workspace/reports/ariadne-task-51/SCOPE.md`（或仓库 `docs/`）。  
> **体量（硬 · MEGA）**：用户「试着把一刀砍的更大，很大很大」；zcode 配额充足。目标 **约 180–300+ 分钟真实编码**，交 **A–J 全部**（10 切片 · 3 子主题）。**若只做 Clew 一包（A–D）就收工 = 漏做中栏/交叉 = 拒收**。**若 15–30 或 90 分钟内假装收工 = 漏做**。**若做成以 saveReturn 为主或重做 T46–T50 = 主题偏了，拒收**。

先读 `docs/frontend-aesthetics.md`（朱红唯一 · 精炼书桌 · 效用文）。

---

## 背景（为何现在做）

| 已有（T50 @ `c99d7ec`） | 缺口 |
|------------------------|------|
| 书架续开页级练/核；Footer/LibraryContinuity/Sidebar 空池；`book-pools.ts` | **勿重做 T50** |
| T49 ingest 0-OCR 开书桌；三连空池；CitePeek 浮层 CTA | **勿重做 T49** |
| T48 轨/瓷砖/搜索核门禁；sticky N；Overview 章行空池 | **对齐基准** |
| T47 Continuity 0-OCR 壳；T46 书架 OCR/换书/模式 | **勿重做** |
| Clew stub「去学习环/去核页」 | **恒可点** — T50 soft leftover |
| Clew chat 空态自测/核页；Changes 空态 CTA；Queue 主 CTA | **恒可点** — 同族扩包 |
| LocalProgressStrip「练/核此范围」 | **有 href 即链** — atoms/items=0 仍进空 |
| 书头「学习环 · 自评」 | **恒可点** — Overview 章行已门禁 chAtoms，书头未跟 |
| QuizPanel「去核页」 | **恒可点** — T45 只门禁练侧 |
| sticky CrossScope；Study/HeYe 空·完成态交叉 | **恒可点** — 对侧池可为 0 |

**产品脊梁**：顾客自带材料 → 可考原子 / 待核 cite → 日用 Clew / 书桌中栏 / 练核交叉 —— **同真不装能进空池**。

**三子主题（ONE 刀）**：

1. **Clew 右栏**（A–D）：stub 气泡 · chat 空态 · Changes · Queue 主 CTA  
2. **书桌中栏**（E–G）：Strip 条末 · 书头学习环 · Quiz 去核页  
3. **练核交叉**（H–J）：sticky CrossScope · StudySession/study 空态 · HeYeSession + build  

共享口径：`clew.progressAtoms` / `progressItems` · 页内 `stripAtoms` / `stripItems` / `chapterAtoms` / `heyeItems` · `collectStudyAtoms` / `collectCiteQueue`。缺省/缺 key → **0 fail-closed**。禁止造假正数。禁止第二套「待核」定义（非 Due、非把本机标记当教材 verified）。

---

## IN（A–J · 必须全交）

### A. Clew stub 气泡空池
`ClewPane.send`：原子/pending 池 ===0 → 气泡行动链对应项改 muted 纯文「暂无原子」「暂无待核」；>0 保持 ActionLink + returnTo 快照。「对页」保持。

### B. Clew chat 空态空池
有书路径「学习环自测」「核页对页」同 A；无书路径不装能进裸 `/study` 空池（见 SCOPE）。T44 分型骨架不重做。

### C. Clew Changes CTA 空池
空态双链 + 筛空单侧 CTA 同 A；T43 筛选/截断不重做。

### D. Clew Queue 主 CTA 空池
「打开核页工作台」看 progressItems；「去学习环」看 progressAtoms；无池/0 → 纯文。分段 N 只回归。**禁 Due**。

### E. LocalProgressStrip 条末空池
`atoms.length===0` / `items.length===0` → 条末「练/核此范围」纯文或省略；>0 保持 + returnTo。

### F. 书头「学习环 · 自评」章空池
`chapterAtoms.length===0` → 纯文「本章暂无原子」；>0 保持 + rememberDeskCardReturn。「练本页」只回归。

### G. QuizPanel「去核页」空池
`items.length===0` → 纯文「暂无待核」；练侧 T45 只回归。

### H. sticky CrossScope 对侧空池
study：对侧 items=0 →「同范围暂无待核」；review：对侧 atoms=0 →「同范围暂无原子」。可扩 CrossScopeReturnLink empty 态或宿主三元。

### I. StudySession + study 空态交叉核
下传 `pendingCount`（heye 同池）；===0 空/完成态「核本卡/去核页」纯文；study 页空态「核本卡」同门禁。leaveReturnTo 不拆。

### J. HeYeSession 交叉练 + build / DEFER / 回归
下传 `atomCount`；===0「去学习环/去学习本卡」纯文。`pnpm --filter web build` PASS；heye-only **DEFER**；不 push；回归 T50–T28（见 SCOPE）。

---

## OUT（硬）

FSRS/Due · Clew LLM 真写 · verified:true · 掌握% · invent heye-only · OCR canvas · CitePeek **正文**/trap redo · ⌘K · Queue→Due · DeskShell 重写 · exam-anchor · ch08+ · nur-landing · 改名 storage keys · 强制清空整栈 · ModeChips 会话插队 · ScopeCounts/「对页」return · ShortcutSheet · return densify 主题 · 重做 T46–T50 · Next.js upgrade 当主题 · 假池 · 只交 A–D 或单文件微改就收工 · 写手 push。

---

## 建议路径

```
apps/web/components/desk/ClewPane.tsx
apps/web/components/LocalProgressStrip.tsx
apps/web/components/desk/DocumentPane.tsx
apps/web/components/desk/CrossScopeReturnLink.tsx   # 可选 empty
apps/web/app/(desk)/study/page.tsx
apps/web/app/(desk)/review/page.tsx
apps/web/components/StudySession.tsx
apps/web/components/HeYeSession.tsx
```

---

## 自测（须勾）

见 SCOPE 自测表 1–10。摘要：Clew 四处空池纯文；Strip/书头/Quiz 空池纯文；CrossScope/会话交叉对侧空池纯文；有池保持链+return 未拆；build PASS；heye-only DEFER；T50–T28 回归。

---

## 验收口令

**做完叫验收。A–J 全交才过。**
