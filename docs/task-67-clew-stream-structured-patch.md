# Task 67 — clew-stream-structured-patch-01

**Slug**: `clew-stream-structured-patch-01`  
**Title**: Clew 流式只读答 + 结构化非空补丁闭环 · 仅既有不完备原子 · 显式粘贴/点击进本机草稿 · 永不 verified / 永不 auto PATCH / 永不发明原子  
**Tip**: `236b0c3`（docs T66） atop feat `3d4570b`（T66） atop `7533696`（T65 docs）  
**体量**: MEGA ~180–300+ min · A–J 全交  
**定稿**: 2026-10-25 Asia/Shanghai (CST)

## 一句话

T66 只读 suggest 之上：① `/api/clew/suggest` 升 **streamText 流式主路径**（仍 POST only · 仍拒 bulk · 仍缺钥 503）；② 服务端 grounding 列**当前卡既有不完备原子** → 模型可在答末输出结构化填空建议 → 客户端白名单解析成**非空** `ariadne.atom-draft-patch.v1`；③ DraftInbox 粘贴导入（或答面显式点击）把建议 **merge 进本机草稿**——发送回调永不静默写，永不发明原子，永不 verified。

## 合同（硬 · 铁 · 每个字母遵守）

1. **只读答** —— 服务端零 fs 写；不写 `entities` / `blocks` / `verified:true` / 自动 PATCH seed。
2. **结构化补丁 ≠ 真写** —— 进本机草稿只有两条路：用户**粘贴**到 DraftInbox，或**显式点击**「填入本机草稿（未核）」；发送回调永不 `setAtomDraft`。
3. **仅既有不完备原子** —— grounding 只列 `loadCard` 的**既有** atom id / 字段下标（T55 空字段同口径）；解析侧 target 白名单，发明 id 一律丢弃；无卡或不完备=0 → entries 诚实 `[]`。
4. **永不 bulk** —— 单问 + 当前卡；`chapters[]` / 多卡作业 / `extract·parse` 形仍 422。
5. **fail-closed 流式** —— 缺钥 503；鉴权/连线上游错在首 chunk 前 → **502 JSON**（不装流式假 200）；中途断 → `error` 事件行，客户端保留已收文本 + 可重试；「停止」钮只中止读流。
6. **不做诊断 · 建议 ≠ 已核 · 页码只采信请求上下文** —— 系统提示 + 补丁指令块写死「禁止发明 id / 禁止 verified」。
7. **钥只服务端 env** —— 流事件（NDJSON）只携带 provider 名 + 模型名；`encodeClewStreamEvent` 无钥路径（单测断言）。
8. **不 redo Clew 壳 / T54–T66** —— 三 tab / Changes / Queue / return / `buildSuggestions` / status 探针 / bulk 拒收原样；仍一档 provider。
9. **精炼** —— 无一键写回朱砂主 CTA；「填入本机草稿」是次级按钮且带未核标注。

## 真源对照（tip `236b0c3` → 本刀后）

