# Ariadne Task 50 — SCOPE（推荐下一刀 · T49 后 · XL 90–150 min）

**定稿**：2026-10-23 14:52 Asia/Shanghai（CST）· **after T49 `691915a`**  
**调度**：Grok Bot（executor）· 用户「Scope and write Ariadne Task 50 (desk-v4 XL knife for zcode GLM5.3）」· **SUBSTANTIALLY LARGE** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息**）  
**Tip 前置（硬）**：目标 tip = **`691915a`**（`feat(desk) Task 49 desk-ingest-opendesk-citepeek-empty-01`：IngestReady/Register 0-OCR 开书桌；ingest 三连学习环/核页书级空池；CitePeek 浮层 CTA 空池 + 宿主接线）。  
- box `/workspace/Ariadne-push` 定稿时停在 **`691915a`**（`origin/main` 对齐）。  
- 开工时 `git log -1 --oneline` 须含 `691915a` / T49 desk-ingest-opendesk-citepeek-empty；其下仍含 T48 desk-review-gate-rail-sticky、T47 desk-toc-kind-empty-gate、T46 desk-shelf-ocr-mode-switcher、T45–T28 既有。若仍停在 `741102b`（仅 T48）或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。

**用户反馈（延续）**：刀子必须更大；GLM5.3 能扛 3–4 组相关 utility；15–30 min = 太薄。本刀选 **ONE** 连贯主题：**书架续开页级练/核空池诚实 + Footer 学习环/核页空池 + LibraryContinuity 学习环/核页空池门禁（只动 CTA，不重做 Continuity 壳）+ 侧栏在读学习/核页空池**——**不是**又一轮 `saveReturn`/`remember*`，**不是** returnTo densify，**不是**重做 T46–T49（书架 OCR/换书/模式、TOC/KINDS/Continuity 0-OCR 壳、核门禁/sticky、ingest 开书桌/CitePeek）。

**诚实评估**：T35–T42 return 井已饱和；T43–T49 已闭 QS/键帽/Clew/quiz/书架 OCR/TOC·kind·Continuity 0-OCR/核空池·sticky/ingest 开书桌·CitePeek 浮层 CTA。审计在 tip `691915a` 上见的**非 return、非 T46–T49-redo** 日用撒谎（顾客 **书架续开 → 页级练/核 / footer 学习环·核页 / 书库继续上次 / 侧栏在读**）：① **ShelfBookContinuity「练本页 →」「核本页 →」恒可点**——章页轨顶 / CitePeek / Overview 章行已对同池空门禁，书架续开旁仍装能进空页池（T49 显式 DEFER→T50）；② **ShelfBookFooterLinks「学习环」「核页」恒可点**——有续开页时带 page=，0 原子/0 pending 仍可进空；无页书级亦不看 atom/pending；③ **LibraryContinuity「学习环 →」「核页 →」恒可点**——T47 已闭续开 0-OCR 壳，但学习环/核页 CTA 仍不看空池（soft leftover；**勿重做 Continuity 壳**，只加空池门禁）；④ **Sidebar 在读「学习 →」「核页 →」恒可点**——与书架 footer / Continuity 同族 href（可带 page=），轨/Strip 已门禁同池，侧栏仍撒谎。捆成 **ONE** XL 书架·续开·侧栏空池诚实刀（产品脊梁：顾客材料 → 注册 → **从书架/续开/侧栏出发进练核前就知道本页/本书有没有池**）。

---

## 推荐一刀（ONE）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`desk-shelf-continuity-empty-01`** |
| **Title** | 书架续开页级练/核空池 · Footer 学习环/核页 · LibraryContinuity 空池门禁 · 侧栏在读学习/核页空池 |
| **体量** | **~90–150 min** 真实编码（3–4 组相关 utility = **A–F**）。**若 15–30 分钟收工 = 漏做切片**。 |
| **产品脊梁** | 顾客材料 → 注册进书库 → **日用：书架续开/footer/书库继续上次/侧栏在读进练核与轨顶·Overview·ingest 同真空池——同真不进空页池、同真不进空书池**。 |

**一句话**：在 **`691915a`（T49）** 上，让 **ShelfBookContinuity 页级「练本页/核本页」对空池对齐章页轨顶**、让 **ShelfBookFooterLinks 页级/书级学习环·核页空池门禁**、让 **LibraryContinuity 学习环/核页只加空池门禁（不重做 0-OCR 续开壳）**、让 **Sidebar 在读学习/核页同真空池**，并由 **书架页 + desk layout 装配书级/页级 counts 下传**。**禁止** 又一轮 saveReturn densify、重做 T46–T49、FSRS、Clew LLM 真写、`verified:true`、掌握 %、OCR canvas、exam-anchor、ch08+ seed、nur-landing、重做 CitePeek 正文/trap、QueuePanel→Due、⌘K、DeskShell 重写、invent heye-only seed、改名 storage keys、强制清空整栈、整段 port ariadnemini版 verify/clew-API、ModeChips 会话中插队。

**为何选这主题（对照候选）**：

| 候选 | 判定 |
|------|------|
| **书架续开页级 + Footer + LibraryContinuity 空池门禁 + 侧栏在读（本刀 · A–F）** | T49 显式 DEFER→T50；最高杠杆**非 return、非 T46–T49-redo** = 书架/续开/侧栏仍装能进空池 |
| 又一轮 saveReturn / remember* 漏网 | **拒** — return 井干 |
| 重做 T46 / T47 Continuity 壳 / T48 / T49 ingest·CitePeek | **拒** — 刚闭；只回归 |
| LibraryContinuity 整壳 densify | **拒** — 只允许空池 CTA 门禁 |
| Clew / FSRS / heye-only invent | **OUT forever** / DEFER invent |
| 纯 a11y / DeskShell 质感 | **拒** |

**Avoid**：重做 T49 IngestReady/Register/CitePeek；重做 T48 CardCard/EntitySearch/轨核/sticky N/CardVs/Overview 章行；重做 T47 TOC/KINDS/Continuity **0-OCR 续开壳**/CardDetail；重做 T46 书架四格/换书/模式 tab/Overview 开章；return densify；只给 ShelfBookContinuity 一处降级就收工。

---

## 为何现在 · 为何仍 ~90–150 min

T20–T49 把「读页→练→核→回」与 **mode / return / QS·键帽·Clew·quiz·书架 OCR·TOC/kind·核空池·sticky·ingest 开书桌·CitePeek CTA** 做厚后，日用路径上仍露**非 return、非 T46–T49-redo**撒谎，且卡在**书架续开与侧栏在读**：

1. **轨顶已诚实、书架续开未跟**：ChapterPageReader / CitePeek 已对 pageAtom/pendingPage 门禁——**ShelfBookContinuity「练本页/核本页」恒 Link**。  
2. **Footer 同谎**：有续开页带 page= 仍不看池；无页书级亦不看 atom/pending。  
3. **LibraryContinuity 续开 OCR 已闭、学习环/核页未跟**：T47 E 0-OCR；学习环/核页 CTA 仍恒可点。  
4. **Sidebar 在读同族恒可点**：与 footer/Continuity 同 href 族，侧栏仍装能进空池。  
5. **书架页 / layout 未装配页级 counts**：`page.tsx` 已有书级 collectStudyAtoms/collectCiteQueue 给 Strip，但未下传 Continuity；layout SidebarBook 无 atom/pending/页表。  
6. **heye-only 活页**：仍 DEFER；勿 invent。

体量：A 续开页级 · B Footer · C LibraryContinuity 空池门禁 · D Sidebar · E 书架+layout 装配 · F build/回归 —— 多文件、多面；**不是** 15–30 min 薄刀；**不是** return 刀；**不是** T46–T49 重做。

---

## 代码缺口（对照 `691915a`，开工前再对一眼）

| 面 | 现状 | 撒谎 / 残差 |
|----|------|-------------|
| 章页轨顶练本页/核本页 | T27/T48 已门禁 | **已闭** — 对齐基准 |
| CitePeek 浮层 CTA | T49 D/E/F 已门禁 | **已闭** — 勿重做 |
| Overview 章行练/核 | T48 F 已门禁 | **已闭** |
| IngestReady/Register 开书桌+三连 | T49 A–C 已闭 | **已闭** |
| ShelfBookContinuity 练本页/核本页 | **恒 Link** | 0 原子/0 pending 可进空页池 → **A** |
| ShelfBookFooterLinks 学习环/核页 | **恒 Link** | 页级/书级空池 → **B** |
| LibraryContinuity 学习环/核页 | **恒 Link**（0-OCR 壳已闭） | 空池 → **C**（只门禁 CTA） |
| Sidebar 在读 学习/核页 | **恒 Link** | 同族 → **D** |
| 书架 page.tsx / desk layout | 无页级 map / Sidebar 无 counts | 须装配 → **E** |
| heye-only 活页 | immunology-3rd 无 | **DEFER**；勿 invent |
| 又一轮 return / 重做 T46–T49 | — | **OUT** |

---

## IN（硬 · 一 zcode 会话必须全部做完 · **A+B+C+D+E+F**）

### A. ShelfBookContinuity「练本页 / 核本页」页级空池（核心 · 对齐轨顶）

1. `ShelfBookContinuity.tsx`：props 增 `pageAtomCount?: number` · `pendingPageCount?: number`（**或** `pageAtomByPage` / `pagePendingByPage` 由组件按 healed `page` 自查——二选一，须与 E 接线一致；缺省当 0 · fail-closed 若采用直接 count；若采用 map 则缺 key 当 0）。  
2. healed `page` 存在时：对应原子 ===0 →「练本页」降 muted 纯文「本页暂无原子」（或同族文案），不可点；pending ===0 →「核本页」纯文「本页暂无待核」；`>0` 保持既有 Link + `rememberPageReturn`。  
3. 「续开 p.N」自身保持（非空池主题；有页即链）。  
4. **不做**：重做 heal/validPages；假池；拆 return；改 LocalProgressStrip。

### B. ShelfBookFooterLinks 页级/书级学习环·核页空池（核心）

1. props 增书级 `atomCount?: number` · `pendingCount?: number`，以及页级同 A 的 count/map（有 healed page 时用页级，无页用书级）。  
2. 生效池 ===0 → 对应「学习环…」「核页…」muted 纯文（页级点名「本页暂无…」；书级「暂无原子」/「暂无待核」），不可点；`>0` 保持链 + `rememberFooterReturn`。  
3. **不做**：重做 heal；改 Strip 条末书级链语义（Strip 已有 N=0 纯文，只回归）。

### C. LibraryContinuity 学习环/核页空池门禁（核心 · **勿重做 Continuity 壳**）

1. props 增与 B 同族 counts（书级 ± 页级 map/count；有 `last.page` 用页级，否则书级）。  
2. ===0 →「学习环」「核页」对应纯文不可点；`>0` 保持链 + `rememberContinueReturn`。  
3. **硬禁**：改 T47 E 0-OCR「继续上次（尚无 OCR）」逻辑/文案/去解析链；重做 Continuity 卡片壳/失效 clear；假 OCR。

### D. Sidebar 在读「学习 / 核页」空池（核心）

1. `SidebarBook`（或并行 props）增 `atomCount` / `pendingCount` + 可选页级 map；客户端按 `currentEntry?.page` 选页级或书级。  
2. ===0 →「学习」「核页」纯文；`>0` 保持链 + `rememberDeskReturn`。  
3. 主导航 /study /review、换书 disclosure、OCR「无 OCR 页」文案只回归。  
4. **不做**：DeskShell 重写；FSRS Due 角标；改 PRIMARY/SECONDARY 结构。

### E. 书架页 + desk layout 装配 counts / 页表下传（核心）

1. `apps/web/app/(desk)/page.tsx`：每书算书级 `atomCount` / `pendingCount`（已有 `collectStudyAtoms`/`collectCiteQueue` 可复用长度）；为 `bookValidPages[b.id]` 建页→原子数、页→待核数 map（`collectStudyAtoms({bookId,page})` / `collectCiteQueue({bookId,page})` 同池族，或一书宽收集再按 page 分组——**禁止造假正数**）。下传 `ShelfBookContinuity` + `ShelfBookFooterLinks`；`LibraryContinuity` 传全书 maps 或 per-book 汇总。  
2. `apps/web/app/(desk)/layout.tsx`（± `DeskShellClient`）：SidebarBook 装配同族 atom/pending + 页表（或 layout 级 `bookPageAtomCounts` 下传）。  
3. **不做**：重做书架四格 OCR；重做 Strip；发明第二套池口径。

### F. build / heye-only DEFER / 回归（收口）

1. `pnpm --filter web build` PASS；**不要 push**；朱红唯一；精炼书桌。  
2. heye-only：**DEFER**——禁止 invent seed；回复写明 deferred。  
3. 回归：T49 IngestReady/Register/CitePeek；T48 核门禁/sticky N/CardVs/Overview 章行；T47 TOC/KINDS/**Continuity 0-OCR 壳**/CardDetail；T46 书架 OCR/换书/模式/Overview 开章；T45–T28；Shelf/Sidebar **return 接线未拆**；ModeChips 未会话插队；LocalProgressStrip 未毁。

---

## OUT（显式 · Standing forever + 本刀）

| 不做 | 原因 |
|------|------|
| FSRS / Due / Clew LLM 真写 / Proposal 真写 / verified:true / 掌握% / invent heye-only | **OUT forever** |
| OCR canvas / CitePeek **正文**/trap redo / ⌘K / QueuePanel→Due / DeskShell 重写 / exam-anchor full / ch08+ / nur-landing | **OUT forever** |
| 改名 storage keys / 强制清空整栈 / 整段 port ariadnemini版 verify/clew-API / ModeChips 会话中插队 | **OUT forever** |
| 又一轮 saveReturn / returnTo densify | **拒** — 饱和 |
| 重做 T46 书架/换书/模式；T47 TOC/KINDS/Continuity **壳**/CardDetail；T48 核门禁/sticky/CardVs/Overview；T49 ingest/CitePeek | 已落；勿毁 |
| 重做 LibraryContinuity 0-OCR 续开整壳（只允许空池 CTA） | 拒 |
| 假池 / 假 OCR / 只改 ShelfBookContinuity 一处就收工 | 拒 |
| push | 禁 |

---

## Soft leftovers 收录表

| 来源 | 本刀 |
|------|------|
| T49 DEFER：ShelfBookContinuity 页级练/核空池 | **IN** — A/E |
| T49 soft：LibraryContinuity 学习环/核页空池（勿重做壳） | **IN** — C |
| Footer 同族空池 | **IN** — B |
| Sidebar 在读同族 | **IN** — D |
| heye-only 无活页 | **DEFER** — F |
| Clew stub「去学习环/去核页」再 densify | soft leftover（本刀不扩；非主题） |
| 又一轮 return / 重做 T46–T49 | **OUT** |

---

## 建议改动路径（zcode 可微调，但这些面都要碰到）

```
apps/web/components/ShelfBookContinuity.tsx           # A 练本页/核本页；B FooterLinks
apps/web/components/LibraryContinuity.tsx             # C 学习环/核页空池（禁动 0-OCR 壳）
apps/web/components/desk/Sidebar.tsx                  # D 在读学习/核页
apps/web/app/(desk)/page.tsx                          # E 书架装配 book+page counts 下传
apps/web/app/(desk)/layout.tsx                        # E SidebarBook / 页表装配
apps/web/components/desk/DeskShellClient.tsx          # E 若需透传新 props
# T46–T49 已交面：只回归
```

---

## 自测表（zcode 回复须勾）

| # | 路由 / 面 | 期望 |
|---|-----------|------|
| 1 | `/` 书架 · 有续开页 · 该页 0 原子或 0 pending（或验收夹具） | 「练本页/核本页」对应纯文；续开 p.N 仍可点（A） |
| 2 | 同书 footer · 页级或书级空池 | 学习环/核页对应纯文；Strip 未毁（B） |
| 3 | LibraryContinuity · 空池 | 学习环/核页纯文；「继续上次」0-OCR 壳未毁（C） |
| 4 | 侧栏在读 · 空池 | 学习/核页纯文；换书/主导航未毁（D） |
| 5 | 有池书/页 | 链保持 + return 未拆；>0 可进（A–D） |
| 6 | build PASS；未 push；T49–T28 回归；heye-only DEFER | F |

---

## 验收清单

- [ ] A：续开页级练/核空池；续开链未毁；return 未拆  
- [ ] B：Footer 页级/书级空池  
- [ ] C：LibraryContinuity 仅空池门禁；0-OCR 壳未毁  
- [ ] D：Sidebar 在读空池  
- [ ] E：书架 + layout 装配下传  
- [ ] F：build；heye-only DEFER；回归  
- [ ] 体量：**A–F 全交**；**不是** 15–30 分钟收工；**不是** return 主题；**不是** T46–T49 重做  

---

## Size rationale（给 parent）

| 切片组 | 预估 |
|--------|------|
| A ShelfBookContinuity 页级 | ~15–25 min |
| B FooterLinks | ~10–20 min |
| C LibraryContinuity 空池门禁 | ~15–25 min |
| D Sidebar 在读 | ~15–25 min |
| E 书架+layout 装配 | ~20–35 min |
| F build/回归/DEFER | ~15–25 min |
| **合计** | **~90–150 min** |

若实现只改 ShelfBookContinuity 一处降级就停——**拒收**。若做成又一轮 saveReturn 或重做 T46–T49——**拒收**。

---

## Deliverables / 边界

| 本 SCOPE | 不做 |
|----------|------|
| `/workspace/reports/ariadne-task-50/SCOPE.md` · brief · trae-prompt ·（可选）Mac/box `docs/` 副本 | 实现、commit、push、启动 zcode、给用户发消息 |
| tip `691915a` + A–F | |

**验收口令（交给用户后）**：做完叫验收。A–F 全交才过。
