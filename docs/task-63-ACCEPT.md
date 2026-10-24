# Task 63 ACCEPT — chapter-quality-cockpit-01

**Verdict**: **PASS**  
**Accepted**: 2026-10-24 18:34 Asia/Shanghai (CST)  
**Tip baseline (hard)**: `8e5325a` (`docs(pipeline) Task 62 atom-draft-inbox-apply-01`) atop feat `b001108` (T62) atop `5df0db3` (T61 docs)  
**HEAD**: `8e5325a2ae6d85dc692fea00abea9917f49d18e5` — still tip; **T63 feat not yet committed** (uncommitted working tree)  
**Ancestry**: `8e5325a` == HEAD (`git rev-parse` match). Tip hard satisfied.  
**Mac**: `cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne`  
**Branch**: `main` ahead of `origin/main` by 10 commits (T62 docs tip); T63 code **uncommitted**. **Not pushed** by acceptor.  
**Working tree (code)**: T63 changes present — 3 modified (`.gitignore`, `(desk)/page.tsx`, `package.json`) + 4 new (`chapter-quality-rollup.ts`, `chapter-quality-rollup-server.ts`, `ChapterQualityCockpit.tsx`, `scripts/chapter-quality-check.mjs`). Untracked docs (`docs/task-63-*`) pre-existed from SCOPE handoff.

---

## Theme verified

Consume-only chapter quality cockpit: six-signal rollup (cite / parse / dark / shallow / incomplete / draft) + desk UI + `pnpm qa-check` report twin. **No** health-score ring · **No** 4th shelf densify · **No** one-click write.

```
apps/web/lib/chapter-quality-rollup.ts        (new · A: pure assemble)
apps/web/lib/chapter-quality-rollup-server.ts (new · B: load; null=unchecked)
scripts/chapter-quality-check.mjs             (new · C: CLI twin)
package.json                                  (+ qa-check script)
.gitignore                                    (+ data/qa/*.quality-rollup.json)
apps/web/components/ChapterQualityCockpit.tsx (new · D/E/F/G/H)
apps/web/app/(desk)/page.tsx                  (+31 · I wire near DraftInbox)
```

`progress-port.ts` / `ProgressPortability.tsx` / `DraftInbox.tsx` / `AtomDraftEditor.tsx` / cite|parse|dark|shallow libs — **diff empty** (preserved). Ingest page **not** mounted (E optional; desk-only is in-contract).

---

## Contract (stated in code + UI)

Header in `chapter-quality-rollup.ts` L5–19 (consume-only + six columns + five bans):

1. Zero new quality algorithms — assemble only existing cite/parse/dark/shallow/incomplete returns  
2. Six concepts columnar — never one health-score / mastery% ring  
3. Never `verified:true` — rollup has no verified semantics  
4. Never auto PATCH / fs write entities/blocks — `data/qa/*.quality-rollup.json` = report not seed  
5. Never Clew true write / invent atoms / 4th shelf densify  

UI echoes: `COCKPIT_DISCLAIMER` Cockpit L36–37「机检 ≠ verified · cockpit ≠ seed 已核 · 草稿 ≠ 已写回 · data/qa 报告 ≠ 真源」; summary + footer repeat; CopyCommand only read-only CLIs (no「一键重抽写回」).

---

## A–J checklist

