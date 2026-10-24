# Task 65 — shelf-progress-honesty-01

**Slug**: `shelf-progress-honesty-01`  
**Title**: 书架/进度诚实 · 徽标去英键 + 本书范围标注 · DraftInbox 空岛常显壳 · 本机进度条不永挂 · 弱面朱砂降噪（小）· 永不第四徽列 / 健康分 / Clew 真写  
**Tip**: `a1f1f72`（docs T64） atop feat `4c3621c`（T64） atop `c8c8dbc`（T63 docs）  
**体量**: MEGA ~180–300+ min · A–J  
**定稿**: 2026-10-24 23:14 Asia/Shanghai (CST) · **交付**: 2026-10-24

## 一句话

T63 目视留下的书桌诚实三连一次修净：书架/ingest/Register 徽标中文去英键 + 书级比率标「本书」防章级误读（数学不动）、DraftInbox 空岛常显静默壳（portability 可发现）、本机进度条 fail-closed 永不永挂「读取中」；外加 cockpit 弱面样例链朱砂降噪小面。

## 合同（硬 · 已全部落实）

1. UI 禁字面 `darkRate`/`shallowRate`/`missRate`（shelf + ingest + Register 三处顾客可见面清零；CLI stdout / `data/qa` JSON 字段名保留——那是机读）。
2. 书卡数字 = **书级合计**（bookExtractPage/bookDensity，与 `pnpm page-check -- --book` 同真，4/89≈4%）；文案「本书占实质页 X%」+ 次级 muted「弱章明细见下方章质检驾驶舱」；**未假贴**章级 23.5%/17.6%。
3. 无第四书架徽列 / 健康分圆环 / 掌握%；cite|parse|暗（浅旁挂）三分列骨架不动。
4. DraftInbox 空岛（无草稿且无不完备待补）常显静默壳：标题 + 空态短句 + 草稿≠进度包次级说明 + INBOX_DISCLAIMER + DraftPortBlock；border-line 克制，无大红 empty-CTA。
5. T62/T64 主路径（列表/pack/guide/T64 CopyCommand/port import）形状零改动——只增空态壳。
6. `LocalProgressStrip` + 同族 `StudyScopeCounts` / `HeYeScopeCounts` / ClewPane 计数：effect 全部 try/catch，异常仍 `setReady(true)`；Strip 失败态降「本机进度暂不可读（本机暂无进度）」，ScopeCounts/Clew 降空计数；无掌握%/Due/圆环。
7. cockpit 六列算法零改动；仅弱面样例链 `text-cinnabar` → `text-foreground/80 hover:text-cinnabar`（墨色常态、朱砂 hover）。
8. 永不 verified:true / auto PATCH / Clew 真写 / invent / 改名键 / draft→progress-port / seed-apply 可写。

## 真源对照（tip `a1f1f72` 实测）

| | ch01（章级） | book immunology-3rd（书级） |
|--|------|---------------------|
| 暗 | 4 · 23.5%（实质 17） | 4 · 4.5%（实质 89） |
| 浅 | 3 · 17.6% | 3 · 3.4% |

书卡跟 book 行（「本书占实质页」），章级另见驾驶舱——两套分母，各自正确，互不假贴。

## 路径

| 路径 | 字母 |
|------|------|
| `apps/web/app/(desk)/page.tsx`（书卡抽出偏稀徽） | A |
| `apps/web/app/(shell)/ingest/page.tsx`（章行暗率/浅率） | B |
| `apps/web/components/RegisterMaterialButton.tsx`（软确认旁挂未见率/暗率/浅率） | C |
| `apps/web/components/DraftInbox.tsx`（空岛常显壳 + 非空路径零改动） | D · E · F |
| `apps/web/components/LocalProgressStrip.tsx` | G（书卡必交） |
| `apps/web/components/StudyScopeCounts.tsx` / `HeYeScopeCounts.tsx` / `desk/ClewPane.tsx` | G（同族同修） |
| `apps/web/components/ChapterQualityCockpit.tsx`（弱面链色降噪，小面） | H |
| `docs/task-65-shelf-progress-honesty.md` | H |

## OUT（摘要）

第四书架徽列 · 健康分/掌握% · 假贴章级%到书卡 · empty-CTA/return densify · redo DraftInbox 主路径/cockpit 六列/seed-apply · Clew 真写或大量解析 · Register 硬门禁 · 批量重抽 chrome · 改名键 · verified:true

## DEFER

Clew read-only suggest-only（铁合同另开）· 批量重抽队列 UX · invent heye-only · Register API 硬门禁 · quiz·study 深度 densify · 真视觉缺口（待 desk 目视）
