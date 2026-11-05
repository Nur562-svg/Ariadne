# Task 106a · desk-clew-fold-01 · 全局 Clew 折叠开关

**Tip**: `fc82f7a`（full `fc82f7a4ee48d32e3aaa1ef1e818a0e9c11a8978` = T105 docs on origin/main）· **Writer**: Antigravity · **Acceptor**: Grok Bot  
**主题**: 书桌壳（`apps/web/components/desk/DeskShellClient.tsx`）增加 40px 安静顶栏，右上角放置全局「Clew」折叠开关（`ClewToggle.tsx`）；通过 `apps/web/lib/clew-fold-persist.ts` 基于 `useSyncExternalStore` 实现 `localStorage`（`ariadne.desk.clew-fold.v1`）偏好持久化与跨标签页同步。折叠态下 Clew 栏宽度归零、内容不可见并设置原生 `inert`（阻断焦点与辅助技术访问），而内部 `ClewPane` 始终保持挂载，聊天草稿、会话状态与滚动位置完全保留；展开态下通过 `display: contents` 让 `ClewPane` 的 `aside` 像素级还原 tip 布局与 400px 宽度。本刀默认恒为展开，保持与 tip 体验一致。

---

## 1. before → after LOC

| 文件 | before | after | 变化 | 说明 |
|---|---|---|---|---|
| `apps/web/lib/clew-fold-persist.ts` | — | 61 | +61 | **新文件**：`localStorage` 读写、跨标签订阅、值稳定快照与隐私模式内存兜底 |
| `apps/web/components/desk/ClewToggle.tsx` | — | 53 | +53 | **新文件**：`useClewFold()` hook 与静音顶栏开关组件（内联 SVG，无新依赖） |
| `apps/web/components/desk/DeskShellClient.tsx` | 35 | 56 | +21 | 改：主列编排 40px 顶栏 + 主区，`desk-clew-slot` 挂载与 `inert` / `contents` 控制 |
| `docs/task-106a-desk-clew-fold.md` | — | 本文 | 新增 | **新文件**：本任务实施、设计取舍与验证记录 |

- **新依赖**: 0（纯原生 React 19 + SVG，无任何外部库引入）
- **路由/全局样式**: 0（零触 `globals.css`、零触 `layout.tsx`、零新路由）
- **冻结文件**: 零触 `HeYeSession.tsx` 与 `StudySession.tsx`

---

## 2. 白名单与零触文件检查

### 2.1 变更白名单（严格局限于 4 个文件）
1. `apps/web/lib/clew-fold-persist.ts`（新 · 无 `"use client"`）
2. `apps/web/components/desk/ClewToggle.tsx`（新 · `"use client"`）
3. `apps/web/components/desk/DeskShellClient.tsx`（改 · 35 → 56 行）
4. `docs/task-106a-desk-clew-fold.md`（新 · 交付文档）

### 2.2 零触文件 SHA256 比对（与 tip `fc82f7a` 字节级一致）
- `apps/web/components/HeYeSession.tsx`（MATCH）
- `apps/web/components/StudySession.tsx`（MATCH）
- `apps/web/app/globals.css`（MATCH）
- `apps/web/app/(desk)/layout.tsx`（MATCH）
- `apps/web/components/desk/ClewPane.tsx`（MATCH）
- `apps/web/components/desk/DeskContext.tsx`（MATCH）
- `apps/web/components/desk/Sidebar.tsx`（MATCH）
- `apps/web/components/EntityCardDetail.tsx`（MATCH）
- `apps/web/app/(desk)/desk/card/[id]/page.tsx`（MATCH）

---

## 3. 持久化与状态规则

### 3.1 存储键与取值
- **Key**: `ariadne.desk.clew-fold.v1`
- **取值**: `"open" | "folded"`；未选择 / 数据损坏 / SSR 状态下为 `null`。
- **默认常量**: `CLEW_DEFAULT_OPEN = true`。

