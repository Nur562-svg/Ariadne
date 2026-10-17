# Task 08 / desk-v4-shell-01 — First DeskShell UI slice（Trae）

**状态**：brief 已定 · 待 Trae 执行（Nuradil resting；Grok Bot 调度）  
**仓库**：`Nur562-svg/Ariadne`（本机 `/Users/nukeab/projects/Ariadne`；box 对照 `/workspace/Ariadne-push`）  
**主写手**：Trae Code（建议模型 **`DeepSeek-V4-Pro`**；备选 zcode）  
**前置**：shell-01 已在 `main`（`989103a` feat(web): shell-01 书库 + 诚实 ingest + /study）。**保留** library / ingest / `/study` / CiteChip / `loadAllChapterPages`——本任务是在其上 **铺 desk-v4 三栏铬件**，不是再做一个 plumbing 壳。  
**规范**：先读 `docs/frontend-aesthetics.md`（精炼书桌 · 朱红唯一品牌强调色 · 产品面勿做营销 hero / nur-landing）  
**视觉目标**：`/workspace/reports/ariadne-desk-ia/desk-v4.html` + `desk-ia.md`（248 | 讲义 | Clew 400）

> **开工前（硬）**：Mac 工作树确认在 `989103a`（或其后含 shell-01 的 tip）。本任务 **不** 要求 Trae push；验收通过后由 Grok Bot / Nuradil 决定推仓。

---

## 目的

把产品 UI 从「顶栏 + 单栏内容」（shell-01）**迈向已定 desk-v4**：

**左栏导航（书桌 / 复习 / 书架）· 中栏讲义 · 右栏 Clew**

本 slice 只做 **第一刀可见的 DeskShell 铬件 + 中栏接上 seed 内容 + Clew 面板壳**。不实现完整六段讲义编辑器、完整 FSRS 数学、完整 Clew LLM harness。免疫学 seed 仍是验收语料；产品身份仍是「顾客自带材料」脊柱，不是 demo。

---

## 产品对照（desk-v4 · 本 slice 要对准的）

```
DeskShell
├─ Sidebar（~248）
│  ├─ NavRows：书桌 · 复习 /review [到期 stub] · 书架（现有书库）
│  └─ （可选薄）DueCard stub / 在读书目一行
├─ DocumentPane（自适应）
│  └─ 本 slice：用现有 entities 列表/详情 或 viewer 作 **interim document**
│     （六段讲义 Paper 可占位 TOC，勿假造六段正文）
└─ ClewPane（默认 ~400，可先固定宽；ResizeHandle 可选）
   └─ 本 slice：UI 壳 + stub 对话（本地假回复即可）· 无 LLM harness
```

尺寸参考（可近似，勿死抠像素）：侧栏 **248**，Clew **默认 400**（可拖 360–560 为加分项，非硬门槛）。圆角 8/12；强调色朱红 `#b8432f` / 暗 `#e0705a`。

---

## IN 范围（硬 · 一 Trae 装得下）

### 1. DeskShell 布局铬件

- 新增三栏壳组件（建议名 `DeskShell`），在 **学习主路径** 使用（至少包住进入「书桌」后的主工作区；`/ingest` 可仍单栏）。
- **左 Sidebar**：
  - 导航行对齐 desk-v4：**书桌**（主学习面）· **复习**（链 `/review`）· **书架**（现有 `/` 书库或等价）。
  - 可保留进入 `/entities`、`/study`、`/ingest` 的次级入口，但视觉层级要像书桌侧栏，**不是** 再做一个顶栏 `DeskNav` 复制品占满宽。
  - shell-01 的 `DeskNav` 顶栏：可收进侧栏品牌行，或仅在非 Desk 路由保留——**不要** 三栏里再叠一条满宽顶导航抢垂直空间。
- **中 DocumentPane**：主阅读/学习区。
- **右 ClewPane**：固定或可拖宽占位；空态文案安静（建议问题 stub OK）。

### 2. 中栏接上 seed 免疫学内容（interim document）