| L | Verdict | Evidence |
|---|---------|----------|
| **A** | **PASS** | `chapter-quality-rollup.ts`: `ChapterQualityRollup` six fields (cite/parse/dark/shallow/incompleteAtoms+ids/draft?) L76–99; `buildChapterQualityRollup` L120–176 **only picks** existing returns — no SPARSE/SHALLOW/bigram recompute (mentions only in forbid comments L11); `rollupWeakFlags` / `rollupIsWeak` / `rollupCliCommands` L189–288; no fs / no `"use client"`. |
| **B** | **PASS** | `chapter-quality-rollup-server.ts`: `loadChapterQualityRollup` L61–90 assembles `scoreChapter` + `cardCiteMisses` + `loadParseCoverage` + `loadExtractPageCoverage` + `loadExtractPageDensity` + `atomIncomplete`; cards.length===0 → cite null (L67–77); loaders return null when missing → not fake 0; `readLastCliCheckAt` L39–59 fail-closed on missing/bad JSON. |
| **C** | **PASS** | `scripts/chapter-quality-check.mjs` + `"qa-check"` in package.json; writes **only** `data/qa/<ch>.quality-rollup.json` (L193–217) with note「非 seed 真源」; entities path is **read** only (L70); `.gitignore` adds `data/qa/*.quality-rollup.json`. Ran: see checks below. |
| **D** | **PASS** | `ChapterQualityCockpit.tsx` table six columns L158–164: cite 未见 / parse 空·稀 / 暗 / 浅 / 不完备 / 草稿; weak → `text-status-warn` amber; good → muted; **no** health ring / mastery% (grep only forbid comments). |
| **E** | **PASS** | Desk mount after DraftInbox `(desk)/page.tsx` L469–483; independent `<details>` utility block — not shelf row; not DeskShell; not Clew; not 4th shelf. Ingest optional skip OK. |
| **F** | **PASS** | Deep links: `/desk/card/<id>` for cite-miss + incomplete (L327–349); `/viewer/<page>` for dark/shallow samples (L360–382); `CopyCommand` via `rollupCliCommands` (cite-check/parse-check/page-check/density-check/qa-check) L386–392 — **no** one-click re-extract write button. |
| **G** | **PASS** | Client draft via T62 `listDraftedCardIds` / `cardDraftCount` / `subscribeAtomDraftStore` / `ATOM_DRAFT_STORE_KEY` (L7–13, L96–112); 0 → muted「0」quiet (L300–301); no key rename; progress-port diff empty. |
| **H** | **PASS** | Honesty copy: disclaimer L36–37 / L141–143 / L191–193; six-column short cells; draft link title「本机草稿未写回 seed」L295; lastCliCheckAt「≠ 真源」L396. |
| **I** | **PASS** | Wire: Server rollupByChapter + Client Cockpit; shelf cite\|parse\|暗 triad + shallow旁挂 comments preserved (page.tsx L365–404); DraftInbox/ProgressPortability untouched above cockpit; fail-closed UncheckedCell. |
| **J** | **PASS** | Build + five checks green (below). **DEFER**: seed-apply CLI dry-run / Draft→PR docs / batch re-extract / invent heye-only / Register hard gate / quiz densify. Acceptor did **not** push. |

---

## Build + checks

### `pnpm --filter web build`
- **1st run**: Compiled + TS + static OK; then `SecurityFatalError` (Next.js known vuln nudge) — ops, not theme.
- **2nd run (retry once)**: **PASS** — compiled, TS finished, static generation OK. Warning retained: Next.js security vulnerability advisory (ops leftover).

### `pnpm qa-check -- ch01`
```
ch01: cite未见 0/195（0.0%）· 零原子卡 0 · parse 空0·稀1·覆盖100.0% · 暗 4（23.5%） · 浅 3（17.6%） · 不完备 0 · 草稿 —（本机） · weak
  → data/qa/ch01.quality-rollup.json
```
PASS. entities mtime unchanged (Oct 16) — report-only write.

### `pnpm cite-check -- ch01`
```
ch01: 卡 40 · 原子 57 · 有页 cite 195 · OCR未见 0（missRate 0.0%）· … · 不完备原子 0
```
PASS.

### `pnpm parse-check -- ch01`
```
ch01: 期望页 18 · 实有 18 · 空 0 · 稀 1 · 覆盖率 100.0% · weak
```
PASS (pre-existing T56 weak).

### `pnpm page-check -- ch01`
```
ch01: 页 18 · 实质页 17 · 已cite 13 · 暗 4 · darkRate 23.5% · weak
```
PASS.

