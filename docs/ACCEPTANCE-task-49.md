# ACCEPTANCE — Task 49 desk-ingest-opendesk-citepeek-empty-01

HEAD 741102b (T48) + 9 uncommitted modified files (304+/77-). No commit/push.
Build: `pnpm --filter web build` EXIT=0.

- A PASS — IngestReadyLinks: ocrPageCount?(??0 fail-closed); 0 → border/muted「打开书桌（尚无 OCR）→」+ title + secondary「去解析」; >0 bg-cinnabar; /desk?book= + rememberUploadReturn kept.
- B PASS — RegisterMaterialButton: ocrPageCount/atomCount/pendingCount; success triad demotes; register/API/router.refresh/touchLastOpened (L66) untouched.
- C PASS — ingest/page.tsx: loadBookValidPages, loadAllChapterPages, collectStudyAtoms(), collectCiteQueue() filtered by book/material chapterIds; 暂无原子/暂无待核 spans; T45 N/M+CopyCommand untouched.
- D PASS — CitePeek: 3 optional props, `!= null && === 0` → muted span; omitted → Link; diff only touches 核本页/练本页/核本卡 nav; quote/trap/pos/Esc/focus/在书桌打开 untouched.
- E PASS — ChapterPageReader rail (pageAtomCount L127 reduce, pendingPageCount, pendingByCard); DocumentPane CardCard (pendingCiteCount + pendingByPage threaded via SectionCards); EntityCardDetail 3 CitePeeks get pendingCiteCount.
- F PASS — StudySession omits (comment explains no derivable counts); HeYeSession real counts from items pool (≥1, true not fake); no heye-only seed; build PASS.

Notes: ingest counts use full-pool filter by chapterIds instead of scoped calls (equivalent per comment). Rail pendingCiteCount uses `?? 0` (same fail-closed as T48 rail gate).
Regressions: none observed; no FSRS/Due/Clew/OCR canvas/⌘K/ModeChips/return-densify changes.
Overall: PASS
Commit msg: feat(desk) Task 49 desk-ingest-opendesk-citepeek-empty-01
