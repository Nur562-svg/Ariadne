# Task 102 · focus-ring-unify-01 · 键盘焦点环全域统合（朱砂 2px）

tip：`e7bdb65758f9ced72432d47b47e00fab684bd925`（`docs(pipeline): Task 101 desk-ingest-page-split-01`）。
主题：根据 Task 101 全域焦点环审计结果，统合全站交互元素（`<button>`、`<a>`、`<Link>`、`<input>`、`<textarea>`）的键盘聚焦可见性，消除各浏览器 UA 默认蓝圈与无焦点环漂移，收敛至 Ariadne 设计系统朱砂 2px 轮廓（`focus-visible:outline-2 focus-visible:outline-cinnabar`）。验收时补一条用户已批准的全局 `:focus-visible` 兜底规则（见 §6）。

## 1. 规则执行与改动总结

依据任务书 R1、R2、R3 规则，本刀共修改 51 个既有文件（50 个组件/页面源码 + 验收期补入的 `apps/web/app/globals.css`），新增 1 个文档文件（`docs/task-102-focus-ring-unify.md`）：

- **R1（缺失焦点环补齐）**：共 182 处交互元素补充 `focus-visible:outline-2 focus-visible:outline-cinnabar`。
  - 注：`ClewAuditView.tsx` 中有 1 处 `<button>` 采用三元表达式分别定义 `ok` / `warn` 两种状态类名，两分支均补充了 focus-visible 类名（因此 AST diff 对偶计数为 184 对）。
- **R2（坏焦点环解除死锁）**：4 处字符串常量中移除了 `outline-none`，解除其对后续 `focus-visible:outline-2` 的覆盖，恢复 9 处元素的焦点环：
  - `apps/web/components/IngestUpload.tsx`: `inputCls`（移除 `outline-none`，恢复 6 处 input）
  - `apps/web/components/desk/ClewChatComposer.tsx`: `<textarea>`（移除 `outline-none`，恢复 1 处 textarea）
  - `apps/web/components/desk/ChapterPageStickyChrome.tsx`: 清本页 `<button>`（移除 `outline-none`，恢复 1 处 button）
  - `apps/web/components/EntitySearch.tsx`: `<input>`（移除 `outline-none`，恢复 1 处 input）
- **R3（朱砂底色偏移）**：共 22 处实心朱砂底色（`bg-cinnabar`）按钮/链接追加 `focus-visible:outline-offset-2`，确保 2px 朱砂外框与朱砂背景之间保留 2px 呼吸槽，不发生轮廓与背景熔断。
- **零触碰与冻结**：
  - `apps/web/components/HeYeSession.tsx`（2 处缺环残留）与 `apps/web/components/StudySession.tsx`（4 处缺环残留）严格零触碰，保留 lint 基线。
  - `apps/web/app/api/**`、`package.json`、`pnpm-lock.yaml` 严格零触碰。`apps/web/app/globals.css` 仅在验收期按用户批准追加 1 条 `@layer base` 规则（+8/-0，见 §6）。
  - 50 个组件/页面文件的改动均为严格 1:1 行替换（insertions == deletions），无额外行增删、无格式化破坏、无文案/逻辑改动；`globals.css` 为纯新增 8 行（含注释与空行）。

---

## 2. 修改文件清单与行变动（51 文件）

