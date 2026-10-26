#!/usr/bin/env node
/**
 * T66 C/B + T67/T68/T69 纯函数单测：直接 import apps/web/lib/clew-suggest.ts 与
 * clew-provider.ts / clew-usage.ts（Node ≥ 23.6 原生剥类型；文件无 import / 无 fs / 无 env，
 * 可脱离 Next 跑）。
 *
 *   pnpm clew-check            # == node --test scripts/clew-suggest-check.mjs
 *
 * 覆盖铁合同可机检的部分：
 *   - 拒 bulk / 作业形（chapters[] / extract / parse / verified / 顶层与 context 内）→ 422
 *   - 缺问 / 空问 / 超长 → 400 / 413；白名单投影丢未知键与非法值
 *   - 页小窗截断报原字数；无小窗时上下文块如实写「没有页面原文小窗」
 *   - 系统提示含「不做医疗诊断」「没有写入权限」；永不出现「写入 seed」类指令
 *   - 带走文本含「未核」+ 脚注；补丁形 schema 对齐 ariadne.atom-draft-patch.v1
 *   - provider：缺钥 null；一档优先序；显式 CLEW_PROVIDER 缺对应钥 → null（不悄换）；
 *     publicProviderInfo 永不带 apiKey
 *   - T69 A：按档 grounding 策略（fast/reasoning 恒单页 ≤1 页；long-context ≤ LONG_PAGES_MAX
 *     页 / ≤ LONG_TOTAL_CHARS_MAX 字）；selectGroundPages 有序去重 / 当前页优先 / 跨章 cite 不采 /
 *     硬顶 / 缺章空数组
 *   - T69 B·C：extraWindows/ground 上下文块标注（同章有界 · 非全书 · 总字对顶 · 未装页如实报）；
 *     groundPagesOf 平铺
 *   - T69 D：buildSeedBeforeMap 有值/空→null/发明不入；parseSuggestPatchEntries before 只认
 *     seed 导出（模型自报 before 不透传）、发明 target 仍丢弃；splitStructuredPatch 透传
 *   - T69 F：countTodayByTier 分档计数 / 三键恒在 / 脏行丢
 * 不碰网络、不碰 data/、不写盘。
 */
import test from "node:test";
import assert from "node:assert/strict";

const S = await import("../apps/web/lib/clew-suggest.ts");
const P = await import("../apps/web/lib/clew-provider.ts");
const D = await import("../apps/web/lib/atom-draft.ts");
const U = await import("../apps/web/lib/clew-usage.ts");
const A = await import("../apps/web/lib/clew-answer-audit.ts");

// ---------------- parseSuggestBody：拒 bulk / 作业形 ----------------

test("parseSuggestBody: 非对象 → 400 bad_body", () => {
  for (const bad of [null, "x", 1, [], undefined]) {
    const r = S.parseSuggestBody(bad);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.status, 400);
      assert.equal(r.error, "bad_body");
    }
  }
});

test("parseSuggestBody: 缺 / 空 / 超长 question", () => {
  let r = S.parseSuggestBody({});
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error, "missing_question");
  r = S.parseSuggestBody({ question: "   " });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error, "empty_question");
  r = S.parseSuggestBody({ question: "x".repeat(S.QUESTION_MAX_CHARS + 1) });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.status, 413);
    assert.equal(r.error, "question_too_long");
  }
});

test("parseSuggestBody: 顶层作业形键 → 422 bulk_rejected（哪怕空数组）", () => {
  const cases = [
    { question: "q", chapters: [] },
    { question: "q", chapters: ["ch01", "ch03"] },
    { question: "q", pages: [1, 2] },
    { question: "q", questions: ["a", "b"] },
    { question: "q", extract: { chapter: "ch01" } },
    { question: "q", parse: true },
    { question: "q", ingest: {} },
    { question: "q", verified: true },
    { question: "q", patch: [] },
    { question: "q", write: true },
    { question: "q", apply: true },
    { question: "q", entities: [] },
    { question: "q", blocks: [] },
  ];
  for (const body of cases) {
    const r = S.parseSuggestBody(body);
    assert.equal(r.ok, false, JSON.stringify(body));
    if (!r.ok) {
      assert.equal(r.status, 422);
      assert.equal(r.error, "bulk_rejected");
    }
  }
});

test("parseSuggestBody: context 内作业形键同样 422", () => {
  const r = S.parseSuggestBody({ question: "q", context: { book: { id: "b", title: "B" }, chapters: ["ch01"] } });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error, "bulk_rejected");
});

test("parseSuggestBody: 合法单问 → 白名单投影（丢未知键 / 非法值；citePages 去重截 8；surface 白名单）", () => {
  const r = S.parseSuggestBody({
    question: "  这一页讲什么？ ",
    context: {
      book: { id: "immuno", title: "免疫学基础" },
      chapter: { id: "ch01", title: "概述" },
      page: 12,
      citePages: [3, 3, 5, "x", -1, 7, 9, 11, 13, 15, 17, 19],
      visibleEntityName: " 抗原 ",
      card: { id: "antigen", name_zh: "抗原" },
      surface: "desk",
      progressAtoms: [{ cardId: "a", atomId: "b" }],
      somethingElse: 1,
    },
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.question, "这一页讲什么？");
    const c = r.value.context;
    assert.deepEqual(c.book, { id: "immuno", title: "免疫学基础" });
    assert.deepEqual(c.chapter, { id: "ch01", title: "概述" });
    assert.equal(c.page, 12);
    assert.deepEqual(c.citePages, [3, 5, 7, 9, 11, 13, 15, 17]);
    assert.equal(c.visibleEntityName, "抗原");
    assert.deepEqual(c.card, { id: "antigen", name_zh: "抗原" });
    assert.equal(c.surface, "desk");
    assert.equal("progressAtoms" in c, false);
    assert.equal("somethingElse" in c, false);
  }
});

test("sanitizeContext: 非法 page / surface / card 丢弃，不抛", () => {
  const c = S.sanitizeContext({ page: 3.5, surface: "mars", card: { id: "", name_zh: "x" }, pageText: "  " });
  assert.equal("page" in c, false);
  assert.equal("surface" in c, false);
  assert.equal("card" in c, false);
  assert.equal("pageText" in c, false);
  assert.deepEqual(S.sanitizeContext(null), {});
  assert.deepEqual(S.sanitizeContext([1]), {});
});

// ---------------- 截断 ----------------

test("truncatePageText: 短文不动；长文截断并报原字数", () => {
  const short = S.truncatePageText("  a\r\nb  ");
  assert.deepEqual(short, { text: "a\nb", chars: 3, truncated: false });
  const long = S.truncatePageText("字".repeat(S.PAGE_TEXT_MAX_CHARS + 50));
  assert.equal(long.truncated, true);
  assert.equal(long.chars, S.PAGE_TEXT_MAX_CHARS + 50);
  assert.ok(long.text.startsWith("字".repeat(S.PAGE_TEXT_MAX_CHARS)));
  assert.ok(long.text.endsWith("（小窗已截断）"));
});

// ---------------- 系统提示 / 上下文块 ----------------

test("CLEW_SYSTEM_PROMPT: 不做诊断 · 无写入权限 · 页码只引给定 · 永不指示写 seed", () => {
  const p = S.CLEW_SYSTEM_PROMPT;
  assert.ok(p.includes("不做医疗诊断"));
  assert.ok(p.includes("没有写入权限"));
  assert.ok(p.includes("未核验"));
  assert.ok(p.includes("不是核对结论"));
  // 不能出现「请写入 / 写回 / 置 verified:true」之类正向指令（只允许在「不要……」语境里出现 verified）。
  assert.ok(!/请(写入|写回|保存到) ?(seed|entities)/.test(p));
  assert.ok(!/置\s*verified\s*:\s*true/.test(p.replace(/不要[^\n]*verified:true[^\n]*/g, "")));
});

