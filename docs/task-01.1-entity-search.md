# Task 01.1 — 实体卡列表悬浮搜索（zcode）

**状态**：待执行  
**仓库**：`Nur562-svg/Ariadne`（本机 `/Users/nukeab/projects/Ariadne`；GitHub 已同步）  
**主写手**：zcode  
**前置**：Task 01 工程已过；抽查 10/10（含免疫/固有免疫终验）

---

## 目的

`/entities` 卡一多就难找。加一个**小、不挡阅读**的悬浮搜索，按名称快速过滤。

---

## 成功标准

1. `/entities` 有悬浮搜索入口；默认收起或极窄，展开后仍不遮住卡片标题区主内容。
2. 输入即时过滤（≤50ms 体感，纯前端即可）：匹配 `name_zh` / `name_en` / `aliases` / `id`（大小写不敏感；中文子串）。
3. 空查询 = 显示当前 kind 筛选下的全部卡；有查询时列表只留命中项，并显示「N 结果」。
4. 与现有 kind 筛选**可叠加**（先 kind，再 search）。
5. Esc 清空并收起（若有展开态）；移动端可用（宽度 ≥320）。
6. 视觉：贴合现有纸感 + 朱砂强调；搜索框高度约 36–40px，圆角，不强出一整个工具栏。
7. `pnpm --filter web build` 通过；不改动实体卡 JSON / OCR 数据。

---

## 建议实现

- 新建客户端组件，例如 `apps/web/components/EntitySearch.tsx`（`'use client'`），挂在 `apps/web/app/entities/page.tsx`。
- 列表过滤可：
  - **A（推荐）**：URL `?q=` + 服务端/客户端读 `searchParams`（可分享链接），或
  - **B**：纯 client state 过滤已加载的 cards（实现更快）。
- 悬浮位置建议：视口右下或顶栏右侧小按钮 → 展开为输入框；不要用占半屏的 modal。
- 无障碍：`<input type="search">` + `aria-label="搜索实体卡"`；有结果时 `aria-live="polite"`。

## 明确不做

- 全文检索 OCR、语义搜索、后端索引
- 改 desk 主壳、FSRS、Clew
- 大改视觉体系 / 上完整 shadcn 套件（可用原生 input + 现有 token）

---

## 验收时我会查

- 搜「半抗原」「hapten」「PRR」「佐剂」能否命中
- kind=molecule + q 叠加是否正确
- 40 张全量时滚动中悬浮是否仍可用、是否挡住卡片点击

做完回：改动文件列表 + 本地截图或 `pnpm dev` 路径；我再 push/审。