| # | 路径 | 变动行数 (numstat) | 规则覆盖 |
|---|---|---|---|
| 1 | `apps/web/app/(desk)/desk/page.tsx` | +1 / -1 | 1 R3 |
| 2 | `apps/web/app/(desk)/page.tsx` | +2 / -2 | 1 R3, 1 R1 |
| 3 | `apps/web/app/(shell)/entities/page.tsx` | +3 / -3 | 3 R1 |
| 4 | `apps/web/app/(shell)/ingest/page.tsx` | +1 / -1 | 1 R1 |
| 5 | `apps/web/app/(shell)/viewer/[page]/page.tsx` | +6 / -6 | 6 R1 |
| 6 | `apps/web/app/globals.css` | +8 / -0 | 全局 `:focus-visible` 兜底（验收期） |
| 7 | `apps/web/components/AtomDraftLine.tsx` | +1 / -1 | 1 R1 |
| 8 | `apps/web/components/CardHubReturnLinks.tsx` | +2 / -2 | 1 R3, 1 R1 |
| 9 | `apps/web/components/CardVsStudyLink.tsx` | +1 / -1 | 1 R1 |
| 10 | `apps/web/components/ChapterQualityCockpit.tsx` | +1 / -1 | 1 R1 |
| 11 | `apps/web/components/ChapterQualityCockpitRow.tsx` | +5 / -5 | 5 R1 |
| 12 | `apps/web/components/CitePeek.tsx` | +4 / -4 | 4 R1 |
| 13 | `apps/web/components/DeskOpenReturnLink.tsx` | +1 / -1 | 1 R1 |
| 14 | `apps/web/components/DraftInbox.tsx` | +2 / -2 | 2 R1 |
| 15 | `apps/web/components/DraftInboxPatchPaste.tsx` | +1 / -1 | 1 R1 |
| 16 | `apps/web/components/DraftInboxPort.tsx` | +1 / -1 | 1 R1 |
| 17 | `apps/web/components/EntityCardDetail.tsx` | +6 / -6 | 6 R1 |
| 18 | `apps/web/components/EntitySearch.tsx` | +5 / -5 | 1 R2, 4 R1 |
| 19 | `apps/web/components/HeYeEmptyMode.tsx` | +11 / -11 | 2 R3, 9 R1 |
| 20 | `apps/web/components/HeYeEmptyPool.tsx` | +13 / -13 | 4 R3, 9 R1 |
| 21 | `apps/web/components/IngestMaterialQualityPanels.tsx` | +4 / -4 | 4 R1 |
| 22 | `apps/web/components/IngestReadyLinks.tsx` | +5 / -5 | 1 R3, 4 R1 |
| 23 | `apps/web/components/IngestUpload.tsx` | +4 / -4 | 1 R2, 2 R1, 1 R3 |
| 24 | `apps/web/components/LibraryContinuity.tsx` | +5 / -5 | 5 R1 |
| 25 | `apps/web/components/LocalProgressStrip.tsx` | +2 / -2 | 2 R1 |
| 26 | `apps/web/components/RegisterMaterialButton.tsx` | +6 / -6 | 1 R1/R3 ternary, 4 R1 |
| 27 | `apps/web/components/ReviewPageChrome.tsx` | +3 / -3 | 3 R1 |
| 28 | `apps/web/components/ReviewPageSticky.tsx` | +2 / -2 | 2 R1 |
| 29 | `apps/web/components/ShelfBookCard.tsx` | +5 / -5 | 1 R3, 4 R1 |
| 30 | `apps/web/components/ShelfBookContinuity.tsx` | +5 / -5 | 5 R1 |
| 31 | `apps/web/components/ShelfBookSignalBadges.tsx` | +3 / -3 | 3 R1 |
| 32 | `apps/web/components/ShellChrome.tsx` | +3 / -3 | 3 R1 |
| 33 | `apps/web/components/StudyEmptyMode.tsx` | +8 / -8 | 1 R3, 7 R1 |
| 34 | `apps/web/components/StudyEmptyPool.tsx` | +8 / -8 | 1 R3, 7 R1 |
| 35 | `apps/web/components/StudyPageChrome.tsx` | +3 / -3 | 3 R1 |
| 36 | `apps/web/components/StudyPageEmpty.tsx` | +7 / -7 | 3 R3, 4 R1 |
| 37 | `apps/web/components/desk/BookSwitcher.tsx` | +2 / -2 | 2 R1 |
| 38 | `apps/web/components/desk/ChapterPageCardRail.tsx` | +4 / -4 | 4 R1 |
| 39 | `apps/web/components/desk/ChapterPageEmptyChapter.tsx` | +2 / -2 | 2 R3 |
| 40 | `apps/web/components/desk/ChapterPageStickyChrome.tsx` | +1 / -1 | 1 R2 |
| 41 | `apps/web/components/desk/ClewAuditView.tsx` | +2 / -2 | 2 R1 (ternary) |
| 42 | `apps/web/components/desk/ClewChangesPanel.tsx` | +4 / -4 | 4 R1 |
| 43 | `apps/web/components/desk/ClewChatComposer.tsx` | +1 / -1 | 1 R2 |
| 44 | `apps/web/components/desk/ClewChatThread.tsx` | +7 / -7 | 7 R1 |
| 45 | `apps/web/components/desk/ClewPane.tsx` | +3 / -3 | 3 R1 |
| 46 | `apps/web/components/desk/ClewQueuePanel.tsx` | +2 / -2 | 1 R3, 1 R1 |
| 47 | `apps/web/components/desk/DocumentCardTile.tsx` | +2 / -2 | 2 R1 |
| 48 | `apps/web/components/desk/DocumentPaneChrome.tsx` | +3 / -3 | 3 R1 |
| 49 | `apps/web/components/desk/DocumentQuizPanel.tsx` | +3 / -3 | 1 R3, 2 R1 |
| 50 | `apps/web/components/desk/ReturnNav.tsx` | +3 / -3 | 3 R1 |
| 51 | `apps/web/components/desk/Sidebar.tsx` | +9 / -9 | 9 R1 |

