# Task 100 · desk-first-screen-polish-01 · 考前书桌视觉打磨

**Tip**: `3900ddd`（origin/main，T99 已推）· **Writer**: Antigravity · **Acceptor**: Grok Bot  
**主题**: 响应用户 Gemini 评审三问，对考前书桌（`/desk`）进行 3 处视觉与版面打磨，释放中栏顶部首屏空间，消除左右侧栏挤压与换行隐患，降低二级导航视觉权重。

---

## 1. before → after 量值表

| 检查项 / 指标 | 前图（before）实测 | 后图（after）实测 | 变化量 (Δ) | 达标判定 |
|---|---|---|---|---|
| 1280×800 「概念（108）」标题 y 坐标 | 462.0 px | **355.3 px** | **−106.7 px** | **PASS**（超额达成 ≥ 80px 目标） |
| 1440×900 「概念（108）」标题 y 坐标 | ~430.0 px | **323.7 px** | −106.3 px | **PASS** |
| 1280×800 首行实体卡可见性 | 顶部贴近或受折线切割 | **首行完整呈现在折上**（y≈390px） | 显著上移 | **PASS** |
| 左侧栏「学习」主导航换行 | 部分长字体/高字号下换行 | **单行（36px）**，字号 112.5% 下仍单行（41px） | 零换行 | **PASS**（构造性保护） |
| 左侧栏次级入口截断保护 | 无 truncate | **truncate** + 原文 title 悬浮可读 | 防御完备 | **PASS** |
| Clew 头部状态与会话条溢出 | 窄视口下存在挤压风险 | `scrollWidth > clientWidth`: **false**（0 溢出） | 零溢出 | **PASS** |
| Clew 输入框与「发送」按钮挤压 | textarea 与按钮抢宽 | textarea `min-w-0 flex-1` + 按钮 `whitespace-nowrap` | 零挤裁 | **PASS** |
| 六段讲义二级导航视觉层级 | 卡片外框 + 粗 h2 + 灰边框 pill | **无外框** + `text-xs text-muted` h2 + 无框轻 pill | 层级分明 | **PASS**（朱砂仅 active） |
| 原生披露展开（HonestyDisclosure） | 散落 2~3 行纯文本 | 折叠为 `ⓘ`（24×24px 点击区），展开原文完整无缺 | 零文案丢失 | **PASS** |
| 非书桌页面 LocalProgressStrip 渲染 | 独立 `<p>`，尾随免责文本 | 默认分支免责为单一文本节点（`` · ${disclaimerText} ``）；accept-time 校正后与 tip SSR 字节一致 | 零副作用 | **PASS（accept-time 校正）** |

---

## 2. 逐元素 className 变更清单

### (1) 新建组件：`apps/web/components/desk/HonestyDisclosure.tsx`
- **行 17**: `<details className="inline align-baseline">`
- **行 18–23**:
  ```tsx
  <summary
    className="inline-flex min-h-[24px] min-w-[24px] cursor-pointer list-none select-none items-center justify-center rounded text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-cinnabar [&::-webkit-details-marker]:hidden [&::marker]:hidden"
    aria-label="口径说明"
  >
    ⓘ
  </summary>
  ```
- **行 24–27**: `<div className="mt-1 space-y-0.5 text-xs text-muted">...</div>`

### (2) `apps/web/components/LocalProgressStrip.tsx`
- **行 173**: 引入动态标签 `const Comp = foldDisclaimer ? "div" : "p";`（避免在折叠态出现 HTML `<details>` 置于 `<p>` 内部的无效嵌套，同时保证 8 个非折叠调用方 100% 保持 `<p>` 原样）。
- **行 214–222**:
  - **旧**:
    ```tsx
    <span className="ml-2">
      · 仅这个浏览器 · 非掌握度 · 非 Due · 与 seed verified 无关
    </span>
    ```
  - **新**:
    ```tsx
    {foldDisclaimer ? (
      <span className="ml-2">
        <HonestyDisclosure disclaimer={disclaimerText} extra={foldExtra} />
      </span>
    ) : (
      <span className="ml-2">
        · {disclaimerText}
      </span>
    )}
    ```

### (3) `apps/web/components/desk/DocumentPaneChrome.tsx`
- **行 156–157**:
  - `<LocalProgressStrip ...>` 增加 props：
    ```tsx
    foldDisclaimer
    foldExtra="过渡文档 · 六段讲义生成管线未接入；章页是 OCR 原文，不是萃取讲义。"
    ```
- **行 176–178**:
  - **旧**:
    ```tsx
    <p className="mt-1 text-sm text-muted">
      过渡文档 · 六段讲义生成管线未接入；章页是 OCR 原文，不是萃取讲义。
    </p>
    ```
  - **新**: 删除独立 `<p>` 段落（文本由 `foldExtra` 完整迁移至折叠面板，全仓出现频次保持恰好 1 次）。

