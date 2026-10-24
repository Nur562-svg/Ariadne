# Ariadne Task 64 — SCOPE（推荐下一刀 · T63 后 · **MEGA** ~180–300+ min）

**定稿**：2026-10-24 18:38 Asia/Shanghai（CST）· **after T63 `c8c8dbc`**  
**调度**：Grok Bot（executor）· 用户「Two tracks… Track C — Scope Task 64 ONLY after push succeeds」· **MEGA** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息 · 不 commit T64 docs**）  
**Tip 前置（硬）**：目标 tip = **`c8c8dbc`**（`docs(pipeline) Task 63 chapter-quality-cockpit-01` atop feat `08da7c4` chapter-quality-cockpit-01 atop `8e5325a` T62 docs）。  
- box `/workspace/Ariadne-push` 与 `origin/main` 定稿时对齐 **`c8c8dbc`**（Track A 已 push 验证 `git ls-remote`）。  
- 开工时 `git log -1 --oneline` 须含 `c8c8dbc` / T63 docs。其下仍含 feat `08da7c4`、T62 `8e5325a`/`b001108`、T61–T28 既有。若仍停在 `08da7c4`（仅 feat）或 `8e5325a` 或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3 max thinking（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。  
**Standing**：验收 PASS 后 **auto-push**（写手/验收方按站规；本 SCOPE 仍不 push）。用户 zcode 配额充足——**刀子必须更大**。

**用户策略（2026-10-24）**：诚实井 T43–T53 已干；**材料→原子 pipeline 脊梁十刀已闭**（T54 detect → T55 remediate → T56 parse → T57 dark → T58 study dark → T59 shallow prod → T60 study shallow → T61 local-draft editor → T62 draft inbox/pack/apply/port → **T63 chapter quality cockpit**）。下一刀必须诚实评估 **人核落盘最后一公里：seed-apply CLI dry-run（永不 write）+ Draft→PR Mac 工作流文档 + DraftInbox 可复制 CLI**——T62 已交 clipboard/md 人核清单，T63 已交章级六信号驾驶舱，但 **缺机器可跑的「对照 seed 干跑」**：人改 entities 前无法验证 pack/guide 与章文件是否一致、缺 Mac PR 步骤诚实文案。若合同能在 A–J MEGA 内写死且杠杆高于其它 leftover，则 **开刀**；否则退下一诚实缺口。**勿**再堆 empty-CTA / return densify，**勿** redo T54–T63（可复用 `buildSeedApplyGuide` / DraftInbox / pack schema / qa-check 报告族），**勿**写 `verified:true` / Clew LLM 真写 / 自动 PATCH entities，**勿**「一键写回仓库」可写模式，**勿**第四书架徽列 densify，**勿**改名既有 storage keys。

---

## 空池 CTA / return / OCR 深链 / T54–T63 井状态（硬声明）

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
**T61 已闭**：`ariadne.atom-draft.v1` · AtomDraftEditor · CardDraftBar · EntityCardDetail overlay · 剪贴板 `ariadne.atom-draft-patch.v1`。**永不 verified / auto PATCH / Clew 真写 / 改名键**。Atom editor **DONE**。  
**T62 已闭**：`DraftInbox` · `ariadne.atom-draft-pack.v1` · `buildSeedApplyGuide` · `ariadne.atom-draft-port.v1`（独立于 progress-port）。**人核落盘；永不一键写回仓库**。Inbox/pack/apply/port **DONE** — **本刀禁止 redo T62 收件箱主路径**（可**扩展** CopyCommand / 次级链，禁止重写 inbox 列表/pack/port 形状）。  
**T63 已闭**：`chapter-quality-rollup` · `ChapterQualityCockpit` · `pnpm qa-check` · desk 六信号驾驶舱。**consume-only；无健康分圆环；无第四书架 densify；无 verified**。Cockpit **DONE** — **本刀禁止 redo T63 驾驶舱 / 重写六信号算法**。  
**本刀不是**又一轮 empty-CTA densify、**不是** return densify、**不是** CitePeek 正文/trap redo、**不是**重做 T46–T63（可**复用** `buildSeedApplyGuide` / pack schema / DraftInbox 链 / qa 报告族，禁止重写算法 / 拆 cockpit / 拆 DraftInbox 主路径）、**不是** Clew LLM 真写、**不是**自动 PATCH seed、**不是** seed-apply **可写**模式、**不是**批量重抽队列 chrome densify、**不是** Register API 硬门禁、**不是** ingest/register 软确认 chrome densify、**不是**第四书架徽列、**不是**视觉 polish 发明刀（视觉尚未由本 SCOPE 驱动；真实视觉缺口另开）。

