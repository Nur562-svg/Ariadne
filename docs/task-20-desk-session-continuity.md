# Task 20 / desk-session-continuity-01 — Study/HeYe 会话续练 + sticky mode + 空态作用域恢复 + 焦点绑实用（Trae）

**模型**：DeepSeek-V4-Pro  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：`619f7b0`（Task 19 desk-cite-honesty-densify-01）或其后。`git log -1 --oneline` 须含 T19（CitePeek 跨面 · 本页跳核 · Clew 章池）。  
- 定稿时 box `/workspace/Ariadne-push` 可能仍停在 `28fb35e`（仅 T18）——**若工作树无 T19 文件，停下来对齐，不要开工**。  
- 若 tip 已是 `619f7b0` 之后新 SHA，以新 tip 为准（须仍含 T19）。  
**前置**：Task 19 已落 tip。**保留** shell-01 + Task 08–19——本任务把 **练/核会话续位 + sticky 档 + 空态恢复 + 焦点** 加厚；仍不接 FSRS / Clew LLM 真写入。  
**不 push**。验收后再定。

> **体量（硬）**：用户要 **~1h** 刀，不要 5–10 min。本 slice 捆绑 4 段相关 utility（A sessionStorage 续位 · B sticky mode · C 空态作用域恢复 · D 焦点绑实用）。目标 **约 60–90 分钟真实编码**。**若 5–15 分钟收工 = 漏做**；必须做完 IN 的 **A+B+C+D+E**，验收按 **全部** 段检查。

---

## 背景（为何现在做）

| 已有 | 缺口 |
|------|------|
| T13–16 Study/HeYe 工作台 + 三档 | 刷新 / 重挂载 → **idx 归零**，长会话丢位 |
| T18 键盘环 | 键控已齐，但续练未做 |
| T19 CitePeek / Clew 章池 | cite 可扫；**会话连续性**仍断 |
| mode 靠 URL | 无 `?mode=` 深链总回默认档；用户上次「不熟再练」被忘掉 |
| 空/完成态 | 有回书桌/切档，**缺章级诚实恢复** |
| T19 Deferred | 明文推迟「Study/HeYe resume idx / sticky mode / 空态章级恢复」→ **本刀** |

DeepSeek-V4-Pro 在小刀 brief 上常 5–15 分钟收工。本轮把 **续位 + sticky + 空态恢复 + 焦点** 收进 **同一 brief**。

---

## 一句话目标

**让学习环 / 核页在同一浏览器标签内刷新不丢队列位；无 mode 参数时 sticky 回落上次档；空/完成态能按章/范围诚实恢复；续位与切条时焦点跟当前题。**

---

## 用户路径（验收脑内电影）

```
打开 /study?book=…&chapter=… → 练到第 7 题 → 刷新
  → 仍在第 7 题（或完成态）· 小字「已从本标签续上…」· 焦点在题面
切到「不熟再练」→ 离开再从 /study?book=…（无 mode）进入
  → sticky 补上 mode=unknown（URL replace）
某章 atoms 空 → 可见「全部章节」/ 换章链，不是只有笼统回书桌
/review 对称：续位 · sticky · 空态回待核/本页/书桌
键盘环 Space/1/2 与 CitePeek 仍在
```

---

## IN（硬 · A+B+C+D+E 全部）

### A. sessionStorage 队列续位（核心）

#### A1. Helper（硬）

- 新文件建议：`apps/web/lib/session-continuity.ts`。  
- **只写 `sessionStorage`**。可用单桶 key（例 `ariadne.desk.session.v1`）存 cursors + sticky maps。  
- **禁止** 新建 localStorage 进度 key；**禁止** 改名 `ariadne.study.v1` / `ariadne.heye.v1`。  
- Study scopeKey = `${card|all}:${book|all}:${chapter|all}:${mode}`（与父 remount key 一致）。  
- HeYe scopeKey = `${book|all}:${card|all}:${page|all}:${chapter|all}:${mode}`。  
- `load/save/clear` Study cursor（number）；HeYe cursor 对称。try/catch 隐私模式。

#### A2. StudySession（硬）

