# Task 52 ACCEPT — desk-empty-complete-widen-viewer-01

**Verdict: PASS**  
**When:** 2026-10-24 ~00:54 Asia/Shanghai (UTC+8)  
**Tip:** `64ddb11` `feat(desk) Task 52 desk-empty-complete-widen-viewer-01`  
**Base:** `2e30178` `docs(desk) Task 51 acceptance docs` (ancestor ✓)  
**Committed:** yes (single feat commit atop tip base)  
**Dirty tracked:** none (only pre-existing untracked docs / `.acceptance-*`)  
**Pushed by acceptor:** no  
**Build:** `pnpm --filter web build` PASS (retry after Next.js SecurityFatalError nudge; compile + tsc + static gen OK)

---

## Diff scope (vs `2e30178`)

9 files · +231 / −46:

| File | Letters |
|------|---------|
| `apps/web/components/desk/DocumentPane.tsx` | A · I |
| `apps/web/components/StudySession.tsx` | B |
| `apps/web/components/HeYeSession.tsx` | C · D |
| `apps/web/app/(desk)/review/page.tsx` | E |
| `apps/web/app/(desk)/study/page.tsx` | F |
| `apps/web/app/(shell)/viewer/[page]/page.tsx` | G |
| `apps/web/components/EntityCardDetail.tsx` | H · I |
| `apps/web/app/(desk)/desk/card/[id]/page.tsx` | H · I |
| `apps/web/app/(shell)/entities/[id]/page.tsx` | H · I |

QuizPanel lives inline in DocumentPane (no separate `QuizPanel.tsx`) — behavior matches A.

---

## A–J

### A — QuizPanel book-empty widen honesty — **PASS**
- Prop `bookAtomCount: number` on inline QuizPanel; DocumentPane computes `cards.reduce((n,c)=>n+c.atoms.length,0)` (same book pool as header).
- `atomCount===0 && bookAtomCount===0` → plain `<span>本书暂无原子</span>` (no Link).
- `atomCount===0 && bookAtomCount>0` → keep「本章暂无原子 · 去学习环放宽到本书 →」→ `/study?book=&mode=all`.
- T51「去核页」gate untouched in same block.

### B — StudySession mode-empty / complete chrome — **PASS**
- Mode-empty: `ungradedDone = mode==="ungraded" && pool.ungraded===0` → h2「本机已全部评过」(HeYe「本机已全部对过」/「本轮完成」family); else「这个队列是空的」.
- Complete path still h2「本轮完成」+ CTA row; ModeChips not mid-session-inserted; T51 CrossScope / leaveReturn gates kept.

### C — HeYeSession pool-empty chrome — **PASS**
- Pool-empty wrapped in `<section>` + h2「这个范围是空的」。
- Prop `emptyKind?: 'orphan'|'card-out'|'true-empty'|null` body branches:
  - orphan → 本页无待核 / OCR 未解析 + 清本页放宽
  - card-out → 越界滤空 + 回本卡 / 放宽
  - default/true-empty → /ingest 引导，不装假池
- Label fix:「去学习环 /study →」→「去学习环 →」(href unchanged); T51 atomCount gate kept.

### D — HeYeSession mode-empty titles — **PASS**
- `mode==="open"` visible-empty → h2「本机已全部对过」+ green honesty bar (checked/doubt counts).
- checked/doubt empty → h2「这个档还没有本机记录」(distinct from pool-empty).
- CTA row parity with Study complete family; chips unchanged.

### E — review/page wires emptyKind — **PASS**
- `cardWidePending` via `collectCiteQueue({cardId})` when items empty + card.
- `emptyKind = orphanReview ? "orphan" : card && cardWidePending>0 ? "card-out" : "true-empty"` (null when items>0).
- Passed `emptyKind={emptyKind}` into HeYeSession; page amber kept; T48 sticky / T51 CrossScope not redone.

### F — study/page no-book / orphan deskBack — **PASS**
- New branch `!scopeBook && !effChapter` →「书库还没有可练的知识原子」+ /ingest → 书架；no fake widen / bare book link.
- Orphan deskBack honesty retained: `deskPageHint=null` on orphanStudy; `deskHref` only adds `&page=` when hint known; ReturnNav still real `/desk`.
- T51 CrossScope empty gates in empty-atom branch kept.

### G — Viewer `←书桌` keeps `&page=` — **PASS**
- `deskHref`: deskBook+pg → `/desk?book=…&page=${pageNo}`; deskBook no pg → book-only; else `/desk`.
- Optional 练本页/核本页: `pageAtomCount`/`pagePendingCount` from collectStudyAtoms / collectCiteQueue `{bookId,page}`; N=0 plain; >0 muted links with `&mode=all` / `&mode=open`.
- No OCR canvas; CitePeek untouched (not in diff).

### H — EntityCardDetail 对页×3 + 开本页 OCR gate — **PASS**
- Prop `bookValidPages?: number[]`; `ocrHas(p) = bookValidPages==null || includes(p)` (缺省不门禁).
- Three「对页」sites (fields / atoms / footer cites): not-in-OCR → plain「本页无 OCR」; in → Link `/desk?book=&page=`.
-「在书桌打开本页」: `deskPageKnown` gate → else plain「本页无 OCR」.
- No return densify on「对页」(soft OUT honored).

### I — Wire assembly — **PASS**
- DocumentPane → QuizPanel `bookAtomCount`.
- desk/card/[id] + entities/[id] → `bookValidPages={book ? loadBookValidPages()[book.id] : undefined}`.
- Inline `ocrHas` = pageInOcr equivalent (no separate ocr-page.ts required).
- `book-pools.ts` not in diff; storage keys untouched.

### J — build + DEFER + regression — **PASS**
- `pnpm --filter web build` PASS on Mac after one security-nudge retry.
- heye-only invent: **DEFER** (not invented; only HeYeSession chrome/copy).
- Regression spot-check (diff + name-only): CitePeek not touched; book-pools untouched; ModeChips mid-session not added; Queue≠Due; no verified:true write; no FSRS; leaveReturn / T51 CrossScope gates present; T46–T51 not redone as theme; no DeskShell rewrite; no「对页」+return.
- Acceptor did **not** commit or push.

---

## OUT compliance

| OUT | Status |
|-----|--------|
| FSRS/Due | clean (comments only) |
| Clew LLM write | not touched |
| verified:true | forbidden comment retained; no write |
| OCR canvas | not present |
| CitePeek body/trap redo | CitePeek not in diff |
| ⌘K / Queue→Due / DeskShell rewrite | not present |
| invent heye-only | DEFER |
| return densify as theme | no; 对页无 return |
| redo T46–T51 | no (gates preserved) |
| EntityCardDetail「对页」+return | not added |
| ModeChips mid-session | not added |
| only Quiz or only Viewer | full A–J delivered |

---

## Soft / DEFER → T53

1. **heye-only invent** — DEFER (SCOPE soft).
2. **Next.js security advisory** — build emitted SecurityFatalError then warning on retry (`next upgrade --agent=security …`). Ops not theme; do not fold into T52/T53 product theme.
3. Optional thin `pageInOcr` helper file not extracted (inline `ocrHas` OK).
4. Untracked docs noise (`docs/task-52-*`, `.acceptance-*`) left as-is — not part of feat.

---

## Report line for parent

**PASS** · tip `64ddb11` · base `2e30178` · committed=yes · dirty tracked=none · build=PASS · push=no (parent auto-push) · ACCEPT=`/workspace/reports/ariadne-task-52/ACCEPT.md`
