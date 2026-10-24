# Ariadne Task 57 — SCOPE（推荐下一刀 · T56 后 · **MEGA** ~180–300+ min）

**定稿**：2026-10-24 13:48 Asia/Shanghai（CST）· **after T56 `ee323f3`**  
**调度**：Grok Bot（executor）· 用户「Scope and write Ariadne Task 57 — MEGA knife… Prefer continue materials→atoms pipeline OR highest-leverage next product knife — NOT desk chrome densify」· **MEGA** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息**）  
**Tip 前置（硬）**：目标 tip = **`ee323f3`**（`docs(pipeline) Task 56 acceptance docs` atop feat `bf8af0e` pipeline-parse-coverage-01 atop `2389c26` T55）。  
- box `/workspace/Ariadne-push` 定稿时停在 **`ee323f3`**（`origin/main` 对齐）。  
- 开工时 `git log -1 --oneline` 须含 `ee323f3` / T56 docs。其下仍含 feat `bf8af0e`、T55 `2389c26`/`b350bd4`、T54 `994602f`/`d90d951`、T53–T28 既有。若仍停在 `bf8af0e`（仅 feat）或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3 max thinking（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。  
**Standing**：验收 PASS 后 **auto-push**（写手/验收方按站规；本 SCOPE 仍不 push）。用户 zcode 配额充足——**刀子必须更大**。

**用户策略（2026-10-24）**：诚实井 T43–T53 已干；T54 已交 **cite↔OCR 检测**；T55 已交 **miss 补救**；T56 已交 **抽出前 OCR 覆盖**（空/稀/块）。下一刀必须走 **抽出后页→原子覆盖诚实**（有实质 OCR 的印刷页却无任何卡 cite＝「暗页」）——**勿**再堆 empty-CTA / return densify，**勿** redo T54–T56，**勿**写 `verified:true` / Clew LLM 真写 / 自动 PATCH entities，**勿**开真·实体卡内联编辑器当本刀（leftover 再评 → 仍 DEFER）。

---

## 空池 CTA / return / OCR 深链 / T54–T56 井状态（硬声明）

**Empty-pool CTA densify 已饱和（T43–T51）**。  
**Return densify 已饱和（T35–T42）**。  
**T52–T53 已闭**：空·完成对称 / Quiz 书空 / Viewer←书桌 / Entity「对页」/ `pageInOcr` 鬼页 / HeYe u/z。  
**T54 已闭**：`cite-ocr-quality` · `pnpm cite-check` · extract `--strict` · ingest 质量条 · Register 软门禁 · Entity/HeYe/CiteChip「OCR 未见」。**不写 verified:true**。  
**T55 已闭**：`ocrNeighborhood` / `suggestQuoteFromOcr` / incompleteAtoms · CLI `--misses`/`--book` · ingest 补救面板 · Register incomplete · Entity/HeYe 复制级补救 · 书架 **cite** 质量徽。**剪贴板-only；不 PATCH entities**。  
**T56 已闭**：`parse-ocr-coverage` 孪生 · `pnpm parse-check` · parse.py 后置 · ingest 抽出前覆盖条 · extract 预检 · Overview/书架 **parse** 覆盖徽（与 cite 分列）· Reader 稀页提示。**不改 deriveMaterialStage 二元**。  
**本刀不是**又一轮 empty-CTA densify、**不是** return densify、**不是** CitePeek 正文/trap redo、**不是**重做 T46–T56（可**并行**挂暗页/抽出覆盖信号，禁止重写 bigram / 拆软门禁 / 拆补救面板 / 拆 shelf cite·parse 徽骨架）、**不是**真·卡内联编辑器。

相邻最强产品主题 = **材料→原子 pipeline 第四刀：抽出后页→原子覆盖诚实（暗页 = 实质 OCR 页零 cite）+ CLI page-check + ingest extracted 暗页面 + extract 后置软警告 + Overview/书架/Reader 暗页徽**（**不**自动改 entities、**不**翻 `verified:true`、**不** Clew LLM 真写、**不** FSRS、**不**真·卡内联编辑器）。

---

## 诚实评估 · 残余风险

desk-v4 诚实井已薄；T54–T56 把 **cite 质量**与 **抽出前 OCR** 点名了，但 **抽出后**日用仍缺「页有没有变成可考原子」：

