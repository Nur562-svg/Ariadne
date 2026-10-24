# Ariadne Task 61 — SCOPE（推荐下一刀 · T60 后 · **MEGA** ~180–300+ min）

**定稿**：2026-10-24 16:14 Asia/Shanghai（CST）· **after T60 `087fd12`**  
**调度**：Grok Bot（executor）· 用户「Two phases… Phase 2 — Scope Task 61 MEGA knife… evaluate honestly whether T61 should BE the local-draft atom editor OR another higher-leverage knife」· **MEGA** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息**）  
**Tip 前置（硬）**：目标 tip = **`087fd12`**（`docs(pipeline) Task 60 study-shallow-density-01` atop feat `9f3e143` study-shallow-density-01 atop `a18ada3` T59）。  
- box `/workspace/Ariadne-push` 与 `origin/main` 定稿时对齐 **`087fd12`**。  
- 开工时 `git log -1 --oneline` 须含 `087fd12` / T60 docs。其下仍含 feat `9f3e143`、T59 `a18ada3`/`9a1303a`、T58–T28 既有。若仍停在 `9f3e143`（仅 feat）或 `a18ada3` 或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3 max thinking（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。  
**Standing**：验收 PASS 后 **auto-push**（写手/验收方按站规；本 SCOPE 仍不 push）。用户 zcode 配额充足——**刀子必须更大**。

**用户策略（2026-10-24）**：诚实井 T43–T53 已干；**材料→原子 pipeline 脊梁七刀已闭**（T54 detect → T55 remediate → T56 parse → T57 dark → T58 study dark → T59 shallow prod → T60 study shallow）。下一刀必须诚实评估 **真·字段级原子编辑器（local-draft-only）**——T55→T60 反复 DEFER 的合同目标现已到窗。若合同能在 A–J MEGA 内写死且杠杆高于其它 leftover，则 **开刀**；否则退下一脊梁诚实缺口。**勿**再堆 empty-CTA / return densify，**勿** redo T54–T60，**勿**写 `verified:true` / Clew LLM 真写 / 自动 PATCH entities，**勿**改名既有 storage keys。

---

## 空池 CTA / return / OCR 深链 / T54–T60 井状态（硬声明）

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
**本刀不是**又一轮 empty-CTA densify、**不是** return densify、**不是** CitePeek 正文/trap redo、**不是**重做 T46–T60（可**复用** T55 incomplete / suggestQuote / CopyTextButton，禁止重写 cite/dark/shallow 算法 / 拆软门禁 / 拆补救面板 / 拆 shelf cite·parse·暗 三分列 / 重做 Study examinable / Reader 优先序）、**不是** Clew LLM 真写、**不是**自动 PATCH seed。

相邻最强产品主题 = **材料→原子脊梁第八刀：本机草稿原子字段编辑器（local-draft-only）**（新键草稿 · 剪贴板 JSON patch 导出 · **永不**翻 `verified:true` · **永不** auto PATCH entities/blocks · **永不** Clew LLM 真写 · **永不**改名 study/heye/return 既有键）。

---

## 诚实评估 · 真·原子字段编辑器（T55→T60 leftover → **本刀开刀**）

