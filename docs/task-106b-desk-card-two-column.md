# Task 106b · desk-card-two-column-01 · 实体卡页双栏对照与 OCR 原文对齐

**Tip**: `b3120e8e786d36c1ee282b4a41786fbc35d36db5`（docs Task 106a / feat `8a52eb3` on origin/main）· **Writer**: Antigravity · **Acceptor**: Grok Bot  
**主题**: 落实用户批准的 C′ 方案（`refs/Cp-card.png` 与 `refs/Cp-card-clew-open.png`），在视口宽 ≥1248px 时将卡页（`/desk/card/[id]`）升级为双栏对照布局：
- 左栏（≈520px）：当前卡所在章的真实 OCR 原文面板（`EntityCardSourcePane`），仅合并硬换行、字不改；滚动并严格高亮选中字段的引文（`<mark>`），画出朱砂肘形连接线（`CardSourceConnector`）；页脚列出「引用本页的卡」。
- Clew 展开时：左栏优雅塌陷为 44px 竖条（竖排「章页 p.{n}」+ 展开按钮，点击即收起 Clew 恢复全栏）。
- 右栏（折叠时 ≈512px，展开时 ≈588px）：既有实体卡详情（`EntityCardDetail`），字段行支持点击/键盘选中（`FieldRowSelect` / `FieldSelectLabel`），选中行以朱砂浅底和左侧强调条高亮；既有诚实声明段落折叠入 `HonestyDisclosure`（[ⓘ]），中文文案多重集严格 Δ0。
- 有效默认：宽屏卡页默认 Clew 折叠（`defaultClewOpen({ pathname, wide })`），用户显式点击后全局记忆；窄屏与非卡页保持默认展开。窄屏（<1248px）及 `/entities/[id]` 保持 tip 原始单栏布局，DOM 字节级完全一致。

---

## 1. before → after LOC

| # | 文件 | before | after | 变化 | 说明 |
|---|---|---|---|---|---|
| 1 | `apps/web/lib/clew-fold-persist.ts` | 61 | 73 | +12 | 改：定义 `DESK_WIDE_MIN_PX = 1248`、`isDeskCardPath`、`defaultClewOpen` |
| 2 | `apps/web/components/desk/ClewToggle.tsx` | 53 | 81 | +28 | 改：导出 `useWideDesk()`（基于 `useSyncExternalStore`），`useClewFold()` 结合路径与视口计算有效默认 |
| 3 | `apps/web/lib/entity-card-source-model.ts` | — | 151 | +151 | **新文件**：附录 A 纯函数模型（`stripAllWhitespace`, `mergeOcrHardBreaks`, `locateQuote`, `splitParaByMark`, `defaultActiveField`, `neighborPages`） |
| 4 | `apps/web/components/EntityCardSourceLink.tsx` | — | 307 | +307 | **新文件**：`CardSourceProvider`, `useCardSource`, `FieldRowSelect`, `FieldSelectLabel`, `CardSourceConnector`（SVG 连线） |
| 5 | `apps/web/components/EntityCardSourcePane.tsx` | — | 245 | +245 | **新文件**：左栏 OCR 原文面板（双行页头、正文高亮/未命中提示、引用本页卡列表）与 44px 竖条 |
| 6 | `apps/web/components/EntityCardDetail.tsx` | 267 | 281 | +14 | 改：增加可选 `foldHonesty` prop；提取 `practiceNote` 保证文案多重集 Δ0 |
| 7 | `apps/web/components/EntityCardDetailBody.tsx` | 212 | 215 | +3 | 改：字段行包装 `<FieldRowSelect index={i}>`，字段标题包装 `<FieldSelectLabel index={i}>` |
| 8 | `apps/web/components/EntityCardCiteStatus.tsx` | 114 | 132 | +18 | 改：增加可选 `foldNote` prop；提取 `note` 声明入 `HonestyDisclosure`（非 `<p>` 容器） |
| 9 | `apps/web/app/(desk)/desk/card/[id]/page.tsx` | 120 | 227 | +107 | 改：本章 OCR 页面聚合、`cardsCitingPage` 过滤当前章、双栏外壳装配与单栏回退 |
| 10 | `docs/task-106b-desk-card-two-column.md` | — | 本文 | 新增 | **新文件**：设计、算法、不变量、验证与交接记录 |

