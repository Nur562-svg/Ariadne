# Task 14 / desk-card-hub-01 — 实体卡枢纽：详情 polish + cite 诚实条 + 卡→学习/核页深链（Trae）

**状态**：brief 已定 · 待 Trae 执行（T13 desk-study 已推；用户要下一 LARGE 刀；Grok Bot 调度）  
**仓库**：`Nur562-svg/Ariadne`（本机 `/Users/nukeab/projects/Ariadne`；box 对照 `/workspace/Ariadne-push`）  
**主写手**：Trae Code（建议模型 **`DeepSeek-V4-Pro`**；备选 zcode）  
**前置**：Task 13 desk-study 已在 tip **`1d59d96`**（`/study` 进 DeskShell + 三档本机自评）。**保留** shell-01 + Task 08–13——本任务把 **死胡同实体卡详情** 升级成书桌连续面上的 **卡枢纽**（能练、能核、能回章页）；仍不接 FSRS / Clew LLM。  
**规范**：先读 `docs/frontend-aesthetics.md`（精炼书桌 · 朱红唯一品牌强调色 · 产品面勿做营销 hero / nur-landing）  
**视觉 / IA**：desk-ia「实体卡」——本 slice 做 **卡→练习/核页深链 + cite 诚实汇总**，**禁止** 假 Due / FSRS，**禁止** 假「本卡已全核」全绿，**禁止** 改 seed `verified:true`

> **开工前（硬）**：Mac 工作树确认在 **`1d59d96`**（或其后含 Task 13 study 的 tip）。若 tip 尚未含 study，停下来对齐——brief 假定 T13 交付文件已在树内（`(desk)/study`、`lib/study.ts`、`StudySession` 三档、CiteChip `deskBookId`）。本任务 **不** 要求 Trae push；验收通过后由 Grok Bot / Nuradil 决定推仓。  
> **体量（硬）**：本 slice 刻意大于 Task 08–10 的「一刀铬件」，也大于「只加两个 Link」。目标 **约 30–90 分钟真实编码**（collect 扩 cardId、EntityCardDetail 动作条+cite 条、study/review 接 `?card=`、QuizPanel 过时文案、跨环保留卡、多路由自测）。若 2 分钟内只改两处文案——**范围不够，继续做完 IN 清单**。

---

## 为何这一刀要更大（对照 Task 08–13）

| 已交付 | 剩余断点 |
|--------|----------|
| T08–10 DeskShell 三栏 · 开书 · 铬件统一 | 卡详情无动作出口 |
| T11 DocumentPane 三模 + Clew stub | QuizPanel 仍写「复习页 stub」（T12 后过时） |
| T12 `/review` 核页本机对页 | 核页可按书，**不能按卡**收窄 |
| T13 `/study` DeskShell + 三档自评 | 学习可按书/章，**不能按卡**；完成态不回本卡 |
| EntityCardDetail + CiteChip desk 深链 | 有 cite chip，无卡级诚实汇总条；无「练/核」枢纽 |

DeepSeek-V4-Pro 在小刀 brief 上常 ~2 分钟收工。本轮把 **卡枢纽 UI + `?card=` 数据范围 + 书桌过时文案** 收进 **同一 brief**。

产品脊梁仍是：**顾客自带材料 → 可考知识原子**（免疫学 seed 是验收语料，不是产品身份）。卡是原子的容器；枢纽断了，练与核就接不上。

---

## 目的（一句话）

**把 `/desk/card/[id]` 做成枢纽**：诚实 cite 状态条 +「练这张卡 / 核本卡 cite」；`/study` `/review` 支持 **`?card=`** 收窄队列；书桌入口与跨环导航保留卡范围。不做 FSRS、不做 Clew LLM、不做假全核。

---

## 产品对照（本 slice）

```
卡枢纽（本轮）
├─ /desk/card/[id]
│  ├─ 动作条：练这张卡 → /study?card= · 核本卡 → /review?card=
│  ├─ cite 诚实条：有页 / p.? / seed verified:false（≠ 本机核页态）
│  └─ CiteChip → /desk?book=&page=（已有）
├─ /study?card=…（DeskShell）
│  └─ 仅本卡 atoms · 三档本机队列 · 完成态回本卡/核本卡
├─ /review?card=…（DeskShell）
│  └─ 仅本卡待核 cite · 空/完成回本卡/学习
└─ DocumentPane
   └─ QuizPanel 文案修正（不再称复习 stub）· 卡瓷砖进详情
```

