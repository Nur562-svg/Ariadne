# Ariadne Task 56 — SCOPE（推荐下一刀 · T55 后 · **MEGA** ~180–300+ min）

**定稿**：2026-10-24 11:53 Asia/Shanghai（CST）· **after T55 `2389c26`**  
**调度**：Grok Bot（executor）· 用户「Scope and write Ariadne Task 56 — MEGA knife… Prefer continue materials→atoms pipeline (third knife), not desk chrome densify」· **MEGA** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息**）  
**Tip 前置（硬）**：目标 tip = **`2389c26`**（`docs(pipeline) Task 55 acceptance docs` atop feat `b350bd4` pipeline-miss-remediate-01）。  
- box `/workspace/Ariadne-push` 定稿时停在 **`2389c26`**（`origin/main` 对齐）。  
- 开工时 `git log -1 --oneline` 须含 `2389c26` / T55 docs。其下仍含 feat `b350bd4`、T54 `994602f`/`d90d951`、T53–T28 既有。若仍停在 `b350bd4`（仅 feat）或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3 max thinking（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。  
**Standing**：验收 PASS 后 **auto-push**（写手/验收方按站规；本 SCOPE 仍不 push）。用户 zcode 配额充足——**刀子必须更大**。

**用户策略（2026-10-24）**：诚实井 T43–T53 已干；T54 已交 **检测**；T55 已交 **补救闭环**（附近 OCR + 重抽可复制 + 书架 cite 质量徽）。下一刀必须走 **抽取前 OCR 阶段诚实**（uploaded→parsed 覆盖可见：空页/稀页/块覆盖）——**勿**再堆 empty-CTA / return densify，**勿** redo T54/T55，**勿**写 `verified:true` / Clew LLM 真写 / 自动 PATCH entities，**勿**开真·实体卡内联编辑器当本刀（leftover → 后续）。

---

## 空池 CTA / return / OCR 深链 / T54–T55 井状态（硬声明）

**Empty-pool CTA densify 已饱和（T43–T51）**。  
**Return densify 已饱和（T35–T42）**。  
**T52–T53 已闭**：空·完成对称 / Quiz 书空 / Viewer←书桌 / Entity「对页」/ `pageInOcr` 鬼页 / HeYe u/z。  
**T54 已闭**：`cite-ocr-quality` 孪生 lib · `pnpm cite-check` · extract `--strict` · ingest 质量条 · Register 软门禁 · Entity/HeYe/CiteChip「OCR 未见」。**不写 verified:true**。  
**T55 已闭**：`ocrNeighborhood` / `suggestQuoteFromOcr` / incompleteAtoms · CLI `--misses`/`--book` · ingest 补救面板 · Register incomplete · Entity/HeYe 复制级补救 · 书架 cite 质量徽。**剪贴板-only；不 PATCH entities**。  
**本刀不是**又一轮 empty-CTA densify、**不是** return densify、**不是** CitePeek 正文/trap redo、**不是**重做 T46–T55（可**并行**挂 parse 覆盖信号，禁止重写 bigram / 拆软门禁 / 拆补救面板 / 拆 shelf cite 徽）。

相邻最强产品主题 = **材料→原子 pipeline 第三刀：parse/OCR 阶段覆盖诚实（空页·稀页·块覆盖）+ CLI parse-check + ingest uploaded/parsed 面 + extract 预检软警告 + 书桌章行/书架 OCR 覆盖徽**（**不**自动改 entities、**不**翻 `verified:true`、**不** Clew LLM 真写、**不** FSRS、**不**真·卡内联编辑器）。

---

## 诚实评估 · 残余风险

desk-v4 诚实井已薄；T54/T55 把 **抽出后** cite 质量点名并补救了，但 **抽出前** 日用仍缺 OCR 阶段诚实：

