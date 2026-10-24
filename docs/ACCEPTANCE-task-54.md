# Ariadne Task 54 ACCEPT — pipeline-cite-ocr-quality-01

**When**: 2026-10-24 11:30 Asia/Shanghai (CST)  
**Accepting agent**: Grok Bot executor (accept-only; **no commit / no push / no user message**)  
**Slug**: `pipeline-cite-ocr-quality-01`  
**Theme**: First materials→atoms pipeline slice — cite quote↔OCR quality gates (bigram≥0.6) + extract/CLI + ingest quality strip + Register soft gate + Entity/HeYe/CiteChip「OCR 未见」.

---

## Tip / HEAD

| Field | Value |
|-------|-------|
| **Required tip base** | `d518876` (`docs(desk) Task 53 acceptance docs`) |
| **HEAD** | `d90d951` (`feat(pipeline) Task 54 pipeline-cite-ocr-quality-01`) |
| **Parent of HEAD** | `d518876` ✓ (exact tip base) |
| **Mac** | `cc4d11a1-8454-4962-af55-8aa0b70f91fc` · `/Users/nukeab/projects/Ariadne` |
| **Working tree (task files)** | Clean for A–J paths (commit already present). Untracked: historical `docs/task-*` / `.acceptance-*` only. |
| **origin/main (local fetch)** | Stale at `9fc84c2` (T31); local `main` ahead 26 incl. T54. Not a theme fail. |

---

## Theme gate

| Check | Result |
|-------|--------|
| Theme = cite↔OCR pipeline quality (not empty-CTA / return densify / CitePeek body-trap redo / T46–T53 redo) | **PASS** |
| `verified:true` written into entities / seed | **PASS** — no `verified:true` in `d518876..d90d951` diff; no `data/cards` files in commit |
| CitePeek body/trap redo | **PASS** — CitePeek +8/−1 only adds optional `ocrMiss` prop passthrough to CiteChip |
| T53 `pageInOcr` / ghost gate | **PASS** — CiteChip still imports `pageInOcr`; ghostInDesk path unchanged (`· 本页无 OCR` span) |
| heye-only invent | **DEFER** — no invent files; only HeYeSession amber wire |
| Empty-CTA / return densify as theme | **PASS** — not present |

**Theme verdict: PASS**

---

## Changed files (`d518876..d90d951`)

```
.gitignore
apps/web/app/(desk)/desk/card/[id]/page.tsx
apps/web/app/(shell)/entities/[id]/page.tsx
apps/web/app/(shell)/ingest/page.tsx
apps/web/components/CiteChip.tsx
apps/web/components/CitePeek.tsx
apps/web/components/EntityCardDetail.tsx
apps/web/components/HeYeSession.tsx
apps/web/components/RegisterMaterialButton.tsx
apps/web/components/desk/DocumentPane.tsx
apps/web/lib/cite-ocr-quality.ts          (A NEW)
package.json                              (+ cite-check)
scripts/cite-ocr-check.mjs                (B NEW)
scripts/extract_cards.mjs                 (C)
scripts/lib/cite-ocr-quality.mjs          (A twin NEW)
```

15 files, +639 / −13.

---

## Per-letter evidence

### A — shared lib twin · **PASS**
- `apps/web/lib/cite-ocr-quality.ts` L27–191: `normalizeText`, `bigramCoverage`, `quoteInOcr(thr=0.6)`, `citeOcrMiss`, `enumerateCardCites`, `scoreCard`, `scoreChapter`, `cardCiteMisses`.
- `scripts/lib/cite-ocr-quality.mjs` L11–119: same functions, keep-in-sync comment L2–5.
- Twin algorithms match (smoke: hit/miss/empty/nullText agree). TS has types only; no logic drift noted.

### B — CLI cite-check · **PASS**
- `scripts/cite-ocr-check.mjs` + `package.json` `"cite-check": "node scripts/cite-ocr-check.mjs"`.
- Writes `data/qa/<ch>.cite-ocr.json`; note L66「绝不回写 entities verified」.
- `.gitignore` adds `data/qa/*.cite-ocr.json`.
- Ran: `pnpm cite-check -- ch01` → `卡 40 · 原子 57 · 有页 cite 195 · OCR未见 0（missRate 0.0%）` EXIT 0; report written; entities untouched.

### C — extract post-score + `--strict` · **PASS**
- `scripts/extract_cards.mjs` ~L173–187: `scoreChapter` before write; stderr missRate; `--strict && (missRate>0.4 || zeroAtomCards>0)` → `process.exit(1)` **before** `writeFileSync` (refuse overwrite when old file exists).

### D — ingest quality strip · **PASS**
- `apps/web/app/(shell)/ingest/page.tsx` L132–202: `scoreChapter` only when `hasCards`; strip `OCR未见 / 无页 p.? / 零原子卡`; uploaded/parsed chapters without cards get `q=undefined` → no fake 0 row.

