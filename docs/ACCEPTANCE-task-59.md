# Ariadne Task 59 ACCEPT — pipeline-extract-shallow-density-01

**Verdict**: **PASS**  
**When**: 2026-10-24 15:43 Asia/Shanghai (CST)  
**Acceptor**: Grok Bot (executor) · authorized_by owner「做完了」(t215u / pt215u)  
**Slug**: `pipeline-extract-shallow-density-01`  
**Tip base**: `1b66b9e` (`docs(pipeline) Task 58 acceptance docs`) · feat under it `1c27269`  
**Feat HEAD**: `9a1303addd701bf046aab5aefebfa63a75ed0dd3` · `feat(pipeline) Task 59 pipeline-extract-shallow-density-01`  
**Mac**: `cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**: `/workspace/Ariadne-push` (FF sync after docs commit)  
**Diff vs tip (uncommitted at accept start)**: 8 modified + 4 new · +273/−19 in tracked delta; twin lib + CLI + server new

---

## Theme gate

| Check | Result |
|-------|--------|
| Shallow extract density honesty — substantial OCR + already cited + atom-thin (sixth materials→atoms knife) | **PASS** — twin density lib + density-check CLI + extract post + ingest strip + Register soft + Overview 浅徽 + shelf hang-on + Reader priority |
| Shelf hang shallow on extract-稀/暗行 (NOT 4th independent badge column densify) | **PASS** — shallow旁挂 T57「抽出偏稀」同行；cite\|parse\|dark triad skeleton intact |
| Priority Reader: sparse(T56) > dark(T57) > shallow(this) | **PASS** — chars<40 → T56 only; atomCount=0 → dark; 1≤atom≤2 ∧ chars/atom≥400 → shallow |
| NOT empty-CTA / return densify | **PASS** |
| NOT redo T54–T58 / invent atoms补浅 / merge shallow into dark/sparse/miss | **PASS** — read-only; four concepts分列 |
| NOT 4th shelf badge column densify / hard-4xx Register / verified:true / true atom editor as theme | **PASS** |
| NOT only CLI or only one Overview number | **PASS** — A–H all wired |

---

## Per-letter (file:line)

| Letter | Verdict | Evidence |
|--------|---------|----------|
| **A** | PASS | Twin: `apps/web/lib/extract-page-density.ts` reuses `SPARSE_CHAR_THR` · `SHALLOW_ATOM_MAX=2` · `SHALLOW_CHARS_PER_ATOM=400` · `collectAtomCountByPage` atoms[].cite.page only · `scoreExtractPageDensity` SHALLOW=chars≥thr ∧ 1≤atom≤MAX ∧ chars/atom≥400; dark(atom=0) skip; sparse skip. Mirror `scripts/lib/extract-page-density.mjs` + server `extract-page-density-server.ts` `loadExtractPageDensity` → null if missing. No entities/verified write; no deriveMaterialStage; no T57 dark rewrite; no shallow→cite-miss. |
| **B** | PASS | `scripts/extract-density-check.mjs` · `package.json` `"density-check"` · `.gitignore` `data/qa/*.extract-density.json`. Ran: `pnpm density-check -- --shallow ch01` → 浅 3 · shallowRate 17.6% · weak; 浅页 p.2 / p.6 / p.8 (expect ≥1 including p.6/p.8; p.2 meets). No mutate blocks/entities. |
| **C** | PASS | `scripts/extract_cards.mjs` post-score stderr shallowCount/shallowRate + sample≤8 · default warn still writes · `--strict` OR shallowRate≥0.35 or shallowCount≥5 reject (OR with T54–T57). No invent atoms; extract prompt not overhauled. |
| **D** | PASS | ingest `app/(shell)/ingest/page.tsx` extracted/ready shallow strip (实质/有原子/浅/shallowRate) · weak amber「抽出密度偏稀」+ CopyCommand extract · uploaded/parsed no fake shallow-0 (cards gate) · T54–T58 strips parallel. |
| **E** | PASS | `RegisterMaterialButton.tsx` soft hang-on shallowPages/shallowCount/shallowRate · shallowCount>0 OR into soft confirm · API NOT hard-4xx · miss/incomplete/parseWeak/dark* preserved. |
| **F** | PASS | `DocumentPane.tsx` Overview chapter amber「浅N」when cards+blocks & shallowCount>0 · coexist with 暗D · no cards → no shallow badge. |
| **G** | PASS | Desk shelf `app/(desk)/page.tsx` `bookDensity` hang「浅N」on extract-偏稀/暗行 (same amber chip) · do NOT split cite\|parse\|dark into 4th big column · quiet when good. |
| **H** | PASS | `ChapterPageReader.tsx` shallow hint via `atomCountByPage` · priority 稀>暗>浅 · no CitePeek/OCR canvas. |
| **I** | PASS | Wire: twin lib + CLI + extract + ingest + Register + Overview + shelf + Reader; fail-closed (null/unchecked quiet); T55–T58 / HeYe orphan / ModeChips / book-pools preserved. |
| **J** | PASS | `pnpm --filter web build` PASS (retry after SecurityFatalError). density-check + page/cite/parse-check green. DEFER heye-only / true atom editor T60+ / QA / batch re-extract. No verified:true or entity fill-shallow. Regression T58–T28 OK. |

---

## Build + density/page/cite/parse-check

```
pnpm density-check -- --shallow ch01
→ ch01: 实质页 17 · 有原子页 13 · 浅 3 · shallowRate 17.6% · weak
  浅页 p.2 · 920 字 · 2 原子 · 460 字/原子
  浅页 p.6 · 1633 字 · 1 原子 · 1633 字/原子
  浅页 p.8 · 1282 字 · 1 原子 · 1282 字/原子
  → data/qa/ch01.extract-density.json  (gitignored)

pnpm page-check -- ch01
→ ch01: 页 18 · 实质页 17 · 已cite 13 · 暗 4 · darkRate 23.5% · weak

pnpm cite-check -- ch01
→ ch01: 卡 40 · 原子 57 · 有页 cite 195 · OCR未见 0（missRate 0.0%）· …

pnpm parse-check -- ch01
→ ch01: 期望页 18 · 实有 18 · 空 0 · 稀 1 · 块 683（main 633）· 覆盖率 100.0% · weak

pnpm --filter web build
→ 1st: SecurityFatalError (upgrade nudge) after successful compile+TS+static
→ 2nd retry: EXIT 0 · Next.js 16.4.0 · Compiled + TypeScript + static pages OK
→ warning remains: Next.js known security vulnerability (ops, not theme)
```

---

## Forbidden greps (T59 changed files)

- `verified:true` writes: **none** (prompt schema examples + forbid comments only)
- invent atoms / 补浅: **forbid comments only** — no implementation
- `emptyKind:'dark'`: **none**
- entities PATCH / writeFile entities: **forbid comments only**
- hard-4xx Register: **none**
- deriveMaterialStage rewrite: **comments / pre-existing import only**
- 4th shelf column densify: **comments forbid**; shallow hang-on same extract-偏稀行
- ModeChips mid-session / Queue→Due / mastery%: **none introduced**
- CitePeek / OCR canvas: **untouched**
- card/field cite inflation in collectAtomCountByPage: **none** — atoms[].cite.page only

---

## Residual / Task 60 leftovers

- **True atom editor** still DEFER → T60+
- heye-only invent DEFER
- QA dashboard / batch re-extract queue UX DEFER
- Next.js security upgrade is **ops not theme**
- Do **not** fold historical untracked `docs/task-*` / `.acceptance-*` into this docs set — only task-59 SCOPE/theme/prompts + this ACCEPTANCE
- Do **not** start Task 60 scoping in this accept turn

---

## Verdict

# **PASS**

A–J all PASS · theme PASS · build PASS (retry) · density+page/cite/parse-check PASS · atom-only count · shelf hang-on not 4th column · no invent atoms · no verified:true · Register soft · Reader 稀>暗>浅.

**Source ACCEPT**: `/workspace/reports/ariadne-task-59/ACCEPT.md`
