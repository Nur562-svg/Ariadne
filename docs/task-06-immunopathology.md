# Task 06 — 第七章「免疫病理」实体卡（Trae / zcode）

**状态**：brief 已定 · 待 Trae 执行  
**仓库**：`Nur562-svg/Ariadne`（本机 `/Users/nukeab/projects/Ariadne`；GitHub main 已含 ch01–ch06 卡数据）  
**主写手**：Trae Code（建议模型 `DeepSeek-V4-Pro`；备选 zcode）  
**前置**：Task 05（ch06）PASS 且数据已推仓；CiteChip / viewer page-resolve 已在 main（**勿回退**）  
**规范**：先读 `docs/frontend-aesthetics.md`（产品面克制，勿做营销 hero）

---

## 目的

把覆盖从「免疫应答」推进到 **第七章 免疫病理**，复用现有 parse → extract → `/entities` 预览，充实考试向知识原子（超敏反应 I–IV 型机制与疾病、自身免疫病概念 / 分类 / 发病机制 / 常见病举例）。做成可考的产品知识层，不是演示清单。

---

## 页面范围（硬 · 已 OCR 核实 2026-10-17）

在 `config/chapter.json` **追加**一章（不要删掉 ch01 / ch03 / ch04 / ch05 / ch06）：

| 字段 | 值 |
|------|-----|
| `id` | `ch07` |
| `title` | `免疫病理（第七章）` |
| `physicalStart` | `94` |
| `physicalEnd` | `105` |
| `pageOffset` | `16`（印刷页 = 物理页 − 16 → **78–89**） |

**边界依据（扫描 PDF 页图 + tesseract `chi_sim+eng`，勿猜）**：

- 物理 **93** = 第六章「学习小结」续 +「复习思考题」末（页脚印刷 **77**）—— **勿混入 ch07**
- 物理 **94** = 第七章学习目标 + 第一节「超敏反应」起笔（页脚印刷 **78**；OCR 可见「超敏反应的概念和类型」「第一节 超敏反应」）
- 物理 **105** = 第七章「学习小结」+「复习思考题」（页脚印刷 **89**；小结覆盖超敏 4 型 + 自身免疫病）—— **本章止于此**
- 物理 **106** = 第八章「免疫学应用」学习目标 + 第一节「免疫学检测」起（页脚印刷 **90**）—— **勿混入 ch07**

OCR 引擎优先沿用现有 Apple Vision 脚本；失败再用 tesseract `chi_sim+eng`。产物：

- `data/chapters/ch07.blocks.json`
- （可选）`data/chapters/ch07-pages/` 预览图
- `data/cards/ch07.entities.json`（**独立文件**，不要把 ch07 糊进 ch01/ch03/ch04/ch05/ch06 JSON）
- `data/qa/ch07-sample-10.md`（10 张抽查表，格式对齐 ch03 / ch04 / ch05 / ch06）

UI：`loadCards` / `/entities` 合并展示已有章 + ch07；搜索与 kind 筛选继续可用。**不要**为本章硬编码实体名 / 页码 / 假 cite。

**id 冲突提醒（推仓前全库唯一性检查）**：ch01/ch04/ch05/ch06 已占用大量相关 id，本章勿复用。已知撞名风险示例：

- ch01：`autoantigen`、`superantigen`、`heterophilic-antigen`
- ch04：`type-i-hypersensitivity-ige`、`ige-properties`、`fc-epsilon-receptors`、`complement-anaphylatoxins`、`hla-class-ii-abnormal-expression-autoimmune`
- ch05：`mast-cell`、`basophil`
- ch06：`mast-cell-response`、`type-i-ifn`（勿与 I 型超敏混淆）

新卡用**病理过程 / 分型 / 疾病机制**命名空间（如 `hypersensitivity`、`type-i-hypersensitivity`、`type-ii-hypersensitivity`、`type-iii-hypersensitivity`、`type-iv-hypersensitivity`、`allergen`、`anaphylaxis`、`arthus-reaction`、`serum-sickness`、`autoimmune-disease`、`organ-specific-aid`、`systemic-aid`、`molecular-mimicry`、`hidden-self-antigen`）。跨章撞名时加 `-pathology` / `-mechanism` / `-disease` / `-type-n` 后缀；细胞/分子若前章已有同 id，本章写病理语境卡时用新 id（如 `ige-mediated-type-i-mechanism`、`mast-cell-degranulation-type-i`），或明确引用既有卡、不重复建同 id。

**近重复名合并（Task 04/05 教训 · 硬提醒）**：extract 后、交验收前，按 `name_zh` 聚合检查 `-2` / `-3` / `-4` 后缀碎片。同名近重复优先**合并为一张**（保留最全 atoms/cites），不要把编号后缀卡当成品留下。交 `ch07-sample-10.md` 前再跑一次同名扫描。

**CiteChip / page-resolve（已修 · 勿回退）**：Task 05 已把 viewer 从硬编码 ch01 改为 `loadAllChapterPages()`，CiteChip 规则为「已知 page → `p.N`（未 verified 仍琥珀可点）；`page:null` → `p.?`」。本章**不要**改回 `verified && page` 才显示页码，也**不要**把 viewer 锁回单章。只需让 ch07 blocks 进入同一合并索引即可。

