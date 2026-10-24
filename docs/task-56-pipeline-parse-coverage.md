# Task 56 / pipeline-parse-coverage-01 — parse/OCR 阶段覆盖诚实 · 空页·稀页 · CLI parse-check · ingest 抽出前 · 书桌/书架覆盖徽（zcode · MEGA）

**模型**：zcode · **GLM5.3 max thinking**（brief 格式同历史 Trae paste）  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**`2389c26`**（`docs(pipeline) Task 55 acceptance docs`）。  
- `git log -1 --oneline` 须含 `2389c26` / T55 docs。若仍停在 `b350bd4`（仅 T55 feat）或更早——**停下来对齐，不要开工**。  
- 其后仍须含：feat `b350bd4`、T54 `994602f`/`d90d951`、T53–T28 既有。  
**前置**：Task 55 + … 已落 tip。**保留** shell-01 + Task 08–55。本任务**不是**又一轮 empty-CTA densify，**不是** return densify，**不是** CitePeek 正文/trap redo，**不是**重做 T46–T55；只做 **材料→原子 pipeline 第三刀：parse/OCR 覆盖诚实（空页·稀页·块覆盖）+ CLI + ingest 抽出前 + 书桌/书架覆盖徽**。  
**不 push**（写手）。验收 PASS 后站规 **auto-push**（勿问「推」）。用户 **自行粘贴**（无 auto-paste）。

> **Slug**：`pipeline-parse-coverage-01` · 对照 SCOPE：`/workspace/reports/ariadne-task-56/SCOPE.md`（或仓库 `docs/task-56-SCOPE.md`）。  
> **体量（硬 · MEGA）**：用户「larger knives」+「production path (pipeline over more chrome)」。目标 **约 180–300+ 分钟真实编码**，交 **A–J 全部**（10 切片 · 3 子主题）。**若只做 CLI 或只做章行一行数字就收工 = 拒收**。**若 15–30 或 90 分钟内假装收工 = 漏做**。**若做成 empty-CTA / return densify / CitePeek 正文·trap / 写 verified:true / 自动写 entities / 真·卡内联编辑器 / 重做 T46–T55 = 主题偏了，拒收**。

先读 `docs/frontend-aesthetics.md`（朱红唯一 · 精炼书桌 · 效用文）。

---

## 背景（为何现在做）

| 已有（T55 @ `2389c26` / feat `b350bd4`） | 缺口 |
|------------------------------------------|------|
| cite↔OCR 检测（T54）+ miss 补救 / 附近 OCR / 重抽复制 / 书架 **cite** 徽（T55） | **抽出前** OCR 阶段仍二元：`chapterHasBlocks` 任一页有字 → 整章「已解析」 |
| ingest uploaded/parsed CopyCommand 缺章 | **无** expected/空/稀/块/覆盖率；薄 OCR 仍催 extract |
| `pnpm parse` stderr blocks 总数 | **无** parse-check · **无** parse-ocr.json · **无** strict 拒烂 OCR |
| Overview「N 页 / 无 OCR 页」· 书架 cite 徽 | **无** 空E/稀S 覆盖徽（与 cite 正交） |
| seed ch01 p.1 ≈9 字 | 产品上仍算 parsed——顾客薄页无信号 |

---

## 空池 CTA / return / 深链 / T54–T55 井（写进回复）

**声明**：T43–T51 empty-CTA、T35–T42 return、T52–T53 OCR 深链/撤销、T54 检测、T55 补救均已闭或饱和。本刀主题是 **pipeline 上游 OCR 覆盖诚实**，不是再给练/核 CTA 加空池门禁，不是 saveReturn densify，不是重做 T54/T55，不是自动写 seed，不是真·卡编辑器。

---

## 切片 A–J（必须全交）

### A · lib parse-ocr-coverage（~30–45 min）
- 新建孪生 `apps/web/lib/parse-ocr-coverage.ts` + `scripts/lib/parse-ocr-coverage.mjs`（**keep in sync**）。  
- `SPARSE_CHAR_THR = 40`（文档化；opts 可覆盖）。  
- `scorePageText` · `scoreParseChapter` → `ParseCoverage`（expectedPages / pagesPresent / emptyPages / sparsePages / blockCount / mainBlocks / coverageRate / sparseRate / weak）。  
- `loadParseCoverage(chapterId)`：缺文件 → `null`（未检）；**禁止**缺文件装覆盖率 1.0。  
- **勿**改 `deriveMaterialStage` 把稀页打回 uploaded（只暴露）。

### B · CLI parse-check（~25–40 min）
- `scripts/parse-ocr-check.mjs`；`package.json` `"parse-check"`。  
- 默认章汇总；`--sparse` 列空/稀页；写 `data/qa/<ch>.parse-ocr.json`；`.gitignore` 增 `data/qa/*.parse-ocr.json`。  
- 可选 `--book <id>` 折叠。  
- **禁止**改 blocks / entities。

### C · parse.py 后置（~20–35 min）
- 写盘后 stderr 覆盖摘要。  
- 默认警告仍写；`--strict` 且极低覆盖（`coverageRate<0.5` 或 `empty/expected≥0.25`）→ 非零 + 拒覆盖已有 blocks。  
- 勿大修 OCR 引擎/DPI。

### D · ingest 抽出前覆盖条（~30–45 min）
- 有 blocks 的章：覆盖条数字；`weak` → 琥珀 + `CopyCommand` `pnpm parse <弱章>`。  
- uploaded：缺章命令保留；已解析子集可显示覆盖。  
- **禁止** uploaded/parsed 装 T54/T55 cite 假 0；extracted/ready 保留质量条+补救面板。

### E · extract 预检 + Register 旁挂（~25–40 min）
- extract 开抽前 warn weak；`--strict` 可 OR 覆盖条件（与既有 cite strict 并存，文档写清）。  
- Register 可选 `parseWeak` / empty / sparse 旁挂琥珀；软二次；API 不 4xx。  
- 勿拆 T54/T55 miss/incomplete。

### F · Overview 章行空/稀徽（~25–40 min）
- DocumentPane 章行：`empty\|sparse>0` → 琥珀「空E · 稀S」；好章静音；无 OCR 既有文案。  
- 禁掌握%/Due；可与 T55 cite 小徽并存。

### G · 书架 parse 覆盖徽（~25–40 min）
- `app/(desk)/page.tsx`：与 `bookQuality` **并列**算书级 parse 折叠；weak → 第二徽「OCR覆盖偏弱 · 空E · 稀S」。  
- **分列** T55 cite 徽，勿吞改文案；好书静音；可选链 `/ingest`。

### H · Reader 稀页提示（~15–25 min）
- ChapterPageReader：当前页 chars < thr → 一行「本页 OCR 偏稀」；正常不吵。  
- 禁 canvas / CitePeek 正文·trap。

### I · 装配（~25–40 min）
- ingest/extract/Register/Overview/书架/Reader 接线；缺文件未检；gitignore；勿毁 T55。

### J · build · DEFER · 回归（~20–30 min）
- `pnpm --filter web build` PASS；`pnpm parse-check -- ch01`；`pnpm cite-check -- ch01` 回归。  
- 不 push；heye-only / 卡编辑器 / QA 仪表盘 **DEFER**；禁 verified/entities 写入；回归 T55–T28。

---

## 验收口令

**做完叫验收。A–J 全交才过。**