test("buildContextBlock: 无小窗如实说明；有小窗写明来源与截断", () => {
  const noWin = S.buildContextBlock({ book: { id: "b", title: "B" }, page: 4 });
  assert.ok(noWin.includes("《B》"));
  assert.ok(noWin.includes("当前印刷页：p.4"));
  assert.ok(noWin.includes("本次没有页面原文小窗"));
  const win = S.buildContextBlock(
    { book: { id: "b", title: "B" }, chapter: { id: "ch01", title: "C1" }, page: 4, surface: "review" },
    { pageWindow: { page: 4, text: "原文…", chars: 5000, truncated: true, source: "server" } },
  );
  assert.ok(win.includes("【p.4 OCR 小窗 · 服务端自 blocks.json 取 · 原文 5000 字"));
  assert.ok(win.includes("核页工作台"));
  assert.ok(!win.includes("本次没有页面原文小窗"));
  const noBook = S.buildContextBlock({});
  assert.ok(noBook.includes("书：（无"));
});

test("buildContextBlock: 卡摘要优先于裸卡名", () => {
  const withSummary = S.buildContextBlock(
    { card: { id: "ag", name_zh: "抗原" } },
    { cardSummary: { id: "ag", name_zh: "抗原", name_en: "Antigen", one_liner: "能被识别的物质", citePages: [3, 5] } },
  );
  assert.ok(withSummary.includes("当前卡：抗原 / Antigen —— 能被识别的物质（卡 cite p.3、p.5）"));
  const bare = S.buildContextBlock({ card: { id: "ag", name_zh: "抗原" } });
  assert.ok(bare.includes("当前卡：抗原"));
  assert.ok(!bare.includes("Antigen"));
});

test("buildPrompt: system 即铁提示；prompt 含上下文块 + 学生问", () => {
  const { system, prompt } = S.buildPrompt("为什么？", { page: 2 });
  assert.equal(system, S.CLEW_SYSTEM_PROMPT);
  assert.ok(prompt.includes("【书桌上下文"));
  assert.ok(prompt.endsWith("【学生问】\n为什么？"));
});

// ---------------- F：带走 ----------------

test("buildTakeawayText: 含来源 / 未核 / 问答 / 脚注；stub 也如实标", () => {
  const live = S.buildTakeawayText(
    "问A",
    "答B",
    { book: { id: "b", title: "B" }, page: 9 },
    { mode: "live", provider: "zhipu", model: "glm-4.5-flash", pageWindow: { page: 9, chars: 120, truncated: false } },
  );
  assert.ok(live.includes("live · zhipu / glm-4.5-flash · 未核"));
  assert.ok(live.includes("对照小窗：p.9（120 字）"));
  assert.ok(live.includes("问：问A"));
  assert.ok(live.includes("答：答B"));
  assert.ok(live.includes(S.CLEW_HONESTY_FOOTNOTE));
  const stub = S.buildTakeawayText("q", "a", {}, { mode: "stub" });
  assert.ok(stub.includes("stub · 未接模型"));
  assert.ok(stub.includes("对照小窗：无"));
  assert.ok(stub.includes("上下文：书架 / 无书"));
});

test("buildSuggestPatchEnvelope: 无卡 null；有卡对齐 patch.v1 形且不含 verified 翻改（T67 起可非空，见下）", () => {
  assert.equal(S.buildSuggestPatchEnvelope("q", "a", {}, { mode: "live" }), null);
  const d = S.buildSuggestPatchEnvelope(
    "q",
    "a",
    { card: { id: "ag", name_zh: "抗原" }, chapter: { id: "ch01", title: "C" }, page: 3 },
    { mode: "live", provider: "zhipu", model: "m" },
  );
  assert.ok(d);
  assert.equal(d.schema, "ariadne.atom-draft-patch.v1");
  assert.equal(d.cardId, "ag");
  assert.equal(d.chapterId, "ch01");
  assert.deepEqual(d.entries, []);
  assert.ok(d.note.includes("不含 verified 翻改"));
  assert.ok(d.note.includes("对照 p.3"));
  const txt = S.buildSuggestPatchText("q", "a", { card: { id: "ag", name_zh: "抗原" } }, { mode: "stub" });
  assert.ok(txt && JSON.parse(txt).entries.length === 0);
});

test("CLEW_HONESTY_FOOTNOTE: 四要素齐", () => {
  for (const k of ["不做诊断", "回答≠已核", "永不写 seed", "只读"]) {
    assert.ok(S.CLEW_HONESTY_FOOTNOTE.includes(k), k);
  }
});

// ---------------- B：provider ----------------

test("resolveClewProvider: 缺钥 → null；空白钥当缺", () => {
  assert.equal(P.resolveClewProvider({}), null);
  assert.equal(P.resolveClewProvider({ ZHIPU_API_KEY: "   " }), null);
  assert.equal(P.resolveClewProvider({ NEXT_PUBLIC_ZHIPU_API_KEY: "x" }), null);
});

test("resolveClewProvider: 默认档（fast）厂商优先序 + 端点缺省；档模型用 CLEW_FAST_MODEL（T68 语义）", () => {
  const z = P.resolveClewProvider({ ZHIPU_API_KEY: "zk" });
  assert.deepEqual(z, { name: "zhipu", baseURL: P.ZHIPU_DEFAULT_BASE_URL, apiKey: "zk", model: "glm-4.5-flash" });
  const m = P.resolveClewProvider({ MINIMAX_API_KEY: "mk", CLEW_FAST_MODEL: "MiniMax-M3", MINIMAX_BASE_URL: "https://api.minimax.io/v1" });
  assert.deepEqual(m, { name: "minimax", baseURL: "https://api.minimax.io/v1", apiKey: "mk", model: "MiniMax-M3" });
});

test("resolveClewProvider: 双钥默认 Zhipu 优先；CLEW_PROVIDER 显式指定；指定但缺钥 → null 不悄换", () => {
  const both = { ZHIPU_API_KEY: "zk", MINIMAX_API_KEY: "mk" };
  assert.equal(P.resolveClewProvider(both)?.name, "zhipu");
  assert.equal(P.resolveClewProvider({ ...both, CLEW_PROVIDER: "minimax" })?.name, "minimax");
  assert.equal(P.resolveClewProvider({ ZHIPU_API_KEY: "zk", CLEW_PROVIDER: "minimax" }), null);
});

test("publicProviderInfo: 永不带 apiKey / baseURL", () => {
  const info = P.publicProviderInfo(P.resolveClewProvider({ ZHIPU_API_KEY: "SECRET" }));
  assert.deepEqual(info, { name: "zhipu", model: P.ZHIPU_DEFAULT_MODEL });
  assert.ok(!JSON.stringify(info).includes("SECRET"));
  assert.equal(P.publicProviderInfo(null), null);
});

// ---------------- T67 C：流事件（装配不泄钥） ----------------

test("encodeClewStreamEvent: meta/delta/done/error 行都是 NDJSON 一行；meta 只携带公开投影", () => {
  const cfg = P.resolveClewProvider({ ZHIPU_API_KEY: "SECRET-KEY-DO-NOT-LEAK" });
  const info = P.publicProviderInfo(cfg);
  const meta = S.encodeClewStreamEvent({
    type: "meta",
    provider: info.name,
    model: info.model,
    pageWindow: null,
    cardSummary: null,
    incompleteTargets: ["atom:ch01:x:1"],
    readonly: true,
  });
  assert.ok(meta.endsWith("\n") && meta.split("\n").length === 2);
  assert.ok(!meta.includes("SECRET"), "meta 事件不得携带 apiKey");
  const parsed = JSON.parse(meta);
  assert.equal(parsed.type, "meta");
  assert.equal(parsed.provider, "zhipu");
  assert.deepEqual(parsed.incompleteTargets, ["atom:ch01:x:1"]);
  for (const e of [
    { type: "delta", text: "你好" },
    { type: "done", finishReason: "stop", usage: { inputTokens: 10, outputTokens: 5 } },
    { type: "error", message: "上游流中断" },
  ]) {
    const line = S.encodeClewStreamEvent(e);
    assert.ok(line.endsWith("\n"));
    assert.deepEqual(JSON.parse(line), e);
    assert.ok(!line.includes("SECRET"));
  }
});

// ---------------- T67 D：不完备 grounding → 指令块 / target 白名单 ----------------

const G_INC = {
  cardSummary: { id: "ag", name_zh: "抗原", citePages: [3] },
  incomplete: {
    atoms: [
      { id: "ch01:ag:2", emptyPrompt: true, emptyAnswer: false, emptyCiteQuote: true, answer: "既有答案（截断）" },
      { id: "ch01:ag:3", emptyPrompt: false, emptyAnswer: true, emptyAnswer2: undefined, prompt: "既有问（截断）" },
    ],
    fields: [{ index: 0, label: "化学本质" }],
  },
};
const G_NONE = { cardSummary: { id: "ag", name_zh: "抗原", citePages: [3] } };