### 3.2 「展开 / 折叠 / 默认」规则表

| 场景 / 状态 | 存储状态 | 快照值 | `open` 判定 | UI 表现与 DOM 结构 |
|---|---|---|---|---|
| **首次访问（无 key）** | `null` | `null` | `true` | 开关读作「Clew 收起」（`aria-expanded="true"`）；Clew 槽为 `display: contents`，内部 400px aside 像素级同 tip；主容器 `data-clew="open"` |
| **点击开关（折叠）** | `"folded"` | `"folded"` | `false` | 开关读作「Clew」（`aria-expanded="false"`）；Clew 槽为 `invisible w-0 shrink-0 overflow-hidden`，挂载 `inert={true}`；主容器 `data-clew="folded"`，中栏自适应拉宽 |
| **点击开关（展开）** | `"open"` | `"open"` | `true` | 恢复展开，写入 `"open"`，面板毫秒级恢复 |
| **多标签页同步** | 远端更新 | 触发 `storage` | 同步更新 | `window.addEventListener("storage")` 监听并清空内存缓存，跨标签无缝同步状态 |
| **隐私模式 / 存储异常** | `setItem` 抛错 | 内存兜底 | 正常交互 | `try-catch` 静默处理存储写受限，通过模块单例 `memory` 变量保障当前标签内切换依然可用（fail-closed，不抛错） |

---

## 4. 关键设计与架构取舍

### 4.1 水合首帧取舍与 SSR 零错位
- 在 `useClewFold` 中，通过 `useSyncExternalStore(subscribeClewFold, loadClewFold, () => null)` 实现订阅；服务端快照恒定返回 `null`。
- 首次水合时，客户端首帧与服务端输出一致渲染为展开态（`open: true`），完全避免 React 水合内容错位（Hydration mismatch）。
- 对于已在 localStorage 保存 `"folded"` 的用户，React 会在挂载完成后的微任务/首帧内同步外部 store 并重渲染为折叠态。此设计坚决弃用 `useEffect` + `setState`，保证全仓 ESLint 基线零增量。

### 4.2 为什么采用 `w-0 + invisible + inert` 而非 `display: none` 或条件卸载
1. **禁止条件卸载 (`{open && <ClewPane />}`)**：
   `ClewPane` 包含 `useClewChatEngine` 内部状态、当前激活 tab、用户未发送的提问草稿以及已产生问答的滚动条位置。一旦卸载重新挂载，所有状态灰飞烟灭，严重违反书桌工具的连续性预期。
2. **避免 `display: none` (`hidden`)**：
   在主流浏览器渲染引擎中，容器设置 `display: none` 会导致其子级滚动容器的 `scrollTop` / `scrollLeft` 属性被重置或不可测回零。
3. **`w-0 shrink-0 overflow-hidden invisible` + 原生 `inert`**：
   - 宽度归零且溢出裁切，配合 `flex-1` 让中栏平滑扩展占满空间，完全隐藏视觉元素且消除 1px 边框残留；
   - `invisible` 确保即使有绝对定位溢出物也不可见；
   - 原生 HTML 属性 `inert={!clewOpen}` 从根源上将整棵子树从浏览器的焦点遍历序列（Tab navigation）和辅助技术（Screen Reader accessibility tree）中剥除，实现严密的无障碍隔离与 fail-closed 语义；
   - 展开态下采用 `contents`，外层包裹 `div` 不生成额外盒模型，内部 `aside` 直接作为三栏 flex 子项，边框和内边距与 tip 保持 100% 像素级一致。

