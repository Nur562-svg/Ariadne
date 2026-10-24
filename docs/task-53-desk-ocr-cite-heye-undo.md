# Task 53 / desk-ocr-cite-heye-undo-01 — 共享 OCR 页 helper · 多面书桌深链鬼页诚实 · 核页 u/z 撤销（zcode · MEGA）

**模型**：zcode · **GLM5.3 max thinking**（brief 格式同历史 Trae paste）  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**`2f43ce9`**（`docs(desk) Task 52 acceptance docs`）。  
- `git log -1 --oneline` 须含 `2f43ce9` / T52 docs。若仍停在 `64ddb11`（仅 T52 feat）或更早——**停下来对齐，不要开工**。  
- 其后仍须含：feat `64ddb11`、T51 `2e30178`/`6744e4b`、T50–T28 既有。  
**前置**：Task 52 + … 已落 tip。**保留** shell-01 + Task 08–52。本任务**不是**又一轮 empty-CTA densify，**不是** return densify，**不是**重做 T46–T52；只做 **共享 OCR 页 helper / CiteChip·Peek开桌·瓷砖对页·HeYe开桌·Study deskBack 鬼页诚实 / HeYe u/z 撤销对称**。  
**不 push**（写手）。验收 PASS 后站规 **auto-push**（勿问「推」）。用户 **自行粘贴**（无 auto-paste）。

> **Slug**：`desk-ocr-cite-heye-undo-01` · 对照 SCOPE：`/workspace/reports/ariadne-task-53/SCOPE.md`（或仓库 `docs/`）。  
> **体量（硬 · MEGA）**：用户「Knives MUCH LARGER」；zcode 配额充足。目标 **约 180–300+ 分钟真实编码**，交 **A–J 全部**（10 切片 · 3 子主题）。**若只做 helper 或只做 HeYe undo 就收工 = 漏做多面 OCR = 拒收**。**若 15–30 或 90 分钟内假装收工 = 漏做**。**若做成又一轮 empty-CTA densify / return densify / CitePeek 正文·trap redo / 重做 T46–T52 = 主题偏了，拒收**。

先读 `docs/frontend-aesthetics.md`（朱红唯一 · 精炼书桌 · 效用文）。

---

## 背景（为何现在做）

| 已有（T52 @ `2f43ce9` / feat `64ddb11`） | 缺口 |
|------------------------------------------|------|
| Entity「对页/开本页」OCR 门禁；Viewer←书桌带页 | CiteChip / Peek「在书桌打开」/ CardCard「对页」/ HeYe「在书桌打开」**仍可进鬼页** |
| T52 内联 `ocrHas` | ACCEPT soft：**未抽 `pageInOcr` helper** |
| Study u/z 本轮撤销 | **HeYe 无对称撤销**——误触 1/2/b 无法回退 |
| T43–T51 empty-CTA 井 | **饱和** · 本刀不扩 atom/pending 门禁 |
| T35–T42 return 井 | **饱和** · 不对「对页」加 return |

---

## 空池 CTA / return 井（写进回复）

**声明**：T43–T51 empty-pool CTA densify 已饱和；return densify 已饱和。本刀主题是 **OCR 页深链诚实 + 核页撤销产品效用 + 共享 helper**，不是再给练/核 CTA 加空池门禁，不是 saveReturn densify。

---

## 切片 A–J（必须全交）

### A · lib `ocr-page.ts`（~15–25 min）
- `pageInOcr(validPages: number[] | null | undefined, page: number): boolean`  
  - `validPages == null` → **true**（未装配不门禁，对齐 T52）  
  - 否则 `validPages.includes(page)`  
- `deskPageHref(bookId: string | undefined, page: number | null | undefined, validPages?: number[] | null): string | null`  
  - 缺 book / 缺 page → null  
  - `!pageInOcr(...)` → null  
  - 否则 `/desk?book=${encodeURIComponent(bookId)}&page=${page}`  
- 无 `"use client"`（server + client 都可 import，同 `qs-mode.ts`）。

### B · CiteChip OCR 门禁（~20–35 min）
- 新可选 prop `bookValidPages?: number[]`。  
- 书桌语境（有 `deskBookId`）且 `page` 已知且 `!pageInOcr(bookValidPages, page)` → **纯文 span**（同 chip 边框/字号），title/文案「本页无 OCR」；**无** `<Link>`。  
- 有 OCR 或缺省未装配 → 保持既有 Link。  
- shell `/viewer/[page]` 路径：若能判定无 OCR，优先诚实降级；否则保持既有（勿伪造页）。  
- 无页 `p.?` 既有 fail-closed 不动。

### C · CitePeek「在书桌打开」nav OCR（~20–30 min）
- 新可选 prop `bookValidPages?: number[]`（或复用父传）。  
- **只改**浮层 nav「在书桌打开 →」：`deskPageHref(...)===null` 且已知页 → 纯文「本页无 OCR」。  
- **硬禁**：改 quote 正文、trap、定位算法、verified 文案、布局、练本页/核本页/核本卡空池门禁（T49 已闭，只回归）。  
- CiteChip 子调用下传 `bookValidPages`。