test("buildPatchInstructionBlock: 无不完备 → 空串（模型不输出围栏）；有 → 含既有 target 与铁规则", () => {
  assert.equal(S.buildPatchInstructionBlock(undefined), "");
  assert.equal(S.buildPatchInstructionBlock(G_NONE), "");
  const blk = S.buildPatchInstructionBlock(G_INC);
  assert.ok(blk.includes("atom:ch01:ag:2"));
  assert.ok(blk.includes("field:0"));
  assert.ok(blk.includes("禁止发明新原子"));
  assert.ok(blk.includes("禁止输出 verified"));
  assert.ok(blk.includes("没有可填的就**不要**输出围栏"));
  // 指令块只引用既有 id，永不出现「写入 seed」正向指令
  assert.ok(!/请(写入|保存到) ?(seed|entities)/.test(blk));
});

test("incompleteTargets: 仅既有 atom:/field: 目标；无 grounding → 空集（全拒）", () => {
  assert.deepEqual(S.incompleteTargets(G_INC), ["atom:ch01:ag:2", "atom:ch01:ag:3", "field:0"]);
  assert.deepEqual(S.incompleteTargets(G_NONE), []);
  assert.deepEqual(S.incompleteTargets(undefined), []);
});

test("buildPrompt: 有不完备 grounding 时 prompt 拼补丁指令块", () => {
  const withInc = S.buildPrompt("q", { card: { id: "ag", name_zh: "抗原" } }, G_INC);
  assert.ok(withInc.prompt.includes("【结构化补丁规则"));
  const without = S.buildPrompt("q", { card: { id: "ag", name_zh: "抗原" } }, G_NONE);
  assert.ok(!without.prompt.includes("【结构化补丁规则"));
});

// ---------------- T67 E：结构化补丁解析校验 ----------------

const ALLOWED = ["atom:ch01:ag:2", "atom:ch01:ag:3", "field:0"];

test("parseSuggestPatchEntries: 合法非空条目通过（target 白名单内）", () => {
  const out = S.parseSuggestPatchEntries(
    [
      { target: "atom:ch01:ag:2", field: "prompt", after: "建议的问法" },
      { target: "field:0", field: "value", after: "建议的值" },
    ],
    ALLOWED,
  );
  assert.equal(out.length, 2);
  assert.deepEqual(out[0], { target: "atom:ch01:ag:2", field: "prompt", before: null, after: "建议的问法" });
  assert.deepEqual(out[1], { target: "field:0", field: "value", before: null, after: "建议的值" });
});

test("parseSuggestPatchEntries: 发明 target / 未知 field / verified 意图 / 空 after 全丢弃", () => {
  const out = S.parseSuggestPatchEntries(
    [
      { target: "atom:ch01:invented:9", field: "prompt", after: "x" }, // 发明 id
      { target: "atom:ch01:ag:2", field: "difficulty", after: "x" }, // 未知 field
      { target: "atom:ch01:ag:2", field: "prompt", after: "  " }, // 空 after
      { target: "atom:ch01:ag:2", field: "prompt", after: "bad", verified: true }, // verified 意图 → 整条丢
      { target: "atom:ch01:ag:2", field: "prompt", after: "bad2", write: true },
      { target: "atom:ch01:ag:2", field: "prompt", after: "ok" }, // 干净条目 → 存活
      "nonsense",
      null,
    ],
    ALLOWED,
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].after, "ok");
  // 白名单为空（无 grounding）→ 全拒
  assert.equal(S.parseSuggestPatchEntries([{ target: "atom:ch01:ag:2", field: "prompt", after: "x" }], []).length, 0);
  assert.equal(S.parseSuggestPatchEntries("not-array", ALLOWED).length, 0);
});

test("parseSuggestPatchEntries: 条数截 PATCH_ENTRIES_MAX；after 截 PATCH_AFTER_MAX_CHARS", () => {
  const many = Array.from({ length: S.PATCH_ENTRIES_MAX + 10 }, (_, i) => ({
    target: "atom:ch01:ag:2",
    field: "prompt",
    after: `第${i}条`,
  }));
  assert.equal(S.parseSuggestPatchEntries(many, ALLOWED).length, S.PATCH_ENTRIES_MAX);
  const long = S.parseSuggestPatchEntries(
    [{ target: "atom:ch01:ag:2", field: "answer", after: "长".repeat(S.PATCH_AFTER_MAX_CHARS + 100) }],
    ALLOWED,
  );
  assert.equal(long[0].after.length, S.PATCH_AFTER_MAX_CHARS);
});

test("splitStructuredPatch: 尾随围栏剥出 entries 与净答案；支持 patch.entries 与顶层 entries 两形", () => {
  const text1 = "答案正文。\n```json\n{\"patch\":{\"entries\":[{\"target\":\"atom:ch01:ag:2\",\"field\":\"prompt\",\"after\":\"问法\"}]}}\n```";
  const r1 = S.splitStructuredPatch(text1, ALLOWED);
  assert.equal(r1.answer, "答案正文。");
  assert.equal(r1.entries.length, 1);
  assert.equal(r1.entries[0].after, "问法");
  const text2 = "答案。\n```json\n{\"entries\":[{\"target\":\"field:0\",\"field\":\"value\",\"after\":\"值\"}]}\n```";
  const r2 = S.splitStructuredPatch(text2, ALLOWED);
  assert.equal(r2.entries.length, 1);
  assert.equal(r2.entries[0].target, "field:0");
  // 无围栏 → 原文 + 空 entries（空卡/无建议诚实 []）
  const r3 = S.splitStructuredPatch("纯文本答案", ALLOWED);
  assert.equal(r3.answer, "纯文本答案");
  assert.deepEqual(r3.entries, []);
  // 坏 JSON 围栏 → 无补丁不抛，答案剥掉围栏
  const r4 = S.splitStructuredPatch("答案。\n```json\n{broken\n```", ALLOWED);
  assert.equal(r4.answer, "答案。");
  assert.deepEqual(r4.entries, []);
  // 围栏里发明 target → 剥掉但 entries 空
  const r5 = S.splitStructuredPatch("答。\n```json\n{\"entries\":[{\"target\":\"atom:zz:9\",\"field\":\"prompt\",\"after\":\"x\"}]}\n```", ALLOWED);
  assert.deepEqual(r5.entries, []);
  // 中段围栏不剥（那是正文代码示例）；只剥尾随
  const mid = "看这个例子：\n```json\n{\"foo\":1}\n```\n然后继续讲。";
  const r6 = S.splitStructuredPatch(mid, ALLOWED);
  assert.equal(r6.answer, mid);
  assert.deepEqual(r6.entries, []);
});

test("buildSuggestPatchEnvelope: 非空 entries 透传且 before 恒 null；无卡仍 null；空 grounding 诚实空", () => {
  assert.equal(S.buildSuggestPatchEnvelope("q", "a", {}, { mode: "live" }), null);
  const entries = [{ target: "atom:ch01:ag:2", field: "prompt", before: null, after: "问法" }];
  const d = S.buildSuggestPatchEnvelope(
    "q",
    "a",
    { card: { id: "ag", name_zh: "抗原" }, chapter: { id: "ch01", title: "C" } },
    { mode: "live", provider: "zhipu", model: "m" },
    entries,
  );
  assert.ok(d);
  assert.deepEqual(d.entries, entries);
  assert.ok(d.note.includes("建议填空 1 条"));
  assert.ok(d.note.includes("不含 verified"));
  const empty = S.buildSuggestPatchEnvelope("q", "a", { card: { id: "ag", name_zh: "抗原" } }, { mode: "stub" }, []);
  assert.deepEqual(empty.entries, []);
  assert.ok(empty.note.includes("entries 为空"));
});

// ---------------- T67 G：parseAtomDraftPatch / validateAtomDraftPatch（整包拒收） ----------------

const CARD = {
  id: "ag",
  atoms: [
    { id: "ch01:ag:1", prompt: "p1", answer: "a1", difficulty: "what" },
    { id: "ch01:ag:2", prompt: "", answer: "a2", difficulty: "what" },
  ],
  fields: [
    { label: "化学本质", value: "" },
    { label: "别名", value: "x" },
  ],
};

