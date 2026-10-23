# Ariadne Task 49 — SCOPE（推荐下一刀 · T48 后 · XL 90–150 min）

**定稿**：2026-10-22 23:10 Asia/Shanghai（CST）· **after T48 `741102b`**  
**调度**：Grok Bot（executor）· 用户「Scope Ariadne Task 49 — one XL ~90–150 min desk-v4 knife」· **SUBSTANTIALLY LARGE** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息**）  
**Tip 前置（硬）**：目标 tip = **`741102b`**（`feat(desk) Task 48 desk-review-gate-rail-sticky-01`：CardCard/EntitySearch/轨「核」pending 门禁；CardVs 易混零原子；Sticky 练/核档位标 N；Overview 章行练/核空池）。  
- box `/workspace/Ariadne-push` 定稿时停在 **`741102b`**（`origin/main` 对齐）。  
- 开工时 `git log -1 --oneline` 须含 `741102b` / T48 desk-review-gate-rail-sticky；其下仍含 T47 desk-toc-kind-empty-gate、T46 desk-shelf-ocr-mode-switcher、T45 desk-quiz-scope-card-ingest、T44–T28 既有。若仍停在 `3bd3401`（仅 T47）或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。

**用户反馈（延续）**：刀子必须更大；GLM5.3 能扛 3–4 组相关 utility；15–30 min = 太薄。本刀选 **ONE** 连贯主题：**ingest 就绪/注册「打开书桌」0-OCR 诚实对齐书架 · 就绪三连学习环/核页书级空池 · CitePeek 浮层练/核 CTA 空池门禁**——**不是**又一轮 `saveReturn`/`remember*`，**不是**重做 T46 书架/侧栏/换书/模式、T47 TOC/KINDS/Continuity/CardDetail、T48 瓷砖/轨/搜索核门禁/sticky N/CardVs。

**诚实评估**：T35–T42 return 井已饱和；T43–T48 已闭 QS/键帽/Clew/quiz-scope/ingest N/M/书架 OCR/TOC·kind·Continuity·卡空壳/核空池门禁·sticky N。审计在 tip `741102b` 上见的**非 return、非 T46–T48-redo** 日用撒谎（顾客 **upload→注册→打开书桌** + **摘浮层深链**）：① **IngestReadyLinks「打开书桌 →」恒朱红**——书架 T46 B / Continuity T47 E 已对 0-OCR 降级点名「尚无 OCR」，ingest ready 三连仍装作可读章页；② **RegisterMaterialButton 成功三连「打开书桌 →」同族恒可点**（注册瞬间常 0 OCR）；③ ingest 页 **不装** `loadBookValidPages` / 书级原子·pending——三连「学习环 / 核页」亦不看空池（书级 0 原子仍可点进空练；0 pending 仍可点进空 open）；④ **CitePeek 浮层「核本页 / 练本页 / 核本卡」恒可点**——章页轨顶与 CardHub 已门禁同池，浮层 CTA 仍装能进空池（T48 soft DEFER；**禁碰 quote/trap/定位**）。捆成 **ONE** XL ingest 开书桌诚实 + CitePeek 浮层空池刀（产品脊梁：顾客材料 → 注册 → **开书桌前就知道 OCR；摘浮层 CTA 与轨/枢纽同真不进空池**）。

---

## 推荐一刀（ONE）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`desk-ingest-opendesk-citepeek-empty-01`** |
| **Title** | ingest 打开书桌 0-OCR · 就绪三连空池 · CitePeek 浮层练/核 CTA 空池 |
| **体量** | **~90–150 min** 真实编码（3–4 组相关 utility = **A–F**）。**若 15–30 分钟收工 = 漏做切片**。 |
| **产品脊梁** | 顾客材料 → 注册进书库 → **日用：ingest 开书桌与书架同真 OCR；就绪三连不装能练/能核空池；摘浮层 CTA 与轨/枢纽同真空池——同真开书桌决策、同真上传收口、同真摘深链**。 |

