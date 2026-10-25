# Task 69 — clew-long-ground-seed-before-01

**Slug**: `clew-long-ground-seed-before-01`  
**Title**: Clew 诚实三件套 · Long-context 同章有界真接地（服务端按档 · 硬页数/字数顶）+ 补丁 before 从 seed 只读对齐 + 本机用量按档次级面  
**Tip**: `7790c9e`（docs T68） atop `23e059c`（feat T68） atop `52a5333`（T67 docs）  
**体量**: MEGA ~180–300+ min · A–J 全交  
**定稿**: 2026-10-25 Asia/Shanghai (CST)

## 一句话

T68 三档之上，把「Long-context」从**只换模型名**变成真的多页接地：服务端按档装窗——
`groundingPolicyForTier`（fast/reasoning 恒 single 1 页；long-context = chapter-bounded，
`LONG_PAGES_MAX=5` / `LONG_TOTAL_CHARS_MAX=12000` 常量写死）+ `selectGroundPages`（当前页 →
请求上下文 cite 页∩同章 → 近邻补齐；硬顶；升序去重）；锚章 = 命中当前页的那章（**同章 only**，
缺章/缺 blocks 诚实降级单页）。补丁 `before` 从当前卡 seed **只读**导出
（`buildSeedBeforeMap`；空 → null；截 `SEED_BEFORE_MAX_CHARS=200`），流 meta 随白名单带给
ClewPane 回填（模型自报 before 不透传），气泡逐条 before→after 人核行；用量
`todayUsageByTier` → `status.usage.byTier` → 底栏「本机今日 N 次（快 a · 推 b · 长 c）」。
保留 T66–T68 全部（五禁 / bulk 拒收 / streamText NDJSON / 补丁白名单 / PatchPasteBlock /
显式 fillDrafts / 三档不悄换 / 档位芯片 / 用量 append）。

## 铁合同（硬 · 铁 · 每个字母遵守）

1. **只读答** —— 不写 entities / blocks / verified / 自动 PATCH seed。本刀唯一可写仍是
   `data/qa/clew-usage.jsonl`（gitignored · 非真源）。
2. **继承 T67/T68** —— 进本机草稿须用户粘贴或显式点击；发送回调永不 `setAtomDraft`；
   补丁白名单主路径未重写（只加 before 对齐）；DraftInbox / PatchPasteBlock 兼容不动。
3. **三档不悄换** —— `resolveClewTier` 语义零改动；缺档仍 503。
4. **永不 bulk** —— 单问 + 当前书桌上下文；`chapters[]` / `pages[]` / 多卡 / extract·parse 形仍 422。
   Long-context 扩窗 = **服务端同章有界自取**，不是客户端作业。
5. **Long-context 有界铁顶** —— 同章 only；`LONG_PAGES_MAX≤5`、`LONG_TOTAL_CHARS_MAX≤~12000`
   （常量写死可微调）；单页仍 `truncatePageText`；缺章/缺 blocks → 诚实降级；
   Fast/Reasoning 恒单页（prompt 与 T66–T68 逐字节同形）。
6. **fail-closed** —— 缺钥/缺档/中断/读盘失败 → stub 或可见错或诚实缺窗；因字顶未装的页
   如实报数（`pagesOmitted`），不装「完整章」假象。
7. **不做诊断 · 建议 ≠ 已核 · 页码只采信请求上下文 + 服务端自取同章窗**（系统提示不变）。
8. **钥只服务端 env** —— meta/响应/用量/doc 永不含钥。
9. **不 redo** Clew 三 tab / Changes / Queue / return / buildSuggestions / T66–T68 流式·补丁·
   三档芯片·用量 append。
10. **精炼** —— 无 LiteLLM 网关 / Auto / BYOK / Mentrix 云额度墙；用量按档 ≠ 掌握% / Due。

## 路径表（A–J）