| # | 面 | 撒谎 / 缺口 |
|---|----|-------------|
| ① | `deriveMaterialStage` / `chapterHasBlocks` | **二元**：任一页有 trim 正文 → 整章算 parsed；**不计**空页 / 稀页（seed ch01 p.1 仅 ~9 字仍「已解析」） |
| ② | ingest uploaded/parsed | 只报「仍缺章 id」+ CopyCommand parse/extract；**无** expected 页 / 空页 E / 稀页 S / blocks 数 / 覆盖率 |
| ③ | `pnpm parse` | stderr 只打 blocks 总数；**无**章级覆盖汇总、**无** `data/qa/<ch>.parse-ocr.json`、**无** `--strict` 拒写极烂 OCR |
| ④ | `pnpm extract` | 读 blocks 即抽；**不**预检空/稀页——LLM 钱砸在薄 OCR 上 |
| ⑤ | 书桌 Overview 章行 | 有「N 页 / 无 OCR 页」；**无**空页·稀页点名（与 T55 cite 徽正交） |
| ⑥ | 书架 | T55 已有 **cite** 质量徽（OCR未见/零原子/空原子）；**无** **parse 覆盖**徽——弱 OCR 书与好 OCR 书在抽出前同脸 |

捆成 **ONE MEGA**：共享 parse 覆盖算法 → CLI parse-check + parse.py 后置 → ingest uploaded/parsed 诚实条 + extract 预检软警告 → Overview 章行 + 书架 parse 覆盖徽（**与** T55 cite 徽分列，勿合并成一团撒谎）。**禁止**把 `verified` 翻成 `true`；**禁止**写回 entities.json；**禁止**硬阻断 register API；**禁止**把「稀页」伪装成 cite miss。

**残余风险（写进 SCOPE）**：若写手把本刀做成又一轮 empty-CTA / return densify、或 CitePeek 正文/trap redo、或重做 T54/T55（拆 bigram / 拆补救面板 / 重做 shelf cite 徽文案骨架）、或偷偷写 `verified:true` / 自动 PATCH entities / Clew LLM 真写 / 真·卡内联编辑器 = 拒收。稀页阈值须**文档化常量**（建议 `SPARSE_CHAR_THR=40`，与 seed 观测对齐），勿魔法数散落。空页可能是空白扉页——默认**警告不阻断**；`--strict` 才拒写极低覆盖。Register 仍软门禁（可**旁挂** parseCoverageWarn，勿改成硬 4xx）。Next.js security = ops not theme。heye-only invent 仍 DEFER。真·实体卡内联编辑器 / QA 仪表盘页 / 批量重抽队列 UX = leftover → 后续刀（本刀不吞）。

---

## 推荐一刀（ONE · MEGA）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`pipeline-parse-coverage-01`** |
| **Title** | parse/OCR 阶段覆盖诚实 · 空页·稀页·块覆盖 · CLI parse-check · ingest 抽出前 · 书桌/书架 OCR 覆盖徽 |
| **体量** | **~180–300+ min** 真实编码（**A–J** = 10 切片 · 3 子主题）。**若只做 CLI 或只做章行一行数字就收工 = 漏做 pipeline 面 = 拒收**。**若 15–30 / 90 分钟假装收工 = 漏做**。 |
| **产品脊梁** | 顾客材料 → **本机 OCR** → **本刀：抽出前看得见覆盖（空/稀/块）** → 抽出（T54 检测）→ 补救（T55）→ 注册 —— 不把薄 OCR 假装「已解析就绪」、不污染抽取账单、不假翻 verified。 |

**一句话**：在 **`2389c26`（T55）** 上，抽出 **`scoreParseChapter` / 空页·稀页·覆盖率** 共享算法，让 **CLI `pnpm parse-check` + parse.py 后置**、**ingest uploaded/parsed 覆盖条 + extract 预检软警告**、**Overview 章行 + 书架 parse 覆盖徽（与 T55 cite 徽分列）** 同真落地。**禁止** empty-CTA densify、return densify、CitePeek 正文/trap redo、重做 T46–T55、写 `verified:true`、自动写 entities、Clew LLM 真写、FSRS、invent heye-only、ModeChips 插队、Queue→Due、⌘K、DeskShell 重写、真·卡内联编辑器、push。

**为何选这主题（对照候选）**：