| # | 面 | 撒谎 / 缺口 |
|---|----|-------------|
| ① | seed ch01 实测 | 18 页 OCR 全有字 · **仅 13 页被 cite** · **暗页 5**：p.1（稀+暗边界）· **p.7（1061 字正文无 cite）** · p.9 小结 · p.17 · p.18（跨章扉）——产品零信号 |
| ② | T54/T55 | 只问「cite 能否在 OCR 找到」——**不问**「OCR 页有没有被抽成原子」 |
| ③ | T56 | 只问空/稀/块——**稀页 ≠ 暗页**；实质页零 cite 仍「抽出成功」脸 |
| ④ | ingest extracted/ready | 有 miss/incomplete/parse 条——**无**暗页 D / 抽出页覆盖率 |
| ⑤ | Overview / 书架 | 有 OCR 空稀徽 + cite 质量徽——**无**暗页徽（与二者正交） |
| ⑥ | CLI | `cite-check` / `parse-check`——**无** `page-check` / extract-page-coverage 报告 |
| ⑦ | HeYe orphan | T52 orphan＝池空（页无待核）——**不等价**于「抽出从未覆盖该页」；暗页需**抽出覆盖**口径，勿吞改 orphan CTA |

捆成 **ONE MEGA**：共享 extract-page 覆盖算法（暗页）→ CLI page-check + extract 后置 → ingest extracted 暗页条 + Register 旁挂 → Overview 章行 + 书架暗页徽（与 cite/parse **三分列**）+ Reader 暗页提示。**禁止**把 `verified` 翻成 `true`；**禁止**写回 entities.json；**禁止**硬阻断 register API；**禁止**把暗页伪装成 cite OCR未见或 parse 稀页。

**真·原子字段编辑器（T55 leftover）诚实判定**：仍 **DEFER → T58+**，**不**作本刀主题。理由：① 易踩 Clew 真写 / `verified:true` / 改名 storage keys / 自动 PATCH OUT；② 即便压成 local-draft-only（新键草稿 · 只剪贴板导出 JSON patch · 永不 auto-PATCH · 永不翻 verified）也偏「编辑器 chrome」，杠杆低于暗页生产诚实；③ T55 已有 incomplete + 复制建议摘录，人修路径未断。若日后开刀：必须写死 local-draft-only 合同进 SCOPE，本刀不吞。

**残余风险（写进 SCOPE）**：若写手把本刀做成又一轮 empty-CTA / return densify、或 CitePeek 正文/trap redo、或重做 T54–T56、或偷偷写 `verified:true` / 自动 PATCH entities / Clew LLM 真写 / 真·卡内联编辑器 = 拒收。暗页阈值须**文档化**：`DARK` = 页 `chars >= SPARSE_CHAR_THR`（复用 T56=40）且该页在 cards 的 `cites`/`fields[].cite`/`atoms[].cite` 中 **零次**出现（page 精确匹配）；空/稀页计入 T56，**不**抬暗页假阳（chars&lt;thr → 非暗）。扉页/小结/跨章扉可能「合理暗」——默认**警告不阻断**；`--strict` 才在 `darkRate` 极高时拒写。Register 仍软门禁（可**旁挂** `darkPages`，勿改成硬 4xx）。Next.js security = ops not theme。heye-only invent 仍 DEFER。QA 仪表盘页 / 批量重抽队列 UX / 真·卡编辑器 = leftover → 后续刀。

---

## 推荐一刀（ONE · MEGA）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`pipeline-extract-page-coverage-01`** |
| **Title** | 抽出后页→原子覆盖诚实 · 暗页（实质 OCR 零 cite）· CLI page-check · ingest extracted · 书桌/书架/Reader 暗页徽 |
| **体量** | **~180–300+ min** 真实编码（**A–J** = 10 切片 · 3 子主题）。**若只做 CLI 或只做章行一行数字就收工 = 漏做 pipeline 面 = 拒收**。**若 15–30 / 90 分钟假装收工 = 漏做**。 |
| **产品脊梁** | 顾客材料 → OCR（T56 覆盖）→ 抽出 → **本刀：看得见哪些实质页从未变成原子** → cite 检测（T54）→ 补救（T55）→ 注册 —— 不把「抽出成功」假装「全书可考」、不污染 seed、不假翻 verified。 |