---

## 3. 22 处 `focus-visible:outline-offset-2` 清单

全站共 22 处实心朱砂底色（`bg-cinnabar`）元素严格添加了 `focus-visible:outline-offset-2`。下列 `file:line` 为 `className` 中含该 token 的行号（以当前工作树为准），文字取自对应元素在代码中的可见文案：

1. `apps/web/app/(desk)/desk/page.tsx:45` - 去导入教材 → `<Link>`
2. `apps/web/app/(desk)/page.tsx:56` - 去导入教材 → `<Link>`
3. `apps/web/components/CardHubReturnLinks.tsx:52` - 练这张卡（{atomCount}） `<Link>`
4. `apps/web/components/HeYeEmptyMode.tsx:95` - 回待核档 → `<Link>`
5. `apps/web/components/HeYeEmptyMode.tsx:103` - 去学习环 → `<Link>`
6. `apps/web/components/HeYeEmptyPool.tsx:106` - 回本卡 → `<Link>`
7. `apps/web/components/HeYeEmptyPool.tsx:113` - 清本页，换到本章核 → `<Link>`
8. `apps/web/components/HeYeEmptyPool.tsx:122` - 去学习环 → `<Link>`
9. `apps/web/components/HeYeEmptyPool.tsx:134` - 回书桌 → `<Link>`
10. `apps/web/components/IngestReadyLinks.tsx:60` - 打开书桌 → `<Link>`
11. `apps/web/components/IngestUpload.tsx:198` - 上传并建档（忙时「上传中…」） `<button>`
12. `apps/web/components/RegisterMaterialButton.tsx:145` - 注册进书库 →（仅实心朱砂分支；「质量偏弱 · 仍要注册 →」为琥珀底分支，未加 offset） `<button>`
13. `apps/web/components/ShelfBookCard.tsx:68` - 打开书桌 → `<Link>`
14. `apps/web/components/StudyEmptyMode.tsx:114` - 再来一轮 `<button>`
15. `apps/web/components/StudyEmptyPool.tsx:114` - 切到「全部」 `<Link>`
16. `apps/web/components/StudyPageEmpty.tsx:127` - 换到本章全部 → / 换到本书全部 → / 换到全部书目 →（按上下文三选一） `<Link>`
17. `apps/web/components/StudyPageEmpty.tsx:135` - 换到全部章节 → `<Link>`
18. `apps/web/components/StudyPageEmpty.tsx:142` - 看全部书目 → `<Link>`
19. `apps/web/components/desk/ChapterPageEmptyChapter.tsx:35` - 下一有页章 {nextReadable.id} → `<button>`
20. `apps/web/components/desk/ChapterPageEmptyChapter.tsx:44` - 上一有页章 {prevReadable.id} → `<button>`
21. `apps/web/components/desk/ClewQueuePanel.tsx:153` - 打开核页工作台 → `<Link>`
22. `apps/web/components/desk/DocumentQuizPanel.tsx:101` - 去学习环自评 → `<Link>`

