# Task 05 — 第六章「免疫应答」实体卡（Trae / zcode）

**状态**：brief 已定 · 待 Trae 执行  
**仓库**：`Nur562-svg/Ariadne`（本机 `/Users/nukeab/projects/Ariadne`；GitHub main 已含 ch01–ch05 卡数据）  
**主写手**：Trae Code（建议模型 `DeepSeek-V4-Pro`；备选 zcode）  
**前置**：Task 04（ch05）PASS 且数据已推仓；kind-back UX 已在 main  
**规范**：先读 `docs/frontend-aesthetics.md`（产品面克制，勿做营销 hero）

---

## 目的

把覆盖从「免疫细胞」推进到 **第六章 免疫应答**，复用现有 parse → extract → `/entities` 预览，充实考试向知识原子（固有/适应性应答特点与机制、T/B 细胞应答、初次/再次应答、免疫调节）。做成可考的产品知识层，不是演示清单。

---

## 页面范围（硬 · 已 OCR 核实 2026-10-17）

在 `config/chapter.json` **追加**一章（不要删掉 ch01 / ch03 / ch04 / ch05）：

| 字段 | 值 |
|------|-----|
| `id` | `ch06` |
| `title` | `免疫应答（第六章）` |
| `physicalStart` | `80` |
| `physicalEnd` | `93` |
| `pageOffset` | `16`（印刷页 = 物理页 − 16 → **64–77**） |

**边界依据（扫描 PDF 页图 + tesseract `chi_sim+eng`，勿猜）**：

- 物理 **79** = 第五章「学习小结」+「复习思考题」末（页脚印刷 **63**）—— **勿混入 ch06**
- 物理 **80** = 第六章标题页「免疫应答」+ 学习目标 + 第一节「固有免疫应答」起笔（页脚印刷 **64**）
- 物理 **92** = 第六章「学习小结」起（页脚印刷 **76**）
- 物理 **93** = 第六章「学习小结」续 +「复习思考题」（页脚印刷 **77**）—— **本章止于此**
- 物理 **94** = 第七章「免疫病理」学习目标 + 第一节「超敏反应」起（页脚印刷 **78**）—— **勿混入 ch06**

OCR 引擎优先沿用现有 Apple Vision 脚本；失败再用 tesseract `chi_sim+eng`。产物：

- `data/chapters/ch06.blocks.json`
- （可选）`data/chapters/ch06-pages/` 预览图
- `data/cards/ch06.entities.json`（**独立文件**，不要把 ch06 糊进 ch01/ch03/ch04/ch05 JSON）
- `data/qa/ch06-sample-10.md`（10 张抽查表，格式对齐 ch03 / ch04 / ch05）

UI：`loadCards` / `/entities` 合并展示已有章 + ch06；搜索与 kind 筛选继续可用。**不要**为本章硬编码实体名 / 页码 / 假 cite。

**id 冲突提醒（推仓前全库唯一性检查）**：ch01/ch04/ch05 已占用大量应答相关 id，本章勿复用。已知撞名风险示例：

- ch01：`immune-response`、`innate-immunity`、`adaptive-immunity`、`cellular-immunity`、`humoral-immunity`、`prr-pamp`、`td-ag`
- ch04：`cd28`、`ctla-4`（若已有）、`mhc-restriction`、`il2-aicd`、`il12-th1-differentiation`、`immunoregulation-by-antibody`、`complement-immunoregulation`
- ch05：`innate-immune-cell`、`adaptive-immune-cell`、`ctl`、`th1-cell` / `th2-cell` / `th17-cell`、`memory-t-cell` / `memory-b-cell`、`t-cell-cd28`、`ctla-4`、`costimulatory-molecule`、`dc-immune-tolerance`

新卡用**应答过程 / 机制**命名空间（如 `innate-immune-response`、`t-cell-dual-signal`、`primary-antibody-response`、`aicd-feedback`、`neuroendocrine-immune-network`）。跨章撞名时加 `-response` / `-mechanism` / `-regulation` 后缀；细胞/分子若前章已有同 id，本章写应答语境卡时用新 id（如 `th1-mediated-cellular-response`），或明确引用既有卡、不重复建同 id。

**近重复名合并（Task 04 教训 · 硬提醒）**：extract 后、交验收前，按 `name_zh` 聚合检查 `-2` / `-3` / `-4` 后缀碎片（如「树突状细胞」「NK细胞」式切片）。同名近重复优先**合并为一张**（保留最全 atoms/cites），不要把编号后缀卡当成品留下。交 `ch06-sample-10.md` 前再跑一次同名扫描。

