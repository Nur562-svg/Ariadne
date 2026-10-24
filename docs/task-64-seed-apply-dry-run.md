# Task 64 — seed-apply-dry-run-01

**Slug**: `seed-apply-dry-run-01`  
**Title**: 人核落盘干跑 · seed-apply CLI dry-run（永不 write）· Draft→PR Mac 文档 · DraftInbox 可复制 CLI · 永不 verified / PATCH / 一键写回  
**Tip**: `c8c8dbc`（docs T63） atop feat `08da7c4`（T63） atop `8e5325a`（T62 docs）  
**体量**: MEGA ~180–300+ min · A–J  
**定稿**: 2026-10-24 18:38 Asia/Shanghai (CST) · **交付**: 2026-10-24

## 一句话

在 T63 章质检驾驶舱之后，补上草稿脊梁的最后一公里：用 CLI **对照 seed 干跑**（永不写盘）+ Mac Draft→PR 诚实步骤 + DraftInbox 可复制命令。人改 entities / 开 PR；工具永不代写。

## 合同（硬 · 已全部落实）

1. dry-run only — 永不写 `data/cards/*.entities.json` / blocks / config（CLI/lib 零 fs 写路径；实测 entities mtime 不变）
2. 唯一可写 = `data/qa/*.seed-apply-dryrun.json`（报告非真源 · gitignored）
3. 永不 `verified:true` / 报告与 docs 均不含 verified 翻改指令
4. 复用 T62 pack schema（`ariadne.atom-draft-pack.v1` 整包校验，非法拒收）+ `buildSeedApplyGuide` 字段口径（target/field/before/after）
5. 结果五分列 `would-change | already-matches | missing-card | missing-seed-file | invalid`；禁止「应用成功率%」；`drift` 只作旁注不改分列
6. DraftInbox **只扩展** CopyCommand/文档链 — 主列表/pack/port/AtomDraftEditor 未动
7. 禁止 `--write`/`--apply`（传入 → 非零退出 + DRY-RUN ONLY 提示）；缺 pack/坏 JSON/非法 schema → 非零退出，不写假绿报告
8. 不 redo T54–T63 cockpit / 质量算法 / DraftInbox 主路径

## 路径

| 路径 | 字母 |
|------|------|
| `apps/web/lib/seed-apply-dry-run.ts` | A 纯函数（无 fs、无 "use client"） |
| `scripts/lib/seed-apply-dry-run.mjs` | A 孪生（CLI 用，keep in sync） |
| `scripts/seed-apply-check.mjs` | B CLI（`pnpm seed-apply-check`） |
| `package.json`（`seed-apply-check` script） | B |
| `.gitignore`（`data/qa/*.seed-apply-dryrun.json`） | C |
| `docs/seed-apply-mac-pr.md` | D Mac Draft→PR 工作流 |
| `apps/web/components/DraftInbox.tsx`（最小次级面） | E |
| CLI `pack.schema === ariadne.atom-draft-pack.v1` 整包拒收 | F（已交；guide↔pack 条数校验砍） |
| CLI help/stdout 首行 `DRY-RUN ONLY · never writes entities` | G |

## 报告契约（C）

`data/qa/<YYYYMMDD-HHMMSS>.seed-apply-dryrun.json`：`schema: ariadne.seed-apply-dryrun.v1` · `generatedAt` · `packSource` · `packExportedAt` · `packCardCount` / `packEntryCount` · `packChapters` · 五分列 `counts` · 全量 `entries`（含 `drift`）· `note`（非真源 · 不回写 verified/entities · dry-run ≠ 已落盘）。

## OUT（摘要）

可写 apply · verified:true · Clew 真写 · auto PATCH · 一键写回 · empty-CTA/return densify · 第四书架 · 掌握%/健康分 · redo DraftInbox/cockpit · 发明视觉 polish · Register 硬门禁 · 批量重抽 chrome

## DEFER

批量重抽队列 · invent heye-only · Register API 硬门禁 · quiz densify · 真视觉缺口（待 desk 目视）· Next.js security = ops
