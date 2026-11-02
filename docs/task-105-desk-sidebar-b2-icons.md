# Task 105 · desk-sidebar-b2-icons-01 · 侧栏 B′ 视觉

**Tip**: `19ffd28`（full `19ffd28fdd889c36c15a8139f87b4de5e4e76a6f` = T104 docs on origin/main）· **Writer**: Antigravity · **Acceptor**: Grok Bot  
**主题**: 考前书桌左栏 `apps/web/components/desk/Sidebar.tsx` 按用户选定的 B′ 视觉规范改造——主/次导航引入 16×16 线图标（colocated `SidebarIcons.tsx`）、主行 label+hint 纵向叠放、active 状态应用 soft fill + 满血朱砂 + semibold + inset 2px 左朱砂线（arbitrary shadow 实现）、彻底修复 T104 登记的 active hint 对比度债（3.47:1 → 4.80:1）、品牌头去掉 `mono` 继承仓库 CJK 宋体族、主 nav 到「入口」间距调整至 32px（`mt-8`）、底部动作区统一 ≥28px 安静 pill 交互高。中文文案、链接构造、aria、onClick 逻辑 100% 保持不变。

---

## 1. before → after LOC

| 文件 | before | after | 变化 | 说明 |
|---|---|---|---|---|
| `apps/web/components/desk/Sidebar.tsx` | 308 | 326 | +18 | 引入图标引用、B′ className 与纵向 label/hint 结构 |
| `apps/web/components/desk/SidebarIcons.tsx` | — | 134 | +134 | **新文件**：6 个 16×16 线图标 SVG 组件（严格对齐 B2 mockup path） |
| `docs/task-105-desk-sidebar-b2-icons.md` | — | 122（含验收补记） | 新增 | **新文件**：本任务实施与验证记录 |

- **新依赖**: 0（未引入 `lucide-react` 或任何第三方图标库，内联 SVG）
- **路由/全局样式**: 0（零触 `globals.css`、零触 `layout.tsx`）
- **冻结文件**: 零触 `HeYeSession.tsx` 与 `StudySession.tsx`

---

## 2. 逐元素变更清单（对齐任务书 §4 项 1–18）

| # | 位置 | 元素 | before（tip `19ffd28`） | after | 说明 |
|---|---:|---|---|---|---|
| 1 | :137 | 品牌 `<Link>` | `mono text-sm tracking-widest text-foreground no-underline focus-visible:outline-2 focus-visible:outline-cinnabar` | `text-[19px] font-semibold leading-7 tracking-[0.12em] text-foreground no-underline focus-visible:outline-2 focus-visible:outline-cinnabar` | 去掉 `mono`，继承 `html` 宋体族；字号 19px + 半粗 + B′ 字距 |
| 2 | :138 | 品牌点 | `ARIADNE<span className="text-cinnabar">·</span>` | 逐字一致 | 结构与文案不变 |
| 3 | :140 | 考前书桌 | `<p className="mt-1 text-xs text-muted">考前书桌</p>` | 逐字一致 | 保留原样 |
| 4 | :39–44 | `PRIMARY` 常量 | `{ href, label, hint }` | `{ href, label, hint, icon }` | 增加对应组件引用：`IconDesk` / `IconStudy` / `IconReview` / `IconShelf`；文案与 hint 字节级不变 |
| 5 | :153 | 主行 `<Link>` | 静态：`flex min-h-9 items-baseline justify-between gap-2 …`；active：`bg-cinnabar-soft font-semibold text-cinnabar`；inactive：`text-foreground/85 hover:bg-background` | 静态：`flex min-h-9 items-start gap-2.5 …`；active：`bg-cinnabar-soft font-semibold text-cinnabar shadow-[inset_2px_0_0_0_var(--cinnabar)]`；inactive 分支保留 | `items-start gap-2.5` 适应左图标 + 右纵向文字；`shadow-[inset_2px_0_0_0_var(--cinnabar)]` 呈现 2px 左朱砂线且不挤占内边距 |
| 6 | :158–172 | 主行内结构 | `<span>label</span>` + 右侧 `<span>hint</span>`（`text-cinnabar/80`） | `<item.icon className="mt-0.5 size-4 shrink-0 …" />` + `<span className="min-w-0 flex-1">` 包含 label 及 hint（`text-cinnabar`） | 纵向叠放；active hint 采用满血 `text-cinnabar`，带 `font-normal` 防止继承加粗 |
| 7 | :178 | 「入口」容器 | `<div className="mt-6 px-5">` | `<div className="mt-8 px-5">` | 组间距由 24px（`mt-6`）扩至 32px（`mt-8`） |
| 8 | :179 | 「入口」标签 | `text-[11px] leading-4 tracking-wider text-muted` | `text-xs font-semibold leading-4 tracking-[0.14em] text-muted` | 12px 半粗 + B′ 呼吸字距 |
| 9 | :46–49 | `SECONDARY` 常量 | `{ href, label }` | `{ href, label, icon }` | 增加 `IconLayers` / `IconUpload` 引用 |
| 10 | :189 | 次行 `<Link>` | 静态：`min-h-8 truncate …`；active：`bg-cinnabar-soft text-cinnabar`；inactive：`text-muted hover:bg-background hover:text-foreground` | 静态：`flex min-h-8 items-center gap-2.5 truncate …`；active：`bg-cinnabar-soft text-cinnabar shadow-[inset_2px_0_0_0_var(--cinnabar)]`；inactive 分支保留 | 增加 `items-center gap-2.5`；active 同样具备 2px 左朱砂线 |
| 11 | :196–199 | 次行内容 | 纯文本 `{item.label}` | `<item.icon className="size-4 shrink-0 …" />` + `<span className="min-w-0 truncate">{item.label}</span>` | 图标 + 文案水平居中对齐 |
| 12 | :206 | footer 容器 | `shrink-0 border-t border-line px-5 py-4` | 保持 `px-5 py-4` | 原样保留发丝分割线与内边距 |
| 13 | :209 | 「在读书目」标签 | `text-[11px] leading-4 tracking-wider text-muted` | `text-xs font-semibold leading-4 tracking-[0.14em] text-muted` | 与「入口」严格对齐 |
| 14 | :210–216 | 书名 `<Link>` | `mt-2 block truncate text-sm font-medium leading-6 text-foreground …` | 保持不变 | 保留宋体 medium 呈现 |
| 15 | :224 | 动作行 `<p>` | `mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs` | `mt-2.5 flex flex-wrap gap-x-1.5 gap-y-1 text-xs` | pill 间隙收紧至 6px（`gap-x-1.5`） |
| 16 | :235 | 「学习 →」`<Link>` | `text-muted no-underline hover:text-cinnabar focus-visible:…` | `inline-flex min-h-7 items-center rounded-md px-2.5 py-1 text-muted no-underline hover:bg-background hover:text-cinnabar focus-visible:…` | ≥28px 点击高；安静 hover 底色；无多余阴影/边框 |
| 17 | :244 / :266 | 空池 `<span>` | `className="text-muted"` | `className="inline-flex min-h-7 items-center rounded-md px-2.5 py-1 text-muted"` | 占位尺寸与可点击态严格保持一致 |
| 18 | :280 | 「换书 ▾」`<summary>` | `cursor-pointer list-none text-xs text-muted transition-colors hover:text-cinnabar …` | `inline-flex min-h-7 cursor-pointer list-none items-center rounded-md px-2.5 py-1 text-xs text-muted transition-colors hover:bg-background hover:text-cinnabar …` | 达到 28px 高度，与学习/核页 pill 体验对称 |

