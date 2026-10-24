# Task 60 ACCEPT — study-shallow-density-01

**Verdict**: **PASS**  
**Accepted**: 2026-10-24 16:12 Asia/Shanghai (CST)  
**Tip baseline (hard)**: `a18ada3` (`docs(pipeline) Task 59 acceptance docs`)  
**HEAD**: `9f3e1439b857b61208efc9c7116ade2ce1466399` — `feat(pipeline) Task 60 study-shallow-density-01`  
**Ancestry**: `a18ada3` is ancestor of HEAD (`git merge-base --is-ancestor` exit 0). Exactly **1** commit after tip: `9f3e143`.  
**Mac**: `cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Branch**: `main` ahead of `origin/main` by 5 commits (includes T60 feat; **not pushed** by acceptor).  
**Working tree (code)**: clean for T60 — feat already committed. Untracked docs only (`docs/task-60-SCOPE.md`, `docs/task-60-study-shallow-density.md`, prompts, older task docs). No uncommitted app code.

---

## Theme verified

Study-loop **consumes** T59 shallow density (mirror T58 consuming dark). Diff vs `a18ada3`: **10 files**, +271/−53. No Reader rewrite; no density/dark algorithm redo; no atom editor.

```
apps/web/lib/examinable-coverage.ts
apps/web/lib/examinable-coverage-server.ts
apps/web/app/(desk)/study/page.tsx
apps/web/app/(desk)/review/page.tsx
apps/web/app/(shell)/ingest/page.tsx
apps/web/components/StudyScopeCounts.tsx
apps/web/components/StudySession.tsx
apps/web/components/HeYeSession.tsx
apps/web/components/IngestReadyLinks.tsx
apps/web/components/desk/DocumentPane.tsx
```

---

## A–J checklist

| L | Verdict | Evidence |
|---|---------|----------|
| **A** | **PASS** | `examinable-coverage.ts`: folds T57 coverage + T59 density via `ExaminableChapterSignals` (L55–58, L68–108). `weak: darkCount > 0` (L102) **≠** `densityWeak: shallowCount > 0` (L107). Adds `shallowCount` / `shallowPages` / `atomPages` / `densityChecked` (L43–51). Fail-closed: missing density chapter skipped (`if (c.density == null) continue` L89), coverage-all-null → null (L72). `pageExaminableHint` priority sparse>dark>shallow>ok (L123–142); shallow uses `atomCountByPage` + imported `SHALLOW_ATOM_MAX` / `SHALLOW_CHARS_PER_ATOM` (no local redefs). Server: `examinable-coverage-server.ts` loads `loadExtractPageDensity` + `collectAtomCountByPage`; `loadPageExaminable` returns `atomCount`. Constants reused: `SHALLOW_ATOM_MAX=2`, `SHALLOW_CHARS_PER_ATOM=400` (`extract-page-density.ts` L25–27), `SPARSE_CHAR_THR=40` (`parse-ocr-coverage.ts` L17). |
| **B** | **PASS** | `study/page.tsx` L602–611: amber `text-status-warn` header「可考密度偏稀 · 浅{shallowCount}…」when `examCoverage?.densityWeak`. |
| **C** | **PASS** | `StudyScopeCounts.tsx` L81–84 hang「· 浅{N} 页可考密度不足」when `densityWeak && shallowCount > 0`. Wired from study L453–454. N=0 segment logic untouched (still `seg` with N=0 pure text). |
| **D** | **PASS** | `study/page.tsx` L612–629: non-orphan × `hint==='shallow'` tip「本页已抽出但原子偏稀」. Orphan×dark T58 path preserved (separate empty-state branch). `pageExam` computed for any `pageNum` (not orphan-only). |
| **E** | **PASS** | `StudySession.tsx` L366–377 (ungradedDone) + L524–535 (complete): shallow hang beside dark; both gated `densityWeak && shallowCount>0`. Dark complete line kept. Props wired study L786–789. |
| **F** | **PASS** | `HeYeSession.tsx` L747–755 hang-on when `pageShallow`. Review parent L321–323 / L628: `pageShallow = !orphanReview && hint==='shallow'`. `emptyKind` type still `"orphan" \| "card-out" \| "true-empty" \| null` (HeYeSession L130) — **no** `'dark'`/`'shallow'`. |
| **G** | **PASS** | `IngestReadyLinks.tsx` L104–113 amber「抽出密度偏稀 · 浅{shallowCount}」beside dark badge. Wired ingest L565 `shallowCount={shallowTotal}`. Soft only — no hard register 4xx. |
| **H** | **PASS** | `DocumentPane.tsx` L912–927 / L969–972: Overview「练本章」`title={chPracticeTitle}` combines darkD + 浅S. T59 production 浅徽 row preserved; **no new 4th shelf column** in T60 diff; **no Reader files** in `a18ada3..HEAD`. |
| **I** | **PASS** | Wired: study / review / ingest / Overview(DocumentPane) + StudyScopeCounts / StudySession / HeYeSession / IngestReadyLinks. Fail-closed density missing. T55–T59 surfaces preserved (cite/parse/dark triad + T59 shallow production hang; orphan×dark; dark complete line). |
| **J** | **PASS** | Build + density/page/cite/parse-check (below). Atom editor **DEFER T61+** — no AtomEditor / `ariadne.atom-draft` / editor UI in diff or tree. Read-only: no `verified:true` writes, no entities PATCH, no invent atoms. |

---

## Build + checks

### `pnpm --filter web build`
- **1st run**: compiled + TS OK; then `SecurityFatalError` (Next.js known vuln nudge) — ops, not theme.
- **2nd run (retry once)**: **PASS** — compiled, TS finished, static generation OK. Warning retained: Next.js security vulnerability advisory (ops leftover).

### `pnpm density-check -- ch01`
```
ch01: 实质页 17 · 有原子页 13 · 浅 3 · shallowRate 17.6% · weak
```

### `pnpm density-check -- --shallow ch01`
```
浅页 p.2 · 920 字 · 2 原子 · 460 字/原子
浅页 p.6 · 1633 字 · 1 原子 · 1633 字/原子
浅页 p.8 · 1282 字 · 1 原子 · 1282 字/原子
```
Seed shallow **≥1** met (**3** = p.2 / p.6 / p.8) — matches SCOPE expectation.

### `pnpm page-check -- ch01`
```
ch01: 页 18 · 实质页 17 · 已cite 13 · 暗 4 · darkRate 23.5% · weak
```

### `pnpm cite-check`
All chapters missRate 0.0% (ch01/03/04/05/06/07) — PASS.

### `pnpm parse-check`
All chapters 100% coverage; ch01 weak (稀 1) — PASS (pre-existing T56 signal).

---

## OUT scan

| OUT item | Result |
|----------|--------|
| empty-CTA densify | **absent** in T60 diff |
| return densify | **absent** |
| CitePeek body/trap redo | **absent** |
| `verified:true` writes | **none** (grep clean) |
| auto PATCH entities | **none** |
| Clew true write | **none** |
| atom editor as theme | **DEFER** — no editor UI |
| redo T46–T59 | **consume only** — density/dark algos untouched; Reader not in diff |
| invent atoms to fill shallow | **absent** |
| `emptyKind:'dark'\|'shallow'` | **absent** — type stays orphan/card-out/true-empty |
| 4th shelf badge column densify | **absent** in T60 (T59 production 浅 hang preserved) |
| merge shallow into darkCount | **no** — separate `shallowCount` / `densityWeak` |
| treat shallow as orphan | **no** — D/F explicitly non-orphan hang |
| FSRS / Due / mastery% | **absent** as theme (existing “非 FSRS” copy only) |
| rename storage keys | **absent** |
| hard-block register | **absent** (soft badge only) |
| only Study one-liner / only ready hang | **no** — A–J full surface |

---

## DEFER note

**True atom field editor → T61+** (again). Commit message documents local-draft-only contract (`ariadne.atom-draft.v1`) for a future knife; this knife does not implement it. No editor chrome in the 10-file diff.

---

## Push readiness

- **Acceptor did NOT push** (per brief).
- **Code commit already on Mac**: `9f3e143` atop `a18ada3` — parent may FF-push without a new feat commit.
- **Uncommitted / untracked (docs only)**: `docs/task-60-SCOPE.md`, `docs/task-60-study-shallow-density.md`, `docs/task-60-trae-prompt*.txt`, plus this `docs/task-60-ACCEPT.md` after copy. Parent may optionally commit acceptance/SCOPE docs as `docs(pipeline) Task 60 acceptance docs` (mirror T59 `a18ada3` pattern) before or after push.
- **Suggested push**: Mac `git push origin main` (or bundle→box FF) for `9f3e143` (+ optional docs commit). Do not rewrite history.

### Commit message (already applied on Mac feat)
```
feat(pipeline) Task 60 study-shallow-density-01

