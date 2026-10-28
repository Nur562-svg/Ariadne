/**
 * T85 机械抽出：原 lib/clew-answer-audit.ts extract 分区（normChar / normalize / fenceSpans /
 * inSpans / overlaps / isSelfMarked / collect / extractAnswerRefs）整段迁此——页码四类识别 /
 * 围栏跳过 / PAGE_RANGE_MAX 行为零改。isPrintedPage · PAGE_RANGE_MAX · Extracted* 自
 * clew-answer-audit-types import。纯函数；无 fs / 无 process.env / 无 "use client"。
 * 铁合同五条与消费者入口仍在 @/lib/clew-answer-audit（barrel）。
 */

import {
  PAGE_RANGE_MAX,
  isPrintedPage,
  type ExtractedIdRef,
  type ExtractedPageRef,
} from "./clew-answer-audit-types.ts";

/** 全角数字 / 拉丁 / 页码标点 → 半角。一字符对一字符，下标与原文对齐。不改 。！？ */
function normChar(ch: string): string {
  const c = ch.charCodeAt(0);
  if (c >= 0xff10 && c <= 0xff19) return String.fromCharCode(c - 0xff10 + 0x30);
  if (c >= 0xff21 && c <= 0xff3a) return String.fromCharCode(c - 0xff21 + 0x41);
  if (c >= 0xff41 && c <= 0xff5a) return String.fromCharCode(c - 0xff41 + 0x61);
  if (ch === "．") return ".";
  if (ch === "：" || ch === "﹕") return ":";
  if (ch === "－" || ch === "–" || ch === "—" || ch === "~" || ch === "～" || ch === "−") return "-";
  if (ch === "　") return " ";
  return ch;
}

/** 按 UTF-16 码元走，保证下标与原文 String#slice 对齐（全角字符都在 BMP）。 */
function normalize(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) out += normChar(text[i]!);
  return out;
}

/** ``` 围栏（含未闭合、含补丁 ```json）。围栏内的页码 / atom: 归补丁或代码，不进核账。 */
function fenceSpans(s: string): [number, number][] {
  const spans: [number, number][] = [];
  let i = 0;
  while (i < s.length) {
    const start = s.indexOf("```", i);
    if (start < 0) break;
    const end = s.indexOf("```", start + 3);
    if (end < 0) {
      spans.push([start, s.length]);
      break;
    }
    spans.push([start, end + 3]);
    i = end + 3;
  }
  return spans;
}

function inSpans(spans: [number, number][], idx: number): boolean {
  for (const [a, b] of spans) if (idx >= a && idx < b) return true;
  return false;
}

function overlaps(spans: [number, number][], start: number, end: number): boolean {
  for (const [a, b] of spans) if (start < b && end > a) return true;
  return false;
}

const SENT_BREAK = new Set(["\n", "。", "！", "？", "!", "?"]);

/**
 * 自标：同句含「未核验」或「推测」，或页码紧邻的括号里有这两个词
 * （中间只允许空白 / 句号）。不把上一句的括号算到下一处页码上。
 */
function isSelfMarked(norm: string, start: number, end: number): boolean {
  let left = 0;
  for (let i = start - 1; i >= 0; i--) {
    if (SENT_BREAK.has(norm[i]!)) {
      left = i + 1;
      break;
    }
  }
  let right = norm.length;
  for (let i = end; i < norm.length; i++) {
    if (SENT_BREAK.has(norm[i]!)) {
      right = i;
      break;
    }
  }
  const sentence = norm.slice(left, right);
  if (sentence.includes("未核验") || sentence.includes("推测")) return true;
  const before = norm.slice(Math.max(0, start - 24), start);
  const after = norm.slice(end, Math.min(norm.length, end + 24));
  if (/[（(][^）)\n]{0,20}?(?:未核验|推测)[^）)\n]{0,12}[）)]\s*$/.test(before)) return true;
  if (/^[。．.!！?？\s]{0,4}[（(][^）)\n]{0,20}?(?:未核验|推测)/.test(after)) return true;
  return false;
}