test("parseAtomDraftPatch: 合法包通过；非法 JSON/错 schema/坏条目整包拒收", () => {
  const ok = D.parseAtomDraftPatch(
    JSON.stringify({
      schema: "ariadne.atom-draft-patch.v1",
      cardId: "ag",
      chapterId: "ch01",
      note: "Clew 建议",
      entries: [{ target: "atom:ch01:ag:2", field: "prompt", before: null, after: "建议问法" }],
    }),
  );
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.doc.cardId, "ag");
    assert.equal(ok.doc.entries.length, 1);
  }
  for (const bad of [
    "not json",
    JSON.stringify({ schema: "ariadne.atom-draft-port.v1", draft: {} }),
    JSON.stringify({ schema: "ariadne.atom-draft-patch.v1", entries: [] }), // 缺 cardId
    JSON.stringify({ schema: "ariadne.atom-draft-patch.v1", cardId: "ag", entries: "x" }),
    JSON.stringify({ schema: "ariadne.atom-draft-patch.v1", cardId: "ag", entries: [{ target: "t", field: "nope", after: "x" }] }),
    JSON.stringify({ schema: "ariadne.atom-draft-patch.v1", cardId: "ag", entries: [{ target: "t", field: "prompt", after: "" }] }),
    JSON.stringify({ schema: "ariadne.atom-draft-patch.v1", cardId: "ag", entries: [{ target: "t", field: "prompt", after: "x", verified: true }] }),
  ]) {
    const r = D.parseAtomDraftPatch(bad);
    assert.equal(r.ok, false, bad);
    if (!r.ok) assert.ok(r.error.includes("整包拒收") || r.error.includes("拒收"));
  }
});

test("validateAtomDraftPatch: 仅既有 target + field 类型匹配；发明/越界/错配/cardId 不符整包拒", () => {
  const okDoc = { cardId: "ag", entries: [
    { target: "atom:ch01:ag:2", field: "prompt", before: null, after: "x" },
    { target: "field:0", field: "value", before: null, after: "y" },
  ] };
  assert.equal(D.validateAtomDraftPatch(CARD, okDoc), null);
  for (const bad of [
    { cardId: "other", entries: [] }, // cardId 不符
    { cardId: "ag", entries: [{ target: "atom:ch01:invented:9", field: "prompt", before: null, after: "x" }] },
    { cardId: "ag", entries: [{ target: "field:9", field: "value", before: null, after: "x" }] }, // 字段越界
    { cardId: "ag", entries: [{ target: "field:-1", field: "value", before: null, after: "x" }] },
    { cardId: "ag", entries: [{ target: "atom:ch01:ag:2", field: "value", before: null, after: "x" }] }, // atom 配 value
    { cardId: "ag", entries: [{ target: "field:0", field: "prompt", before: null, after: "x" }] }, // field 配 prompt
    { cardId: "ag", entries: [{ target: "weird:1", field: "prompt", before: null, after: "x" }] },
  ]) {
    const err = D.validateAtomDraftPatch(CARD, bad);
    assert.ok(err != null, JSON.stringify(bad));
    assert.ok(err.includes("整包拒收"));
  }
});

// ---------------- T68 A：三档注册表（不串档 / 缺档 null / 不泄钥） ----------------

test("CLEW_TIERS: 三档齐全且 id 稳定（fast|reasoning|long-context）；默认档 = fast", () => {
  assert.deepEqual(
    P.CLEW_TIERS.map((t) => t.id),
    ["fast", "reasoning", "long-context"],
  );
  assert.equal(P.CLEW_DEFAULT_TIER, "fast");
});

test("resolveClewTier: 有钥 → 三档全可用（同钥池），档模型按缺省表；CLEW_<TIER>_MODEL 覆盖（含 LONG 前缀）", () => {
  const env = { ZHIPU_API_KEY: "zk" };
  const fast = P.resolveClewTier(env, "fast");
  const reasoning = P.resolveClewTier(env, "reasoning");
  const long = P.resolveClewTier(env, "long-context");
  assert.equal(fast.model, "glm-4.5-flash");
  assert.equal(reasoning.model, "glm-4.6");
  assert.equal(long.model, "glm-4.6");
  assert.equal(fast.tier, "fast");
  const over = P.resolveClewTier(
    { ZHIPU_API_KEY: "zk", CLEW_REASONING_MODEL: "glm-x", CLEW_LONG_MODEL: "glm-long-x", CLEW_FAST_MODEL: "glm-f" },
    "reasoning",
  );
  assert.equal(over.model, "glm-x");
  assert.equal(P.resolveClewTier({ ZHIPU_API_KEY: "zk", CLEW_LONG_MODEL: "glm-long-x" }, "long-context").model, "glm-long-x");
  assert.equal(P.resolveClewTier({ ZHIPU_API_KEY: "zk", CLEW_FAST_MODEL: "glm-f" }, "fast").model, "glm-f");
});

test("resolveClewTier: 缺钥 → 三档全 null（不串档：不回落、不借另一档名目打）", () => {
  for (const tier of ["fast", "reasoning", "long-context"]) {
    assert.equal(P.resolveClewTier({}, tier), null, tier);
    assert.equal(P.resolveClewTier({ ZHIPU_API_KEY: "  " }, tier), null, tier);
    assert.equal(P.resolveClewTier({ NEXT_PUBLIC_ZHIPU_API_KEY: "x" }, tier), null, tier);
  }
});

test("resolveClewTier: 档厂商选择（CLEW_<TIER>_PROVIDER > CLEW_PROVIDER > 缺省 Zhipu 优先）；指定厂商缺钥 → null 不悄换", () => {
  const env = { ZHIPU_API_KEY: "zk", MINIMAX_API_KEY: "mk" };
  assert.equal(P.resolveClewTier(env, "reasoning").name, "zhipu");
  assert.equal(P.resolveClewTier({ ...env, CLEW_REASONING_PROVIDER: "minimax" }, "reasoning").name, "minimax");
  assert.equal(P.resolveClewTier({ ...env, CLEW_PROVIDER: "minimax" }, "long-context").name, "minimax");
  assert.equal(P.resolveClewTier({ ZHIPU_API_KEY: "zk", CLEW_REASONING_PROVIDER: "minimax" }, "reasoning"), null);
  // 档差异不串：reasoning 指定 minimax 缺钥时，fast 仍可用——但 reasoning 自身绝不回落 fast 的厂商
  assert.equal(P.resolveClewTier({ ZHIPU_API_KEY: "zk", CLEW_REASONING_PROVIDER: "minimax" }, "fast")?.name, "zhipu");
});

test("clewTierSummaries: available 跟随各档；无钥全 unavailable 且 provider/model=null；永不带钥", () => {
  const none = P.clewTierSummaries({});
  assert.equal(none.length, 3);
  assert.ok(none.every((t) => t.available === false && t.provider === null && t.model === null));
  const withKeys = P.clewTierSummaries({ ZHIPU_API_KEY: "SECRET-KEY" });
  assert.ok(withKeys.every((t) => t.available === true && t.provider === "zhipu"));
  assert.ok(!JSON.stringify(withKeys).includes("SECRET-KEY"));
});

test("resolveClewTier: 返回配置不含 tier 之外的多余字段；apiKey 只在服务端内存（publicProviderInfo 无钥）", () => {
  const cfg = P.resolveClewTier({ ZHIPU_API_KEY: "SECRET" }, "reasoning");
  assert.deepEqual(Object.keys(cfg).sort(), ["apiKey", "baseURL", "model", "name", "tier"]);
  const pub = P.publicProviderInfo(cfg ? { name: cfg.name, baseURL: cfg.baseURL, apiKey: cfg.apiKey, model: cfg.model } : null);
  assert.ok(!JSON.stringify(pub).includes("SECRET"));
});

// ---------------- T68 E：本机用量行 schema（不泄钥 / 计数口径） ----------------

