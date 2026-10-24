# Task 58 — study-examinable-coverage-01

**Slug**: `study-examinable-coverage-01`  
**Title**: 学习环可考覆盖诚实 · 暗页进练/核范围可见 · 完成≠材料已覆盖 · ready 三连旁挂  
**Tip**: `1b609dc`（docs T57） atop feat `9b32776` atop `ee323f3`（T56）  
**Est**: ~180–300+ min · **A–J** MEGA  
**Close**: 做完叫验收。A–J 全交才过。

## Why this knife

T54–T57 closed the **production** honesty spine (cite miss → remediate → parse/OCR coverage → extract dark pages). Study/HeYe/ready still treat **non-empty atom pools** as “material examinable / done.” Seed ch01 has 57 atoms and **4 dark pages** (substantial OCR, zero cite). Completing the pool is not covering the book.

This knife **consumes** T57 `extract-page-coverage` into study-loop surfaces — it does **not** redo dark detection, shelf badges, or Reader hints.

## Atom editor (honest reject)

Deferred T55→T57→T58+. Evaluated for T58: still DEFER to T59+.

- Lower leverage than study-loop coverage after T57 (T55 clipboard remediate already helps humans).
- Footguns: Clew true write, `verified:true`, auto PATCH entities, rename storage keys.
- If opened later: **local-draft-only** — new key only (e.g. `ariadne.atom-draft.v1`), clipboard JSON patch export, never verified, never auto PATCH, never rename existing keys.

## Rejected candidates (summary)

| Candidate | Verdict |
|-----------|---------|
| Local-draft atom editor | DEFER T59+ (contract above) |
| Shallow extract density (cited but tiny atom count) | leftover |
| Clew proposal surface (no write) | reject (OUT neighborhood) |
| QA dashboard route | DEFER |
| Batch re-extract UX | thin / DEFER |
| Empty-CTA / return densify | reject (saturated) |
| Redo T54–T57 | reject |
| CitePeek / OCR canvas / verified:true / Clew write | OUT forever |
| Invent heye-only / FSRS / Queue→Due | OUT / DEFER |
| Swallow HeYe orphan into dark theme | reject (旁挂 only) |

## A–J one-liners

| L | Slice |
|---|--------|
| A | Thin `examinable-coverage.ts` — consume T57 scores; `scopeExaminableCoverage` + `pageExaminableHint`; missing files → null |
| B | `/study` header amber when scope weak: 暗D · 实质S · citeC |
| C | StudyScopeCounts (or sibling line) hang 暗D; no empty-CTA densify |
| D | Study orphan + dark page → name substantial OCR not extracted; keep widen CTA |
| E | StudySession complete + weak → caveat 评完池内 · 仍有暗页 |
| F | HeYe orphan 旁挂 dark sentence; do **not** change emptyKind / CTAs |
| G | ingest ready triad hang 暗D beside atomCount; no hard block |
| H | Desk Overview study entry title (and/or 练本页) hang dark when weak |
| I | Wire study/review/ingest/Overview; fail-closed; preserve T55–T57 |
| J | build + page/cite/parse-check regression; DEFER editor/heye-only/QA/shallow; no verified/entities write; no push |

## OUT (hard)

FSRS/Due · Clew LLM true write · verified:true · auto PATCH entities/blocks · OCR canvas · CitePeek body/trap · ⌘K · Queue→Due · DeskShell rewrite · exam-anchor full · invent heye-only · ch08+ · nur-landing · mastery% · rename storage keys · force-clear stacks · ModeChips mid-session · return/empty-CTA densify as themes · redo T46–T57 · Next.js security as theme · hard-4xx Register · invent cites for dark pages · change deriveMaterialStage · true atom editor as this knife · swallow HeYe orphan typing · writer push.

## Pack / paste

- Box pack: `/workspace/reports/ariadne-task-58/`
- Paste for user: `trae-prompt-paste.txt` (full A–J)
- Mac mirror (untracked): `docs/task-58-*` under `/Users/nukeab/projects/Ariadne`