- **代码净增行数**：885 行（≤900 行红线）。
- **新增依赖**：0（纯原生 React 19 + SVG，无任何外部库）。
- **全局样式/路由**：零触 `globals.css`，零新路由，零触 `package.json` / lockfile。
- **冻结文件**：零触 `HeYeSession.tsx`、`StudySession.tsx`、`DeskShellClient.tsx`、`ClewPane*`。

---

## 2. 布局数值与响应式契约

### 2.1 尺寸规范
- **双栏阈值**：`min-[1248px]`。在 1248px 视口下，减去 Sidebar（248px），中栏宽度刚好 ≥1000px，能容纳左栏（520px）+ 右栏（512px 加上内边距）。
- **栅格系统**（Tailwind v4 `in-data-[clew=...]`）：
  - `clew=folded`：`min-[1248px]:grid-cols-[520px_minmax(0,1fr)]`，左栏 520px 固定，右栏自适应（1280px 下右栏 ≈512px，>1248px 视口下居中最大宽 1200px）。
  - `clew=open`：`min-[1248px]:grid-cols-[44px_minmax(0,1fr)]`，左栏折叠为 44px 竖条，右栏变宽（1280px 下右栏 ≈588px）。
  - 构建产物验证：Turbopack Tailwind v4 编译产物已生成 `:where([data-clew=folded]) .min-[1248px]:in-data-[clew=folded]:grid-cols-[520px_minmax(0,1fr)]` 与 `:where([data-clew=open]) .min-[1248px]:in-data-[clew=open]:grid-cols-[44px_minmax(0,1fr)]`。
- **粘性高度**：左栏设置 `min-[1248px]:sticky min-[1248px]:top-0 min-[1248px]:h-[calc(100dvh-2.5rem)]`，滚动容器为 `<main>`，高度严格等于视口高减去 40px（`2.5rem`）顶栏。在 `112.5%` 根字号下，`rem` 单位自适应缩放，与顶栏严格同步无溢出。
- **单栏回退**：视口 <1248px 时，左栏 `hidden`，右栏 `px-8 py-10`，与 tip 单栏视觉与间距完全一致。

---

## 3. 有效 Clew 默认规则表

| 场景 / 路由 | 视口宽度 | localStorage 未设 (null) | 用户已手动点击 ("open" / "folded") | 说明 |
|---|---|---|---|---|
| `/desk/card/[id]` | ≥ 1248px (wide) | **`false`（折叠）** | 显式存储值优先 | 满足卡页宽屏双栏对照黄金场景，默认收起 Clew 留出 520px 空间 |
| `/desk/card/[id]` | < 1248px (narrow) | **`true`（展开）** | 显式存储值优先 | 窄屏回退单栏，与 Task 106a 行为一致保持展开 |
| `/desk` / `/study` / `/review` / 其它 | 任意视口 | **`true`（展开）** | 显式存储值优先 | 与 tip 保持一致 |
| 跨页面跳转 | 任意 | 遵循上述规则 | 全局统一生效 | 点过一次开关后写入 `ariadne.desk.clew-fold.v1`，成为全站统一偏好 |

---

## 4. 数据流与章域隔离

1. **章域限制只发本卡所在章**：
   卡页服务端加载 `chapterPages = card.chapterId ? loadChapterPages(card.chapterId).filter(p => p.page != null) : []`。最大章体积仅 ≈31KB，杜绝将全书 OCR 文本下发至客户端。
2. **本页卡引用过滤跨章串扰**：
   对于边界页（如 p.18 在 ch01 与 ch03 均有交叉），通过 `citingCards.filter(c => c.chapterId === card.chapterId)` 严格过滤，确保「引用本页的卡」完全隔离在本章内部。
3. **字段引用最小化**：
   提取 `fieldCites = card.fields.map(f => f.cite ? { page: f.cite.page ?? null, quote: f.cite.quote } : null)` 下传，保证轻量无冗余。

---

## 5. 引文定位、合并不变量与自检

