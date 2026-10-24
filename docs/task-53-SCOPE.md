# Ariadne Task 53 — SCOPE（推荐下一刀 · T52 后 · **MEGA** ~180–300+ min）

**定稿**：2026-10-24 00:59 Asia/Shanghai（CST）· **after T52 `2f43ce9`**  
**调度**：Grok Bot（executor）· 用户「Scope and write Ariadne Task 53 — MEGA knife… Prefer shared helpers / multi-surface honesty or product utility」· **MEGA** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息**）  
**Tip 前置（硬）**：目标 tip = **`2f43ce9`**（`docs(desk) Task 52 acceptance docs` atop feat `64ddb11` desk-empty-complete-widen-viewer-01）。  
- box `/workspace/Ariadne-push` 定稿时停在 **`2f43ce9`**（`origin/main` 对齐）。  
- 开工时 `git log -1 --oneline` 须含 `2f43ce9` / T52 docs。其下仍含 feat `64ddb11`、T51 `2e30178`/`6744e4b`、T50–T28 既有。若仍停在 `64ddb11`（仅 feat）或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3 max thinking（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。  
**Standing**：验收 PASS 后 **auto-push**（写手/验收方按站规；本 SCOPE 仍不 push）。用户 zcode 配额充足——**刀子必须更大**。

---

## 空池 CTA / return 井状态（硬声明）

**Empty-pool CTA densify 已饱和（T43–T51）**：Clew / Strip / 书头 / Quiz核 / 交叉 / 书架续开 / ingest 三连 / CitePeek 浮层练核 CTA / 轨顶 / Overview / CardCard·搜索核门禁——均已关。  
**Return densify 已饱和（T35–T42）**；T52 soft OUT「对页」加 return 延续。  
**T52 已闭**：空·完成态文案对称 + Quiz 放宽书空 + Viewer←书桌带页 + EntityCardDetail「对页/开本页」OCR 门禁。  
**本刀不是**又一轮 empty-CTA densify、**不是** return densify、**不是**重做 T46–T52。

相邻最强产品主题 = **共享 OCR 页 helper + 多面「书桌深链」鬼页诚实 + 核页撤销与练环对称**（产品效用，非再给练/核 CTA 加 atom/pending 门禁）。

---

## 诚实评估 · 残余风险

desk-v4 **empty-CTA 诚实井已薄**。审计 tip `2f43ce9` 上**非 empty-CTA、非 return、非 T46–T52-redo** 日用撒谎 / 产品残差：

| # | 面 | 撒谎 / 缺口 |
|---|----|-------------|
| ① | `CiteChip` `/desk?book=&page=` | **不查 validPages** → 鬼页深链（T52 只关了 Entity「对页」） |
| ② | CitePeek 浮层「在书桌打开 →」 | **同族鬼页**（只动 nav；**正文/trap forever OUT**） |
| ③ | DocumentPane CardCard「对页 →」 | **同族**——Entity 已门禁，瓷砖未跟（互谎） |
| ④ | HeYeSession「在书桌打开 p.N」 | 右栏已琥珀「找不到 OCR」，**左链仍恒可点**进鬼页 |
| ⑤ | StudySession deskBack | atom cite.page / lastAtomPage **可不在 validPages** 仍拼 `&page=`（last-opened 侧已 heal，atom 侧未跟） |
| ⑥ | EntityCardDetail `ocrHas` | T52 内联；ACCEPT soft leftover **未抽 `pageInOcr` helper** |
| ⑦ | HeYeSession 撤销 | Study 有 u/z 本轮撤销栈；**核页无对称撤销**——日用误触 1/2/b 无法回退 |

捆成 **ONE MEGA**：共享 helper → 多面鬼页同真 + 核页撤销产品效用。

**残余风险（写进 SCOPE）**：若写手把本刀做成又一轮 atom/pending empty-CTA、或 CitePeek 正文/trap redo、或重做 T52 Entity/Viewer = 拒收。HeYe 批量 `b` 撤销须单栈条目（勿逐条拆成难回滚）。Next.js security = ops not theme。heye-only invent 仍 DEFER。

---