| 候选 | 判定 |
|------|------|
| **parse/OCR 覆盖诚实 + ingest 抽出前 + 书桌/书架覆盖徽（本刀 · A–J）** | T54 检测 + T55 补救后最高杠杆**上游**生产诚实；seed 已证稀页存在；天然 MEGA；落在 materials→atoms 第三刀 |
| 批量重抽队列 UX（从 remediate 面板扩） | T55 已有 CopyCommand 重抽；增量偏薄，非第三脊梁 |
| 纯 QA 页路由渲 data/qa cite-ocr | 报告 gitignore；偏 chrome 仪表盘；T55 已 defer |
| 跨书 cite-check dashboard | CLI `--book` + 书架 cite 徽已覆盖扫视 |
| 真·字段级原子编辑器（local draft） | T55 leftover；易踩 Clew 真写 / verified / storage-key OUT；**顺延 T57+** |
| 又一轮 empty-CTA / return densify | **拒** — 井饱和 |
| 重做 T54/T55 bigram / 补救面板 / cite 徽 | **拒** — 刚闭；只**并行挂** parse 信号 |
| CitePeek 正文/trap / OCR canvas / 写 verified:true / Clew 真写 | **OUT forever** |
| FSRS / Queue→Due / invent heye-only | **OUT / DEFER** |
| Next.js security upgrade | **ops** — 非主题 |

---

## 三子主题

| # | 子主题 | 字母 |
|---|--------|------|
| 1 | parse 覆盖 lib + CLI parse-check + parse.py 后置 | A · B · C |
| 2 | ingest uploaded/parsed 覆盖条 + extract 预检软警告 + Register 旁挂 | D · E |
| 3 | Overview 章行 OCR 覆盖 + 书架 parse 覆盖徽（与 cite 徽分列） | F · G · H |
| — | 装配 + build + DEFER + 回归 | I · J |

---

## 字母一览（A–J）

