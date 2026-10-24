# Task 53 ACCEPT — desk-ocr-cite-heye-undo-01

**Verdict: PASS**  
**When:** 2026-10-24 ~11:03 Asia/Shanghai (UTC+8)  
**Tip base:** `2f43ce9` `docs(desk) Task 52 acceptance docs` (ancestor ✓; `HEAD^` == tip)  
**HEAD:** `eefb0e0` `feat(desk) Task 53 desk-ocr-cite-heye-undo-01`  
**Committed:** yes (single feat commit atop tip base)  
**Dirty tracked:** none (feat files clean; many pre-existing untracked docs / `.acceptance-*`)  
**Pushed by acceptor:** no (explicit: do not commit/push)  
**Build:** `pnpm --filter web build` PASS on retry (1st run: compile+tsc+static OK then Next.js `SecurityFatalError` nudge; 2nd: full PASS with security advisory warn). Ops note, not theme fail.

---

## Diff scope (vs `2f43ce9`)

8 files · +214 / −40:

| File | Letters |
|------|---------|
| `apps/web/lib/ocr-page.ts` | A (new) |
| `apps/web/components/CiteChip.tsx` | B |
| `apps/web/components/CitePeek.tsx` | C |
| `apps/web/components/desk/DocumentPane.tsx` | D · I |
| `apps/web/components/HeYeSession.tsx` | E · G · H |
| `apps/web/components/StudySession.tsx` | F |
| `apps/web/components/EntityCardDetail.tsx` | I |
| `apps/web/components/desk/ChapterPageReader.tsx` | I |

Theme drift check: **no** empty-CTA densify theme; **no** return densify; CitePeek diff is **nav-only** (quote/trap/定位/verified untouched); T46–T52 surfaces not redone (Entity only migrated to helper). HeYe batch `b` = **one** undo entry.

---

## A–J

### A — `pageInOcr` + `deskPageHref` helper — **PASS**
- New `apps/web/lib/ocr-page.ts` L12–28.
- `pageInOcr(validPages, page)`: `validPages == null` → `true` (no gate, T52 parity); else `includes(page)`.
- `deskPageHref(bookId, page, validPages?)`: missing book/page → null; `!pageInOcr` → null; else `/desk?book=&page=`.

### B — CiteChip OCR gate → pure-text「本页无 OCR」 — **PASS**
- Import `pageInOcr`; prop `bookValidPages?: number[]` (L19–29).
- `ghostInDesk = known && deskBookId && !pageInOcr(...)` (L38–39) → span `p.N · 本页无 OCR` (L65–72), no Link.
- Viewer path ungated (viewer has own missing-page honesty).

### C — CitePeek「在书桌打开」nav-only gate — **PASS**
- Uses `deskPageHref as buildDeskPageHref`; prop `bookValidPages` (L29–45).
- Nav: `deskPageLink` null + known+deskBookId → muted span「本页无 OCR」(L288–300); else Link + rememberPeekReturn.
- Diff vs tip: **only** import/prop/desk href/nav branch + CiteChip prop pass-through. quote/trap/定位/verified/body **untouched** (OUT honored).

### D — CardCard「对页」via `deskPageHref` — **PASS**
- DocumentPane imports helper; CardCard `bookValidPages?: number[]` (L76–100, L1054–1067).
- Primary cite「对页」: `deskPageHref(bookId, primaryCite.page, bookValidPages)` → Link「对页 →」else span「本页无 OCR」(L140–156).
- Wired from pane `bookValidPages?.[book.id]` (L738, L769, L512).

### E — HeYe「在书桌打开」ghost → pure text — **PASS**
- HeYeSession L896–911: `{pg ? <Link …在书桌打开 p.N →> : <span>p.N · 本页无 OCR</span>}`.
- No Link / no leaveReturn write on ghost; right-pane amber missing-OCR retained.

### F — Study deskBack ghost → book-level「回书桌 →」 — **PASS**
- Import `pageInOcr`; `deskBackPage = raw… && pageInOcr(validPages, …) ? raw : null` (L301–302).
- Ghost/missing → `deskBackHref = deskHref`, label「回书桌 →」(L303–307); in-OCR → `&page=` +「回书桌本页 →」.