---

## 成功标准

1. **解析**：物理页 94–105 有结构化 blocks，每段带印刷 `page`（78–89）与可选 bbox。
2. **实体卡**：`ch07.entities.json` ≥ **40** 张（本章约 **12** 物理页，略短于 ch06；密度可与 ch06 相近，但勿灌水）；覆盖至少：超敏反应概念与 4 型分型；I 型（变应原 / IgE / 肥大·嗜碱 / 介质与临床）；II 型（细胞毒 / 补体·ADCC / 输血反应·新生儿溶血等）；III 型（免疫复合物 / Arthus·血清病·肾小球肾炎等）；IV 型（DTH / Th1·CTL / 接触性皮炎·感染性超敏等）；自身免疫病概念与分类（器官特异性 vs 全身性）、发病机制（隐蔽抗原 / 改变的自身抗原 / 耐受失效 / 多克隆激活 / 调节紊乱等）、常见 AID 举例（如 Graves、MG、IDDM、MS、RA、SLE——以本章表 7-1 与正文为准）；每张 ≥1 cite、≥1 atom。`kind` 以 `process` / `concept` / `disease` / `molecule` 为主；**勿把第六章免疫应答整段重做，也勿混入第八章免疫学应用（检测 / 预防 / 治疗）**。
3. **Fail-closed（硬）**：
   - 新卡所有 `cites[].verified` 必须为 **`false`**，直到 Nuradil 抽查通过；
   - 不确定页码 → `page: null` + UI `p.?`；**禁止**为过验收把 `verified` 一律打成 `true`；
   - **禁止**过早把 `verified` 设为 `true`（即便 quote 看起来很准）。
4. **抽查表**：`data/qa/ch07-sample-10.md` 列出 10 张（含 id、one_liner、关键 cite quote、你标的页码），供人工对错。
5. **UI**：列表能看到新卡；kind 筛选 + 悬浮搜索仍工作；从详情返回时保留 `?kind=`；`pnpm --filter web build` 通过。
6. **文案**：若仍硬编码 `/entities` H1 / layout metadata，至少扩到含「免疫病理」；更优：从 `config/chapter.json` 派生，去掉手维章节名。
7. **审美**：不新开营销落地页；不改品牌色；见 `docs/frontend-aesthetics.md`。
8. **近重复名**：交验收前合并同 `name_zh` 的 `-2/-3/-4` 碎片；勿把编号后缀当正常命名留下。
9. **不做**：FSRS、Clew 对话、全书、中药学、改写已验收 ch01–ch06 事实内容（除非修跨章 id 撞名）；除非修明显 schema 兼容 bug；**不要回退 CiteChip / `loadAllChapterPages` 行为**。

---

## 建议实现顺序

1. 更新 `config/chapter.json` → 跑 parse 只出 ch07 blocks。  
2. 跑 extract 产出 `ch07.entities.json`。  
3. 全库唯一 id 检查（含 ch01/ch03/ch04/ch05/ch06；当前库约 568+ 实体卡 id，以 main 为准）。  
4. **按 `name_zh` 合并近重复**（去掉无意义 `-2` 后缀卡）。  
5. 写 `ch07-sample-10.md`。  
6. 本地 `pnpm --filter web build` + 手动搜「超敏反应」「I型」「免疫复合物」「迟发型」「自身免疫病」「血清病」「接触性皮炎」等。

---

## 验收时我会查

- 物理范围是否真是第七章（勿混进第六章末或第八章「免疫学应用」）
- 是否所有新 cite 仍 `verified:false`（无提前翻 true）
- 抽查 10 张事实密度与 quote 是否贴 OCR
- 跨章 id 无碰撞（尤其勿复用 `type-i-hypersensitivity-ige` / `mast-cell` / `autoantigen`）
- 近重复 `name_zh`（`-2/-3/-4`）已合并或明确说明为何保留
- build + 搜索 + kind-back 仍 PASS；CiteChip 仍按「有 page 显示 p.N」而非「verified 才显示」
- 无硬编码实体名单的「演示味」

做完回：改动文件列表 + `pnpm --filter web build` 结果；我再验收。中药学 PDF 仍缺，到货后复用本流水线另开任务。

**Grok Bot 侧已备**：物理 94–105（及边界 93/106）PNG 可在 box `/workspace/tmp/ariadne-ch6-ocr/`（`p-094.png`…`p-105.png`；边界 `p-093.png` / `p-106.png`）；边界 OCR 已核实（p93=ch6 末 / p94=ch7「免疫病理」·超敏起 / p105=ch7 小结+思考题 / p106=ch8「免疫学应用」起）。

---

## Trae 一句话

> 追加 ch07「免疫病理」物理 **94–105**（印刷 78–89），≥40 张卡全 `verified:false`，写 `ch07-sample-10.md`，**合并 `-2` 近重复名**，勿混 ch6 应答 / ch8 应用，**勿回退 CiteChip/page-resolve**，DeepSeek-V4-Pro，先读 `frontend-aesthetics.md`。
