# Ariadne Task 54 — SCOPE（推荐下一刀 · T53 后 · **MEGA** ~180–300+ min）

**定稿**：2026-10-24 11:06 Asia/Shanghai（CST）· **after T53 `d518876`**  
**调度**：Grok Bot（executor）· 用户「Scope and write Ariadne Task 54 — MEGA knife… Prefer real product spine over more chrome honesty when honesty is dry」· **MEGA** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息**）  
**Tip 前置（硬）**：目标 tip = **`d518876`**（`docs(desk) Task 53 acceptance docs` atop feat `eefb0e0` desk-ocr-cite-heye-undo-01）。  
- box `/workspace/Ariadne-push` 定稿时停在 **`d518876`**（`origin/main` 对齐）。  
- 开工时 `git log -1 --oneline` 须含 `d518876` / T53 docs。其下仍含 feat `eefb0e0`、T52 `2f43ce9`/`64ddb11`、T51–T28 既有。若仍停在 `eefb0e0`（仅 feat）或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3 max thinking（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。  
**Standing**：验收 PASS 后 **auto-push**（写手/验收方按站规；本 SCOPE 仍不 push）。用户 zcode 配额充足——**刀子必须更大**。

**用户策略（2026-10-24）**：desk shell ~70% 日用 · learning loop ~25% · production ~10–15%。诚实井 T53 后已薄——**下一阶段优先真产品脊梁（材料→原子）**，勿再堆 chrome 诚实 densify。

---

## 空池 CTA / return / OCR 深链井状态（硬声明）

**Empty-pool CTA densify 已饱和（T43–T51）**。  
**Return densify 已饱和（T35–T42）**。  
**T52 已闭**：空·完成态文案对称 + Quiz 书空 + Viewer←书桌带页 + Entity「对页」OCR。  
**T53 已闭**：`pageInOcr`/`deskPageHref` + CiteChip/Peek开桌/瓷砖对页/HeYe开桌/Study deskBack 鬼页诚实 + HeYe u/z。  
**本刀不是**又一轮 empty-CTA densify、**不是** return densify、**不是** CitePeek 正文/trap redo、**不是**重做 T46–T53。

相邻最强产品主题 = **材料→原子 pipeline 第一刀：cite quote↔OCR 机检质量门 + ingest/注册面暴露 + 卡详/核页日用诚实条**（**不**写 `verified:true`、**不** Clew LLM 真写、**不** FSRS）。

---

## 诚实评估 · 残余风险

desk-v4 **empty-CTA / return / OCR 深链诚实井已薄**。审计 tip `d518876` 上**非 empty-CTA、非 return、非 T46–T53-redo** 的**产品脊梁**残差：

| # | 面 | 撒谎 / 缺口 |
|---|----|-------------|
| ① | `pnpm extract` | sanitize 只校页码范围；**不**跑 quote↔OCR bigram（QA 手稿里写过 ≥0.6，脚本未产品化） |
| ② | ingest 物料卡 | 只报 blocks N/M · cards N/M；**不**报 OCR 未见 / 无页 / 零原子 —— 注册前看不见抽取质量 |
| ③ | Register | 抽出即注册；弱 cite / 零原子卡可进书库污染书桌练核池 |
| ④ | EntityCardDetail 诚实条 | 有「有页 / p.? / 抽查未核」；**无**「OCR 未见」（quote 不在该页 OCR）——与 `data/qa` 机检口径脱节 |
| ⑤ | HeYeSession 核页 | 左 quote / 右 OCR 并置，但**不**提示摘录是否落在本页 OCR——日用核最痛的「摘错/OCR 漂」无信号 |
| ⑥ | 共享算法 | bigram 覆盖只活在 QA markdown 叙述里；web/CLI **无**可复用 lib |

捆成 **ONE MEGA**：共享 cite↔OCR 质量算法 → CLI 机检 + extract 后置报告 → ingest/注册门禁暴露 → 卡详/核页日用同真。**禁止**把 `verified` 翻成 `true` 当过关。