function collect(re: RegExp, s: string): RegExpExecArray[] {
  re.lastIndex = 0;
  const out: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    out.push(m);
    if (m[0].length === 0) re.lastIndex++;
  }
  return out;
}

/**
 * 从答文抽出页码与 atom:/entity: id。
 * 页码形：p.N / p. N / P.N / 第N页 / pp.N–M（展开 ≤ PAGE_RANGE_MAX，超出整段 rangeTooWide）。
 * 不读盘、不改 text。
 */
export function extractAnswerRefs(text: string): { pageRefs: ExtractedPageRef[]; idRefs: ExtractedIdRef[] } {
  const pageRefs: ExtractedPageRef[] = [];
  const idRefs: ExtractedIdRef[] = [];
  if (typeof text !== "string" || !text) return { pageRefs, idRefs };
  const norm = normalize(text);
  const fences = fenceSpans(norm);
  const occupied: [number, number][] = [];

  for (const m of collect(/(^|[^\w])(pp\.\s*(\d+)\s*-\s*(\d+))/gi, norm)) {
    const lead = m[1]!.length;
    const rawStart = m.index + lead;
    const rawNorm = m[2]!;
    const rawEnd = rawStart + rawNorm.length;
    if (inSpans(fences, rawStart)) continue;
    const startN = Number(m[3]);
    const endN = Number(m[4]);
    const raw = text.slice(rawStart, rawEnd);
    const selfMarked = isSelfMarked(norm, rawStart, rawEnd);
    const width = endN - startN + 1;
    if (!isPrintedPage(startN) || !isPrintedPage(endN) || endN < startN || width > PAGE_RANGE_MAX) {
      if (isPrintedPage(startN)) {
        pageRefs.push({
          page: startN,
          index: rawStart,
          raw,
          selfMarked,
          rangeTooWide: true,
          ...(isPrintedPage(endN) ? { rangeEnd: endN } : {}),
        });
        occupied.push([rawStart, rawEnd]);
      }
      continue;
    }
    for (let p = startN; p <= endN; p++) {
      pageRefs.push({ page: p, index: rawStart, raw, selfMarked });
    }
    occupied.push([rawStart, rawEnd]);
  }

  for (const m of collect(/(^|[^\w])(p\.\s*(\d+))/gi, norm)) {
    const lead = m[1]!.length;
    const rawStart = m.index + lead;
    const rawEnd = rawStart + m[2]!.length;
    if (inSpans(fences, rawStart) || overlaps(occupied, rawStart, rawEnd)) continue;
    const page = Number(m[3]);
    if (!isPrintedPage(page)) continue;
    pageRefs.push({
      page,
      index: rawStart,
      raw: text.slice(rawStart, rawEnd),
      selfMarked: isSelfMarked(norm, rawStart, rawEnd),
    });
    occupied.push([rawStart, rawEnd]);
  }

  for (const m of collect(/第\s*(\d+)\s*页/g, norm)) {
    const rawStart = m.index;
    const rawEnd = rawStart + m[0].length;
    if (inSpans(fences, rawStart) || overlaps(occupied, rawStart, rawEnd)) continue;
    const page = Number(m[1]);
    if (!isPrintedPage(page)) continue;
    pageRefs.push({
      page,
      index: rawStart,
      raw: text.slice(rawStart, rawEnd),
      selfMarked: isSelfMarked(norm, rawStart, rawEnd),
    });
    occupied.push([rawStart, rawEnd]);
  }

  for (const m of collect(/(^|[^A-Za-z0-9_])((atom|entity):([A-Za-z0-9][A-Za-z0-9_:\-]{0,120}))/gi, norm)) {
    const lead = m[1]!.length;
    const rawStart = m.index + lead;
    const rawEnd = rawStart + m[2]!.length;
    if (inSpans(fences, rawStart)) continue;
    const kind = m[3]!.toLowerCase() === "entity" ? "entity" : "atom";
    const id = m[4]!;
    if (!id) continue;
    idRefs.push({ kind, id, index: rawStart, raw: text.slice(rawStart, rawEnd) });
  }

  return { pageRefs, idRefs };
}