- `ready` + `order` 就绪后恢复 cursor 并 **clamp** 到 `[0, order.length]`。  
- `idx` 变化写回；`restart()` 先 clear 再从 0。  
- 续位（idx>0 或完成态）显示诚实续练文案（本标签 · 非跨设备）。

#### A3. HeYeSession（硬）

- 对称：`visible` 上 clamp；index 变化写回；`resetStore` 清游标；`go`/mark 后写回。

### B. Sticky mode（核心）

- URL 有合法 `?mode=` → 用之并 **save sticky**（scope **不含** mode）。  
- URL 无 `?mode=` → 读 sticky；若存在且 ≠ 默认（study:`all` / heye:`open`）→ 客户端 `router.replace` 补 mode，保留其余 query。  
- 薄客户端组件挂 study/review 页（勿整页 client 化）。  
- 非法 mode：保持现有警告 + 回落，不被 sticky 写成非法值。

### C. 空态 / 完成态作用域恢复（核心）

- `/study` `atoms.length===0`：在 ingest/书桌外，有章芯片时给「全部章节」+ 换章链（效用文；不编造掌握数）。  
- Study 档空 / 完成：保留切档与回链；理顺书桌/核页；鼓励换章次级链（可选 props）。  
- HeYe 池空 / 档空：理顺 card · deskPage · study · openHref；章范围可清 chapter 回核。  
- 禁止假「已全部掌握」营销绿条。

### D. 焦点 / a11y 绑实用（核心）

- 续练文案 `aria-live="polite"`。  
- 续位后 / 切到新题后：焦点 → 当前题主容器（`tabIndex={-1}` + `focus()`）。  
- 保留 T18 键盘环与 `isEditableTarget`。  
- 不做 ⌘K / 全站 a11y 大扫。

### E. 回归与护栏（硬）

- T07–19 全表面不毁；CitePeek / 同页跳 / Clew 章池 / 作用域 Strip / 键盘环保留。  
- `pnpm --filter web build` PASS；**不要 push**。  
- 朱红唯一；精炼书桌；无 FSRS / Clew API / verified:true / 掌握% / OCR / exam-anchor / ch08+ / nur-landing。

---

## OUT（显式）

| 不做 | 原因 |
|------|------|
| FSRS / Due / ts-fsrs | OUT forever |
| Clew LLM / Proposal 真写入 | OUT forever |
| seed `verified:true` | 作弊禁 |
| 新 localStorage 进度仓 | 游标只用 sessionStorage |
| 掌握 % / 假仪表盘 | 禁 |
| 书库 last-opened 大做 | Deferred |
| OCR 句级高亮 / 页图 | 过大 |
| exam-anchor / 模考 | 推迟 |
| ingest 管线大改 | 非本刀 |
| Clew 拖宽 / 窄屏大改 | 铬件 |
| ch08+ / nur-landing | 禁 |
| 擅自 push | 禁 |

---

## 自测表（Trae 回复须勾）

| # | 路由 / 面 | 期望 |
|---|-----------|------|
| 1 | `/study?book=&chapter=` 练中刷新 | 续上原 idx；横幅；焦点在题 |
| 2 | Study `restart` | 从 0；旧 cursor 已清 |
| 3 | `/study?book=` 无 mode（曾选过 unknown） | sticky replace `mode=unknown` |
| 4 | `/study?...&mode=all` | URL 胜；并写入 sticky |
| 5 | `/review` 续位 + sticky | 对称 |
| 6 | 空章 / 档空 / 完成态 | 有作用域恢复链 |
| 7 | 键盘环 + CitePeek | T18/T19 未毁 |
| 8 | build | `pnpm --filter web build` PASS；未 push；localStorage study/heye key 未破 |

---

## 验收清单

- [ ] A：sessionStorage 续位 Study + HeYe  
- [ ] B：sticky mode（URL 优先）  
- [ ] C：空/完成态作用域恢复  
- [ ] D：续位/切条焦点 + aria-live  
- [ ] E：回归 + build + 无 OUT  
- [ ] 体量：多文件，非 5–15 min 漏做  

---

## 回复格式（Trae）

1. 改动文件列表  
2. build 结果  
3. A/B/C/D 各一段说明（含 session key 设计 · sticky 规则）  
4. 自测路由摘要  
5. 明确：**未 push**