| 路径 | 字母 | 要点 |
|------|------|------|
| `apps/web/lib/clew-suggest.ts` | **A · B · C · D** | `groundingPolicyForTier` / `selectGroundPages` / `groundPagesOf` + `LONG_PAGES_MAX` / `LONG_TOTAL_CHARS_MAX` / `SEED_BEFORE_MAX_CHARS`；`ClewGrounding.extraWindows` + `ground`（pageWindow+extraWindows 写死一形，meta 同步）；`buildContextBlock` 多页标注（同章有界 · 非全书 · 总字对顶 · 未装页报数）；`ClewSeedBefore` / `buildSeedBeforeMap`；`parseSuggestPatchEntries`/`splitStructuredPatch` 第三参 before 回填（只认 seed 导出）；envelope note `before=当前卡 seed 现值`；takeaway 多页行；meta 事件 `groundPages?` / `seedBefore?` |
| `apps/web/app/api/clew/suggest/route.ts` | **B · C · D** | `buildGrounding(ctx, tier)`：锚章=命中当前页那章；long-context 逐页 truncate + 总字顶装窗（超顶 `pagesOmitted`）；fast/reasoning 单页原样；卡块追加 `g.seedBefore`；meta 事件与非流 200 都带 `groundPages` / `seedBefore` |
| `apps/web/lib/clew-usage.ts` | **F** | `countTodayByTier`（纯）+ `todayUsageByTier`（fs best-effort）；三键恒在；与 `countToday` 同口径 |
| `apps/web/app/api/clew/status/route.ts` | **F** | `usage.byTier`（保留 `today`；不调模型不回钥） |
| `apps/web/components/desk/ClewPane.tsx` | **E · F** | meta 解析 `seedBefore`/`groundPages`；done 剥围栏带 before；live 底「接地 p.N…（同章有界）」次级标 + 补丁逐条 before→after 人核行（截显 + title 全文）；底栏分档括注；`bumpUsage(tier)` 分档 bump（200/502 才计） |
| `scripts/clew-suggest-check.mjs` | **A–F 机检** | 37→**50** 用例：fast≤1 页 / long≤铁顶 / 选择序（当前页·cite∩同章·近邻·硬顶·缺章空）/ 多页标注 / groundPagesOf / seedBefore 有值·空·发明不入 / before 只认 seed 导出（自报不透传）/ 分档计数 / meta 无钥 |
| `docs/clew-mac-env.md` | **G** | 最小旁注：同章有界真接地 + before 一句 + status `byTier` 期望形 + meta `groundPages`（无 key 值，不重写全文） |
| `docs/task-69-clew-long-ground-seed-before.md` | **H** | 本文 |

## 接地选择序（A2 · 写死）

`selectGroundPages({ currentPage, citePages, chapterPages, maxPages })`：
候选 = 该章 blocks 里**有文本**的印刷页（服务端自取）；优先序 = 当前页 → cite 页（**须同章**，
跨章不采）→ 同章近邻（按与当前页距离，平手低页）；去重后 `maxPages` 硬顶，返回升序阅读序。
`maxPages≤0` / 缺章 → 空数组（不编页）。

## OUT（本刀 + forever）

LiteLLM 网关 · Auto 路由 · BYOK · Mentrix 式云端额度墙 · 缺档钥悄换另一档 · Clew 真写实体 ·
`verified:true` · auto PATCH · 静默 `setAtomDraft` · 发明 atom id · bulk · 客户端 `pages[]` 作业形 ·
无硬顶整章全书塞 prompt · 一键写回 · empty-CTA / return densify · redo T46–T68 · 第四书架 ·
掌握% / 健康分圆环 · Register 硬门禁 · 批量重抽 chrome · key 入仓/docs/前端 · 改名既有 storage keys。

## DEFER（后续刀）

LiteLLM 网关 · Auto 路由 · BYOK · 云配额墙 · 批量重抽 · invent heye-only · Register 硬门禁 ·
quiz densify · 用量按日/按档聚合视图扩展（现只今日总数 + 今日分档）· Long-context 跨章窗
（永远不做则删）。
