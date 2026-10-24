# Task 62 — atom-draft-inbox-apply-01

**Slug**: `atom-draft-inbox-apply-01`  
**Title**: 书桌多卡草稿收件箱 · 统一补丁包 · 人核落盘引导 · 草稿单独可移植 · 永不 verified / PATCH / Clew 真写 / 并进 progress-port  
**Tip**: `5df0db3`（docs T61） atop feat `12e7c81` atop `087fd12`（T60）  
**Est**: ~180–300+ min · **A–J** MEGA  
**Close**: 做完叫验收。A–J 全交才过。

## Why this knife

T54–T61 closed materials→atoms through local-draft editing. T61 gives per-card `CardDraftBar` + clipboard `ariadne.atom-draft-patch.v1`, but:

1. Desk library has seed `incompleteAtoms` badges and **zero** local-draft awareness.
2. Export is **per-card only** — no multi-card pack.
3. Humans still hand-edit seed with **no path + before→after checklist** (`data/cards/<chapterId>.entities.json`, not per-card files).
4. `progress-port` honestly excludes draft (T61 ban) — drafts die on browser switch unless separately portable.

Highest leverage leftover is closing the **human apply / multi-card inbox** loop without auto-writing seed.

## Contract (HARD)

- Keep `ariadne.atom-draft.v1` (no rename)
- Pack schema `ariadne.atom-draft-pack.v1` (array of existing patch docs)
- Apply guide = clipboard/download text — **never** auto PATCH / fs / fetch write seed
- seedPath = `data/cards/<chapterId>.entities.json` (chapter files)
- Draft port = **separate** `ariadne.atom-draft-port.v1` — **never** merge into `ProgressPayload`
- Never `verified:true` · Never Clew true write · Never redo AtomDraftEditor
- Draft inbox ≠ seed applied ≠ heye ≠ study

## Rejected candidates

| Candidate | Verdict |
|-----------|---------|
| **Draft inbox + pack + human apply guide (THIS)** | **ACCEPT** — spine 9th knife; MEGA; contract holdable |
| Auto seed apply / one-click write entities | **OUT** — forever ban |
| Clew proposal (no write) | reject (OUT neighborhood) |
| QA dashboard / batch re-extract | DEFER |
| register→ready / quiz densify | reject (thin/chrome) |
| Merge draft into progress-port study/heye | **OUT** — T61 five-ban |
| Empty-CTA / return densify | reject (saturated) |
| Redo T54–T61 / AtomDraftEditor | reject — reuse only |
| CitePeek / OCR canvas / verified / Clew write / FSRS / invent heye-only | OUT forever |
| Fourth shelf / `emptyKind` dark\|shallow | reject |

## A–J one-liners

| L | Slice |
|---|--------|
| A | Pack + summarize helpers on atom-draft (client-safe); reuse patch doc |
| B | `buildSeedApplyGuide` — chapter entities path + before→after; clipboard only |
| C | Separate draft-port export/import (merge\|replace); never touch ProgressPayload |
| D | `DraftInbox` desk island — multi-card list + copy pack + copy guide |
| E | Incomplete∩no-draft secondary muted list (not 2nd cinnabar CTA) |
| F | CopyTextButton honesty; empty pack honesty; optional local download |
| G | Draft portability UI beside (not inside) ProgressPortability |
| H | Honesty copy: inbox≠applied; draft-port≠progress-port; triad+ |
| I | Wire desk library page; preserve T55–T61 surfaces; fail-closed SSR |
| J | build + cite/parse/page/density-check; five bans; DEFER QA/batch/quiz |

## Standing close

做完叫验收。A–J 全交才过。