**一句话**：在 **`ee323f3`（T56）** 上，抽出 **`scoreExtractPageCoverage` / 暗页列表 / darkRate** 共享算法，让 **CLI `pnpm page-check` + extract 后置**、**ingest extracted 暗页条 + Register 旁挂**、**Overview 章行 + 书架暗页徽（与 cite/parse 三分列）+ Reader 暗页提示** 同真落地。**禁止** empty-CTA densify、return densify、CitePeek 正文/trap redo、重做 T46–T56、写 `verified:true`、自动写 entities、Clew LLM 真写、FSRS、invent heye-only、ModeChips 插队、Queue→Due、⌘K、DeskShell 重写、真·卡内联编辑器、push。

**为何选这主题（对照候选）**：

| 候选 | 判定 |
|------|------|
| **抽出后页→原子覆盖 / 暗页诚实（本刀 · A–J）** | T54–T56 后最高杠杆**下游**生产诚实；seed ch01 已证暗页存在（含整页正文 p.7）；天然 MEGA；落在 materials→atoms 第四刀 |
| 真·字段级原子编辑器（local-draft-only） | T55 leftover；易踩 Clew/verified/storage/PATCH OUT；即便紧合同仍偏编辑器 chrome——**再 DEFER T58+** |
| 纯 QA 页路由渲 data/qa | 报告 gitignore；偏 chrome 仪表盘；继续 DEFER |
| 批量重抽队列 UX（扩 T55 面板） | T55 已有 CopyCommand 重抽；增量偏薄，非第四脊梁 |
| 跨书 cite-check / parse-check dashboard | CLI `--book` + 书架徽已覆盖扫视 |
| 又一轮 empty-CTA / return densify | **拒** — 井饱和 |
| 重做 T54/T55/T56 bigram / 补救 / cite·parse 徽 | **拒** — 刚闭；只**并行挂**暗页信号 |
| CitePeek 正文/trap / OCR canvas / 写 verified:true / Clew 真写 | **OUT forever** |
| FSRS / Queue→Due / invent heye-only | **OUT / DEFER** |
| Next.js security upgrade | **ops** — 非主题 |
| 把 HeYe orphan CTA 改写成暗页主题 | **拒** — orphan≠抽出覆盖；可**旁挂**暗页提示，勿吞 orphan 分型 |

---

## 三子主题

| # | 子主题 | 字母 |
|---|--------|------|
| 1 | extract-page 覆盖 lib + CLI page-check + extract 后置 | A · B · C |
| 2 | ingest extracted 暗页条 + Register 旁挂 | D · E |
| 3 | Overview 章行 + 书架暗页徽 + Reader 暗页提示 | F · G · H |
| — | 装配 + build + DEFER + 回归 | I · J |

---

## 字母一览（A–J）

