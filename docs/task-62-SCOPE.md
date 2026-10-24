# Ariadne Task 62 — SCOPE（推荐下一刀 · T61 后 · **MEGA** ~180–300+ min）

**定稿**：2026-10-24 17:25 Asia/Shanghai（CST）· **after T61 `5df0db3`**  
**调度**：Grok Bot（executor）· 用户「Two phases… Phase 2 — Scope Task 62 MEGA…」· **MEGA** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息**）  
**Tip 前置（硬）**：目标 tip = **`5df0db3`**（`docs(pipeline) Task 61 atom-local-draft-01` atop feat `12e7c81` atom-local-draft-01 atop `087fd12` T60）。  
- box `/workspace/Ariadne-push` 与 `origin/main` 定稿时对齐 **`5df0db3`**。  
- 开工时 `git log -1 --oneline` 须含 `5df0db3` / T61 docs。其下仍含 feat `12e7c81`、T60 `087fd12`/`9f3e143`、T59–T28 既有。若仍停在 `12e7c81`（仅 feat）或 `087fd12` 或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3 max thinking（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。  
**Standing**：验收 PASS 后 **auto-push**（写手/验收方按站规；本 SCOPE 仍不 push）。用户 zcode 配额充足——**刀子必须更大**。

**用户策略（2026-10-24）**：诚实井 T43–T53 已干；**材料→原子 pipeline 脊梁八刀已闭**（T54 detect → T55 remediate → T56 parse → T57 dark → T58 study dark → T59 shallow prod → T60 study shallow → **T61 local-draft editor**）。下一刀必须诚实评估 **草稿收件箱 / 多卡补丁包 / 人核落盘引导**——T61 已闭单卡编辑器，但书桌零草稿感知、补丁只能卡详逐卡复制、人改 seed 无文件路径/前后对照清单。若合同能在 A–J MEGA 内写死且杠杆高于其它 leftover，则 **开刀**；否则退下一诚实缺口。**勿**再堆 empty-CTA / return densify，**勿** redo T54–T61（可复用 atom-draft / CardDraftBar / incompleteAtoms），**勿**写 `verified:true` / Clew LLM 真写 / 自动 PATCH entities，**勿**把 draft 塞进 progress-port study/heye 包，**勿**改名既有 storage keys。

---

## 空池 CTA / return / OCR 深链 / T54–T61 井状态（硬声明）

**Empty-pool CTA densify 已饱和（T43–T51）**。  
**Return densify 已饱和（T35–T42）**。  
**T52–T53 已闭**：空·完成对称 / Quiz 书空 / Viewer←书桌 / Entity「对页」/ `pageInOcr` 鬼页 / HeYe u/z。  
**T54 已闭**：`cite-ocr-quality` · `pnpm cite-check` · extract `--strict` · ingest 质量条 · Register 软门禁 · Entity/HeYe/CiteChip「OCR 未见」。**不写 verified:true**。  
**T55 已闭**：`ocrNeighborhood` / `suggestQuoteFromOcr` / incompleteAtoms · CLI `--misses`/`--book` · ingest 补救面板 · Register incomplete · Entity/HeYe 复制级补救 · 书架 **cite** 质量徽。**剪贴板-only；不 PATCH entities**。  
**T56 已闭**：`parse-ocr-coverage` 孪生 · `pnpm parse-check` · parse.py 后置 · ingest 抽出前覆盖条 · extract 预检 · Overview/书架 **parse** 覆盖徽 · Reader 稀页提示。**不改 deriveMaterialStage 二元**。  
**T57 已闭**：`extract-page-coverage` 孪生 · `pnpm page-check` · extract 后置暗页 · ingest extracted 暗页条 · Register dark 旁挂 · Overview/书架 **暗页**徽 · Reader 暗页提示。**不发明 cite 填暗页**。  
**T58 已闭**：`examinable-coverage` 薄适配（消费 T57）· Study 页头/orphan/完成态 · HeYe orphan 旁挂 · ingest ready 暗D · Overview 练入口。**不** `emptyKind:'dark'`。  
**T59 已闭**：`extract-page-density` 孪生 · `pnpm density-check` · extract 后置浅 · ingest extracted 浅条 · Register shallow 旁挂 · Overview/书架抽出行旁挂浅 S · Reader 浅页提示（稀>暗>浅）。**不发明原子补浅**；**不**第四书架徽列 densify。  
**T60 已闭**：学习环浅密度诚实（消费 T59）· Study 页头/本页浅/完成态 · HeYe 浅旁挂 · ready 浅S · Overview 练入口浅。**不** `emptyKind:'shallow'`。  
**T61 已闭**：`ariadne.atom-draft.v1` · AtomDraftEditor · CardDraftBar · EntityCardDetail overlay · 剪贴板 `ariadne.atom-draft-patch.v1` · ingest 次级「到卡详开草稿」。**永不 verified / auto PATCH / Clew 真写 / 改名键**。Atom editor **DONE** — **本刀禁止 redo T61 编辑器**。  
**本刀不是**又一轮 empty-CTA densify、**不是** return densify、**不是** CitePeek 正文/trap redo、**不是**重做 T46–T61（可**复用** atom-draft store/patch/CardDraftBar/incompleteAtoms，禁止重写编辑器主路径 / 拆补救面板 / 拆 shelf cite·parse·暗 三分列 / 重做 Study examinable / Reader 优先序）、**不是** Clew LLM 真写、**不是**自动 PATCH seed、**不是**把 draft 并进 study/heye progress 包。

