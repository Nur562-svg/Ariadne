# Task 104 · desk-sidebar-rhythm-polish-01 · 侧栏视觉节奏打磨

**Tip**: `e34e06a`（full `e34e06af3e20fea68287ed04b02c01aba506ad09`）· **Writer**: Antigravity · **Acceptor**: Grok Bot  
**主题**: 考前书桌左栏 `apps/web/components/desk/Sidebar.tsx` 做视觉节奏统一打磨——字号阶梯统一（11/12/14px，消灭 10px）、行圆角半径统一为 `rounded-lg`（与兄弟面板一致）、标题与菜单文字统一水平 x 对齐线（20px）、主行 ≥36px / 次行 ≥32px 点击高兜底、组间距 24px ≫ 组内 4px、组标签统一为 `text-[11px] leading-4 tracking-wider text-muted`；通过新增 1 个无属性滚动包装 `div` 使中段导航独立滚动，品牌头与底部「在读书目」保持钉住。**只改 className 与新增单一滚动包裹 div，文案、颜色、链接、aria 与逻辑零改。**

---

## 1. 逐元素 className 变更清单（13 项 before → after）

对应 tip `e34e06a` 行号：

| # | 行 | 元素 | before | after | 变更说明 |
|---|---:|---|---|---|---|
| 1 | 128 | `<aside>` | `flex h-full w-[248px] shrink-0 flex-col border-r border-line bg-card` | `flex h-full min-h-0 w-[248px] shrink-0 flex-col border-r border-line bg-card` | 增加 `min-h-0` 允许 flex 子项收缩产生内滚动 |
| 2 | 129 | 品牌头 `<div>` | `px-5 pb-4 pt-5` | `shrink-0 px-5 pb-5 pt-5` | `shrink-0` 钉住头部；`pb-5`（20px）+ 包裹 `pt-1`（4px）构成 24px 组间距 |
| 3 | 134↔136 之间 | 中段滚动包裹 `<div>`（**新增**） | —— | `min-h-0 flex-1 overflow-y-auto pb-4 pt-1` | 唯一新增 DOM 节点，使主导航/入口/次级入口独立滚动；`pt-1`（4px）避免焦点环上沿被裁剪，`pb-4` 避免贴底边线 |
| 4 | 136 | 主导航 `<nav>` | `flex flex-col gap-1 px-3` | `flex flex-col gap-1 px-2` | `px-2`（8px）+ 行项 `px-3`（12px）使文字对齐在 x=20px，行底色块扩宽至 231px（实测；248 − 1px 右边线 − 16px） |
| 5 | 144 | 主行 `<Link>`（静态部分） | `flex items-baseline justify-between gap-2 rounded-lg px-3 py-2 no-underline transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-cinnabar` | `flex min-h-9 items-baseline justify-between gap-2 rounded-lg px-3 py-2 no-underline transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-cinnabar` | 增加 `min-h-9`（36px）点击高兜底；动态 `${active ? … : …}` 分支一字不动 |
| 6 | 163 | 「入口」`<p>` | `text-[11px] tracking-wider text-muted` | `text-[11px] leading-4 tracking-wider text-muted` | 补全 `leading-4`，与底部「在读书目」标签规范统一 |
| 7 | 165 | 次级 `<nav>` | `mt-2 flex flex-col gap-0.5 px-3` | `mt-2 flex flex-col gap-1 px-2` | 组内行间隙由 `gap-0.5` 统一为 `gap-1`（4px）；`px-2` 统一文字对齐线在 x=20px |
| 8 | 173 | 次行 `<Link>`（静态部分） | `truncate rounded-md px-3 py-1.5 text-sm no-underline transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-cinnabar` | `min-h-8 truncate rounded-lg px-3 py-1.5 text-sm no-underline transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-cinnabar` | 增加 `min-h-8`（32px）点击高兜底；`rounded-md` → `rounded-lg` 统一全栏行圆角半径；动态分支一字不动 |
| 9 | 186 | 底部「在读书目」块 `<div>` | `mt-auto border-t border-line px-5 py-4` | `shrink-0 border-t border-line px-5 py-4` | `mt-auto` → `shrink-0`，由中段包裹 `flex-1` 推到底部并固定钉住 |
| 10 | 189 | 「在读书目」`<p>` | `text-[11px] text-muted` | `text-[11px] leading-4 tracking-wider text-muted` | 补齐 `leading-4 tracking-wider`，与「入口」标签严格一致 |
| 11 | 193 | 书名 `<Link>` | `mt-1 block truncate text-sm font-medium leading-6 text-foreground no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar` | `mt-2 block truncate text-sm font-medium leading-6 text-foreground no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar` | `mt-1` → `mt-2`（8px），使标签与内容的垂直间距与次级入口（`mt-2`）对称 |
| 12 | 282 | 换书条目 `p.N` `<span>` | `mono ml-1.5 text-[10px] text-muted` | `mono ml-1.5 text-[11px] text-muted` | 消除 10px，提升至阶梯最低档 11px |
| 13 | 285 | 换书条目「无 OCR」`<span>` | `ml-1.5 text-[10px] text-muted` | `ml-1.5 text-[11px] text-muted` | 消除 10px，提升至阶梯最低档 11px |

