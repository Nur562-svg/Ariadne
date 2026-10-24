# Task 60 — study-shallow-density-01

**Slug**: `study-shallow-density-01`  
**Title**: 学习环浅密度诚实 · 消费 T59 浅页信号进练/核/ready · 评完池 ≠ 可考够  
**Tip**: `a18ada3`（docs T59） atop feat `9a1303a` atop `1b66b9e`（T58）  
**Est**: ~180–300+ min · **A–J** MEGA  
**Close**: 做完叫验收。A–J 全交才过。

## Why this knife

T54–T59 closed cite miss → remediate → parse/OCR → dark pages → study-loop dark honesty → shallow density **production**. Seed ch01 still has **shallow 3** (p.2 / p.6 / p.8). Study/HeYe/ready still only name **dark** — after finishing the pool, customers read “done” even when cited pages are atom-thin.

This knife **consumes** T59 `extract-page-density` into the study loop (mirror of T58 consuming T57 dark). It does **not** redo density scoring, dark detection, shelf cite|parse|dark triad, Reader production priority, or invent atoms.

## Atom editor (honest reject → DEFER T61+)

Deferred T55→T56→T57→T58→T59→**T60**. Evaluated again for T60: still DEFER to T61+.

- Lower leverage than study-loop shallow consume (T59 already proved production shallow; study silence is the gap — same pattern as T57→T58).
- Footguns: Clew true write, `verified:true`, auto PATCH entities, rename storage keys.
- If opened later: **local-draft-only** — new key only (e.g. `ariadne.atom-draft.v1`), clipboard JSON patch export, never verified, never auto PATCH, never Clew true write, never rename existing keys (`ariadne.study.v1` / `heye.v1` / `return.v1` / …).

## Rejected candidates

| Candidate | Verdict |
|-----------|---------|
| Local-draft atom editor | **DEFER T61+** (contract above) |
| Clew proposal surface (no write) | reject (OUT neighborhood) |
| register→ready densify leftover | thin (T58/T59 already hung signals) |
| quiz/study depth densify | reject (chrome densify) |
| QA dashboard route | DEFER |
| Batch re-extract UX | thin / DEFER |
| Empty-CTA / return densify | reject (saturated) |
| Redo T54–T59 | reject — consume only |
| CitePeek / OCR canvas / verified:true / Clew write | OUT forever |
| Invent heye-only / FSRS / Queue→Due | OUT / DEFER |
| Disguise shallow as dark/sparse/cite-miss/orphan | reject (four concepts; shallow has atoms ≠ orphan) |
| Fourth shelf badge column densify | reject |
| `emptyKind:'shallow'` / swallow orphan CTA | reject — hang-on only |

## Consume contract (document; do not freestyle)

- **Reuse** T59: `loadExtractPageDensity` / `scoreExtractPageDensity` / `collectAtomCountByPage` / `SHALLOW_ATOM_MAX=2` / `SHALLOW_CHARS_PER_ATOM=400` / `SPARSE_CHAR_THR=40`.
- **Reuse** T57/T58: dark fold + existing Study dark surfaces — do not rewrite.
- `ExaminableCoverage` keeps `weak` = dark-only; add `densityWeak` = shallowCount>0; add `shallowCount` / `shallowPages`.
- `pageExaminableHint` priority: **sparse > dark > shallow > ok** (unchecked if missing).
- Shallow pages **have** atoms → **not** orphan. D is “page has atoms × shallow”, not orphan rewrite.

## A–J one-liners

| L | Slice |
|---|--------|
| A | Extend examinable-coverage — fold T59 density; hint+`shallow`; keep dark `weak` separate from `densityWeak` |
| B | Study header amber「浅S」when densityWeak; may sit beside T58 dark line |
| C | StudyScopeCounts hang「浅S」; N=0 untouched |
| D | Study page-with-atoms × shallow tip; keep orphan×dark as T58 |
| E | StudySession complete hang shallow; do not swallow dark complete line |
| F | HeYe shallow hang-on (matched/sticky page); no emptyKind shallow/dark |
| G | IngestReadyLinks「浅S」beside「暗D」; no hard gate |
| H | Overview 练入口 title/旁注「浅S」; no 4th shelf column; don’t redo Reader |
| I | Wire study/review/ingest/Overview; fail-closed; preserve T55–T59 |
| J | build + density/page/cite/parse-check; DEFER editor T61+; no verified/entities write |

## Standing close

做完叫验收。A–J 全交才过。