相邻最强产品主题 = **材料→原子脊梁第九刀：书桌多卡草稿收件箱 + 统一补丁包 + 人核落盘引导（clipboard / markdown checklist only）** + **草稿单独可移植（不并入 progress-port）**。

---

## 诚实评估 · 候选对照（挑 ONE）

| 候选 | 杠杆 | 风险 | 判定 |
|------|------|------|------|
| **书桌草稿收件箱 + 多卡补丁包 + 人核落盘引导（本刀）** | T61 后最高：书桌有 incompleteAtoms 书徽但**零草稿感知**；补丁只能卡详逐卡复制；人改 seed 不知 `data/cards/<chapterId>.entities.json` 路径与 before→after 清单。闭环未完。 | 若滑向 auto PATCH / verified / Clew 真写 / 并进 progress-port = 拒收。合同可写死。 | **开作本刀主题** |
| Apply-patch 自动写 seed / 无 UI 审阅就落盘 | 看似闭环 | **OUT** — 自动写 entities = forever 禁；与 T55/T61 合同冲突 | **拒**（本刀人核路径已覆盖安全子集） |
| Clew 提案面（无真写） | 低 | OUT 邻域（Clew LLM 真写）；stub 已够 | **拒** |
| QA 仪表盘 / 批量重抽 UX | 中低 | 报告 gitignore；偏 chrome；曾 DEFER | **DEFER** |
| register→ready / quiz densify | 低 | 薄 / chrome densify；T58–T60 已挂信号 | **拒** |
| 纯 progress-port 把 draft 塞进 study/heye 包 | 假便利 | **OUT** — T61 五禁明文禁止吞 draft 键 | **拒** |
| 草稿单独可移植（本刀子主题 G） | 中高 | 须**独立** schema，永不 merge 进 ProgressPayload | **纳入本刀**（非单独薄刀） |
| 又一轮 empty-CTA / return densify | 无 | 井饱和 | **拒** |
| 重做 T54–T61 / AtomDraftEditor redo | 无 | 刚闭 | **拒** — 只复用 |
| CitePeek / OCR canvas / verified:true / Clew 真写 / FSRS / invent heye-only | — | OUT forever | **OUT** |
| 第四书架徽列 / `emptyKind:'shallow'|:'dark'` | — | 拒 | **拒** |

**结论**：开 **`atom-draft-inbox-apply-01`**。合同必须写死进 SCOPE / paste / J。若写手滑向 verified / Clew 真写 / auto PATCH / 改名键 / 把 draft 塞进 progress-port / 空-CTA densify / redo T61 编辑器 = **拒收**。

**残余风险（写进 SCOPE）**：写手把「人核落盘引导」做成浏览器内自动写 `data/cards/*.entities.json`、或伪造「已写回 seed」文案、或把 draft 并进 `ProgressPayload`、或把收件箱做成又一轮大红 empty-CTA densify、或重做 AtomDraftEditor 主路径 = 拒收。缺 localStorage → 收件箱诚实空/失败提示。Next.js security = ops not theme。heye-only invent / QA 仪表盘 / 批量重抽 / quiz 深度 densify / Register API 硬门禁 = leftover → 后续刀。

---