相邻最强产品主题 = **草稿脊梁闭合后的人核落盘最后一公里：CLI dry-run 对照 seed（永不 write）+ Mac Draft→PR 诚实文档 + DraftInbox 可复制 dry-run 命令**。

---

## 诚实评估 · 候选对照（挑 ONE）

| 候选 | 杠杆 | 风险 | 判定 |
|------|------|------|------|
| **seed-apply CLI dry-run + Draft→PR Mac docs + DraftInbox CLI 面（本刀）** | T63 后最高 leftover：T62 guide 是浏览器 md；无人可跑「对照 entities 干跑」；Mac PR 步骤散落口头。合并两 DEFER 成一条 MEGA 人核闭环。 | 若滑向可写 apply / verified 翻改 / 一键写回 / redo DraftInbox = 拒收。合同可写死「dry-run only + docs」。 | **开作本刀主题** |
| seed-apply CLI dry-run **单独** | 中 | T63 已判「偏 ops；单独不够 MEGA 产品面」 | **拒单独**（必须并 docs + 书桌 CLI 面） |
| Draft→PR Mac docs **单独** | 低 | 薄文档刀 | **拒单独**（并进本刀 C/H） |
| 批量重抽 UX | 低中 | ingest 已有可复制 `pnpm extract`/`parse`；队列 = chrome densify | **拒** |
| Visual/polish knife | — | 视觉尚未由本轮驱动；勿发明缺口 | **拒**（真视觉缺口另开；勿本刀发明） |
| ingest/register soft→human repair densify | 低 | Register 软二次确认已挂 cite/incomplete/parse/dark/shallow；再 densify = chrome | **拒** |
| Register API 硬门禁 | 中 | 站规 Soft leftover；硬阻断易伤本机导入 | **DEFER** |
| invent heye-only | — | OUT 邻域 | **OUT/DEFER** |
| quiz densify / empty-CTA / return densify | 无 | 井饱和 | **拒** |
| 重做 T54–T63 / cockpit / DraftInbox redo | 无 | 刚闭 | **拒** — 只复用 |
| CitePeek / OCR canvas / verified:true / Clew 真写 / FSRS / 改名键 / 掌握% / 健康分圆环 / 第四书架 densify | — | OUT forever | **OUT** |

**结论**：开 **`seed-apply-dry-run-01`**。合同必须写死进 SCOPE / paste / J。若写手滑向可写 apply / verified:true / Clew 真写 / auto PATCH / 改名键 / 第四书架 densify / invent atoms / empty-CTA densify / redo T54–T63 / 「一键写回仓库」= **拒收**。

**残余风险（写进 SCOPE）**：写手加 `--write` / `--apply` 真写 entities、或默认 dry-run 却偷偷写盘、或伪造「已落盘/已核」、或把 dry-run 报告当 seed 真源回写、或 redo DraftInbox 主列表、或借机做批量重抽队列、或 Register 硬阻断 API、或发明视觉 polish = 拒收。缺 pack / 坏 JSON / 缺章 entities 须 fail-closed，不装「已应用 0」。Next.js security = ops not theme。批量重抽 / invent heye-only / Register 硬门禁 / quiz densify / 真视觉缺口 = leftover → 后续刀。

---

