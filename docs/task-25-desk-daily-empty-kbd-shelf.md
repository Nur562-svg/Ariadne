# Task 25 / desk-daily-empty-kbd-shelf-01 — 练核空态 + 键对称 + 焦点陷阱 + 架上续开 + 导入首开（Trae）

**模型**：DeepSeek-V4-Pro  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**`a654438`**（T24 `desk-paper-rail-progress-port-01`：sticky 页铬 · PageCardRailMarks · progress-port · CitePeek Esc 焦点归位 · view-continuity）。  
- `git log -1 --oneline` 须为 `a654438` 或其后含 T24 文件。若仍仅 T23（`741f733`）或更早——**停下来对齐，不要开工**。  
**前置**：Task 24 已落 tip。**保留** shell-01 + Task 08–24——本任务把 **日用收口：空了知道下一步、键控练得顺、摘层不丢焦、架上续得开、导入立刻进书桌**；仍不接 FSRS / Clew LLM 真写入。  
**不 push**。验收后再定。

> **体量（硬）**：用户要 **~1h** 刀，不要 5–10 min。本 slice 捆绑 5 段相关 utility（A 空态 densify · B study 键对称/撤销 · C CitePeek 焦点陷阱 · D 架上续开页 · E 导入首开 CTA）。目标 **约 60–90 分钟真实编码**。**若 5–15 分钟收工 = 漏做**；必须做完 IN 的 **A+B+C+D+E**，验收按 **全部** 段检查。

---

## 背景（为何现在做）

| 已有 | 缺口 |
|------|------|
| T20 空态作用域恢复 + sticky 档 | 空/完成态 **CTA 汤**（多颗实心并列）；缺档位芯片带计数 |
| T18 study Space/1/2 · heye ←→/1/2/b | **学习环不能回看**；误评无法撤销；键说明分散 |
| T24 CitePeek Esc 焦点归位 | dialog **无焦点陷阱**；Tab 逃到背后页 |
| T21 LibraryContinuity 顶栏续开 | **每书卡**「打开书桌」不带页；有 last-opened.page 时架上无「续开 p.N」 |
| T22 注册成功 + refresh | 文案仍写 **「刷新后即可开书桌」**（误导；refresh 已发生） |

DeepSeek-V4-Pro 在小刀 brief 上常 5–15 分钟收工。本轮把 **空态 + 键对称 + 焦点陷阱 + 架上续开 + 导入首开** 收进 **同一 brief**。

---

## 一句话目标

**让练核空了知道下一步、学习环键能回看/撤销、CitePeek Tab 不逃、书库每书能续开本页、注册成功立刻开书桌。**

---

## 用户路径（验收脑内电影）

```
/study?mode=unknown 空 → 一颗主 CTA「切到全部」+ 芯片 认识n/不熟n/未评n 可点
练中 ←→ 回看不改分 · 误按 1 后按 u 撤销 · 底栏见键说明
CitePeek「摘」开 → Tab 只在层内转 · Esc 焦回「摘」
书库某书卡：续开 p.42 → /desk?book=&page=42
/ingest 注册成功：打开书桌 →（无「刷新后」）
T20–24 续位/回程/sticky/轨/导出未毁
```

---

## IN（硬 · A+B+C+D+E 全部）

### A. 练/核空·完成 densify

- Study / HeYe 空与完成：**一颗**朱红主 CTA + 次级文字链；档位芯片带本机计数可切档。无掌握%/Due。

### B. Study 键盘对称

- ←→ 本轮回看（不改分）；`u`/`z` 撤销本轮最后一评（薄 undo 栈）；KeyHint；HeYe/纸面键未毁。无 ⌘K。

### C. CitePeek 焦点陷阱

- 开：焦点入层 + `aria-modal`；Tab 陷阱；Esc/外点关闭 + T24 归位。**不重做**摘录内容。

### D. 架上续开页

- 每书卡：有 recent/last page →「续开 p.N →」；无则省略。不重做导出/Strip。

### E. 导入首开 + 回归

- Register 成功 →「打开书桌 →」`/desk?book=`；去「刷新后」；build PASS；不 push；无 OUT。

---

## OUT（显式）

| 不做 | 原因 |
|------|------|
| FSRS / Due / ts-fsrs | OUT forever |
| Clew LLM / Proposal 真写入 | OUT forever |
| seed `verified:true` / 掌握% | 禁 |
| 改名 study/heye keys | 禁 |
| 重做 CitePeek 内容 / OCR 句级 / QueuePanel 大改 | 拒 |
| exam-anchor / PWA / ⌘K / register API 大重构 | 推迟 / OUT |
| 重做 sticky / 卡轨 / progress-port / return / 换书 | 已落；勿毁 |
| ch08+ seed / nur-landing / push | 禁 |

---

## 建议文件

见 SCOPE「建议改动路径」。核心：`StudySession` · `HeYeSession` · `CitePeek` · `ShelfBookContinuity` · `RegisterMaterialButton` · 书库 `page.tsx` · 可选 `SessionKeyHint`。

---

## 自测 / 验收

见 SCOPE 自测表与验收清单。回复须含：改动文件列表、build 结果、A–E 说明（undo 规则 · Tab 陷阱 · 续开 href）、自测路由摘要。**不要 push。**