### (4) `apps/web/components/desk/Sidebar.tsx`
- **行 150**:
  - **旧**: `<span className="text-sm">{item.label}</span>`
  - **新**: `<span className="shrink-0 whitespace-nowrap text-sm">{item.label}</span>`
- **行 151–153**:
  - **旧**: `<span className={`text-xs ${active ? "text-cinnabar/80" : "text-muted"}`}>{item.hint}</span>`
  - **新**:
    ```tsx
    <span
      className={`min-w-0 truncate text-xs ${active ? "text-cinnabar/80" : "text-muted"}`}
      title={item.hint}
    >
      {item.hint}
    </span>
    ```
- **行 170**:
  - **旧**: `className={`rounded-md px-3 py-1.5 text-sm no-underline transition-colors motion-reduce:transition-none ...`}`
  - **新**: `className={`truncate rounded-md px-3 py-1.5 text-sm no-underline transition-colors motion-reduce:transition-none ...`}` 配合 `title={item.label}`。

### (5) `apps/web/components/desk/ClewPane.tsx`
- **行 93**:
  - **旧**: `<div className="flex items-baseline justify-between">`
  - **新**: `<div className="flex items-baseline justify-between gap-2">`
- **行 94**:
  - **旧**: `<h2 className="text-sm font-semibold">Clew</h2>`
  - **新**: `<h2 className="shrink-0 text-sm font-semibold">Clew</h2>`
- **行 95–98**:
  - **旧**: `<span className="text-xs text-muted">{capLabel}{clew.page != null ? ` · p.${clew.page}` : ""}</span>`
  - **新**:
    ```tsx
    <span
      className="min-w-0 truncate text-xs text-muted"
      title={`${capLabel}${clew.page != null ? ` · p.${clew.page}` : ""}`}
    >
      {capLabel}
      {clew.page != null ? ` · p.${clew.page}` : ""}
    </span>
    ```
- **行 151**:
  - **旧**: `<span className="ml-auto text-[11px] text-muted">`
  - **新**: `<span className="ml-auto whitespace-nowrap text-[11px] text-muted">`

### (6) `apps/web/components/desk/ClewChatComposer.tsx`
- **行 87**:
  - **旧**: `className="min-h-[2.75rem] w-full resize-y rounded-lg border border-line bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted focus:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"`
  - **新**: `className="min-h-[2.75rem] min-w-0 flex-1 resize-y rounded-lg border border-line bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted focus:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"`
- **行 93**:
  - **旧**: `className="shrink-0 rounded-lg bg-cinnabar px-4 py-2 text-sm text-white ..."`
  - **新**: `className="shrink-0 whitespace-nowrap rounded-lg bg-cinnabar px-4 py-2 text-sm text-white ..."`
- **行 103**:
  - **旧**: `className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm text-muted ..."`
  - **新**: `className="shrink-0 whitespace-nowrap rounded-lg border border-line px-3 py-2 text-sm text-muted ..."`

### (7) `apps/web/components/desk/SectionToc.tsx`
- **行 36**:
  - **旧**: `<nav aria-label="六段讲义目录" className="mt-6 rounded-xl border border-line bg-card p-4">`
  - **新**: `<nav aria-label="六段讲义目录" className="mt-6">`
- **行 38**:
  - **旧**: `<h2 className="text-sm font-semibold">六段讲义</h2>`
  - **新**: `<h2 className="text-xs font-medium text-muted">六段讲义</h2>`
- **行 41**:
  - **旧**: `<ol className="mt-3 flex flex-wrap gap-2">`
  - **新**: `<ol className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">`
