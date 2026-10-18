# Task 15 / desk-page-card-loop-01 — 章页↔实体卡双向闭环：本页相关卡轨 + 翻页 URL 同步 + 薄「核本页」（Trae）

**状态**：brief 已定 · 待 Trae 执行（假定 T14 desk-card-hub 已 PASS；Grok Bot 调度 · 本文件不启动 Trae）  
**仓库**：`Nur562-svg/Ariadne`（本机 `/Users/nukeab/projects/Ariadne`；box 对照 `/workspace/Ariadne-push`）  
**主写手**：Trae Code（建议模型 **`DeepSeek-V4-Pro`**；备选 zcode）  
**前置**：Task 14 desk-card-hub-01 已落 tip（卡枢纽：`?card=` study/review、EntityCardDetail 动作条+cite 诚实条、QuizPanel 文案）。**保留** shell-01 + Task 08–14——本任务补 **页→卡** 阅读闭环；仍不接 FSRS / Clew LLM。  
**规范**：先读 `docs/frontend-aesthetics.md`（精炼书桌 · 朱红唯一品牌强调色 · 产品面勿做营销 hero / nur-landing）  
**视觉 / IA**：desk-ia「可核页 / 跳到引用」——本 slice 做 **章页上的本页实体卡轨 + URL 页码连续 + review?page=**，**禁止** 假核页 pill、**禁止** 改 seed `verified:true`

> **开工前（硬）**：Mac `git log -1 --oneline` 确认 tip **已含 Task 14**（feat desk-card-hub / `?card=` 枢纽）。pre-T14 tip 曾是 `1d59d96`——**不要**在仅含 T13 的 tip 上开工。本任务 **不** 要求 Trae push；验收通过后由 Grok Bot / Nuradil 决定推仓。  
> **体量（硬）**：本 slice 刻意大于 Task 08–10 的「一刀铬件」，也大于「只在阅读器加一个 Link」。目标 **约 30–90 分钟真实编码**（页→卡索引、ChapterPageReader 卡轨、DocumentPane 翻页 URL 同步、`collectCiteQueue`/`/review` 接 `?page=`、多路由自测）。若 2 分钟内只加一个列表——**范围不够，继续做完 IN 清单**。

---

## 为何这一刀要更大（对照 Task 08–14）

| 已交付 | 剩余断点 |
|--------|----------|
| T08–10 DeskShell 三栏 · 开书 · 铬件统一 | 章页阅读器仍是纯 OCR 孤岛 |
| T11 DocumentPane 三模 + Clew stub | 分栏看得见卡列表，但**不按当前页**收窄 |
| T12 CiteChip → `/desk?book=&page=` | 卡/核页 → 页已通；**页 → 卡未通** |
| T13 `/study` DeskShell + 三档自评 | 练环已开 |
| T14 卡枢纽 `?card=` + cite 诚实条 | 卡 → 练/核/页已通；阅读面仍进不了枢纽 |

DeepSeek-V4-Pro 在小刀 brief 上常 ~2 分钟收工。本轮把 **页→卡索引 + 阅读器卡轨 + URL 同步 + 本页核** 收进 **同一 brief**。

产品脊梁仍是：**顾客自带材料 → 可考知识原子**（免疫学 seed 是验收语料，不是产品身份）。读材料时要能落到原子容器（卡）。

---

## 目的（一句话）

**在章页/分栏阅读面上做出页→卡双向闭环**：当前印刷页展示「本页相关实体卡」轨（进卡枢纽）；翻页同步 `?page=`；`/review?page=` 收窄本页待核 cite。不做 FSRS、不做 Clew LLM、不做假全核。

---

## 产品对照（本 slice）

```
阅读闭环（本轮）
├─ /desk?book=&page=N（章页 | 分栏）
│  ├─ ChapterPageReader：OCR 原文（已有）
│  ├─ 本页相关实体卡轨 → /desk/card/[id]（+ 薄练/核）
│  └─ 翻页 → URL ?page= 同步（不整页重载）
├─ /review?page=N（可兼 book=）
│  └─ 仅引该页的待核 cite（本机对页）
└─ 保留
   └─ CiteChip / 卡枢纽 ?card= / study 三档（T12–14）
```

---