（行号由 `grep -rn outline-offset-2 apps/web/{app,components}` 逐条核对；`HeYeSession.tsx` / `StudySession.tsx` 冻结，不在其列。）

---

## 4. 验证结果

### 4.1 全域焦点环扫描 (`ring-audit.py`)
```
{'ok': 270, 'skip-tabindex': 1, 'MISSING': 6, 'skip-type': 2}
files needing edit: 2 elements: 6
components/HeYeSession.tsx ['418:Link:MISS', '566:Link:MISS']
components/StudySession.tsx ['374:Link:MISS', '412:button:MISS', '421:button:MISS', '427:button:MISS']
```
- 全站 DEAD（被 `outline-none` 压制）降为 **0**。
- 全站 MISSING 降为 **6**（全部且仅存在于冻结文件 `HeYeSession.tsx` 与 `StudySession.tsx`）。
- 50 个白名单文件中的 191 个目标交互元素全部合规。

### 4.2 Class Diff Token 审计 (`class-diff-audit.py`)
```
pairs: 188
removed tokens (净减): {'outline-none': 4}
added tokens (净增): {'focus-visible:outline-2': 184, 'focus-visible:outline-cinnabar': 184, 'focus-visible:outline-offset-2': 22}
OK 0
```
- 净移除 token 仅且恰为 4 处 `outline-none`。
- 净增添 token 仅且恰为 `focus-visible:outline-2`、`focus-visible:outline-cinnabar` 以及 22 处 `focus-visible:outline-offset-2`。
- 无任何多余 class token 被增添或意外丢失（OK 0）。

### 4.3 静态类型检查 (`tsc --noEmit`)
- `pnpm --filter web exec tsc --noEmit` -> **exit code 0**。

### 4.4 代码质量检查 (`lint`)
- `pnpm --filter web lint` -> **exit code 1, exactly 2 problems (2 errors, 0 warnings)**。
  - `apps/web/components/HeYeSession.tsx:88:9`: `react-hooks/set-state-in-effect`
  - `apps/web/components/StudySession.tsx:106:5`: `react-hooks/set-state-in-effect`
- 零触碰两处冻结点，无 `eslint-disable`，与站规基线 100% 吻合。

### 4.5 生产构建 (`build`)
- `pnpm --filter web build` -> 首次运行因 Next 16.4.0 安全公告提示中断（exit 1），重试 **exit code 0**（验收期含 globals.css 的最终状态同样如此）。
- 编译通过（Dynamic/Static 路由生成正常）；产物 CSS 含 `:focus-visible{outline:2px solid var(--cinnabar);outline-offset:2px}`。

### 4.6 冻结文件完整性
- `apps/web/components/HeYeSession.tsx`: SHA256 `a35f00b9df463df058b6cf09eae26d005ca1895007b1dd067239c836d61473ea`（与 HEAD 严格一致，零 diff）
- `apps/web/components/StudySession.tsx`: SHA256 `609b5ca1aa8ec18eb07d35b9ab8b41b97dc400e6fac7bea03a0951766afaf724`（与 HEAD 严格一致，零 diff）
- `apps/web/app/globals.css`: 相对 HEAD 仅 +8/-0（验收期追加的 `@layer base` 焦点环规则，见 §6）；其余零改动。
- `package.json` / `pnpm-lock.yaml`: 与 HEAD 严格一致，零 diff。

