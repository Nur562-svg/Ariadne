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

test("buildSuggestPatchEnvelope: 无卡 null；有卡对齐 patch.v1 形且 entries 恒空、note 说明不发明原子", () => {
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
  assert.ok(d.note.includes("不发明原子"));
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

test("resolveClewProvider: 单钥一档 + 默认端点/模型 + env 覆盖", () => {
  const z = P.resolveClewProvider({ ZHIPU_API_KEY: "zk" });
  assert.deepEqual(z, { name: "zhipu", baseURL: P.ZHIPU_DEFAULT_BASE_URL, apiKey: "zk", model: P.ZHIPU_DEFAULT_MODEL });
  const m = P.resolveClewProvider({ MINIMAX_API_KEY: "mk", MINIMAX_MODEL: "MiniMax-M3", MINIMAX_BASE_URL: "https://api.minimax.io/v1" });
  assert.deepEqual(m, { name: "minimax", baseURL: "https://api.minimax.io/v1", apiKey: "mk", model: "MiniMax-M3" });
});

test("resolveClewProvider: 双钥默认 Zhipu 优先；CLEW_PROVIDER 显式指定；指定但缺钥 → null 不悄换", () => {
  const both = { ZHIPU_API_KEY: "zk", MINIMAX_API_KEY: "mk" };
  assert.equal(P.resolveClewProvider(both)?.name, "zhipu");
  assert.equal(P.resolveClewProvider({ ...both, CLEW_PROVIDER: "minimax" })?.name, "minimax");
  assert.equal(P.resolveClewProvider({ ...both, CLEW_PROVIDER: "ZHIPU" })?.name, "zhipu");
  assert.equal(P.resolveClewProvider({ ZHIPU_API_KEY: "zk", CLEW_PROVIDER: "minimax" }), null);
});

test("publicProviderInfo: 永不带 apiKey / baseURL", () => {
  const info = P.publicProviderInfo(P.resolveClewProvider({ ZHIPU_API_KEY: "SECRET" }));
  assert.deepEqual(info, { name: "zhipu", model: P.ZHIPU_DEFAULT_MODEL });
  assert.ok(!JSON.stringify(info).includes("SECRET"));
  assert.equal(P.publicProviderInfo(null), null);
});
