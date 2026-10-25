# Task 68 — clew-tier-usage-lite-01

**Slug**: `clew-tier-usage-lite-01`  
**Title**: Clew 三档精炼 · Fast / Reasoning / Long-context 注册表 + status.tiers + suggest 按档（缺档 503 不悄换）+ 档位芯片 + 本机用量记数（非云账单）+ Mac 接线短文  
**Tip**: `52a5333`（docs T67） atop feat `9ad7897`（T67） atop `236b0c3`（T66 docs）  
**体量**: MEGA ~180–300+ min · A–J 全交  
**定稿**: 2026-10-25 Asia/Shanghai (CST)

## 一句话

T67 流式 + 非空补丁 + 粘贴导入之上：provider 从「一档」升为**三档注册表**（`fast` 缺省 / `reasoning` / `long-context`），
status 探针回 `tiers[]`，suggest 按 body `tier` 解析——**所选档缺钥 → 503，永不静默换档**；ClewPane 发送旁三芯片
（status 驱动置灰、sessionStorage 新键记忆）；每次真打上游 append 一行 `data/qa/clew-usage.jsonl`（gitignored · 非真源 ·
非云账单），底栏「本机今日 N 次」；`docs/clew-mac-env.md` 接线诚实。保留 T66/T67 全部（五禁 / bulk 拒收 / streamText NDJSON /
补丁校验 / PatchPasteBlock / 显式 fillDrafts / stub 降级）。

## 合同（硬 · 铁 · 每个字母遵守）

1. **只读答** —— 不写 entities / blocks / verified / 自动 PATCH seed。**本刀唯一可写** = `data/qa/clew-usage.jsonl`（gitignored · 非真源）。
2. **继承 T67** —— 进本机草稿须用户粘贴或显式点击；发送回调永不 `setAtomDraft`；补丁主路径未重写。
3. **三档不悄换** —— `resolveClewTier(env, tier)` 缺该档 → `null`，不回落；route 503（他档在 → `tier_unavailable` 点名档；全缺 → `no_provider` T66 兼容）；指定厂商缺钥同样 null。
4. **永不 bulk** —— 单问 + 当前卡；`chapters[]` / 多卡 / extract·parse 形仍 422。
5. **fail-closed** —— 缺钥/缺档/中断 → stub 或可见错；pre-flight 401 → 真 502。
6. **不做诊断 · 建议 ≠ 已核 · 页码只采信请求上下文** —— 系统提示不变。
7. **钥只服务端 env** —— 三档复用 `ZHIPU_API_KEY` / `MINIMAX_API_KEY` 钥池；status.tiers / 流事件 / 用量行永不含钥；`.env.example` 与本文只列名字。
8. **不 redo Clew 壳 / T54–T67** —— 三 tab / Changes / Queue / return / `buildSuggestions` / 流式 / 补丁 / 粘贴原样。
9. **精炼** —— 无 LiteLLM 网关 / Auto 路由 / BYOK / Mentrix 云额度墙；`CLEW_SESSION_MAX_CALLS` 是**本机自设顶**（可选、各档共用、明日恢复），不是云墙。
10. **本机用量 ≠ 掌握% / Due**；无一键写回朱砂主 CTA；芯片选中态复用 Changes 筛选芯片的朱砂 soft（一种处理一种含义）。

## 真源对照（tip `52a5333` → 本刀后）

| 面 | 前 | 后 |
|----|----|----|
| provider | 一档 `resolveClewProvider` | `CLEW_TIERS` / `resolveClewTier(env, tier)` / `clewTierSummaries`；`resolveClewProvider` 保留为默认档别名（T66 单测口） |
| status | `{mode, provider, model, readonly}` | + `defaultTier` + `tiers[{id,label,zh,available,provider,model}]` + `usage.today` |
| suggest | 一档；无 tier | body `tier`（缺省 fast；非法 400 `bad_tier`）；缺档 503；可选 429 `session_cap`；meta 事件 / JSON 带 `tier`；结算 appendUsage |
| ClewPane | 无档位 | 三芯片（status 置灰 · `ariadne.clew.tier.v1` sessionStorage 新键 · 置灰不可发）；live 短标 `live · <tier> · <provider>`；重试复用快照档；底栏「本机今日 N 次 · 非云账单 · 非掌握度」 |
| 用量 | 零 | `lib/clew-usage.ts`：`buildUsageLine` / `parseUsageLine` / `countToday` / `startOfToday`（纯）+ `appendUsage` / `todayUsageCount` / `sessionCapReached`（fs，best-effort 不抛） |
| docs | 无 Mac 接线短文 | `docs/clew-mac-env.md`（5 步接线 / 三档表 / status 期望形 / 单问小试 / 故障表 / 用量文件说明；无 key 值） |

## 路径表（A–J）