---

## 5. 观察到未改的事项

1. **Next.js 升级安全提示**：在执行 `pnpm --filter web build` 首次运行时，Next.js 16.4.0 抛出关于安全公告的提示中断并要求重试；第二次运行顺利 exit 0。依据站规 §5，禁止升级 Next.js。
2. **冻结文件的缺环残留**：`HeYeSession.tsx`（2 处）与 `StudySession.tsx`（4 处）根据铁律未作修改；静态 ring-audit 仍报 6 处 MISSING，但运行时已由 §6 全局规则覆盖（Tab 扫描为朱砂 2px）。

---

## 6. 验收期修复（accept-time fix，用户已批准）

验收发现逐元素补类名无法覆盖两类残留，用户明确批准在 `apps/web/app/globals.css` 追加全局朱砂 `:focus-visible` 规则（仅此一条，复用既有 `--cinnabar` 变量，无新增颜色）：

```css
@layer base {
  :focus-visible {
    outline: 2px solid var(--cinnabar);
    outline-offset: 2px;
  }
}
```

- 放在 `@layer base`：优先级低于 Tailwind utilities，已带 `focus-visible:outline-2 focus-visible:outline-cinnabar` / `focus-visible:outline-offset-2` 的元素行为不变。
- 覆盖的残留：
  - `components/CiteChip.tsx` 的 `p.N` 引用 chip `<Link>`（desk 2 处 / desk-card 2 处 / entity 4 处等共 10 个 Tab 停点）。原因：`ring-audit.py` 对各文件的 `const` 类名映射做了全局合并，把 CiteChip 局部 `cls` 误判为 ok（审计工具假阴性）。
  - `/ingest` 的 `<input type="file">`（2 条路由 × 2 = 4 个停点，审计按设计跳过 `type=file`）。
  - 冻结文件 `HeYeSession.tsx` / `StudySession.tsx` 的 6 处缺环（Tab 扫描 4 个停点），无需改动冻结文件即获得朱砂焦点环。

### 6.1 Tab 扫描（11 路由 × 30 Tab，1280×800，Chrome headless，`next start` 生产构建）

| 阶段 | UA 蓝圈 (auto) | 无焦点环 (none) | 朱砂 2px | 无焦点元素 (null) |
|---|---|---|---|---|
| 之前（HEAD 构建） | 212 | 26 | 88 | 4 |
| 之后（含 globals.css 规则） | **0** | **0** | **326** | 4 |

- 之后：11 条路由中 8 条 30/30 为朱砂 2px，`/viewer/7` 与 `/ingest`（两个变体）各有 1–2 个 null（Tab 走出页面进入浏览器 chrome，之前同样为 null，共 4 个，不计缺陷）；全部停点 `:focus-visible` 为真。
- 之前分路由 blue/cinnabar/none：library 24/6/0 · desk 17/13/0 · desk-reader 12/17/1 · desk-card 23/7/0 · entities 29/1/0 · entity 21/9/0 · study 22/7/1 · review 2/28/0 · viewer 28/0/0 · ingest 17/0/12（两个变体相同）。

### 6.2 未聚焦截图对比（之前 vs 之后，同视口）

11 张中 6 张像素完全一致；其余 5 张仅 8–92 个像素有差异，最大通道差 ≤ 2/255（圆角抗锯齿噪声，无布局漂移）。

### 6.3 其它

- 复核：`tsc --noEmit` exit 0；`lint` 2 errors / 0 warnings（仅 `HeYeSession.tsx:88` 与 `StudySession.tsx:106`，冻结基线）；`build` 重试 exit 0。
- 冻结：`HeYeSession.tsx` / `StudySession.tsx` / `app/api/**` / `package.json` / `pnpm-lock.yaml` 相对 HEAD 零 diff。