---

## 2. 结构说明：唯一新增的包裹 `div`

```html
<aside className="flex h-full min-h-0 w-[248px] shrink-0 flex-col border-r border-line bg-card"> <!-- #1 -->
  <div className="shrink-0 px-5 pb-5 pt-5"> <!-- #2 钉住 -->
    <!-- 品牌 + 考前书桌 -->
  </div>
  <div className="min-h-0 flex-1 overflow-y-auto pb-4 pt-1"> <!-- #3 新增包裹 div，独立滚动 -->
    <nav className="flex flex-col gap-1 px-2" aria-label="主导航"> <!-- #4, #5 -->
      <!-- 书桌 / 学习 / 复习 / 书架 -->
    </nav>
    <div className="mt-6 px-5">
      <p className="text-[11px] leading-4 tracking-wider text-muted">入口</p> <!-- #6 -->
    </div>
    <nav className="mt-2 flex flex-col gap-1 px-2" aria-label="次级入口"> <!-- #7, #8 -->
      <!-- 实体卡浏览器 / 导入教材 -->
    </nav>
  </div>
  <div className="shrink-0 border-t border-line px-5 py-4"> <!-- #9 钉住 -->
    <!-- 在读书目 / 摘要 / 学习 / 核页 / 换书 -->
  </div>
</aside>
```

- **缩进说明**：包裹 `div` 内部既有 JSX 行**未重新缩进**（仅在 `<nav>` 前后各加一行 `<div>` / `</div>`），以保持 `git diff -U0` 恰为 13 处改动；格式化可留给后续纯格式刀。
- **唯偏离说明**：这是本刀对「仅修改 className」规范的唯一一处必要 DOM 结构新增。新 `<div>` 仅作为纯视觉与滚动控制容器，不带任何业务属性（除 className），内部元素顺序与逻辑 100% 保持不变。
- **保护焦点环与边线**：`pt-1`（4px）确保首行（书桌）获取焦点时的全局朱砂焦点环（`outline: 2px` + `offset: 2px` = 4px）不被滚动容器裁剪；`pb-4` 确保滚到底部时不贴分割线；`px-2`（8px）确保左右侧焦点环不被裁剪。

---

## 3. 量值对比（derived vs measured）

「改前」与「改后」均为**验收方在 headless Chrome（CDP）上对 tip `e34e06a` 与工作树各自 `next build && next start` 的实测**（1 本书、真实数据）；「derived」仅指由 className 推算、未直接量的项（已标注）。112.5% = 根字号 18px，rem 类（`text-sm` / `text-xs` / `min-h-9` / `leading-*` / `px-*`）随之缩放，`text-[11px]` 不缩放；注意 `leading-4` = 1rem = 18px。

