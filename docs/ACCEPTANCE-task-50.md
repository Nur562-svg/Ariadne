# Ariadne Task 50 — ACCEPTANCE

**Slug**: `desk-shelf-continuity-empty-01`  
**Accepted**: 2026-10-24 00:06 Asia/Shanghai (CST)  
**Mac**: `cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Tip base**: `691915a` (`feat(desk) Task 49 desk-ingest-opendesk-citepeek-empty-01`) — **matches**  
**Already committed?**: **NO** — dirty working tree on tip `691915a`  
**Verdict**: **PASS** (A–F all PASS + `pnpm --filter web build` OK)

---

## Dirty files (vs `691915a`)

| Path | Δ |
|------|---|
| `apps/web/app/(desk)/layout.tsx` | +19 / −8 |
| `apps/web/app/(desk)/page.tsx` | +24 / −3 |
| `apps/web/components/LibraryContinuity.tsx` | +58 / −18 |
| `apps/web/components/ShelfBookContinuity.tsx` | +96 / −29 |
| `apps/web/components/desk/Sidebar.tsx` | +71 / −19 |
| `apps/web/lib/book-pools.ts` | **NEW** (untracked) · 54 lines |

Total (tracked diff only): **5 files, +268 / −77**. Plus untracked `book-pools.ts` (core E utility).

**Not in scope / pre-existing untracked noise**: `.acceptance-task*`, many `docs/task-*`, etc. — ignored for this acceptance.

---

## A — ShelfBookContinuity 练本页/核本页 page empty → **PASS**

**Evidence**:
- Props `pageAtomByPage` / `pagePendingByPage` added; healed page lookup fail-closed `?? 0` — `ShelfBookContinuity.tsx:56–73`.
- `pageAtoms === 0` → muted span「本页暂无原子」; `pagePending === 0` →「本页暂无待核」; `>0` keeps Link + `rememberPageReturn` — `:93–118`.
- 「续开 p.N」unchanged cinnabar Link (`deskPageHref`) — `:83–88`.
- Return not broken: `rememberPageReturn` still `saveReturn({ href: deskPageHref, label: \`书桌 p.${page}\` })` — `:77–79`.

---

## B — ShelfBookFooterLinks page-/book-level empty gates → **PASS**

**Evidence**:
- Props `atomCount` / `pendingCount` + page maps — `ShelfBookContinuity.tsx:143–159`.
- Pool select: healed page → page map; else book-level; fail-closed — `:163–165` (in FooterLinks body).
- ===0 → muted「本页暂无原子/待核」or book「暂无原子/暂无待核」; `>0` Link + `rememberFooterReturn` — `:183–216`.
- Strip not touched (`git diff` no LocalProgressStrip).

---

## C — LibraryContinuity 学习环/核页 empty CTA only → **PASS**

**Evidence**:
- `poolsByBook` prop; page-vs-book pool select on `last.page` — `LibraryContinuity.tsx:36–43, 104–109`.
- Empty →「本页暂无原子/待核」or「暂无原子/暂无待核」; `>0` Link + `rememberContinueReturn` — `:141–178`.
- **T47 E 0-OCR shell intact**: `ocrPages` gate,「继续上次（尚无 OCR）→」, ingest secondary, invalid amber / `clearLastOpened` still present — `:72–88, 114–128`. Comment hard-ban:「硬不动 T47 E…」— `:31`.
- No Continuity card shell / heal rewrite.

---

## D — Sidebar 在读「学习/核页」empty gates → **PASS**

**Evidence**:
- `SidebarBook` extended: `atomCount` / `pendingCount` / `pageAtomByPage` / `pagePendingByPage` — `Sidebar.tsx:23–31`.
- Client pool from `currentEntry?.page` vs book-level — `:118–126`.
- Empty muted spans; `>0` Link + `rememberDeskReturn` — `:208–251`.
- PRIMARY/SECONDARY / 换书 disclosure / OCR「无 OCR 页」untouched (only the two study/review CTAs gated).

---

## E — shelf `page.tsx` + desk `layout` assemble + wire → **PASS**

**Evidence**:
- New `apps/web/lib/book-pools.ts`: `collectBookPools` — book-wide `collectCiteQueue` group-by page + card-level cite set × `atoms.length` for page atoms; book totals via `collectStudyAtoms({bookId}).length` / queue length. Same pool family; no fake positives.
- `page.tsx`: builds `poolsByBook`, wires `LibraryContinuity`, `ShelfBookContinuity`, `ShelfBookFooterLinks` — props `poolsByBook` / maps / atom+pending counts.
- `layout.tsx`: `collectBookPools` per book into `sidebarBooks` (`atomCount`, `pendingCount`, page maps); `DeskShellClient` already forwards `SidebarBook[]` unchanged (no DeskShell rewrite).
- Mac `.acceptance-task50/equivalence-check.mjs` exists (seed equivalence self-check; not required for verdict).

---

## F — build / DEFER / regression → **PASS**

**Build**: `pnpm --filter web build` — **PASS** (retry after Next.js security-nudge first-exit). Compiled + TypeScript OK; routes include `/`, `/desk`, `/study`, `/review`, `/ingest`, etc. Soft warning: Next.js known security vulnerability (upgrade reminder only; build continued).

**heye-only**: **DEFER** declared — no invent seed in changed files; no immunology/heye-only seed added.

**No push / no commit** by acceptor (per brief).

**Regression (diff-scope)**:
- CitePeek / IngestReady / Register / ChapterPageReader / LocalProgressStrip / ModeChips / DeskShellClient: **no diff** vs `691915a`.
- Return wiring (`rememberPageReturn` / `rememberFooterReturn` / `rememberContinueReturn` / `rememberDeskReturn` + `saveReturn`) kept on `>0` paths.
- T47 Continuity 0-OCR shell kept (C).
- No FSRS / `verified:true` / storage-key rename / force-clear / ModeChips mid-session / DeskShell rewrite / CitePeek body-trap redo.

---

## Soft notes / DEFER leftovers → T51

| Item | Status |
|------|--------|
| heye-only live pages (immunology-3rd) | **DEFER** — do not invent |
| Clew stub「去学习环/去核页」further densify | soft leftover (out of T50 theme) |
| Next.js security upgrade nudge | soft ops note — not a T50 fail |
| Equivalence script under `.acceptance-task50/` | local only; not committed |

---

## OUT check (none done → OK)

No FSRS/Due, Clew LLM true write, `verified:true`, OCR canvas, CitePeek body/trap redo, ⌘K, Queue→Due, DeskShell rewrite, invent heye-only seed, return densify as main theme, T46–T49 redo, ModeChips mid-session, fake pools, rename storage keys, force-clear stacks.

---

## Verdict

**PASS** — A PASS · B PASS · C PASS · D PASS · E PASS · F PASS (+ build OK).  
Parent may auto-push. Acceptor did **not** commit or push.