**一句话**：在 **`741102b`（T48）** 上，让 **IngestReady/Register「打开书桌」对 0-OCR 对齐书架 T46 B**、让 **ingest 页装配 OCR/书级原子·pending 并门禁学习环/核页**、让 **CitePeek 浮层「核本页/练本页/核本卡」对空池对齐轨顶/CardHub（只动 nav CTA，不动正文）**。**禁止** 又一轮 saveReturn densify、重做 T46–T48、FSRS、Clew LLM 真写、`verified:true`、掌握 %、OCR canvas、exam-anchor、ch08+ seed、nur-landing、重做 CitePeek **正文**/trap、QueuePanel→Due、⌘K、DeskShell 重写、invent heye-only seed、改名 storage keys、强制清空整栈、整段 port ariadnemini版 verify/clew-API、ModeChips 会话中插队、ScopeCounts 再加 return、EntityCardDetail「对页」加 return、SessionKeyHint→ShortcutSheet、push。

**为何选这主题（对照候选）**：

| 候选 | 判定 |
|------|------|
| **ingest 0-OCR 开书桌 + 三连空池 + CitePeek 浮层 CTA（本刀 · A–F）** | T48 显式 DEFER；最高杠杆**非 return、非 T46–T48-redo** = 上传收口仍撒谎 + 摘浮层 CTA 与刚闭核门禁互谎 |
| 又一轮 saveReturn / remember* 漏网 | **拒** — return 井干 |
| ScopeCounts return / Entity「对页」return / ShortcutSheet | **拒** — soft OUT |
| 重做 T46 / T47 / T48 | **拒** — 刚闭；只回归 |
| ShelfBookContinuity 页级练/核空池 | **DEFER → T50** — 与 ingest 主题弱捆；可记 leftover |
| LibraryContinuity 学习环/核页再 densify | **拒** — T47 Continuity 0-OCR 续开已闭；勿重做 Continuity |
| Clew / FSRS / heye-only invent | **OUT forever** / DEFER invent |
| 纯 a11y / DeskShell 质感 | **拒** |

**Avoid**：重做 T48 CardCard/EntitySearch/轨核/sticky N/CardVs/Overview 章行；重做 T47 TOC/KINDS/Continuity/CardDetail；重做 T46 书架四格/换书/模式 tab/Overview 开章；重做 T45 QuizPanel/练门禁/ingest N/M+CopyCommand（本刀只动 **就绪三连 CTA 诚实**，不重做 N/M 文案）；CitePeek **quote/trap/定位/verified 文案**；ModeChips 会话插队；只给 IngestReady 改一句「尚无 OCR」或只给 CitePeek 一处降级就收工。

---

## 为何现在 · 为何仍 ~90–150 min

T20–T48 把「读页→练→核→回」与 **mode / return / QS·键帽·Clew·quiz·书架 OCR·TOC/kind·核空池·sticky N** 做厚后，日用路径上仍露**非 return、非 T46–T48-redo**撒谎，且卡在**上传收口开书桌 + 摘浮层深链**：

1. **书架已诚实、ingest 未跟**：T46 B 0-OCR「打开书桌（尚无 OCR）」outline；T47 E Continuity 同真——**IngestReadyLinks / Register 成功三连仍朱红「打开书桌 →」**。  
2. **ingest 不装 OCR 事实**：`ingest/page.tsx` 无 `loadBookValidPages`；ready 只传 `bookId`。  
3. **三连学习环/核页无视空池**：书级 0 原子 / 0 pending 仍可点（轨顶/CardHub/T48 已门禁同池族）。  
4. **CitePeek 浮层 CTA 恒可点**：`核本页 / 练本页 / 核本卡` 不看 pendingPageCount / pageAtomCount / pendingCiteCount——与 ChapterPageReader 页顶门禁、CardHub 核门禁**互谎**。  
5. **heye-only 活页**：仍 DEFER；勿 invent。

体量：A IngestReady 0-OCR · B Register 0-OCR · C ingest 装配 + 三连空池 · D CitePeek props+门禁 · E 宿主接线（轨/瓷砖/卡详情）· F 会话接线 + build/回归 —— 多文件、多面；**不是** 15–30 min 薄刀；**不是** return 刀；**不是** T46–T48 重做。

