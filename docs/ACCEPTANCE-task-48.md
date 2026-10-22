# Task 48 Acceptance — desk-review-gate-rail-sticky-01

**Date**: 2026-10-22 (Asia/Shanghai)  
**Repo**: `/Users/nukeab/projects/Ariadne` (Mac · machineId `cc4d11a1-8454-4962-af55-8aa0b70f91fc`)  
**Slug**: `desk-review-gate-rail-sticky-01`  
**Verdict**: **PASS** (A–F + build)

---

## Git state

| Item | Value |
|------|-------|
| HEAD tip | `3bd3401` `feat(desk) Task 47 desk-toc-kind-empty-gate-01` |
| Tip prerequisite | Satisfied — Tip **is** 3bd3401; Task 48 is **uncommitted** local working-tree changes on top |
| Ancestry | `3bd3401` is HEAD (and ancestor of itself) |
| Task 48 form | **Uncommitted** (not a local commit). `git status -sb`: 10 modified files under `apps/web/…`; no staged hunks |
| Diff stat | `10 files changed, 223 insertions(+), 49 deletions(-)` |
| Branch vs remote | `main...origin/main [ahead 16]` (ahead = prior T32–T47 commits). Task 48 itself **not** committed → **not** pushed |
| Push / commit | **None performed** (acceptance only) |

Modified files:
- `apps/web/app/(desk)/desk/card/[id]/page.tsx`
- `apps/web/app/(shell)/entities/[id]/page.tsx`
- `apps/web/app/(shell)/entities/page.tsx`
- `apps/web/components/CardVsStudyLink.tsx`
- `apps/web/components/EntityCardDetail.tsx`
- `apps/web/components/EntitySearch.tsx`
- `apps/web/components/desk/ChapterPageReader.tsx`
- `apps/web/components/desk/DocumentPane.tsx`
- `apps/web/components/desk/StickyHeYeModeTabs.tsx`
- `apps/web/components/desk/StickyStudyModeTabs.tsx`

---

## A–F results

### A CardCard「核 →」pending gate — **PASS**

- `DocumentPane.tsx` `CardCard`: prop `pendingCiteCount?: number`; `(pendingCiteCount ?? 0) > 0` → `Link` `/review?card=&mode=open` + `rememberReturn`; else muted `<span>暂无待核</span>` (fail-closed).
- Parent `DocumentPane` builds `pendingByCard` via `useMemo` from `heyePool` (`for (const it of heyePool ?? []) m[it.cardId]++`); `SectionCards` passes `pendingCiteCount={pendingByCard?.[c.id] ?? 0}` — same pool family as CardHub / `collectCiteQueue`.
- T45 练 gate intact: `card.atoms.length > 0` → 练 Link; else muted `暂无原子` (lines ~124–133).

### B EntitySearch「核」+ pendingByCard — **PASS**

- `entities/page.tsx`: one `collectCiteQueue()` → `pendingByCard` map → `<EntitySearch … pendingByCard={pendingByCard} />`.
- `EntitySearch.tsx`: with `deskBookIds?.[c.id]`, `(pendingByCard?.[c.id] ?? 0) > 0` → Link + `rememberListReturn`; else muted `暂无待核`.
- T45 练 gate remains (`atoms.length > 0` / `暂无原子`). T47 filter-empty honesty not touched by this diff.

### C Chapter rail per-card 核 pending gate — **PASS**

- `ChapterPageReader` gains `pendingByCard?: Record<string, number>`; DocumentPane passes the same heyePool-derived map.
- Rail「核」: `(pendingByCard?.[c.cardId] ?? 0) > 0` → Link; else muted `暂无待核`.
- Page-top 核本页 (`pendingPageCount`) and rail 练 (`c.atomCount > 0`) unchanged in spirit — still present.

### D CardVsStudyLink 0-atom gate — **PASS**

- Desk + shell card pages assemble `confusionAtomCounts[c.id] = c.atoms.length` alongside `confusionLinks`.
- `EntityCardDetail` passes `atomCount={confusionAtomCounts?.[vsId] ?? 0}`.
- `CardVsStudyLink`: `(atomCount ?? 0) === 0` → muted `易混卡暂无原子`; else Link + `rememberFromCardReturn`.

### E StickyStudy/HeYeModeTabs show N — **PASS**

- Both sticky tabs: `countTag = n != null ? <span className="mono …">{n}</span> : null` (omit when pool not ready — no fake positives).
- T41 demote intact: `if (!current && (n === 0 || n == null))` → plain muted span (still shows countTag when ready including 0).
- Comments explicitly keep ModeChips out of mid-session.

### F Overview chapter 练/核 empty-pool + build + heye DEFER — **PASS**

- Overview: `chAtoms` / `chPending` from chapter cards + `pendingByCard`; `chAtoms > 0` → 练本章 Link else `本章暂无原子`; `chPending > 0` → 核本章 Link else `本章暂无待核`.
- `cardCount === 0` → still `本章暂无卡`; T46 0-OCR chapter-open demote still present (`无 OCR 页` pure text).
- No heye-only seed-page invent in Task 48 diff; existing heye-only honesty comments retained.
- **`pnpm --filter web build`**: **PASS** (Next.js 16.4.0 Turbopack; compile + TypeScript + static generation OK; exit 0).

---

## Build

```
pnpm --filter web build  →  PASS (exit 0)
Compiled successfully; TypeScript finished; 6/6 static pages generated.
```

UI live spot-check: **skipped** (build + code evidence sufficient; no local server required for this acceptance).

---

## Regressions / OUT

| Check | Status |
|-------|--------|
| No FSRS / Due | OK — no Due/FSRS introduced |
| No Clew LLM write | OK |
| No CitePeek body/trap redo | OK — not in diff |
| No ModeChips mid-session | OK — sticky comments forbid; no ModeChips insert |
| No return densify as theme | OK — only existing rememberReturn / rememberListReturn / rememberFromCardReturn |
| No redo T43–T47 | OK — T45 练 / T46 OCR / T47 TOC/KINDS surfaces left intact; knife is 核-side + sticky N + vs 0-atom + Overview pools |
| T41 sticky N=0 demote | OK — contract preserved; knife only adds N display |
| heye-only invent DEFER | OK — no seed pages invented |
| No push / no commit | OK |

No OUT violations spotted.

---

## Overall

**PASS** — all slices A–F + build.

### Suggested commit message (DO NOT commit — suggestion only)

```
feat(desk) Task 48 desk-review-gate-rail-sticky-01

CardCard/EntitySearch/rail/Overview 核 empty-pool gates; CardVsStudyLink
0-atom mute; StickyStudy/HeYeModeTabs show countOf N (T41 demote intact).
```

