# Task 52 SCOPE — desk-empty-complete-widen-viewer-01

**Slug**：`desk-empty-complete-widen-viewer-01`  
**模型**：zcode · GLM5.3 max thinking（MEGA）  
**Tip 前置（硬）**：`2e30178`（`docs(desk) Task 51 acceptance docs`） atop `6744e4b`（feat T51） atop `c99d7ec`（T50）。  
`git log -1 --oneline` 须含 `2e30178` / T51 docs。若仍停在 `6744e4b`（仅 feat）或更早——**停下来对齐，不要开工**。  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**体量（硬 · MEGA）**：约 **185–300+ 分钟** 真实编码；交 **A–J 全部**（10 切片 · 3 子主题）。若只做 Quiz 一处或只做 Viewer 一处就收工 = 拒收。若 15–30 / 90 分钟内假装收工 = 漏做。若做成又一轮 empty-CTA densify、return densify、或重做 T46–T51 = 主题偏了，拒收。  
**不 push**（写手）。验收 PASS 后站规 **auto-push**（勿问「推」）。用户自行粘贴。

---

## 空池 CTA 井状态（硬声明）

**Empty-pool CTA densify 已近饱和（T43–T51）**：Clew 右栏、书桌 Strip/书头/Quiz 去核、练核交叉离面、书架续开、ingest 三连、CitePeek 浮层 CTA、轨顶/Overview 章行、CardCard/搜索核门禁——均已关。  
**本刀不是又一轮 empty-CTA densify，也不是 return densify。**  
相邻最强产品主题 = **空·完成态文案对称 + Quiz「放宽到本书」书空诚实 + Viewer/对页 OCR 页定位诚实 + 孤儿/无书空态同真**。

---

## 主题一句话

练核会话 **空态/完成态文案与结构对称**；Quiz 本章空时若 **本书原子也为 0** 不再链「放宽到本书」；Viewer「←书桌」**带当前页**；卡详「对页 / 在书桌打开本页」遇 **无 OCR 页** 诚实关链—— orphan / 无书 / 空完成 多面同真。

---

## 三子主题

| # | 子主题 | 字母 |
|---|--------|------|
| 1 | 练核空·完成态文案对称（Study / HeYe / review 页级） | B · C · D · E · F |
| 2 | Quiz 放宽到本书 · 书空诚实 | A ·（I 装配） |
| 3 | Viewer / 对页 / 开本页 · OCR 页定位诚实 | G · H · I |

J = build + heye-only DEFER + 回归。

---

## 字母一览（A–J）

| 字母 | 切片 | 估分 |
|------|------|------|
| **A** | QuizPanel：本章空且 **bookAtomCount===0** → 纯文「本书暂无原子」（不链放宽）；book>0 保持「放宽到本书」；DocumentPane 装配 bookAtomCount | 20–30 |
| **B** | StudySession：mode 空 / 完成态 chrome 与 CTA 标签对称整理；mode=all 防御空态与完成态文案不撒谎；不重做 T51 交叉空池门禁 | 20–30 |
| **C** | HeYeSession **池空** chrome 对齐 Study：加 h2「这个范围是空的」；接 `emptyKind`（orphan / card-out / true-empty）改 body；修「去学习环 /study →」丑标签 →「去学习环 →」 | 25–40 |
| **D** | HeYeSession **mode 空**（open 已全部对过 / checked / doubt）标题结构对齐 Study「本轮完成」族；CTA 行标签一致 | 20–30 |
| **E** | review/page：装配 `emptyKind` 入 HeYe；页级琥珀/说明与 study 孤儿·越界·真空 **同真**（不另起一套大 UI 亦可，但 body 必须分型） | 20–35 |
| **F** | study/page：无书全局空态、cardOut/orphan 完成态 deskBack、交叉文案残余对齐（不重做 T51 CrossScope 门禁） | 15–25 |
| **G** | Viewer：`←书桌` → `/desk?book=&page=`（已知页）；可选次级「练本页/核本页」按页池门禁（**不是** CitePeek 正文/trap redo） | 20–35 |
| **H** | EntityCardDetail：三处「对页」+「在书桌打开本页」遇 `bookValidPages` 无该页 → 纯文「本页无 OCR」/「页未解析」；有页保持链 | 25–40 |
| **I** | 装配：DocumentPane→Quiz `bookAtomCount`；desk/card + entities/[id]→Detail `bookValidPages`（`loadBookValidPages`）；可选薄 helper `pageInOcr(validPages, page)` | 20–30 |
| **J** | `pnpm --filter web build` PASS；heye-only invent **DEFER**；回归 T51–T28；写手不 push | 20–30 |

**合计估**：约 **205–325** 分钟（落在 185–300+ MEGA 窗；偏紧可压 F/B 文案，不可砍 A/C/G/H）。

---

## 硬 OUT（本刀 + 站规 forever）

FSRS/Due · Clew LLM 真写 · verified:true · OCR canvas · CitePeek **正文/trap** redo · ⌘K · Queue→Due · DeskShell 重写 · exam-anchor 全量 · invent heye-only seed · ch08+ · nur-landing · 掌握% · 改名 storage keys · 强制清空整栈 · port ariadnemini verify/clew-API · ModeChips 中插队 · **return densify 当主题** · **重做 T46–T51** · Next.js upgrade 当主题 · 假池 · 只交 A–D 或单文件微改就收工 · 写手 push · ScopeCounts「对页」加 **return**（本刀只做 OCR 有效性，不加 return）· SessionKeyHint→ShortcutSheet 大改。

Soft：heye-only invent **DEFER**；Next.js security = ops not theme。

---

## 建议路径

```
apps/web/components/desk/QuizPanel.tsx
apps/web/components/desk/DocumentPane.tsx
apps/web/components/StudySession.tsx
apps/web/components/HeYeSession.tsx
apps/web/app/(desk)/study/page.tsx
apps/web/app/(desk)/review/page.tsx
apps/web/app/(desk)/viewer/page.tsx          # 或等价 Viewer 入口
apps/web/components/desk/EntityCardDetail.tsx
apps/web/app/(desk)/desk/card/page.tsx
apps/web/app/(desk)/entities/[id]/page.tsx
apps/web/lib/book-pools.ts                   # 只读复用；勿毁 T50
# 可选薄 helper：apps/web/lib/ocr-page.ts 或并入既有 util
```

---

## 自测（须勾 · 摘要）

1. Quiz · 本章 0 且本书 0 →「本书暂无原子」纯文；本书>0 → 仍「放宽到本书」可点  
2. StudySession mode 空 / 完成 → 标题+CTA 对称；T51 交叉空池未毁  
3. HeYe 池空 · orphan → body 分型；h2 在；「去学习环 →」无裸路径字  
4. HeYe open 已对完 / checked / doubt 空 → 标题族对齐「完成」感  
5. review 孤儿/越界/真空 → emptyKind 生效；study 无书/orphan 残余同真  
6. Viewer 有页 → ←书桌带 `&page=`；缺页琥珀未毁  
7. 卡详 对页 / 开本页 · 页∉OCR → 纯文；页∈OCR → 链在  
8. DocumentPane bookAtomCount / card+entity validPages 装配正确  
9. build PASS；未 push；heye-only DEFER 声明  
10. 回归：T51 Clew/Strip/书头/Quiz核/交叉；T50 shelf/book-pools；T49 ingest/CitePeek 浮层+正文/trap；T48–T28 leaveReturn 未拆；ModeChips 未插队；Queue 非 Due

---

## 验收口令

**做完叫验收。A–J 全交才过。**
