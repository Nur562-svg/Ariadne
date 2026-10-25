#!/usr/bin/env node
/**
 * T66 C/B 纯函数单测：直接 import apps/web/lib/clew-suggest.ts 与 clew-provider.ts
 * （Node ≥ 23.6 原生剥类型；两文件无 import / 无 fs / 无 env，可脱离 Next 跑）。
 *
 *   pnpm clew-check            # == node --test scripts/clew-suggest-check.mjs
 *
 * 覆盖铁合同可机检的部分：
 *   - 拒 bulk / 作业形（chapters[] / extract / parse / verified / 顶层与 context 内）→ 422
 *   - 缺问 / 空问 / 超长 → 400 / 413；白名单投影丢未知键与非法值
 *   - 页小窗截断报原字数；无小窗时上下文块如实写「没有页面原文小窗」
 *   - 系统提示含「不做医疗诊断」「没有写入权限」；永不出现「写入 seed」类指令
 *   - 带走文本含「未核」+ 脚注；补丁形 schema 对齐 ariadne.atom-draft-patch.v1 且 entries 恒空
 *   - provider：缺钥 null；一档优先序；显式 CLEW_PROVIDER 缺对应钥 → null（不悄换）；
 *     publicProviderInfo 永不带 apiKey
 * 不碰网络、不碰 data/、不写盘。
 */
import test from "node:test";
import assert from "node:assert/strict";

const S = await import("../apps/web/lib/clew-suggest.ts");
const P = await import("../apps/web/lib/clew-provider.ts");
const D = await import("../apps/web/lib/atom-draft.ts");
const U = await import("../apps/web/lib/clew-usage.ts");

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
