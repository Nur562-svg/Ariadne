# Task 71 — desk-sync-external-store-01

**Slug**: `desk-sync-external-store-01`
**Title**: React 19 lint 诚实 · durable 本机仓的 load+subscribe effect 换共享 useSyncExternalStore
**Tip**: `cc4f0dd`（docs T70）atop `61450d7`（feat T70）atop `ad00a0f`（T69 docs）
**体量**: MEGA · A–J 全交
**定稿**: 2026-10-26 Asia/Shanghai (CST)

## 一句话

三仓 durable localStorage（heye / study grades / atom-draft）在 13 个组件里各自「useEffect 里 load + subscribe + setState」，触发 react-hooks/set-state-in-effect（SSE）23 条。本刀把 ChapterQualityCockpit 已有的 draftSnap 快照模式抽成三个共享 `useSyncExternalStore` hooks，站点换口；form seed / 一枪导航 / UI 派生 / DeskContext 全部留下（DEFER 注释点名）；语义不变：键名、写 API、广播、progress-port 通知、undo 栈、会话冻结一个不动。

## 铁合同（硬 · 铁）

1. 语义不变：`subscribe*` / `load*` / `notify*ExternalChange` / `saveGrade`·`setHeYeMark`·`setAtomDraft` 写 API 与 tip 一致；键名 `ariadne.heye.v1` · `ariadne.study.v1` · `ariadne.atom-draft.v1` 等永不改名；draft 永不进 progress-port。
2. 只砍经典 store 订阅 effect；form seed / one-shot / UI 派生 / DeskContext 留下。零 eslint-disable、零关规则。
3. SSR fail-closed：`getServerSnapshot` 恒空对象（同引用）；首帧空仓是合法口径（0 是真实空读数，不造假正数，不永挂「读取中」——T65 承诺由「getSnapshot 永不抛 + 无 ready 门」结构性成立）。
4. 快照稳定：按 localStorage 原串缓存，同串同引用（draftSnap 模式抽到三仓）；禁止每次 load 新对象。
5. 会话冻结保留：StudySession 本轮 order 只在 atoms/mode/scopeKey 变化时重算；HeYeSession cursor 恢复保留。uSES 只换 store 来源。
6. 订阅延一拍（微任务）：heye-store / atom-draft 写路径是「先广播后落盘」，React uSES 在订阅回调里同步核快照会读到旧串漏更新；延到微任务后落盘必已完成。三个 store 库本体一行未改。
7. 不 redo T46–T70 任何主路径；不 DocumentPane 大拆；不 entities SSR cache；美学零产品视觉改动。

## 路径表

| 路径 | 内容 |
|------|------|
| `apps/web/lib/use-heye-store.ts` | 新增：`useHeYeStore()`（uSES + 原串缓存 + 微任务订阅） |
| `apps/web/lib/use-study-grades.ts` | 新增：`useStudyGrades()`（同模式） |
| `apps/web/lib/use-atom-draft-store.ts` | 新增：`useAtomDraftStore()`（同模式；抽自 Cockpit draftSnap） |
| `apps/web/components/ChapterQualityCockpit.tsx` | 删私有 draftSnap 机件 → 共享 hook（交叉列数字不变） |
| 其余 12 个组件文件 | 迁站 / DEFER 注释（见下表） |

## 迁 / 留表（SSE 23 条全量）