| 面 | 前 | 后 |
|----|----|----|
| suggest API | `generateText` 非流；entries 恒空 | `streamText` 流式主路径（NDJSON meta→delta*→done\|error）+ `"stream": false` 非流兼容枝（T66 JSON 形 + `incompleteTargets`） |
| grounding | `loadCard` 仅 cardSummary | + **不完备清单**（既有 id + 空标记 + 既有值只读截断 80 字；≤6 原子 ≤4 字段，超出如实标注） |
| 补丁 | envelope entries `never[]` 恒空 | `parseSuggestPatchEntries` 白名单 → 非空 entries（发明/未知 field/verified 意图/空 after 丢弃；≤20 条、after ≤500 字） |
| ClewPane | 非流 pending→终态 | 流式 pending 随 chunk 增长；done 剥尾随 ```json 围栏 → answer + `patchEntries`；停止钮；error 保留部分文本 |
| 本机草稿 | 无 patch 导入口 | `parseAtomDraftPatch` / `validateAtomDraftPatch` / `applyAtomDraftPatch`（整包拒收）+ DraftInbox「粘贴 Clew 草稿补丁导入」折叠面（与 port.v1 **分列**）+ 答面显式「填入本机草稿（未核）」 |

## 路径表（A–J）

| 路径 | 字母 | 要点 |
|------|------|------|
| `apps/web/app/api/clew/suggest/route.ts` | **A** | `streamText` 主路径：pre-flight 拉**首 chunk**（鉴权错仍回真 502）→ `ReadableStream` NDJSON；chunk 间空闲 25s / 总 90s abort；`cancel()` 连带上游中止；五禁注释保留。`"stream": false` → 非流 `generateText` 兼容枝。grounding 扩 `buildIncompleteGrounding` |
| `apps/web/lib/clew-suggest.ts` | **C·D·E** | `ClewIncompleteGrounding` / `buildPatchInstructionBlock`（只可填所列 · 禁发明 · 禁 verified · 无可填不输出围栏）/ `incompleteTargets` / `SuggestPatchEntry` / `parseSuggestPatchEntries` / `splitStructuredPatch`（只剥**尾随**围栏；坏 JSON 诚实空）/ envelope 非空 / `ClewStreamEvent` + `encodeClewStreamEvent`（无钥） |
| `apps/web/components/desk/ClewPane.tsx` | **B·F** | `run()` 读 NDJSON（meta→meta、delta→append、done→live+split、error 事件→error）；停止钮（AbortController）；error 保留已收部分文本 + 重试；答底非空补丁：复制纯文本 / **复制为草稿补丁（N 条）** / 显式「填入本机草稿（未核）」（`mergeAtomDraft` 同族 T55；done/unpersisted 反馈） |
| `apps/web/lib/atom-draft.ts` | **G** | `parseAtomDraftPatch`（严格整包：非法 JSON/错 schema/坏条目/verified 意图 → 拒收）/ `validateAtomDraftPatch`（纯函数：cardId 匹配 + 仅既有 target + field 类型匹配）/ `applyAtomDraftPatch`（validate 全过才 merge；只写 `ariadne.atom-draft.v1`） |
| `apps/web/components/DraftInbox.tsx` | **G** | `PatchPasteBlock` 折叠面：粘贴 → parse → 取卡（seed 快照或只读 GET `/api/entities/<id>`）→ validate → apply；与 port.v1 **分列文案**；只在点击时写 |
| `scripts/clew-suggest-check.mjs`（`pnpm clew-check`） | **C·E·G** | 29 用例：T66 18 条全保留 + 流事件不泄钥 / 指令块 / 白名单 / 发明丢弃 / 非空合法 / 尾随围栏两形 / patch parse+validate 整包拒收 |
| `docs/task-67-clew-stream-structured-patch.md` | **H** | 本文（无 key 值） |
| `apps/web/pnpm-lock.yaml` | **I** | 随 T66 install 更新的实际解析（ai 5.0.280 / openai-compatible 1.0.59，同 `^` 范围）——如实入仓对齐 |

## 流协议（NDJSON，每行一个 JSON）

```
{"type":"meta","provider":"zhipu","model":"…","pageWindow":{…}|null,"cardSummary":{…}|null,"incompleteTargets":["atom:…","field:0"],"readonly":true}
{"type":"delta","text":"…"}            # × N，pending 气泡逐 chunk 增长
{"type":"done","finishReason":"stop","usage":{"inputTokens":…,"outputTokens":…}}
{"type":"error","message":"…（已去钥）"}  # 中途断/超时；已收文本保留可重试
```

状态码不变：400 bad_json / missing_question / empty_question · 413 · 422 bulk_rejected · 503 no_provider · 502 upstream_error / empty_answer · 405 GET。

## env

同 T66（`ZHIPU_API_KEY` / `MINIMAX_API_KEY` / `CLEW_PROVIDER` 等；见根 `.env.example`，只列名字）。本刀零新增 env。

## 回归（J）

- `pnpm --filter web build` PASS；`tsc --noEmit` 零错；eslint 零新增（既有 `set-state-in-effect` ×4 与 `cardIndex` unused 为 HEAD 基线）。
- `pnpm clew-check` **29/29** · `cite-check -- ch01` · `parse-check` · `page-check` · `density-check` · `qa-check -- ch01` · `seed-apply-check`（夹具）全绿。
- 缺钥实测：status→stub · 单问→503 · `chapters[]`→422 · GET→405 · 坏 JSON→400；假钥：流式路径 pre-flight 401→**502 JSON** 且 detail 无钥；`stream:false` 兼容枝同形。
- 有钥时至多**单问单卡**小试；**禁止**验收 bulk / 多卡扫。
- 不毁：Changes / Queue / return / `buildSuggestions` / LocalProgressStrip / DraftInbox 主壳 / AtomDraftEditor / ChapterQualityCockpit / seed-apply-* / progress-port / entities·ingest 写 API / shelf 三分列 / T66 status 与 bulk 拒收。

## OUT（本刀 + forever）

Clew 真写实体 / blocks · `verified:true` · auto PATCH · 发送回调静默 `setAtomDraft` · **发明新 atom id** · bulk parse/extract/ingest · 一键写回 · 全量三档 harness / 配额 / LiteLLM / Auto 路由 / BYOK · empty-CTA / return densify · redo T46–T66 · 第四书架 · 掌握% / 健康分 · Register 硬门禁 · key 入仓 · FSRS / Due · 改名既有 storage keys。

## DEFER（后续刀）

- 全量 Clew harness（三档/配额/用量 UI / LiteLLM 网关）
- 批量重抽队列 UX · invent heye-only · Register API 硬门禁 · quiz/study 深度 densify
- 补丁建议的 seed before 对齐（客户端无 entities 全量；需要时走 /api/entities 只读取）
- Next.js security = ops not theme