### D · CardCard「对页」OCR（~15–25 min）
- DocumentPane 内 CardCard：主 cite「对页 →」经 `deskPageHref(bookId, primaryCite.page, bookValidPages?.[bookId])`。  
- null → 纯文「本页无 OCR」；有 → 保持链。  
- pane 已有 `bookValidPages` 表——下传即可；勿重做练/核空池门禁。

### E · HeYe「在书桌打开 p.N」（~15–25 min）
- 现：右栏 `!pg` 已琥珀，左链仍恒 Link。  
- `!pg` → 纯文「本页无 OCR」（或「本页未解析」）；有 `pg` → 保持 Link + `leaveReturnTo`。  
- 勿拆 T51 atomCount / T52 emptyKind / leaveReturn。

### F · Study deskBack 鬼页回落（~15–25 min）
- `deskBackPage` 经 `pageInOcr(validPages, deskBackPage)`；false → 当作无页：用书级 `deskHref` + 文案「回书桌 →」。  
- `validPages` 已是 StudySession prop——勿改 storage；勿拆 leaveReturn / CrossScope。

### G · HeYe 本轮撤销栈（~35–55 min）
- 对齐 Study T25 B 气质：组件态栈，不持久化，refresh 清。  
- `markOne(s)`：压 `{ keys:[cur.key], prev: Record<key, HeYeMark|undefined>, idx }` 再写标。  
- `markSamePage`（`b`）：**一条** entry 含批量 keys 的 prev 快照，再 `setHeYeMarks`。  
- `undo()`：按 prev 写回或 `clearHeYeMarks`；游标回 `idx`；弹栈；无栈 no-op。  
- 完成态/空态可不暴露撤销（与 Study 完成态一致即可）；主流程必须可用。  
- 禁止把撤销做成 Due/FSRS；禁止改 heye-store key 名。

### H · HeYe 键帽 + onKey（~15–25 min）
- SessionKeyHint 增加 `["u/z", "撤销本轮最后一标"]`（有栈或恒列均可，与 Study 同族）。  
- onKey：`u`/`z` → `undo()`（editable / peek 开时 silent，沿用既有 silentKeyTarget）。  
- 勿 ModeChips 中插队；勿 ShortcutSheet / ⌘K。

### I · 装配线（~25–40 min）
- DocumentPane → CardCard / CitePeek /（如有）CiteChip：`bookValidPages={bookValidPages?.[book.id]}` 或整表按 id 查。  
- ChapterPageReader → CitePeek 同传（读侧 validPages 从 props/父取）。  
- EntityCardDetail：删除内联 `ocrHas`，改 `pageInOcr(bookValidPages, p)`；行为与 T52 契约一致。  
- desk/card + entities/[id] 保持 `bookValidPages` 下传。  
- 抽查：CitePeek 在轨/瓷砖/卡详三宿主都拿到页表（能取到才传；缺省不门禁）。

### J · build · DEFER · 回归（~20–30 min）
1. `pnpm --filter web build` PASS。  
2. 不要 push。  
3. heye-only invent **DEFER**：禁止 seed；回复写明 deferred。  
4. 回归：T52 空·完成/Quiz书空/Viewer带页/Entity对页；T51 Clew/Strip/书头/Quiz核/交叉；T50 Shelf/Footer/Continuity/Sidebar/book-pools；T49 IngestReady/Register/CitePeek **浮层练核 CTA** + **正文/trap 未毁**；T48–T28 leaveReturn/书头return/CrossScope；ModeChips 未插队；Queue≠Due；LocalProgressStrip 视觉未毁。

---

## 硬保留

Task 07–52 + review-fix：书架 DeskShell、开书、三栏、DocumentPane 三模、TOC、Clew stub 三 tab、CitePeek **正文与 trap**、/review·/study 诚实切片、Sticky*、DeskSurfaceBridge、collectStudyAtoms/collectCiteQueue、loadBookValidPages、healOpenedIfDirty、book-pools、各 storage keys、CardHubReturnLinks、IngestReadyLinks、T34–T52 已交切片。勿 `verified:true` 过关。主题是 **OCR 深链诚实 + HeYe 撤销 + helper**，不是 empty-CTA，不是 return，不是 T46–T52 重做。

---

## 不做（硬）

- FSRS / Due / Clew LLM 真写 / verified:true / 掌握% / invent heye-only  
- 改名 storage keys / 强制清空整栈  
- CitePeek **正文/trap/定位**重做 / OCR canvas / ⌘K / DeskShell 重写 / Queue→Due  
- exam-anchor / ch08+ / nur-landing / ModeChips 会话插队  
- ScopeCounts /「对页」加 return · SessionKeyHint→ShortcutSheet  
- empty-CTA densify 当主题 / return densify 当主题 / 重做 T46–T52  
- Next.js security upgrade 当主题  
- 假池 / 只交 A 或只做 G 就收工 / 写手 push  

---

## 自测（回复须勾）

见 SCOPE 自测 1–10。摘要：helper 契约；CiteChip/Peek开桌/CardCard对页/HeYe开桌/Study deskBack 鬼页同真；HeYe u/z 单条+批量；键帽同真；CitePeek 正文/trap 未毁；build PASS；heye-only DEFER；T52–T28 回归。

---

## 验收口令

**做完叫验收。A–J 全交才过。**