---

## IN 范围（硬 · 一 Trae 会话 · 必须全部做完）

### A. `?card=` 数据层（核心）

#### A1. collectStudyAtoms（硬）

- 签名扩为 `opts?: { chapterId?: string; bookId?: string; cardId?: string }`
- 有 `cardId` 时只出该卡 atoms；与 book/chapter 组合规则写清注释（建议：cardId 命中则忽略更宽过滤器，或要求 card 属于该 book/chapter——选一并文档化）
- **禁止** 改 seed；评分语义不变

#### A2. collectCiteQueue（硬）

- `opts?: { bookId?: string; cardId?: string }`
- 有 `cardId` 时只收集该卡待核项；`page != null && verified === false` 不变
- **禁止** 回写 `verified`

---

### B. EntityCardDetail 枢纽 UI（核心）

#### B1. 动作条（硬）

- 「练这张卡」→ `/study?card=<id>`；若已知 `deskBookId` 兼带 `book=`
- 「核本卡 cite」→ `/review?card=<id>`；有书兼 `book=`
- 无 atoms：练按钮禁用或诚实说明「本卡无知识原子」
- 无待核 cite（可服务端预计算传入，或客户端链过去看空态）：核按钮可仍可点进空态，或预检后诚实文案——选合理实现

#### B2. cite 诚实条（硬）

- 汇总本卡全部 cite 来源（`card.cites` + `fields[].cite` + `atoms[].cite`，去重合理即可）
- 展示至少：有印刷页数 / `page:null`（p.?）数 / seed `verified:false` 数（或「未抽查」）
- 文案硬要求：标明 **seed 的 verified 字段 ≠ 本机核页 localStorage 态**；核页本机态不在本条伪造
- **禁止**：全绿「已核完」、写 seed、暗示 FSRS

#### B3. 保留与薄增强

- CiteChip 继续 `deskBookId`
- 可选：`confusions[].vs` 若 `loadCards` 中有 `name_zh`/`aliases` 精确或规范匹配，链 `/desk/card/[id]`；否则纯文

---

### C. `/study` + `/review` 接卡范围（核心）

#### C1. Study 页（硬）

- `searchParams` 读 `card`；`collectStudyAtoms({ cardId, bookId?, chapterId? })`
- 页头范围：卡名（找不到卡 → 诚实警告 + 回落书/全部）
- 三档队列 / `StudyScopeCounts` / CiteChip / 完成态保留
- 完成态与空队列新增/强化：「回本卡」→ `/desk/card/[id]`；「核本卡」→ `/review?card=`（有 card 时）
- `qs()` helper 保留 `card` 参数于档位/章芯片切换（有 card 时章芯片可隐藏或弱化——实现选合理）

#### C2. Review 页（硬）

- 读 `?card=`；`collectCiteQueue({ cardId, bookId? })`
- 页头含卡名；空队列链「回本卡」「去学习本卡」
- HeYeSession 传入的 study 链带 `card`（有时）

#### C3. 跨环（薄 · 硬交付）

- StudySession → 核页：有 card 时 `/review?card=`（可兼 book）
- HeYeSession → 学习：有 card 时 `/study?card=`
- 两者「回书桌」在有 book 时仍 `/desk?book=`；有 card 时优先或兼提供回本卡

---

### D. 书桌入口与过时文案（硬）

#### D1. QuizPanel（硬）

- 删除或改写「复习页保持诚实 stub / 到期复习尚未接入」里对 `/review` 的过时描述
- `/review` 已是核页本机对页（T12）；学习环已是本机自评（T13）
- 诚实 CTA：书范围学习；可选次链核页——**勿**再暗示复习页是空 FSRS stub

#### D2. 卡瓷砖（薄）

- 主点击仍 `/desk/card/[id]`
- 可选：瓷砖上极薄「练」链 → `/study?card=`（勿破坏扫视密度）

#### D3. desk/card 页

- 继续反查 book → `deskBookId`；把枢纽所需 props（bookId、可选待核计数）传给 Detail

---

### E. 保留与回归护栏（硬）

- **保留** Task 07–13 全表面
- **勿** `verified: true` 写入 seed
- **勿** 真 FSRS / Clew LLM / ProposalCard 真写入 / 新章 / nur-landing / 擅自 push / 窄屏大重构 / ingest 迁壳

---

