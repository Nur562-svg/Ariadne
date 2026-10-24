# Task 66 — clew-suggest-readonly-01

**Slug**: `clew-suggest-readonly-01`  
**Title**: Clew 只读建议 · 小能力 live 答（stub→live）· 单问+书桌上下文 · 剪贴板-only 带走 · 永不写实体/blocks/verified · 永不 bulk parse·extract · fail-closed  
**Tip**: `7533696`（docs T65） atop feat `a0a8ebb`（T65） atop `a1f1f72`（T64 docs）  
**体量**: MEGA ~180–300+ min · A–J 全交  
**定稿**: 2026-10-24 Asia/Shanghai (CST)

## 一句话

脊柱 T54–T65 已闭后，把 Clew 右栏从「stub · 未接模型」升到 **只读 live 小能力答**：
一问 + 当前书桌上下文（书/章/页/卡/表面/cite 页）→ 服务端自取当前页 OCR 截断小窗 + 当前卡一行摘要 →
一档 openai-compatible 模型 → 文本答。缺钥/上游错诚实降 stub 或可见错；带走只靠剪贴板；工具永不写 seed / 永不 bulk。

## 合同（硬 · 铁 · 每个字母遵守）

1. **只读答** —— 禁止写 `entities` / `blocks` / `verified:true` / 自动 PATCH；服务端零 fs 写（只读 `loadBooks` / `loadChapterPages` / `loadCard`）。
2. **剪贴板-only 带走** —— 「复制纯文本」「复制为草稿补丁形」只写 `navigator.clipboard`；禁止一键 `setAtomDraft` / 写入 atom-draft 仓 / 仓库。
3. **永不 bulk** —— 一问 + 当前上下文；`chapters[]` / `pages[]` / `questions[]` / `extract` / `parse` / `ingest` / `verified` / `patch` / `write` / `apply` 等作业形键（顶层或 `context` 内）→ **422 bulk_rejected**。
4. **fail-closed** —— 缺钥 → **503 no_provider** → ClewPane 诚实 stub（保留 `stubReply` 族文案 + 短标 `stub`）；上游错/超时/网络 → **502 / error 态**：保留原问 + 可重试，**不**装成功答；不静默空 200。
5. **不做诊断 · 回答 ≠ 已核 · 页码只采信请求上下文** —— 系统提示写死；模型自造页码须标「（未核验：推测在 p.?）」；答底「未核」+ 底栏脚注同源常量。
6. **钥只进服务端 env** —— `ZHIPU_API_KEY` / `MINIMAX_API_KEY`；禁止进仓库 / docs 正文 / `NEXT_PUBLIC_*`；响应体只回 `provider` name + `model`；上游错误消息经 redact 去钥 + 截断 300 字。
7. **不 redo Clew 壳** —— 三 tab / Changes / Queue / return 短链 / `buildSuggestions` / LocalProgressStrip compact / T33 行动链快照 / T51 池门禁全部保留；本刀只扩展**发送路径 + 答面**。
8. **不 redo T54–T65** —— 质量算法 / DraftInbox / cockpit / seed-apply / AtomDraftEditor / shelf 文案一字不动。
9. **一档即可** —— Zhipu **或** Minimax（`CLEW_PROVIDER` 指定，缺省 Zhipu 优先；显式指定但缺对应钥 → 503，不悄换）；禁本刀三档选择器 / 配额 / LiteLLM。
10. **精炼** —— 无营销英雄；无「一键写回」朱砂主 CTA；答面效用文；失败态用 `status-error`（danger 语义），朱砂仍只做动作/状态强调。

## 真源对照（tip `7533696` → 本刀后）

| 面 | 前 | 后 |
|----|----|----|
| ClewPane | `stubReply` only；无 `/api/clew/*`；头部「本地 stub / 未接模型」静态 | `POST /api/clew/suggest` live 路径；四态气泡 live/stub/pending/error；头部/会话条/空态按 `/api/clew/status` 探针说真话；答底复制 + 「未核」 |
| deps | 根 `ai` ^5 + `@ai-sdk/openai-compatible` ^1（web 包看不到） | `apps/web/package.json` 同范围声明（lockfile +6 行，复用同版本，零新包） |
| DeskContext | 书/章/页/卡/表面已齐 | **不改**；`pickSuggestContext` 白名单投影（不带 progress* / 本机 store） |
| 钥 | 无 | 服务端 env（本文件不写值；`.env.example` 只列名字） |

## 路径表（A–J）

