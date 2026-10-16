# Task 03 — 第四章「免疫分子」实体卡（Trae / zcode）

**状态**：待执行  
**仓库**：`Nur562-svg/Ariadne`（本机 `/Users/nukeab/projects/Ariadne`；GitHub main 已含 Task 01 + 01.1 + Task 02 brief + kind-back UX）  
**主写手**：Trae Code（建议模型 `DeepSeek-V4-Pro`；备选 `Kimi-K2.8-Preview`）  
**前置**：Task 01 实体卡流水线可用；Task 01.1 悬浮搜索已过验收；Task 02（ch03）本地 CONDITIONAL PASS 即可，**不必等 ch03 推仓**  
**规范**：先读 `docs/frontend-aesthetics.md`（产品面克制，勿做营销 hero）

---

## 目的

把覆盖从「免疫器官与组织」推进到 **第四章 免疫分子**，复用现有 parse → extract → `/entities` 预览，充实考试向知识原子（抗体 / 补体 / MHC·HLA / 细胞因子 / CD / 黏附分子）。

---

## 页面范围（硬 · 已 OCR 核实）

在 `config/chapter.json` **追加**一章（不要删掉 ch01 / ch03）：

| 字段 | 值 |
|------|-----|
| `id` | `ch04` |
| `title` | `免疫分子（第四章）` |
| `physicalStart` | `40` |
| `physicalEnd` | `63` |
| `pageOffset` | `16`（与现有一致：印刷页 = 物理页 − 16 → 约 **24–47**） |

**边界依据（扫描 PDF + tesseract `chi_sim+eng`，勿猜）**：

- 物理 **39** = 第三章学习小结末页（印刷 23）
- 物理 **40** = 第四章标题页「免疫分子」+ 学习目标 + 第一节「抗体」起笔
- 物理 **63** = 第四章「学习小结」+「复习思考题」（页脚印刷 **47**）
- 物理 **64** = 第五章「免疫细胞」标题页起 —— **勿混入 ch04**

OCR 引擎优先沿用现有 Apple Vision 脚本；失败再用 tesseract `chi_sim+eng`。产物：

- `data/chapters/ch04.blocks.json`
- （可选）`data/chapters/ch04-pages/` 预览图
- `data/cards/ch04.entities.json`（**独立文件**，不要把 ch04 糊进 ch01/ch03 JSON）
- `data/qa/ch04-sample-10.md`（10 张抽查表，格式对齐 ch01 / ch03）

UI：`loadCards` / `/entities` 合并展示已有章 + ch04（或按章 tab）；搜索与 kind 筛选继续可用。**不要**为本章硬编码实体名 / 页码 / 假 cite。

---

## 成功标准

1. **解析**：物理页 40–63 有结构化 blocks，每段带印刷 `page`（约 24–47）与可选 bbox。
2. **实体卡**：`ch04.entities.json` ≥ **40** 张；覆盖至少：抗体结构与五类 Ig、补体三条途径与 MAC、MHC/HLA（I/II 类与临床关联）、细胞因子大类（IL / CSF / IFN / TNF / 趋化因子等考点）、CD 分子与黏附分子家族；每张 ≥1 cite、≥1 atom。`kind` 以 `molecule` / `concept` / `process` 为主，勿把第五章「免疫细胞」塞进来。
3. **Fail-closed（硬）**：
   - 新卡所有 `cites[].verified` 必须为 **`false`**，直到 Nuradil 抽查通过；
   - 不确定页码 → `page: null` + UI `p.?`；**禁止**为过验收把 `verified` 一律打成 `true`。
4. **抽查表**：`data/qa/ch04-sample-10.md` 列出 10 张（含 id、one_liner、关键 cite quote、你标的页码），供人工对错。
5. **UI**：列表能看到新卡；kind 筛选 + 悬浮搜索仍工作；`pnpm --filter web build` 通过。
6. **审美**：不新开营销落地页；不改品牌色；卡片密度可读（见 `docs/frontend-aesthetics.md`）。
7. **不做**：FSRS、Clew 对话、全书、中药学、改 Task 01 已通过的 ch01 内容、**不要推送未验收的 ch03 本地卡数据**（除非 Nuradil 另开任务）；除非修明显 schema 兼容 bug。

---

## 建议实现顺序

1. 更新 `config/chapter.json` → 跑 `pnpm parse`（或等价）只出 ch04 blocks。  
2. 跑 `pnpm extract`（或 `scripts/extract_cards.mjs`）产出 `ch04.entities.json`。  
3. 确认 `loadCards` 已聚合 `data/cards/*.json`（多文件合并；勿写死章节列表）。  
4. 写 `ch04-sample-10.md`。  
5. 本地 `pnpm --filter web build` + 手动搜「IgM」「补体」「HLA-B27」「IL-2」「黏附分子」等。

---

## 验收时我会查

- 物理范围是否真是第四章（勿混进第三章末或第五章「免疫细胞」）
- 是否所有新 cite 仍 `verified:false`
- 抽查 10 张事实密度与 quote 是否贴 OCR
- build + 搜索仍 PASS
- 无硬编码章节 / 实体名单的「演示味」

做完回：改动文件列表 + `pnpm --filter web build` 结果；我再验收。中药学 PDF 仍缺，到货后复用本流水线另开任务。
