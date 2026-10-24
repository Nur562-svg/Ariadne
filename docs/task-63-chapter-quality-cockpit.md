# Task 63 — chapter-quality-cockpit-01

**Slug**: `chapter-quality-cockpit-01`  
**Title**: 章级质量驾驶舱 · 聚合 cite/parse/暗/浅/incomplete/draft · 深链既有补救 · CLI 汇总孪生 · 永不 verified / PATCH / invent / 第四书架 densify  
**Tip**: `8e5325a`（docs T62） atop feat `b001108` atop `5df0db3`（T61 docs）  
**Est**: ~180–300+ min · **A–J** MEGA  
**Close**: 做完叫验收。A–J 全交才过。

## Why this knife

T54–T62 closed materials→atoms through human draft apply/port. Signal **producers** are complete:

1. cite miss / incompleteAtoms (T54–T55)
2. parse empty/sparse (T56)
3. dark pages (T57) + study examinable (T58)
4. shallow density (T59–T60)
5. local draft + desk inbox/pack/guide/port (T61–T62)
6. CLI reports already land in `data/qa/<ch>.{cite-ocr,parse-ocr,extract-page,extract-density}.json`

But **consumption is fragmented**: ingest stage strips, shelf cite|parse|暗 triad (+ shallow旁挂), Study/HeYe side notes, DraftInbox, four separate CLIs. No single chapter view answers: *what still hurts, and where do I click?*

Highest leverage leftover after spine close = **consume-only chapter quality cockpit** (was DEFER; now ripe).

## Contract (HARD)

- Zero new quality algorithms — call existing libs only
- Six concepts columnar (never one health-score / mastery ring)
- Draft via T62 helpers only; never rename keys; never merge into progress-port
- Deep links to existing surfaces + copyable CLI — never one-click write seed
- `data/qa/<ch>.quality-rollup.json` = report not seed
- Never `verified:true` · Never Clew true write · Never invent atoms · Never 4th shelf densify
- Never redo T54–T62 algorithms / DraftInbox / AtomDraftEditor

## Rejected candidates

| Candidate | Verdict |
|-----------|---------|
| **Chapter quality cockpit consuming six signals (THIS)** | **ACCEPT** — DEFER→ripe; MEGA; contract holdable |
| Batch re-extract UX | **reject** — thin/chrome; ingest already has copyable extract/parse |
| register→ready densify | **reject** (chrome) |
| quiz densify | **reject** |
| Clew proposal (no write) | **reject** (OUT neighborhood) |
| Seed-apply CLI / docs-only never auto-write | **DEFER** — complements T62; ops-leaning; leftover |
| Draft→PR Mac workflow docs | **DEFER** — thin alone; pair with seed-apply later |
| Merge draft into progress-port | **OUT** — T61/T62 ban |
| Empty-CTA / return densify | **reject** (saturated) |
| Redo T54–T62 | **reject** — reuse only |
| CitePeek / OCR canvas / verified / Clew write / FSRS / invent heye-only | OUT forever |
| Fourth shelf / `emptyKind` dark\|shallow | **reject** |

## A–J one-liners

| L | Slice |
|---|--------|
| A | `chapter-quality-rollup.ts` pure assemble (no new algos) |
| B | server loader; missing blocks/entities → null unchecked |
| C | `pnpm qa-check` CLI twin → `data/qa/<ch>.quality-rollup.json` |
| D | `ChapterQualityCockpit` six-column weak-amber UI |
| E | Mount desk (near DraftInbox) and/or ingest summary |
| F | Deep links + copyable cite/parse/page/density/qa-check |
| G | Client draft cross via T62 summarizeDraftStore |
| H | Honesty: rollup≠verified; six columns; qa≠seed |
| I | Wire; preserve shelf triad / DraftInbox / editors |
| J | build + cite/parse/page/density/qa-check; DEFER seed-apply CLI |

## Risks

- Writer invents health-score ring or 4th shelf column → reject
- Writer copies second cite/dark/shallow algorithm → reject
- Writer adds one-click extract-write or seed-apply write → reject
- Missing OCR/cards must stay unchecked, not fake-clean zeros

## Standing close

做完叫验收。A–J 全交才过。