---

## 3. 图标资产清单（`SidebarIcons.tsx`）

全部遵循：`viewBox="0 0 24 24"` · `width={16}` `height={16}` · `fill="none"` · `stroke="currentColor"` · `strokeWidth={1.85}` · `strokeLinecap="round"` · `strokeLinejoin="round"` · `aria-hidden="true"`。

| 图标组件 | 对应导航 | SVG Path / 子节点真源 |
|---|---|---|
| `IconDesk` | 书桌 | `<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>` |
| `IconStudy` | 学习 | `<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>` |
| `IconReview` | 复习 | `<path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5"/><path d="m9 11 3 3L22 4"/>` |
| `IconShelf` | 书架 | `<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>` |
| `IconLayers` | 实体卡浏览器 | `<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>` |
| `IconUpload` | 导入教材 | `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>` |

---

## 4. 对比度核算（彻底解决 T104 登记债务）

| 前景 / 背景 | tip 现状 | B′ after | 判定 |
|---|---|---|---|
| active hint `cinnabar/80` on `cinnabar-soft` | ~**3.47:1**（T104 登记债） | 满血 `text-cinnabar` on `cinnabar-soft` → **~4.80:1** | **PASS**（消灭 <4.5:1，达标 WCAG AA） |
| active label & icon `cinnabar` on `cinnabar-soft` | ~4.80:1 | **~4.80:1** | **PASS** |
| inactive hint & icon `muted` on `card` | ~5.29:1 | **~5.29:1** | **PASS** |
| inactive label `foreground/85` on `card` | ~9.50:1 | **~9.50:1** | **PASS** |
| footer pill hover `muted` on `background` | ~5.07:1 | **~5.07:1** | **PASS** |

---

## 5. 验证与回归保证

1. **编译与类型检查**:
   - `pnpm --filter web exec tsc --noEmit` 退出码: `0`
2. **ESLint 基线**:
   - `pnpm --filter web lint` 退出码: `1`
   - 输出: 恰好 `2 problems (2 errors, 0 warnings)`，位于冻结文件 `HeYeSession.tsx:88` 与 `StudySession.tsx:106`，零触碰，基线无漂移。
3. **Next.js 生产构建**:
   - `pnpm --filter web build` 成功完成，Turbopack 正常编译所有静态与动态路由。