### `pnpm density-check -- --shallow ch01`
```
ch01: 实质页 17 · 有原子页 13 · 浅 3 · shallowRate 17.6% · weak
  浅页 p.2 · p.6 · p.8
```
PASS.

Rollup sample pages: dark **p.7 / p.9 / p.17 / p.18** · shallow **p.2 / p.6 / p.8**.

---

## OUT scan

| OUT item | Result |
|----------|--------|
| health-score / mastery% ring | **absent** — six columns only; ring forbidden in comments + no UI |
| 2nd algo copy (SPARSE/SHALLOW/bigram) | **absent** — comments only; assemble existing returns |
| 4th shelf densify | **absent** — cockpit is separate utility `<details>`; shelf triad intact |
| auto PATCH / 一键重抽写回 | **absent** — CopyCommand read-only CLIs only |
| `verified:true` writes | **none** — ban-comments only |
| invent atoms / empty-CTA densify | **absent** |
| redo DraftInbox / AtomDraftEditor | **absent** — not in diff |
| seed-apply auto write | **absent** |
| draft merged into progress-port | **no** — progress-port diff empty |
| score-only without six cols/links/CLI | **no** — six cols + deep links + qa-check all present |
| push by acceptor | **not done** |

---

## Visual QA prep (for follow-up pass)

**Dev server**
```bash
cd /Users/nukeab/projects/Ariadne
pnpm --filter web dev
# Next default → http://localhost:3000
# If :3000 stale/occupied, Next bumps to :3001 — use the printed Local URL.
```

**Route to open**
- Primary: **`http://localhost:3000/desk`** (or `:3001/desk`)
- Scroll past shelf books → utility zone: ProgressPortability → DraftInbox → **「章质检驾驶舱」** `<details>`

**What six columns should look like (ch01 row)**

| Column | Expected ch01 |
|--------|----------------|
| cite 未见 | muted `0/195（0%）` (good/quiet) |
| parse 空·稀 | **amber** `空0·稀1·覆盖100%` (weak) |
| 暗 | **amber** `4（24%）` approx (darkRate 23.5%) |
| 浅 | **amber** `3（18%）` approx (shallowRate 17.6%) |
| 不完备 | muted `0` |
| 草稿 | muted `0` (unless localStorage has drafts) |

**Weak expand row (ch01 should show)**
- Summary chip: amber「弱章 … ch01 …」
- Dark sample links → `/viewer/7` `/viewer/9` `/viewer/17` `/viewer/18`
- Shallow sample links → `/viewer/2` `/viewer/6` `/viewer/8`
- CopyCommand blocks for `parse-check -- --sparse ch01`, `page-check -- --dark ch01`, `density-check -- --shallow ch01`, `qa-check -- ch01`
- **No** cite-miss card links (0 misses) · **No** incomplete card links · **No** health ring · **No**「一键重抽」

**Visual error checklist (owner asked 顺便看视觉)**
1. Cockpit appears **below** DraftInbox, not inside shelf badge row  
2. Shelf still cite \| parse \| 暗 (+ 浅旁挂) — no 4th big column  
3. Good signals muted; weak amber (`text-status-warn`) — not cinnabar heroes  
4. Table horizontal scroll OK on narrow width (`min-w-[44rem]`)  
5. Opening `/viewer/<page>` from sample links works  
6. Collapsed summary: amber when any weak chapter; muted「机检净」only if all clean  

**Not run in this accept turn**: live browser visual (prep notes only). Parent/owner may drive `:3000/desk` next.

---

## DEFER note

seed-apply CLI dry-run (never write) / Draft→PR Mac docs / batch re-extract UX / invent heye-only / Register API hard gate / quiz densify — **out of knife**. Next.js security upgrade = ops leftover.

---

## Standing

做完叫验收。A–J 全交 → **PASS**. Code still **uncommitted** on tip `8e5325a`. Acceptor **did not push**. Parent may commit feat + docs ACCEPT then push per standing auto-push-on-PASS.
