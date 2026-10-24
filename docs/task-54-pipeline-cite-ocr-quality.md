# Task 54 / pipeline-cite-ocr-quality-01 — cite quote↔OCR 质量门 · ingest/注册暴露 · 卡详/核页日用（zcode · MEGA）

**模型**：zcode · **GLM5.3 max thinking**（brief 格式同历史 Trae paste）  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**`d518876`**（`docs(desk) Task 53 acceptance docs`）。  
- `git log -1 --oneline` 须含 `d518876` / T53 docs。若仍停在 `eefb0e0`（仅 T53 feat）或更早——**停下来对齐，不要开工**。  
- 其后仍须含：feat `eefb0e0`、T52 `2f43ce9`/`64ddb11`、T51–T28 既有。  
**前置**：Task 53 + … 已落 tip。**保留** shell-01 + Task 08–53。本任务**不是**又一轮 empty-CTA densify，**不是** return densify，**不是** CitePeek 正文/trap redo，**不是**重做 T46–T53；只做 **材料→原子 pipeline 第一刀：cite↔OCR 质量门 + ingest/注册暴露 + 卡详/核页 OCR 未见**。  
**不 push**（写手）。验收 PASS 后站规 **auto-push**（勿问「推」）。用户 **自行粘贴**（无 auto-paste）。

> **Slug**：`pipeline-cite-ocr-quality-01` · 对照 SCOPE：`/workspace/reports/ariadne-task-54/SCOPE.md`（或仓库 `docs/task-54-SCOPE.md`）。  
> **体量（硬 · MEGA）**：用户「Knives MUCH LARGER」+「prefer real product spine」。目标 **约 180–300+ 分钟真实编码**，交 **A–J 全部**（10 切片 · 3 子主题）。**若只做 lib 或只做 HeYe 一条琥珀就收工 = 拒收**。**若 15–30 或 90 分钟内假装收工 = 漏做**。**若做成 empty-CTA / return densify / CitePeek 正文·trap / 写 verified:true / 重做 T46–T53 = 主题偏了，拒收**。

先读 `docs/frontend-aesthetics.md`（朱红唯一 · 精炼书桌 · 效用文）。

---

## 背景（为何现在做）

| 已有（T53 @ `d518876` / feat `eefb0e0`） | 缺口 |
|------------------------------------------|------|
| OCR 深链鬼页诚实 · HeYe u/z · empty-CTA/return 井饱和 | **材料→原子**抽出后无产品化质量门 |
| `data/qa/*-sample-10.md` 叙述 bigram≥0.6 | 算法未进 lib / CLI / ingest / 核页 |
| Entity 诚实条：有页 / p.? / 抽查未核 | **无**「OCR 未见」分列信号 |
| HeYe 左 quote 右 OCR | **不**提示摘录是否落在本页 OCR |
| extract sanitize 页码范围 | **不**跑 quote↔OCR；弱稿可注册进桌 |

---

## 空池 CTA / return / 深链井（写进回复）

**声明**：T43–T51 empty-CTA、T35–T42 return、T52–T53 OCR 深链/撤销均已闭或饱和。本刀主题是 **pipeline 质量门 + 日用 OCR 未见诚实**，不是再给练/核 CTA 加空池门禁，不是 saveReturn densify，不是重做鬼页 helper。

---

## 切片 A–J（必须全交）

### A · lib cite-ocr-quality（~25–40 min）
- `apps/web/lib/cite-ocr-quality.ts`（无 `"use client"`）+ 孪生 `scripts/lib/cite-ocr-quality.mjs`（算法同真，文件头互指「keep in sync」）。  
- `normalizeText(s)`：去空白折叠、小写可选（中文为主——以去空白为主，勿破坏汉字）。  
- `bigramCoverage(quote, pageText): number` ∈ [0,1]（空 quote → 0）。  
- `quoteInOcr(quote, pageText, thr = 0.6): boolean`。  
- `scoreCard(card, pageTextByPage: Map|Record)`：遍历 card.cites + fields[].cite + atoms[].cite；累计 nullPage / ocrMiss / atoms / zero-atom 卡标志。  
- `scoreChapter(cards, pageTextByPage)` → 汇总 `{ cards, atoms, cites, nullPage, ocrMiss, zeroAtomCards, missRate }`（missRate = ocrMiss/max(citesWithPage,1)）。  
- **硬禁**：改写 card.verified；本 lib 只**读**。

### B · CLI cite-check（~25–40 min）
- `scripts/cite-ocr-check.mjs`；`package.json` 加 `"cite-check": "node scripts/cite-ocr-check.mjs"`。  
- 用法：`pnpm cite-check -- ch01`（缺章 → usage 非零退出）。  
- 读 `data/cards/<ch>.entities.json` + `data/chapters/<ch>.blocks.json`；打印人读汇总；写 `data/qa/<ch>.cite-ocr.json`（含 miss 样例 id/page/quote 截断）。  
- **禁止**改 entities.json。