## 推荐一刀（ONE · MEGA）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`desk-ocr-cite-heye-undo-01`** |
| **Title** | 共享 OCR 页 helper · CiteChip/Peek开桌/瓷砖对页/核练回桌鬼页诚实 · 核页 u/z 撤销对称 |
| **体量** | **~180–300+ min** 真实编码（**A–J** = 10 切片 · 3 子主题）。**若只做 helper 或只做 HeYe undo 就收工 = 漏做多面 OCR = 拒收**。**若 15–30 / 90 分钟假装收工 = 漏做**。 |
| **产品脊梁** | 顾客材料 → cite 页码 → **日用：点 p.N / 对页 / 在书桌打开 / 回书桌本页 —— 只进真有 OCR 的印刷页；核页误标可 u/z 回退 —— 与 Entity 对页 / Viewer 带页同真**。 |

**一句话**：在 **`2f43ce9`（T52）** 上，抽出 **`pageInOcr` / `deskPageHref` 共享 helper**，让 **CiteChip · CitePeek「在书桌打开」· CardCard「对页」· HeYe「在书桌打开」· Study deskBack** 对鬼页同真降纯文/回落书级，并给 **HeYeSession 本轮撤销栈（u/z）对齐 Study**；迁移 EntityCardDetail 内联 `ocrHas`。**禁止** empty-CTA densify 主题、return densify、CitePeek 正文/trap redo、重做 T46–T52、FSRS、Clew LLM、`verified:true`、invent heye-only、ModeChips 插队、Queue→Due、⌘K、DeskShell 重写、push。

**为何选这主题（对照候选）**：

| 候选 | 判定 |
|------|------|
| **OCR 鬼页多面 + HeYe undo + shared helper（本刀 · A–J）** | T52 soft leftover（pageInOcr）+ 多面仍装能进鬼页 + 核页缺撤销；最高杠杆**非 empty-CTA、非 return、非 T46–T52-redo**；共享 helper 天然扩成 MEGA |
| 又一轮 empty-CTA densify | **拒** — 井饱和 |
| 又一轮 saveReturn /「对页」+return | **拒** — return 井干；soft OUT |
| 重做 T52 Entity 对页 / Viewer / 空·完成文案 | **拒** — 刚闭；只回归 + 迁移 helper |
| CitePeek 正文/trap / OCR canvas | **OUT forever** |
| heye-only invent / Clew LLM / FSRS / Queue→Due | **OUT / DEFER** |
| 纯 refactor 抽 helper 不接线多面 | **拒** — 太薄；必须多面落地 |
| Next.js security upgrade | **ops** — 非主题 |

---

## 三子主题

| # | 子主题 | 字母 |
|---|--------|------|
| 1 | 共享 OCR 页 helper + 迁移 T52 内联 | A · I |
| 2 | 多面书桌深链鬼页诚实（CiteChip / Peek开桌 / 瓷砖对页 / HeYe开桌 / Study deskBack） | B · C · D · E · F |
| 3 | HeYe 本轮撤销（u/z）与键帽同真 | G · H |
| — | build + DEFER + 回归 | J |

---

## 字母一览（A–J）

| 字母 | 切片 | 估分 |
|------|------|------|
| **A** | 新薄 lib：`pageInOcr(validPages, page)` + `deskPageHref(bookId, page, validPages?)`（`validPages==null` → 不门禁，对齐 T52；∉ → null；∈ → `/desk?book=&page=`） | 15–25 |
| **B** | CiteChip：可选 `bookValidPages?: number[]`；书桌深链鬼页 → 纯文 span「本页无 OCR」（视觉同 chip 族）；viewer 路径缺 OCR 同降或保持既有（诚实优先） | 20–35 |
| **C** | CitePeek：**只动**浮层 nav「在书桌打开」——鬼页纯文；**禁止**改 quote/trap/定位/verified 文案/布局（正文/trap forever OUT） | 20–30 |
| **D** | DocumentPane CardCard「对页 →」：吃该书 `bookValidPages[bookId]`（pane 已有表）→ 鬼页纯文；有页保持链 | 15–25 |
| **E** | HeYeSession「在书桌打开 p.N」：`!pg`（pages 映射无 OCR）→ 纯文「本页无 OCR」，不 Link；有 `pg` 保持链 + leaveReturnTo | 15–25 |
| **F** | StudySession deskBack：`deskBackPage` 经 `pageInOcr(validPages, …)`；∉ → 回落书级 `deskHref` /「回书桌 →」（不拼鬼 `&page=`） | 15–25 |
| **G** | HeYeSession 本轮撤销栈：`markOne` / `markSamePage` 压栈（批量 = **一条** entry，含 keys+prevMarks+idx）；`undo()` 写回/清标 + 游标回退；无栈 no-op；refresh 清（组件态，不持久化） | 35–55 |
| **H** | HeYe onKey + SessionKeyHint 列 `u/z`「撤销本轮最后一标」；与 Study 同真；勿 ModeChips 插队；勿 ShortcutSheet | 15–25 |
| **I** | 装配：DocumentPane→CitePeek/CiteChip/CardCard 下传 validPages；ChapterPageReader CitePeek 同；EntityCardDetail 内联 `ocrHas` → `pageInOcr`；desk/card + entities 保持 bookValidPages；review/study 已有 pages/validPages 接线核对 | 25–40 |
| **J** | `pnpm --filter web build` PASS；heye-only invent **DEFER**；回归 T52–T28；写手不 push | 20–30 |

