# Ariadne Task 51 — ACCEPT

**Slug**: `desk-clew-strip-cross-empty-01`  
**Verdict**: **PASS** (A–J all + build OK)  
**When**: 2026-10-24 00:34 Asia/Shanghai (CST)  
**Mac**: `cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Method**: Diff+build acceptance (no mandatory UI click-through). User said 做完了.  
**Do not commit/push from this acceptance** — parent auto-pushes on PASS.

---

## Tip / base

| | |
|--|--|
| **Base (T50 expected)** | `c99d7ec` (`feat(desk) Task 50 desk-shelf-continuity-empty-01`) — is ancestor of HEAD |
| **Tip (already committed)** | `6744e4b` (`feat(desk) Task 51 desk-clew-strip-cross-empty-01`) · 2026-10-24 00:32:58 +0800 |
| **Committed?** | **Yes** — single commit on `main`; working tree clean for `apps/web` (only unrelated untracked docs/acceptance leftovers) |
| **Ahead of origin** | `main` ahead of `origin/main` by 20 commits (includes this tip; parent auto-push) |
| **Diff vs `c99d7ec`** | 8 files, **+428 / −166** |

### Changed files (exact)

```
apps/web/app/(desk)/review/page.tsx
apps/web/app/(desk)/study/page.tsx
apps/web/components/HeYeSession.tsx
apps/web/components/LocalProgressStrip.tsx
apps/web/components/StudySession.tsx
apps/web/components/desk/ClewPane.tsx
apps/web/components/desk/CrossScopeReturnLink.tsx
apps/web/components/desk/DocumentPane.tsx
```

Scope matches A–J surface list. No DeskShell rewrite, no CitePeek body/trap, no `book-pools`, no Queue→Due, no FSRS, no ModeChips mid-session invent, no invent heye-only seed.

---

## Per-letter

### A — Clew stub「去学习环/去核页」 · **PASS**

`ClewPane.tsx` `send()`: `PlainLink` type + links assembled with `(clew.progressAtoms?.length ?? 0) > 0` / `(clew.progressItems?.length ?? 0) > 0` fail-closed. Empty → muted plain「暂无原子」/「暂无待核」(no href, no return write). `>0` keeps ActionLink + return snapshot. Bubble render branches `"plain" in l` → `<span className="text-xs text-muted">`. 「对页 p.N」unchanged when book+page.

### B — Clew chat empty-state · **PASS**

有书 path:「学习环自测」「核页对页」gated on shared `atomN`/`pendingN` (same progress*口径); ===0 → muted `<span>`「暂无原子/暂无待核」; >0 Link + `rememberClewReturn`.  
无书 cold-start: **removed** trailing「学习环自测」→ bare `/study` (explicit T51 B comment); path stops at 导入→书架→书桌. T44 有书/无书 skeleton kept.

### C — Clew Changes empty/filter-empty CTA · **PASS**

`ChangesPanel`: empty-state dual CTA + filter-empty single-side CTA gated on `atomN`/`pendingN`. ===0 muted plain; >0 Link + `rememberReturn`. T43 filter chips /「还有 N」truncation / act model untouched (comments affirm; no filter redo in diff).

### D — Clew Queue main CTA · **PASS**

`QueuePanel`:「打开核页工作台」→ `pendingN > 0` else plain (`hasPool ? "暂无待核" : "未定位章 · 暂无范围池"`);「去学习环」→ `atomN > 0` else「暂无原子」. Seg N>0/N=0 path retained (seg helper + mode chips still present). Explicit non-Due / non-FSRS comments kept; no Due list invented.

### E — LocalProgressStrip end 练/核 · **PASS**

`studyPoolEmpty = atoms != null && atoms.length === 0`; `reviewPoolEmpty` same for items. When href present but pool empty → muted「暂无原子/暂无待核」; else keep Link + returnTo. Seg / chrome / second counter not reinvented.

### F — DocumentPane header「学习环 · 自评」 · **PASS**

`chapterAtoms.length > 0` → Link + `rememberDeskCardReturn`; else muted「本章暂无原子」. 「练本页」`studyPageScope` gate left as regression-only.

### G — QuizPanel「去核页」 · **PASS**

`items.length > 0` → Link + `rememberReturn`; else muted「暂无待核」. T45 study-side atomCount widen-link semantics untouched in diff (comment only).

### H — sticky CrossScope opposite pool 0 · **PASS**

`CrossScopeReturnLink`: optional `emptyLabel` → muted `<span>` (no click, no return).  
`/study` sticky: `emptyLabel={stripItemKeys.length === 0 ? "同范围暂无待核" : undefined}`.  
`/review` sticky: `emptyLabel={stripAtoms.length === 0 ? "同范围暂无原子" : undefined}`. returnTo wiring intact.

### I — StudySession + study empty cross-review · **PASS**

`StudySession` prop `pendingCount = 0` fail-closed; empty + complete branches「核本卡/去核页」→ plain「本卡暂无待核」/「暂无待核」when ===0; >0 keep + `leaveReturnTo`.  
`study/page.tsx`: empty-atom branch「核本卡」ternary on `heyeItems.length`; `pendingCount={heyeItems.length}` wired. No fake positive counts.

### J — HeYeSession cross-study + build + DEFER + regression · **PASS**

`HeYeSession` prop `atomCount = 0`; empty + complete「去学习环/去学习本卡」gated →「同范围暂无原子」/「本卡暂无原子」.  
`review/page.tsx` `crossStudyAtomCount` from same-scope `collectStudyAtoms` / `pageStudyAtoms` / `stripAtoms` (heye-only page → 0, no chapter lie).  
**heye-only**: DEFER — no invent seed in diff (only comment that heye-only page counts 0 honestly).  
**Build**: `pnpm --filter web build` — compile + TS + static gen OK (see below).  
**Regression (spot via file set + OUT keyword scan)**: T50–T28 surfaces not rewritten; ModeChips not mid-session injected; CitePeek body/trap untouched; Queue still non-Due; leaveReturn/sticky return wiring kept.

---

## Build

```
pnpm --filter web build
```

1st run: compile/TS/pages OK, then Next.js **SecurityFatalError** nudge (known ops; SCOPE marks Next.js upgrade as non-theme).  
2nd run (retry): **exit 0** — Compiled successfully; TypeScript OK; static pages 6/6.

Soft ops note for parent/user (not a FAIL): Next.js 16.4.0 security upgrade recommendation remains; ask user separately if they want `next upgrade --agent=security` in a worktree. Not part of Task 51 theme.

---

## OUT check (FAIL if done) — clean

| OUT | Evidence |
|-----|----------|
| FSRS / Due / Queue→Due | Queue comments + UI still「非 Due / 非 FSRS」; no Due list |
| Clew LLM true write / verified:true | Not in diff |
| OCR canvas / CitePeek body·trap redo / ⌘K | Not touched |
| DeskShell rewrite | Not in file list |
| invent heye-only | DEFER only; page count→0 honest |
| return densify as theme / redo T46–T50 | Only empty-pool gates; no shelf/book-pools/CitePeek/ingest rewrite |
| ModeChips mid-session | HeYeModeChips call site unchanged functionally |
| only A–D or only Strip | A–J all present across 8 files |

---

## Soft notes / DEFER → T52+

- **heye-only 活页**: still **DEFER** (J) — do not invent seed.
- **Next.js security upgrade**: ops leftover (build nudge); not Task 51.
- No new product soft leftover called out beyond standing DEFERs; T50 Clew stub leftover is closed by A (+B/C/D package).

---

## Verdict

**PASS** — A B C D E F G H I J all PASS; build OK; tip `6744e4b` on base `c99d7ec`; already committed; **no commit/push from acceptance**.