---

## 成功标准

1. **解析**：物理页 80–93 有结构化 blocks，每段带印刷 `page`（64–77）与可选 bbox。
2. **实体卡**：`ch06.entities.json` ≥ **40** 张（本章约 14 物理页，密度可略疏于 ch04/ch05，但勿灌水）；覆盖至少：固有应答特征与机制（PAMP/DAMP/PRR、屏障/固有细胞/分子效应）、适应性应答特征、T 细胞双信号与细胞免疫效应、B 细胞对 TD-Ag 的应答与体液免疫、初次应答 vs 再次应答（抗体产生规律）、免疫调节（分子 / 细胞含 Th1·Th2·Treg·AICD / 神经–内分泌–免疫网络）；每张 ≥1 cite、≥1 atom。`kind` 以 `process` / `concept` / `molecule` 为主，细胞仅在应答角色必要时点到；**勿把第五章免疫细胞整段重做，也勿混入第七章超敏反应 / 自身免疫病**。
3. **Fail-closed（硬）**：
   - 新卡所有 `cites[].verified` 必须为 **`false`**，直到 Nuradil 抽查通过；
   - 不确定页码 → `page: null` + UI `p.?`；**禁止**为过验收把 `verified` 一律打成 `true`；
   - **禁止**过早把 `verified` 设为 `true`（即便 quote 看起来很准）。
4. **抽查表**：`data/qa/ch06-sample-10.md` 列出 10 张（含 id、one_liner、关键 cite quote、你标的页码），供人工对错。
5. **UI**：列表能看到新卡；kind 筛选 + 悬浮搜索仍工作；从详情返回时保留 `?kind=`；`pnpm --filter web build` 通过。
6. **文案**：若仍硬编码 `/entities` H1 / layout metadata，至少扩到含「免疫应答」；更优：从 `config/chapter.json` 派生，去掉手维章节名。
7. **审美**：不新开营销落地页；不改品牌色；见 `docs/frontend-aesthetics.md`。
8. **近重复名**：交验收前合并同 `name_zh` 的 `-2/-3/-4` 碎片；勿把编号后缀当正常命名留下。
9. **不做**：FSRS、Clew 对话、全书、中药学、改写已验收 ch01–ch05 事实内容（除非修跨章 id 撞名）；除非修明显 schema 兼容 bug。

---

## 建议实现顺序

1. 更新 `config/chapter.json` → 跑 parse 只出 ch06 blocks。  
2. 跑 extract 产出 `ch06.entities.json`。  
3. 全库唯一 id 检查（含 ch01/ch03/ch04/ch05；当前库约 462 个唯一 id，以 main 为准）。  
4. **按 `name_zh` 合并近重复**（去掉无意义 `-2` 后缀卡）。  
5. 写 `ch06-sample-10.md`。  
6. 本地 `pnpm --filter web build` + 手动搜「固有免疫应答」「双信号」「初次应答」「再次应答」「AICD」「免疫调节」等。

---

## 验收时我会查

- 物理范围是否真是第六章（勿混进第五章末或第七章「免疫病理」/超敏反应）
- 是否所有新 cite 仍 `verified:false`（无提前翻 true）
- 抽查 10 张事实密度与 quote 是否贴 OCR
- 跨章 id 无碰撞
- 近重复 `name_zh`（`-2/-3/-4`）已合并或明确说明为何保留
- build + 搜索 + kind-back 仍 PASS
- 无硬编码实体名单的「演示味」

做完回：改动文件列表 + `pnpm --filter web build` 结果；我再验收。中药学 PDF 仍缺，到货后复用本流水线另开任务。

**Grok Bot 侧已备**：物理 80–93（及边界 79/94）PNG 可在 box `/workspace/tmp/ariadne-ch6-ocr/`（`p-080.png`…）；边界 OCR 已核实（p79=ch5 末 / p80=ch6「免疫应答」起 / p92–93=ch6 小结+思考题 / p94=ch7「免疫病理」起）。

---

## Trae 一句话

> 追加 ch06「免疫应答」物理 **80–93**（印刷 64–77），≥40 张卡全 `verified:false`，写 `ch06-sample-10.md`，**合并 `-2` 近重复名**，勿混 ch5 细胞章 / ch7 超敏，DeepSeek-V4-Pro，先读 `frontend-aesthetics.md`。