### E — Register soft gate · **PASS**
- `RegisterMaterialButton.tsx` L39–129: `qualityWarn` when `missRate≥0.25 || zeroAtomCards>0` → amber + first click →「质量偏弱 · 仍要注册 →」.
- `/api/ingest/register/route.ts` **not** in commit — no quality hard 4xx (existing 4xx only for illegal JSON / missing materialId).

### F — EntityCardDetail「OCR 未见」· **PASS**
- `EntityCardDetail.tsx` L122–250: `ocrMissCount` via `quoteInOcr`; bar split from「教材抽查未核」; amber when N>0; copy states machine check ≠ seed verified; no writeback.

### G — HeYe quote-not-in-OCR amber · **PASS**
- `HeYeSession.tsx` L814–819: under blockquote, `cur.quote && pg && !quoteInOcr(...)` →「摘录未在本页 OCR 中找到（可能 OCR 误差或抽取出错）」; does not touch mark/undo/verified.

### H — CiteChip `ocrMiss` + T53 ghost intact · **PASS**
- `CiteChip.tsx` L32–77: optional `ocrMiss` → label `· OCR 未见` + title; `ghostInDesk` still `!pageInOcr(...)` → span `· 本页无 OCR`.
- CitePeek only forwards `ocrMiss` (not body/trap).

### I — wiring · **PASS**
- ingest: score + `qualityWarn` (D/E).
- `desk/card/[id]/page.tsx` L101–112 + `entities/[id]/page.tsx` L114–124: `pageTextByPage` from `loadChapterPages`.
- `DocumentPane.tsx` CardCard: `citeOcrMiss` → CitePeek `ocrMiss`.
- `review/page.tsx`: still passes `pages={pages}` into HeYeSession (G consumes `pg.text`).

### J — build + cite-check + DEFER + regression · **PASS**
- `pnpm cite-check -- ch01` PASS (see B).
- `pnpm --filter web build`: first run compiled OK then `SecurityFatalError` (ops, not theme); **retry PASS** (exit 0) with security advisory warning.
- heye-only invent DEFER; no `verified:true` writes; T53 ghost gates intact; CitePeek body/trap untouched.

---

## Build + cite-check

| Command | Result |
|---------|--------|
| `pnpm cite-check -- ch01` | **PASS** EXIT 0 · missRate 0.0% · wrote gitignored `data/qa/ch01.cite-ocr.json` |
| `pnpm --filter web build` | **PASS** on retry (compile+TS+static OK; Next security nudge ops-only) |

---

## Residual risks

1. **OCR false「未见」** from Vision misreads (入/人) — mitigated by bigram≥0.6 + copy naming OCR/extract error; ch01 currently 0 misses so UI amber paths need a synthetic/miss seed for visual QA.
2. **Register soft-only** — weak drafts can still enter library after second click; hard API gate left as leftover (SCOPE Soft).
3. **Twin drift** — TS/mjs duplicated by hand; keep-in-sync is comment-enforced only.
4. **Local `origin/main` stale** at T31 (`9fc84c2`) while Mac `main` is at `d90d951` (ahead 26). Push must target real remote tip (= `d518876` lineage), not assume local origin is current.
5. **Next.js SecurityFatalError** — ops; not theme. Retry continues after reminder.

---

## Commit-ready files

Already committed locally as **`d90d951`**. Commit-ready set = the 15 paths listed above.  
**Not** for this commit: untracked historical `docs/task-*`, `.acceptance-*`, generated `data/qa/*.cite-ocr.json` (gitignored).

Untracked task-54 docs (optional follow-up docs commit, out of scope for this accept):
- `docs/task-54-SCOPE.md`
- `docs/task-54-pipeline-cite-ocr-quality.md`
- `docs/task-54-trae-prompt.txt` / `docs/task-54-trae-prompt-paste.txt`

---

## Auto-push blockers

1. **Explicit accept brief**: 「Do NOT commit/push/message the user」— this executor must not push.
2. Parent/standing auto-push may proceed **after** reading this ACCEPT PASS, using Mac repo `d90d951` on tip base `d518876`.
3. Local `origin/main` fetch is stale (T31); push agent should `git fetch` / verify remote tip is `d518876` before push to avoid surprises.
4. Do not include untracked historical docs or generated cite-ocr.json in the push set unless a separate docs commit is intentional.

---

## Verdict

# **PASS**

A–J all PASS · theme PASS · build PASS (retry) · cite-check PASS · no `verified:true` · T53 ghost intact · CitePeek body/trap not redone.

**ACCEPT.md**: `/workspace/reports/ariadne-task-54/ACCEPT.md`