test("buildUsageLine: 单行 JSON + \\n；含 ts/tier/provider/model/ok；不带 apiKey / 不带问句原文", () => {
  const line = U.buildUsageLine({ ts: 123, tier: "reasoning", provider: "zhipu", model: "glm-4.6", ok: true, tokens: { input: 10, output: 5 } });
  assert.ok(line.endsWith("\n") && line.split("\n").length === 2);
  const o = JSON.parse(line);
  assert.equal(o.tier, "reasoning");
  assert.equal(o.ok, true);
  assert.deepEqual(o.tokens, { input: 10, output: 5 });
  assert.ok(!line.includes("apiKey") && !line.includes("SECRET"));
  const fail = JSON.parse(U.buildUsageLine({ ts: 1, tier: "fast", provider: "zhipu", model: "m", ok: false, error: "upstream_error" }));
  assert.equal(fail.ok, false);
  assert.equal(fail.error, "upstream_error");
});

test("parseUsageLine/countToday: 脏行丢；只计 ts ≥ 当日 0 点的行（ok 与 fail 都算）", () => {
  const day = U.startOfToday(1_800_000_000_000);
  const lines = [
    U.buildUsageLine({ ts: day + 1000, tier: "fast", provider: "zhipu", model: "m", ok: true }),
    U.buildUsageLine({ ts: day + 2000, tier: "fast", provider: "zhipu", model: "m", ok: false, error: "upstream_error" }),
    U.buildUsageLine({ ts: day - 1000, tier: "fast", provider: "zhipu", model: "m", ok: true }), // 昨日
    "{broken json",
    JSON.stringify({ no: "shape" }),
    "",
  ];
  assert.equal(U.countToday(lines, day), 2);
  assert.equal(U.countToday([], day), 0);
  assert.equal(U.parseUsageLine("{bad"), null);
  assert.equal(U.parseUsageLine(JSON.stringify({ ts: 1, tier: "mars", provider: "x", model: "y", ok: true })), null);
  // roundtrip
  const rt = U.parseUsageLine(U.buildUsageLine({ ts: 5, tier: "long-context", provider: "minimax", model: "m", ok: true }));
  assert.equal(rt.tier, "long-context");
});

// ---------------- T69 A：按档 grounding 策略（fast≤1 页；long≤顶） ----------------

test("groundingPolicyForTier: fast/reasoning 恒 single（1 页 / PAGE_TEXT_MAX_CHARS）；未知档同 single", () => {
  for (const t of ["fast", "reasoning", "mars", "", undefined]) {
    const p = S.groundingPolicyForTier(t);
    assert.deepEqual(p, { mode: "single", maxPages: 1, maxTotalChars: S.PAGE_TEXT_MAX_CHARS }, String(t));
  }
});

test("groundingPolicyForTier: long-context = chapter-bounded 且铁顶不超标（≤5 页 / ≤12000 字）", () => {
  const p = S.groundingPolicyForTier("long-context");
  assert.equal(p.mode, "chapter-bounded");
  assert.equal(p.maxPages, S.LONG_PAGES_MAX);
  assert.equal(p.maxTotalChars, S.LONG_TOTAL_CHARS_MAX);
  assert.ok(p.maxPages <= 5, "LONG_PAGES_MAX 铁顶 ≤5");
  assert.ok(p.maxTotalChars <= 12_000 && p.maxTotalChars >= 4 * S.PAGE_TEXT_MAX_CHARS, "总字顶 ~12000 且至少容 4 满页");
});

test("selectGroundPages: 当前页优先入选 + 升序去重 + 硬顶；cite 须同章（跨章不采）；近邻补齐", () => {
  const chapter = [2, 3, 4, 5, 6, 9, 12];
  // 当前页 4 + cite 页 9（同章）入选；cite 100 跨章不采；近邻 3、5 补齐到 4 页，升序返回。
  const r = S.selectGroundPages({ currentPage: 4, citePages: [100, 9, 4], chapterPages: chapter, maxPages: 4 });
  assert.deepEqual(r, [3, 4, 5, 9]);
  // 硬顶：maxPages 2 → 当前页 + 最近邻（3 距 1、5 距 1 平手取低页）
  const capped = S.selectGroundPages({ currentPage: 4, chapterPages: chapter, maxPages: 2 });
  assert.equal(capped.length, 2);
  assert.ok(capped.includes(4) && capped.includes(3));
  // 剩 1 个空位时：cite 页（请求上下文）优先于服务端近邻补齐
  const tight = S.selectGroundPages({ currentPage: 4, citePages: [9], chapterPages: chapter, maxPages: 2 });
  assert.deepEqual(tight, [4, 9]);
  // 去重：cite 重复当前页 / 重复页只算一次；升序、无重复、不超顶
  const dedup = S.selectGroundPages({ currentPage: 4, citePages: [4, 4, 5], chapterPages: chapter, maxPages: 5 });
  assert.deepEqual(dedup, [2, 3, 4, 5, 6]);
  assert.equal(new Set(dedup).size, dedup.length);
  assert.ok(dedup.length <= 5);
});

test("selectGroundPages: 缺章（chapterPages 空）/ 非法页 / maxPages≤0 → 空数组（诚实降级，不编页）", () => {
  assert.deepEqual(S.selectGroundPages({ currentPage: 4, chapterPages: [], maxPages: 5 }), []);
  assert.deepEqual(S.selectGroundPages({ currentPage: 4, chapterPages: [0, -1, 3.5, "x"], maxPages: 5 }), []);
  assert.deepEqual(S.selectGroundPages({ currentPage: 4, chapterPages: [3, 4, 5], maxPages: 0 }), []);
  // 当前页不在章内 → 不采当前页，锚到最低页近邻补齐
  const ghost = S.selectGroundPages({ currentPage: 99, chapterPages: [3, 4, 5], maxPages: 2 });
  assert.deepEqual(ghost, [3, 4]);
});

// ---------------- T69 B·C：extraWindows / ground 上下文块标注 + 平铺 ----------------

const G_MULTI = {
  pageWindow: { page: 4, text: "当前页原文…", chars: 800, truncated: false, source: "server" },
  extraWindows: [
    { page: 3, text: "p3 原文…", chars: 700, truncated: false, source: "server" },
    { page: 5, text: "p5 原文…", chars: 900, truncated: true, source: "server" },
  ],
  ground: { mode: "chapter-bounded", pages: [3, 4, 5], totalChars: 2400, maxPages: 5, maxTotalChars: 12_000, pagesOmitted: 1 },
};

test("buildContextBlock: 多页接地标注「同章有界 · 非全书」+ 页清单 + 总字对顶 + 未装页如实报数", () => {
  const blk = S.buildContextBlock(
    { book: { id: "b", title: "B" }, chapter: { id: "ch01", title: "C1" }, page: 4 },
    G_MULTI,
  );
  assert.ok(blk.includes("【p.4 OCR 小窗 · 服务端自 blocks.json 取 · 800 字】"));
  assert.ok(blk.includes("同章有界多页接地 · 非全书 · 页 p.3、p.4、p.5 · 共 2400 字 / 顶 12000 字"));
  assert.ok(blk.includes("另有 1 页因总字顶未装"));
  assert.ok(blk.includes("【p.3 OCR 小窗"));
  assert.ok(blk.includes("【p.5 OCR 小窗 · 服务端自 blocks.json 取 · 原文 900 字"));
  // fast/reasoning（无 extraWindows）不出现该标注——单页行为与 tip 一致
  const single = S.buildContextBlock(
    { page: 4 },
    { pageWindow: { page: 4, text: "原文…", chars: 500, truncated: false, source: "server" } },
  );
  assert.ok(!single.includes("同章有界"));
});

test("groundPagesOf: ground.pages 平铺；单页回 [page]；无窗空数组", () => {
  assert.deepEqual(S.groundPagesOf(G_MULTI), [3, 4, 5]);
  assert.deepEqual(S.groundPagesOf({ pageWindow: { page: 7, text: "t", chars: 1, truncated: false, source: "client" } }), [7]);
  assert.deepEqual(S.groundPagesOf({}), []);
  assert.deepEqual(S.groundPagesOf(undefined), []);
});

// ---------------- T69 D：补丁 before 从 seed 只读对齐 ----------------

const SEED_CARD = {
  atoms: [
    { id: "ch01:ag:2", prompt: "", answer: "既有答案", cite: { quote: "既有引文" } },
    { id: "ch01:ag:3", prompt: "既有问法", answer: "", cite: undefined },
  ],
  fields: [
    { label: "化学本质", value: "" },
    { label: "别名", value: "既有值" },
  ],
};
const ALLOWED_69 = ["atom:ch01:ag:2", "atom:ch01:ag:3", "field:0", "field:1"];