**合计估**：约 **195–315** 分钟（落在 180–300+ MEGA 窗；偏紧可压 H 文案，不可砍 A/B/C/D/G/I）。

---

## 硬 OUT（本刀 + 站规 forever）

FSRS/Due · Clew LLM 真写 · verified:true · OCR canvas · CitePeek **正文/trap** redo · ⌘K · Queue→Due · DeskShell 重写 · exam-anchor 全量 · invent heye-only seed · ch08+ · nur-landing · 掌握% · 改名 storage keys · 强制清空整栈 · port ariadnemini verify/clew-API · ModeChips 中插队 · **return densify 当主题** · **empty-CTA densify 当主题** · **重做 T46–T52** · Next.js upgrade 当主题 · 假池 · 只交 helper 不接线或多面漏做就收工 · 写手 push · ScopeCounts/「对页」加 **return** · SessionKeyHint→ShortcutSheet 大改 · Viewer←书桌重做（T52 已闭，只回归）。

Soft：heye-only invent **DEFER**；Next.js security = ops not theme。

---

## 建议路径

```
apps/web/lib/ocr-page.ts                    # 新建：pageInOcr + deskPageHref
apps/web/components/CiteChip.tsx            # B
apps/web/components/CitePeek.tsx            # C（nav only）
apps/web/components/desk/DocumentPane.tsx   # D · I（CardCard 对页 + 下传）
apps/web/components/desk/ChapterPageReader.tsx  # I（CitePeek validPages）
apps/web/components/HeYeSession.tsx         # E · G · H
apps/web/components/StudySession.tsx        # F
apps/web/components/EntityCardDetail.tsx    # I 迁移 ocrHas → pageInOcr
apps/web/app/(desk)/desk/card/[id]/page.tsx # I 核对
apps/web/app/(shell)/entities/[id]/page.tsx # I 核对
apps/web/app/(desk)/review/page.tsx         # I 核对 pages → HeYe（E 已用 pageByNo）
# 勿毁：book-pools.ts · return-stack · CitePeek quote/trap · T52 emptyKind/书空/Viewer
```

---

## 自测（须勾 · 摘要）

1. `pageInOcr(undefined, N)===true`；`pageInOcr([1,2], 9)===false`；`deskPageHref` 对称  
2. CiteChip 书桌 · 页∉OCR → 纯文「本页无 OCR」；∈ → 链在  
3. CitePeek「在书桌打开」鬼页纯文；quote/trap/定位/verified **未改**  
4. CardCard「对页」鬼页纯文；Entity「对页」仍门禁（helper 迁移后行为不变）  
5. HeYe · 无 OCR 页 →「在书桌打开」纯文；有 OCR → 链 + leaveReturn 未拆  
6. Study deskBack · atom 鬼页 → 回落书级「回书桌 →」  
7. HeYe：标 1/2 后 u/z 回退标记+游标；`b` 批量后 u/z 整批回退（单栈条目）  
8. HeYe SessionKeyHint 含 u/z；Study u/z 未毁  
9. build PASS；未 push；heye-only DEFER  
10. 回归：T52 空·完成/Quiz书空/Viewer带页/Entity对页；T51 Clew/Strip/交叉；T50 book-pools；T49 CitePeek 浮层练核 CTA + **正文/trap**；T48–T28 leaveReturn；ModeChips 未插队；Queue≠Due；empty-CTA 门禁未拆

---

## 验收口令

**做完叫验收。A–J 全交才过。**