Study-loop shallow density honesty (consumes T59): examinable-coverage
folds coverage+density per chapter (missing density = unchecked, not
shallow-0; shallowCount/shallowPages<=8/atomPages/densityChecked/
densityWeak; weak stays dark-only); pageExaminableHint gains 'shallow'
(sparse > dark > shallow > ok; judged on atoms[].cite.page count via
collectAtomCountByPage, SHALLOW_* constants reused, no second algo);
loadPageExaminable returns atomCount. Study header 浅条 + ScopeCounts
浅S 旁挂 + 本页有原子×浅 D 旁挂 (orphan×dark T58 body untouched) +
StudySession 完成浅句 (并列暗句); HeYe 匹配中浅旁挂 (no emptyKind
shallow/dark, orphan 三态不动); ingest ready 浅S 徽并列暗D (soft,
no hard 4xx); Overview 练本章 title 兼说暗D+浅S (T59 浅徽保留).
Read-only: no verified:true, no entities/blocks write, no invented
atoms, no deriveMaterialStage change; true atom editor DEFER T61+
(local-draft-only contract: ariadne.atom-draft.v1).
```

### Optional docs follow-up (parent)
```
docs(pipeline) Task 60 acceptance docs
```

---

## Paths

- Box: `/workspace/reports/ariadne-task-60/ACCEPT.md`
- Mac: `/Users/nukeab/projects/Ariadne/docs/task-60-ACCEPT.md` (copied)

**Final verdict: PASS** — ready for parent auto-push of `9f3e143` (and optional ACCEPT docs commit).