test("buildSeedBeforeMap: 有值导出 / 空→null / 发明与越界不入 / citeQuote 取 cite.quote", () => {
  const m = S.buildSeedBeforeMap(SEED_CARD, [...ALLOWED_69, "atom:ch01:invented:9", "field:9", "weird:1"]);
  assert.deepEqual(m["atom:ch01:ag:2"], { prompt: null, answer: "既有答案", citeQuote: "既有引文" });
  assert.deepEqual(m["atom:ch01:ag:3"], { prompt: "既有问法", answer: null, citeQuote: null });
  assert.deepEqual(m["field:0"], { value: null });
  assert.deepEqual(m["field:1"], { value: "既有值" });
  assert.equal("atom:ch01:invented:9" in m, false, "发明 target 不入 map");
  assert.equal("field:9" in m, false, "越界下标不入 map");
  assert.equal("weird:1" in m, false);
  assert.deepEqual(S.buildSeedBeforeMap(undefined, ALLOWED_69), {});
  assert.deepEqual(S.buildSeedBeforeMap(null, ALLOWED_69), {});
  // 超长截断 SEED_BEFORE_MAX_CHARS
  const long = S.buildSeedBeforeMap(
    { atoms: [{ id: "a", prompt: "长".repeat(S.SEED_BEFORE_MAX_CHARS + 50) }] },
    ["atom:a"],
  );
  assert.equal(long["atom:a"].prompt.length, S.SEED_BEFORE_MAX_CHARS);
});

test("parseSuggestPatchEntries: before 只认 seed 导出（有值填 / 空 null / 查不到 null）；模型自报 before 不透传", () => {
  const before = S.buildSeedBeforeMap(SEED_CARD, ALLOWED_69);
  const out = S.parseSuggestPatchEntries(
    [
      { target: "atom:ch01:ag:2", field: "prompt", after: "建议问法" }, // 空 seed → null
      { target: "atom:ch01:ag:2", field: "answer", after: "改既有答案" }, // 有值 → seed 现值
      { target: "field:1", field: "value", after: "改既有值" },
      { target: "atom:ch01:ag:3", field: "answer", before: "模型瞎报的 before", after: "x" }, // 自报 before 不透传
      { target: "atom:ch01:invented:9", field: "prompt", after: "y" }, // 发明 → 整条丢弃
    ],
    ALLOWED_69,
    before,
  );
  assert.equal(out.length, 4);
  assert.deepEqual(out[0], { target: "atom:ch01:ag:2", field: "prompt", before: null, after: "建议问法" });
  assert.equal(out[1].before, "既有答案");
  assert.equal(out[2].before, "既有值");
  assert.deepEqual(out[3], { target: "atom:ch01:ag:3", field: "answer", before: null, after: "x" });
  // 无 map（旧调用形）→ 恒 null（向后兼容）
  const legacy = S.parseSuggestPatchEntries([{ target: "atom:ch01:ag:2", field: "answer", after: "z" }], ALLOWED_69);
  assert.equal(legacy[0].before, null);
});

test("splitStructuredPatch: 尾随围栏 entries 的 before 从 seed map 回填", () => {
  const before = S.buildSeedBeforeMap(SEED_CARD, ALLOWED_69);
  const text =
    "答案。\n```json\n{\"entries\":[" +
    '{"target":"atom:ch01:ag:2","field":"answer","after":"新答案"},' +
    '{"target":"field:0","field":"value","after":"新值"}]}\n```';
  const r = S.splitStructuredPatch(text, ALLOWED_69, before);
  assert.equal(r.entries.length, 2);
  assert.equal(r.entries[0].before, "既有答案");
  assert.deepEqual(r.entries[1], { target: "field:0", field: "value", before: null, after: "新值" });
  // 无 map 仍 null（T67 兼容）
  const r2 = S.splitStructuredPatch(text, ALLOWED_69);
  assert.equal(r2.entries[0].before, null);
});

test("buildSuggestPatchEnvelope: entries 非空时 note 写明 before=当前卡 seed 现值", () => {
  const entries = [
    { target: "atom:ch01:ag:2", field: "answer", before: "既有答案", after: "新答案" },
  ];
  const d = S.buildSuggestPatchEnvelope(
    "q", "a",
    { card: { id: "ag", name_zh: "抗原" } },
    { mode: "live", provider: "zhipu", model: "m" },
    entries,
  );
  assert.ok(d.note.includes("before=当前卡 seed 现值"));
  assert.ok(!d.note.includes("before=null"));
  assert.deepEqual(d.entries, entries);
});

test("buildTakeawayText: 多页接地时对照行标同章有界 · 非全书", () => {
  const t = S.buildTakeawayText(
    "q", "a",
    { book: { id: "b", title: "B" }, page: 4 },
    { mode: "live", provider: "zhipu", groundPages: [3, 4, 5] },
  );
  assert.ok(t.includes("对照小窗：p.3、p.4、p.5（同章有界 · 非全书）"));
});

// ---------------- T69 F：用量按档（纯计数） ----------------

test("countTodayByTier: 分档计数 / 三键恒在 / 脏行丢 / 昨日不计", () => {
  const day = U.startOfToday(1_800_000_000_000);
  const lines = [
    U.buildUsageLine({ ts: day + 1000, tier: "fast", provider: "zhipu", model: "m", ok: true }),
    U.buildUsageLine({ ts: day + 2000, tier: "fast", provider: "zhipu", model: "m", ok: false, error: "upstream_error" }),
    U.buildUsageLine({ ts: day + 3000, tier: "reasoning", provider: "zhipu", model: "m", ok: true }),
    U.buildUsageLine({ ts: day + 4000, tier: "long-context", provider: "minimax", model: "m", ok: true }),
    U.buildUsageLine({ ts: day + 5000, tier: "long-context", provider: "minimax", model: "m", ok: true }),
    U.buildUsageLine({ ts: day - 1000, tier: "fast", provider: "zhipu", model: "m", ok: true }), // 昨日
    "{broken",
  ];
  const by = U.countTodayByTier(lines, day);
  assert.deepEqual(by, { fast: 2, reasoning: 1, "long-context": 2 });
  // 总分 = 各档之和 = countToday 同口径
  assert.equal(by.fast + by.reasoning + by["long-context"], U.countToday(lines, day));
  // 空 / 全脏 → 三键 0
  assert.deepEqual(U.countTodayByTier([], day), { fast: 0, reasoning: 0, "long-context": 0 });
  assert.deepEqual(U.countTodayByTier(["nope", ""], day), { fast: 0, reasoning: 0, "long-context": 0 });
});

// ---------------- T69 C：流 meta 携带 groundPages / seedBefore（无钥） ----------------

test("encodeClewStreamEvent: meta 带 groundPages/seedBefore 仍一行 NDJSON 且不泄钥", () => {
  const seedBefore = S.buildSeedBeforeMap(SEED_CARD, ALLOWED_69);
  const meta = S.encodeClewStreamEvent({
    type: "meta",
    tier: "long-context",
    provider: "zhipu",
    model: "glm-4.6",
    pageWindow: { page: 4, chars: 800, truncated: false, source: "server" },
    groundPages: [3, 4, 5],
    cardSummary: { id: "ag", name_zh: "抗原" },
    incompleteTargets: ALLOWED_69,
    seedBefore,
    readonly: true,
  });
  assert.ok(meta.endsWith("\n"));
  const parsed = JSON.parse(meta);
  assert.deepEqual(parsed.groundPages, [3, 4, 5]);
  assert.deepEqual(parsed.seedBefore["field:1"], { value: "既有值" });
  assert.ok(!meta.includes("apiKey"));
  // fast 档 meta：groundPages 单页、seedBefore 可 null（可选键）
  const fastMeta = S.encodeClewStreamEvent({
    type: "meta",
    tier: "fast",
    provider: "zhipu",
    model: "glm-4.5-flash",
    pageWindow: null,
    groundPages: [],
    cardSummary: null,
    incompleteTargets: [],
    seedBefore: null,
    readonly: true,
  });
  assert.deepEqual(JSON.parse(fastMeta).groundPages, []);
});

// ---------------- T70 A–F：答面核账（纯函数）+ 全超顶 omitted + 用量可选键 + 旧事件形 ----------------