---

## 代码缺口（对照 `741102b`，开工前再对一眼）

| 面 | 现状 | 撒谎 / 残差 |
|----|------|-------------|
| 书架「打开书桌」0-OCR | T46 B 已降级 | **已闭** — 对齐基准 |
| LibraryContinuity 续开 0-OCR | T47 E 已降级 | **已闭** — 勿重做 Continuity |
| IngestReadyLinks「打开书桌」 | 恒朱红 | 0-OCR 可装作可读章页 → **A** |
| RegisterMaterialButton 成功「打开书桌」 | 恒文字链可点 | 同族 → **B** |
| ingest/page.tsx | 无 validPages / 书级 counts | 须装配 → **C** |
| IngestReady/Register「学习环/核页」 | 恒可点 | 书级 0 原子/0 pending → **C** |
| CitePeek 浮层 CTA | 恒核本页/练本页/核本卡 | 空池漏门禁 → **D** |
| CitePeek 宿主 | 多数已有 atom/pending 未下传 | 须接线 → **E/F** |
| T48 核门禁 / sticky N / CardVs / Overview 章行 | 已闭 | **OUT**（只回归） |
| T46 书架/换书/模式 · T47 TOC/KINDS/Continuity | 已闭 | **OUT**（只回归） |
| Shelf Continuity 页级练/核空池 | 恒可点 | **DEFER → T50** |
| heye-only 活页 | immunology-3rd 无 | **DEFER**；勿 invent |
| ScopeCounts return / 「对页」return / ShortcutSheet | soft OUT | **OUT** 本刀 |

---

## IN（硬 · 一 zcode 会话必须全部做完 · **A+B+C+D+E+F**）

### A. IngestReadyLinks「打开书桌」0-OCR 诚实（核心 · 对齐书架 T46 B）

1. `IngestReadyLinks`：props 增 `ocrPageCount?: number`（缺省当 0 · fail-closed）。  
2. `ocrPageCount===0` → 主 CTA 降 outline/muted「打开书桌（尚无 OCR）→」+ `title` 点名章页/分栏暂读不了（可进桌看概览/卡）；旁补次级 `/ingest` 或留在本页的「去解析」文案（勿第二颗大红）；`>0` 保持既有朱红「打开书桌 →」。  
3. return 接线（T39 rememberUploadReturn）只回归。  
4. **不做**：重做 T46 书架书卡；阻断进桌；假 OCR；改 `deriveMaterialStage`。

### B. RegisterMaterialButton 成功「打开书桌」0-OCR 同真（核心）

1. props 增 `ocrPageCount?: number`（ingest 页按物料章 ∩ 已解析页预估；注册后同事实源族）。  
2. 成功三连「打开书桌」：`===0` → 点名「尚无 OCR」降级（与 A 同文案族）；`>0` 保持链。  
3. 「注册进书库」主按钮视觉/API 只回归。  
4. **不做**：改 register API；假进度；拆 return。

### C. ingest/page 装配 + 就绪三连学习环/核页书级空池（核心）

1. `ingest/page.tsx`：`loadBookValidPages()`；ready 书传 `ocrPageCount = bookValidPages[book.id]?.length ?? 0`；extracted 注册钮传物料章对应已解析页数（`loadAllChapterPages` ∩ 物料 `chapterIds`，或等价；无页 = 0）。  
2. 书级 `atomCount` / `pendingCount`：`collectStudyAtoms({bookId})` 长度与 `collectCiteQueue({bookId})`（或书级 open 池）同池族——传入 IngestReadyLinks（± Register 成功态若仍渲三连）。  
3. `atomCount===0` →「学习环」muted 纯文「暂无原子」不可点；`pendingCount===0` →「核页」纯文「暂无待核」；`>0` 保持 mode=all / mode=open + return。  
4. **不做**：重做 T45 N/M+CopyCommand 文案；重做 stage 机；LibraryContinuity。