| 维 | 判定 |
|----|------|
| 杠杆 | T54–T60 生产+学习环诚实已闭；T55 已有 incomplete 计数 + 复制建议摘录，但人修仍靠手改 JSON——**人修环未闭合**。编辑器此刻是脊梁最高杠杆 leftover（不再被「下一生产/学习环消费刀」挤掉）。 |
| Clew / verified | **风险真实**——须把合同写进每一个字母：draft ≠ seed verified；「本机草稿」≠「本机已对」(heye)；禁止任何 UI/路径写 `verified:true`；禁止 Clew 面板真写 / 提案自动落盘。 |
| storage / PATCH | **新键 only**：`ariadne.atom-draft.v1`。**永不**改名 / 迁移 / 复用 `ariadne.study.v1` · `ariadne.heye.v1` · `ariadne.desk.return.v1` · `ariadne.desk.session.v1` · `ariadne.desk.view.v1` · `ariadne.desk.last-opened.v1` · `ariadne.desk.recent-books.v1`。**永不** auto PATCH / fetch 写 `data/cards/*.entities.json` 或 blocks。导出 = **剪贴板 JSON patch 文档**（人核后自行粘贴进 seed / PR）。 |
| 体量 | A–J MEGA 可装：store + overlay merge + 卡详原子/字段草稿岛 + incomplete 入口 + 导出/清除 + 诚实文案 + 装配/回归。偏 chrome 风险用「草稿≠seed」硬文案 + 禁第二排实心 CTA densify 压住。 |
| 结论 | **开作本刀主题**。合同必须写死进 SCOPE / paste / J。若写手滑向 verified / Clew 真写 / auto PATCH / 改名键 / 空-CTA densify = **拒收**。 |

**残余风险（写进 SCOPE）**：若写手把本刀做成又一轮 empty-CTA / return densify、或 CitePeek 正文/trap redo、或重做 T54–T60、或偷偷写 `verified:true` / 自动 PATCH entities / Clew LLM 真写 / 改名既有 storage keys / 把草稿伪造成 seed 已核、或 FSRS/Due / Queue→Due / ModeChips 插队 / invent heye-only / 发明原子补浅 / `emptyKind:'dark'|:'shallow'` = 拒收。草稿 UI **只 overlay 显示**，seed JSON 服务端读路径不变。缺 localStorage（隐私模式）→ 编辑会话内可用、持久化失败须诚实提示，**不**假装已写入 seed。Next.js security = ops not theme。heye-only invent / QA 仪表盘 / 批量重抽队列 UX / quiz 深度 densify / Register API 硬门禁 = leftover → 后续刀。

---

## 推荐一刀（ONE · MEGA）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`atom-local-draft-01`** |
| **Title** | 本机草稿原子字段编辑器 · local-draft-only · 剪贴板 JSON patch · 永不 verified / PATCH / Clew 真写 |
| **体量** | **~180–300+ min** 真实编码（**A–J** = 10 切片 · 3 子主题）。**若只做一行 textarea 无 store/无导出/无诚实文案就收工 = 漏做 = 拒收**。**若 15–30 / 90 分钟假装收工 = 漏做**。**若滑向 auto PATCH / verified:true / Clew 真写 / 改名键 = 主题偏了，拒收**。 |
| **产品脊梁** | 顾客材料 → OCR → 抽出 → 质量/暗/浅可见（T54–T60）→ **本刀：人在卡详用本机草稿修 incomplete / 稀浅原子字段，导出 patch 自行落盘** —— 不把「本机草稿」假装「seed 已核 / 已写回」，不污染 seed，不假翻 verified。 |

**一句话**：在 **`087fd12`（T60）** 上，新增 **`ariadne.atom-draft.v1` 本机草稿仓** + **卡详原子/字段草稿编辑岛** + **剪贴板 JSON patch 导出** + **incomplete 入口与诚实文案**。**禁止** empty-CTA densify、return densify、CitePeek 正文/trap redo、重做 T46–T60、写 `verified:true`、自动写 entities/blocks、Clew LLM 真写、FSRS、invent heye-only、ModeChips 插队、Queue→Due、⌘K、DeskShell 重写、改名既有 storage keys、push、`emptyKind:'dark'|:'shallow'`、第四书架徽列 densify。

**为何选这主题（对照候选）**：

