# Task 59 — pipeline-extract-shallow-density-01

**Slug**: `pipeline-extract-shallow-density-01`  
**Title**: 浅抽出密度诚实 · 实质页已 cite 但原子极稀 · CLI density-check · ingest extracted · 书桌/书架/Reader 浅页旁挂  
**Tip**: `1b66b9e`（docs T58） atop feat `1c27269` atop `1b609dc`（T57）  
**Est**: ~180–300+ min · **A–J** MEGA  
**Close**: 做完叫验收。A–J 全交才过。

## Why this knife

T54–T58 closed cite miss → remediate → parse/OCR → dark pages → study-loop dark honesty. Seed ch01 still has **shallow** pages: substantial OCR, already cited, but atom-thin (p.6 = 1633 chars / 1 atom; p.8 = 1282 / 1; p.2 = 920 / 2). Product silence after dark badges makes “cited / not-dark” look like “examinable enough.”

This knife adds **extract-page-density** scoring and surfaces — it does **not** redo dark detection, examinable Study, shelf cite|parse|dark triad skeleton, or invent atoms.

## Atom editor (honest reject → DEFER T60+)

Deferred T55→T56→T57→T58→**T59**. Evaluated again for T59: still DEFER to T60+.

- Lower leverage than shallow-density production honesty (seed already proves thin pages).
- Footguns: Clew true write, `verified:true`, auto PATCH entities, rename storage keys.
- If opened later: **local-draft-only** — new key only (e.g. `ariadne.atom-draft.v1`), clipboard JSON patch export, never verified, never auto PATCH, never Clew true write, never rename existing keys (`ariadne.study.v1` / `heye.v1` / `return.v1` / …).

## Rejected candidates

| Candidate | Verdict |
|-----------|---------|
| Local-draft atom editor | **DEFER T60+** (contract above) |
| Clew proposal surface (no write) | reject (OUT neighborhood) |
| register→ready densify leftover | thin (T58 already hung 暗D) |
| quiz/study depth densify | reject (chrome densify) |
| QA dashboard route | DEFER |
| Batch re-extract UX | thin / DEFER |
| Empty-CTA / return densify | reject (saturated) |
| Redo T54–T58 | reject |
| CitePeek / OCR canvas / verified:true / Clew write | OUT forever |
| Invent heye-only / FSRS / Queue→Due | OUT / DEFER |
| Disguise shallow as dark/sparse/cite-miss | reject (four concepts separate) |
| Fourth shelf badge column densify | reject — **旁挂** on extract-稀行 only |

## SHALLOW definition (document; do not freestyle)

- Reuse `SPARSE_CHAR_THR=40` (T56).
- Count **atoms only** via `atoms[].cite.page` (not card `cites` / `fields[].cite` alone).
- `SHALLOW_ATOM_MAX=2`, `SHALLOW_CHARS_PER_ATOM=400`.
- Page is **shallow** iff: `chars ≥ thr` ∧ `1 ≤ atomCount ≤ SHALLOW_ATOM_MAX` ∧ `chars/atomCount ≥ SHALLOW_CHARS_PER_ATOM`.
- **Not** shallow: dark (atomCount=0 ∩ substantial → T57), sparse (chars&lt;thr → T56), unchecked (missing files).

## A–J one-liners

| L | Slice |
|---|--------|
| A | Twin `extract-page-density` lib — `scoreExtractPageDensity` + `collectAtomCountByPage`; missing → null |
| B | `pnpm density-check` (+ `--shallow`) + gitignored `data/qa/*.extract-density.json` |
| C | extract_cards post shallow warn; `--strict` OR high shallowRate/Count reject; no invent atoms |
| D | ingest extracted/ready shallow strip + CopyCommand extract; no fake-0 on uploaded/parsed |
| E | Register soft hang shallow*; no hard 4xx |
| F | Overview chapter amber「浅S」; may sit beside「暗D」 |
| G | Shelf 旁挂「浅S」on extract-偏稀 row; do **not** break cite\|parse\|暗 triad |
| H | Reader shallow hint; priority 稀 > 暗 > 浅; no CitePeek/canvas |
| I | Wire ingest/Register/Overview/shelf/Reader; fail-closed; preserve T55–T58 |
| J | build + density/page/cite/parse-check; DEFER editor/heye-only/QA; no verified/entities write; no push |

## OUT (hard)

FSRS/Due · Clew LLM true write · verified:true · auto PATCH entities/blocks · OCR canvas · CitePeek body/trap · ⌘K · Queue→Due · DeskShell rewrite · exam-anchor full · invent heye-only · ch08+ · nur-landing · mastery% · rename storage keys · force-clear stacks · ModeChips mid-session · return/empty-CTA densify as themes · redo T46–T58 · Next.js security as theme · hard-4xx Register · invent atoms for shallow pages · change deriveMaterialStage · true atom editor as this knife · emptyKind:'dark' · swallow HeYe orphan · writer push.

## Pack / paste

- Box pack: `/workspace/reports/ariadne-task-59/`
- Paste for user: `trae-prompt-paste.txt` (full A–J)
- Mac mirror (untracked): `docs/task-59-*` under `/Users/nukeab/projects/Ariadne`
