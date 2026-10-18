# Task 16 / desk-heye-batch-filter-01 — 核页工具加厚：章芯片 + 本机三档（待核｜已对｜存疑）+ 同页批量「本机已对」（Trae）

**状态**：brief 已定 · 待 Trae 执行（假定 T15 desk-page-card-loop 已 PASS @ tip `83244bd`；Grok Bot 调度 · 本文件不启动 Trae）  
**仓库**：`Nur562-svg/Ariadne`（本机 `/Users/nukeab/projects/Ariadne`；box 对照 `/workspace/Ariadne-push`）  
**主写手**：Trae Code（建议模型 **`DeepSeek-V4-Pro`**；备选 zcode）  
**前置**：Task 15 desk-page-card-loop-01 已落 tip（本页卡轨、`cardsCitingPage`、翻页 `?page=`、`/review?page=`）。**保留** shell-01 + Task 08–15——本任务把 **核页环** 加厚到与学习环同级的可过滤工作台；仍不接 FSRS / Clew LLM。  
**规范**：先读 `docs/frontend-aesthetics.md`（精炼书桌 · 朱红唯一品牌强调色 · 产品面勿做营销 hero / nur-landing）  
**视觉 / IA**：desk-ia「可核页」——本 slice 做 **章过滤 + 本机态三档 + 同页批量标**，**禁止** 假核页 pill、**禁止** 改 seed `verified:true`

> **开工前（硬）**：Mac `git log -1 --oneline` 确认 tip **已含 Task 15**（`83244bd` 或其后：`feat(desk): Task 15 desk-page-card-loop`）。pre-T15 tip 曾是 `95b1f2b`（仅 T14）——**不要**在仅含 T14 的 tip 上开工。本任务 **不** 要求 Trae push；验收通过后由 Grok Bot / Nuradil 决定推仓。  
> **体量（硬）**：本 slice 刻意大于 Task 08–10 的「一刀铬件」，也大于「只加两个 chip」。目标 **约 30–90 分钟真实编码**（`chapterId` 收集、抽出 `heye-store`、review 章芯片+档位、HeYeSession 滤队+同页批量、qs 多参共存、多路由自测）。若 2 分钟内只加 chip——**范围不够，继续做完 IN 清单**。

---

## 为何这一刀要更大（对照 Task 08–15）

| 已交付 | 剩余断点 |
|--------|----------|
| T12 `/review` 核页本机对页 | 队列只能从头扫；无章过滤；无按本机态扫 |
| T13 `/study` 章芯片 + 三档自评 | **学习环已可过滤；核页环落后** |
| T14 `?card=` 卡枢纽 | 卡范围核页有了，章范围没有 |
| T15 `?page=` + 本页卡轨 | 页范围有了；同页多条 cite 仍一条条点 |

DeepSeek-V4-Pro 在小刀 brief 上常 ~2 分钟收工。本轮把 **章芯片 + 本机三档 + 同页批量** 收进 **同一 brief**。

产品脊梁仍是：**顾客自带材料 → 可考知识原子**（免疫学 seed 是验收语料，不是产品身份）。核页让原子 **可被信任**；工具不好用，信任环就空转。

---

## 目的（一句话）

**把 `/review` 加厚成可过滤的核页工作台**：章芯片（`?chapter=`）；本机态三档待核｜已对｜存疑（`?mode=`，localStorage）；当前印刷页其余待核一键批量「本机已对」。不做 FSRS、不做 Clew LLM、不做假全核。

---

## 产品对照（本 slice）

```
核页工作台（本轮）
├─ /review?book=&chapter=&mode=&page=&card=
│  ├─ 章芯片（对齐 study；单卡范围可隐）
│  ├─ 三档 tab：待核｜已对｜存疑（本机态，非 Due）
│  └─ HeYeSession
│     ├─ 客户端按档滤队（服务端仍出全池）
│     └─ 「本页其余待核一并本机已对」批量
└─ 保留
   └─ 对页 OCR · ?card= · ?page= · 本页卡轨 · 卡枢纽（T12–15）
```

---

## IN 范围（硬 · 一 Trae 会话 · 必须全部做完）

### A. 数据层 + 本机态模块（核心）

#### A1. collectCiteQueue + chapterId（硬）

- `opts?: { bookId?: string; cardId?: string; page?: number; chapterId?: string }`
- 有 `chapterId`：只收集 `card.chapterId === chapterId` 的待核项（在卡集合阶段过滤，或收集后过滤——选一并注释）
- 与既有组合：
  - `cardId` 优先规则保持 T14（卡命中则按卡；兼 book 时一致性约束）
  - `page` 仍为收集后按 `item.page` 过滤（T15）
  - `chapterId` + `page`：交集；`chapterId` + `bookId`：章须属于该书（不属于 → 空或诚实警告）
- **禁止** 改 seed；`page != null && verified === false` 语义不变

#### A2. `lib/heye-store.ts`（硬 · 新建）