**残余风险（写进 SCOPE）**：若写手把本刀做成又一轮 atom/pending empty-CTA、或 CitePeek 正文/trap redo、或重做 T53 OCR 深链/u/z、或偷偷写 `verified:true` / Clew LLM 真写 = 拒收。OCR 误识（入/人）会抬高「未见」——须用 bigram≥0.6（与 QA 同族）而非硬 substring，文案点名「可能 OCR 误差或抽取出错」。Register 默认 **软门禁**（琥珀警告 + 二次确认「仍要注册」），勿一刀砍死合法弱稿。Next.js security = ops not theme。heye-only invent 仍 DEFER。

---

## 推荐一刀（ONE · MEGA）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`pipeline-cite-ocr-quality-01`** |
| **Title** | cite quote↔OCR 质量门 · extract/ingest/注册暴露 · 卡详/核页 OCR 未见日用诚实 |
| **体量** | **~180–300+ min** 真实编码（**A–J** = 10 切片 · 3 子主题）。**若只做 lib 或只做 HeYe 一条琥珀就收工 = 漏做 pipeline 面 = 拒收**。**若 15–30 / 90 分钟假装收工 = 漏做**。 |
| **产品脊梁** | 顾客材料 → OCR → 抽取实体卡/原子 → **日用：抽出后看得见 cite 质量；弱稿注册前被点名；卡详/核页对「OCR 未见」同真 —— 不污染书桌练核池、不假翻 verified**。 |

**一句话**：在 **`d518876`（T53）** 上，抽出 **`quoteInOcr` / `scoreCard` / `scoreChapter` 共享质量算法**，让 **CLI cite-check + extract 后置报告**、**ingest 物料质量条 + 注册软门禁**、**EntityCardDetail「OCR 未见」+ HeYe 核页摘录未见琥珀** 同真落地。**禁止** empty-CTA densify、return densify、CitePeek 正文/trap redo、重做 T46–T53、写 `verified:true`、Clew LLM 真写、FSRS、invent heye-only、ModeChips 插队、Queue→Due、⌘K、DeskShell 重写、push。

**为何选这主题（对照候选）**：

| 候选 | 判定 |
|------|------|
| **cite↔OCR 质量门 + ingest/注册 + 卡详/核页（本刀 · A–J）** | 诚实井干后最高杠杆**产品脊梁**；QA 口径已存在但未产品化；天然 MEGA；落在 production~10–15% + 核页日用 |
| 又一轮 empty-CTA densify | **拒** — 井饱和 |
| 又一轮 saveReturn /「对页」+return | **拒** — return 井干 |
| 重做 T53 pageInOcr / HeYe u/z / 鬼页深链 | **拒** — 刚闭；只回归 |
| CitePeek 正文/trap / OCR canvas | **OUT forever** |
| 把 seed `verified` 批量改 true | **OUT forever** — 本刀只**读** verified 作既有条，另开「OCR 未见」信号 |
| Clew LLM 真写 / FSRS / Queue→Due / invent heye-only | **OUT / DEFER** |
| 纯 refactor 抽 lib 不接线 ingest/核页 | **拒** — 太薄；必须多面落地 |
| Next.js security upgrade | **ops** — 非主题 |
| Study 揭示节奏 / 键帽再 densify | **拒** — chrome；非脊梁 |

---

## 三子主题

| # | 子主题 | 字母 |
|---|--------|------|
| 1 | 共享 cite↔OCR 质量算法 + CLI / extract 后置 | A · B · C |
| 2 | ingest 物料质量条 + 注册软门禁 | D · E |
| 3 | 卡详 / 核页日用「OCR 未见」诚实（学习环 25% 日用） | F · G · H |
| — | 装配 + build + DEFER + 回归 | I · J |

---