| 候选 | 判定 |
|------|------|
| **本机草稿原子字段编辑器（本刀 · A–J）** | T54–T60 脊梁闭合后最高杠杆人修环；合同可写死；天然 MEGA；落在 materials→atoms **第八刀** |
| Clew 提案面（无真写） | 邻域 OUT（Clew LLM 真写）；stub 已够；**拒**当主题 |
| register→ready 再 densify | T58–T60 已挂暗D/浅S；增量偏薄；**拒** |
| quiz/study 深度 densify | ModeChips/档位已有；偏 chrome densify；**拒** |
| 纯 QA 页路由渲 data/qa | 报告 gitignore；偏 chrome 仪表盘；继续 DEFER |
| 批量重抽队列 UX | T55 已有 CopyCommand；增量偏薄；**DEFER** |
| 又一轮 empty-CTA / return densify | **拒** — 井饱和 |
| 重做 T54–T60 bigram / 补救 / cite·parse·暗·浅 / examinable | **拒** — 刚闭；只**复用** incomplete / suggestQuote / CopyText |
| CitePeek 正文/trap / OCR canvas / 写 verified:true / Clew 真写 | **OUT forever** |
| FSRS / Queue→Due / invent heye-only | **OUT / DEFER** |
| Next.js security upgrade | **ops** — 非主题 |
| 自动 PATCH entities / 改名 storage keys | **OUT forever** — 合同硬禁 |
| 第四书架徽列 densify / `emptyKind:'shallow'|:'dark'` | **拒** |

---

## local-draft-only 合同（硬 · 写进每个字母）

1. **新键 only**：`ariadne.atom-draft.v1`（常量导出如 `ATOM_DRAFT_STORE_KEY`）。形状建议：`Record<draftKey, DraftEntry>`，`draftKey` = `` `${cardId}/${target}` ``（target 例 `atom:${atomId}` 或 `field:${index}`）；`DraftEntry` 含可编辑字段子集（atom: `prompt?`/`answer?`；field: `value?`；可选 `citeQuote?`）+ `t: number`。**禁止**把 draft 写入 study/heye/return/session/view/last-opened/recent-books。  
2. **显示 = seed ⊕ draft overlay**（有草稿字段覆盖 seed；无草稿显示 seed）。服务端 `loadCards` / entities JSON **只读不变**。  
3. **导出 = 剪贴板**：生成可读 JSON patch 文档（建议 Ariadne 形：`{ schema:"ariadne.atom-draft-patch.v1", cardId, chapterId?, entries:[{ target, before, after }] }` 或等价；**勿**假装已是 git apply）。复用/对齐 `CopyTextButton` 诚实契约（clipboard 不可用则隐藏，不装假已复制）。  
4. **永不** `verified: true`（UI 不得提供翻 verified 控件；导出 patch **不得**含把 verified 改 true 的指令；正文反复声明 draft ≠ seed 抽查）。  
5. **永不** auto PATCH / `fetch`/`fs` 写 `data/cards/*.entities.json` / blocks / 任何 seed 路径。  
6. **永不** Clew LLM 真写 / 提案自动落盘（本刀不接 Clew 写路径）。  
7. **永不**改名既有 storage keys；progress-port **不**吞 draft 键（可选：单独导出 draft；**勿**把 draft 塞进 study/heye 包）。  
8. **草稿 ≠ 本机核页 ≠ 本机练分**：heye `checked` / study grade 语义不动；文案三分列。  
9. **精炼书桌**：琥珀/muted 旁挂「本机草稿」；朱砂仍唯一强调色（导出/保存草稿动作可用）；禁第二排实心芯片 densify；禁营销英雄文案。

---

## 三子主题

| # | 子主题 | 字母 |
|---|--------|------|
| 1 | draft store + overlay merge + patch 导出 | A · B · C |
| 2 | EntityCardDetail 原子/字段草稿岛 + incomplete 入口 | D · E · F |
| 3 | 草稿条/清除/诚实文案 + 装配 | G · H |
| — | 装配收口 + build + DEFER + 回归 | I · J |

---

## 字母一览（A–J）