4. **文案与属性 Multiset 校验**:
   - 中文文案多重集: `True`（Δ0）
   - `href`、`aria-label`、`aria-current`、`title` 集合: `True`（Δ0）
5. **白名单与零触文件检查**:
   - Tracked diff 仅包含 `apps/web/components/desk/Sidebar.tsx`。
   - `globals.css`、`layout.tsx`、`DeskShellClient.tsx`、`HeYeSession.tsx`、`StudySession.tsx` SHA256 均与 tip `19ffd28` 一致。

---

## 6. 验收实测量值（Grok Bot · 2026-11-02 · Mac headless Chrome + CDP · `next build && next start` · 临时 worktree/临时数据，未动仓库数据）

> 本节由验收方补记（写手原稿无量值节；§1 doc 行数 ~160 已更正）。before = tip `19ffd28` 的 `git archive`；after = tip + 白名单三文件。

**声明（未发明额外打磨）**：本刀 diff 仅含任务书 §4 #1–#18 列出的 className / 结构变更与 `SidebarIcons.tsx`；无 B′ 合同之外的「顺手打磨」，无新依赖，`globals.css` 零触。

| 量（1280×800，100% 字号，`/desk`） | 实测 | 合同 |
|---|---|---|
| 主行 / 次行图标 `getBoundingClientRect` | 16×16（112.5% 下 18×18，随 rem） | ≈16×16 |
| 图标右缘 → label 左缘 | 10px（112.5%：11.3px） | ≈10px |
| 图标 stroke-width computed | 1.85px | 1.85–2 |
| active 行 computed `box-shadow` | `…, rgb(178, 58, 42) 2px 0px 0px 0px inset` | inset 2px 朱砂 |
| active 行 bg / color | `rgb(246,227,222)` / `rgb(178,58,42)`，`font-weight 600` | soft + cinnabar + semibold |
| active hint color / font-weight | `rgb(178,58,42)`（= `--cinnabar`，非 alpha 0.8）/ 400 | 满血 cinnabar |
| inactive 图标 / hint color | `rgb(111,106,96)`（= `--muted`） | muted |
| 主行高 | 53px（label 20 + hint 16 + 内边距） | 双行 |
| 主 nav 末行 bottom → 「入口」顶 | 32px（112.5%：36px，`mt-8` 随 rem） | 28–32 |
| 品牌 / 「入口」 / 「在读书目」 font-family | `"Songti SC", "Noto Serif CJK SC", …`（非 mono）；品牌 19px/600/ls 2.28px；组标签 12px/600/ls 1.68px | 宋体族 + 半粗 + 宽字距 |
| footer「学习 →」「核页 →」命中高 | 28px（112.5%：31.5px），无 shadow / 无 border，圆角 6px | ≥28 |
| 「换书 ▾」summary 高 | 28px（112.5%：31.5px） | ≥28 |
| footer `border-top` | 1px | 保留 |
| 1280×800 / 1280×600 / 112.5% 行横向溢出 | 无（`aside` / 中段 / 各行 `scrollWidth ≤ clientWidth`）；最长 hint「本机自评 · 不熟再练」在 112.5% 下仍未触发 truncate | 单列、不撑破 |
| 单书 1280×600：中段 scrollHeight / clientHeight | 375 / 375（不溢出；任务书「短视口中段可滚」在单书不成立，沿袭 T104 同一结论） | — |
| 多书（4 本）+ 换书展开：1280×420 | 中段 368 / 102 → 可滚（scrollTop 266），品牌头 bottom 88、footer bottom == aside bottom（钉住） | 头/footer 钉住 |
| 多书 112.5% × 600 | 中段 414 / 243 → 可滚，footer bottom 600 == aside bottom | 同上 |
| `/ingest` · `/entities`（无侧栏）截图 | 与 tip **逐像素一致**（4 个视口全部 bbox=None） | 逐像素一致 |
| `/desk` `/study` `/review` `/` 主区（x≥249） | 与 tip 一致（仅 desk@800 有 ≤2 通道和的亚感知渲染噪声，before-vs-before 同样出现） | — |

**键盘 Tab 扫描**（多书临时数据，1280×800 / 112.5%×600 / 1280×420）：品牌 → 书桌 → 学习 → 复习 → 书架 → 实体卡浏览器 → 导入教材 → 书名 → 学习 → 核页 → 换书 ▾；每步均 `outline: solid 2px rgb(178,58,42)`、`:focus-visible` 命中；首行/末行环在静止态未被中段裁剪（T104 `pt-1`/`pb-4` 仍有效）。

**验收观察（未改）**：短视口（420）下，Tab 到「复习」触发最小 scroll-into-view 时，该行底部 focus 环被中段容器下沿裁掉 1–2px（`rect.bottom == 容器 bottom`）；T104 已登记同一问题，非本刀回归。候选后续：中段滚动容器加 `scroll-py-1`。