## IN 范围（硬 · 一 Trae 会话 · 必须全部做完）

### A. 页→卡数据层（核心）

#### A1. cardsCitingPage（硬）

- 新增 `cardsCitingPage(page: number, opts?: { bookId?: string })`（放 `lib/entities.ts` 或薄新文件均可）
- 扫描卡的 `cites` / `fields[].cite` / `atoms[].cite`：`cite.page === page` → 纳入该卡
- 按 `card.id` 去重；可选返回命中 cite 的短摘要（quote 截断 / 来源标签）供 UI
- 有 `bookId` 时只扫该书章节下的卡（与 `loadCards({bookId})` 一致）
- **禁止** 改 seed；**禁止** 编造卡

#### A2. collectCiteQueue + page（硬）

- `opts?: { bookId?: string; cardId?: string; page?: number }`
- 有 `page` 时只保留 `item.page === page`（在现有收集之后过滤，或收集时跳过——选一并注释）
- 与 `cardId` 并存：交集；与 `bookId` 并存：先书后页
- `page != null && verified === false` 待核语义不变；**禁止** 回写 `verified`

---

### B. ChapterPageReader 本页卡轨（核心）

#### B1. UI（硬）

- 当前页有 OCR 时，在正文下（或紧贴标题旁的次栏）展示 **「本页相关实体卡」**
- 列表项：卡名（主链 `/desk/card/[id]`）+ 可选 kind / 一句话截断 + 命中 cite 短摘（有则）
- 空态：诚实「本页暂无 seed 卡引用本印刷页」——**禁止** 假卡

#### B2. 薄动作（硬交付 · 保持密度）

- 「练」次链 → `/study?card=<id>&book=<bookId>`（无原子可省略）
- 「核本页」总入口（轨顶或页头旁）→ `/review?book=<id>&page=<N>`；若本页待核数为 0，隐藏或诚实禁用文案
- 单卡「核」可走 `/review?card=`（T14）——与「核本页」二选一或并存，勿堆三个大红按钮

#### B3. 数据传入

- DocumentPane（或 desk/page 服务端）按当前 `pageNo` 算 citing cards + 可选本页待核计数，传给 ChapterPageReader
- 翻页时轨内容随 `pageNo` 更新

---

### C. DocumentPane 翻页 URL 同步（核心）

#### C1. replaceState / router（硬）

- `pageNo` 或章切换导致当前印刷页变化时，把地址更新为  
  `/desk?book=<book.id>&page=<pageNo>`（可保留现有 `mode=` 若已在 URL）
- 使用 `history.replaceState` 或 Next App Router 等价 API——**不要** `location.assign` 整页刷新打断滚动
- 初始 `?page=` 深链行为保留（T12）

#### C2. 分栏模式（硬）

- split 下章页半区同样显示本页卡轨（或共享同一 Reader）；实体卡半区可不强制「只显示引本页」，但鼓励 TOC/过滤旁加极薄「引本页」芯片——非必须，有余力再做

---

### D. `/review?page=`（核心）

#### D1. 页参数（硬）

- `searchParams` 读 `page`（正整数）；`collectCiteQueue({ page, bookId?, cardId? })`
- 页头：范围含「印刷页 p.N」；非法 page 诚实警告并回落（无 page 过滤）
- 空队列：链「回书桌本页」→ `/desk?book=&page=`；保留回本卡（若有 card）

#### D2. HeYeSession（薄）

- 空/完成态若传入 `deskPageHref`，优先展示回书桌本页；无则保持现有书桌/学习链

---

### E. 保留与回归护栏（硬）

- **保留** Task 07–14 全表面（含卡枢纽 `?card=`、cite 诚实条、三档 study、核页本机态、CiteChip desk 深链）
- **勿** `verified: true` 写入 seed
- **勿** 真 FSRS / Clew LLM / ProposalCard 真写入 / 新章 / nur-landing / 擅自 push / 窄屏大重构 / ingest 管线重写 / OCR 句级高亮大工程

---

### F. Visual polish（硬 · 薄 · 必做 · 不缩 A–D）

- 卡轨：发丝边 / muted 标签「本页相关」；卡名用正文色，链悬停朱红；琥珀仅未核实类提示
- 主 CTA 仍克制：阅读主路径是 OCR；卡轨是次级扫视面，勿做成营销卡砖墙

