# Task 07 / shell-01 — Library + honest ingest + `/study` self-grade（Trae / zcode）

**状态**：brief 已定 · 待 Trae 执行（Nuradil「按这个写」已批准）  
**仓库**：`Nur562-svg/Ariadne`（本机 `/Users/nukeab/projects/Ariadne`；box 对照 `/workspace/Ariadne-push`）  
**主写手**：Trae Code（建议模型 `DeepSeek-V4-Pro`；备选 zcode）  
**前置**：Task 06（ch07）数据已在 `origin/main`（`325282f`）；CiteChip / `loadAllChapterPages` 已在 main（**勿回退**）  
**规范**：先读 `docs/frontend-aesthetics.md`（精炼书桌 · 朱红唯一品牌强调色 · 产品面勿做营销 hero / nur-landing）

> **开工前（硬）**：Mac 工作树若仍 behind `origin/main`，先 **`git pull`** 再开写。origin 已有 `325282f feat(ch07): Task 06 免疫病理…`。本任务 **不** 要求 Trae push；验收通过后由 Grok Bot / Nuradil 决定推仓。

---

## 目的

把产品从「免疫学 demo 预览站」推进到可交付的 **客户材料脊柱**：

**上传 →（解析）→ 实体卡 → 学习**

闭合这条链，**不** 引入 Clew、完整 FSRS、更多教材章节或营销落地页。免疫学书仍是 **seed / 验收样本**，不是产品身份；顾客自带材料才是目标模型。做成书桌产品，不是演示清单。

---

## IN 范围（硬）

### 1. Config-driven de-demo chrome

- `/`、`layout` metadata、`/entities` 等产品面文案 **不得** 再硬编码《免疫学…》第一篇 · 第一、二章 一类营销/章节 copy。
- 标题 / 书名 / 章列表从 `config/chapter.json` 派生；若一书多章结构更清晰，可薄加 `config/books.json`（seed 指向现有 immunology PDF + chapters）。
- 免疫学数据留在 `data/` 作 seed，**不** 写死进 React 字符串。
- 遵循 `docs/frontend-aesthetics.md`：精炼书桌；朱红 only；无第二强调色；无营销 bento / hero。

### 2. Minimal library surface

- 路由建议：`/` 改造成 library，或新增 `/library`（二选一，保持单一入口清晰）。
- 从 config 列出已注册书（至少 seed 一本）→ 进入该书卡浏览器（`/entities`，可选按章过滤）。
- 空库 empty-state：指向 ingest，**不是** 落地页 hero。
- 改完后 seed 免疫学仍端到端可用（列表、详情、CiteChip、viewer）。

### 3. Honest ingest entry（upload → parse → cards）

- UI：上传 PDF（落盘 `data/raw/` 或 `data/uploads/`，**gitignore**）+ CLI 已需字段：`title`、`pageOffset`、章 `physicalStart` / `physicalEnd`（与 `config/chapter.json` 对齐）。
- 持久化 **job / material 记录**（JSON 即可），状态机：

  `uploaded` → `parsed` → `extracted` → `ready` | `failed`

- **本 slice 的 parse/extract 执行**：接到现有 `pnpm parse` / `pnpm extract`（`scripts/parse_chapter.py` = Mac Apple Vision OCR；`scripts/extract_cards.mjs` = LLM → cards）。UI / README 必须写明：**OCR 解析仍是 Mac 本地**；可选「本机 OCR 可用时再跑」钩子。
- **禁止** 假装云端 OCR / MinerU 成功；**禁止** 无 blocks 却标 `parsed` / `ready`。
- extract 产出 `data/cards/<id>.entities.json` 后，现有 `loadCards` / `/entities` / CiteChip / viewer **无需** 再改 React 硬编码章 id 即可捡起。

### 4. `/study` atom know / don't-know（现有卡）

- 新路由 `/study`（名可微调，但 brief / 验收按此称呼）：对已加载卡的 atoms 开 session（有 library 时可按书/章过滤）。
- 流程：展示 `prompt` → 揭示 `answer` → 自评 **认识 / 不熟**（`localStorage` 或薄 `data/progress/*.json` 均可；跨刷新保留更优）。
- 有 cite 时保留 CiteChip；链回 `/entities/[id]` 与 `/viewer/[page]`。
- 用现有 seed atoms（约 1300+）做真循环——**不是** stub。

### 5. 回归护栏（验收必复测）

- **勿改** CiteChip 语义：已知 `page` → `p.N`（`verified:false` 仍琥珀可点）；`page:null` → `p.?`。**不要** 改回 `verified && page` 才显示页码。
- **勿** 把 `loadAllChapterPages()` 换回单章硬编码。
- **勿** 给新卡或旧卡玩 `verified: true` 过关。
- **勿** 引入 nur-landing 模式（营销 hero、双强调色、bento 仪表盘）。

---

## OUT of scope（显式推迟 · 硬）