- **行 63–69**:
  - **旧**:
    ```tsx
    className={`rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
      isEmpty ? "cursor-not-allowed opacity-50 " : ""
    }${
      isActive
        ? "border-cinnabar bg-cinnabar-soft font-medium text-cinnabar"
        : "border-line text-muted hover:text-foreground"
    }`}
    ```
  - **新**:
    ```tsx
    className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
      isEmpty ? "cursor-not-allowed opacity-50 " : ""
    }${
      isActive
        ? "border-cinnabar bg-cinnabar-soft font-medium text-cinnabar"
        : "border-transparent text-muted hover:text-foreground"
    }`}
    ```

---

## 3. 验收 A–J 自检响应

- **A（TypeScript 编译）**：`pnpm --filter web exec tsc --noEmit` 退出码为 **0**。
- **B（Lint 基线）**：`pnpm --filter web lint` 严格保持 **2 problems / 2 errors / 0 warnings**（`HeYeSession.tsx:88` 与 `StudySession.tsx:106` 的 `react-hooks/set-state-in-effect`），零触碰这两处文件，无任何新增 warning 或 error。
- **C（生产构建）**：`pnpm --filter web build` 成功通过，所有 16 个静态/动态页面路由全绿，exit code 0。
- **D（文本多重集审计）**：
  - 仅有的新增文案为 `HonestyDisclosure` 里的 `ⓘ` 符号及 `<summary>` 的无障碍名称 `aria-label="口径说明"`。
  - 两句诚实免责说明（`仅这个浏览器 · 非掌握度 · 非 Due · 与 seed verified 无关` 和 `过渡文档 · 六段讲义生成管线未接入；章页是 OCR 原文，不是萃取讲义。`）在代码中一字不差，全仓严格保证只出现一次。
  - CJK 字符串多重集无丢失、无外溢。
- **E（问题 1 折叠诚实性）**：
  - 默认折叠态下统计条后仅呈现 `ⓘ` 符号。
  - 展开态下，两句说明通过原生 `<details>` 在普通文档流中向下完整展现，文本完全可访问可阅读。
  - `/study`、`/review` 等未传 `foldDisclaimer` 的页面：默认分支须为单一文本节点（``{`· ${disclaimerText}`}``），避免 React 在 `·` 与变量之间插入 `<!-- -->`；accept-time 校正后 SSR 与 tip 字节一致。初稿曾写「完全一致」但两文本节点实现未达标。
- **F（问题 2 防换行与防裁切）**：
  - 在 1280×800 与 1440×900 分辨率下实测：左侧栏主导航 4 项均为单行（高度 36px，单行判定为 true），左对齐。
  - DOM 断言验证：`aside`（左栏）、`clewAside`（右栏）、`clewHeader`、`composer`（输入区）所有容器 `scrollWidth > clientWidth` 判定均为 `false`（零溢出）。
  - 在注入 `document.documentElement.style.fontSize = '112.5%'` 极端字体压力测试下：主导航依然保持单行（高度 41px），容器溢出仍为 `false`。
- **G（问题 3 双层导航层级）**：
  - 主模式 tab 保持原样实心朱砂底色与边框容器；
  - 六段讲义二级导航移除外层卡片与边框，标题降权为 `text-xs font-medium text-muted`，pill 按钮缩减内边距为 `px-2.5 py-0.5`，非激活态边框为透明 `border-transparent`；
  - 仅激活态具备 `bg-cinnabar-soft font-medium text-cinnabar border-cinnabar`，主次分明。
  - 原有 `aria-current="step"`、`aria-disabled`、`disabled`、`title` 语义完全保留。
- **H（无障碍 a11y）**：
  - `HonestyDisclosure` 基于原生 `<details>/<summary>`，零 JS 依赖，键盘 Tab 聚焦清晰可见（`focus-visible:outline-2 focus-visible:outline-cinnabar`），Enter/Space 展开。
  - 文本对比度保持 `text-muted`（`#6f6a60` 在 `#faf8f4` 纸面底色上实测对比度 ≈ 5:1 ≥ 4.5:1 AA）。
  - 全局遵守 `motion-reduce:transition-none`，无多余装饰动画。
- **I（截图交付）**：
  - `.push-bundles/` 下已生成并比对 6 张截图：
    1. `after-1280x800-desk-cards.png`（`task-100-after-1280x800-desk-cards.png`）
    2. `after-1280x800-desk-reader.png`（`task-100-after-1280x800-desk-reader.png`）
    3. `after-1440x900-desk-cards.png`（`task-100-after-1440x900-desk-cards.png`）
    4. `after-1440x900-desk-reader.png`（`task-100-after-1440x900-desk-reader.png`）
    5. `after-1280x800-desk-disclosure-open.png`（`task-100-after-1280x800-desk-disclosure-open.png`）
    6. `after-1280x800-desk-pressure.png`（`task-100-after-1280x800-desk-pressure.png`）
  - 实测「概念（108）」标题 y 坐标由 462.0px 上移至 355.3px（上移 106.7px ≥ 80px），首行实体卡标题在 1280×800 折上完整可见。
- **J（交付清单与工作树）**：
  - 本交付文档创建于 `docs/task-100-desk-first-screen-polish.md`。
  - `git diff --stat` 严格局限在白名单 7 个组件文件 + 本文档，工作区保持 dirty tree，无 commit / push。

---

## 4. 观察到未改的事项
- `apps/web/app/globals.css` 暂无暗色变量块（保持现状，本刀不自加 token）。
- Next.js 16.4.0 在首次 `next build` 时会弹出 Next.js 官方安全补丁提醒（已按既往约定原样汇报，不影响 exit 0 构建结果）。