- **为何新建**：现 `lib/heye.ts` import `entities`（fs）；不可把 window API 与服务器 collect 糊在同一模块再被客户端 import 运行时。对齐 `lib/study.ts` 的客户端安全模式。
- 导出至少：
  - `HEYE_STORE_KEY = "ariadne.heye.v1"`（**必须与现 HeYeSession 一致**，勿丢用户已有本机记录）
  - `type HeYeMark = { s: "checked" | "doubt"; t: number }`
  - `type HeYeStore = Record<string, HeYeMark>`
  - `type HeYeMode = "open" | "checked" | "doubt"`（待核｜已对｜存疑）
  - `loadHeYeStore()` / `setHeYeMark(key, s)` 或批量 `setHeYeMarks(keys, s)`
  - `filterItemsByMode(items, store, mode)`：
    - `open`：无记录
    - `checked`：`s === "checked"`
    - `doubt`：`s === "doubt"`
  - `countPoolMarks(items, store)`：`{ open, checked, doubt }`
- HeYeSession **改为**从本模块读写；删除组件内重复的 STORAGE_KEY / loadStore 实现（或薄封装转调）

---

### B. `/review` 章芯片 + 档位 tab（核心）

#### B1. searchParams（硬）

- 读 `chapter`、`mode`（及既有 `book`/`card`/`page`）
- `mode` 非法或不识别 → 回落 `"open"`；可选琥珀警告一行
- `collectCiteQueue({ bookId, cardId, page, chapterId })` 出**全池**（未按本机态滤）

#### B2. 章芯片（硬 · 对齐 study）

- `loadChapters()`；有 `?book=` 时只显示该书 `chapterIds`
- 「全部章节」→ 清 `chapter`；点某章 → `?chapter=<id>`
- **单卡范围**（有效 `?card=`）：隐藏章芯片或诚实固定章文案——实现选一并自测说明
- 切换章时 **保留** `book`/`mode`/`card`/`page` 的合理组合（有冲突时：例如 chapter 与 card 互斥——优先 card 隐藏章芯片即可）

#### B3. 三档 tab（硬）

- UI：`待核`｜`已对`｜`存疑`（朱红 active pill，对齐 study 呼吸感 gap）
- URL：`?mode=open|checked|doubt`（默认 open；可省略 param 当 open）
- `qs()` helper：切换 mode/chapter 时保留其它范围参数
- 页头范围文案：含章标题（有 chapter 时）；待核池条数可仍显示服务端全池数 + 客户端档内数（见 C / 可选 ScopeCounts）

#### B4. 可选但鼓励：`HeYeScopeCounts`

- 对齐 `StudyScopeCounts`：挂载后读 store，展示本范围 open/checked/doubt
- 非必须到单独文件，但页头要有可用的本机态数字（会话进度行已有则可复用说明）

---

### C. HeYeSession：档位滤队 + 同页批量（核心）

#### C1. 按档滤队（硬）

- props 增加 `mode: HeYeMode`（页传入）
- 挂载读 store → `visible = filterItemsByMode(items, store, mode)`；对本轮 `visible` 做 index/对页
- **换 mode / 换范围**：父级用 `key` 重挂载或 effect 重置 index（对齐 StudySession——避免脏 index）
- 空可见队列：诚实文案
  - open 空：「这个范围没有待核（本机未标）的 cite」+ 链切已对/存疑或回书桌
  - checked/doubt 空：「还没有本机已对/存疑记录」+ 链回待核
- 进度行数字：对**当前可见队列**或对**全池**——选一并在 UI 标明「本档」vs「本范围累计」；建议进度行用本档，页头 ScopeCounts 用全池

#### C2. 同页批量「本机已对」（硬）

- 当 `mode === "open"`（或当前可见为待核）且存在 **同 `cur.page`**、且 store 无记录的其他 `items`（建议看全池同页未标，不只看 visible——批量目标是清同页待核）：
  - 显示次按钮：「本页其余 N 条一并本机已对」（N≥1 才显示；N=0 隐藏）
  - 点击：对这 N 条（+可选当前条若未标）写 `checked`；然后跳到下一条仍 open 的项
- 文案硬要求：标明 **只写本浏览器**；**不等于** seed verified；**禁止**「本页已全核」营销态
- `mode === "checked"|"doubt"` 时可隐藏批量按钮（或仅在 open 档提供——推荐仅 open）

#### C3. 保留既有（硬）

- 左右对页、单条已对/存疑/跳过、上/下条、全部对过横幅、清除本机记录、回本卡 / 回书桌本页 / 学习链、OCR 缺失琥珀诚实态

---

### D. 护栏与视觉（硬）

#### D1. 回归护栏

- **保留** Task 07–15 全表面（含卡枢纽、本页卡轨、翻页 URL、`?page=` 核本页、study 三档、CiteChip desk 深链、Clew stub、ingest）
- **勿** `verified: true` 写入 seed
- **勿** 真 FSRS / Clew LLM / ProposalCard 真写入 / 新章 / nur-landing / 擅自 push / 窄屏大重构 / OCR 句级高亮 / Study↔heye 合并假仪表盘