### G — HeYe undo stack (markOne + batch `b` = one entry) — **PASS**
- State `undoStack: { keys, prevMarks, idx }[]` (L180–183); component-local, not persisted.
- `markOne`: push one entry `keys=[cur.key]` (L652–655).
- `markSamePage` (b): **single** push with `keys` = all same-page open keys + `prevMarks` map (L661–665) — confirmed ONE entry for batch.
- `undo()`: restore prev / clear undefined keys, pop stack, restore idx; empty = no-op (L676–693).

### H — HeYe SessionKeyHint + onKey u/z — **PASS**
- onKey: `u`/`z` before empty-queue guard → `undo()` (L251–256) so complete-state still undoable.
- SessionKeyHint includes `["u/z", "撤销本轮最后一标"]` (L727–741). No ModeChips mid-insert; no ShortcutSheet rewrite.

### I — Wire-up + Entity `ocrHas` → helper — **PASS**
- EntityCardDetail: `ocrHas = (p) => pageInOcr(bookValidPages, p)`; `deskPageHref` via `buildDeskPageHref` (L128–130); three「对页」sites still via `ocrHas`.
- DocumentPane → CitePeek/CiteChip/CardCard pass `bookValidPages`.
- ChapterPageReader CitePeek: `bookValidPages={readerValidPages}` (L577–585).

### J — build · DEFER · regression — **PASS**
- Build PASS (retry; see header).
- heye-only invent **DEFER** declared in SCOPE/task docs; commit touches no invent/seed files (only HeYeSession UI).
- Regression: T52 Entity OCR gate preserved via helper migrate; Viewer/empty-CTA/return densify not in diff; CitePeek body/trap unchanged; T28–T52 surfaces not rewritten beyond scoped wires.

---

## Residual risks

1. **Next.js security advisory** — ops, not theme; build warns after nudge. Upgrade is separate.
2. **HeYe E uses local `pg` map** (OCR text presence) rather than `pageInOcr(validPages)` — same honesty outcome for「在书桌打开」when right pane has no OCR page; helper not used on that one surface (acceptable parity with pre-existing `pg` gate).
3. **CiteChip ghost href still computed** when not ghost path — fine; ghost branch returns early before Link.
4. **Box mirror lag** — `/workspace/Ariadne-push` still at `2f43ce9`; Mac ahead with `eefb0e0` (+ many untracked docs). Sync needs push (not done by acceptor).
5. **Untracked docs** — Mac has `docs/task-53-*` (SCOPE/spec/trae) untracked; not in feat commit (same pattern as prior tasks).

---

## Commit-ready file list

Already committed in `eefb0e0`:

1. `apps/web/lib/ocr-page.ts`
2. `apps/web/components/CiteChip.tsx`
3. `apps/web/components/CitePeek.tsx`
4. `apps/web/components/desk/DocumentPane.tsx`
5. `apps/web/components/desk/ChapterPageReader.tsx`
6. `apps/web/components/HeYeSession.tsx`
7. `apps/web/components/StudySession.tsx`
8. `apps/web/components/EntityCardDetail.tsx`

Optional follow-up (not required for PASS): track `docs/task-53-SCOPE.md`, `docs/task-53-desk-ocr-cite-heye-undo.md`, `docs/task-53-trae-prompt*.txt` in a docs commit after push of feat.

---

## Blocking auto-push?

| Check | Status |
|-------|--------|
| Wrong tip | **No** — parent is exactly `2f43ce9` |
| Missing letters | **No** — A–J all PASS |
| Build | **PASS** (retry) |
| Dirty tracked feat tree | **Clean** |
| Untracked noise | Yes (historical docs / acceptance dirs) — does not block feat push if push is path-scoped / feat-only |
| Acceptor instruction | **Do not push** this turn |

Standing auto-push after PASS is deferred to parent/ops; this acceptor stop short of push by brief.

---

## Mac notes

- machineId: `cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`
- `git status`: `main...origin/main [ahead 24]` (includes T53 feat + prior unpushed history vs remote)
- `docs/task-53-*` present on Mac (untracked)
