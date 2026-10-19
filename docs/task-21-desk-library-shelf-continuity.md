# Task 21 / desk-library-shelf-continuity-01 — 书库 last-opened 续开 + 架上诚实本机计数 + 侧栏在读可点 + 档位条 sticky + 空/坏恢复（Trae）

**模型**：DeepSeek-V4-Pro  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：`cd527df`（Task 20 desk-session-continuity-01）或其后。`git log -1 --oneline` 须含 T20（session-continuity · StickyModeGate · Study/HeYe 续位）。  
- 定稿时 box `/workspace/Ariadne-push` = `cd527df`；Mac 可能仍停在 `619f7b0`（T19）且工作树脏——**若工作树无 T20 文件，停下来对齐，不要开工**。  
- 若 tip 已是 `cd527df` 之后新 SHA，以新 tip 为准（须仍含 T20）。  
**前置**：Task 20 已落 tip。**保留** shell-01 + Task 08–20——本任务把 **书架续开 + 架上本机计数 + 侧栏在读 + 档位条 sticky + 空/坏恢复** 加厚；仍不接 FSRS / Clew LLM 真写入。  
**不 push**。验收后再定。

> **体量（硬）**：用户要 **~1h** 刀，不要 5–10 min。本 slice 捆绑 5 段相关 utility（A last-opened · B 架上本机计数+继续上次 · C 侧栏在读 · D CSS sticky 档位带 · E 空/坏恢复）。目标 **约 60–90 分钟真实编码**。**若 5–15 分钟收工 = 漏做**；必须做完 IN 的 **A+B+C+D+E**，验收按 **全部** 段检查。

---

## 背景（为何现在做）

| 已有 | 缺口 |
|------|------|
| T18 书库三连（书桌｜学习｜核页） | 只有链，**无**「继续上次打开的书」 |
| T17–19 LocalProgressStrip 跨面 | 书桌/卡/Clew 有；**书架每书无本机计数** |
| T20 本标签 Study/HeYe 续位 | 练/核不丢题；**回书架仍丢「读哪本」** |
| Sidebar「在读」 | 死取 `books[0]`，与用户真实打开脱节 |
| study/review 章芯片+三档 | 滚长队列后档位条滚出视口 |
| T20 Deferred | 明文推迟「书库 last-opened + 架上 LocalProgress」→ **本刀** |

DeepSeek-V4-Pro 在小刀 brief 上常 5–15 分钟收工。本轮把 **续开指针 + 架上诚实计数 + 侧栏 + sticky 工具带 + 空/坏恢复** 收进 **同一 brief**。

---

## 一句话目标

**让书架记住上次打开的书并一键续开书桌；每书诚实展示本机练/核计数（无掌握%）；侧栏在读跟 last-opened 可点；学习/核页滚动时档位与章芯片钉住；空库与失效指针诚实恢复。**

---

## 用户路径（验收脑内电影）

```
打开 /desk?book=immunology-3rd → 读几页 → 回 /
  → 「继续上次：《免疫学…》→」· 该书有「上次打开」小字
  → 该书下方可见 练 认识/不熟/未评 | 核 待核/已对/存疑（本机 · 非掌握%）
侧栏「在读」显示该书（不是永远第一本）· 可点书桌 · 有学习/核次级
/study 或 /review 下滚长队列 → 章芯片+三档条仍钉在顶部
删掉 books 里该书 id 后刷新 → last-opened 清除 · 回落 · 琥珀提示（可选）
空库 → 去导入 + 效用步骤（非营销 hero）
T20 刷新续位 / StickyModeGate / 键盘环 / CitePeek 仍在
```

---

## IN（硬 · A+B+C+D+E 全部）

### A. last-opened 指针（核心）

#### A1. Helper（硬）

- 新文件建议：`apps/web/lib/last-opened.ts`。  
- **允许** 一个专用 **localStorage** key（例 `ariadne.desk.last-opened.v1`）存 `{ bookId: string; deskHref?: string; page?: number; at: number }`。  
- **禁止** 改名/迁移 `ariadne.study.v1` / `ariadne.heye.v1`。  
- **禁止** 复用 `ariadne.desk.session.v1`（T20 sessionStorage 游标桶；关标签即清）。  
- `load` / `save` / `clear`；隐私模式 try/catch。