const BASIS_WIN = A.buildAuditBasis({
  groundPages: [3, 4],
  contextPage: 4,
  citePages: [9],
  cardCitePages: [10],
  atomIds: ["ch01:immunity:1"],
  entityIds: ["immunity"],
});

test("extractAnswerRefs: p.N / p. N / P.N / 第N页", () => {
  const ex = A.extractAnswerRefs("见 p.3、p. 4、P.5，还有第6页。");
  assert.deepEqual(
    ex.pageRefs.map((p) => p.page),
    [3, 4, 5, 6],
  );
  assert.equal(ex.pageRefs[1].raw, "p. 4");
  assert.equal(ex.pageRefs[2].raw, "P.5");
  assert.equal(ex.pageRefs[3].raw, "第6页");
  assert.equal(ex.idRefs.length, 0);
});

test("extractAnswerRefs: 全角数字与标点归一（ｐ．１２ / 第３页 / ｐｐ．１－２）", () => {
  const ex = A.extractAnswerRefs("见ｐ．１２与第３页，区间ｐｐ．１－２。");
  assert.deepEqual(
    ex.pageRefs.map((p) => p.page),
    [1, 2, 12, 3],
  );
  // raw 仍是原字符，不是归一层
  assert.ok(ex.pageRefs.some((p) => p.raw.includes("ｐ")));
  assert.ok(ex.pageRefs.some((p) => p.raw === "第３页"));
});

test("extractAnswerRefs: pp.N–M 展开到 ≤20（含端点、en dash）；恰好 20 页展开", () => {
  const dash = A.extractAnswerRefs("范围 pp.3–5。");
  assert.deepEqual(
    dash.pageRefs.map((p) => p.page),
    [3, 4, 5],
  );
  assert.ok(dash.pageRefs.every((p) => p.raw === "pp.3–5" && p.rangeTooWide !== true));
  const wide20 = A.extractAnswerRefs("pp.1-20");
  assert.equal(wide20.pageRefs.length, 20);
  assert.equal(wide20.pageRefs[0].page, 1);
  assert.equal(wide20.pageRefs[19].page, 20);
  assert.ok(wide20.pageRefs.every((p) => !p.rangeTooWide));
});

test("extractAnswerRefs: 区间超过 20 页整段 rangeTooWide，不展开成 21 条", () => {
  const ex = A.extractAnswerRefs("太宽 pp.1-21 结束");
  assert.equal(ex.pageRefs.length, 1);
  assert.equal(ex.pageRefs[0].rangeTooWide, true);
  assert.equal(ex.pageRefs[0].page, 1);
  assert.equal(ex.pageRefs[0].rangeEnd, 21);
  assert.equal(ex.pageRefs[0].raw, "pp.1-21");
  // 终点小于起点同样不展开
  const rev = A.extractAnswerRefs("pp.8-3");
  assert.equal(rev.pageRefs.length, 1);
  assert.equal(rev.pageRefs[0].rangeTooWide, true);
});

test("extractAnswerRefs: 代码围栏与补丁围栏内的页码 / atom: 跳过", () => {
  const text = "窗外 p.99。\n```\np.3 atom:ch01:immunity:1\n```\n正文 atom:ch01:immunity:1 与 p.4\n```json\n{\"target\":\"atom:ch01:other:9\"}\n```";
  const ex = A.extractAnswerRefs(text);
  assert.deepEqual(
    ex.pageRefs.map((p) => p.page),
    [99, 4],
  );
  assert.deepEqual(
    ex.idRefs.map((r) => r.id),
    ["ch01:immunity:1"],
  );
  assert.ok(!ex.idRefs.some((r) => r.id === "ch01:other:9"));
});

test("extractAnswerRefs: 自标——同句「未核验」「推测」或紧邻括号；下一句不算", () => {
  const ex = A.extractAnswerRefs("机制见 p.12（未核验）。推测在第8页。见 p.9。未核验写在下一句。");
  const byPage = Object.fromEntries(ex.pageRefs.map((p) => [p.page, p.selfMarked]));
  assert.equal(byPage[12], true);
  assert.equal(byPage[8], true);
  assert.equal(byPage[9], false);
});

test("auditClewAnswer: 四类优先序（窗 > 上下文/卡 cite > 自标 > 越窗未标）", () => {
  const text = "p.3 在窗。p.9 在请求上下文。p.10 是卡 cite。p.11（未核验）。p.12 越窗。";
  const a = A.auditClewAnswer(text, BASIS_WIN);
  const cls = Object.fromEntries(a.refs.filter((r) => r.kind === "page").map((r) => [r.page, r.class]));
  assert.equal(cls[3], "grounded");
  assert.equal(cls[9], "context");
  assert.equal(cls[10], "context");
  assert.equal(cls[11], "self_marked");
  assert.equal(cls[12], "unmarked_out");
  assert.equal(a.counts.grounded, 1);
  assert.equal(a.counts.context, 2);
  assert.equal(a.counts.self_marked, 1);
  assert.equal(a.counts.unmarked_out, 1);
  assert.equal(a.clean, false);
  assert.equal(a.version, "clew-answer-audit.v1");
  // 在窗内即使写了未核验，仍算 grounded（自标只对越窗生效）
  const inside = A.auditClewAnswer("p.3（未核验）", BASIS_WIN);
  assert.equal(inside.refs[0].class, "grounded");
  assert.equal(inside.clean, true);
});

test("auditClewAnswer: unknown atom 精确匹配；相近 id 不模糊并到已知 id；entity 同理", () => {
  const text = "atom:ch01:immunity:1 已知。atom:ch01:immunity:2 不是。atom:immunity 不是原子。entity:immunity 已知。entity:immunit 差一字。";
  const a = A.auditClewAnswer(text, BASIS_WIN);
  const ids = a.refs.filter((r) => r.kind !== "page");
  const byRaw = Object.fromEntries(ids.map((r) => [r.raw, r.class]));
  assert.equal(byRaw["atom:ch01:immunity:1"], "known");
  assert.equal(byRaw["atom:ch01:immunity:2"], "unknown");
  assert.equal(byRaw["atom:immunity"], "unknown");
  assert.equal(byRaw["entity:immunity"], "known");
  assert.equal(byRaw["entity:immunit"], "unknown");
  assert.equal(a.counts.known, 2);
  assert.equal(a.counts.unknown, 3);
  assert.equal(a.clean, false);
});

test("auditClewAnswer: 去重按 (kind,值) 保留首个 index", () => {
  const text = "先 p.12，后又 p.12。atom:nope 与 atom:nope。";
  const a = A.auditClewAnswer(text, BASIS_WIN);
  const pages = a.refs.filter((r) => r.kind === "page" && r.page === 12);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].index, text.indexOf("p.12"));
  const atoms = a.refs.filter((r) => r.kind === "atom" && r.id === "nope");
  assert.equal(atoms.length, 1);
  assert.equal(atoms[0].index, text.indexOf("atom:nope"));
  assert.equal(a.counts.unmarked_out, 1);
  assert.equal(a.counts.unknown, 1);
});

test("auditClewAnswer: 过宽区间不因起点在窗内被算成 grounded", () => {
  const a = A.auditClewAnswer("整章 pp.3-30。", BASIS_WIN);
  assert.equal(a.counts.range_too_wide, 1);
  assert.equal(a.counts.grounded, 0);
  assert.equal(a.counts.unmarked_out, 1);
  assert.equal(a.clean, false);
  const marked = A.auditClewAnswer("（未核验）pp.3-30。", BASIS_WIN);
  assert.equal(marked.counts.self_marked, 1);
  assert.equal(marked.counts.unmarked_out, 0);
  assert.equal(marked.counts.range_too_wide, 1);
});

test("safeAuditClewAnswer: basis 抛错 → audit_unavailable，不是全绿", () => {
  const boom = {
    groundPages: {
      [Symbol.iterator]() {
        throw new Error("boom");
      },
    },
    contextPages: [],
    cardCitePages: [],
    knownAtomIds: [],
    knownEntityIds: [],
  };
  const r = A.safeAuditClewAnswer("p.3 全对", boom);
  assert.deepEqual(r, { error: "audit_unavailable" });
  assert.equal(A.isAuditUnavailable(r), true);
  assert.equal(A.formatAuditTakeawayLine(r), "核账：不可用");
});

