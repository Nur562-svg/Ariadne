# Ariadne Task 55 — SCOPE（推荐下一刀 · T54 后 · **MEGA** ~180–300+ min）

**定稿**：2026-10-24 11:32 Asia/Shanghai（CST）· **after T54 `994602f`**  
**调度**：Grok Bot（executor）· 用户「Scope and write Ariadne Task 55 — MEGA knife… Prefer continue materials→atoms pipeline next MEGA, not desk chrome densify」· **MEGA** 刀（本 SCOPE **不 push · 不启动 zcode · 不实现 · 不给用户发消息**）  
**Tip 前置（硬）**：目标 tip = **`994602f`**（`docs(pipeline) Task 54 acceptance docs` atop feat `d90d951` pipeline-cite-ocr-quality-01）。  
- box `/workspace/Ariadne-push` 定稿时停在 **`994602f`**（`origin/main` 对齐）。  
- 开工时 `git log -1 --oneline` 须含 `994602f` / T54 docs。其下仍含 feat `d90d951`、T53 `d518876`/`eefb0e0`、T52–T28 既有。若仍停在 `d90d951`（仅 feat）或更早——**停下来对齐，不要开工**。  
**Mac**：`cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**：`/workspace/Ariadne-push`  
**主写手**：zcode · GLM5.3 max thinking（brief 格式与既有 Trae paste 同族；用户自行粘贴 · **无 auto-paste**）。**不 push** · **不由本 SCOPE 启动实现**。  
**Standing**：验收 PASS 后 **auto-push**（写手/验收方按站规；本 SCOPE 仍不 push）。用户 zcode 配额充足——**刀子必须更大**。

**用户策略（2026-10-24）**：诚实井 T43–T53 已干；T54 已交 **检测**面（cite↔OCR 机检 + ingest 质量条 + 注册软门禁 + 卡详/核页「OCR 未见」）。下一刀必须走 **生产补救闭环**（看得见 miss → 能定位附近 OCR → 能复制重抽/建议摘录 → 书架看得出弱书）——**勿**再堆 empty-CTA / return densify，**勿** redo T54 算法骨架，**勿**写 `verified:true` / Clew LLM 真写。

---

## 空池 CTA / return / OCR 深链 / T54 井状态（硬声明）

**Empty-pool CTA densify 已饱和（T43–T51）**。  
**Return densify 已饱和（T35–T42）**。  
**T52–T53 已闭**：空·完成对称 / Quiz 书空 / Viewer←书桌 / Entity「对页」/ `pageInOcr` 鬼页 / HeYe u/z。  
**T54 已闭**：`cite-ocr-quality` 孪生 lib · `pnpm cite-check` · extract `--strict` · ingest 质量条 · Register 软门禁 · Entity/HeYe/CiteChip「OCR 未见」。**不写 verified:true**。  
**本刀不是**又一轮 empty-CTA densify、**不是** return densify、**不是** CitePeek 正文/trap redo、**不是**重做 T46–T54（可**扩展** miss 明细 / 完备计数，禁止重写 bigram 骨架或拆软门禁）。

相邻最强产品主题 = **材料→原子 pipeline 第二刀：OCR未见/零原子/空 prompt·answer 补救面 + 附近 OCR 摘录 + 重抽命令可复制 + 书架书卡质量徽**（**不**自动改 entities、**不**翻 `verified:true`、**不** Clew LLM 真写、**不** FSRS）。

---

## 诚实评估 · 残余风险

desk-v4 诚实井已薄；T54 把「弱稿」**点名**了，但日用仍缺**补救路径**与**书库级扫视**：

| # | 面 | 撒谎 / 缺口 |
|---|----|-------------|
| ① | `cardCiteMisses` | 只有 cardId/page/coverage/截断 quote——**无**该页 OCR 附近窗，人无法对照改摘录 |
| ② | ingest 质量条 | 只报章级 M/K/Z；**无** miss 样例列表、**无**零原子卡 id 链、**无**「下一步重抽」CopyCommand |
| ③ | 原子完备 | score 只计 zeroAtomCards；**不计**空 `prompt` / 空 `answer`（顾客抽取出常见残缺，seed 目前干净不代表产品门禁在） |
| ④ | Entity / HeYe | 已琥珀「OCR 未见」——**停在警告**；无附近 OCR、无「复制建议摘录」（人仍要肉眼翻整页） |
| ⑤ | 书架 / 书卡 | 四格有 OCR 印刷页——**无**书级 missRate / OCR未见徽；弱书与好书同脸 |
| ⑥ | CLI | `pnpm cite-check` 已可多章；报告 gitignore——desk **读不到**；缺 `--misses` 人读明细与书级汇总 |

捆成 **ONE MEGA**：**扩展**质量 lib（附近 OCR + 原子完备）→ CLI 明细/书级 → ingest 补救面板 → Entity/HeYe 复制级补救 → 书架质量徽。**禁止**把 `verified` 翻成 `true`；**禁止**写回 entities.json（本刀补救 = 展示 + 剪贴板，人改 seed / 重跑 extract）。

**残余风险（写进 SCOPE）**：若写手把本刀做成又一轮 empty-CTA / return densify、或 CitePeek 正文/trap redo、或重做 T54 bigram/软门禁骨架、或偷偷写 `verified:true` / 自动 PATCH entities / Clew LLM 真写 = 拒收。OCR 附近窗须**只读** pageText，勿编造。建议摘录 = 启发式（最长公共子串 / 高覆盖窗），文案点名「建议 · 人核后再贴」，**禁止**一键写回 seed。Register 仍软门禁（可扩 incomplete 条件）；API 硬 4xx 仍 leftover。Next.js security = ops not theme。heye-only invent 仍 DEFER。

---

## 推荐一刀（ONE · MEGA）

| 字段 | 值 |
|------|-----|
| **Id / slug** | **`pipeline-miss-remediate-01`** |
| **Title** | OCR未见/零原子/空原子字段补救 · 附近 OCR + 重抽命令 · Entity/HeYe 复制级补救 · 书架质量徽 |
| **体量** | **~180–300+ min** 真实编码（**A–J** = 10 切片 · 3 子主题）。**若只做 shelf 徽或只扩 CLI 就收工 = 漏做补救面 = 拒收**。**若 15–30 / 90 分钟假装收工 = 漏做**。 |
| **产品脊梁** | 顾客材料 → 抽出后**看得见 miss**（T54）→ **本刀：找得到附近 OCR、复制得了重抽/建议摘录、书架扫得出弱书** —— 不自动污染 seed、不假翻 verified。 |

**一句话**：在 **`994602f`（T54）** 上，**扩展** `cite-ocr-quality`（附近 OCR 窗 + 原子完备计数），让 **CLI 明细/书级汇总**、**ingest 补救面板（miss 样例 + 零原子链 + CopyCommand 重抽）**、**Entity/HeYe 复制级补救**、**书架书卡质量徽** 同真落地。**禁止** empty-CTA densify、return densify、CitePeek 正文/trap redo、重做 T46–T54、写 `verified:true`、自动写 entities、Clew LLM 真写、FSRS、invent heye-only、ModeChips 插队、Queue→Due、⌘K、DeskShell 重写、push。

**为何选这主题（对照候选）**：

| 候选 | 判定 |
|------|------|
| **miss 补救 + 原子完备 + 书架徽（本刀 · A–J）** | T54 检测后最高杠杆**生产闭环**；天然 MEGA；落在 pipeline + 日用核页 |
| 纯 chapter QA dashboard 把 data/qa 渲进 desk | 偏薄；本刀用 ingest 面板 + CLI 明细覆盖扫视，不另开 chrome 仪表盘主题 |
| 纯 parse→extract 阶段诚实（uploaded/parsed 再 densify） | 阶段命令已有；杠杆低于 miss 补救 |
| 纯 atom gloss/definition 完备 | schema 无 gloss（atoms = prompt/answer）；空字段并入本刀完备计数即可 |
| 纯 cross-chapter cite-check batch | CLI 无参已批跑；本刀加书级汇总 + 书架徽，不单做 batch |
| 又一轮 empty-CTA / return densify | **拒** — 井饱和 |
| 重做 T54 bigram / Register 软门禁 / OCR 未见条 | **拒** — 刚闭；只**扩展** |
| CitePeek 正文/trap / OCR canvas / 写 verified:true / Clew 真写 | **OUT forever** |
| FSRS / Queue→Due / invent heye-only | **OUT / DEFER** |
| Next.js security upgrade | **ops** — 非主题 |

---

## 三子主题

| # | 子主题 | 字母 |
|---|--------|------|
| 1 | 质量 lib 扩展（附近 OCR + 原子完备）+ CLI 明细/书级 | A · B · C |
| 2 | ingest 补救面板 + Register 软门禁扩 incomplete | D · E |
| 3 | Entity/HeYe 复制级补救 + 书架质量徽 | F · G · H |
| — | 装配 + build + DEFER + 回归 | I · J |

---

## 字母一览（A–J）

| 字母 | 切片 | 估分 |
|------|------|------|
| **A** | 扩展孪生 `cite-ocr-quality`（**keep in sync**）：① `ocrNeighborhood(quote, pageText, radius?)` → `{ snippet, start, end }`（只读；空页→null）；② `suggestQuoteFromOcr(...)` 启发式建议摘录（可与 neighborhood 同窗；文案侧标明建议）；③ `cardCiteMisses` 增 `ocrSnippet?` / `suggestQuote?`（截断合理，≤120 字级）；④ `scoreAtomFields(card)` / 并入 `scoreCard`·`scoreChapter`：累计 `emptyPromptAtoms` · `emptyAnswerAtoms` · `incompleteAtoms`（空 prompt∨空 answer）· 既有 `zeroAtomCards`；`CiteQuality` 类型同步扩字段（默认 0，勿破 T54 调用方） | 30–45 |
| **B** | CLI `cite-ocr-check.mjs`：① 默认汇总行加 `空prompt/空answer/不完备原子`；② `--misses`（或 `MISS=1`）打印每条 miss：cardId · p.N · cov · quote · OCR附近；③ 报告 `data/qa/<ch>.cite-ocr.json` 同步写 `missSamples[].ocrSnippet` + `summary` 新字段；④ 可选书级：若 `--book <id>` 读 `config/books.json` 折叠多章一行（无 book 时保持章级）；**禁止**改 entities | 25–40 |
| **C** | `extract_cards.mjs` 后置：stderr 兼报 `emptyPrompt/emptyAnswer/incomplete`；`--strict` 额外在 `incompleteAtoms>0`（或 emptyPrompt+emptyAnswer>0）时拒写（与 missRate/zeroAtom **或** 关系）；默认仍警告可写；**不**改 extract prompt 大修（可一行提醒模型勿空 answer——可选、非必须） | 15–25 |
| **D** | ingest 补救面板（extracted/ready 且 `ocrMiss|zeroAtom|incomplete>0`）：① 章下可展开「补救」——顶层 miss 样例 ≤8（cardId 链到 `/entities/<id>` 或 desk/card、page、cov、OCR附近 mono 截断）；② 零原子卡 id 列表（链）；③ `CopyCommand`：`pnpm extract -- <ch>`（及多章缺失时的联合命令，复用 T45 命令块族）；uploaded/parsed **不**装假补救表 | 30–45 |
| **E** | Register 软门禁扩：`qualityWarn` 增 `emptyPromptAtoms?` · `emptyAnswerAtoms?` · `incompleteAtoms?`；触发条件保留 `missRate≥0.25 \|\| zeroAtomCards>0`，**另加** `incompleteAtoms>0`；琥珀文案点名不完备原子；二次「仍要注册」不变；API **不**硬 4xx | 20–30 |
| **F** | EntityCardDetail：OCR 未见 >0 时，诚实条下或逐条 cite 旁——对 miss cite 显「附近 OCR」截断 +「复制建议摘录」按钮（clipboard；无 clipboard 则隐藏按钮，对齐 CopyCommand 诚实）；脚注：建议摘录 **不会**写回 seed / **不会**改 verified；**禁**改 CitePeek quote/trap/定位 | 25–40 |
| **G** | HeYeSession：既有未见琥珀下增 OCR 附近一行 mono +「复制附近」；匹配/无 text 不吵；**不**改 mark / undo / verified；**不**自动标「本机已对」 | 20–30 |
| **H** | 书架书卡质量徽：对每书 `scoreChapter` 折叠其 `chapterIds`（缺 OCR 文本章计「未检」不抬假阳）→ 若 `ocrMiss>0 \|\| zeroAtomCards>0 \|\| incompleteAtoms>0`：四格旁或下方琥珀短徽「OCR未见 M」或「质量偏弱 · 未见 M · 零原子 Z · 空原子字段 K」；M=Z=K=0 不吵；链次级「去物料」→ `/ingest`（可选）；**勿**掌握% / Due 角标 / 假圆环 | 25–40 |
| **I** | 装配：ingest D←A score+misses；Register E←章集合汇总；Entity F 预计算 miss 明细（服务端算 snippet，免整章 OCR 塞客户端——可只对 miss cites 下传 snippet map）；HeYe G 用当前 `pg.text` 现算 neighborhood；书架 H 在 `app/(desk)/page.tsx` 服务端算 bookQuality；Overview 章行**可选**一行小徽（非必须，有则加分）；fail-closed：缺 pageText → 未检 | 25–40 |
| **J** | `pnpm --filter web build` PASS；`pnpm cite-check -- ch01` 与 `pnpm cite-check -- --misses ch01`（或等价）可跑；heye-only invent **DEFER**；**禁止**写 `verified: true`、**禁止**写回 entities 补救；回归 T54–T28；写手不 push | 20–30 |

**合计估**：约 **235–365** 分钟（落在 180–300+ MEGA 窗偏上；偏紧可压 C 的 prompt 提醒与 H Overview 可选徽，**不可**砍 A/B/D/F/G/H）。若写手体感超额，优先保 A–B–D–E–F–G–H–J，C 最小 stderr+strict 或，I 按需。

---

## 硬 OUT（本刀 + 站规 forever）

FSRS/Due · Clew LLM 真写 · **写 `verified:true` 过关** · **自动写回 / PATCH entities.json 当补救** · OCR canvas · CitePeek **正文/trap** redo · ⌘K · Queue→Due · DeskShell 重写 · exam-anchor 全量 · invent heye-only seed · ch08+ · nur-landing · 掌握% · 改名 storage keys · 强制清空整栈 · port ariadnemini verify/clew-API · ModeChips 中插队 · **return densify 当主题** · **empty-CTA densify 当主题** · **重做 T46–T54**（拆 bigram / 拆软门禁 / 重做 OCR 未见条） · Next.js upgrade 当主题 · 假池 · 只交 CLI 或只交 shelf 徽就收工 · 写手 push · ScopeCounts/「对页」加 **return** · SessionKeyHint→ShortcutSheet 大改 · 硬阻断 register API · 用 substring-only 代替 bigram · 把「OCR 未见」或建议摘录伪装成 seed verified · 假 gloss 字段发明。

Soft：heye-only invent **DEFER**；Next.js security = ops not theme；Register API 硬门禁 / 真·实体卡内联编辑器 = leftover → 后续刀；纯 QA 仪表盘页 = 非本刀主题。

---

## 建议路径

```
apps/web/lib/cite-ocr-quality.ts              # A 扩展（neighborhood / suggest / atom fields / misses 增字段）
scripts/lib/cite-ocr-quality.mjs              # A 孪生 keep in sync
scripts/cite-ocr-check.mjs                    # B --misses · 汇总新字段 · 可选 --book
scripts/extract_cards.mjs                     # C 后置完备 + strict 或
apps/web/app/(shell)/ingest/page.tsx          # D · I 补救面板
apps/web/components/RegisterMaterialButton.tsx # E qualityWarn 扩
apps/web/components/EntityCardDetail.tsx      # F 附近 OCR + 复制建议
apps/web/components/HeYeSession.tsx           # G 附近 + 复制
apps/web/app/(desk)/page.tsx                  # H 书架质量徽
apps/web/components/CopyCommand.tsx           # 复用（D/F/G）；勿重造除非变体
apps/web/components/desk/DocumentPane.tsx     # I 可选 Overview 章行小徽
# 勿毁：T54 quoteInOcr/scoreChapter 口径 · ocr-page.ts · book-pools · return-stack · CitePeek quote/trap
# 勿写：data/cards/*.entities.json（含 verified / quote 自动改写）
# 可写：data/qa/<ch>.cite-ocr.json（报告仍 gitignore；字段变丰富）
```

---

## 自测（须勾 · 摘要）

1. `ocrNeighborhood` 有命中窗 → 非空 snippet；空页 → null；与 `quoteInOcr` 同页口径  
2. `scoreChapter` 含 `emptyPromptAtoms/emptyAnswerAtoms/incompleteAtoms`；旧字段仍在  
3. `pnpm cite-check -- ch01` 汇总含完备字段；`--misses` 打出 OCR附近；entities 未改  
4. extract `--strict` 在 incomplete>0 或既有 miss/zero 条件拒写；默认只警告  
5. ingest · 弱章见补救面板（样例+零原子链+CopyCommand）；健壮章不吵；uploaded 无假表  
6. Register · incomplete>0 也走二次确认；API 不 4xx  
7. Entity · miss 见附近 OCR + 复制建议；复制后 seed/verified **未**变；CitePeek 正文/trap 未毁  
8. HeYe · 未见下有附近+复制；匹配无；T54 琥珀与 T53 u/z 未毁  
9. 书架 · 弱书琥珀徽；好书无徽；无掌握%/Due  
10. build PASS；cite-check 可跑；未 push；heye-only DEFER；无 verified/entities 写入；回归 T54–T28  

---

## 验收口令

**做完叫验收。A–J 全交才过。**
