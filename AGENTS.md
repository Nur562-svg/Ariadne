# AGENTS.md — Ariadne 编码代理站规 + 工具登记

> 给任何进入本仓库的编码代理（Antigravity / zcode / Trae / Cursor / Claude Code …）。
> 读完这一页再动手。长背景见当前任务书；产品视觉规范见 [`docs/frontend-aesthetics.md`](docs/frontend-aesthetics.md)。
> 另有 [`apps/web/AGENTS.md`](apps/web/AGENTS.md)：由 `next dev` 自动维护的 Next.js 提醒块，**不要手改**。
> 本文件由用户授权加入仓库（t275u）；末尾「工具与参考登记」是**活表**，持续追加。
> 本文件不写死某个 commit：「基线 tip」一律指**当前任务书里点名的那个 tip**。

---

## 1. Ariadne 是什么（一段话）

教材 PDF → 本机 OCR → LLM 抽取 → 实体卡 + 知识原子（带页码引用）→ 书桌里阅读 / 学习 / 核页复习。目标用户是中国医学生；它要做成**产品**，不是 demo。技术栈：pnpm monorepo（`apps/web`）· Next.js App Router 16.4.0 · React 19.3.0 · TypeScript · Tailwind v4。
⚠ 这个 Next 版本与常见训练数据不同；写 Next 专有代码前读 `apps/web/node_modules/next/dist/docs/`。机械拆分刀不应需要新的 Next API——觉得需要就是跑偏了，停下汇报。

## 2. 工作循环（knife loop）

1. **Grok Bot 出刀**：任务书（SCOPE + A–J 门槛）。
2. **写手（你）实现**：在本仓库工作区改文件，**留 dirty tree，不 commit、不 push**。
3. 用户说「做完了」→ **Grok Bot 验收**：A–J 全交才过 + 视觉/产品验收。
4. PASS 后由 Grok Bot commit（feat + docs）并 push。

写手禁令：`git commit / push / stash / reset / clean / rebase / checkout -- <file>`；不 `git add`（除非验收方明说）。
开工第一步：`git rev-parse HEAD` 必须等于**任务书点名的 tip**；不等 → 立刻停止并汇报，**不要**自己 pull / checkout / reset。
工作区里既有的 untracked 历史文件不是你的，不动、不整理。

写手历史：zcode（GLM）写到 Task 98；**Task 99 起由 Antigravity 写**（zcode 会员到期，用户 t274u 指定；T99 为其首刀，验收 PASS）。

## 3. 产品与视觉原则

- **证据优先、fail-closed**：未核实 cite 保持琥珀；OCR 命中 ≠ verified；永不写 `verified:true`；不造 mastery% / 健康圆环 / Due 角标；池空就诚实显示空态。
- **朱砂（cinnabar）是唯一品牌强调色**；语义色（ok/warn/error）只表状态。
  ⚠ 已知差异：`docs/frontend-aesthetics.md` 写亮 `#b8432f` / 暗 `#e0705a`，而 `apps/web/app/globals.css` 当前是 `--cinnabar: #b23a2a` 且无暗色变量块。**不要在机械拆分刀里改 token**；是否对齐由专门的刀决定。
- 气质：编辑式安静书桌 + Linear 式克制；不是营销落地页、不是卡砖仪表盘、不是紫渐变模板。中文宋体族 + 拉丁医学词要可读；正文对比 ≥ 4.5:1；尊重 `prefers-reduced-motion`。
- 不新增颜色 / 字体 / CSS / UI 文案 / 依赖。

## 4. 命令

```bash
pnpm --filter web exec tsc --noEmit     # 必须 exit 0
pnpm --filter web lint                  # 见 §5 基线
pnpm --filter web build                 # 交付前跑一次
```
只用 pnpm。`*.tsbuildinfo` / `next-env.d.ts` 已 gitignore，不算 dirty。

## 5. 铁律 / 红线

**Lint 基线**：`pnpm --filter web lint` = 恰好 **2 problems / 2 errors / 0 warnings**（`react-hooks/set-state-in-effect`），位置（用代码原文认，行号只是参考）：
- `apps/web/components/HeYeSession.tsx` ≈:88 `setIndex(Math.max(0, Math.min(saved, nv.length - 1)));`
- `apps/web/components/StudySession.tsx` ≈:106 `setOrder(ordered);`

