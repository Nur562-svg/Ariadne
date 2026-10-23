# Task 52 / desk-empty-complete-widen-viewer-01 — 练核空·完成态文案对称 · Quiz 放宽书空诚实 · Viewer/对页 OCR 页定位（zcode · MEGA）

**模型**：zcode · **GLM5.3 max thinking**（brief 格式同历史 Trae paste）  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**`2e30178`**（`docs(desk) Task 51 acceptance docs`）。  
- `git log -1 --oneline` 须含 `2e30178` / T51 docs。若仍停在 `6744e4b`（仅 T51 feat）或更早——**停下来对齐，不要开工**。  
- 其后仍须含：T51 feat `6744e4b`、T50 `c99d7ec`、T49–T28 既有。  
**前置**：Task 51 + … 已落 tip。**保留** shell-01 + Task 08–51。本任务**不是**又一轮 empty-CTA densify，**不是** return densify，**不是**重做 T46–T51；只做 **空·完成态文案对称 / Quiz 放宽书空 / Viewer·对页 OCR 页定位 / 孤儿·无书同真**。  
**不 push**（写手）。验收 PASS 后站规 **auto-push**（勿问「推」）。用户 **自行粘贴**（无 auto-paste）。

> **Slug**：`desk-empty-complete-widen-viewer-01` · 对照 SCOPE：`/workspace/reports/ariadne-task-52/SCOPE.md`（或仓库 `docs/`）。  
> **体量（硬 · MEGA）**：用户「Knives must be MUCH LARGER」；zcode 配额充足。目标 **约 185–300+ 分钟真实编码**，交 **A–J 全部**（10 切片 · 3 子主题）。**若只做 Quiz 或只做 Viewer 就收工 = 漏做 = 拒收**。**若 15–30 或 90 分钟内假装收工 = 漏做**。**若做成又一轮 empty-CTA densify / return densify / 重做 T46–T51 = 主题偏了，拒收**。

先读 `docs/frontend-aesthetics.md`（朱红唯一 · 精炼书桌 · 效用文）。

---

## 背景（为何现在做）

| 已有（T51 @ `2e30178` / feat `6744e4b`） | 缺口 |
|------------------------------------------|------|
| Clew/Strip/书头/Quiz去核/交叉离面空池 | **勿重做 T51** · empty-CTA 井近饱和 |
| T50 书架续开 / book-pools / Footer·Continuity | **勿重做 T50** |
| T49 ingest 三连 / CitePeek 浮层 CTA | **勿重做 T49**；CitePeek **正文/trap** forever OUT |
| Study 页级孤儿/越界/真空 typed empty | HeYe **池空 body 仍泛**；无 h2；「去学习环 /study →」丑 |
| Quiz「本章暂无原子 · 放宽到本书」 | **本书原子=0 仍链** → 进空学习环（T45 残留谎） |
| Viewer `←书桌` | 仅 `/desk?book=` **丢当前页** |
| Entity「对页」/「在书桌打开本页」 | **不查 validPages** → 鬼页 /desk?page=N |

---

## 空池 CTA 井（写进回复）

**声明**：T43–T51 已基本抽干 empty-pool CTA densify。本刀主题是 **空·完成态文案 / 放宽链诚实 / 回页定位**，不是再给 CTA 加门禁扩包。

---

## 切片 A–J（必须全交）

### A · QuizPanel 放宽到本书 · 书空诚实（~20–30 min）
- Props：新增 `bookAtomCount: number`（DocumentPane 用 `collectStudyAtoms({ bookId })` 或既有 book-pools 等价长度）。
- `atomCount===0 && bookAtomCount===0` → 纯文「本书暂无原子」（**无** `<Link>` 放宽）。
- `atomCount===0 && bookAtomCount>0` → 保持既有「本章暂无原子 · 去学习环放宽到本书」`/study?book=&mode=all`。
- **勿**重做 T51 G「去核页」门禁；**勿**改 Quiz 练侧 T45 契约。

### B · StudySession 空 / 完成 chrome（~20–30 min）
- mode 过滤空（ungraded / unknown）与「本轮完成」标题+次级 CTA 标签整理，与 HeYe 对称用词（去核页 / 回书桌 / 去书架）。
- mode=all 防御空态不说假「队列有货」。
- **勿**拆 T51 CrossScope / leaveReturn；**勿** ModeChips 插队。

### C · HeYeSession 池空 chrome 对齐（~25–40 min）
- 加 h2（建议「这个范围是空的」），对齐 Study「这个队列是空的」。
- 新 prop `emptyKind?: 'orphan' | 'card-out' | 'true-empty' | null`：
  - orphan → body 点明页不在本书 OCR / 无 cite 可核
  - card-out → 卡页越界
  - true-empty → 引导 ingest / 书架，不装裸假池
- 修 CTA 标签「去学习环 /study →」→「去学习环 →」（href 仍正确）。
- T51 对侧 atoms=0 纯文门禁 **保持**。

### D · HeYeSession mode 空 /「对完」态（~20–30 min）
- `open` 且池空因全部 marked → 标题感对齐 Study「本轮完成」（可用「本机已全部对过」作 h2）。
- `checked` / `doubt` 空 → 独立短标题，勿与池真空混用同一句。
- CTA 行与 Study 完成态同族用词。