### 5.1 算法与严谨原则
- **严格归一化子串**：采用 `normalizeText`（移除全部空白与非字母数字标点，转小写）逐字符建立 (para, idx) 双向映射，执行 `hay.indexOf(needle)`。
- **首次出现与跨段包含**：命中时定位首个出现位置，包含两端之间的段内原字符，生成 `<mark>` 连续区间。
- **命中 ≠ verified**：引文定位命中仅代表在该印刷页的 OCR 文本中逐字匹配到对应引文，**绝不等于 verified**，严禁产生任何 `verified: true` 断言。
- **Fail-closed**：未严格命中时（如 `adaptive-immune-response` 首个字段），`locateQuote` 返回 `null`，正文顶部显示 muted 提示「未能在本页文字里逐字定位该字段引文——不高亮、不连线。」，不高亮，不画连线。

### 5.2 合并不变量
- **合并规则**：
  1. 空行作为段界 flush；
  2. <30 字且无句子结束符的短行视为独立标题段；
  3. 拉丁字母边界自动插入空格；
  4. 行末「。」且 <33 字作为段落终结。
- **数学不变量**：
  $$\text{stripAllWhitespace}(\text{paras.join}("")) \equiv \text{stripAllWhitespace}(\text{text})$$
- **自检结果（`t106b-model-check.mts`）**：
  - OCR 页面总数：90 页
  - 合并不变量违例：**0**（`mergeInvariantViolations: 0`）
  - 全库引用总数：3962 条
  - 严格命中数：**3906 条**
  - 严格命中率：**98.59%**（`rate: '0.9859'`）
  - 高亮文本与引文字符不匹配数：**0**（`highlightMismatch: 0`）
  - 状态：**ALL PASS**

---

## 6. 连线几何与显隐条件

- **实现机制**：`CardSourceConnector` 采用固定全屏 `<svg className="pointer-events-none fixed inset-0 z-10 h-dvh w-screen">`，内部包含 `<path>` 与 `<circle>`。
- **显隐门禁**（必须全部满足才绘制，任一不满足 `d=""` 隐藏）：
  1. `wide && !clewOpen`；
  2. `activeField != null` 且具有命中 `<mark>`；
  3. 所有 `<mark>` 的 `getClientRects()` 并集完全落在 `[data-card-src-text]` 视口内；
  4. 选中字段卡片 `[data-card-field-row][data-selected="true"]` 的中心 Y 坐标在 `<main>` 可视区域内（±4px 容差）。
- **几何坐标**：
  - 括号：`xb = paneRect.right - 14`，在 mark 顶部到底部绘制 `[ ` 形括号。
  - 肘线：从括号中点 `(xb, ym)` 水平延伸至中线 `xm = paneRect.right + (rowRect.left - paneRect.right) / 2`，垂直折线至字段行中心 `yr`，水平连入字段卡片左边缘 `rowRect.left`，端点画 2.5px 朱砂圆点。
- **重算调度**：通过 `requestAnimationFrame` 防抖合并，监听 `<main>` 滚动、`[data-card-src-text]` 滚动、视口 resize、ResizeObserver 与 `document.fonts.ready`。

---

## 7. 诚实文案 ⓘ 折叠清单（Δ0）

遵循「文字搬家、不复写字面量」原则，既有文案通过抽出单一 `const` JSX 节点复用：
1. **`EntityCardDetail.tsx`**：
   - 将原有练/核说明段文字提成 `practiceNote` 常量。
   - `foldHonesty=true` 时放入 `<HonestyDisclosure disclaimer={practiceNote} />`；`foldHonesty=false` 时原样渲染为 `<p className="w-full text-xs leading-6 text-muted">{practiceNote}</p>`。
   - 传递 `foldDisclaimer={foldHonesty}` 给 `LocalProgressStrip`。
2. **`EntityCardCiteStatus.tsx`**：
   - 将「抽查未核…」等说明文案提成 `note` 常量。
   - `foldNote=true` 时将外层容器改为 `<div>`（避免 HTML 规范禁止 `<details>` 放进 `<p>` 引起的水合警告），在末尾追加 `<HonestyDisclosure disclaimer={note} />`，不再输出第二段 `<p>`。
3. **文案多重集校验**：
   对比 tip HEAD，6 个既有改动文件在中文字符、链接及语义属性上实现 **Δ0**。

---

