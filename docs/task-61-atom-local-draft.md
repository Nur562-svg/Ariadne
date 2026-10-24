# Task 61 — atom-local-draft-01

**Slug**: `atom-local-draft-01`  
**Title**: 本机草稿原子字段编辑器 · local-draft-only · 剪贴板 JSON patch · 永不 verified / PATCH / Clew 真写  
**Tip**: `087fd12`（docs T60） atop feat `9f3e143` atop `a18ada3`（T59）  
**Est**: ~180–300+ min · **A–J** MEGA  
**Close**: 做完叫验收。A–J 全交才过。

## Why this knife

T54–T60 closed the materials→atoms spine (cite miss → remediate → parse/OCR → dark → study dark → shallow prod → study shallow). T55 already counts `incompleteAtoms` and offers clipboard suggest-quotes, but humans still hand-edit JSON to repair empty prompt/answer or thin atoms.

Honest re-eval of the long-deferred **local-draft-only atom editor**: pipeline silence is gone; remaining highest leverage is closing the **human repair loop** without touching seed. Contract can be held in A–J MEGA if written hard.

This knife adds `ariadne.atom-draft.v1` + card-detail draft islands + clipboard JSON patch export. It does **not** auto PATCH entities, flip `verified:true`, Clew-write, rename storage keys, or redo T54–T60 algorithms.

## Atom editor contract (HARD)

- **New key only**: `ariadne.atom-draft.v1`
- Display = seed ⊕ draft overlay (server seed read-only)
- Export = clipboard JSON patch document (human applies offline / PR)
- **Never** `verified:true`
- **Never** auto PATCH / write `data/cards/*.entities.json` or blocks
- **Never** Clew LLM true write
- **Never** rename `ariadne.study.v1` / `ariadne.heye.v1` / `ariadne.desk.return.v1` / session / view / last-opened / recent-books
- Draft ≠ heye local mark ≠ study grade (three-way honesty copy)

## Rejected candidates

| Candidate | Verdict |
|-----------|---------|
| **Local-draft atom editor (THIS knife)** | **ACCEPT as theme** — spine closed; contract holdable in MEGA |
| Clew proposal surface (no write) | reject (OUT neighborhood) |
| register→ready densify leftover | thin (T58–T60 already hung signals) |
| quiz/study depth densify | reject (chrome densify) |
| QA dashboard route | DEFER |
| Batch re-extract UX | thin / DEFER |
| Empty-CTA / return densify | reject (saturated) |
| Redo T54–T60 | reject — reuse incomplete/suggestQuote only |
| CitePeek / OCR canvas / verified:true / Clew write | OUT forever |
| Invent heye-only / FSRS / Queue→Due | OUT / DEFER |
| Auto PATCH entities / rename storage keys | OUT forever |
| Fourth shelf badge / `emptyKind:'shallow'|:'dark'` | reject |

## A–J one-liners

| L | Slice |
|---|--------|
| A | `lib/atom-draft.ts` — new key store, load/set/clear/subscribe; never touch other keys |
| B | Overlay helpers + incomplete-target list (T55 empty prompt/answer口径); quality score stays seed-only |
| C | `buildAtomDraftPatch` + CopyTextButton export; no file write API |
| D | `AtomDraftEditor` island — prompt/answer draft; hard banner 草稿≠seed≠verified≠本机已对 |
| E | EntityCardDetail atoms — incomplete highlight + draft overlay + open editor; keep T55 remediate |
| F | EntityCardDetail fields — minimal value draft; label read-only; keep 0-field honesty |
| G | Card draft strip — count / export / clear-card; optional ingest「到卡详开草稿」次级链 |
| H | Honesty copy triad + privacy-mode write-fail honesty; no mastery%/Due/ModeChips |
| I | Wire desk card page; preserve T55–T60 surfaces; fail-closed SSR |
| J | build + cite/parse/page/density-check; DEFER QA/batch/quiz; five bans in reply |

## Standing close

做完叫验收。A–J 全交才过。