---

## OUT of scope（显式推迟 · 硬）

| 不做 | 原因 |
|------|------|
| ts-fsrs / DueCard 真调度 | OUT forever |
| Clew LLM / ProposalCard 真写入 | stub 已够 |
| 改 seed JSON `verified:true` | 作弊禁 |
| 假本页全核 / 营销仪表盘 | 禁 |
| OCR 句级高亮 / CitationPeek | 过大 |
| 核页章芯片 + 批量标全做 | 记 T16 |
| 窄屏 DeskShell collapse 大重构 | 铬件 |
| ingest 迁入 DeskShell / 管线大改 | T07 已诚实 |
| 新章 ch08+ / nur-landing | 禁 |
| 擅自 push | 验收后再定 |

---

## 成功标准

1. **Build**：`pnpm --filter web build` 通过。  
2. **本页卡轨**：`/desk?book=immunology-3rd&page=<有卡引用的页>` 可见相关卡；点卡进 `/desk/card/…`。  
3. **空页诚实**：无引用页显示空态，不编造。  
4. **URL 同步**：翻页后地址栏 `page=` 变，阅读不整页闪断。  
5. **本页核**：`/review?page=<N>` 队列仅该页待核（或诚实空）；有入口从章页到达。  
6. **文案**：无 FSRS Due；无假全核；无 seed 写入。  
7. **Task 07–14 未毁**；审美朱红-only；**未擅自 push**。  
8. **体量**：多文件协调；不是单加一个 Link。

---

## 建议实现顺序（多步 · 对照自测）

1. 读 `frontend-aesthetics.md` + ChapterPageReader / DocumentPane / heye collectCiteQueue / review page / T14 EntityCardDetail（对照勿重叠重做枢纽）。  
2. 实现 `cardsCitingPage` + `collectCiteQueue({page})`。  
3. ChapterPageReader 卡轨 + DocumentPane 传参 + URL 同步。  
4. review `?page=` + 薄入口；自测表；`pnpm --filter web build`；**勿 push**。

---

## 自测路由（Trae 交付前必须手点 / 说明结果）

| # | 路由 / 操作 | 期望 |
|---|-------------|------|
| 1 | `/desk?book=immunology-3rd&page=<有 cite 的页>` | 章页模式；本页相关卡轨非空；卡名可点 |
| 2 | 点轨内卡名 | `/desk/card/<id>` 枢纽（T14 动作条仍在） |
| 3 | 翻到下一页 | URL `page=` 更新；卡轨内容变；无整页白闪 |
| 4 | 无卡引用的页 | 诚实空态 |
| 5 | 轨「核本页」或等价 | `/review?book=…&page=…`；队列页码均为该页 |
| 6 | `/review?page=<N>` 无 book | 可工作或诚实回落——实现选合理并自测说明 |
| 7 | CiteChip（卡内有页） | 仍 `/desk?book=&page=`；进页后可见卡轨含本卡（若该卡引该页） |
| 8 | `/study?card=` / `/review?card=` | T14 未毁 |
| 9 | `/study?book=` 三档 | T13 未毁 |
| 10 | `/ingest` + 开书 | T07/T09 未毁 |
| 11 | `pnpm --filter web build` | PASS |
| 12 | `git status` | **未 push**；无 verified:true 写入 data/cards |

---

## 成功检查清单（回复时勾）

- [ ] 多文件改动（entities/heye + ChapterPageReader + DocumentPane + review…）
- [ ] 本页卡轨 + URL `?page=` 同步 + `/review?page=` 可用
- [ ] 无 FSRS；无 seed `verified:true`；无 Clew API
- [ ] T07–14 回归未毁；build PASS；未 push
- [ ] 回复含：改动文件列表、build 结果、页→卡说明、自测摘要

---

## Tip 前置

**Task 14 desk-card-hub 落 tip 之后的 Mac HEAD**（pre-T14 曾是 `1d59d96`）。

开工时执行 `git log -1 --oneline`，确认提交信息/文件含卡枢纽（`?card=`、EntityCardDetail 动作条）。若仍停在 `1d59d96` 且工作区无 T14——**停下来对齐 T14 验收/提交**，再开本刀。
