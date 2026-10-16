# Ariadne

教材 → 知识原子 / 实体卡 → 可复习。第一仗：《免疫学基础与病原生物学（第3版）》第一、二章。

## 现状（Task 01 交付）

- **解析**：扫描件 PDF → Apple Vision OCR → `data/chapters/ch01.blocks.json`
  （书页 1–18 = 物理页 17–34，683 个带 bbox 的文本块，pageOffset=16）
- **实体卡**：`data/cards/ch01.entities.json`，**40 张**、57 个知识原子，
  每张 ≥1 条带印刷页码的 citation（机检：quote 对 OCR 原文 bigram 覆盖 ≥0.6，页码全在章内）
- **抽查**：`data/qa/ch01-sample-10.md`（Nuradil 打 ✔/✘，验收线：事实错误 ≤1/10）
- **预览 UI**：`pnpm dev` → http://localhost:3000
  - `/` 总览；`/entities` 卡片列表（按 kind 筛选）；`/entities/[id]` 卡面
  - citation 徽章点击 → `/viewer/[page]` 该印刷页 OCR 原文（跳页演示）
  - API：`GET /api/entities`、`GET /api/entities/[id]`（静态 JSON，mock 后端）
- **Fail-closed**：页码超章范围 → `page:null + verified:false` → UI 显示琥珀虚线 `p.?`；禁止伪造

## 目录

```
config/chapter.json        # 换章只改这里（物理页范围 + pageOffset）
scripts/parse_chapter.py   # PDF → blocks JSON（pdftoppm + Vision OCR）
scripts/extract_cards.mjs  # blocks → 实体卡（GLM/DeepSeek 直连，勿 OpenRouter）
data/raw/                  # PDF（gitignored）
data/chapters/             # ch01.blocks.json
data/cards/                # ch01.entities.json
data/qa/                   # 抽查表
apps/web/                  # Next.js (App Router) + Tailwind 预览页
.venv/                     # python（ocrmac 等，gitignored）
```

## 快速开始

```bash
# 0) python 依赖（一次性）
uv venv .venv && uv pip install --python .venv/bin/python ocrmac pillow

# 1) 放 PDF
cp <免疫学PDF> data/raw/immunology-3rd.pdf

# 2) 解析一章 → data/chapters/<id>.blocks.json
pnpm parse ch01        # = .venv/bin/python scripts/parse_chapter.py ch01

# 3) LLM 抽取实体卡（直连；本次交付的 JSON 已生成，此步用于重跑/换章）
pnpm install           # 装 ai + @ai-sdk/openai-compatible（根）
GLM_API_KEY=... pnpm extract -- ch01
# 或 DEEPSEEK_API_KEY=... pnpm extract -- ch01

# 4) 预览
pnpm dev               # = pnpm --filter web dev → http://localhost:3000
```

## 换章（如第三章 免疫器官，或今后的《中药学》）

1. `config/chapter.json` 增加一项：`{ "id": "ch03", "title": "...", "physicalStart": 34, "physicalEnd": 52, "pageOffset": 16 }`
   （页码定位法：翻目录拿到印刷页码 N，物理页 = N + pageOffset；本书 pageOffset=16，新书需重新标定）
2. `pnpm parse ch03` → `pnpm extract -- ch03`
3. UI/API 自动聚合 `data/cards/*.json`，无需改代码
4. 中药学到货后复制本流程，只换书与 kind 枚举（task-01 约定）

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

- Next.js 15（App Router）+ TypeScript + Tailwind v4（shadcn 风格手写组件，未引 CLI）
- 解析：pdftoppm + Apple Vision（ocrmac）；MinerU 备选（有 page_idx/bbox 时优先）
- 抽取：Vercel AI SDK `ai` + `@ai-sdk/openai-compatible` 直连 GLM/DeepSeek
- 存储：JSON 文件；`apps/web/lib/entities.ts` 是唯一数据入口，换 Postgres+pgvector 只改该文件

## 不做（Task 01 明确砍掉）

全书解析、FSRS 调度、Clew 对话、登录、支付、多模型路由 UI、手标全库。