## 推荐一刀（ONE · MEGA）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`seed-apply-dry-run-01`** |
| **Title** | 人核落盘干跑 · seed-apply CLI dry-run（永不 write）· Draft→PR Mac 文档 · DraftInbox 可复制 CLI · 永不 verified / PATCH / 一键写回 |
| **体量** | **~180–300+ min** 真实编码（**A–J** = 10 切片 · 3 子主题）。**若只交一篇空 docs 无 CLI dry-run / 无对照 seed 报告就收工 = 漏做 = 拒收**。**若 15–30 / 90 分钟假装收工 = 漏做**。**若滑向可写 apply / verified:true / auto PATCH / 一键写回 / redo DraftInbox/cockpit = 主题偏了，拒收**。 |
| **产品脊梁** | 顾客材料 → OCR → 抽出 → 质量可见（T54–T60）→ 本机草稿+收件箱人核清单（T61–T62）→ 章级驾驶舱（T63）→ **本刀：pack/guide 对照 seed 干跑 CLI + Mac PR 步骤诚实文档 + DraftInbox 可复制 dry-run → 人改 entities / 开 PR（本刀永不代写）**。 |

**一句话**：在 **`c8c8dbc`（T63）** 上，新增 **seed-apply dry-run 纯函数 + `pnpm seed-apply-check` CLI（只读 entities；报告落 `data/qa`）** + **`docs/seed-apply-mac-pr.md` Draft→PR 工作流** + **DraftInbox 次级 CopyCommand/链**。**禁止** empty-CTA densify、return densify、CitePeek 正文/trap redo、重做 T46–T63、写 `verified:true`、自动写 entities/blocks、Clew LLM 真写、FSRS、invent heye-only、ModeChips 插队、Queue→Due、⌘K、DeskShell 重写、改名既有 storage keys、把 draft 塞进 progress-port、第四书架徽列 densify、`emptyKind:'dark'|:'shallow'`、seed-apply **可写**模式、「一键写回仓库」CTA、掌握%、健康分圆环、push。

---

## dry-run-only 合同（硬 · 写进每个字母）

1. **永不写 seed**：CLI / lib **禁止** `fs.writeFile` / rename 到 `data/cards/*.entities.json` / `data/blocks/*` / `config/*`。唯一可写 = `data/qa/<ch-or-run>.seed-apply-dryrun.json`（**报告非真源**，同族既有 qa JSON）。  
2. **永不** `verified: true`：dry-run 条目不得建议/执行翻 verified；报告/docs 明示「人核后自行改 · 不含 verified 翻改」。  
3. **对照真源 = 现有 entities**：读 `data/cards/<chapterId>.entities.json`（与 `buildSeedApplyGuide` seedPath 同口径）；缺文件 / 缺卡 → 条目状态 `missing`，不装成功。  
4. **输入复用 T62 schema**：接受 `ariadne.atom-draft-pack.v1` JSON 文件 / stdin；可选从 guide 字段重建（若做，须与 `buildSeedApplyGuide` 同源，禁止第二套字段语义）。  
5. **结果分列**：`would-change` ≠ `already-matches` ≠ `missing-card` ≠ `invalid-input`。禁止合成「应用成功率%」。  
6. **DraftInbox 只扩展次级面**：CopyCommand / 文档链 / 一行诚实说明；**禁止**重写 inbox 列表、pack 导出、port import、AtomDraftEditor。  
7. **Docs 诚实**：Mac 步骤 = 导出 pack/guide → `pnpm seed-apply-check` 干跑 → 人改 seed → git commit/PR；明示浏览器/CLI **都不会**写回仓库。  
8. **永不** Clew LLM 真写 / invent 原子 / 批量重抽写回 / Register 硬 API 门禁。  
9. **不 redo T54–T63**：禁止重写质量算法、拆 cockpit、拆 DraftInbox 主路径、重做 AtomDraftEditor。  
10. **精炼**：无营销英雄；无「一键应用」朱砂主 CTA；干跑命令用既有 `CopyCommand` 族。

---

## 三子主题