test("coerceClewAnswerAudit: 坏形 / 错版本 → 不可用；合法形原样通过", () => {
  assert.deepEqual(A.coerceClewAnswerAudit(undefined), { error: "audit_unavailable" });
  assert.deepEqual(A.coerceClewAnswerAudit({ clean: true }), { error: "audit_unavailable" });
  assert.deepEqual(A.coerceClewAnswerAudit({ error: "audit_unavailable" }), { error: "audit_unavailable" });
  const ok = A.auditClewAnswer("没有页码", BASIS_WIN);
  assert.equal(A.coerceClewAnswerAudit(ok).clean, true);
});

test("segmentAnswerRefs: 拼接等于原文（不改字符）；越窗不可点；窗内可点", () => {
  const text = "见 p.3 与 p.12。";
  const audit = A.auditClewAnswer(text, BASIS_WIN);
  const segs = A.segmentAnswerRefs(text, audit);
  assert.equal(segs.map((s) => s.text).join(""), text);
  const p3 = segs.find((s) => s.type === "page" && s.page === 3);
  const p12 = segs.find((s) => s.type === "page" && s.page === 12);
  assert.equal(p3.linkable, true);
  assert.equal(p3.class, "grounded");
  assert.equal(p12.linkable, false);
  assert.equal(p12.class, "unmarked_out");
  assert.equal(p12.text, "p.12");
});

test("relatedCardAtoms: cite 页落在接地∪上下文才列入，邻页不算，至多 6 条", () => {
  const audit = A.auditClewAnswer("p.3 与 p.9 与 p.12", BASIS_WIN);
  const atoms = [
    { id: "a1", citePage: 3 },
    { id: "a2", citePage: 9 },
    { id: "a3", citePage: 12 }, // 越窗未标，不列
    { id: "a4", citePage: 5 }, // 邻页，不模糊
    { id: "a1", citePage: 3 }, // 重复 id
    ...Array.from({ length: 8 }, (_, i) => ({ id: `x${i}`, citePage: 3 })),
  ];
  const rel = A.relatedCardAtoms(atoms, audit, 6);
  assert.deepEqual(
    rel.map((a) => a.id),
    ["a1", "a2", "x0", "x1", "x2", "x3"],
  );
  assert.ok(!rel.some((a) => a.id === "a3" || a.id === "a4"));
  assert.equal(A.existingStudyHrefForCard(undefined, "b"), null);
  assert.equal(A.existingStudyHrefForCard("immunity", "immunology-3rd"), "/study?card=immunity&book=immunology-3rd&mode=all");
  assert.equal(A.clewCitedPageHref("immunology-3rd", 3), "/desk?book=immunology-3rd&page=3");
  assert.equal(A.clewCitedPageHref(undefined, 3), "/viewer/3");
});

test("assembleChapterGround: extras=0 且 omitted>0 仍设 ground；都没有则 undefined", () => {
  const onlyOmitted = S.assembleChapterGround({
    currentPage: 4,
    extraPages: [],
    omitted: 3,
    totalChars: 3000,
    maxPages: 5,
    maxTotalChars: 12000,
  });
  assert.deepEqual(onlyOmitted, {
    mode: "chapter-bounded",
    pages: [4],
    totalChars: 3000,
    maxPages: 5,
    maxTotalChars: 12000,
    pagesOmitted: 3,
  });
  assert.equal(
    S.assembleChapterGround({
      currentPage: 4,
      extraPages: [],
      omitted: 0,
      totalChars: 100,
      maxPages: 5,
      maxTotalChars: 12000,
    }),
    undefined,
  );
  const mixed = S.assembleChapterGround({
    currentPage: 4,
    extraPages: [3, 5],
    omitted: 1,
    totalChars: 2400,
    maxPages: 5,
    maxTotalChars: 12000,
  });
  assert.deepEqual(mixed.pages, [3, 4, 5]);
  assert.equal(mixed.pagesOmitted, 1);
});

test("buildContextBlock: 全超顶 omitted 仍写「另有 k 页因总字顶未装」；单页小窗不写", () => {
  const ground = S.assembleChapterGround({
    currentPage: 4,
    extraPages: [],
    omitted: 2,
    totalChars: 3000,
    maxPages: 5,
    maxTotalChars: 12000,
  });
  const blk = S.buildContextBlock(
    { page: 4 },
    { pageWindow: { page: 4, text: "原文", chars: 3000, truncated: true, source: "server" }, ground },
  );
  assert.ok(blk.includes("另有 2 页因总字顶未装"));
  assert.ok(blk.includes("本次装入 p.4"));
  assert.ok(!blk.includes("【p.5"));
  const single = S.buildContextBlock(
    { page: 4 },
    { pageWindow: { page: 4, text: "原文", chars: 500, truncated: false, source: "server" } },
  );
  assert.ok(!single.includes("另有"));
  assert.ok(!single.includes("同章有界"));
});

test("buildTakeawayText: 有审计写核账行；无审计写「核账：不可用」；答文不被改写", () => {
  const audit = A.auditClewAnswer("见 p.3。越窗 p.99。atom:missing", BASIS_WIN);
  const answer = "见 p.3。越窗 p.99。atom:missing";
  const t = S.buildTakeawayText("q", answer, { page: 4 }, { mode: "live", provider: "zhipu", audit });
  assert.ok(t.includes("核账：接地 1 · 越窗未标 1 · 无此原子 1（≠ 内容已核）"));
  assert.ok(t.includes(`答：${answer}`));
  const none = S.buildTakeawayText("q", answer, {}, { mode: "stub" });
  assert.ok(none.includes("核账：不可用"));
  assert.ok(none.includes(`答：${answer}`));
  // 补丁 envelope 不夹核账、schema 不动
  const env = S.buildSuggestPatchEnvelope("q", answer, { card: { id: "immunity", name_zh: "免疫" } }, { mode: "stub" });
  assert.equal(env.schema, "ariadne.atom-draft-patch.v1");
  assert.ok(!env.note.includes("核账"));
});

test("parseUsageLine: auditUnmarkedOut 可选；旧行无该键仍解析；today 分档计数不看它", () => {
  const day = U.startOfToday(1_800_000_000_000);
  const oldLine = U.buildUsageLine({ ts: day + 10, tier: "fast", provider: "zhipu", model: "m", ok: true });
  assert.equal(JSON.parse(oldLine).auditUnmarkedOut, undefined);
  const parsedOld = U.parseUsageLine(oldLine);
  assert.equal(parsedOld.auditUnmarkedOut, undefined);
  assert.equal(parsedOld.tier, "fast");
  const neu = U.buildUsageLine({
    ts: day + 20,
    tier: "long-context",
    provider: "zhipu",
    model: "m",
    ok: true,
    auditUnmarkedOut: 2,
  });
  assert.equal(U.parseUsageLine(neu).auditUnmarkedOut, 2);
  // 脏的 audit 字段不拒整行
  const dirty = JSON.stringify({ ts: day + 30, tier: "reasoning", provider: "z", model: "m", ok: true, auditUnmarkedOut: "x" });
  const d = U.parseUsageLine(dirty);
  assert.equal(d.tier, "reasoning");
  assert.equal(d.auditUnmarkedOut, undefined);
  const by = U.countTodayByTier([oldLine, neu, dirty], day);
  assert.deepEqual(by, { fast: 1, reasoning: 1, "long-context": 1 });
});

test("encodeClewStreamEvent: 旧 done 无 meta；新 done 带 meta.audit；meta 仍不泄钥", () => {
  const oldDone = S.encodeClewStreamEvent({ type: "done", finishReason: "stop" });
  assert.equal(JSON.parse(oldDone).meta, undefined);
  assert.ok(oldDone.endsWith("\n"));
  const audit = { error: "audit_unavailable" };
  const neu = S.encodeClewStreamEvent({ type: "done", meta: { audit } });
  assert.deepEqual(JSON.parse(neu).meta.audit, audit);
  const withCounts = A.auditClewAnswer("p.4", BASIS_WIN);
  const okDone = S.encodeClewStreamEvent({ type: "done", meta: { audit: withCounts } });
  assert.equal(JSON.parse(okDone).meta.audit.version, "clew-answer-audit.v1");
  assert.ok(!okDone.includes("apiKey"));
  assert.ok(!okDone.includes("verified"));
});
