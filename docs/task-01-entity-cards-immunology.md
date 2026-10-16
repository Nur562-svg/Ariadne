# Task 01 — 《免疫学基础与病原生物学》第3版 · 实体卡流水线（可丢给 zcode / Trae / Grok Build）

**状态**：待执行  
**仓库**：`Nur562-svg/Ariadne`（空仓起步；无 commit 权限外的推送请先问 Nuradil）  
**输入 PDF**：`免疫学基础与病原生物学 第3版`（约 91MB；微信路径或桌面副本）  
**目标**：跑通「一章 → 知识原子/实体卡 → 可复习」的最小闭环，不追求全书。

---

## 为什么从这本书开始

- 产品第一仗原定：《中药学》+《免疫学基础与病原生物学》实体卡。
- 目前没有中药学 PDF；本书已到位，且实体密度高（抗原/抗体/补体/病原体分类等），适合验证 entity card schema。
- 中药学到货后再复用同一流水线，不重写架构。

---

## 成功标准（验收数字）

1. **解析**：选定一章（建议「免疫学基础」前 1–2 章），PDF → 结构化文本，每段带 `page`（页码）与可选 `bbox`。扫描件则走 OCR（优先 MinerU）；纯文本层可先 `pdftotext`/`pdf.js` 兜底。
2. **实体卡**：产出 ≥30 张实体卡（JSON），字段见下；人工抽查 10 张，**事实错误 ≤1**；每张至少 1 条带页码 citation。
3. **原子**：每张卡拆出 ≥1 个 knowledge atom（可测单元：定义 / 对比 / 机制一步）；atom 有稳定 `id`。
4. **Fail-closed**：无页码或模型不确定时，citation 标 `p.?`（未验证），不得伪造页码。
5. **UI 可挂**：提供一份 mock API 或静态 JSON，desk 能按「实体名 → 卡面 → citation 跳页」演示（可先不接真后端）。
6. **不写诊断、不开处方**；教材范围内的机制/定义即可。

---

## 实体卡 schema（v1）

```ts
type EntityCard = {
  id: string;                 // slug, e.g. "mhc-class-ii"
  name_zh: string;
  name_en?: string;
  aliases?: string[];
  kind: "concept" | "structure" | "process" | "pathogen" | "cell" | "molecule" | "disease";
  one_liner: string;          // ≤40 字
  fields: { label: string; value: string; cite?: Cite }[];
  confusions?: { vs: string; tip: string }[];  // 易混点
  atoms: Atom[];
  cites: Cite[];              // 至少 1 条 verified 或明确 p.?
};

type Atom = {
  id: string;
  prompt: string;             // 可测问法
  answer: string;
  difficulty: "what" | "why" | "case";
  cite?: Cite;
};

type Cite = {
  page: number | null;        // null → 未验证
  quote?: string;             // ≤30 字原文片段
  verified: boolean;          // false → UI 用虚线下划线 p.?
};
```

颜色/质感遵循已定 desk 规则：朱砂仅品牌强调；绿琥珀红仅状态；未验证 citation 琥珀虚线。

---

## 实现范围（本任务内）

**做**
- `packages/` 或 `apps/web` 下：ingest 脚本（一章）→ cards JSON → 简单 `/api/entities/[id]` 或静态 route
- 一页「实体卡预览」UI（可复用 shadcn + Tailwind；不必完整 desk）
- README：如何换章、如何重跑

**不做（明确砍掉）**
- 全书解析、FSRS 调度、Clew 对话、登录、支付、多模型路由 UI
- 手标全库；只需交付抽查清单（10 张）供 Nuradil 对/错

---

## 建议技术选型（与产品栈一致）

- Next.js (App Router) + TypeScript + Tailwind + shadcn
- 解析：MinerU（有 `page_idx`/`bbox` 优先）；否则 pdf.js + 文本层
- 抽取：DeepSeek / GLM 经 Vercel AI SDK **直连**（勿 OpenRouter）；prompt 强制 JSON schema + fail-closed
- 存储：先 JSON 文件即可；Postgres+pgvector 留接口注释

---

## 步骤（给编码工具按序做）

1. 初始化或打开 `Ariadne` 仓库；确认空仓则 scaffold Next.js app。
2. 放入 PDF（勿提交大文件到 git；`.gitignore` 加 `*.pdf` / `data/raw/`）。
3. 选章：读目录，锁定「免疫学」部分第 1 章（或页码范围写进 `config/chapter.json`）。
4. 跑解析 → `data/chapters/ch01.blocks.json`。
5. 跑抽取 → `data/cards/ch01.entities.json`（≥30）。
6. 写抽查表 `data/qa/ch01-sample-10.md`（空对错列，留给 Nuradil）。
7. 最小预览页 + 本地 `pnpm dev` 可打开。
8. 自测对照上方「成功标准」打勾；开 PR 描述里贴数字。

---

## 交给 Nuradil 的输入

- [ ] 选定主写手：zcode / Trae / Grok Build（任选其一跑本任务）
- [ ] 本 PDF 路径（已确认微信 2026-09 目录有副本；可拷到项目 `data/raw/`）
- [ ] 每周约 1h：对抽查表打对/错（不做大规模手标）

---

## 我（Grok Bot）在旁做什么

- 审 schema / PR；对照验收数字挑刺
- 必要时补 MinerU / API 探测脚本
- 中药学 PDF 到齐后复制本任务为 Task 02，只换书与 kind 枚举

