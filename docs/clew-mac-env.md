# Clew · Mac 本机接线（三档 · 只读 · 无 key 值）

> 本文只写**名字**与**步骤**，不含任何 API key 值。钥只放服务端 env；禁止 `NEXT_PUBLIC_*`、禁止入仓、禁止贴进 docs/聊天。

## 0. 这是什么

Clew 是书桌右栏的**只读复习助手**：一问 + 当前书/章/页/卡 → 流式答（可带「仅既有原子」的填空建议补丁）。
它**永不**写 seed / entities / blocks / `verified:true`；带走只靠剪贴板或你显式点击「填入本机草稿」。
补丁的 `before` 对齐为**当前卡 seed 现值**（空字段为 null）——只是建议，人核后才进草稿。
三档只是**模型挡位**，不是权限层级：

| 档 | id | 用途 | Zhipu 缺省模型 | 覆盖变量 |
|---|---|---|---|---|
| Fast | `fast` | 快答（**缺省默认档**） | `glm-4.5-flash`（免费档） | `CLEW_FAST_MODEL` |
| Reasoning | `reasoning` | 推理/辨析 | `glm-4.6` | `CLEW_REASONING_MODEL` |
| Long-context | `long-context` | 长页/长卡 | `glm-4.6` | `CLEW_LONG_MODEL` |

Minimax 三档缺省都是 `MiniMax-M2`（档语义靠 `CLEW_<TIER>_MODEL` 覆盖区分）。

接地按档（T69）：Long-context 档的服务端接地是**同章有界多页**（当前页 → 请求上下文 cite 页∩同章 →
近邻补齐；至多 5 页、总 ~12000 字，常量写死；因字顶未装的页如实报数）——**不是**整章全书塞 prompt；
选出的扩页若**全部**因总字顶没装上，仍设 ground（只装当前页）并写明「另有 k 页因总字顶未装」，不把 omitted 丢成「没扩」。
Fast / Reasoning 仍是单页 OCR 小窗。扩窗是服务端自取，客户端 `pages[]` 作业形仍 422 拒收。

## 1. 接线（5 步）

1. **复制占位**：`cp .env.example apps/web/.env.local`（Next 只读 app 目录；`apps/web/.gitignore` 已忽略 `.env*`）。
   或者不落文件，直接在 shell `export` 后再 `pnpm dev`。
2. **填钥**：`ZHIPU_API_KEY=…` 和/或 `MINIMAX_API_KEY=…`（只填一家也行——三档共用同一钥池）。
3. **（可选）指定档厂商/模型**：`CLEW_PROVIDER` / `CLEW_<TIER>_PROVIDER` / `CLEW_<TIER>_MODEL`，不填用缺省表。
4. **（可选）自设顶**：`CLEW_SESSION_MAX_CALLS=20` —— 本机今日调用（各档共用）达 20 → 429；明日自动恢复。这是你自己的闸，不是云端额度墙。
5. `pnpm dev`（或 `pnpm build && pnpm --filter web start`）。

## 2. 看三档是否可达（不调模型、不花钱）

```sh
curl -s http://localhost:3000/api/clew/status | jq
```

期望形：

```jsonc
{ "ok": true, "mode": "live", "provider": "zhipu", "model": "glm-4.5-flash",
  "defaultTier": "fast",
  "tiers": [
    { "id": "fast",         "label": "Fast",         "available": true, "provider": "zhipu", "model": "glm-4.5-flash" },
    { "id": "reasoning",    "label": "Reasoning",    "available": true, "provider": "zhipu", "model": "glm-4.6" },
    { "id": "long-context", "label": "Long-context", "available": true, "provider": "zhipu", "model": "glm-4.6" }
  ],
  "usage": { "today": 0, "byTier": { "fast": 0, "reasoning": 0, "long-context": 0 }, "note": "本机记数 · 非云账单" }, "readonly": true }
```

