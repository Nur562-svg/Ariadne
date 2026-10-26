# Task 70 — clew-answer-cite-audit-01

**Slug**: `clew-answer-cite-audit-01`  
**Title**: Clew 答面事后核账 · 页码从口头约束变成可见、可测、可跳的诚实面  
**Tip**: `ad00a0f`（docs T69） atop `8bc9c3f`（feat T69） atop `7790c9e`（T68 docs）  
**体量**: MEGA ~180–300+ min · A–J 全交  
**定稿**: 2026-10-25 Asia/Shanghai (CST)

## 一句话

T69 把 Long-context 收成同章有界窗之后，系统提示第 2 条「页码只采信给定窗」仍只是口头约束：答面零事后检查，答文里的 `atom:` 不校，页码不可点，全超顶时 `extras=0` 会把 `pagesOmitted` 一起丢掉。本刀在答文落地之后做**只读核账**：抽出页码与既有 id，分成接地 / 上下文 / 自标未核验 / 越窗未标，以及已知 / 无此原子；服务端把结果放进 `done.meta.audit`；答面用芯片、就地标注和既有学习环入口把它显示出来。审计只标注，不改一个答文字符。

## 铁合同（硬 · 铁 · 每个字母遵守）

1. **只读答** —— 禁止写 entities / blocks / verified / 自动 PATCH seed。审计只标注，绝不改写、删除、替换模型答文字符。
2. **继承 T66–T69** —— 不 redo 流式 / 补丁 / 三档 / 接地 / before / 用量主路径。NDJSON 只加可选键。五禁 / bulk 422 / streamText NDJSON / 补丁白名单 / PatchPasteBlock / 显式 fillDrafts / resolveClewTier 不串档 / 档位芯片 / 用量 append+byTier / groundingPolicyForTier / selectGroundPages / buildSeedBeforeMap 保持。
3. **审计 ≠ 核验** —— 「已接地」只表示该页在本次给模型的窗内。文案禁用「已核 / 正确 / verified」当作结论（允许的否定句是「≠ 内容已核」）。
4. **永不 bulk** —— 只看本次答文 + 本次 grounding + 当前卡。不扫全书、不跨章补查、不二次调 LLM。
5. **原子引用只认既有 id** —— 精确相等。不存在 → 「无此原子」。不新建、不大小写折叠、不模糊匹配到别的 id。
6. **fail-closed** —— 审计抛错或坏形 → 不出芯片，一句「核账不可用」。禁止默认全绿。不影响答文下发，不改 HTTP 码。
7. **去练只用 tip 既有路由** —— `/study?card=&mode=all`（有书则带 `book=`）、书桌 `?book=&page=`、无书时 `/viewer/N`。无入口则纯文本。不新建路由。
8. **钥只服务端 env** —— 禁 `NEXT_PUBLIC_*` / 入仓 / docs 值。
9. **不 redo** Clew 三 tab / Changes / Queue / return / buildSuggestions。
10. **精炼** —— 禁 LiteLLM / Auto / BYOK / 云墙。审计计数 ≠ 掌握% / Due / 健康分。

## 空池 / return / 深链 / T54–T69（不 redo）

T43–T51 empty-pool CTA densify 已饱和；T35–T42 return densify 已饱和；T52–T53 已闭；T54–T65 材料 / 草稿 / 驾驶舱 / 干跑 / 书架脊梁已闭；T66 只读 suggest；T67 流式 + 补丁 + 粘贴；T68 三档 + 缺档 fail-closed + 用量 + Mac 接线；T69 Long-context 同章有界接地 + 补丁 seed before + 用量按档。以上主路径保持，本刀只在答末加核账，并补 T69 全超顶 omitted 被静默丢掉的那一处。

## 路径表（A–J）