| 字母 | 切片 | 估分 |
|------|------|------|
| **A** | 新薄 lib：`apps/web/lib/extract-page-coverage.ts` + 孪生 `scripts/lib/extract-page-coverage.mjs`（**keep in sync**，注释互指）：① 复用/import 文档化 `SPARSE_CHAR_THR=40`（与 T56 同常量口径；mjs 可复制常量+注释互指，勿漂移）；② `collectCitedPages(cards)` → `Set<number>`（并集 `cites`·`fields[].cite`·`atoms[].cite` 的非空 page）；③ `scoreExtractPageCoverage({ pages, cards })` → `ExtractPageCoverage`：`pagesPresent` · `substantialPages`（chars≥thr）· `citedPages` · `darkPages`（substantial ∩ ¬cited，**有序列表**）· `darkCount` · `darkRate`（darkCount/substantialPages；substantial=0 → fail-closed rate=0 且 `weak=false` 未检意义用 `null` 文件层表达）· `weak`（建议 `darkCount>0`，文档写清；扉页合理暗仍 weak——警告不阻断）；④ `loadExtractPageCoverage(chapterId)`：缺 blocks 或缺 entities → `null`（未检，**不**装 darkCount=0 完美）；⑤ **勿**改 `deriveMaterialStage`；**勿**把暗页写进 cite-ocr-quality miss | 30–45 |
| **B** | 新 CLI：`scripts/extract-page-check.mjs` + `package.json` `"page-check"`：① `pnpm page-check -- ch01` 打印章汇总（实质页/已 cite/暗D/darkRate）；② `--dark`（或 `DARK=1`）列出暗页页码与 chars 截断预览；③ 写 `data/qa/<ch>.extract-page.json`（**.gitignore 增** `data/qa/*.extract-page.json`，对齐 cite-ocr / parse-ocr）；④ 可选 `--book <id>` 折叠多章一行；**禁止**改 blocks/entities | 25–40 |
| **C** | `extract_cards.mjs` 后置：写盘后 stderr 兼报暗页摘要（darkCount/darkRate + 顶层暗页样例 ≤8）；默认警告仍写；`--strict` **另或**（既有 T54/T55/T56 条件外）在 `darkRate≥0.35` 或 `darkCount≥5`（文档化阈值，可 opts）时拒写；**勿**大修 extract prompt；**勿**自动发明 cite 填暗页 | 20–35 |
| **D** | ingest：**extracted/ready** 章级暗页条——`实质页 · 已cite · 暗D · darkRate%`（server 用 A）；`weak` → 琥珀短句「抽出页覆盖偏稀 · 暗页未成原子」+ 顶层暗页样例 ≤6（页码 mono + chars）+ `CopyCommand` `pnpm extract -- <ch>`（弱章子集，复用 T45/T55 命令块族）；**uploaded/parsed** **不**装暗页假 0 条（无 cards＝未抽出，不是 darkCount=0）；保留 T54/T55 质量条+补救面板与 T56 parse 覆盖条（并列，勿吞） | 30–45 |
| **E** | Register 旁挂：`qualityWarn` 可选 `darkPages?` · `darkCount?` · `darkRate?`（有则琥珀兼点名「暗页 D」；触发仍软二次确认——建议 OR `darkCount>0` 入既有 warn 族，**勿**硬 4xx）；勿拆 missRate/zeroAtom/incomplete/parseWeak | 20–30 |
| **F** | DocumentPane Overview 章行：有 cards+blocks 时——若 `darkCount>0` 琥珀短徽「暗D」（D=darkCount）；全好不吵；无 cards 不装暗徽（未抽出≠零暗）；**勿**掌握%/Due；**可**与 T55 cite / T56 空稀徽三分列并存 | 25–40 |
| **G** | 书架书卡 **暗页/抽出覆盖徽**（与 T55 cite · T56 parse **三分列**）：每书折叠各章 `loadExtractPageCoverage`；任章 `weak` → 第三琥珀短徽「抽出偏稀 · 暗D」（D=书级 darkCount 合计）；全好不吵；缺 cards/blocks 章＝未检不抬假阳；链「去物料」→ `/ingest` 可选；**禁**把 cite/parse 徽文案改写成暗徽、**禁**掌握%/Due/圆环 | 25–40 |
| **H** | Viewer / ChapterPageReader 轻量诚实（最小面）：当前页若 `chars≥SPARSE_CHAR_THR` 且 page ∉ citedSet（服务端可下传章级 `darkPageSet` 或 citedSet）→ 页眉/页脚一行 muted/琥珀「本页 OCR 实质但无抽出 cite · 可能未覆盖进原子」；稀页仍走 T56 稀页提示（优先稀页文案，勿双吵——chars&lt;thr 只稀不暗）；**禁** OCR canvas / CitePeek 正文·trap redo | 20–30 |
| **I** | 装配：ingest D←A；extract C←A；Register E←A；Overview F←章 loadExtractPageCoverage；书架 G 在 `app/(desk)/page.tsx` 与 bookQuality / bookParse **并列**算 `bookExtractPage`；Reader H 用章 citedSet + 当前 `pg.text`；fail-closed：缺文件→未检；**.gitignore** 确认 extract-page；**勿**毁 T55 补救/cite 徽 · T56 parse 徽/稀页提示 | 25–40 |
| **J** | `pnpm --filter web build` PASS；`pnpm page-check -- ch01`（及 `--dark`）可跑且 ch01 反映 dark≥1（seed 预期）；`pnpm cite-check -- ch01` + `pnpm parse-check -- ch01` 回归绿；heye-only invent **DEFER**；真·卡内联编辑器 **DEFER**（合同备注 local-draft-only 留给后续）；QA 仪表盘 **DEFER**；**禁止**写 `verified: true`、**禁止**写回 entities/blocks「补暗」；回归 T56–T28；写手不 push | 20–30 |

**合计估**：约 **240–380** 分钟（落在 180–300+ MEGA 窗偏上；偏紧可压 H 为 title-only 暗页提示与 E Register 旁挂，**不可**砍 A/B/D/F/G）。若写手体感超额，优先保 A–B–D–F–G–J，C/E/H 最小面仍须交。

---