| 字母 | 切片 | 估分 |
|------|------|------|
| **A** | 新增 `apps/web/lib/atom-draft.ts`（客户端安全，**勿** import fs/entities）：① `ATOM_DRAFT_STORE_KEY = "ariadne.atom-draft.v1"`；② 类型 `AtomDraftStore` / `DraftEntry` / `draftKey` 辅助；③ `loadAtomDraftStore` / `setAtomDraft` / `clearAtomDraft` / `clearCardDrafts` / subscribe+notify（对齐 heye-store 模式）；④ SSR / 隐私模式读失败 → `{}`；写失败不抛、须可被 UI 感知；⑤ **单元注释写死**：永不写 study/heye/return 键、永不 verified、永不 PATCH seed | 30–45 |
| **B** | overlay helpers：`applyAtomDraft(seedAtom, entry) → displayAtom`；`applyFieldDraft`；`cardDraftCount(cardId)`；`listIncompleteDraftTargets(card)`（empty prompt/answer 优先，对齐 T55 `incompleteAtoms` 口径——trim 空）；**勿**改 `scoreCard` / cite-ocr 算法；**勿**把 draft 算进 seed 质量分（质量分仍只看 seed，可另显示「本机已有草稿 N」） | 20–35 |
| **C** | patch 导出：`buildAtomDraftPatch(card, store) → string`（JSON pretty）；客户端「复制草稿补丁」按钮（复用 `CopyTextButton` 或同契约）；导出文案注明「人核后自行改 seed / 开 PR · 本浏览器不会写回仓库」；**禁止**任何自动写文件 API；空草稿 → 按钮禁用或诚实「无草稿可导出」 | 25–40 |
| **D** | `AtomDraftEditor`（或内联）客户端岛：编辑 **atom.prompt / atom.answer**（difficulty/id/cite.page **只读展示**，cite.quote 可作可选草稿字段以便贴 T55 建议摘录——**仍只进 draft**）；顶部硬横幅「本机草稿 · 未写回 seed · 不等于抽查 verified · 不等于本机已对」；保存 → `setAtomDraft`；放弃本条 → `clearAtomDraft`；**禁** verified 开关；**禁**「提交到服务器」类 CTA | 35–50 |
| **E** | `EntityCardDetail` **原子**区接入：每原子显示 seed 文案；若有 draft → 琥珀「已改草稿」旁挂 + 显示 overlay 文；incomplete（空 prompt/answer，seed 口径）→ 突出「待补草稿」入口；点「编辑草稿」打开 D；T55 OCR 未见补救块保留，建议摘录可「填入草稿 quote」但**仍只写 draft**；**勿**改 CitePeek / 对页 / LocalProgressStrip 主契约 | 35–50 |
| **F** | `EntityCardDetail` **字段**区（可选但须交最小面）：field.value 可草稿；label 只读；有 draft 旁挂同 E；0 字段诚实句保留（T47）；**勿**借机空表 densify | 20–35 |
| **G** | 卡级草稿条：卡详顶部或原子区上方 — `cardDraftCount>0` 时 muted/琥珀「本卡本机草稿 N · 未写回 seed」+「复制草稿补丁」+「清除本卡草稿」确认；incompleteAtoms>0 且无草稿时引导「可开本机草稿补空字段」（次级文字，非第二大红主 CTA）；ingest / Register incomplete 文案可加次级「到卡详开草稿」（可选链到 `/desk/card/<id>`，**勿**硬阻断 register） | 25–40 |
| **H** | 诚实文案三分列（多处短句，勿营销长文）：① 草稿 ≠ seed；② 草稿 ≠ heye 本机已对；③ 草稿 ≠ study 练分；导出/清除/编辑旁各留一句；隐私模式写失败 → 可见错误，不装已持久化；**禁**掌握%/Due；**禁** ModeChips 插队；**禁** Clew 真写入口 | 15–25 |
| **I** | 装配：`/desk/card/[id]` 所挂 `EntityCardDetail` 接入 D–G；client islands 边界清晰（Server 读 seed，Client 读 draft）；fail-closed 无 window；**勿**毁 T55 补救/cite 徽 · T56 parse/稀 · T57 暗徽 · T58/T60 examinable · T59 density · HeYe orphan · ModeChips · book-pools · StickyPageLoopKeys · shelf 三分列 · CitePeek · deriveMaterialStage | 25–40 |
| **J** | `pnpm --filter web build` PASS；`pnpm cite-check -- ch01` + `parse-check` + `page-check` + `density-check` 回归绿（本刀不改算法仍绿）；**禁止**写 `verified: true`；**禁止**写回 entities/blocks；**禁止**改名 storage keys；**禁止** Clew LLM 真写；heye-only invent **DEFER**；QA 仪表盘 / 批量重抽 / quiz densify **DEFER**；回归 T60–T28；写手不 push；回复须明示合同五禁（新键 · 无 verified · 无 auto PATCH · 无 Clew 真写 · 不改名既有 keys） | 20–30 |

