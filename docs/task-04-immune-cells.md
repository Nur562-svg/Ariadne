# Task 04 — 第五章「免疫细胞」实体卡（Trae / zcode）

**状态**：brief 已定 · 待 Trae 执行  
**仓库**：`Nur562-svg/Ariadne`（本机 `/Users/nukeab/projects/Ariadne`；GitHub main 已含 ch01–ch04 卡数据）  
**主写手**：Trae Code（建议模型 `DeepSeek-V4-Pro`；备选 zcode）  
**前置**：Task 03（ch04）CONDITIONAL PASS 且数据已推仓；kind-back UX 已在 main  
**规范**：先读 `docs/frontend-aesthetics.md`（产品面克制，勿做营销 hero）

---

## 目的

把覆盖从「免疫分子」推进到 **第五章 免疫细胞**，复用现有 parse → extract → `/entities` 预览，充实考试向知识原子（固有/适应性免疫细胞、APC、T/B 表面分子与亚群、分化发育）。做成可考的产品知识层，不是演示清单。

---

## 页面范围（硬 · 已 OCR 核实 2026-10-17）

在 `config/chapter.json` **追加**一章（不要删掉 ch01 / ch03 / ch04）：

| 字段 | 值 |
|------|-----|
| `id` | `ch05` |
| `title` | `免疫细胞（第五章）` |
| `physicalStart` | `64` |
| `physicalEnd` | `79` |
| `pageOffset` | `16`（印刷页 = 物理页 − 16 → **48–63**） |

**边界依据（扫描 PDF 页图，勿猜）**：

- 物理 **63** = 第四章「学习小结」+「复习思考题」末（页脚印刷 **47**）—— **勿混入 ch05**
- 物理 **64** = 第五章标题页「免疫细胞」+ 学习目标 + 第一节「免疫细胞的分化和发育」起笔（页脚印刷 **48**）
- 物理 **79** = 第五章「学习小结」+「复习思考题」（页脚印刷 **63**）
- 物理 **80** = 第六章「免疫应答」标题页起（页脚印刷 **64**）—— **勿混入 ch05**

OCR 引擎优先沿用现有 Apple Vision 脚本；失败再用 tesseract `chi_sim+eng`。产物：

- `data/chapters/ch05.blocks.json`
- （可选）`data/chapters/ch05-pages/` 预览图
- `data/cards/ch05.entities.json`（**独立文件**，不要把 ch05 糊进 ch01/ch03/ch04 JSON）
- `data/qa/ch05-sample-10.md`（10 张抽查表，格式对齐 ch03 / ch04）

UI：`loadCards` / `/entities` 合并展示已有章 + ch05；搜索与 kind 筛选继续可用。**不要**为本章硬编码实体名 / 页码 / 假 cite。

**id 冲突提醒（推仓前全库唯一性检查）**：ch03/ch04 已占用若干细胞相关 id，本章勿复用。已知撞名风险示例：

- ch03：`hsc-differentiation`、`lymphocyte-homing`、`lymphocyte-recirculation`、`dendritic-cells-in-lymph-node`
- ch04：`cd4`、`cd8`、`cd40`、`cd45`、`cd44`、`cd80-cd86`、`lymphocyte-homing-receptor`、`mhc-nk-cell-regulation`、`il12-th1-differentiation`

新卡用细胞类型/亚群命名空间（如 `nk-cell`、`th1-cell`、`naive-b-cell`）。跨章撞名时加 `-cell` / `-subset` / `-surface` 后缀；表面分子若 ch04 已有同 id，本章写细胞语境卡时用新 id（如 `t-cell-cd4`），或明确引用既有分子卡、不重复建同 id。

---

## 成功标准

1. **解析**：物理页 64–79 有结构化 blocks，每段带印刷 `page`（48–63）与可选 bbox。
2. **实体卡**：`ch05.entities.json` ≥ **40** 张；覆盖至少：HSC/分化发育、单核/巨噬细胞、DC、NK/ILC、粒细胞与肥大细胞、APC 概念、TCR-CD3 / CD4 / CD8 / 共刺激与负调分子、Th/CTL/Treg 亚群、BCR-CD79 / 共受体 / B1·B2 / 初始·浆·记忆 B；每张 ≥1 cite、≥1 atom。`kind` 以 `cell` / `concept` / `process` / `molecule`（表面分子）为主；**勿把第四章免疫分子整段重做，也勿混入第六章免疫应答机制**。
3. **Fail-closed（硬）**：
   - 新卡所有 `cites[].verified` 必须为 **`false`**，直到 Nuradil 抽查通过；
   - 不确定页码 → `page: null` + UI `p.?`；**禁止**为过验收把 `verified` 一律打成 `true`。
4. **抽查表**：`data/qa/ch05-sample-10.md` 列出 10 张（含 id、one_liner、关键 cite quote、你标的页码），供人工对错。
5. **UI**：列表能看到新卡；kind 筛选 + 悬浮搜索仍工作；从详情返回时保留 `?kind=`；`pnpm --filter web build` 通过。
6. **文案**：若仍硬编码 `/entities` H1 / layout metadata，至少扩到含「免疫细胞」；更优：从 `config/chapter.json` 派生，去掉手维章节名。
7. **审美**：不新开营销落地页；不改品牌色；见 `docs/frontend-aesthetics.md`。
8. **不做**：FSRS、Clew 对话、全书、中药学、改写已验收 ch01–ch04 事实内容（除非修跨章 id 撞名）；除非修明显 schema 兼容 bug。

---

## 建议实现顺序

1. 更新 `config/chapter.json` → 跑 parse 只出 ch05 blocks。  
2. 跑 extract 产出 `ch05.entities.json`。  
3. 全库唯一 id 检查（含 ch01/ch03/ch04；当前库约 326 个唯一 id）。  
4. 写 `ch05-sample-10.md`。  
5. 本地 `pnpm --filter web build` + 手动搜「NK」「Th1」「CD40」「APC」「记忆 B」等。

---

## 验收时我会查

- 物理范围是否真是第五章（勿混进第四章末或第六章「免疫应答」）
- 是否所有新 cite 仍 `verified:false`
- 抽查 10 张事实密度与 quote 是否贴 OCR
- 跨章 id 无碰撞
- build + 搜索 + kind-back 仍 PASS
- 无硬编码实体名单的「演示味」

做完回：改动文件列表 + `pnpm --filter web build` 结果；我再验收。中药学 PDF 仍缺，到货后复用本流水线另开任务。

**Grok Bot 侧已备**：物理 64–82 PNG 在 box `/workspace/tmp/ariadne-ch4-ocr/`（可拷 `p-064.png`…`p-079.png`）；边界 OCR 已核实（p63=ch4 末 / p64=ch5 起 / p79=ch5 小结 / p80=ch6 起）。