- **必须** 在 DeskShell 中栏看到真实 seed 数据（现有 `loadCards` / entities / viewer），不是空白「Coming soon」。
- 推荐路径（择一写清并实现）：
  - **A（推荐）**：书桌默认中栏 = 该书实体卡列表 + 点进详情；或嵌入现有 `/entities` 内容为 DocumentPane children。
  - **B**：中栏 = chapter viewer（`loadAllChapterPages`）+ 侧链实体卡。
- 六段 SectionTOC：**可做静态占位**（六段名 + 当前高亮假状态），**禁止** 编造六段讲义正文或假「核页 6/6」。
- `/study` 自评环 **保留可用**（可从侧栏或中栏进入；不必强行塞进 Clew）。

### 3. ClewPane = UI 壳 + stub chat（无 harness）

- Header：tabs 可简化为「对话」为主；「本轮变更」「复习队列」可灰显/占位。
- Thread：空态给 2–3 条与当前书/章相关的 **建议问题**（静态文案即可）。
- Composer：输入框 + 发送；发送后追加用户气泡 + **本地 stub 助手回复**（固定礼貌句或 echo，**禁止** 接真 API / 假造 cite 页码为已核）。
- 底部常驻一行：「不做诊断 · 回答以教材页码为准」（对齐 desk-ia）。
- **不做**：ProposalCard 真写入、TierPicker 真路由、流式 LLM、CitationChip 假 verified。

### 4. `/review` DueCard stub（可薄）

- 新路由 `/review`：独立页 OK（desk-ia 已定独立路由）。
- 内容：**DueCard / 今日到期 stub**——例如「今天没有到期卡 · FSRS 后续接入」+ 链回书桌 / `/study`。
- **禁止** 实现 ts-fsrs 调度、评分写入、真实队列算法。侧栏「复习」角标可用静态 `0` 或隐藏。

### 5. 保留 shell-01（硬）

- **保留**：`/` 书库、`/ingest` 诚实状态机、`/study` 自评、`config/books.json` 驱动文案、CiteChip 语义、`loadAllChapterPages()`。
- 本任务是 **加 DeskShell 并迁主学习路径**，不是删掉 library/ingest/study 另起炉灶。

### 6. 回归护栏

- **勿改** CiteChip：有 `page` → `p.N`（`verified:false` 仍琥珀）；`page:null` → `p.?`。勿改回 `verified && page`。
- **勿** 把 `loadAllChapterPages()` 换回单章硬编码。
- **勿** `verified: true` 过关。
- **勿** nur-landing / 营销 hero / 双强调色 / bento 仪表盘。

---

## OUT of scope（显式推迟 · 硬）

| 不做 | 原因 |
|------|------|
| 完整六段讲义 Paper（真萃取正文、核页 pill 真状态机） | 内容管线未到；本 slice 用 entities/viewer interim |
| Clew LLM harness / 多模型 / Tier 真额度 / 流式 | 另有 harness 计划 |
| ProposalCard 真写入划线/出卡 + ChangesCard 持久 | desk-ia 后期；stub 可画灰态 |
| 完整 FSRS / ts-fsrs / 真实 Due 队列 / 4 档评分环 | `/review` stub 够 |
| ResizeHandle 像素级 + 账户偏好存宽 | 加分项，非硬门槛 |
| CommandPalette ⌘K、SideAsk、CitationPeek 真实现 | 过大 |
| 营销 / landing / nur-landing | 禁止 |
| ch08+ / 新教材抽取 / 翻历史 verified | 内容冻结 |
| Auth / 支付 / 配额 | 后期 |
| 拆掉 shell-01 library/ingest/study | 已交付脊柱，保留 |

---

## 成功标准

