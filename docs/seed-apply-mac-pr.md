# 草稿落盘 Mac 工作流：DraftInbox 导出 → dry-run 对照 → 人改 seed → commit / PR

> 给在 Mac 本机把书桌草稿落进仓库的人。全程**工具只读**：浏览器和 CLI 都不会写回仓库；
> 改 `data/cards/*.entities.json`、`git commit`、开 PR，全部由**人**执行。

## 硬声明（先读）

| 事实 | 说明 |
|------|------|
| **浏览器永不写回仓库** | 书桌 DraftInbox 的「复制 / 下载」只产出剪贴板文本与本地下载文件，不 PATCH、不 fetch 写、不碰 seed。 |
| **CLI 永不写 entities** | `pnpm seed-apply-check` 是 DRY-RUN ONLY：只读 `data/cards/*.entities.json` 对照，唯一可写产物是 `data/qa/<戳>.seed-apply-dryrun.json` 报告。没有也不允许 `--write` / `--apply` 模式（传入即非零退出）。 |
| **不含 verified 翻改** | pack / guide / dry-run 报告里都没有「把 `verified` 改为 `true`」的指令。`verified` 是 seed 抽查结论，只能由人核对原文后自行决定，草稿永远翻不了它。 |
| **dry-run 报告 ≠ 已落盘** | 报告只说明「如果人去改，会改哪些、哪些已一致、哪些对不上」。跑完干跑，seed 一个字节都没变。 |
| **guide ≠ git apply** | 「人核落盘清单」是给人看的 markdown 勾选清单，不是 patch 文件，不能 `git apply`。 |
| **pack ≠ seed 已核** | 补丁包只是本机草稿的导出；草稿 ≠ seed 已核 ≠ heye 本机已对 ≠ study 练分。 |

## 第 0 步 · 前置

- Mac 本机已 clone 本仓库（Ariadne），`pnpm install` 已跑过。
- 书桌（`/desk`）的**本机草稿收件箱**里已有真改动（条目显示「真改动 N」）。
- 你有权限对本仓库开 PR。

## 第 1 步 · 书桌导出（浏览器，只出不进）

1. 打开书桌页，找到「本机草稿收件箱」（琥珀条）。
2. 点 **「下载 .json」** → 得到 `ariadne-atom-draft-pack.json`（T62 统一补丁包，schema `ariadne.atom-draft-pack.v1`）。
3. 点 **「下载 .md」** → 得到 `ariadne-atom-draft-apply-guide.md`（人核清单：每卡 seedPath + 逐条 before → after）。
4. 两个文件都放进**仓库根目录**（与 `package.json` 同级）。

> 也可以只用「复制」按钮进剪贴板再自己存文件；但 CLI 需要一个文件（或管道 stdin）。

## 第 2 步 · 本机干跑对照（CLI，DRY-RUN ONLY）

```bash
cd /path/to/Ariadne
pnpm seed-apply-check -- --pack ariadne-atom-draft-pack.json
# 或：cat ariadne-atom-draft-pack.json | pnpm seed-apply-check
```

stdout 首行固定 `DRY-RUN ONLY · never writes entities`，随后是五分列计数与逐条摘要；完整报告落在 `data/qa/<YYYYMMDD-HHMMSS>.seed-apply-dryrun.json`（gitignored，**报告非真源**，只是本次运行的留档）。

### 读结果（五种互斥分列，没有「应用成功率%」）

| status | 含义 | 你要做什么 |
|--------|------|-----------|
| `would-change` | seed 现值 ≠ 草稿值 | 逐条人核，确认后进第 3 步改 seed。 |
| `already-matches` | seed 现值已 === 草稿值 | **无需再改**（可能你或别人已落盘过）。 |
| `missing-card` | 章文件在、卡不在 | 卡可能已被重抽/删除——不要硬改；回书桌核对卡是否还在，或放弃该卡条目。 |
| `missing-seed-file` | `data/cards/<chapterId>.entities.json` 缺失 | 章 seed 文件不存在——先确认章 id，勿凭空建文件。 |
| `invalid` | 条目坏 / 原子·字段在当前 seed 不存在 | pack 过期（seed 已被重抽/改名）——重新导出 pack，或人工判断。 |

