# Ariadne Task 07 Acceptance — shell-01 library + honest ingest + /study

**Verdict: PASS**

**Date:** 2026-10-18 ~14:50 CST (Asia/Shanghai)  
**Machine:** box mirror `/workspace/Ariadne-push` @ `989103a` (origin/main tip before Task 08 brief is `24ab853`)  
**Repo:** `Nur562-svg/Ariadne`  
**No new code commit / no push from this accept.**

---

## Hard criteria (Task 07)

| Gate | Result |
|------|--------|
| `pnpm --filter web build` | PASS — Next 16.4.0, routes `/` `/ingest` `/study` `/entities` `/viewer/[page]` `/api/ingest` |
| De-demo chrome | PASS — `/` + layout description from `config/books.json` via `loadBooks()`; no hardcoded 「第一篇 · 第一、二章」 marketing copy in product pages |
| Library | PASS — seed book listed; enters `/entities?book=…`; empty-state points `/ingest` |
| Honest ingest | PASS — upload API + material JSON; stage `uploaded→parsed→extracted→ready\|failed` via `deriveMaterialStage` disk facts; UI/README state Mac OCR / `pnpm parse`; no fake cloud OCR |
| Cards pickup | PASS — `config/books.json` + chapter registration; shell-01 did not touch `data/cards` |
| `/study` | PASS — `collectStudyAtoms` + localStorage grades; seed has **1342** atoms (≫20); CiteChip retained |
| Aesthetics | PASS — cinnabar brand accent; desk-like library, not marketing hero/bento |
| Non-regression CiteChip | PASS — known page → `p.N`; null → `p.?`; amber when unverified |
| `loadAllChapterPages` | PASS — viewer still uses merge index |
| No `verified:true` game in this slice | PASS — shell-01 touched no card data; residual `verified:true` only in legacy `ch01.entities.json` (222), content freeze / out of Task 07 scope |
| OUT scope held | PASS — no Clew harness, no FSRS scheduler, no new textbook chapters, no nur-landing hero |

---

## Notes

- Delivery commit: `989103a` (Nuke AB / Mac). Brief: `bbb74de`. Follow-on brief Task 08 already on main: `24ab853` `docs/task-08-desk-v4-shell.md`.
- Next product slice: Task 08 desk-v4 DeskShell first cut on Mac Trae (DeepSeek-V4-Pro), preserve library/ingest/study.