| 不做 | 原因 |
|------|------|
| Clew 对话 UI / 人格 / tier / harness | 另有 harness 计划；本任务只要 atom 自评环 |
| 完整 FSRS / `/review` 调度 / DueCard | Desk IA 后期；shell-01 自评分够 |
| Desk 三栏壳（sidebar / document / Clew） | 过大，一 Trae 装不下 |
| 营销 / landing / nur-landing 移植 | 产品模型 + aesthetics 禁止 |
| ch08+ / 更多免疫学章 / 中药学抽取 | seed 够用；产品 = 管线 + 学习环 |
| 云 OCR / MinerU 生产管线 | 仓内无；暂仍 Mac Vision CLI |
| Auth / 支付 / 配额 / proposal cards | 后期 |
| 翻历史 `verified`、改写 ch01–ch07 事实 | 内容冻结；只加 ingest 管线与壳 |

---

## 成功标准

1. **Build**：`pnpm --filter web build` 通过。
2. **De-demo**：`/` 与 layout metadata **不再** 硬编码免疫学章节营销 copy；文案来自 config / book 记录；seed 书仍列出且可用。
3. **Library**：至少一条 seed 书目可进入 `/entities`（可选过滤）；空库 empty-state 指向 ingest，无营销 hero。
4. **Ingest 诚实**：可上传 PDF + 填 pageOffset / 章范围；material 记录持久化；状态可见；UI 或 README 写明 OCR = Mac / `pnpm parse`，直至有云 OCR——**无静默假 parse**。状态机区分 `uploaded` vs `parsed` vs `extracted` vs `ready`/`failed`。
5. **Cards 拾取**：seed 路径或对 seed 章重跑 extract 后，卡经现有 loader 出现；**新章文件不要求改 React 硬编码**。
6. **Study 环**：`/study` 能对 seed 卡跑 ≥ **20** atoms；prompt → answer → 自评；session 内（最好跨刷新）进度保留；CiteChip 仍 fail-closed。
7. **审美**：朱红唯一品牌强调色；无第二强调色；无营销 bento；符合 `docs/frontend-aesthetics.md`。
8. **非回归**：CiteChip 行为不变；viewer 仍用 `loadAllChapterPages`；无批量 `verified:true`；非 ch01 cite（如 ch07 p.78+）仍可点进正确页。
9. **明确不做**：无 Clew thread、无 FSRS scheduler、无新教材章节内容、无未经 Nuradil 的 push。

---

## 建议实现顺序

1. **Config-driven home / library** — 去掉硬编码；seed 书可进 `/entities`。  
2. **`/study` atom 环** — 直接基于当前 `loadCards()`（最快证明「可学」）。  
3. **Upload + material JSON + 状态 UI** — 文档接到 `pnpm parse` / `pnpm extract`；状态机诚实。  
4. **可选**：library >1 书时给 `/entities` 加 book 过滤。  
5. 对照成功标准自检；**不要 push**；等 Grok Bot 验收。

---

## 验收时我会查（Grok Bot accept）

- `/` / layout 是否仍残留「第一篇 · 第一、二章」类硬编码；是否从 config 派生
- Library 能否进 seed → `/entities`；empty-state 是否指向 ingest 而非 hero
- 上传后 material 状态是否诚实（上传了但未 OCR ≠ `parsed`/`ready`）
- README / UI 是否写明 Mac OCR 限制；有无假云成功
- `/study`：≥20 atoms、认识/不熟、进度、CiteChip + 回链详情/viewer
- `pnpm --filter web build` PASS
- CiteChip 仍「有 page 显示 p.N」；`loadAllChapterPages` 未回退；抽查非 ch01 cite（如 ch07）
- 无 `verified:true` 游戏；无 Clew / FSRS / 新章内容 / nur-landing 模式
- 改动文件列表清晰；**未擅自 push**

做完回：改动文件列表 + `pnpm --filter web build` 结果 + 本地截图或路由清单（`/`、ingest、`/study`）；我再验收。

---

## 关键路径（对照）

| 用途 | 路径 |
|------|------|
| 本机仓库 | `/Users/nukeab/projects/Ariadne` |
| box 对照 | `/workspace/Ariadne-push` |
| 章 / PDF 配置 | `config/chapter.json`（可选 `config/books.json`） |
| Parse | `scripts/parse_chapter.py` · `pnpm parse`（**Mac OCR**） |
| Extract | `scripts/extract_cards.mjs` · `pnpm extract` |
| 卡 / blocks | `data/cards/*.entities.json` · `data/chapters/*.blocks.json` |
| 上传落盘 | `data/raw/` 或 `data/uploads/`（gitignore） |
| 加载器 | `apps/web/lib/entities.ts`（Postgres 前唯一入口） |
| 审美 | `docs/frontend-aesthetics.md` |
| 范围依据 | `/workspace/reports/ariadne-shell-scope-2026-10-17.md` |

---

## Trae 一句话

> shell-01：config 去 demo + library + 诚实 PDF ingest（状态机；parse 仍 CLI/Mac OCR，禁假云成功）+ `/study` atom 认识/不熟；勿动 CiteChip/`loadAllChapterPages`、勿 `verified:true`、勿 Clew/FSRS/新章/nur-landing；Mac 先 `git pull`（origin `325282f`）；DeepSeek-V4-Pro；先读 `frontend-aesthetics.md`；**勿 push**。