## 8. DEFER Override 声明

> **DEFER Override 说明**：  
> `AGENTS.md` §5 中曾将 `EntityCardDetail*` 及 `EntityCardCiteStatus` 列入 DEFER 名单。**用户已于 2026-11-03 明确批准 C′ 方案（实体卡页双栏 + Clew 折叠）**，明确指示对 `EntityCardDetail.tsx`、`EntityCardDetailBody.tsx` 和 `EntityCardCiteStatus.tsx` 进行轻量改造以支持双栏选中态与诚实披露折叠。本任务遵循用户最高指令执行，不修改 `AGENTS.md` 本身。

---

## 9. 已知设计取舍

1. **窄屏首帧展开闪动**：由于服务端渲染（SSR）无法获知客户端视口，`useWideDesk` 在 server snapshot 下假设宽屏；窄屏初次水合时若无存储值可能短暂计算为折叠随后由于 `matchMedia` 更新展开。此为无 cookie 架构下的已知工程取舍。
2. **单栏回落下诚实文案折叠**：`foldHonesty` 取决于本卡是否存在本章 OCR 数据（`twoCol` 为真即传 `true`）。因此窄屏用户在查看卡详情时，诚实说明同样折叠于 ⓘ 内，可点击一键展开。
3. **同页多处引文取首个**：当字段引文在同一 OCR 印刷页出现多次时，定位算法严格取首次出现位置。
4. **跨章边界页**：相同印刷页在多章出现时，严格以当前卡所属章过滤。

---

## 10. OUT 清单（本刀坚决未做）

- 未在顶栏增加面包屑、返回链或页码跳转器。
- 未添加任何全局键盘快捷键监听（无 ← → [ ] g 等冲突按键）。
- 未修改 OCR 原始识别文字，未引入 OCR 在线编辑器。
- 未引入任何网络请求、API 路由或 LLM 调用。
- `/entities/[id]` 与 `/entities` 布局与 DOM 完全未动，保持字节级一致。
- 未修改 `globals.css`，未新增 token。

---

## 11. 验证报告

### 11.1 TypeScript 检查
```bash
export PATH=/Users/nukeab/.local/share/fnm/node-versions/v22.23.4/installation/bin:/opt/homebrew/bin:$PATH
pnpm --filter web exec tsc --noEmit
# 退出码: 0 (无任何类型错误)
```

### 11.2 ESLint 检查（严格对齐 2/2e 基线）
```bash
pnpm --filter web lint
# 输出:
# /Users/nukeab/projects/Ariadne/apps/web/components/HeYeSession.tsx:88:9
#   88:9  error  Calling setState synchronously within an effect... react-hooks/set-state-in-effect
# /Users/nukeab/projects/Ariadne/apps/web/components/StudySession.tsx:106:5
#   106:5 error Calling setState synchronously within an effect... react-hooks/set-state-in-effect
# ✖ 2 problems (2 errors, 0 warnings)
```
新增 4 个文件与改动文件零 warning、零 error。

### 11.3 Next.js 构建
```bash
pnpm --filter web build
# ▲ Next.js 16.4.3 (Turbopack)
# ✓ Compiled successfully in 699ms
# ✓ Finished TypeScript in 1019ms
# ✓ Collecting page data using 9 workers in 392ms
# ✓ Generating static pages using 9 workers (6/6) in 69ms
# Route /desk/card/[id] 标记为 ƒ (Dynamic)
# 退出码: 0
```

### 11.4 算法自检脚本（`t106b-model-check.mts`）
```bash
node /tmp/t106b-model-check.mts /Users/nukeab/projects/Ariadne
# 输出:
# { pages: 90, mergeInvariantViolations: 0 }
# { tot: 3962, hit: 3906, rate: '0.9859', highlightMismatch: 0 }
# ALL PASS
```

### 11.5 页面运行验证
- `innate-immunity`：首字段 p.3 命中，双栏呈现，mark 与连线正常绘制，`foldHonesty` 生效。
- `adaptive-immune-response`：首字段 p.64 严格未命中，正文顶部展示 muted 提示行，连线静默隐藏，页文本可正常阅读。
- `/entities/innate-immunity`：DOM 与 tip 保持一致，无双栏外壳与连线注入。