| 字母 | 切片 | 估分 |
|------|------|------|
| **A** | 新薄 lib：`apps/web/lib/parse-ocr-coverage.ts` + 孪生 `scripts/lib/parse-ocr-coverage.mjs`（**keep in sync**，注释互指）：① 常量 `SPARSE_CHAR_THR=40`（文档化；可 opts 覆盖）；② `scorePageText(text)` → `{ chars, empty, sparse }`；③ `scoreParseChapter({ expectedPages?, pages, blocks? })` → `ParseCoverage`：`expectedPages` · `pagesPresent` · `emptyPages` · `sparsePages` · `blockCount` · `mainBlocks` · `coverageRate`（非空页/expected；expected≤0 则 fail-closed 用 pagesPresent）· `sparseRate` · `weak`（`emptyPages>0 \|\| sparsePages>0 \|\| coverageRate<0.85` 建议阈值，文档写清）；④ 读盘助手 `loadParseCoverage(chapterId)`（缺文件→`null` 未解析，**不**装假 0 覆盖「完美」）；⑤ **勿**改 `deriveMaterialStage` 二元推进（本刀只**暴露**覆盖，不把稀页章打回 uploaded——避免假回退） | 30–45 |
| **B** | 新 CLI：`scripts/parse-ocr-check.mjs` + `package.json` `"parse-check"`：① `pnpm parse-check -- ch01` 打印章汇总（期望页/实有/空/稀/块/覆盖率）；② `--sparse`（或 `SPARSE=1`）列出空页+稀页页码与 chars；③ 写 `data/qa/<ch>.parse-ocr.json`（**.gitignore 增** `data/qa/*.parse-ocr.json`，对齐 cite-ocr）；④ 可选 `--book <id>` 折叠多章一行；**禁止**改 blocks/entities | 25–40 |
| **C** | `parse_chapter.py` 后置：写盘后 stderr 兼报覆盖（空/稀/coverageRate）；默认警告仍写；`--strict` 且（`coverageRate<0.5` 或 `emptyPages/expected≥0.25`）→ 非零退出且**拒绝覆盖**已有 blocks（对齐 extract fail-closed 族）；勿改 OCR 引擎/DPI 大修 | 20–35 |
| **D** | ingest：① **parsed**（及 extracted/ready 章若有 blocks）章级覆盖条——`期望页 · 实有 · 空E · 稀S · 块 · 覆盖率%`（server 用 A）；`weak` → 琥珀短句「OCR 覆盖偏弱 · 抽出前建议重跑 parse 或收紧页范围」+ `CopyCommand` `pnpm parse <ids>`（弱章子集）；② **uploaded**：仍缺 blocks 的章保持 T45 缺章命令；**已有**部分章 blocks 时对**已解析子集**亦可显示覆盖（诚实增量，勿假装整物料 parsed）；③ **禁止**在 uploaded/parsed 装 T54/T55 cite 质量假 0 条（cite 条仍仅 extracted/ready） | 30–45 |
| **E** | extract 预检 + Register 旁挂：① `extract_cards.mjs` 开抽前跑 `scoreParseChapter`；stderr 警告 weak；`--strict` **另或**（既有 cite 条件外）在 `coverageRate<0.5 \|\| emptyPages>0` 时拒写（文档口径；与 C 阈值可共用常量注释）；默认警告仍抽；② Register `qualityWarn` **可选**旁挂 `parseWeak?: boolean` · `emptyPages?` · `sparsePages?`（有则琥珀兼点名「OCR 空/稀页」；触发仍软二次确认；**API 不 4xx**）；勿拆 T54/T55 miss/incomplete 条件 | 25–40 |
| **F** | DocumentPane Overview 章行：有 OCR 时在「N 页」旁或下行——若 `emptyPages\|\|sparsePages>0` 琥珀短徽「空E · 稀S」；全好不吵；无 blocks 保持既有「无 OCR 页」；**勿**掌握% / Due；**勿**重做 T55 cite 章行可选徽（可并存） | 25–40 |
| **G** | 书架书卡 **parse 覆盖徽**（与 T55 cite 质量徽**分列**）：每书折叠各章 `loadParseCoverage`；任章 `weak` → 第二琥珀短徽「OCR覆盖偏弱 · 空E · 稀S」（E/S 书级合计）；全好不吵；缺 blocks 章＝未检不抬假阳；链「去物料」→ `/ingest` 可选；**禁**把 cite 徽文案改写成覆盖徽、**禁**掌握%/Due/圆环 | 25–40 |
| **H** | Viewer / ChapterPageReader 轻量诚实（最小面）：当前页 `chars < SPARSE_CHAR_THR` 时页眉或页脚一行 muted/琥珀「本页 OCR 偏稀（N 字）· 抽取/核对可能不准」；正常页不吵；**禁** OCR canvas / CitePeek 正文·trap redo | 15–25 |
| **I** | 装配：ingest D←A；extract/Register E←A；Overview F←章 loadParseCoverage；书架 G 在 `app/(desk)/page.tsx` 与 bookQuality **并列**算 `bookParseCoverage`；Reader H 用当前 `pg.text`；fail-closed：缺文件→未检；**.gitignore** 确认 parse-ocr；**勿**毁 T55 补救面板/cite 徽 | 25–40 |
| **J** | `pnpm --filter web build` PASS；`pnpm parse-check -- ch01`（及可选 `--sparse`）可跑；`pnpm cite-check -- ch01` 回归绿；heye-only invent **DEFER**；真·卡内联编辑器 / QA 仪表盘 **DEFER**；**禁止**写 `verified: true`、**禁止**写回 entities/blocks 补救；回归 T55–T28；写手不 push | 20–30 |

**合计估**：约 **240–380** 分钟（落在 180–300+ MEGA 窗偏上；偏紧可压 H 为 title-only 稀页提示与 E Register 旁挂，**不可**砍 A/B/D/F/G）。若写手体感超额，优先保 A–B–D–F–G–J，C/E/H 最小面仍须交。

---

## 硬 OUT（本刀 + 站规 forever）