## 推荐一刀（ONE · MEGA）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`atom-draft-inbox-apply-01`** |
| **Title** | 书桌多卡草稿收件箱 · 统一补丁包 · 人核落盘引导 · 草稿单独可移植 · 永不 verified / PATCH / Clew 真写 / 并进 progress-port |
| **体量** | **~180–300+ min** 真实编码（**A–J** = 10 切片 · 3 子主题）。**若只做一行「有草稿」计数无多卡列表/无统一包/无人核清单就收工 = 漏做 = 拒收**。**若 15–30 / 90 分钟假装收工 = 漏做**。**若滑向 auto PATCH / verified:true / Clew 真写 / 改名键 / 并进 progress-port / redo T61 编辑器 = 主题偏了，拒收**。 |
| **产品脊梁** | 顾客材料 → OCR → 抽出 → 质量/暗/浅可见（T54–T60）→ 本机草稿编辑（T61）→ **本刀：书桌看见跨卡草稿 → 一键复制统一补丁包 → 人核清单指向 `data/cards/<chapterId>.entities.json` 自行改 seed / 开 PR；草稿可单独带走，不并进练/核进度包**。 |

**一句话**：在 **`5df0db3`（T61）** 上，新增 **书桌 DraftInbox 客户岛**（多卡草稿 + incomplete 无草稿引导）+ **`ariadne.atom-draft-pack.v1` 统一补丁包导出** + **人核落盘 markdown/JSON 清单（路径+before→after）** + **草稿单独 export/import（独立于 progress-port）**。**禁止** empty-CTA densify、return densify、CitePeek 正文/trap redo、重做 T46–T61 编辑器/算法、写 `verified:true`、自动写 entities/blocks、Clew LLM 真写、FSRS、invent heye-only、ModeChips 插队、Queue→Due、⌘K、DeskShell 重写、改名既有 storage keys、把 draft 塞进 study/heye progress 包、push、`emptyKind:'dark'|:'shallow'`、第四书架徽列 densify。

---

## human-apply-only 合同（硬 · 写进每个字母）

1. **复用 T61 键**：继续只读写 `ariadne.atom-draft.v1`。**禁止**改名 / 迁移 / 复用 study/heye/return/session/view/last-opened/recent-books。  
2. **统一补丁包**新 schema：`ariadne.atom-draft-pack.v1` = `{ schema, exportedAt, note, cards: AtomDraftPatchDoc[] }`（复用既有 `buildAtomDraftPatchDoc`；空包诚实「无草稿可导出」）。  
3. **人核落盘引导** = 剪贴板 / 下载 **文本或 JSON 清单**（建议含：`seedPath` = `data/cards/<chapterId>.entities.json`、`cardId`、`target`、`field`、`before`、`after`）。**不是** git apply；**不是**自动写文件；**不是** fetch/fs 写 seed。路径必须用 **chapterId 文件**（entities 按章存，**禁止**臆造 `data/cards/<cardId>.entities.json`）。  
4. **永不** `verified: true`（清单/补丁不得含翻 verified 指令；UI 无翻 verified 控件）。  
5. **永不** auto PATCH / `fetch`/`fs` 写 `data/cards/*.entities.json` / blocks / 任何 seed 路径。禁止「一键写回仓库」CTA。  
6. **永不** Clew LLM 真写 / 提案自动落盘。  
7. **草稿可移植 ≠ progress-port**：新增独立 `ariadne.atom-draft-port.v1`（或同名 payload）export/import **只**动 `ATOM_DRAFT_STORE_KEY`。**禁止**修改 `ProgressPayload` / `progress-port.ts` 把 draft 并进 study/heye；ProgressPortability UI **不**假装带走草稿。  
8. **草稿 ≠ seed 已核 ≠ heye 本机已对 ≠ study 练分**——文案四分列短句（沿用 T61 三分列 + 「收件箱≠已落盘」）。  
9. **精炼书桌**：琥珀/muted 收件箱条；朱砂仍唯一强调色（复制包/导出动作可用）；禁第二排实心芯片 densify；禁营销英雄；禁把 incomplete 书徽改成大红主 CTA densify。  
10. **不 redo T61**：AtomDraftEditor / CardDraftBar 主契约保留；本刀可轻挂「回卡详」链与复用 helpers，禁止重写编辑器字段模型。

---

## 三子主题

