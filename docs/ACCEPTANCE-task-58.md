# Ariadne Task 58 ACCEPT — study-examinable-coverage-01

**Verdict**: **PASS**  
**When**: 2026-10-24 14:55 Asia/Shanghai (CST)  
**Acceptor**: Grok Bot (executor) · authorized_by owner「做完了」(t214u / pt214u)  
**Slug**: `study-examinable-coverage-01`  
**Tip base**: `1b609dc` (`docs(pipeline) Task 57 acceptance docs`) · feat under it `9b32776`  
**Feat HEAD**: `1c2726994e0abb95f14a956418b3ecfb6dbef8ea` · `feat(pipeline) Task 58 study-examinable-coverage-01`  
**Mac**: `cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Box**: `/workspace/Ariadne-push` (FF sync after docs commit)  
**Diff vs tip (feat)**: 9 files · +288 / −15 · single feat commit atop `1b609dc` (ancestor ✓)

---

## Theme gate

| Check | Result |
|-------|--------|
| Study-loop examinable coverage honesty — consume T57 dark signals so Study/HeYe/ready/练入口 show「池内原子 ≠ 材料已覆盖」 | **PASS** — thin examinable-coverage adapter + Study header/orphan/complete + HeYe orphan hang + ready triad + Overview 练 title |
| NOT empty-CTA densify / return densify as theme | **PASS** — no new primary empty CTA; N=0 logic untouched; orphan CTA unchanged |
| NOT redo T54–T57 dark algo / merge shelf badges / break remediate | **PASS** — consumes `loadExtractPageCoverage` / `collectCitedPages` / `SPARSE_CHAR_THR`; no second dark scorer; cite\|parse\|dark triad untouched |
| NOT emptyKind:'dark' / swallow orphan CTA | **PASS** — HeYe `emptyKind` still orphan\|card-out\|true-empty; orphanDark hang-on only |
| NOT verified:true / auto PATCH / true atom editor as theme | **PASS** — read-only; no entities writes; atom editor still DEFER T59+ |
| NOT only header line or only ready hang | **PASS** — A–H all wired (Study B+C+D+E, HeYe F, ready G, Overview H) |

---

## Per-letter (file:line)

| Letter | Verdict | Evidence |
|--------|---------|----------|
| **A** | PASS | `apps/web/lib/examinable-coverage.ts` foldExaminableCoverages + pageExaminableHint (substantial/cited/darkCount/darkPages/examinableRate/weak; missing→null rate; SPARSE from parse-ocr). Server `examinable-coverage-server.ts` scopeExaminableCoverage → loadExtractPageCoverage per chapter; loadPageExaminable → collectCitedPages. No entities/verified write; no deriveMaterialStage change; no second dark algo. |
| **B** | PASS | `study/page.tsx` weak → amber「可考覆盖偏稀 · 暗D · …」; quiet when good/null; single-card scope skip (`examChapterIds=null`); no mastery%/Due; no solid chip densify. |
| **C** | PASS | Same amber line merges B+C semantics（覆盖偏稀 + 暗页未进可练池）; StudyScopeCounts hang unchanged; N=0 / ModeChips untouched. |
| **D** | PASS | orphanStudy + hint==='dark' → body names substantial OCR uncites + /ingest + page-check; sparse optional light tip; non-dark orphan keeps existing; true-empty/no-book not rewritten; no new primary CTA. |
| **E** | PASS | StudySession examinableWeak/darkCount → amber「评完池内 · 仍有暗页」on ungradedDone + complete; main CTA not强推补暗; no verified/PATCH. |
| **F** | PASS | review orphanDark via loadPageExaminable; HeYeSession orphan + orphanDark → one amber hang-on; emptyKind unchanged; card-out/true-empty not swallowed. |
| **G** | PASS | IngestReadyLinks darkCount →「抽出偏稀 · 暗D」on 学习环; ingest passes darkTotal; T49 gates intact; no block open desk; no Register hard 4xx. |
| **H** | PASS | DocumentPane Overview 练本章 title when chExaminable.weak; chExaminable shared with T57 dark徽; Reader file not in knife (no double-noise vs T57 dark hint); shelf cite\|parse\|dark triad skeleton untouched. |
| **I** | PASS | Wire: study/review/ingest/Overview + HeYe/StudySession/IngestReadyLinks; fail-closed (null/unchecked quiet); T55–T57 / HeYe orphan / ModeChips / book-pools / StickyPageLoopKeys preserved. |
| **J** | PASS | `pnpm --filter web build` PASS (retry after SecurityFatalError). page-check + cite-check + parse-check green. DEFER heye-only / true atom editor T59+ / QA / shallow density. No verified:true or entity fill-dark. Regression T57–T28 OK. |

---

## Build + page/cite/parse-check

```
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

## Forbidden greps (diff `1b609dc..1c27269`)

- `verified:true` writes: **none**
- `emptyKind:'dark'`: **none** (comments only forbid it)
- entities PATCH / writeFile entities: **none**
- second dark algo / SPARSE drift: **none** — consumes T57 loadExtractPageCoverage + collectCitedPages
- empty-CTA / densify theme: **none**
- ModeChips mid-session / Queue→Due / mastery%: **none introduced**
- deriveMaterialStage rewrite: **comments only**
- CitePeek / canvas: **untouched**

---

## Residual / Task 59 leftovers

- **True atom editor** still DEFER → T59+
- heye-only invent DEFER
- QA dashboard / batch re-extract queue UX / shallow density DEFER
- Next.js security upgrade is **ops not theme**
- Do **not** fold historical untracked `docs/task-*` / `.acceptance-*` into this docs set — only task-58 SCOPE/theme/prompts + this ACCEPTANCE
- Do **not** start Task 59 scoping in this accept turn

---

## Verdict

# **PASS**

A–J all PASS · theme PASS · build PASS (retry) · page/cite/parse-check PASS · consumes T57 not fork · no emptyKind dark · no verified:true · HeYe orphan CTA intact · ready hang + Study surfaces (not header-only).

**Source ACCEPT**: `/workspace/reports/ariadne-task-58/ACCEPT.md`