| 文件:行（tip） | 桶 | 处置 |
|---|---|---|
| HeYeScopeCounts:36 | store-subscribe | **迁** useHeYeStore |
| StickyHeYeModeTabs:46 | store-subscribe | **迁** useHeYeStore（null-store 概念退役，空档如实 0） |
| StudyScopeCounts:44 | store-subscribe | **迁** useStudyGrades |
| StickyStudyModeTabs:50 | store-subscribe | **迁** useStudyGrades（同上） |
| LocalProgressStrip:101 | store-subscribe（dual） | **迁** 双 hook；「读取中/暂不可读」瞬时态退役（失败即空仓口径） |
| PageCardRailMarks:36 | store-subscribe（dual） | **迁** 双 hook（首帧「—」诚实空读数） |
| ClewPane:1342（ChangesPanel） | store-subscribe（dual） | **迁** 双 hook；setTick 强刷退役（原串变即新引用） |
| ClewPane:1667（QueuePanel） | store-subscribe（dual） | **迁** 双 hook；ready 门退役 |
| CardDraftBar:36 | store-subscribe | **迁** useAtomDraftStore |
| DraftInbox:67 | store-subscribe | **迁** useAtomDraftStore（ready 门随迁退役） |
| AtomDraftEditor:29 | store-subscribe（私有 hook） | **迁** 删私有 hook → 共享 useAtomDraftStore |
| HeYeSession:213 | store-subscribe（合并 effect 内） | **迁** store 部分；**该 effect 的 cursor 恢复行仍留**（规则改标 setIndex → 迁后仍占 1 条，见计数说明） |
| StudySession:231 | store-subscribe（合并 effect 内） | **迁** grades 部分；order 冻结行仍留（同上，仍占 1 条） |
| AtomDraftEditor:96 / :281 | form-seed | 留（DEFER 注释） |
| DraftInbox:81 | one-shot fetch（seed 取数） | 留（DEFER 注释；`ready` 门随迁退役） |
| HeYeSession:206 | one-shot（return 短链） | 留（DEFER 注释） |
| StudySession:221 | one-shot（lastOpened/return） | 留（DEFER 注释） |
| ProgressPortability:35 | form-seed | 留（DEFER 注释） |
| DocumentPane:280 / :295 | one-shot / derived | 留（DEFER 注释） |
| ChapterPageReader:168 | derived | 留（DEFER 注释） |
| ReturnNav:45 | one-shot nav | 留（DEFER 注释） |
| DeskContext refs×2 + purity×1 | desk-context | **整文件不动**（非本刀） |

## 行为微差（如实声明，均已注释在码内）

- SSR/首帧从「读取中…/null」变为「空仓 0 / —」（uSES 标准口径；不造假正数；不永挂）。
- 写后 UI 更新由「同步 setStore 镜像」变为「写 API 落盘 + 广播 → 微任务回流」——现代浏览器无感；localStorage 被整域禁用的极端配置下，写失败不再有会话内内存镜像（与 Cockpit / ScopeCounts 等全部 uSES 消费者同口径，诚实降级）。
- HeYeSession 由「只 load 不订阅」变为订阅（progress-port 导入现在也会刷新会话）。

## OUT（本刀 + forever）

不 push · 不 redo T46–T70 · 不 DocumentPane mega-split · 不 entities SSR cache · 不 DeskContext 整顿 · 不全仓 lint-zero · 不 eslint-disable / 关规则 · 不改 storage keys / 写 API 语义 · draft 不进 progress-port · 禁 LiteLLM / Auto / BYOK / 云墙 / verified:true / bulk / 批量重抽 / Register 硬门禁 / key 入仓。

## DEFER（后续刀）

DeskContext refs·purity · form seed（AtomDraftEditor ×2 / ProgressPortability）· one-shot nav（ReturnNav / lastOpened / viewMode）· DocumentPane 派生与拆分 · 4 条 warning 清理 · HeYeSession/StudySession 游标·冻结 effect 的非 effect 化（如 render-phase 调整，本刀明确不做）· LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent heye-only · Register 硬门禁 · quiz densify。

## 前后计数（J · 写手实测；验收方复核）

| 指标 | before（tip cc4f0dd） | after（写手树） |
|---|---|---|
| `pnpm --filter web lint` exit | 1 | 1（全绿非本刀） |
| problems | 30（26e / 4w） | **19（15e / 4w）** |
| set-state-in-effect | **23** | **12** |
| `tsc --noEmit` | 0 | 0 |

**SSE 12 的构成**：必留清单 10 条（AtomDraftEditor×2 · DraftInbox×1 · HeYeSession:210 · StudySession:224 · ProgressPortability · ChapterPageReader · DocumentPane×2 · ReturnNav）+ 2 条为 SCOPE 明令保留的会话 effect 本体（HeYeSession cursor 恢复 / StudySession order 冻结——store 行迁走后规则改标同 effect 内剩余的首个 setState；合同 #5 要求保留、合同 #6 禁止 disable，故无法再降）。超出「~7–9 ±1」的部分即此 2 条，表内如实点名。

写手不 push。验收 PASS 后由验收方按站规 auto-push。