- `mode:"stub"` + 全 `available:false` = 没读到钥（看 §4）。
- 某档 `available:false` = 该档指定的厂商缺钥 → UI 芯片置灰、发送 503 `tier_unavailable`；**不会**悄悄换档。

## 3. 单问小试（至多一问一卡；禁止 bulk/多卡扫）

打开书桌任意章页，右栏选档位芯片（Fast/Reasoning/Long-context），问一句；或命令行：

```sh
curl -sN -X POST http://localhost:3000/api/clew/suggest \
  -H 'Content-Type: application/json' \
  -d '{"question":"这一页讲什么？","tier":"fast","context":{"book":{"id":"immunology-3rd","title":"免疫学"},"chapter":{"id":"ch01","title":"概述"},"page":3}}'
```

流式 NDJSON：`meta`（含 `tier` 与 `groundPages`——本次接地页平铺，多页 = Long-context 同章有界）→ `delta`* → `done`｜`error`。要 T66 式一次性 JSON 加 `"stream": false`。

`done`（以及 `"stream": false` 的 200）可选 `meta.audit`（`clew-answer-audit.v1`：接地 / 上下文 / 自标未核验 / 越窗未标 / 无此原子）。**审计 ≠ 核验**：`grounded` 只表示该页在本次给模型的窗内，不是「已核 / 正确 / verified」。审计抛错则 `meta.audit = { "error": "audit_unavailable" }`，答文照常下发，HTTP 状态不变。缺钥时的 stub 气泡用同一套纯函数在答面上核自己的页码（没给模型窗）。

## 4. 故障表

| 现象 | 原因 | 处理 |
|---|---|---|
| status `mode:"stub"`，全档 unavailable | env 未读到 | 钥是否在 `apps/web/.env.local`（不是仓库根）；重启 dev；变量名拼写 |
| 某档 unavailable，其它可用 | `CLEW_<TIER>_PROVIDER` 指定的厂商缺钥 | 填该厂商钥，或删掉该档的 PROVIDER 覆盖——**系统不会替你换档** |
| POST 503 `tier_unavailable` | 同上（服务端最终把关） | 同上 |
| POST 503 `no_provider` | 默认档也不可用 = 全缺钥 | 填钥 |
| POST 400 `bad_tier` | `tier` 不在 fast\|reasoning\|long-context | 改值；不填 = fast |
| POST 429 `session_cap` | 到你自设的 `CLEW_SESSION_MAX_CALLS` | 等明日 / 调大 / 删掉变量 |
| POST 502 `upstream_error` + `statusCode:401` | 钥无效/过期（detail 已去钥） | 换钥 |
| POST 502 `upstream_timeout` | 上游慢（Fast 30s；流式空闲 25s / 总 90s） | 重试；或换 Fast |
| 流中途 `error` 行 | 上游断流 | 已收文本保留，点「重试」 |
| 底栏「本机今日 N 次」不动 | status 只在面板挂载时读一次 + 本会话增量 | 刷新页；数字只是本机记数 |

## 5. 用量文件（本机 · 非真源）

`data/qa/clew-usage.jsonl`（已 `.gitignore`）：每行 `{ts,tier,provider,model,ok,error?,tokens?,auditUnmarkedOut?}`。
`auditUnmarkedOut` 是可选数字（本次越窗未标条数）；没有这个键的旧行照常解析。
不含问句原文、不含钥。它**不是**云账单、**不是**掌握度、**不是** Due；删了也不影响任何功能。

## 6. 铁合同（再说一遍）

只读答 · 结构化补丁 ≠ 真写（人粘贴/人点击才进本机草稿）· 仅既有原子永不发明 id · 三档不悄换 ·
永不 bulk · fail-closed · 不做诊断 · 钥只服务端 · 本机用量 ≠ 掌握% / Due ·
**审计 ≠ 核验**（核账只标注页码是否在本次窗内，不改答文、不写 verified）。
