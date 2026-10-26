# Task 72 — desk-lint-remain-deskcontext-01

**Slug**: `desk-lint-remain-deskcontext-01`
**Title**: React 19 lint 诚实续刀 · DeskContext 真修 + 非冻结 SSE 真模式清剩 + 两处会话冻结 KEEP
**Tip**: `ed95557`（docs T71）atop `49871b4`（feat T71）atop `cc4f0dd`（T70 docs）
**体量**: MEGA · A–J 全交
**定稿**: 2026-10-26 Asia/Shanghai (CST)

## 一句话

T71 收掉三仓 store 订阅后，lint 仍剩 19 problems（SSE 12 · DeskContext refs×2+purity×1 · 4 warnings）。本刀真修 DeskContext（`useRef(Date.now())` + render 读 `.current` → lazy `useState` 时间戳），并用真模式清掉全部非冻结 SSE：form-seed → lazy 初值、one-shot 读盘 → noop-uSES 一次性采纳、UI 派生重置 → 渲染期调整（React 官方「You Might Not Need an Effect」形）、DraftInbox 取数三态 → 纯派生。HeYeSession cursor 恢复与 StudySession order 冻结两处 effect 按合同 KEEP。零 eslint-disable（净删 4 条死的）。

## 铁合同（硬 · 铁）

1. 不破坏 T71：三 hook / 微任务订阅 / 原串快照 / 全部既有 storage keys / 写 API 零退化；draft 永不进 progress-port。
2. 两处冻结 KEEP：HeYeSession cursor 恢复（基线 :222）与 StudySession order 冻结（基线 :237）原样保留；不 gut、不评分重排、不 disable。
3. DeskContext：`sessionStartedAt = useState(() => Date.now())`；不 render/useMemo 读 ref.current；Clew「本轮变更」since 过滤语义不变。
4. 真模式清 SSE：lazy useState / 渲染派生 / 渲染期 prop 调整 / Promise 回调 setState；禁 disable、禁关规则。
5. SSR fail-closed：新增 `useClientOnce`（noop 订阅 uSES）——SSR/水合首帧恒 server 默认值不水合错位，水合后读一次；读失败 = 默认值；不造假正数、不永挂「读取中」。
6. 美学零产品视觉改动（唯一可见差：ProgressPortability「读取中/禁用」瞬时态退役为空仓 0 口径，与 T71 同姿势）。
7. 不 redo Clew T66–T70 / T71；不 DocumentPane mega-split；不 entities SSR cache。
8. 禁 LiteLLM/Auto/BYOK/云墙/verified:true/Clew 真写/seed-apply 可写/bulk；钥不入仓。

## 路径表

| 路径 | 内容 |
|------|------|
| `apps/web/lib/use-client-once.ts` | 新增：`subscribeNever` + `useClientOnce(read, server)`——SSR 安全一次性采纳（noop-uSES；read 须值稳定） |
| `apps/web/lib/return-stack.ts` | 新增 `loadReturnOnce()`（每页载入读一次、引用稳定；键名/写 API 不动） |
| `apps/web/components/desk/DeskContext.tsx` | refs×2+purity×1 真修：lazy 时间戳 + useMemo 依赖补全 |
| 其余 10 文件 | 见迁留表 |

## 迁 / 留表（基线 19 条全量）

| 基线位置 | 桶 | 处置 |
|---|---|---|
| DeskContext:63/:65（purity+refs×2） | desk-context | **真修**：`useState(() => Date.now())`，useMemo 直取值（不读 .current） |
| AtomDraftEditor:83 | form-seed | **真模式**：lazy 初值 `seeded0`（seed ⊕ 草稿，编辑器点开才挂载、纯客户端） |
| AtomDraftEditor:269 | form-seed | **真模式**：value lazy 初值（只喂点开后的输入框，SSR 帧不渲染） |
| ProgressPortability:36 | form-seed | **真模式**：counts 改 T71 双仓 hook 渲染派生（导入经 notify* 自动回流；refreshCounts/读取中态退役） |
| ReturnNav:46 | one-shot nav | **真模式**：`useClientOnce` 采纳 lastOpened（T31 F 消毒口径不变）+ `loadReturnOnce` |
| DocumentPane:281 | one-shot viewMode | **真模式**：`pickedMode ?? adoptedMode ?? "cards"`；写回 effect 加「未选未采纳不写」门（防首遍冲掉续住值）；T24 URL 胜出口径不变 |
| HeYeSession:210 | one-shot ret | **真模式**：`useClientOnce(loadReturnOnce, null)` |
| StudySession:224 | one-shot lastOpened/ret | **真模式**：双 `useClientOnce`（T32 E 消毒口径不变） |
| ChapterPageReader:169 | ui-derived | **真模式**：渲染期调整（`prevJumpChapter !== chapterId` 清 jumpError；覆盖父层切章一切路径） |
| DocumentPane:297 | derived pageNo | **真模式**：pageNo lazy 初值（深链页 ?? 章首页，props 确定性无水合错位）+ 渲染期补位；`firstPageOf` 上移模块层 |
| DraftInbox:73 | fetch-empty | **真模式**：`fetchState` 三态纯派生（idle/loading/done 同形状喂 PatchPasteBlock，接口不动）；空集 → `EMPTY_SEEDS` 稳定空 map；effect 只异步取数 |
| **HeYeSession:222** | **freeze-KEEP** | **留**（游标恢复 + clamp + resumed；等价行 :218） |
| **StudySession:237** | **freeze-KEEP** | **留**（order 只在 atoms/mode/scopeKey 变化时冻结重算；等价行 :234） |
| 警告×4 | warnings | CitePeek 死 disable×2 删除；DraftInbox 未用 `cardIndex` prop 删除（调用方同步；`draftCardIndex` 仍喂 Cockpit）；DocumentPane `pageCitingCards` 包 useMemo |

## OUT（本刀 + forever）

不 push · 不全仓 lint-zero 强求 · 不 redo T46–T71 主路径 · 不 DocumentPane mega-split · 不 entities SSR cache · 不冻结 effect 非 effect 化（render-phase 化）· 不发明/改名 storage keys · 不改 return-stack/last-opened/view-mode 键名与写 API · 禁 LiteLLM/Auto/BYOK/云墙/verified:true/bulk/批量重抽/Register 硬门禁/key 入仓。

## DEFER（后续刀）

DocumentPane mega-split · entities SSR cache · 两处冻结 effect 的更深非 effect 化（本刀明确 KEEP）· 全仓 warnings 已清零后的 lint-zero · LiteLLM · Auto · BYOK · 云墙 · 批量重抽 · invent heye-only · Register 硬门禁 · quiz densify。

## 前后计数（J · 写手实测；验收方复核填空）

| 指标 | before（tip ed95557） | after（写手树） | 验收复核 |
|---|---|---|---|
| `pnpm --filter web lint` exit | 1 | 1（全绿非本刀） | ___ |
| problems | 19（15e / 4w） | **2（2e / 0w）** | ___ |
| set-state-in-effect | **12** | **2**（HeYeSession:218 · StudySession:234，均冻结 KEEP） | ___ |
| DeskContext | 3 | **0** | ___ |
| `tsc --noEmit` | 0 | 0 | ___ |
| build / clew-check / cite·parse·page·density·qa / seed-apply | — | 全绿（clew 69/69；ch01 各数与 tip 同） | ___ |

写手不 push。验收 PASS 后由验收方按站规 auto-push。
