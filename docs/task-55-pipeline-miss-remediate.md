# Task 55 / pipeline-miss-remediate-01 — OCR未见/零原子补救 · 附近 OCR · 重抽命令 · 书架质量徽（zcode · MEGA）

**模型**：zcode · **GLM5.3 max thinking**（brief 格式同历史 Trae paste）  
**仓库**：`/Users/nukeab/projects/Ariadne`（Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`）  
**Tip 前置（硬）**：**`994602f`**（`docs(pipeline) Task 54 acceptance docs`）。  
- `git log -1 --oneline` 须含 `994602f` / T54 docs。若仍停在 `d90d951`（仅 T54 feat）或更早——**停下来对齐，不要开工**。  
- 其后仍须含：feat `d90d951`、T53 `d518876`/`eefb0e0`、T52–T28 既有。  
**前置**：Task 54 + … 已落 tip。**保留** shell-01 + Task 08–54。本任务**不是**又一轮 empty-CTA densify，**不是** return densify，**不是** CitePeek 正文/trap redo，**不是**重做 T46–T54；只做 **材料→原子 pipeline 第二刀：miss/零原子/空原子字段补救面 + 附近 OCR + 重抽可复制 + 书架质量徽**。  
**不 push**（写手）。验收 PASS 后站规 **auto-push**（勿问「推」）。用户 **自行粘贴**（无 auto-paste）。

> **Slug**：`pipeline-miss-remediate-01` · 对照 SCOPE：`/workspace/reports/ariadne-task-55/SCOPE.md`（或仓库 `docs/task-55-SCOPE.md`）。  
> **体量（硬 · MEGA）**：用户「larger knives」+「production path (pipeline over more chrome)」。目标 **约 180–300+ 分钟真实编码**，交 **A–J 全部**（10 切片 · 3 子主题）。**若只做 shelf 徽或只扩 CLI 就收工 = 拒收**。**若 15–30 或 90 分钟内假装收工 = 漏做**。**若做成 empty-CTA / return densify / CitePeek 正文·trap / 写 verified:true / 自动写 entities / 重做 T46–T54 = 主题偏了，拒收**。

先读 `docs/frontend-aesthetics.md`（朱红唯一 · 精炼书桌 · 效用文）。

---

## 背景（为何现在做）

| 已有（T54 @ `994602f` / feat `d90d951`） | 缺口 |
|------------------------------------------|------|
| quoteInOcr / scoreChapter / cite-check / ingest 质量条 / Register 软门禁 / Entity·HeYe·CiteChip「OCR 未见」 | **检测后无补救**：人看不到附近 OCR、不能一键复制重抽、书架弱书同脸 |
| `cardCiteMisses` → qa json（gitignore） | 无 ocrSnippet；desk 不消费 |
| zeroAtomCards 计入 score | 空 prompt/answer **未**计；顾客抽取残缺无门禁 |
| 书架四格 OCR 印刷页 | **无**书级 miss / 完备徽 |

---

## 空池 CTA / return / 深链 / T54 井（写进回复）

**声明**：T43–T51 empty-CTA、T35–T42 return、T52–T53 OCR 深链/撤销、T54 cite↔OCR 检测均已闭或饱和。本刀主题是 **pipeline 补救闭环 + 书架质量扫视**，不是再给练/核 CTA 加空池门禁，不是 saveReturn densify，不是重做 T54 bigram/软门禁骨架，不是自动写 seed。

---

## 切片 A–J（必须全交）

### A · lib 扩展 cite-ocr-quality（~30–45 min）
- 孪生 `apps/web/lib/cite-ocr-quality.ts` + `scripts/lib/cite-ocr-quality.mjs`（**keep in sync**；勿另起 substring 分叉）。  
- `ocrNeighborhood(quote, pageText, opts?)`：在 pageText 上找与 quote 最相关窗（可用 normalize 后滑动 / 最长近似；空页或空 quote → `null`）。返回 `{ snippet: string; approxStart?: number; approxEnd?: number }`。  
- `suggestQuoteFromOcr(...)`：基于 neighborhood 的建议摘录（可与 snippet 同或收紧）；允许简单启发式，**禁止** LLM 调用。  
- 扩展 `cardCiteMisses`：每条增可选 `ocrSnippet?` · `suggestQuote?`（截断 ≤120）。  
- 扩展 `scoreCard` / `scoreChapter` / `CiteQuality`：`emptyPromptAtoms` · `emptyAnswerAtoms` · `incompleteAtoms`（空 prompt ∨ 空 answer 计 1；零原子卡仍走 `zeroAtomCards`，**不**把整卡再记进 incompleteAtoms 重复恐吓——文档写清口径）。  
- **硬禁**：改写 card.verified / 写 entities。

### B · CLI cite-check 明细（~25–40 min）
- 汇总行加完备字段。  
- `--misses`：stdout 逐条 miss（cardId · p · cov · quote · OCR附近）。  
- `data/qa/<ch>.cite-ocr.json` 同步新字段（仍 gitignore）。  
- 可选 `--book <bookId>`：按 `config/books.json` 折叠章为书级一行；无该 flag 保持章级。  
- **禁止**改 `data/cards/*.entities.json`。

### C · extract 后置完备（~15–25 min）
- stderr 兼报 emptyPrompt / emptyAnswer / incomplete。  
- `--strict`：`(missRate>0.4 \|\| zeroAtomCards>0 \|\| incompleteAtoms>0)` → 非零退出且拒覆盖（对齐 T54 fail-closed）。  
- 默认警告仍写。勿大修 extract system prompt（可选一行「atoms.prompt/answer 勿空」）。

### D · ingest 补救面板（~30–45 min）
- extracted/ready 且弱（ocrMiss|zeroAtom|incomplete>0）：章级可展开补救区。  
  - miss 样例 ≤8：链到实体卡、页码、cov、OCR附近 mono。  
  - 零原子卡 id 列表（链）。  
  - `CopyCommand`：`pnpm extract -- <ch>`（多章用已有 missingChapterIds 风格拼命令）。  
- 健壮章（全 0）不渲面板。uploaded/parsed 不装假表。  
- 不重做 T45 N/M · T49 三连 · T54 质量条（质量条保留，面板是增量）。

### E · Register 软门禁扩（~20–30 min）
- `qualityWarn` 增完备字段；`incompleteAtoms>0` 亦触发弱稿二次确认。  
- 琥珀点名「空 prompt/answer」。  
- API 不因质量 4xx。

### F · EntityCardDetail 复制级补救（~25–40 min）
- miss cite：附近 OCR 截断 +「复制建议摘录」按钮（clipboard；不可用则隐藏）。  
- 脚注：建议 ≠ 写回 seed ≠ 改 verified ≠ 本机核页标记。  
- **禁**改 CitePeek quote/trap/定位；**禁**自动 PATCH。

### G · HeYe 附近 OCR（~20–30 min）
- 未见琥珀下：附近一行 +「复制附近」。  
- 匹配 / 无 text：不额外吵。  
- 勿拆 T54 琥珀句、T53 u/z、开桌鬼页、mark 语义。

### H · 书架质量徽（~25–40 min）
- `app/(desk)/page.tsx`：每书折叠章 score（缺文本章未检）。  
- 弱书：琥珀短徽「OCR未见 M」等（Z/K 有则点名）；好书不吵。  
- 可选次级链 `/ingest`。  
- **禁**掌握% / Due 角标 / 圆环。  
- Overview 章行小徽可选（非拒收项，有则加分）。

### I · 装配线（~25–40 min）
- ingest ← misses+score；Register ← 汇总；Entity ← 服务端 miss 明细/snippet map；HeYe ← `pg.text` 现算；书架 ← bookQuality。  
- fail-closed：缺 pageText → 未检不抬假阳。  
- **禁止**造假正数 / 假 OCR 文本。

### J · build · DEFER · 回归（~20–30 min）
1. `pnpm --filter web build` PASS。  
2. `pnpm cite-check -- ch01` 与 misses 模式可跑。  
3. 不要 push。  
4. heye-only invent **DEFER**。  
5. diff **禁止** `verified: true` 写入与 entities 补救写回。  
6. 回归 T54–T28（见 SCOPE 自测 10）。

---

## 硬保留

Task 07–54 + review-fix：书架 DeskShell、开书、三栏、DocumentPane、TOC、Clew stub、CitePeek **正文与 trap**、/review·/study、Sticky*、ocr-page.ts、book-pools、return-stack、各 storage keys、IngestReadyLinks、CopyCommand、T34–T54 已交（含 cite-ocr-quality 口径与 Register 软门禁）。主题是 **pipeline miss 补救 + 书架质量徽**，不是 empty-CTA，不是 return，不是 T46–T54 重做，不是 verified 放宽，不是实体卡自动编辑器。

---

## 不做（硬）

- FSRS / Due / Clew LLM 真写 / **写 verified:true** / **自动写 entities** / 掌握% / invent heye-only  
- 改名 storage keys / 强制清空整栈  
- CitePeek **正文/trap/定位**重做 / OCR canvas / ⌘K / DeskShell 重写 / Queue→Due  
- exam-anchor / ch08+ / nur-landing / ModeChips 会话插队  
- ScopeCounts /「对页」加 return · SessionKeyHint→ShortcutSheet  
- empty-CTA densify / return densify / 重做 T46–T54  
- Register API 硬 4xx 质量拒绝  
- Next.js security upgrade 当主题  
- 假池 / 只交 B 或只做 H 就收工 / 写手 push  
- 发明 atoms.gloss 字段当主题  

---

## 自测（回复须勾）

见 SCOPE 自测 1–10。

---

## 验收口令

**做完叫验收。A–J 全交才过。**