| # | 子主题 | 字母 |
|---|--------|------|
| 1 | dry-run 纯函数 + CLI 孪生 + qa 报告 | A · B · C |
| 2 | Mac Draft→PR 文档 + DraftInbox CLI 面 | D · E · F |
| 3 | 诚实文案 + fail-closed + 装配 | G · H |
| — | 装配收口 + build + DEFER + 回归 | I · J |

---

## 字母一览（A–J）

| 字母 | 切片 | 估分 |
|------|------|------|
| **A** | 新 `apps/web/lib/seed-apply-dry-run.ts`（纯函数，无 fs 写、无 `"use client"`）：① 类型 `SeedApplyDryRunEntry` / `SeedApplyDryRunReport`（cardId · target · field · before · after · status: would-change\|already-matches\|missing-card\|missing-seed-file\|invalid）；② `buildSeedApplyDryRun({ pack\|entries, cardsById\|loadCards })` **只读对照**，零写盘；③ 与 `buildSeedApplyGuide` 字段口径对齐（target/field/before/after）；④ 文件头写死 dry-run-only + 五禁 | 35–50 |
| **B** | CLI 孪生 `scripts/seed-apply-check.mjs` + root `package.json` script **`pnpm seed-apply-check`**：读 `--pack <file>` 或 stdin JSON（`ariadne.atom-draft-pack.v1`）；加载章 entities（只读）；stdout 汇总 would-change / already-matches / missing；写 `data/qa/<stamp-or-ch>.seed-apply-dryrun.json`（note：非 seed · 不回写 verified/entities）；**禁止**任何 `--write`/`--apply` 旗标（有则硬拒或根本不实现） | 40–55 |
| **C** | `.gitignore` 加 `data/qa/*.seed-apply-dryrun.json`；报告 schema 含 generatedAt · packCardCount · counts · entries 摘要；缺 pack → 非零退出 + 诚实错误，不写假绿报告 | 15–25 |
| **D** | 新 `docs/seed-apply-mac-pr.md`（Mac Draft→PR 工作流）：① 书桌 DraftInbox 导出 pack JSON + apply-guide.md；② 本机 `pnpm seed-apply-check -- --pack …` 干跑读报告；③ 按 guide 人改 `data/cards/<ch>.entities.json`；④ `git add` 指名实体文件 → commit → PR；⑤ 硬声明：浏览器/CLI 永不写回 · 不含 verified 翻改 · dry-run 报告 ≠ 已落盘；⑥ 故障：坏 JSON / 缺章文件 / already-matches 无需改 | 30–45 |
| **E** | DraftInbox 次级面：在既有「下载 apply-guide」旁加 `CopyCommand`（或等价）复制 `pnpm seed-apply-check -- --pack ariadne-atom-draft-pack.json`；一行链到 `/docs` 或仓库相对路径说明「Mac：见 docs/seed-apply-mac-pr.md」；**禁止**新「一键写回」按钮；**禁止**重写 inbox 主列表/pack/port | 25–40 |
| **F** | （可选增强，建议交）从本机已下载 pack 路径的粘贴校验：非法 schema 整包拒收提示复用 port 诚实文案族；或 CLI `--guide` 只读校验 guide 与 pack 条数大致一致（勿第二套语义） | 20–35 |
| **G** | 诚实文案：dry-run ≠ applied；报告 `data/qa` ≠ 真源；guide ≠ git apply；pack ≠ seed 已核；禁掌握%/Due；禁 Clew 真写入口；禁营销「自动落盘」；CLI help 首行写死「DRY-RUN ONLY · never writes entities」 | 15–25 |
| **H** | 主题短文 `docs/task-64-seed-apply-dry-run.md`（或并入 D）：slug/title/合同摘要/路径表；与 SCOPE 一致 | 10–20 |
| **I** | 装配：package.json script；DraftInbox 次级 CopyCommand；gitignore；**勿**毁 DraftInbox 主路径 / AtomDraftEditor / CardDraftBar / ChapterQualityCockpit / ProgressPortability / shelf 三分列 / cite/parse/暗/浅算法 / deriveMaterialStage / study/heye 键 / ProgressPayload | 25–40 |
| **J** | `pnpm --filter web build` PASS；`pnpm cite-check -- ch01` + `parse-check` + `page-check` + `density-check` + `qa-check -- ch01` + **`seed-apply-check`**（用夹具 pack 或空/样例；断言不改 entities mtime）回归绿；明示合同；DEFER：批量重抽队列 / invent heye-only / Register 硬门禁 / quiz densify / 真视觉缺口 polish；禁止 verified/写 seed/第四书架/改名键/可写 apply；写手不 push | 20–30 |