### E · review/page emptyKind 装配（~20–35 min）
- 推导 orphan / cardOutOfRange / true-empty（对齐 study 既有逻辑）。
- 传入 HeYeSession；页顶琥珀条可保留，body 分型以 HeYe 为准（避免双套大 UI）。
- **勿**重做 T48 sticky N / T51 CrossScope。

### F · study/page 无书 · orphan 残余（~15–25 min）
- 无书全局空态：deskBack / 交叉文案不装裸假书链。
- orphan / cardOut 完成态回书桌 href 诚实（有 book 带 book；已知页可带 page，与 G 同哲学）。
- **勿**重做 T51 页级空池 CTA densify。

### G · Viewer ←书桌带页（~20–35 min）
- 已知 `page` → `deskHref = /desk?book=…&page=…`。
- 缺页 / 无效页：既有琥珀保留；回书桌可退化为仅 book。
- **可选**次级「练本页」「核本页」：页级 atoms/pending=0 → 纯文；>0 → 链（**不是** CitePeek 浮层/正文/trap）。
- **勿** OCR canvas；**勿** CitePeek redo。

### H · EntityCardDetail 对页 / 开本页 OCR 门禁（~25–40 min）
- Prop `bookValidPages?: number[]`（缺省 = 不门禁，兼容旧调用）。
- 三处「对页」：`page` 有值且 `bookValidPages` 已提供且 **不含**该页 → 纯文「本页无 OCR」（或「页未解析」）；含则保持链。
- 「在书桌打开本页」同门禁（父级不传假 href，或 Detail 内关链）。
- **勿**给「对页」加 return densify（soft OUT）；本刀只做 **OCR 有效性诚实**。

### I · 装配线（~20–30 min）
- DocumentPane → QuizPanel `bookAtomCount`。
- `desk/card/page.tsx` + `entities/[id]/page.tsx` → EntityCardDetail `bookValidPages={loadBookValidPages(bookId)}`（或既有缓存）。
- 可选薄 helper：`pageInOcr(validPages: number[] | undefined, page: number | null): boolean`。
- **勿**毁 `book-pools.ts` T50 契约；**勿**改 storage keys。

### J · build · DEFER · 回归（~20–30 min）
1. `pnpm --filter web build` PASS。  
2. 不要 push。  
3. heye-only 活页 invent **DEFER**：禁止 seed；回复写明 deferred。  
4. 回归清单见下。

---

## 建议路径

```
apps/web/components/desk/QuizPanel.tsx
apps/web/components/desk/DocumentPane.tsx
apps/web/components/StudySession.tsx
apps/web/components/HeYeSession.tsx
apps/web/app/(desk)/study/page.tsx
apps/web/app/(desk)/review/page.tsx
apps/web/app/(desk)/viewer/page.tsx
apps/web/components/desk/EntityCardDetail.tsx
apps/web/app/(desk)/desk/card/page.tsx
apps/web/app/(desk)/entities/[id]/page.tsx
apps/web/lib/book-pools.ts            # 只读复用
```

---

## 自测（须勾）

见 SCOPE 自测 1–10。摘要：Quiz 书空纯文；Study/HeYe 空·完成对称；review emptyKind；Viewer 带页；对页/开本页 OCR 门禁；build PASS；heye-only DEFER；T51–T28 回归。

---

## 硬保留

Task 07–51 + review-fix：DeskShell、开书、三栏、DocumentPane 三模、TOC、Clew stub 三 tab、CitePeek **正文与 trap**、/review·/study 诚实切片、Sticky*、DeskSurfaceBridge、collectStudyAtoms/collectCiteQueue、loadBookValidPages、healOpenedIfDirty、book-pools.ts、storage keys 族、CardHubReturnLinks、IngestReadyLinks、CopyCommand、LibraryContinuity/ShelfBookContinuity、T26 稀疏琥珀、T41 sticky N=0、T48 sticky 标 N、T51 Clew/Strip/交叉空池。勿 verified:true 过关。**A–J 完整；主题是空·完成对称 + 放宽书空 + 页定位诚实，不是 return，不是 T46–T51 重做。**

---

## 不做（硬）

- FSRS / Due / Clew LLM 真写 / verified:true / 掌握% / invent heye-only
- 改名 storage keys / 强制清空整栈
- CitePeek 正文/trap redo / OCR canvas / ⌘K / DeskShell 重写 / Queue→Due
- exam-anchor / ch08+ / nur-landing / PWA
- ModeChips 会话中插队
- ScopeCounts /「对页」**加 return**（OCR 门禁可以，return 不可以）
- SessionKeyHint→ShortcutSheet 大改
- return densify 主题 / 重做 T46–T51 / 只改 Quiz 一处或只做 A–D 就收工
- Next.js security upgrade 当主题
- 假池 / 假 OCR
- 整段 port ariadnemini verify/clew-API
- push（写手禁；PASS 后 auto-push，勿问「推」）

---

## 验收口令

**做完叫验收。A–J 全交才过。**