1. **Build**：`pnpm --filter web build` 通过。
2. **三栏可见**：进入书桌主路径后，屏幕呈现 **左导航 · 中文档 · 右 Clew**（对齐 desk-v4 精神；宽度可近似）。
3. **侧栏语义**：至少有 **书桌 / 复习 / 书架**（或等价中文标签）且可导航；复习进 `/review` stub。
4. **中栏有真数据**：seed 免疫学 entities 或 viewer 在 DocumentPane 内可用（能点开卡或页），不是空壳。
5. **Clew 壳**：可输入、可发 stub 回复；空态建议问题；「不做诊断」脚注在；**无** 真 LLM 调用。
6. **`/review` stub**：路由存在；文案诚实（FSRS 未接）；可回书桌或 `/study`。
7. **shell-01 仍在**：`/` 书库、`/ingest`、`/study` 可到达且行为未毁。
8. **审美**：朱红唯一品牌强调色；精炼书桌；无营销 hero；符合 `docs/frontend-aesthetics.md`。
9. **非回归**：CiteChip 不变；`loadAllChapterPages` 仍为 viewer 索引；无 `verified:true`；非 ch01 cite（如 ch07）仍可点进正确页。
10. **明确不做**：无真 FSRS 数学、无 Clew harness、无新章内容、无未经批准的 push。

---

## 建议实现顺序

1. **`DeskShell` 三栏布局** + Sidebar NavRows（书桌 / 复习 / 书架）；收敛或替换满宽 `DeskNav` 在书桌路径上的占用。  
2. **DocumentPane 接入 seed**：entities 列表/详情（或 viewer）作为 interim document。  
3. **ClewPane UI + stub composer/thread**。  
4. **`/review` stub 页** + 侧栏链接。  
5. 自检成功标准；**勿 push**；等 Grok Bot 验收。

---

## 验收时我会查（Grok Bot accept）

- [ ] 书桌路径是否真的是三栏 DeskShell（不是又一个顶栏单栏页）
- [ ] 侧栏是否有书桌 / 复习 / 书架语义；`/review` 是否诚实 stub
- [ ] 中栏是否展示 seed 真卡或真页（可点击）
- [ ] Clew 是否仅 stub（无 API key 调用、无假 verified cite）
- [ ] `/` `/ingest` `/study` 是否仍可用
- [ ] `pnpm --filter web build` PASS
- [ ] CiteChip + `loadAllChapterPages` 非回归；抽查 ch07 cite
- [ ] 无 `verified:true` 游戏；无 nur-landing；无 FSRS/harness/新章
- [ ] 改动文件列表清晰；**未擅自 push**

做完回：改动文件列表 + build 结果 + 书桌三栏截图（或路由说明：书桌主路径、`/review`、Clew stub）；我再验收。

---

## 关键路径（对照）

| 用途 | 路径 |
|------|------|
| 本机仓库 | `/Users/nukeab/projects/Ariadne` |
| box 对照 | `/workspace/Ariadne-push` |
| 视觉稿 | `/workspace/reports/ariadne-desk-ia/desk-v4.html` · `desk-v4.png` |
| IA | `/workspace/reports/ariadne-desk-ia/desk-ia.md` |
| v4 diff | `/workspace/reports/ariadne-desk-ia/desk-v4-diff.md` |
| shell-01 范围 | `/workspace/reports/ariadne-shell-scope-2026-10-17.md` |
| 前置 commit | `989103a`（shell-01） |
| 审美 | `docs/frontend-aesthetics.md` |
| 加载器 | `apps/web/lib/entities.ts` |

---

## Accept checklist（Trae 自勾）

- [ ] DeskShell：左 ~248 / 中自适应 / 右 ~400（近似即可）
- [ ] Nav：书桌 · 复习 · 书架
- [ ] DocumentPane：seed entities 或 viewer 真内容
- [ ] ClewPane：stub chat + 不做诊断脚注
- [ ] `/review` stub（无 FSRS 数学）
- [ ] shell-01 路由保留
- [ ] build PASS
- [ ] CiteChip / loadAllChapterPages / 无 verified:true / 无 nur-landing
- [ ] 未 push

---

## Trae 一句话

> desk-v4-shell-01：在 `989103a` shell-01 上铺 **三栏 DeskShell**（左书桌/复习/书架 · 中栏接 seed entities/viewer interim · 右 Clew UI+stub chat）；`/review` DueCard stub OK；保留 library/ingest/study；勿 FSRS 数学、勿 Clew LLM harness、勿六段假正文、勿 CiteChip/`loadAllChapterPages` 回退、勿 `verified:true`、勿 nur-landing；DeepSeek-V4-Pro；先读 `frontend-aesthetics.md` + desk-v4.html；**勿 push**。