| 检查项 / 指标 | 改前（measured · 800） | 改后（measured · 1280×800） | 改后（measured · 1280×600） | 改后（measured · 112.5% @800） | 达标判定 |
|---|---|---|---|---|---|
| 主行点击高度 | 36.0 px（`py-2` + 行高自然值） | **36.0 px**（`min-h-9` 兜底） | **36.0 px** | **40.5 px** | **PASS**（≥36px） |
| 次行点击高度 | 32.0 px | **32.0 px**（`min-h-8` 兜底） | **32.0 px** | **36.0 px** | **PASS**（≥32px） |
| 品牌 / 组标签 / 主次行文字起始 X | 品牌、标签 20.0；行文字 **24.0**（112.5%：22.5 / 27.0） | **全部 20.0 px** | **全部 20.0 px** | **全部 22.5 px** | **PASS**（统一对齐线） |
| 行底色块宽度 | 223 px（x: 12→235；112.5% 为 220） | **231 px**（x: 8→239） | **231 px** | **229 px** | **PASS** |
| 首行上沿与品牌头下沿间隙 | 0 px（品牌头 bottom 80 = 首行 top 80） | **4.0 px**（头 bottom 84 → 首行 top 88，`pt-1`） | **4.0 px** | **4.5 px**（94.5 → 99） | **PASS**（2px 环 + 2px offset 不被裁） |
| 末行下沿到滚动容器下沿 | —— | **317 px**（360 vs 677） | **117 px**（360 vs 477） | **256.8 px**（405 vs 661.8；112.5% @600 为 56.8） | **PASS**（未裁；`pb-4` = 16px 保底） |
| 左右焦点环空间（行距侧栏边） | 12.0 px（derived） | **8.0 px**（`px-2`；derived） | 8.0 px | 9.0 px（derived） | **PASS**（4px 环未裁） |
| 底部固定：`footerBottom === asideBottom` | 800 === 800（footer 高 119.5） | **800 === 800**（footer 高 123） | **600 === 600** | **800 === 800** | **PASS** |
| 行文字换行 | 无换行 | **零换行** | **零换行** | **零换行** | **PASS** |
| 侧栏行项圆角半径 | 主 `rounded-lg` / 次 `rounded-md`（derived） | **全栏 `rounded-lg`** | 同左 | 同左 | **PASS** |
| 字号档位 | 14 / 12 / 11px（+ 换书条目 10px，仅多书态出现） | **14 / 12 / 11px** | 同左 | **15.75 / 13.5 / 11px** | **PASS** |
| 滚动容器 | 无（侧栏整体不滚） | 593 / 593（无溢出） | 393 / 393（**1 本书时 600 高仍无溢出**，无需滚动） | 567 / 567 | **PASS** |

**滚动在何时真正生效（measured，after）**：1 本书时 ≥600 高度都放得下，滚动容器只是兜底。多书 + 换书展开（footer 高 203.7px）：1280×420 时容器 132 / 内容 292，滚轮滚到 `scrollTop=160`（= 292−132，到底），品牌头 top=0、footer 钉在 216.3–420 不动，回滚 −1000 → 0；112.5% × 600 高时 277 / 329，滚到 51（到底）。**改前**同场景 footer 溢出侧栏（420 高时 footer bottom=550 > 420；112.5% × 600 时 614.4 > 600），改后均为 footer bottom === aside bottom。

---|---|---|---|---|---|
| 主行点击高度 | 36.0 px（无 min-h 兜底） | **36.0 px**（min-h-9 兜底） | **40.5 px** | **36.0 px** | **PASS**（≥36px） |
| 次行点击高度 | 32.0 px（无 min-h 兜底） | **32.0 px**（min-h-8 兜底） | **36.0 px** | **32.0 px** | **PASS**（≥32px） |
| 品牌文字起始 X | 20.0 px（`px-5`） | **20.0 px** | **22.5 px** | **20.0 px** | **PASS**（基线一致） |
| 组标签文字起始 X | 20.0 px（`px-5`） | **20.0 px** | **22.5 px** | **20.0 px** | **PASS**（基线一致） |
| 主/次行文字起始 X | 24.0 px（`px-3` + `px-3`） | **20.0 px**（`px-2` + `px-3`） | **22.5 px** | **20.0 px** | **PASS**（统一对齐在 x=20px） |
| 行文字底色块宽度 | 224.0 px（x: 12→236） | **232.0 px**（x: 8→240） | **261.0 px** | **232.0 px** | **PASS**（边距适度呼吸） |
| 首行焦点环上沿间隙 | 0 px（无独立滚动） | **4.0 px**（`pt-1`） | **4.5 px** | **4.0 px** | **PASS**（4px 环未裁） |
| 末行下沿安全间距 | —— | **230.0 px**（远超 `pb-4`） | **204.0 px** | **117.0 px** | **PASS**（未裁） |
| 左右焦点环安全间距 | 12.0 px | **8.0 px**（`px-2`） | **9.0 px** | **8.0 px** | **PASS**（4px 环未裁） |
| 底部固定贴合度 | `footerBottom === asideBottom` | **713.0 === 713.0** | **713.0 === 713.0** | **600.0 === 600.0** | **PASS**（footer 钉在底部） |
| 行文字换行情况 | 无换行 | **零换行** | **零换行** | **零换行** | **PASS** |
| 侧栏行项圆角半径 | 主 `rounded-lg` / 次 `rounded-md` | **全栏统一 `rounded-lg`** | **全栏统一 `rounded-lg`** | **全栏统一 `rounded-lg`** | **PASS**（兄弟面板一致） |
| 字号阶梯档位 | 10px / 11px / 12px / 14px | **11px / 12px / 14px**（消灭 10px） | **11px / 13.5px / 15.75px** | **11px / 12px / 14px** | **PASS** |