### D. CitePeek 浮层 CTA 空池门禁（核心 · 禁碰正文）

1. `CitePeek.tsx`：可选 `pageAtomCount?: number` · `pendingPageCount?: number` · `pendingCiteCount?: number`。  
2. 浮层 nav：**仅当父传入且对应 ===0** → 该 CTA 降 muted 纯文（「本页暂无原子」/「本页暂无待核」/「本卡暂无待核」），不可点；未传入 → 保持既有链（渐进接线，E/F 须把能取到的面接上）。  
3. 「在书桌打开 →」有页即保持（非空池主题）。  
4. **硬禁**：改 quote 截断 / trap / 定位 / verified 文案 / 浮层布局 / Esc·点外·focus；OCR canvas。

### E. CitePeek 宿主接线 · 轨 / 瓷砖 / 卡详情（核心）

1. `ChapterPageReader`：轨上 CitePeek 下传 `pageAtomCount`（已有 reduce）· `pendingPageCount` · 每卡 `pendingCiteCount`（T48 已有则复用）。  
2. `DocumentPane` CardCard：下传 `pendingCiteCount` + `pageAtomCount` 若语境有页，否则卡级 `atomCount=card.atoms.length` 供核本卡/缺页场景。  
3. `EntityCardDetail` 三处 CitePeek：下传 `pendingCiteCount` + `atomCount`（卡级；页级若无页表可不传 page*）。  
4. **不做**：重做 CardHub / T48 门禁语义；重做轨「核」瓷砖门禁。

### F. Study/HeYe CitePeek 接线 + build / DEFER / 回归（收口）

1. `StudySession` / `HeYeSession`：能从当前池/scope 取到本页原子或本卡 pending 则下传；不能则省略对应 prop（保持链）——**禁止**造假正数。  
2. heye-only：**DEFER**——禁止 invent seed。  
3. `pnpm --filter web build` PASS；**不要 push**；朱红唯一；精炼书桌。  
4. 回归：T48 核门禁/sticky N/CardVs/Overview 章行；T47 TOC/KINDS/Continuity 0-OCR/CardDetail；T46 书架 OCR/换书/模式/Overview 开章；T45 Quiz/练门禁/ingest N/M；T44–T28；CitePeek **正文/trap 未毁**；IngestReady **return 未拆**；ModeChips 未会话插队。

---

## OUT（显式）

| 不做 | 原因 |
|------|------|
| FSRS / Due / Clew LLM / Proposal 真写 / verified:true / 掌握% / invent heye-only | OUT forever / 禁 |
| 改名 storage keys / 强制清空整栈 | 禁 |
| CitePeek **正文**/trap/定位重做；OCR canvas | OUT |
| QueuePanel→Due / DeskShell 重写 / ⌘K / exam-anchor / ch08+ / nur-landing / PWA | 禁 |
| 重做 T46 书架/换书/模式；T47 TOC/KINDS/Continuity/CardDetail；T48 核门禁/sticky/CardVs/Overview 章行 | 已落；勿毁 |
| ModeChips 会话插队；ScopeCounts return；「对页」return；ShortcutSheet | OUT / soft OUT |
| 又一轮 saveReturn densify / 只改一处「尚无 OCR」或只门禁 CitePeek 一链就收工 | 拒 |
| 假云端 OCR / 假进度 / 改 stage 机 | 拒 |
| ShelfBookContinuity 页级练/核空池 densify | **DEFER → T50** |
| LibraryContinuity 学习环/核页再 densify | 拒（T47 已闭续开 OCR） |
| 整段 port ariadnemini版 verify/clew-API；push | 禁 |

---

## Soft leftovers 收录表

| 来源 | 本刀 |
|------|------|
| T48 DEFER：IngestReady/Register 0-OCR 打开书桌 | **IN** — A/B/C |
| T48 soft DEFER：CitePeek 浮层 CTA 空池 | **IN** — D/E/F |
| Shelf Continuity 页级练/核空池 | **DEFER → T50** |
| LibraryContinuity 学习环/核页空池 | soft leftover（勿重做 Continuity 壳） |
| heye-only 无活页 | **DEFER** — F |
| ScopeCounts / 「对页」/ ShortcutSheet | **OUT** |
| 又一轮 return / 重做 T46–T48 | **OUT** |