## 字母一览（A–J）

| 字母 | 切片 | 估分 |
|------|------|------|
| **A** | 新薄 lib：`apps/web/lib/cite-ocr-quality.ts` + 孪生 `scripts/lib/cite-ocr-quality.mjs`（算法同真，注释互指）：`normalizeText` · `bigramCoverage(quote, pageText)` · `quoteInOcr(quote, pageText, thr=0.6)` · `scoreCard(card, pageTextByPage)` · `scoreChapter(cards, pageTextByPage)` → `{cards, atoms, cites, nullPage, ocrMiss, zeroAtomCards, missRate}` | 25–40 |
| **B** | 新 CLI：`scripts/cite-ocr-check.mjs` + `package.json` script `"cite-check"`：`pnpm cite-check -- ch01` 读 cards+blocks，打印汇总 + 写 `data/qa/<ch>.cite-ocr.json`（gitignore 可选；或进 data/qa 跟踪——默认**写入** `data/qa/` 供人读；勿改 entities.json 的 verified） | 25–40 |
| **C** | `extract_cards.mjs` 后置：sanitize 写盘前/后跑同算法；stderr 打 `ocrMiss/cites missRate=`；默认**警告不阻断**；`--strict` 且 missRate>0.4（或 zeroAtomCards>0）→ 非零退出且**拒绝覆盖**已有 entities（对齐空抽 fail-closed） | 20–35 |
| **D** | ingest/page：extracted/ready 物料章级质量条——`cards · atoms · OCR未见 · 无页p.? · 零原子卡`（server 用 A 的 score + `loadCards`/`loadChapterPages`）；uploaded/parsed 不装假 0 | 25–40 |
| **E** | Register 软门禁：ingest 下传 `qualityWarn?: { ocrMiss, zeroAtomCards, missRate, nullPage }`；`missRate≥0.25` 或 `zeroAtomCards>0` → 主按钮旁琥珀点名 + 首次点击改「质量偏弱 · 仍要注册 →」二次确认；API **不**硬 4xx（软门禁）；成功三连空池门禁（T49）只回归 | 25–40 |
| **F** | EntityCardDetail：诚实条加「OCR 未见 N」（有页且 quote 机检未过）；N>0 琥珀；文案点名与 seed `verified` **分列**、互不写入；props 增 `pageTextByPage?: Record<number,string>` 或预计算 `ocrMissCount`（服务端算优） | 25–40 |
| **G** | HeYeSession：当前项有 quote+page 且 `pages[page].text` 在 → `!quoteInOcr` 时 blockquote 下琥珀「摘录未在本页 OCR 中找到（可能 OCR 误差或抽取出错）」；有匹配不吵；无 text/无页走既有缺页琥珀；**不**改 mark / undo / verified | 20–35 |
| **H** | CiteChip 可选 `ocrMiss?: boolean`：true → title/后缀点名「OCR 未见」（视觉仍 chip 族；**不**改 Link 门禁——鬼页仍吃 T53 `pageInOcr`）；CardCard / Entity 字段·原子旁 CiteChip 能取到则传 | 15–25 |
| **I** | 装配：ingest score 章集合；desk/card + entities/[id] 为 Detail 预计算 ocrMiss / pageText；DocumentPane CardCard 下传 ocrMiss（按 primary cite）；ChapterPageReader 可选；review/page HeYe 已有 pages.text——只确认 G 接线；**禁止**造假正数 / 假 OCR 文本 | 25–40 |
| **J** | `pnpm --filter web build` PASS；`pnpm cite-check -- ch01` 可跑出报告；heye-only invent **DEFER**；**禁止**写任何 `verified: true` 进 entities；回归 T53–T28；写手不 push | 20–30 |

**合计估**：约 **225–365** 分钟（落在 180–300+ MEGA 窗偏上；偏紧可压 H 视觉，**不可**砍 A/B/D/E/F/G）。若写手体感超额，优先保 A–G+J，H 可降为 title-only——但仍须交 H 最小面。