---

## 4. 观察到（未改动，保持既有设计）

1. **既有对比度债**：主行 active 的 hint 用 `text-cinnabar/80` 叠在 `bg-cinnabar-soft` 上，实算对比度约 **3.47:1**（<4.5，12px）。本刀**不改色**（byte-identical 颜色是硬约束），只登记；修法候选 = `text-cinnabar`（4.80:1），留给用户决定的后续刀。其余：`text-muted` / card = 5.29，muted / `bg-background`(hover) = 5.07，cinnabar / cinnabar-soft = 4.80，`text-foreground/85` / card ≈ 9.5。
2. `text-[11px]` / `text-[10px]` 是 px 字面量，在浏览器 112.5% 字号下**不随根字号缩放**（12px `text-xs` 与 14px `text-sm` 会缩放到 13.5/15.75）；11px 标签相对变小。属既有仓库写法，本刀不引入 rem 方案。
3. 「在读书目」块里的 `学习 →` / `核页 →` / `换书 ▾` 是 12px 行内文字链，点击高约 16–18px，**低于 32px**。它们不是导航行，本刀不加 padding（避免挤压 footer）；登记为后续候选。
4. 换书 `<ul>` 展开且书很多时 footer 会变高、挤压中段可视高度（中段仍可滚）。当前 `config/books.json` 只有 1 本书；验收方用临时数据根（`ARIADNE_DATA`，4 本书、1 本超长书名、`p.12` 与「无 OCR」条目）实测了上述多书态与空书库态，结果见 §3 末段与 §5 H。

---

## 5. 验收 A–J 自检

- **A** `tsc --noEmit` → exit 0
- **B** `lint` → 恰好 2 problems / 2 errors / 0 warnings；严格锁定在 `HeYeSession.tsx:88` 与 `StudySession.tsx:106`
- **C** `pnpm --filter web build` → exit 0
- **D** 文案/链接 multiset Δ0：perl 正则抽取中文字面量及 `href=` / `aria-*` / `title=` 属性，与 tip 比对 diff 为空（PASS）。
- **D′** SSR DOM 结构：去除 className 后，与 tip 逐标签比对仅恰好增加一行 `+<div >` 与一行 `+</div>`（PASS）。
- **E** 改动恰好等于 §3 表 13 项（12 行改 className + 1 个新增包裹 div），动态 `${active ? … : …}` 模板一字未改。
- **F** `git diff --stat` 仅 `apps/web/components/desk/Sidebar.tsx`（+14 / −12）。
- **G** 1280×800、1280×600、112.5% 字号三种视口实测如 §3 表：主行 ≥36px、次行 ≥32px、文字 X 线全为 20px（112.5% 为 22.5px）、`footerBottom === asideBottom`。**修正**：1 本书时 600 高无溢出（容器 393 = 393），滚动在多书/更矮视口才触发（见 §3 末段）。
- **H** 验收方在 tip 与工作树各自 build 后对 /desk /study /review / 在 1280×800、1280×600、112.5% 等视口出 before/after 截图；/ingest 对照像素一致；Tab 扫过侧栏，首行与末行静止态朱砂焦点环未被裁剪。**已知小瑕疵（不属本刀 13 项，登记后续）**：在内容溢出的矮视口里，触发滚动入视的中间行（如 420 高的「实体卡浏览器」）其下沿焦点环会短暂贴容器底被裁 1–2px（浏览器最小滚动量所致），可考虑后续给滚动容器加 `scroll-py-1`。
- **I** `HeYeSession.tsx` / `StudySession.tsx` / `globals.css` / `(desk)/layout.tsx` / `DeskShellClient.tsx` git diff 为空；仅白名单 2 文件包含变更。
- **J** 交付文档完成，完工报告格式符合规范。

---

## 6. 工具与参考登记（§9）

- 本任务无新增 MCP、skill、GitHub 项目或第三方依赖。
- 自动化度量：通过本地 headless Chrome CDP 接口直连执行 DOM 节点坐标与包围盒实测，并完成截图保存。