### C · extract 后置（~20–35 min）
- `extract_cards.mjs`：写盘前对 `all` 跑 score（用本章 pages 建 pageTextByPage）。  
- stderr：`cite-ocr: cites=… ocrMiss=… missRate=… zeroAtomCards=…`。  
- 默认警告继续写；`--strict` 且（missRate>0.4 或 zeroAtomCards>0 或 cards===0）→ 非零退出；若已有 entities 文件 → **拒绝覆盖**（对齐空抽 fail-closed）。  
- dry-run 仍可打印分数。

### D · ingest 质量条（~25–40 min）
- `ingest/page.tsx`：对 extracted/ready，按物料章 `loadCards({chapterId})` + `loadChapterPages` 调 `scoreChapter`。  
- UI：质量条纯文本 `卡 N · 原子 N · OCR未见 M · 无页 p.? K · 零原子卡 Z`（M/K/Z>0 琥珀 class）。  
- uploaded/parsed：不渲质量条（或明示「待抽取」），**禁**假 0。  
- 不重做 T45 N/M · CopyCommand · T49 三连门禁（只回归）。

### E · Register 软门禁（~25–40 min）
- `RegisterMaterialButton` 增 `qualityWarn?: { ocrMiss: number; zeroAtomCards: number; missRate: number; nullPage: number }`。  
- 当 `missRate >= 0.25` 或 `zeroAtomCards > 0`：琥珀说明 + 按钮文案两段式——首次「质量偏弱 · 仍要注册 →」，点一次后 `armed` 再点才 POST（或同按钮二次确认态）。  
- 低风险：保持既有「注册进书库 →」一键。  
- API `/api/ingest/register` **不**因质量 4xx（软门禁在 UI）。  
- T49 ocr/atom/pending 三连只回归。

### F · EntityCardDetail OCR 未见（~25–40 min）
- 诚实条在「抽查未核」旁加「OCR 未见 N」；N>0 琥珀。  
- 脚注一句：OCR 未见 = 有页摘录未通过本机 bigram 机检，**不等于**改 seed verified，也**不等于**本机核页标记。  
- 服务端预计算 `ocrMissCount`（推荐）或下传 `pageTextByPage` 客户端算——优先服务端，免把整章 OCR 塞进客户端。  
- **禁**改 CitePeek quote/trap/定位。

### G · HeYe 摘录未见琥珀（~20–35 min）
- 当前项 `cur.quote` + `cur.page` + `pages` 有 text：`!quoteInOcr` → blockquote 下琥珀一行。  
- 匹配 / 无 quote / 无 text：不额外吵（无 text 走既有缺页分支）。  
- 勿拆 T53 u/z · 开桌鬼页 · T52 emptyKind · T51 atomCount · leaveReturn。

### H · CiteChip ocrMiss 提示（~15–25 min）
- 可选 prop `ocrMiss?: boolean`。  
- true → title 或 chip 内短后缀「· OCR 未见」（muted/琥珀）；**仍**走既有 Link/鬼页门禁（T53 `bookValidPages`/`pageInOcr` 优先于本提示）。  
- Entity 字段/原子 CiteChip、CardCard 主 cite 能算则传。

### I · 装配线（~25–40 min）
- ingest → Register `qualityWarn` 从章集合 score 汇总。  
- desk/card/[id] + entities/[id] → Detail `ocrMissCount`（及可选 per-cite 若 H 需要）。  
- DocumentPane CardCard → CiteChip `ocrMiss`（primary cite）。  
- review/page：确认 HeYe `pages` 含 `text`（已有则只接 G）。  
- fail-closed：缺 pageText → 不当 ocrMiss（视为未检，不抬假阳）。

### J · build · DEFER · 回归（~20–30 min）
1. `pnpm --filter web build` PASS。  
2. `pnpm cite-check -- ch01` 跑通。  
3. 不要 push。  
4. heye-only invent **DEFER**。  
5. git diff **禁止**出现把 entities `verified` 改成 `true` 的写入。  
6. 回归 T53–T28（见 SCOPE 自测 10）。

---

## 硬保留

Task 07–53 + review-fix：书架 DeskShell、开书、三栏、DocumentPane 三模、TOC、Clew stub、CitePeek **正文与 trap**、/review·/study、Sticky*、ocr-page.ts、book-pools、return-stack、各 storage keys、IngestReadyLinks、T34–T53 已交。主题是 **pipeline cite↔OCR 质量 + 日用未见诚实**，不是 empty-CTA，不是 return，不是 T46–T53 重做，不是 verified 放宽。

---

## 不做（硬）

- FSRS / Due / Clew LLM 真写 / **写 verified:true** / 掌握% / invent heye-only  
- 改名 storage keys / 强制清空整栈  
- CitePeek **正文/trap/定位**重做 / OCR canvas / ⌘K / DeskShell 重写 / Queue→Due  
- exam-anchor / ch08+ / nur-landing / ModeChips 会话插队  
- ScopeCounts /「对页」加 return · SessionKeyHint→ShortcutSheet  
- empty-CTA densify / return densify / 重做 T46–T53  
- Register API 硬 4xx 质量拒绝（本刀软 UI 门禁）  
- Next.js security upgrade 当主题  
- 假池 / 只交 A 或只做 G 就收工 / 写手 push  

---

## 自测（回复须勾）

见 SCOPE 自测 1–10。

---

## 验收口令

**做完叫验收。A–J 全交才过。**