### 4.3 40px 顶栏对全局路由与页面布局的影响
- **顶栏规范**：`h-10 shrink-0 border-b border-line px-4 flex items-center justify-end`。高 40px（@16px 根基准），右对齐摆放 `ClewToggle`。
- **主列结构演进**：tip 原在 `<main className="min-w-[420px] flex-1 overflow-y-auto">` 上的 `min-w-[420px]` 上移至中列包装器 `<div className="flex min-w-[420px] flex-1 flex-col">`，确保在极窄视口下依然保持中栏不被挤瘪，横向滚动行为不变；`<main>` 赋予 `min-h-0 flex-1 overflow-y-auto`，确保纵向滚动完全包裹在主区内部。
- **页内 sticky 组件表现**：`/desk` 的章页阅读器、`/study` 的 `StudyPageChrome`、`/review` 的 `ReviewPageSticky` 等原本设置 `sticky top-0` 的组件，均相对于 `<main>` 容器进行粘性定位，自然精准吸附在 40px 顶栏下方，无高度撑破，无整页双重滚动条。
- **独立外层壳路由不受影响**：`/entities`、`/entities/[id]`、`/ingest` 位于 `(shell)/layout.tsx`，完全不经过 `DeskShellClient`，视觉与像素完全不受影响。

---

## 5. 声明：未发明额外打磨

本刀严格恪守 SCOPE 与 `docs/frontend-aesthetics.md` 边界：
- 顶栏仅放置纯净的 `ClewToggle` 开关，**未**引入面包屑、返回键、书名或当前页码装饰；
- 开关标签仅根据状态输出 `Clew` 与 `收起`，**未**硬编码「stub · 未接模型」等伪造状态；
- **未**引入毛玻璃（backdrop-blur）、浮层、卡片阴影或过度位移动画（仅保留标准的 `transition-colors` 并严格配置 `motion-reduce:transition-none`）；
- 开关默认状态不滥用朱砂色，朱砂仅保留给全局统合的 `:focus-visible` 2px 焦点环；
- **未**触碰 `globals.css`，未引入任何新 CSS token 或第三方依赖。

---

## 6. 验证与质量保证

1. **TypeScript 编译**:
   - `pnpm --filter web exec tsc --noEmit` → Exit code: `0`
2. **ESLint 规则基线**:
   - `pnpm --filter web lint` → 严格保持恰好 `2 problems (2 errors, 0 warnings)`，位于冻结文件 `HeYeSession.tsx:88` 与 `StudySession.tsx:106`，本刀实现完全基于 `useSyncExternalStore`，0 新增 error，0 warning。
3. **Next.js 生产构建**:
   - `pnpm --filter web build` → Exit code: `0`，Turbopack 编译所有 16 个静态/动态页面路由全绿。
4. **文案多重集审计**:
   - 既有文件 `DeskShellClient.tsx` 中文字面量、`href`、`aria-*`、`title` 属性多重集增量严格为 0（仅原样保留/追加结构注释）。
   - 新增用户可见文案仅限 `ClewToggle.tsx` 中的「`Clew`」与「`收起`」。
5. **单元语义与运行时模拟验证**:
   - 验证了 SSR 环境下 `loadClewFold()` 稳定返回 `null`；
   - 验证了客户端本地读写、折叠展开状态切换、`storage` 事件外部联动；
   - 验证了在无 cookie/隐私模式下写存储异常时通过内存兜底保障功能不失灵。

---

## 7. 向 Task 106b（实体卡页双栏对照）交接

1. **预留 CSS 钩子**:
   外层 flex 容器已注入 `data-clew={clewOpen ? "open" : "folded"}`，106b 可直接通过容器选择器定义卡页在中栏与折叠态下的宽度流转与对照网格。
2. **状态共享与复用**:
   `apps/web/components/desk/ClewToggle.tsx` 导出的 `useClewFold()` hook 可被卡页或中栏任意交互岛无缝调用。
3. **默认展开/折叠策略预留**:
   `apps/web/lib/clew-fold-persist.ts` 中导出了 `CLEW_DEFAULT_OPEN` 常量与独立纯函数，106b 若需实现针对卡页路由视口的特定默认逻辑，具备清晰整洁的扩展点。