---

## 建议改动路径（zcode 可微调，但这些面都要碰到）

```
apps/web/components/IngestReadyLinks.tsx              # A 0-OCR 开书桌；C 学习环/核页空池
apps/web/components/RegisterMaterialButton.tsx        # B 成功三连 0-OCR；（± C 空池）
apps/web/app/(shell)/ingest/page.tsx                  # C 装配 validPages / atom / pending
apps/web/components/CitePeek.tsx                      # D 浮层 CTA 门禁（禁正文）
apps/web/components/desk/ChapterPageReader.tsx        # E 轨 CitePeek 下传 counts
apps/web/components/desk/DocumentPane.tsx             # E CardCard CitePeek
apps/web/components/EntityCardDetail.tsx              # E 三处 CitePeek
apps/web/components/StudySession.tsx                  # F 能取则下传
apps/web/components/HeYeSession.tsx                   # F 能取则下传
# T46 书架 · T47 Continuity · T48 核/sticky：只回归
```

---

## 自测表（zcode 回复须勾）

| # | 路由 / 面 | 期望 |
|---|-----------|------|
| 1 | `/ingest` ready · 0-OCR 书（或验收夹具） | 「打开书桌（尚无 OCR）」；>0 朱红（A） |
| 2 | extracted → 注册成功 · 0-OCR | 成功「打开书桌」点名尚无 OCR（B） |
| 3 | ready · 0 原子或 0 pending | 学习环/核页对应纯文；N/M+CopyCommand 未毁（C） |
| 4 | 章页轨「摘」· 本页 0 原子或 0 pending 或卡 0 pending | 浮层对应 CTA 纯文；quote/trap 未毁（D/E） |
| 5 | 卡详情 / 瓷砖「摘」· 卡 0 pending | 「核本卡」纯文；CardHub 门禁未毁（E） |
| 6 | study/review 内「摘」（有 counts 时） | 空池 CTA 降级或未传保持链；正文未毁（F） |
| 7 | build PASS；未 push；T48–T28 未毁；heye-only DEFER | F |

---

## 验收清单

- [ ] A：IngestReady 0-OCR 开书桌降级；>0 朱红；return 未拆  
- [ ] B：Register 成功开书桌同真  
- [ ] C：ingest 装配 OCR/原子/pending；三连学习环/核页空池；T45 N/M 未毁  
- [ ] D：CitePeek 浮层 CTA 门禁；正文/trap 未毁  
- [ ] E：轨/瓷砖/卡详情接线  
- [ ] F：会话接线；build；heye-only DEFER；回归  
- [ ] 体量：**A–F 全交**；**不是** 15–30 分钟收工；**不是** return 主题；**不是** T46–T48 重做  

---

## Size rationale（给 parent）

| 切片组 | 预估 |
|--------|------|
| A IngestReady 0-OCR | ~15–25 min |
| B Register 0-OCR | ~10–20 min |
| C ingest 装配 + 三连空池 | ~20–35 min |
| D CitePeek CTA 门禁 | ~15–25 min |
| E 轨/瓷砖/卡详情接线 | ~20–35 min |
| F 会话接线 + build/回归/DEFER | ~15–25 min |
| **合计** | **~90–150 min** |

若实现只改 IngestReady 一句或只给 CitePeek 一处降级就停——**拒收**。若做成又一轮 saveReturn 或重做 T46–T48——**拒收**。

---

## Deliverables / 边界

| 本 SCOPE | 不做 |
|----------|------|
| `/workspace/reports/ariadne-task-49/SCOPE.md` · brief · trae-prompt · Mac/box `docs/` 副本 | 实现、commit、push、启动 zcode、给用户发消息 |
| tip `741102b` + A–F | |

**验收口令（交给用户后）**：做完叫验收。A–F 全交才过。
