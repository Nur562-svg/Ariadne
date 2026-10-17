# Ariadne

教材 → 知识原子 / 实体卡 → 可复习。当前 seed 书目：《免疫学基础与病原生物学（第3版）》（样本书，产品身份是管线 + 学习环，顾客自带材料才是目标模型）。

## 现状（shell-01 交付）

- **书库**：`/` 从 `config/books.json` 派生书目（书名/章列表不写死在 React 里）→ 进入该书卡浏览器；空库 empty-state 指向 `/ingest`。
- **Pipeline**：上传 →（本机解析）→ 实体卡 → 学习。
  - 解析：扫描件 PDF → Apple Vision OCR → `data/chapters/<ch>.blocks.json`（**仍为本机 macOS CLI**，无云 OCR / MinerU 生产线）
  - 抽取：`data/cards/<ch>.entities.json`（GLM/DeepSeek 直连；现 ch01/ch03–ch07 共 1342 个知识原子）
- **诚实 ingest**：`/ingest` 上传 PDF + pageOffset/章物理页 → `data/materials/<id>.material.json` 建档，状态机
  `uploaded → parsed → extracted → ready | failed` 全部由磁盘事实推导，**没有「假云端解析成功」**；blocks 无正文不算 parsed。
- **学习环**：`/study` 对现卡跑「prompt → 揭示答案 → 自评 认识/不熟」，进度写 localStorage 跨刷新保留；citation 徽章保持 fail-closed。
- **预览 UI**：`pnpm dev` → http://localhost:3000
  - `/` 书库；`/entities` 卡列表（章 / kind 筛选）；`/entities/[id]` 卡面；`/study` 自评环；`/ingest` 上传与状态
  - citation 徽章点击 → `/viewer/[page]` 该印刷页 OCR 原文（走 `loadAllChapterPages()`，不写死单章）
  - API：`GET /api/entities`、`GET /api/entities/[id]`（静态 JSON，mock 后端）；`POST /api/ingest`（只落盘+建档）
- **Fail-closed**：页码超章范围 → `page:null + verified:false` → UI 显示琥珀虚线 `p.?`；未抽查验证的已知页为琥珀 `p.N`，仍可跳转。

## 目录

```
config/books.json          # 书库注册表（书 → chapterIds）；UI 从这派生，不改 React
config/chapter.json        # 换章只改这里（物理页范围 + pageOffset）
scripts/parse_chapter.py   # PDF → blocks JSON（pdftoppm + Vision OCR，macOS）
scripts/extract_cards.mjs  # blocks → 实体卡（GLM/DeepSeek 直连，勿 OpenRouter）
data/raw/                  # 种子 PDF（gitignored）
data/uploads/              # 上传的 PDF（gitignored）
data/materials/            # 上传物料记录（<id>.material.json）
data/chapters/             # <ch>.blocks.json
data/cards/                # <ch>.entities.json（UI 自动聚合，新章无需改代码）
data/qa/                   # 抽查表
apps/web/                  # Next.js (App Router) + Tailwind
.venv/                     # python（ocrmac 等，gitignored）
```

## 快速开始

```bash
# 0) python 依赖（一次性）
uv venv .venv && uv pip install --python .venv/bin/python ocrmac pillow

# 1) 放 PDF（种子书）
cp <免疫学PDF> data/raw/immunology-3rd.pdf

# 2) 解析一章 → data/chapters/<id>.blocks.json
pnpm parse ch01        # = .venv/bin/python scripts/parse_chapter.py ch01

# 3) LLM 抽取实体卡（直连；现有 JSON 已生成，此步用于重跑/换章）
pnpm install           # 装 ai + @ai-sdk/openai-compatible（根）
GLM_API_KEY=... pnpm extract -- ch01
# 或 DEEPSEEK_API_KEY=... pnpm extract -- ch01

# 4) 预览 / 学习
pnpm dev               # = pnpm --filter web dev → http://localhost:3000
```

现存 chapters 有卡（ch01/ch03/ch04/ch05/ch06/ch07），“2/3”两步仅对新章需要重跑。

## 导入新书（诚实 ingest，macOS 本机 OCR）

1. `/ingest` 上传 PDF + 填 `pageOffset` 与各章 `physicalStart`/`physicalEnd` → 落盘 `data/uploads/`（gitignore），建档 `data/materials/<id>.material.json`，状态 `uploaded`。
2. **本机**（macOS）跑 `pnpm parse <ch>`：Apple Vision OCR 产出 blocks → 状态 `parsed`。
   **Ariadne 没有云端 OCR**；上传不会触发任何解析，未跑本机 OCR 不会被标记 parsed。

## 换章（如今后的《中药学》）

1. `config/chapter.json` 增加一项：`{ "id": "<ch>", "title": "...", "physicalStart": 106, "physicalEnd": 120, "pageOffset": 16 }`
   （页码定位法：翻目录拿到印刷页码 N，物理页 = N + pageOffset；免疫学书 pageOffset=16，新书需重新标定）
2. `pnpm parse <ch>` → `pnpm extract -- <ch>`
3. 章节注册进 `config/books.json`（书的 `chapterIds`）→ 状态 `ready`
4. UI/API 自动聚合 `data/cards/*.json` 与 `data/chapters/*.blocks.json`，无需改 React 代码

## 实体卡 schema（v1）

```ts
type EntityCard = {
  id: string; name_zh: string; name_en?: string; aliases?: string[];
  kind: "concept" | "structure" | "process" | "pathogen" | "cell" | "molecule" | "disease";
  one_liner: string;                                  // ≤40 字
  fields: { label: string; value: string; cite?: Cite }[];
  confusions?: { vs: string; tip: string }[];
  atoms: Atom[];                                      // 每卡 ≥1
  cites: Cite[];                                      // ≥1 条 verified 或明确 p.?
};
type Atom = { id: string; prompt: string; answer: string; difficulty: "what" | "why" | "case"; cite?: Cite };
type Cite = { page: number | null; quote?: string; verified: boolean };  // null → 未验证 p.?
```

UI 规则：朱砂仅品牌强调；绿/琥珀/红仅状态；未验证 citation 琥珀虚线。

## 技术选型

- Next.js 16（App Router）+ TypeScript + Tailwind v4（手写组件，未引 CLI）
- 解析：pdftoppm + Apple Vision（ocrmac）；MinerU 备选（有 page_idx/bbox 时优先）
- 抽取：Vercel AI SDK `ai` + `@ai-sdk/openai-compatible` 直连 GLM/DeepSeek
- 存储：JSON 文件；`apps/web/lib/entities.ts` 是唯一数据入口，换 Postgres+pgvector 只改该文件

## 不做（Task 01 明确砍掉）

全书解析、FSRS 调度、Clew 对话、登录、支付、多模型路由 UI、手标全库。