这两个文件**零触碰**；不许「修」这两处；不许 `eslint-disable` / 关规则 / 删 effect 装绿。若任务书声明了新的基线，以任务书为准。
其它必守：保留 `export const dynamic = "force-dynamic"`；不复活 `generateStaticParams`；服务端组件不新增 `"use client"`；公共 default export / 路由路径不改。

**OUT forever（做了即偏题/拒收）**：Clew 真写 · `verified:true` · seed-apply 可写（`--write`/`--apply`） · 带 key 的 bulk · key 入仓或 `NEXT_PUBLIC_*` · Next 升级 / `pnpm up` / 新依赖 · empty-CTA / sticky / return densify · LiteLLM / Auto 路由 / BYOK / 云额度墙 · 编造原子 · Register 硬门禁改动 · mastery% / 健康圆环 · 重做已关闭任务 · 客户端 `pages[]` 作业 · gut 冻结点 · TTL-only 缓存 · `matchAll` 重写 audit extract · 改 OCR 阈值 · 孪生 cite-ocr `.mjs` · `clew-pane-helpers` 再拆（T75 BAN）· `routes/suggest`。

**DEFER（本阶段不碰）**：`EntityCardDetail` · `DocumentPane` 第三刀 · `ClewPane` further · `ingest`。

Clew 只读：`app/api/clew/suggest/route.ts` 头注释「五禁」（不写 entities / 不 verified / 不 PATCH / 不 bulk / 钥不入客户端）；档位缺失明确报错，不静默换档。

## 6. 机械拆分怎么做才算对（move-as-is）

1. 逐字搬：className / 文案 / href 构造 / 注释里的任务编号都不改（验收会比 className 多重集 tip ≡ after）。
2. 只允许新增：import、props/类型、`const { … } = scope;` 解构、scope 返回对象与 `ReturnType` 类型别名、Fragment、文件头注释。
3. 不整文件格式化（Prettier / `eslint --fix`）；缩进可变，内容不可变。
4. RSC 保持 RSC；loader 调用顺序/条件/次数不变。
5. 不「顺手改进」；发现问题只在汇报里写「观察到：…（未改）」。
6. 模板：页拆分的标准形见 T98（`apps/web/lib/study-page-scope.ts` · `components/StudyPageChrome.tsx` · `app/(desk)/study/page.tsx` · `docs/task-98-desk-study-page-split.md`）——外层包装 div 留 page；`qs` 等闭包随 scope 导出；Chrome 是 Fragment。

## 7. 验收看什么

tip 正确 · 只动该动的文件 · 零触文件 SHA256 一致 · 行数合同 · 逐字 diff · className/token/文案多重集 Δ0 · tsc 0 · lint 基线不变 · build PASS · 视觉无漂移（朱砂仍是唯一品牌色）。

## 8. 完工报告格式（写手最后一条消息）

HEAD（确认未 commit/push）· 文件清单 + 行数 · 缝映射（tip 行段 → 新文件）· tsc 退出码 · lint 原文 · build 结果 · A–J 自检 · 观察到未改的事项 · **本任务用到的新 MCP / skill / GitHub 项目 / 其它工具（见 §9 规则）**。然后说「做完了，请验收」。

---

## 9. 工具与参考登记（持续更新）

**规则**：任何 Task 用到新的 MCP / skill / GitHub 项目，写手在完工报告里列出；Grok Bot 验收时追加到此表并随 docs commit 提交。
**原则**：只登记**可核实**的条目，每条写来源；拿不准的不写。「调研候选」≠「已借用」——请在备注里分清。
`/workspace/reports/...` 是 Grok Bot 云盒上的报告，**不在仓库里**；写手读不到，仓库内来源以 `docs/` 或代码为准。

### MCP

| 名称 | 用途 | 首次使用 Task/日期 | 备注（来源） |
|---|---|---|---|
| Chrome DevTools MCP | 视觉验收时开页/截图 | T09 · T17（2026-10） | T17 验收：box 上的实例指向了旧树，**未用于结论**；最终用 Mac headless Chrome + CDP 对 `next start -p 3001` 验收（dev 下 HMR 导致 hydrate 失败）。T26 记录「Mac Chrome MCP 未用」。来源：box `reports/ariadne-task-09/ACCEPTANCE-task-09.md`、`ariadne-task-17/ACCEPTANCE.md`、`ariadne-task-26/ACCEPT.md` |

