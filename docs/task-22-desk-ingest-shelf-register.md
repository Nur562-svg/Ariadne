# Task 22 / desk-ingest-shelf-register-01 — 导入章清单诚实 + extracted→ready 一键上架 + 注册后连续性 + 多书换书/最近栈（Trae）

**模型**：DeepSeek-V4-Pro  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**T21 tip 或其后**（`desk-library-shelf-continuity-01`：`last-opened.ts` · `LibraryContinuity` · `LastOpenedTouch` · Sidebar 在读 · study/review sticky）。Parent 交手时替换真实 tip SHA（定稿时 Mac ≈ `cba68c0`；push 后可能更新）。  
- `git log -1 --oneline` 须含 T21。若仍仅 T20（`cd527df`）或更早——**停下来对齐，不要开工**。  
**前置**：Task 21 已落 tip。**保留** shell-01 + Task 08–21——本任务把 **顾客材料上架断点** 与 **多书换书诚实** 收齐；仍不接 FSRS / Clew LLM 真写入。  
**不 push**。验收后再定。

> **体量（硬）**：用户要 **~1h** 刀，不要 5–10 min。本 slice 捆绑 5 段相关 utility（A 章清单 · B register API · C 注册 CTA+三连 · D 最近栈+换书 · E 冲突/空错）。目标 **约 60–90 分钟真实编码**。**若 5–15 分钟收工 = 漏做**；必须做完 IN 的 **A+B+C+D+E**，验收按 **全部** 段检查。

---

## 背景（为何现在做）

| 已有 | 缺口 |
|------|------|
| T07 诚实 upload → uploaded；parse/extract 本机 CLI | extracted→ready **手改** `config/books.json` |
| T18 ingest ready 三连（书桌｜学习｜核页） | 仅对已 ready；extracted 只「去书库」空转 |
| T21 last-opened + 架上 LocalProgress + 侧栏在读 | 只服务**已注册**书；上架断点未收；多书换书无入口 |
| 单指针 last-opened | 换书后他书页记忆丢（无最近栈） |
| Sidebar 在读长书名 | 易撑破 ~248 栏 |

DeepSeek-V4-Pro 在小刀 brief 上常 5–15 分钟收工。本轮把 **章清单 + 一键上架 + 注册后连续性 + 多书换书/最近栈 + 冲突恢复** 收进 **同一 brief**。

---

## 一句话目标

**让导入页诚实展示每物料章清单；extracted 一键写入 chapter.json+books.json 上架；注册后书架可见并三连开书桌；多书时能换书且最近栈不丢他书续开页；冲突章 id 诚实拒绝不毁 seed。**

---

## 用户路径（验收脑内电影）

```
/ingest 打开已有物料 → 见章清单（每章 blocks/cards 有/无）
准备一条 extracted 物料（章 id 不与 ch01–ch07 冲突）
  → 「注册进书库 →」→ refresh → ready 三连（书桌｜学习｜核页）
  → / 书库出现新书；T21 继续上次仍可用
故意用 ch01 冲突注册 → 琥珀失败；immunology 章表未改
两本以上：书桌或侧栏换到 B → 再回 A → A 的停留页仍在最近栈
侧栏长书名 truncate；T20 续位 / T19 CitePeek / sticky 未毁
```

---

## IN（硬 · A+B+C+D+E 全部）

### A. 章清单诚实 densify

- `/ingest` 每物料：章列表（id · 标题 · 物理页 · blocks 有/无 · cards 有/无）。  
- 禁止假 % 进度条 / 假 OCR 动画。  
- 状态机语义不变。

### B. register API（核心）

- `POST` 注册接口：materialId → 校验 extracted → 合并写 `config/chapter.json` + `config/books.json`。  
- 章 id 已存在 → **整单失败**，不半写、不覆盖 seed。  
- 默认 **新 bookId 新书**；bookId 冲突失败。  
- 纯函数可抽到 `lib/register-book.ts` 便于测。

### C. 注册 CTA + 注册后连续性

- extracted：朱红「注册进书库 →」+ muted 本机说明。  
- 成功 refresh → ready 三连；书架出现新书。  
- 可选轻触 last-opened；勿抢「继续上次」主视觉。

### D. 最近栈 + 换书 + 长标题

- 最近栈 key（例 `ariadne.desk.recent-books.v1`）或同文件扩展；`loadLastOpened()` 仍=栈顶（T21 兼容）。  
- 禁止动 study/heye keys；禁止复用 session 桶。  
- `books.length>=2`：书桌书名旁和/或 Sidebar 在读区薄换书入口。  
- 换书保留被换下书在栈中的 page/deskHref。  
- 长书名 truncate + title tooltip。

### E. 冲突/空错 + 回归

- 冲突/非法：琥珀 + 4xx；seed 未毁。  
- T07–21 回归；`pnpm --filter web build` PASS；不 push。  
- 无 FSRS / Clew API / verified:true / 掌握% / OCR 句级 / exam-anchor / ch08+ seed / nur-landing。

---

## OUT（显式）

| 不做 | 原因 |
|------|------|
| FSRS / Due / ts-fsrs | OUT forever |
| Clew LLM / Proposal 真写入 | OUT forever |
| seed `verified:true` | 作弊禁 |
| 掌握 % / 假仪表盘 | 禁 |
| 静默覆盖已有章 id | 禁 |
| 云端 OCR / 改 parse·extract | 非本刀 |
| Clew QueuePanel / 拖宽 | 非本刀 |
| OCR 句级 / 页图 Canvas | 过大 |
| exam-anchor / PWA | 推迟 |
| 进度 JSON 导出大做 | deferred |
| 重做 CitePeek / 回程条大 densify | 拒（已厚） |
| ch08+ seed / nur-landing / push | 禁 |

---

## 自测表（Trae 回复须勾）

| # | 路由 / 面 | 期望 |
|---|-----------|------|
| 1 | `/ingest` | 章清单 + blocks/cards 诚实 |
| 2 | extracted 注册成功 | ready 三连；书架有新书 |
| 3 | 冲突 ch01 | 失败；seed 未改 |
| 4 | 多书换书 | 栈保留他书页；T21 继续上次未毁 |
| 5 | Sidebar 长标题 | truncate |
| 6 | T20/T19/T18/T21 回归 | 未毁 |
| 7 | build | PASS；未 push |

---

## 验收清单

- [ ] A–E 全交  
- [ ] 体量：多文件，非 5–15 min 漏做  

---

## 回复格式（Trae）

1. 改动文件列表  
2. build 结果  
3. A/B/C/D/E 各一段（含 register 冲突策略 · 最近栈与 T21 边界）  
4. 自测路由摘要（含是否用了 synthetic material）  
5. 明确：**未 push**
