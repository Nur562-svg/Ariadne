# Task 23 / desk-loop-roundtrip-continuity-01 — Study↔desk↔review 回程深链连续性 densify（Trae）

**模型**：DeepSeek-V4-Pro  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**T22 tip 或其后**（`desk-ingest-shelf-register-01`：章清单 · register API · `RegisterMaterialButton` · `recent-books.v1` · Sidebar 换书 · truncate）。Parent 交手时替换真实 tip SHA（定稿时 Mac ≈ `ab63e32`；push 后可能更新）。  
- `git log -1 --oneline` 须含 T22。若仍仅 T21（`cba68c0`）或更早——**停下来对齐，不要开工**。  
**前置**：Task 22 已落 tip。**保留** shell-01 + Task 08–22——本任务把 **日用练/核/卡↔书桌回程不断线** 收齐；仍不接 FSRS / Clew LLM 真写入。  
**不 push**。验收后再定。

> **体量（硬）**：用户要 **~1h** 刀，不要 5–10 min。本 slice 捆绑 5 段相关 utility（A 学习回程带页 · B 薄 return 栈 · C 卡枢纽 densify · D sticky 对称+书桌换书 · E 空错/回归）。目标 **约 60–90 分钟真实编码**。**若 5–15 分钟收工 = 漏做**；必须做完 IN 的 **A+B+C+D+E**，验收按 **全部** 段检查。

---

## 背景（为何现在做）

| 已有 | 缺口 |
|------|------|
| T15–19 CitePeek / deskPageHref / 回本卡 / 核本页 | 学习环「回书桌」常只 `/desk?book=`，**丢页** |
| HeYe 完成/空态「回书桌本页」 | study 不对称 |
| T20 session 续位 + T21 last-opened + T22 最近栈 | desk→study/review **无「回到刚才」** |
| 卡枢纽练/核 CTA + cite 诚实条 | atoms 清单薄；缺「在书桌打开本页」 |
| T22 Sidebar 换书 | DocumentPane 书名旁换书未做（and/or 残） |
| 书库空态 | 仍易暗示手改 `books.json`（T22 已有一键注册） |

DeepSeek-V4-Pro 在小刀 brief 上常 5–15 分钟收工。本轮把 **回程带页 + return 栈 + 卡枢纽 + sticky/换书对称** 收进 **同一 brief**。

---

## 一句话目标

**让练/核/卡枢纽与书桌往返记住页与来源：学习可回书桌本页；出发可「回到刚才」；卡枢纽 atoms 可扫并链本页；review 写入续开页；书桌书名旁可换书。**

---

## 用户路径（验收脑内电影）

```
书桌打开 immunology p.42 →「核本页」→ 对几条 →「回书桌本页」仍 p.42
同页 →「练」进 /study?book= → 评完 →「回书桌本页」或「回到刚才」回书桌
/desk/card/<id> → 见 atoms 清单 →「在书桌打开本页」→ 章页定位
/study?card= sticky 带「回本卡」
两本以上：DocumentPane 书名旁换书，他书页仍在最近栈
空库文案指向 /ingest 注册；CitePeek / 续位 / register 未毁
```

---

## IN（硬 · A+B+C+D+E 全部）

### A. 学习环回程带页

- 完成/空态：有页线索 → `/desk?book=&page=`「回书桌本页」；无页不假编。  
- 页来源：当前 atom cite → 卡首有页 cite → last-opened 同书 page。  
- `LastOpenedTouch` 已知页则传入；未知勿擦掉书桌精确页。

### B. 薄 return 栈

- 新 key（例 `ariadne.desk.return.v1`，sessionStorage）；与 `session.v1` / `recent-books.v1` / study·heye **分桶**。  
- 书桌/卡枢纽出发写 return；完成/空态「回到刚才」；非法忽略。

### C. 卡枢纽 densify

- atoms 紧凑清单；有页 cite →「在书桌打开本页」；出发练/核写 return。

### D. sticky 对称 + 书桌换书

- review `LastOpenedTouch` 写 page；study sticky「回本卡」/「回书桌本页」；DocumentPane 书名旁换书（books≥2）。

### E. 空错 + 回归

- 空库文案对齐注册路径；build PASS；不 push；无 OUT；T07–22 不毁。

---

## OUT（显式）

| 不做 | 原因 |
|------|------|
| FSRS / Due / ts-fsrs | OUT forever |
| Clew LLM / Proposal 真写入 | OUT forever |
| seed `verified:true` / 掌握% | 禁 |
| 复用 session/recent/study/heye 桶 | 禁 |
| 重做 CitePeek / OCR 句级 / QueuePanel 大改 | 拒 |
| exam-anchor / PWA / 导出大做 / ⌘K | 推迟 |
| ch08+ seed / nur-landing / push | 禁 |

---

## 建议文件

见 SCOPE「建议改动路径」。核心：`return-stack.ts` · `StudySession` · `study/page` · `review/page` · `EntityCardDetail` · `DocumentPane` · 书库空态。

---

## 自测 / 验收

见 SCOPE 自测表与验收清单。回复须含：改动文件列表、build 结果、A–E 说明（页来源优先级 · return 桶边界）、自测路由摘要。**不要 push。**