**合计估**：约 **230–390** 分钟（落在 180–300+ MEGA 窗；偏紧可压 F 为「仅 incomplete 原子可编、字段 value 只读旁挂说明 DEFER 下一刀」，**不可**砍 A/B/C/D/E/G/J）。若写手体感超额，优先保 A–E–G–J，F/H 最小面仍须交。

---

## 硬 OUT（本刀 + 站规 forever）

FSRS/Due · Clew LLM 真写 · **写 `verified:true` 过关** · **自动写回 / PATCH entities.json 或 blocks.json** · OCR canvas · CitePeek **正文/trap** redo · ⌘K · Queue→Due · DeskShell 重写 · exam-anchor 全量 · invent heye-only seed · ch08+ · nur-landing · 掌握% · **改名既有 storage keys** · 强制清空整栈 · port ariadnemini verify/clew-API · ModeChips 中插队 · **return densify 当主题** · **empty-CTA densify 当主题** · **重做 T46–T60** · Next.js upgrade 当主题 · 假池 · 只交一行 textarea 无 store/导出就收工 · 写手 push · 硬阻断 register API · 把草稿伪造成 seed 已核或 heye 已对 · 假云端 OCR / 假进度条 · 改 `deriveMaterialStage` · 自动给浅页发明原子 · 吞改 HeYe orphan 分型 · `emptyKind:'dark'` · `emptyKind:'shallow'` · 第四书架徽列 densify · 借机给空池加新大红主 CTA densify · 把 draft 键塞进 progress-port study/heye 包冒充进度。

Soft：heye-only invent **DEFER**；QA 仪表盘页 / 批量重抽队列 UX / quiz·study 深度 densify / 字段草稿进阶（若 F 最小面） / Register API 硬门禁 = leftover → 后续刀；Next.js security = ops not theme。

---

## 建议路径

```
apps/web/lib/atom-draft.ts                     # A · B · C（store + overlay + patch string）
apps/web/components/AtomDraftEditor.tsx        # D 客户端岛（或 EntityCardDetail 内联岛）
apps/web/components/EntityCardDetail.tsx       # E · F · G · H 接入
apps/web/components/CopyTextButton.tsx         # C 复用（勿改坏既有契约）
apps/web/app/(desk)/desk/card/[id]/page.tsx   # I 若需下传 chapterId/incomplete 标记（尽量薄）
# 可选：RegisterMaterialButton / ingest 次级「到卡详开草稿」链（G）——勿硬门禁
# 勿毁：cite-ocr-quality · parse-ocr-coverage · extract-page-coverage · extract-page-density ·
#       examinable-coverage（T58/T60）· T55 补救 · shelf cite/parse/暗 三分列 · Reader 稀>暗>浅 ·
#       ocr-page · book-pools · return-stack · CitePeek · deriveMaterialStage · HeYe orphan 分型 ·
#       study.ts / heye-store.ts 键名与形状
# 勿写：data/cards/*.entities.json · verified:true · Clew 真写 API
# 可复用：incompleteAtoms 口径 · suggestQuoteFromOcr · CopyTextButton · heye-store 订阅模式
```

---

## 验收口令

做完叫验收。A–J 全交才过。