### F. Visual polish（硬 · 薄 · 必做 · 不缩 A–D）

- 动作条：朱红主 CTA（练）+ 次链（核）；间距呼吸，勿两粒按钮贴死
- cite 诚实条：发丝边 / muted 数字，琥珀仅表未核实类状态，不作第二品牌色

---

## OUT of scope（显式推迟 · 硬）

| 不做 | 原因 |
|------|------|
| ts-fsrs / DueCard 真调度 / 4 档评分服务端 | OUT forever |
| Clew LLM / API / ProposalCard 真写入 | stub 已够 |
| 改 seed JSON `verified:true` | 作弊禁 |
| 假本卡全核 / 营销仪表盘 | 禁 |
| 窄屏 DeskShell collapse 大重构 | 铬件 |
| ingest 迁入 DeskShell / 管线大改 | T07 已诚实 |
| 新章 ch08+ / nur-landing | 禁 |
| 擅自 push | 验收后再定 |

---

## 成功标准

1. **Build**：`pnpm --filter web build` 通过。  
2. **枢纽**：`/desk/card/<seed-id>` 可见「练这张卡」「核本卡 cite」与 cite 诚实条。  
3. **卡范围**：`/study?card=<id>` 只出该卡原子；`/review?card=<id>` 只出该卡待核。  
4. **回链**：学习/核页完成或空态可回本卡。  
5. **QuizPanel**：不再声称复习页是 stub。  
6. **文案**：无 FSRS Due；无假全核；无 seed 写入。  
7. **Task 07–13 未毁**；审美朱红-only；**未擅自 push**。  
8. **体量**：多文件协调；不是两处文案。

---

## 建议实现顺序（多步 · 对照自测）

1. 读 `frontend-aesthetics.md` + `EntityCardDetail` / `collectStudyAtoms` / `collectCiteQueue` / study+review pages / DocumentPane QuizPanel。  
2. 扩 collect* + cardId。  
3. EntityCardDetail 动作条 + cite 条；desk/card 传参。  
4. study/review 接 `?card=` + 跨环 URL。  
5. QuizPanel 文案；自测表；`pnpm --filter web build`；**勿 push**。

---

## 自测路由（Trae 交付前必须手点 / 说明结果）

| # | 路由 / 操作 | 期望 |
|---|-------------|------|
| 1 | `/desk/card/<已知 id>`（如免疫学 seed 任一卡） | DeskShell 内；动作条「练」「核」；cite 诚实条有数字 |
| 2 | 点「练这张卡」 | `/study?card=…`（可兼 book）；队列仅本卡原子 |
| 3 | study 三档切换 | 仍本机态；范围保持 card |
| 4 | 完成态「回本卡」 | 回到 `/desk/card/…` |
| 5 | 点「核本卡 cite」 | `/review?card=…`；队列仅本卡或诚实空态 |
| 6 | review 空/完成 → 学习本卡 / 回本卡 | URL 带 card |
| 7 | 卡内 CiteChip（有页） | `/desk?book=&page=` OCR |
| 8 | `/desk?book=immunology-3rd` QuizPanel | 无「复习 stub」过时文案；学习 CTA 可用 |
| 9 | `/study?book=immunology-3rd` 无 card | T13 书范围行为未毁 |
| 10 | `/review?book=immunology-3rd` 无 card | T12 书范围核页未毁 |
| 11 | `/ingest` + 开书 | T07/T09 未毁 |
| 12 | `pnpm --filter web build` | PASS |
| 13 | `git status` | **未 push**；无 verified:true 写入 data/cards |

---

## 成功检查清单（回复时勾）

- [ ] 多文件改动（entities/heye + EntityCardDetail + study/review + DocumentPane…）
- [ ] 卡枢纽动作条 + cite 诚实条；`?card=` study/review 可用
- [ ] 无 FSRS；无 seed `verified:true`；无 Clew API
- [ ] QuizPanel 文案已修正；跨环可回本卡
- [ ] T07–13 回归未毁；build PASS；未 push
- [ ] 回复含：改动文件列表、build 结果、`?card=` 说明、自测摘要

---

## Tip 前置

**`1d59d96`** — `feat(web): desk-study /study 进 DeskShell + 三档本机自评（全部｜未评｜不熟再练）`

（若开工时 Mac tip 已在 `1d59d96` 之后且仍含 T13 文件，用当时 HEAD；**不要**回退到仅 `bc7bf48`。）