| 路径 | 字母 | 要点 |
|------|------|------|
| `apps/web/lib/clew-answer-audit.ts` | **A · B · E · F** | `extractAnswerRefs` / `auditClewAnswer` / `safeAuditClewAnswer` / `coerceClewAnswerAudit` / `segmentAnswerRefs` / `relatedCardAtoms` / `buildAuditBasis`。纯函数，无 IO、无 Date。页码四类 + id 两类；去重保留首个 index；`clean = unmarked_out=0 且 unknown=0` |
| `apps/web/lib/clew-suggest.ts` | **D · F** | `assembleChapterGround`：extras=0 且 omitted>0 仍设 ground。`buildContextBlock` 全超顶一句。`buildTakeawayText` 加核账行（无审计 → 「核账：不可用」）。流事件可选 `pagesOmitted` / `auditBasis` / `cardAtoms` / `done.meta.audit`。补丁 envelope 不动 |
| `apps/web/app/api/clew/suggest/route.ts` | **C · D** | `buildGrounding` 用 `assembleChapterGround`；basis 来自本次 grounding + sanitizeContext + 已有 `loadCard`。流结束拼全文 → `meta.audit`；`stream:false` 同。try/catch → `{ error: "audit_unavailable" }`。用量行可选 `auditUnmarkedOut` |
| `apps/web/lib/clew-usage.ts` | **C** | `ClewUsageLine.auditUnmarkedOut?`。旧行无该键仍解析。`todayUsageByTier` 不读它 |
| `apps/web/components/desk/ClewPane.tsx` | **E** | 流式灰预览（同源纯函数）；`done.meta.audit` 覆盖。芯片一行；越窗未标 / 无此原子用琥珀（`cite-unverified` / `text-status-warn`），非红、非圆环。页码就地包 span，不改字符；窗内/上下文可点既有深链；越窗 `title=本次未给模型此页`。当前卡原子 ≤6 条走既有 `/study?card=`。`audit.error` → 「核账不可用」 |
| `scripts/clew-suggest-check.mjs` | **J** | 50 旧例保持；本刀 +19（抽取各形 / 区间上限 / 围栏 / 自标 / 四类 / unknown / 去重 / fail-closed / 全超顶 / 旧事件形 / 用量可选键） |
| `docs/clew-mac-env.md` | **G** | 旁注 `meta.audit` + 「审计 ≠ 核验」+ 全超顶一句 + 用量可选键。无 key 值 |
| `docs/task-70-clew-answer-cite-audit.md` | **H** | 本文 |

## 四类定义（页码）

分类只看**这一次**交给模型的窗和请求上下文，不回磁盘补页。

| 类 | 含义 |
|----|------|
| `grounded` | 页码在本次 `groundPages`（真装进模型窗的页）里。即使同句写了「未核验」，仍算 grounded——自标只对越窗生效 |
| `context` | 不在窗里，但在请求上下文（当前页 + `citePages`）或当前卡 cite 页里 |
| `self_marked` | 越窗，且同句或紧邻括号含「未核验」或「推测」（对齐系统提示约定的写法） |
| `unmarked_out` | 越窗，且没有自标 |

`pp.N–M` 展开上限 20 页（含端点）。更宽的区间**不展开**，整段 `rangeTooWide`：不因起点落在窗内就算 grounded；未自标则落入 `unmarked_out`。

id 两类：`known`（`atom:` / `entity:` 的 id 与当前卡原子 id 或当前卡 id **精确**相等）· `unknown`（否则）。芯片「无此原子 n」用 `counts.unknown`（含对不上的 entity id）。

`clean` = `unmarked_out = 0` 且 `unknown = 0`。答面在 clean **并且**没有自标越窗、没有过宽区间时，才显示一行「页码均在本次窗/上下文内（≠ 内容已核）」；否则显示五段计数，避免把自标越窗说成「都在窗内」。

## OUT（本刀 + forever）

LiteLLM 网关 · Auto 路由 · BYOK · Mentrix 式云端额度墙 · 缺档钥悄换 · Clew 真写实体 · `verified:true` · auto PATCH · 静默 `setAtomDraft` · 发明或模糊匹配 atom id · bulk · 客户端 `pages[]` / `chapters[]` 作业形 · 全书扫 / 跨章补查 · 二次 LLM 判真 · 改写或删除模型答文 · 一键写回 · empty-CTA / return densify · redo T46–T69 主路径 · 第四书架徽 · 掌握% / 健康分圆环 · Register 硬门禁 · 批量重抽 chrome · key 入仓 / docs / 前端 · 改名既有 storage keys · 把 draft 塞进 progress-port · seed-apply `--write` / `--apply` · 新建 study 路由。

## DEFER（后续刀）

LiteLLM 网关 · Auto 路由 · BYOK · 云配额墙 · 批量重抽 · invent heye-only · Register 硬门禁 · quiz densify · 审计历史聚合（现只在当次答面与可选的单行 `auditUnmarkedOut`，不做跨日汇总）。

写手不 push。验收 PASS 后由验收方按站规 auto-push。