#### D2. Visual polish（薄 · 必做 · 不缩 A–C）

- 章芯片 / 档位 tab：对齐 study 的圆角 chip + 段控件呼吸感；朱红唯一强调
- 批量按钮：次级（边框/文字链），勿与「本机已对」主按钮抢成两个大红块并排失控——主路径仍是单条对页；批量是加速器
- 琥珀仅存疑/警告；已对可用 status-ok，不作第二品牌色

---

## OUT of scope（显式推迟 · 硬）

| 不做 | 原因 |
|------|------|
| ts-fsrs / DueCard 真调度 | OUT forever |
| Clew LLM / ProposalCard 真写入 | stub 已够 |
| 改 seed JSON `verified:true` | 作弊禁 |
| 假本章/本页全核营销态 | 禁 |
| Study↔heye 共享掌握仪表盘 | 易假；推迟 |
| OCR 句级高亮 / CitationPeek | 过大 |
| Clew「本轮变更」空壳大做 | 记 T17+ |
| 窄屏 DeskShell collapse 大重构 | 铬件 |
| ingest 迁入 DeskShell / 管线大改 | T07 已诚实 |
| 新章 ch08+ / nur-landing | 禁 |
| 擅自 push | 验收后再定 |

---

## 成功标准

1. **Build**：`pnpm --filter web build` 通过。  
2. **章芯片**：`/review?book=immunology-3rd` 可见章芯片；切章后队列/范围变；URL 含 `chapter=`。  
3. **三档**：待核｜已对｜存疑可切；本机态过滤正确；空档诚实。  
4. **同页批量**：待核档下，同页多条未标时批量按钮可用；一次写入多 key；仅 localStorage。  
5. **兼容**：`?card=` / `?page=` / 无参全库仍工作；T15 本页卡轨「核本页」进入后仍可切档。  
6. **文案**：无 FSRS Due；无假全核；无 seed 写入；key 仍 `ariadne.heye.v1`。  
7. **Task 07–15 未毁**；审美朱红-only；**未擅自 push**。  
8. **体量**：多文件协调；不是只加两个 chip。

---

## 建议实现顺序（多步 · 对照自测）

1. 读 `frontend-aesthetics.md` + `heye.ts` / `HeYeSession` / `review/page.tsx` / `study/page.tsx`（章芯片+三档对照）/ `lib/study.ts`。  
2. `collectCiteQueue`+`chapterId`；新建 `heye-store.ts`；HeYeSession 改用 store 模块。  
3. review 页章芯片 + mode tab + qs；HeYeSession 滤队。  
4. 同页批量；自测表；`pnpm --filter web build`；**勿 push**。

---

## 自测路由（Trae 交付前必须手点 / 说明结果）

| # | 路由 / 操作 | 期望 |
|---|-------------|------|
| 1 | `/review?book=immunology-3rd` | 章芯片可见；默认待核档；对页会话可用 |
| 2 | 点某章芯片 | URL `chapter=`；队列仅该章；mode 保留 |
| 3 | 标几条「本机已对」后切「已对」 | 可见刚标的项；待核档减少 |
| 4 | 切「存疑」空/有 | 诚实空态或仅存疑项 |
| 5 | 同页 ≥2 条待核时点批量 | N 条变已对；跳下一条；localStorage 多 key |
| 6 | `/review?card=<id>` | 卡范围仍工作；章芯片隐藏或固定 |
| 7 | `/review?book=…&page=<N>` | 页范围仍工作；可切 mode |
| 8 | `/desk?book=…&page=` → 核本页 | T15 入口未毁；进 review 后新 UI 可用 |
| 9 | `/study?book=` 三档 / 章芯片 | T13 未毁 |
| 10 | `/desk/card/<id>` 练/核 | T14 未毁 |
| 11 | `pnpm --filter web build` | PASS |
| 12 | `git status` | **未 push**；无 verified:true 写入 data/cards；heye key 仍 v1 |

---

## 成功检查清单（回复时勾）

- [ ] 多文件改动（heye + heye-store + review + HeYeSession…）
- [ ] 章芯片 + 三档 + 同页批量可用
- [ ] 无 FSRS；无 seed `verified:true`；无 Clew API；本机 key 未破
- [ ] T07–15 回归未毁；build PASS；未 push
- [ ] 回复含：改动文件列表、build 结果、章/档/批量说明、自测摘要

---

## Tip 前置

**Task 15 desk-page-card-loop 落 tip 之后的 Mac HEAD**（当前已知 **`83244bd`**）。

开工时执行 `git log -1 --oneline`，确认提交信息/文件含 T15（本页卡轨、`cardsCitingPage`、`?page=`）。若仍停在 `95b1f2b`（仅 T14）——**停下来对齐 T15 验收/提交**，再开本刀。