| # | 子主题 | 字母 |
|---|--------|------|
| 1 | pack schema + 跨卡索引 helpers + 人核清单 builder | A · B · C |
| 2 | Desk DraftInbox 客户岛（多卡列表 / incomplete 引导 / 复制包） | D · E · F |
| 3 | 草稿单独可移植 + 诚实文案 + 装配 | G · H |
| — | 装配收口 + build + DEFER + 回归 | I · J |

---

## 字母一览（A–J）

| 字母 | 切片 | 估分 |
|------|------|------|
| **A** | 扩展 `apps/web/lib/atom-draft.ts`（或薄新文件 `atom-draft-pack.ts` 再 re-export，**客户端安全，勿 import fs**）：① `buildAtomDraftPack(cards, store) → AtomDraftPackDoc`（schema `ariadne.atom-draft-pack.v1`；只含真改动卡；复用 `buildAtomDraftPatchDoc`）；② `listDraftedCardIds(store)` / `summarizeDraftStore(store, cards)` → 每卡 `{ cardId, chapterId?, draftCount, realEntryCount, incompleteNoDraft }`；③ 文件头/注释重申五禁 + 「不并进 progress-port」 | 30–45 |
| **B** | 人核落盘清单：`buildSeedApplyGuide(pack|cards+store) → string`（markdown 优先，或 JSON `ariadne.atom-draft-apply-guide.v1`）：每条含 `seedPath: data/cards/<chapterId>.entities.json`（chapterId 缺失 → 诚实「缺 chapterId，请按卡 id 在 data/cards/*.entities.json 内搜索」）、cardId、target、field、before→after；文首硬声明「人核后自行改 seed / 开 PR · 本浏览器不会写回」；**禁止**任何写文件 API | 25–40 |
| **C** | 草稿单独可移植 helpers（可同文件或 `atom-draft-port.ts`）：payload `{ schema:"ariadne.atom-draft-port.v1", exportedAt, draft: AtomDraftStore }`；`exportAtomDraftPort` / `parseAtomDraftPort` / `importAtomDraftPort(mode: merge\|replace)`——merge 按条目 `t` 较新者胜；fail-closed；**只**读写 `ATOM_DRAFT_STORE_KEY`；**禁止**改 `progress-port.ts` / `ProgressPayload` | 25–40 |
| **D** | `DraftInbox` 客户岛（新组件）：挂书桌书库效用区（近 `ProgressPortability`，**独立区块**，勿塞进 Clew）：有跨卡真草稿 → 琥珀条「本机草稿卡 N · 条目 M · 未写回 seed」+ 列表（卡名/id · 草稿数 · 链到 `/desk/card/<id>`）+「复制统一补丁包」+「复制人核落盘清单」；0 真草稿 → 不吵（可完全不渲，或仅当 server 传入 incomplete 种子时次级一句——见 E） | 35–50 |
| **E** | incomplete 无草稿引导（最小面）：Server 可下传 `incompleteCardSummaries: {id,name,incompleteAtoms,chapterId?}[]`（seed 口径，T55 同算法）给 DraftInbox；Client 交叉 draft store——incomplete>0 且该卡无真草稿 → 次级 muted 列表「可开本机草稿」+ 链卡详（**非**第二大红主 CTA；**非** empty-CTA densify 主题）；好书/无 incomplete 不吵 | 25–40 |
| **F** | 复制动作诚实契约：统一包 / 人核清单 均复用 `CopyTextButton`（或同契约）；空包 → 禁用或「无草稿可导出」；可选下载 `.json` / `.md`（浏览器 download，**本地文件**，不是写仓库）；文案反复「未写回 seed」 | 15–25 |
| **G** | 草稿 Portability UI（可嵌 DraftInbox 折叠区或紧邻 ProgressPortability 的独立「本机草稿带走」小节）：导出 draft-port JSON；导入选 merge/replace；非法 JSON fail-closed；**明示**「与练/核进度包分离 · ProgressPortability 不包含草稿」；禁把入口塞进 Clew QueuePanel | 25–40 |
| **H** | 诚实文案：草稿 ≠ seed；收件箱/补丁包 ≠ 已落盘；草稿 ≠ heye；草稿 ≠ study；draft-port ≠ progress-port；隐私模式写失败可见；禁掌握%/Due；禁 ModeChips 插队；禁 Clew 真写入口；禁营销英雄 | 15–25 |
| **I** | 装配：`apps/web/app/(desk)/page.tsx`（书库）挂 DraftInbox（+ 可选 incomplete 种子 props）；Server `loadCards` 只读；Client 读 draft；fail-closed SSR；**勿**毁 ProgressPortability / T55–T60 书架徽三分列 / CardDraftBar / AtomDraftEditor / CitePeek / deriveMaterialStage / study/heye 键；**勿**改 ProgressPayload 形状 | 25–40 |
| **J** | `pnpm --filter web build` PASS；`pnpm cite-check -- ch01` + `parse-check` + `page-check` + `density-check` 回归绿；**禁止**写 `verified:true`；**禁止**写回 entities/blocks；**禁止**改名 storage keys；**禁止** Clew LLM 真写；**禁止** draft 并进 progress-port；回复明示合同；DEFER：QA 仪表盘 / 批量重抽 / quiz densify / invent heye-only / Register 硬门禁；回归 T61–T28；写手不 push | 20–30 |

**合计估**：约 **240–415** 分钟（落在 180–300+ MEGA 窗；偏紧可压 E 为「仅 Client 有草稿列表、incomplete 种子 DEFER」或压 G 下载为「仅剪贴板」——**不可**砍 A/B/D/F/I/J；C+G 至少交 export 剪贴板/下载 + import 最小面之一，优先双交）。若写手体感超额，优先保 A–B–D–F–I–J，E/H 最小面仍须交，C/G 至少一侧可移植。

---

## 硬 OUT（本刀 + 站规 forever）

FSRS/Due · Clew LLM 真写 · **写 `verified:true` 过关** · **自动写回 / PATCH entities.json 或 blocks.json** · OCR canvas · CitePeek **正文/trap** redo · ⌘K · Queue→Due · DeskShell 重写 · exam-anchor 全量 · invent heye-only seed · ch08+ · nur-landing · 掌握% · **改名既有 storage keys** · 强制清空整栈 · ModeChips 中插队 · **return densify 当主题** · **empty-CTA densify 当主题** · **重做 T46–T61（含 AtomDraftEditor 主路径 redo）** · Next.js upgrade 当主题 · 假池 · 只交一行计数无多卡列表/无统一包/无人核清单就收工 · 写手 push · 硬阻断 register API · 把草稿伪造成 seed 已核或 heye 已对 · 假云端 OCR / 假进度条 · 改 `deriveMaterialStage` · 自动给浅页发明原子 · 吞改 HeYe orphan 分型 · `emptyKind:'dark'` · `emptyKind:'shallow'` · 第四书架徽列 densify · 借机给空池加新大红主 CTA densify · **把 draft 键塞进 progress-port study/heye 包** · 臆造 per-card entities 路径（必须用 chapter 文件） · 「一键写回仓库」CTA。

Soft：heye-only invent **DEFER**；QA 仪表盘页 / 批量重抽队列 UX / quiz·study 深度 densify / Register API 硬门禁 = leftover → 后续刀；Next.js security = ops not theme。

---

## 建议路径

```
apps/web/lib/atom-draft.ts                 # A · B 扩展（pack + summarize + apply-guide）或薄拆
apps/web/lib/atom-draft-port.ts            # C 可选独立文件（只动 ATOM_DRAFT_STORE_KEY）
apps/web/components/DraftInbox.tsx         # D · E · F · G · H 客户岛
apps/web/app/(desk)/page.tsx               # I 挂岛 + 可选 incomplete 种子
apps/web/components/ProgressPortability.tsx # 勿改 payload；最多一句「草稿请用草稿带走」（可选）
apps/web/components/CopyTextButton.tsx     # F 复用（勿改坏既有契约）
# 勿毁：CardDraftBar · AtomDraftEditor · EntityCardDetail overlay · cite/parse/暗/浅 ·
#       examinable · shelf 三分列 · Reader 稀>暗>浅 · progress-port study/heye 形状 ·
#       ClewPane · ModeChips · book-pools · return-stack · deriveMaterialStage
# 勿写：data/cards/*.entities.json · verified:true · Clew 真写 API · ProgressPayload.draft
# 可复用：buildAtomDraftPatchDoc · cardDraftCount · listIncompleteDraftTargets ·
#         loadAtomDraftStore/subscribe · CopyTextButton · ProgressPortability UX 模式
```

---

## 验收口令

做完叫验收。A–J 全交才过。