### Skills

| 名称 | 用途 | 首次使用 Task/日期 | 备注（来源） |
|---|---|---|---|
| ariadne-frontend-aesthetics | 产品视觉心智：朱砂 + 纸面、无紫渐变 SaaS 模板；验收时做产品检查清单 | T94 验收（亦见 shell-scope 2026-10-17） | 仓库内对应物：`docs/frontend-aesthetics.md`（该文件自称与此技能对齐，**仓库以本 md 为准**）。来源：box `ariadne-task-94/ACCEPT.md`、`ariadne-task-98/ACCEPT.md` |
| web-interface-guidelines-review（Vercel Web Interface Guidelines） | 工程合规审查，输出 `file:line` 发现；每次先拉最新 guidelines | 文档指定为「可选」审查项 | 来源：`docs/frontend-aesthetics.md` 末尾清单与「与任务书的关系」。**是否在某个 Task 实际跑过：未登记** |

### GitHub 项目 / 参考

| 名称 | 用途 | 首次使用 Task/日期 | 备注（来源） |
|---|---|---|---|
| Vercel AI SDK（`vercel/ai`：`ai` + `@ai-sdk/openai-compatible`） | **已用**：直连 GLM / DeepSeek 做抽取与 Clew 流式（勿经 OpenRouter） | T01 起 | 来源：`apps/web/package.json`、`README.md`、`docs/task-01-entity-cards-immunology.md`；代码使用见 `apps/web/app/api/clew/suggest/route.ts`、`scripts/extract_cards.mjs` |
| Next.js（`vercel/next.js`） | **已用**：框架，锁定 16.4.0 | — | 来源：`apps/web/package.json`；升级是 OUT |
| open-spaced-repetition/ts-fsrs | **仅调研候选，未集成**（FSRS 调度核心的候选） | 调研 2026-10-14 | 来源：box `reports/market-research/github-oss.md`。Task 21 / 40 / 57 任务书明确**禁止**接 ts-fsrs / Due 调度 |
| ankidroid/Anki-Android（PR #18735、#17941） | **仅交互范式参考**（会话内 揭晓→等级→短反馈；非代码借用） | 调研 2026-10-09 | 来源：box `reports/ariadne-quiet-v4-gap-benchmark-2026-10-09.md` §7 |
| 其它开源调研名单（MinerU / docling / pdf.js / react-pdf-highlighter / assistant-ui / LiteLLM 等） | **调研候选，均未集成** | 调研 2026-10-14 | 来源：box `reports/market-research/github-oss.md`。LiteLLM 在站规中属 OUT |

### 其它工具

| 名称 | 用途 | 首次使用 Task/日期 | 备注（来源） |
|---|---|---|---|
| Apple Vision OCR（`ocrmac`）+ `pdftoppm` | 本机 OCR：`scripts/parse_chapter.py` | T01 起 | macOS 本机；**无云 OCR**。来源：`README.md` |
| GLM / DeepSeek（直连） | `scripts/extract_cards.mjs` 抽取；Clew 档位 | T01 起 | 密钥只在服务端 env，永不入仓。来源：`README.md`、`docs/task-01-entity-cards-immunology.md` |
| ESLint 9 + `eslint-config-next` | lint 基线（§5） | — | 来源：`apps/web/package.json` |
| Tailwind v4（`@tailwindcss/turbopack`） | 样式 | — | 来源：`apps/web/package.json` |
| Mimosa 安全 hook | 写手 IDE 侧的写入扫描器；曾因 `while ((m = re.exec(s)))`（标准正则迭代）误报「命令注入」，用户解锁后继续 | T85（后续多刀复现） | 属写手环境，不是仓库依赖。来源：`docs/task-85-desk-clew-answer-audit-lib-split.md` §过程备注。遇到误报：**不要为绕过扫描器改写代码**，原样汇报 |
| Antigravity（IDE 编码代理） | **写手**：自 Task 99 起在本仓库写代码（此前为 zcode / GLM） | T99（2026-10-31） | 来源：用户 t274u 指定接替 zcode。T99 完工报告**未单独列出**新的 MCP / skill / GitHub 项目；该刀用到的仓库内脚本仅 cite-check / parse-check 夹具（见 `docs/task-99-desk-review-page-split.md` §验证）。之后若用到新工具，请在完工报告里列出 |