FSRS/Due · Clew LLM 真写 · **写 `verified:true` 过关** · **自动写回 / PATCH entities.json 或 blocks.json 当「补救」** · OCR canvas · CitePeek **正文/trap** redo · ⌘K · Queue→Due · DeskShell 重写 · exam-anchor 全量 · invent heye-only seed · ch08+ · nur-landing · 掌握% · 改名 storage keys · 强制清空整栈 · port ariadnemini verify/clew-API · ModeChips 中插队 · **return densify 当主题** · **empty-CTA densify 当主题** · **重做 T46–T55**（拆 bigram / 拆软门禁 / 拆补救面板 / 重做 cite 质量徽骨架） · Next.js upgrade 当主题 · 假池 · 只交 CLI 或只交一行章数字就收工 · 写手 push · ScopeCounts/「对页」加 **return** · SessionKeyHint→ShortcutSheet 大改 · 硬阻断 register API · 把稀页/空页伪装成 cite OCR未见或 seed verified · 真·实体卡内联编辑器当本刀 · 假云端 OCR / 假进度条 · 改 `deriveMaterialStage` 把稀页章打回 uploaded（本刀只暴露，不假回退状态机）。

Soft：heye-only invent **DEFER**；真·卡内联编辑器 / QA 仪表盘页 / 批量重抽队列 UX = leftover → 后续刀；Next.js security = ops not theme；Register API 硬门禁仍 leftover。

---

## 建议路径

```
apps/web/lib/parse-ocr-coverage.ts           # A 新建
scripts/lib/parse-ocr-coverage.mjs           # A 孪生 keep in sync
scripts/parse-ocr-check.mjs                  # B 新建
package.json                                 # B script parse-check
.gitignore                                   # B data/qa/*.parse-ocr.json
scripts/parse_chapter.py                     # C 后置 + 可选 --strict
scripts/extract_cards.mjs                    # E 预检
apps/web/app/(shell)/ingest/page.tsx         # D · I 覆盖条（uploaded/parsed+）
apps/web/components/RegisterMaterialButton.tsx # E 可选 parseWeak 旁挂
apps/web/components/desk/DocumentPane.tsx    # F Overview 章行
apps/web/app/(desk)/page.tsx                 # G 书架 parse 覆盖徽（并列 bookQuality）
apps/web/components/desk/ChapterPageReader.tsx # H 稀页提示
# 勿毁：cite-ocr-quality · T55 补救面板 · shelf cite 徽 · ocr-page.ts · book-pools · return-stack · CitePeek quote/trap · deriveMaterialStage 二元口径
# 勿写：data/cards/*.entities.json · 用本刀「修复」blocks 内容
# 可写：data/qa/<ch>.parse-ocr.json（报告，gitignore）
```

---

## 自测（须勾 · 摘要）

1. `scoreParseChapter` 对 ch01：`sparsePages≥1`（p.1 稀）或文档化阈值下 weak 可复现；缺文件 → null  
2. `pnpm parse-check -- ch01` 汇总含空/稀/覆盖率；`--sparse` 列出页；写出 parse-ocr.json；entities/blocks **未**改  
3. parse.py 默认警告可写；`--strict` 在极低覆盖拒覆盖  
4. extract 预检 stderr 对 weak 警告；`--strict` 口径含覆盖或条件文档化  
5. ingest · parsed/有 blocks 见覆盖条；weak 有 CopyCommand parse；uploaded 不装 cite 假 0；extracted 仍保留 T54/T55 条+补救面板  
6. Register · 有 parseWeak 旁挂则软二次；API 不 4xx；T54/T55 条件未拆  
7. Overview · 空/稀章琥珀；好章不吵；无 OCR 既有文案  
8. 书架 · parse 覆盖徽与 cite 质量徽分列；好书静音；无掌握%/Due  
9. Reader · 稀页提示；正常页无；CitePeek/canvas 未动  
10. build PASS；parse-check + cite-check 可跑；未 push；heye-only / 卡编辑器 / QA 页 DEFER；无 verified/entities 写入；回归 T55–T28  

---

## 验收口令

**做完叫验收。A–J 全交才过。**
