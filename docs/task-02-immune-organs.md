# Task 02 — 第三章「免疫器官与组织」实体卡（Trae / zcode）

**状态**：待执行  
**仓库**：`Nur562-svg/Ariadne`（本机 `/Users/nukeab/projects/Ariadne`；GitHub main 已含 Task 01 + 01.1）  
**主写手**：Trae Code（建议模型 `DeepSeek-V4-Pro`；备选 `Kimi-K2.8-Preview`）  
**前置**：Task 01 实体卡流水线可用；Task 01.1 悬浮搜索已过验收  
**规范**：先读 `docs/frontend-aesthetics.md`（产品面克制，勿做营销 hero）

---

## 目的

把覆盖从「概述 + 抗原」推进到 **第三章 免疫器官与组织**，复用现有 parse → extract → `/entities` 预览，充实考试向知识原子。

---

## 页面范围（硬）

在 `config/chapter.json` **追加**一章（不要删掉 ch01）：

| 字段 | 值 |
|------|-----|
| `id` | `ch03` |
| `title` | `免疫器官与组织（第三章）` |
| `physicalStart` | `35` |
| `physicalEnd` | `42` |
| `pageOffset` | `16`（与现有一致：印刷页 = 物理页 − 16） |

OCR 引擎优先沿用现有 Apple Vision 脚本；失败再用 tesseract `chi_sim+eng`。产物：

- `data/chapters/ch03.blocks.json`
- （可选）`data/chapters/ch03-pages/` 预览图
- `data/cards/ch03.entities.json`（**独立文件**，不要把 ch03 糊进 ch01 JSON）
- `data/qa/ch03-sample-10.md`（10 张抽查表，格式对齐 ch01）

UI：`loadCards` / `/entities` 合并展示 ch01+ch03（或按章 tab）；搜索继续可用。

---

## 成功标准

1. **解析**：物理页 35–42 有结构化 blocks，每段带印刷 `page`（约 19–26）与可选 bbox。
2. **实体卡**：`ch03.entities.json` ≥ **25** 张；覆盖至少：中枢（骨髓、胸腺）、外周（淋巴结、脾、MALT）、HEV / 生发中心 / 淋巴细胞再循环、DiGeorge（或胸腺发育不全）等本章考点；每张 ≥1 cite、≥1 atom。
3. **Fail-closed（硬）**：
   - 新卡所有 `cites[].verified` 必须为 **`false`**，直到 Nuradil 抽查通过；
   - 不确定页码 → `page: null` + UI `p.?`；**禁止**为过验收把 `verified` 一律打成 `true`。
4. **抽查表**：`data/qa/ch03-sample-10.md` 列出 10 张（含 id、one_liner、关键 cite quote、你标的页码），供人工对错。
5. **UI**：列表能看到新卡；kind 筛选 + 悬浮搜索仍工作；`pnpm --filter web build` 通过。
6. **审美**：不新开营销落地页；不改品牌色；卡片密度可读。
7. **不做**：FSRS、Clew 对话、全书、中药学、改 Task 01 已通过的 ch01 内容（除非修明显 schema 兼容 bug）。

---

## 建议实现顺序

1. 更新 `config/chapter.json` → 跑 `pnpm parse`（或等价）只出 ch03 blocks。  
2. 跑 `pnpm extract`（或 `scripts/extract_cards.mjs`）产出 `ch03.entities.json`。  
3. 改 `loadCards` 合并多文件。  
4. 写 `ch03-sample-10.md`。  
5. 本地 `pnpm --filter web build` + 手动搜「胸腺」「HEV」「脾」等。

---

## 验收时我会查

- 物理范围是否真是第三章（勿混进第四章「免疫分子」）
- 是否所有新 cite 仍 `verified:false`
- 抽查 10 张事实密度与 quote 是否贴 OCR
- build + 搜索仍 PASS

做完回：改动文件列表 + `pnpm --filter web build` 结果；我再验收。中药学 PDF 仍缺，到货后复用本流水线另开任务。