---

## 硬 OUT（本刀 + 站规 forever）

FSRS/Due · Clew LLM 真写 · **写 `verified:true` 过关** · OCR canvas · CitePeek **正文/trap** redo · ⌘K · Queue→Due · DeskShell 重写 · exam-anchor 全量 · invent heye-only seed · ch08+ · nur-landing · 掌握% · 改名 storage keys · 强制清空整栈 · port ariadnemini verify/clew-API · ModeChips 中插队 · **return densify 当主题** · **empty-CTA densify 当主题** · **重做 T46–T53** · Next.js upgrade 当主题 · 假池 · 只交 lib 不接线或多面漏做就收工 · 写手 push · ScopeCounts/「对页」加 **return** · SessionKeyHint→ShortcutSheet 大改 · 硬阻断 register API（本刀软门禁）· 用 substring-only 代替 bigram（与 QA 口径分裂）· 把「OCR 未见」伪装成 seed verified。

Soft：heye-only invent **DEFER**；Next.js security = ops not theme；Register API 硬门禁可记 leftover → 后续刀。

---

## 建议路径

```
apps/web/lib/cite-ocr-quality.ts              # A 新建
scripts/lib/cite-ocr-quality.mjs              # A 孪生
scripts/cite-ocr-check.mjs                    # B 新建
package.json                                  # B script cite-check
scripts/extract_cards.mjs                     # C 后置
apps/web/app/(shell)/ingest/page.tsx          # D · I
apps/web/components/RegisterMaterialButton.tsx # E
apps/web/components/EntityCardDetail.tsx      # F · H
apps/web/components/HeYeSession.tsx           # G
apps/web/components/CiteChip.tsx              # H
apps/web/components/desk/DocumentPane.tsx     # H · I（CardCard）
apps/web/app/(desk)/desk/card/[id]/page.tsx  # I
apps/web/app/(shell)/entities/[id]/page.tsx  # I
apps/web/app/(desk)/review/page.tsx           # I 核对 pages → HeYe
# 勿毁：ocr-page.ts · book-pools.ts · return-stack · CitePeek quote/trap
# 勿写：data/cards/*.entities.json 的 verified 字段
# 可写：data/qa/<ch>.cite-ocr.json（报告，非 seed 真源）
```

---

## 自测（须勾 · 摘要）

1. `quoteInOcr("机体识别", pageText)` 有原文 → true；乱序/无关短串 → false；`thr` 默认 0.6  
2. `pnpm cite-check -- ch01` 打印汇总且写出 `data/qa/ch01.cite-ocr.json`；**未**改 entities verified  
3. extract `--strict` 在高 miss 时拒写；默认路径只警告  
4. ingest · extracted/ready 见质量条数字；uploaded 不见假 0 条  
5. Register · 高 miss / 零原子 → 琥珀 + 二次「仍要注册」；低 miss 一键注册仍在  
6. EntityCardDetail · OCR 未见 N 与「抽查未核」分列；N=0 不吵  
7. HeYe · 人为用未落入 OCR 的 quote（或挑 seed miss）→ 琥珀；匹配句无琥珀；T53 u/z / 开桌鬼页未毁  
8. CiteChip ocrMiss title/后缀；T53 鬼页门禁未毁  
9. build PASS；cite-check 可跑；未 push；heye-only DEFER；无 verified 写入  
10. 回归：T53 pageInOcr/deskPageHref/HeYe u/z；T52 空·完成/Quiz书空/Viewer/Entity对页；T51 Clew/Strip/交叉；T50 book-pools；T49 ingest 三连/CitePeek **浮层 CTA** + **正文/trap**；T48–T28 leaveReturn；ModeChips 未插队；Queue≠Due；empty-CTA 门禁未拆

---

## 验收口令

**做完叫验收。A–J 全交才过。**