| 路径 | 字母 | 要点 |
|------|------|------|
| `apps/web/app/api/clew/suggest/route.ts` | **A** | **POST only**（GET 405 + `Allow: POST`）；`parseSuggestBody` → 400/413/422；缺钥 503；`generateText` 非流（`maxOutputTokens` 700 · `temperature` 0.2 · 30s abort）；502 redact；响应 `{ ok, mode:"live", text, provider, model, pageWindow, cardSummary, finishReason, usage, readonly:true }`；文件头写死五禁 |
| `apps/web/app/api/clew/status/route.ts` | **A**（配套探针） | GET：**不调模型、不读盘、不回钥**，只回 `{ mode, provider, model }`——ClewPane 首问前就能如实标 live/stub |
| `apps/web/lib/clew-provider.ts` | **B** | 纯 resolver：`resolveClewProvider(env)` → 一档配置或 `null`；`publicProviderInfo` 永不含 apiKey；默认 Zhipu `glm-4.5-flash` @ `open.bigmodel.cn/api/paas/v4` · Minimax `MiniMax-M2` @ `api.minimaxi.com/v1`（均可 env 覆盖） |
| `apps/web/lib/clew-suggest.ts` | **C** | 纯函数（无 import/fs/env）：`parseSuggestBody` / `sanitizeContext` / `truncatePageText`（≤3000 字，报原字数）/ `CLEW_SYSTEM_PROMPT` / `buildContextBlock` / `buildPrompt` / `buildTakeawayText` / `buildSuggestPatchEnvelope`（`ariadne.atom-draft-patch.v1` 形，**entries 恒空**）/ `CLEW_HONESTY_FOOTNOTE` |
| `apps/web/components/desk/ClewPane.tsx` | **D · E · F · G** | `send` → pending 气泡 → `run()` fetch；live / 503→stub / 其它→error+重试（复用快照问与上下文）；`sending` 锁禁双发（钮「发送中…」+ `aria-busy`）；答底「对照 p.N 小窗 · 未核」+ 复制纯文本 + 有卡时复制补丁形；底栏 `CLEW_HONESTY_FOOTNOTE`；头部 `capLabel`、会话条「小能力只读/未接模型」、空态 `capIntro` 随探针 |
| `scripts/clew-suggest-check.mjs` + root `pnpm clew-check` | **C**（单测） | `node --test` 直 import 两 `.ts`：18 用例——拒 bulk 13 形、白名单投影、截断、系统提示四要素、上下文块、带走、补丁形 entries 空、provider 优先序/不悄换/不带钥 |
| `.env.example`（根） | **B** | 只列名字空占位 + 注释（Next 只读 `apps/web/.env.local`）；无真值 |
| `docs/task-66-clew-suggest-readonly.md` | **H** | 本文 |
| `apps/web/package.json` + `pnpm-lock.yaml` | **I** | 两依赖声明；无其它改动 |

## 请求 / 响应形

```jsonc
// POST /api/clew/suggest
{ "question": "p.12 这一页在讲什么？",
  "context": { "book": {"id":"…","title":"…"}, "chapter": {"id":"ch01","title":"…"},
               "page": 12, "citePages": [3,5], "visibleEntityName": "抗原",
               "card": {"id":"…","name_zh":"…"}, "surface": "desk" } }
// 200 live  → { ok:true, mode:"live", text, provider:"zhipu", model, pageWindow:{page,chars,truncated,source}|null, cardSummary|null, finishReason, usage, readonly:true }
// 400       → bad_json / missing_question / empty_question   413 → question_too_long
// 422       → bulk_rejected（顶层或 context 内作业形键）
// 503       → no_provider（缺钥；ClewPane 降诚实 stub）
// 502       → upstream_error / upstream_timeout / empty_answer（原问保留可重试；detail 已去钥截断）
// 405       → GET / 其它方法
```

页 OCR 小窗来源优先序：有 `chapter` → 该章 `blocks.json` 同页；无 `chapter` 但有 `book`+`page` → 遍该书章文件找同页（仍是**单页查找**）；都无 → 客户端 `pageText`（同样截断）；全无 → 上下文块如实写「本次没有页面原文小窗」。

## env（只列名字 · 不写值）

| 名 | 作用 |
|----|------|
| `ZHIPU_API_KEY` / `ZHIPU_MODEL` / `ZHIPU_BASE_URL` | Zhipu 一档（默认 `glm-4.5-flash`） |
| `MINIMAX_API_KEY` / `MINIMAX_MODEL` / `MINIMAX_BASE_URL` | Minimax 一档（默认 `MiniMax-M2`；国际站 `https://api.minimax.io/v1`） |
| `CLEW_PROVIDER` | `zhipu` \| `minimax`；两钥都在时指定；缺省 Zhipu 优先 |

## 回归（J）

- `pnpm --filter web build` PASS；`tsc --noEmit` 零错；eslint 零新增（既有 2 条 `set-state-in-effect` 在 ChangesPanel/QueuePanel，HEAD 基线同）。
- `pnpm cite-check -- ch01` · `parse-check` · `page-check` · `density-check` · `qa-check -- ch01` · `seed-apply-check` 绿（本刀不改质量算法）。
- `pnpm clew-check` 18/18 绿。
- 缺钥路径实测：`GET /api/clew/status` → `mode:"stub"`；`POST /api/clew/suggest` 单问 → 503 `no_provider`；`chapters[]` → 422；`GET` → 405；坏 JSON → 400。
- 有钥时至多**单问**小试（本次验收环境无钥，未跑 live；**禁止**验收跑 bulk）。
- 不毁：Changes / Queue / return / `buildSuggestions` / LocalProgressStrip / DraftInbox / AtomDraftEditor / ChapterQualityCockpit / seed-apply-* / progress-port / entities·ingest 写 API / shelf 三分列 / cite·parse·暗·浅。

## OUT（本刀 + forever）

Clew 真写实体 / blocks · `verified:true` · auto PATCH · 自动写入 atom-draft 仓 · bulk parse/extract/ingest（整章/多章/全书）· 「一键写回」· 全量三档 harness / 配额 / LiteLLM / Auto 路由 / BYOK · 流式（本刀非流 `generateText`）· empty-CTA / return densify · redo T46–T65 · 第四书架徽列 · 掌握% / 健康分 · Register 硬门禁 · key 入仓 / docs / `NEXT_PUBLIC_*` · FSRS / Due · 改名既有 storage keys · DeskShell 重写 · 发明原子 / 页码。

## DEFER（后续刀）

- 全量 Clew harness（三档选择器 / 配额 / 用量 UI / LiteLLM 网关）
- 流式 `streamText` 答面（本刀非流已够小能力）
- 结构化原子级补丁建议（需把卡 atoms id 喂模型，接近 extract 邻域——本刀只给 entries 空的补丁形）
- 批量重抽队列 UX · invent heye-only · Register API 硬门禁 · quiz/study 深度 densify
- Next.js security = ops not theme