**合计估**：约 **235–405** 分钟（落在 180–300+ MEGA 窗；偏紧可压 F 为「不做 guide↔pack 校验」——**不可**砍 A/B/D/E/I/J；C/G/H 最小面仍须交）。若写手体感超额，优先保 A–B–D–E–I–J，C/G/H 最小面仍须交，F 可砍。

---

## 硬 OUT（本刀 + 站规 forever）

FSRS/Due · Clew LLM 真写 · **写 `verified:true` 过关** · **自动写回 / PATCH entities.json 或 blocks.json** · **seed-apply 可写 / `--write` / `--apply` 真写模式** · OCR canvas · CitePeek **正文/trap** redo · ⌘K · Queue→Due · DeskShell 重写 · exam-anchor 全量 · invent heye-only seed · ch08+ · nur-landing · 掌握% · **改名既有 storage keys** · 强制清空整栈 · ModeChips 中插队 · **return densify 当主题** · **empty-CTA densify 当主题** · **重做 T46–T63（含 DraftInbox 主路径 redo / cockpit redo / AtomDraftEditor redo）** · Next.js upgrade 当主题 · 假池 · 只交空 docs 无 CLI dry-run 就收工 · 写手 push · 硬阻断 register API · 把草稿伪造成 seed 已核或 heye 已对 · 假云端 OCR / 假进度条 · 改 `deriveMaterialStage` · 自动给浅/暗页发明原子 · 吞改 HeYe orphan 分型 · `emptyKind:'dark'` · `emptyKind:'shallow'` · **第四书架徽列 densify** · 借机给空池加新大红主 CTA densify · **把 draft 键塞进 progress-port study/heye 包** · 「一键写回仓库」CTA · 合成单一「应用成功率/掌握%」圆环 · **发明视觉 polish 当本刀主题** · ingest/register 软确认 chrome densify 当主题。

Soft：批量重抽队列 UX / invent heye-only / Register API 硬门禁 / quiz·study 深度 densify / 真视觉缺口（待 desk 目视）= leftover → 后续刀；Next.js security = ops not theme。

---

## 建议路径

```
apps/web/lib/seed-apply-dry-run.ts     # A 纯 dry-run（只读对照）
scripts/seed-apply-check.mjs           # B CLI 孪生
package.json                           # B + "seed-apply-check"
.gitignore                             # C + data/qa/*.seed-apply-dryrun.json
docs/seed-apply-mac-pr.md              # D Mac Draft→PR
docs/task-64-seed-apply-dry-run.md     # H 主题短文
apps/web/components/DraftInbox.tsx     # E 次级 CopyCommand / docs 链（最小 diff）
# 勿毁：DraftInbox 主路径 · AtomDraftEditor · CardDraftBar · ChapterQualityCockpit ·
#       ProgressPortability · shelf cite|parse|暗 · cite/parse/dark/shallow libs ·
#       buildSeedApplyGuide 语义 · ClewPane · ModeChips · book-pools · return-stack ·
#       deriveMaterialStage · progress-port study/heye 形状
# 勿写：data/cards/*.entities.json · verified:true · Clew 真写 API · ProgressPayload.draft
# 可写：data/qa/*.seed-apply-dryrun.json（报告非真源）
# 可复用：buildSeedApplyGuide · buildAtomDraftPack · CopyCommand · CopyTextButton ·
#         ATOM_DRAFT_* schemas · qa-check 报告族惯例
```

---

## 验收口令

做完叫验收。A–J 全交才过。