#### A2. 写点（硬）

- `/desk?book=` 成功命中已注册书时 `saveLastOpened`（DocumentPane / DeskSurfaceBridge / 薄客户端岛，择一清晰处）。  
- 鼓励：有效 `/study?book=`、`/review?book=` 也轻触同 bookId。  
- 非法 / 未注册 bookId **不写**。

### B. 书库继续上次 + 架上本机计数（核心）

- `/` 保留种子库存（章节/实体卡/知识原子）。  
- 客户端岛：合法 last-opened → 顶栏「继续上次：《书名》→」进书桌；每书挂 `LocalProgressStrip`（服务端传该书 atoms/items 池）。  
- 免责：仅本浏览器 · 非掌握度 · 非 Due。  
- **禁止** 掌握 % / 圆环 / 「已掌握」营销绿条。

### C. Sidebar 在读跟 last-opened（核心）

- layout 传入多书摘要（id/title/章数/卡数）；Sidebar 客户端选 last-opened，失效回落 `books[0]` 或空库文案。  
- 在读区可点书桌；鼓励学习/核次级链（`?book=`）。

### D. study/review CSS sticky 工具带（核心）

- 章芯片行 + 三档 tablist 包进 `position:sticky; top:0` 实底工具带（`bg-card` + `border-b border-line`）。  
- **不等于** T20 `StickyModeGate`（URL 档位记忆）——注释写清。  
- 保留 StickyModeGate 行为。

### E. 空/坏恢复 + 回归（硬）

- 空库：ingest CTA + 效用步骤；无营销 hero。  
- 失效 last-opened：clear + 回落；可选琥珀一句。  
- T07–20 不毁；`pnpm --filter web build` PASS；**不要 push**。  
- 无 FSRS / Clew API / verified:true / 掌握% / OCR / exam-anchor / ch08+ / nur-landing。

---

## OUT（显式）

| 不做 | 原因 |
|------|------|
| FSRS / Due / ts-fsrs | OUT forever |
| Clew LLM / Proposal 真写入 | OUT forever |
| seed `verified:true` | 作弊禁 |
| 掌握 % / 假仪表盘 | 禁 |
| 改名 study/heye localStorage key | 禁 |
| last-opened 塞进 study/heye store | 禁 |
| Clew QueuePanel 大改 / 拖宽 | 非本刀 |
| OCR 句级 / 页图 Canvas | 过大 |
| exam-anchor / 模考 | 推迟 |
| ingest 管线大改 | 非本刀 |
| ch08+ / nur-landing | 禁 |
| 擅自 push | 禁 |

---

## 自测表（Trae 回复须勾）

| # | 路由 / 面 | 期望 |
|---|-----------|------|
| 1 | `/desk?book=` 后回 `/` | 继续上次可见 |
| 2 | 架上每书 | LocalProgress 本机计数；无掌握 % |
| 3 | Sidebar 在读 | 跟 last-opened；可点 |
| 4 | 失效 last-opened | clear + 回落 |
| 5 | `/study` `/review` 下滚 | 章+档 sticky；StickyModeGate 未毁 |
| 6 | T20 续位 / 键盘 / CitePeek | 未毁 |
| 7 | 空库 | ingest + 效用步骤 |
| 8 | build | PASS；未 push；study/heye key 未破 |

---

## 验收清单

- [ ] A：last-opened helper + 写点  
- [ ] B：继续上次 + 架上本机计数（无掌握%）  
- [ ] C：Sidebar 在读可点  
- [ ] D：study/review sticky 工具带  
- [ ] E：空/坏 + 回归 + build + 无 OUT  
- [ ] 体量：多文件，非 5–15 min 漏做  

---

## 回复格式（Trae）

1. 改动文件列表  
2. build 结果  
3. A/B/C/D/E 各一段说明（含 last-opened key 设计 · 与 T20 session 桶边界）  
4. 自测路由摘要  
5. 明确：**未 push**