条目上的 `drift: true` = seed 现值与 pack 记忆的 before 不一致（导出后 seed 又被人改过）——落盘前**务必**对着 guide 的 before → after 与报告里的当前 before 三方核对，别盲改。

## 第 3 步 · 人改 seed（编辑器，只有你写盘）

对着 guide（`ariadne-atom-draft-apply-guide.md`）逐条勾选，用编辑器打开对应章文件：

```
data/cards/<chapterId>.entities.json
```

- 每张卡在其 `cards` 数组内；原子条目 `atom:<id>` 对应 `atoms[].prompt` / `atoms[].answer` / `atoms[].cite.quote`；字段条目 `field:<N>` 对应 `fields[N].value`。
- 只改文本值；`page`、`verified`、`difficulty` 等只读字段**不动**。
- `already-matches` 的条目跳过；`missing-*` / `invalid` 的条目按第 2 步表处理，**不硬改**。
- 改完可再跑一次第 2 步干跑自检：目标状态是这些条目全部翻成 `already-matches`。

## 第 4 步 · commit / PR（人执行）

```bash
git status                      # 确认只有你指名要落的章文件被改
git diff data/cards/ch01.entities.json
git add data/cards/ch01.entities.json   # 指名添加，不 git add -A
git commit -m "data(cards) ch01 落盘本机草稿（人核 N 条，dry-run 对照）"
git push -u origin <branch> && gh pr create
```

- pack / guide / dry-run 报告**不进 commit**（报告已 gitignore；pack、guide 属于本机临时文件，用完可删）。
- PR 描述里可贴 dry-run 的 counts 行（`would-change X · already-matches Y …`）作为对照记录。

## 故障排查

| 症状 | 原因 | 处置 |
|------|------|------|
| `pack 文件不存在` | 没放对路径 / 没导出 | 回第 1 步导出；文件须在运行命令的目录可达。 |
| `pack 不是合法 JSON` | 复制时截断 / 手改坏 | 从 DraftInbox 重新「下载 .json」；CLI 整包拒收，不写假绿报告。 |
| `pack.schema 不是 ariadne.atom-draft-pack.v1` | 传错文件（如草稿带走包 `atom-draft-port`） | 用**统一补丁包**那个文件；草稿带走包是另一 schema，只用于导入浏览器。 |
| 整卡 `missing-seed-file` | pack 里的 chapterId 在 `data/cards/` 无对应文件 | 确认章 id（如新抽出的章未落盘）；缺文件时**不要**手工造空章文件来「消红」。 |
| 整卡 `missing-card` | 卡被重抽 / 删除 | 回书桌 `/desk/card/<id>` 确认；卡没了就放弃该批条目，重新起草。 |
| 大量 `already-matches` | 已人工落盘过 | 正常且是好消息——这些条目无需任何动作。 |
| `收到非法旗标 --write` | 想找写模式 | 本 CLI **没有**写模式（合同如此）；按第 3 步人改。 |
| 条目 `invalid` 但卡还在 | 原子/字段被重抽、序号变化 | `field:<N>` 的 N 是导出时的序号，seed 变动后会漂；重新导出 pack 再干跑。 |

## 相关

- 收件箱与导出：书桌 DraftInbox（T62）；字段口径见 `apps/web/lib/atom-draft.ts` 的 `buildSeedApplyGuide`。
- 干跑算法：`apps/web/lib/seed-apply-dry-run.ts` ↔ `scripts/lib/seed-apply-dry-run.mjs`（孪生，同步改）。
- 主题短文：`docs/task-64-seed-apply-dry-run.md`。