| 路径 | 字母 | 要点 |
|------|------|------|
| `apps/web/lib/clew-provider.ts` | **A** | 三档注册表；env 映射 `CLEW_<TIER>_PROVIDER` / `CLEW_<TIER>_MODEL`（LONG 前缀）/ `CLEW_PROVIDER` / 钥池；`TIER_DEFAULT_MODELS`；**不串档**；`publicProviderInfo` 无钥 |
| `apps/web/app/api/clew/status/route.ts` | **B** | tiers[] + usage.today；不调模型、不回钥；全缺 → `mode:"stub"` |
| `apps/web/app/api/clew/suggest/route.ts` | **C** | `parseTier` → 400 `bad_tier`；`sessionCapReached` → 429；`resolveClewTier` → 503 `tier_unavailable`/`no_provider`；T67 流式 / 非流枝 / grounding / 五禁原样；每条结算 `appendUsage`（ok / fail code / tokens） |
| `apps/web/components/desk/ClewPane.tsx` | **D · F** | 芯片行（status 驱动可用/置灰 · 选中朱砂 soft）；`pickTier` 写 sessionStorage 新键；`tierAvailable` 门禁发送；`run(q, ctx, stub, tier)`；重试用 `m.tier`；底栏用量行 + 本会话增量 bump（200/502 才 +1） |
| `apps/web/lib/clew-usage.ts` | **E** | 行 schema `{ts,tier,provider,model,ok,error?,tokens?}`；不含问句原文/钥；append best-effort；今日口径本地 0 点；`sessionCapReached`（各档共用） |
| `.gitignore` · `.env.example` | **E · G** | `data/qa/clew-usage.jsonl` 忽略；三档名字空占位 + 不悄换注释 |
| `docs/clew-mac-env.md` | **G** | 接线 / status / 单问 / 故障表 / 用量说明；无值 |
| `scripts/clew-suggest-check.mjs`（`pnpm clew-check`） | **A · E** | 29→**37** 用例：三档 id 稳定 / 缺钥三档全 null / 档模型缺省表与 LONG 覆盖 / 厂商优先序与指定缺钥 null / summaries 无钥 / usage 行 schema + 脏行丢 + 今日计数口径 |
| `docs/task-68-clew-tier-usage-lite.md` | **H** | 本文 |

## 状态码（新增两条，其余 T66/T67 不变）

- `400 bad_tier` —— `tier` 不在 `fast|reasoning|long-context`（不悄当默认）。
- `503 tier_unavailable` —— 所选档缺可用钥/厂商（他档在）；`503 no_provider` —— 全缺（T66 兼容，ClewPane 降 stub）。
- `429 session_cap` —— 仅当设了 `CLEW_SESSION_MAX_CALLS`；被挡的不调模型、不记用量。

## 回归（J）

- `pnpm --filter web build` PASS；`tsc --noEmit` 零错；eslint 零新增（既有 `set-state-in-effect` ×2 为 HEAD 基线）。
- `pnpm clew-check` **37/37** · `cite-check -- ch01` · `parse-check` · `page-check` · `density-check` · `qa-check -- ch01` · `seed-apply-check`（夹具）全绿。
- 缺钥实测：status 三档全 `available:false` + `mode:"stub"`；单问任一档 → 503 `no_provider`；`tier:"mars"` → 400；`chapters[]` → 422；GET → 405。
- 假钥实测：status 三档 `available:true`；`tier:"reasoning"` 流式 → 502 `upstream_error`（上游 401，detail 无钥）；`CLEW_REASONING_PROVIDER=minimax` 且无 Minimax 钥 → reasoning `available:false`、POST 503 `tier_unavailable`、fast 仍可用（**不串档**实证）；`CLEW_SESSION_MAX_CALLS=1` → 第二问 429。
- 用量文件：实测后 `data/qa/clew-usage.jsonl` 出现 fail 行（`ok:false,error:"upstream_error"`），`git status` 不显示（gitignored）。
- 有钥时至多**单问单卡**；禁止验收 bulk / 多卡扫。
- 不毁：Changes / Queue / return / `buildSuggestions` / LocalProgressStrip / DraftInbox+PatchPasteBlock / AtomDraftEditor / cockpit / seed-apply-* / progress-port / entities·ingest 写 API / shelf / T66 bulk 拒收 / T67 流式·补丁·显式 fillDrafts。

## OUT（本刀 + forever）

LiteLLM 网关 · Auto 路由 · BYOK · Mentrix 式云端额度墙 · 缺档钥悄换另一档 · Clew 真写实体 · `verified:true` · auto PATCH · 静默 `setAtomDraft` · 发明 atom id · bulk · 一键写回 · empty-CTA / return densify · redo T46–T67 · 第四书架 · 掌握% / 健康分 · Register 硬门禁 · key 入仓/docs/前端 · 改名既有 storage keys。

## DEFER（后续刀）

LiteLLM 网关 · Auto 路由 · BYOK · 云配额墙 · 批量重抽 · invent heye-only · Register 硬门禁 · quiz densify · seed-before alone · 用量按档/按日聚合视图（现只给今日总数）。