## 硬 OUT（本刀 + 站规 forever）

FSRS/Due · Clew LLM 真写 · **写 `verified:true` 过关** · **自动写回 / PATCH entities.json 或 blocks.json 当「补暗/补救」** · OCR canvas · CitePeek **正文/trap** redo · ⌘K · Queue→Due · DeskShell 重写 · exam-anchor 全量 · invent heye-only seed · ch08+ · nur-landing · 掌握% · 改名 storage keys · 强制清空整栈 · port ariadnemini verify/clew-API · ModeChips 中插队 · **return densify 当主题** · **empty-CTA densify 当主题** · **重做 T46–T56**（拆 bigram / 拆软门禁 / 拆补救面板 / 重做 cite·parse 徽骨架） · Next.js upgrade 当主题 · 假池 · 只交 CLI 或只交一行章数字就收工 · 写手 push · ScopeCounts/「对页」加 **return** · SessionKeyHint→ShortcutSheet 大改 · 硬阻断 register API · 把暗页伪装成 cite OCR未见或 parse 稀页或 seed verified · 真·实体卡内联编辑器当本刀 · 假云端 OCR / 假进度条 · 改 `deriveMaterialStage` · 自动给暗页发明 cite/原子 · 吞改 HeYe orphan 分型当暗页主题。

Soft：heye-only invent **DEFER**；真·卡内联编辑器（若开：local-draft-only · 无 verified · 无 auto PATCH · 不改名既有 storage keys）/ QA 仪表盘页 / 批量重抽队列 UX = leftover → 后续刀；Next.js security = ops not theme；Register API 硬门禁仍 leftover。

---

## 建议路径

```
apps/web/lib/extract-page-coverage.ts           # A 新建
scripts/lib/extract-page-coverage.mjs           # A 孪生 keep in sync
scripts/extract-page-check.mjs                  # B 新建
package.json                                    # B script page-check
.gitignore                                      # B data/qa/*.extract-page.json
scripts/extract_cards.mjs                       # C 后置 + 可选 --strict OR
apps/web/app/(shell)/ingest/page.tsx            # D · I 暗页条（extracted/ready）
apps/web/components/RegisterMaterialButton.tsx  # E 可选 dark* 旁挂
apps/web/components/desk/DocumentPane.tsx       # F Overview 章行暗徽
apps/web/app/(desk)/page.tsx                    # G 书架暗页徽（并列 bookQuality / bookParse）
apps/web/components/desk/ChapterPageReader.tsx  # H 暗页提示（与 T56 稀页提示协调）
# 可选 server helper：apps/web/lib/extract-page-coverage-server.ts（对齐 parse-ocr-coverage-server）
# 勿毁：cite-ocr-quality · parse-ocr-coverage · T55 补救面板 · shelf cite/parse 徽 · ocr-page.ts · book-pools · return-stack · CitePeek quote/trap · deriveMaterialStage · HeYe orphan 分型
# 勿写：data/cards/*.entities.json · 用本刀「补暗」写 cite
# 可写：data/qa/<ch>.extract-page.json（报告，gitignore）
```

---

## 自测（须勾 · 摘要）

1. `scoreExtractPageCoverage(ch01)`：`darkCount≥1`（seed 预期含 p.7 等）；缺文件 → null；chars&lt;thr 页不进 dark  
2. `pnpm page-check -- ch01` 汇总含实质/cite/暗/darkRate；`--dark` 列页；写出 extract-page.json；entities/blocks **未**改  
3. extract 后置 stderr 报暗；默认可写；`--strict` 在极高 darkRate/darkCount 拒写（口径文档化）  
4. ingest · extracted/ready 见暗页条；weak 有 CopyCommand extract；uploaded/parsed 不装暗假 0；T54–T56 条保留  
5. Register · 有 dark 旁挂则软二次；API 不 4xx；既有 warn 条件未拆  
6. Overview · 暗章琥珀「暗D」；好章不吵；未抽出不装暗徽  
7. 书架 · 暗页徽与 cite/parse 徽三分列；好书静音；无掌握%/Due  
8. Reader · 实质暗页提示；稀页只走 T56；正常页无；CitePeek/canvas 未动  
9. build PASS；page-check + cite-check + parse-check 可跑；未 push；heye-only / 卡编辑器 / QA 页 DEFER；无 verified/entities 写入；回归 T56–T28  

---

## 验收口令

**做完叫验收。A–J 全交才过。**
