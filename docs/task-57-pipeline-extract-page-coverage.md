# Task 57 / pipeline-extract-page-coverage-01 — 抽出后页→原子覆盖诚实 · 暗页 · CLI page-check · ingest extracted · 书桌/书架/Reader 暗页徽（zcode · MEGA）

**模型**：zcode · **GLM5.3 max thinking**（brief 格式同历史 Trae paste）  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**`ee323f3`**（`docs(pipeline) Task 56 acceptance docs`）。  
- `git log -1 --oneline` 须含 `ee323f3` / T56 docs。若仍停在 `bf8af0e`（仅 T56 feat）或更早——**停下来对齐，不要开工**。  
- 其后仍须含：feat `bf8af0e`、T55 `2389c26`/`b350bd4`、T54 `994602f`/`d90d951`、T53–T28 既有。  
**前置**：Task 56 + … 已落 tip。**保留** shell-01 + Task 08–56。本任务**不是**又一轮 empty-CTA densify，**不是** return densify，**不是** CitePeek 正文/trap redo，**不是**重做 T46–T56，**不是**真·卡内联编辑器；只做 **材料→原子 pipeline 第四刀：抽出后页→原子覆盖诚实（暗页＝实质 OCR 零 cite）+ CLI + ingest extracted + 书桌/书架/Reader 暗页徽**。  
**不 push**（写手）。验收 PASS 后站规 **auto-push**（勿问「推」）。用户 **自行粘贴**（无 auto-paste）。

> **Slug**：`pipeline-extract-page-coverage-01` · 对照 SCOPE：`/workspace/reports/ariadne-task-57/SCOPE.md`（或仓库 `docs/task-57-SCOPE.md`）。  
> **体量（硬 · MEGA）**：用户「larger knives」+「production path (pipeline over more chrome)」。目标 **约 180–300+ 分钟真实编码**，交 **A–J 全部**（10 切片 · 3 子主题）。**若只做 CLI 或只做章行一行数字就收工 = 拒收**。**若 15–30 或 90 分钟内假装收工 = 漏做**。**若做成 empty-CTA / return densify / CitePeek 正文·trap / 写 verified:true / 自动写 entities / 真·卡内联编辑器 / 重做 T46–T56 = 主题偏了，拒收**。

先读 `docs/frontend-aesthetics.md`（朱红唯一 · 精炼书桌 · 效用文）。

---

## 背景（为何现在做）

| 已有（T56 @ `ee323f3` / feat `bf8af0e`） | 缺口 |
|------------------------------------------|------|
| cite↔OCR 检测（T54）+ miss 补救（T55）+ 抽出前 OCR 空/稀覆盖（T56） | **抽出后**不问「实质 OCR 页有没有变成原子」 |
| ingest 质量条 / 补救 / parse 覆盖条 | **无**暗页 D / 抽出页覆盖率 |
| `pnpm cite-check` / `parse-check` | **无** page-check · **无** extract-page.json |
| Overview 空稀徽 · 书架 cite/parse 徽 | **无**暗页徽（与二者正交） |
| seed ch01 | 18 页 OCR · 13 页被 cite · **暗 5**（含 p.7≈1061 字正文）——产品零信号 |

---

## 空池 CTA / return / 深链 / T54–T56 井（写进回复）

**声明**：T43–T51 empty-CTA、T35–T42 return、T52–T53 OCR 深链/撤销、T54 检测、T55 补救、T56 parse 覆盖均已闭或饱和。本刀主题是 **pipeline 抽出后页→原子覆盖诚实**，不是再给练/核 CTA 加空池门禁，不是 saveReturn densify，不是重做 T54–T56，不是自动写 seed，不是真·卡编辑器。

---

## 切片 A–J（必须全交）

### A · lib extract-page-coverage（~30–45 min）
- 新建孪生 `apps/web/lib/extract-page-coverage.ts` + `scripts/lib/extract-page-coverage.mjs`（**keep in sync**）。  
- 复用 `SPARSE_CHAR_THR=40`（与 T56 同口径；注释互指勿漂移）。  
- `collectCitedPages` · `scoreExtractPageCoverage` → `ExtractPageCoverage`（substantialPages / citedPages / darkPages / darkCount / darkRate / weak）。  
- `loadExtractPageCoverage(chapterId)`：缺 blocks 或缺 entities → `null`（未检）；**禁止**缺文件装 darkCount=0。  
- 暗页定义：chars≥thr 且 page 未出现在任何 cite；chars&lt;thr **不**进 dark（留给 T56 稀/空）。  
- **勿**改 `deriveMaterialStage`；**勿**把暗页写进 cite miss。

### B · CLI page-check（~25–40 min）
- `scripts/extract-page-check.mjs`；`package.json` `"page-check"`。  
- 默认章汇总；`--dark` 列暗页；写 `data/qa/<ch>.extract-page.json`；`.gitignore` 增 `data/qa/*.extract-page.json`。  
- 可选 `--book <id>` 折叠。  
- **禁止**改 blocks / entities。

### C · extract 后置（~20–35 min）
- 写盘后 stderr 暗页摘要（count/rate + 样例 ≤8）。  
- 默认警告仍写；`--strict` OR（`darkRate≥0.35` 或 `darkCount≥5`，文档化）拒写。  
- 勿大修 extract prompt；勿自动发明 cite 填暗页。

### D · ingest extracted 暗页条（~30–45 min）
- extracted/ready：暗页条数字；`weak` → 琥珀 + 样例 ≤6 + `CopyCommand` `pnpm extract -- <弱章>`。  
- uploaded/parsed：**不**装暗假 0。  
- 保留 T54/T55 质量条+补救与 T56 parse 覆盖条（并列）。

### E · Register 旁挂（~20–30 min）
- `qualityWarn` 可选 `darkPages?` / `darkCount?` / `darkRate?`；琥珀点名暗页；软二次；API 不 4xx。  
- 勿拆 miss/incomplete/parseWeak。

### F · Overview 章行暗徽（~25–40 min）
- DocumentPane 章行：`darkCount>0` → 琥珀「暗D」；好章静音；未抽出不装暗徽。  
- 禁掌握%/Due；可与 cite/空稀徽三分列。

### G · 书架暗页徽（~25–40 min）
- `app/(desk)/page.tsx`：与 `bookQuality` / `bookParse` **并列**算书级 extract-page 折叠；weak → 第三徽「抽出偏稀 · 暗D」。  
- **三分列**，勿吞改 cite/parse 文案；好书静音；可选链 `/ingest`。

### H · Reader 暗页提示（~20–30 min）
- ChapterPageReader：实质暗页 → 一行提示；chars&lt;thr 只走 T56 稀页文案（勿双吵）。  
- 禁 canvas / CitePeek 正文·trap。

### I · 装配（~25–40 min）
- ingest/extract/Register/Overview/书架/Reader 接线；缺文件未检；gitignore；勿毁 T55/T56。

### J · build · DEFER · 回归（~20–30 min）
- `pnpm --filter web build` PASS；`pnpm page-check -- ch01`（+ `--dark`）；`cite-check` + `parse-check` 回归。  
- 不 push；heye-only / 卡编辑器 / QA 仪表盘 **DEFER**；禁 verified/entities 写入；回归 T56–T28。

---

## 验收口令

**做完叫验收。A–J 全交才过。**
