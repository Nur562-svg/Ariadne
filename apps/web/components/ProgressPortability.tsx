"use client";

import { useEffect, useRef, useState } from "react";
import {
  exportProgressPayload,
  importProgressPayload,
  parseProgressPayload,
  type ProgressPayload,
} from "@/lib/progress-port";

/** 导出文件名后缀：本地日期 YYYYMMDD。 */
function exportStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

/**
 * 书库「本机进度带走」客户岛（Task 24 C）：导出 / 导入 ariadne.study.v1 + ariadne.heye.v1。
 * 纯客户端文件交换：导出下载 ariadne-progress-YYYYMMDD.json；导入选文件后显式选
 * 「合并（t 较新者胜）」或「替换（整键覆盖）」。非法 JSON / 版本不符 → 琥珀提示、
 * 本机库保持原样（fail-closed）。不宣称云同步、不写 seed、不碰 verified；
 * 入口是书库效用区，不是设置营销页，也不塞进 Clew QueuePanel。
 */
export default function ProgressPortability() {
  /** 本机记录条数（挂载后读一次；导入成功后刷新）。null = 读取中。 */
  const [counts, setCounts] = useState<{ study: number; heye: number } | null>(null);
  /** 已解析待确认的导入（选文件 → 解析通过 → 等用户选 merge/replace）。 */
  const [pending, setPending] = useState<ProgressPayload | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = exportProgressPayload();
    setCounts({ study: Object.keys(p.study).length, heye: Object.keys(p.heye).length });
  }, []);

  function refreshCounts() {
    const p = exportProgressPayload();
    setCounts({ study: Object.keys(p.study).length, heye: Object.keys(p.heye).length });
  }

  function onExport() {
    const payload = exportProgressPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ariadne-progress-${exportStamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ kind: "ok", text: "已导出本机进度 JSON（练/核记录，明文可查）。" });
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // 允许重选同一文件
    if (!f) return;
    let data: unknown;
    try {
      data = JSON.parse(await f.text());
    } catch {
      setPending(null);
      setMsg({ kind: "warn", text: `「${f.name}」不是合法 JSON——未做任何改动，本机进度保持原样。` });
      return;
    }
    const parsed = parseProgressPayload(data);
    if (!parsed.ok) {
      setPending(null);
      setMsg({ kind: "warn", text: `${parsed.error} 本机进度保持原样。` });
      return;
    }
    setMsg(null);
    setPending(parsed.payload);
  }

  function doImport(mode: "merge" | "replace") {
    if (!pending) return;
    const r = importProgressPayload(pending, mode);
    if (!r.ok) {
      setMsg({ kind: "warn", text: `${r.error}` });
      return;
    }
    setPending(null);
    refreshCounts();
    setMsg({
      kind: "ok",
      text:
        mode === "merge"
          ? `已合并导入：现在本机有练 ${r.studyEntries} 条 · 核 ${r.heyeEntries} 条（同键 t 较新者胜）。`
          : `已替换导入：本机现有练 ${r.studyEntries} 条 · 核 ${r.heyeEntries} 条（原记录已覆盖）。`,
    });
  }

  const empty = counts != null && counts.study === 0 && counts.heye === 0;

  return (
    <div className="mt-10 rounded-lg border border-line bg-card px-5 py-4">
      <h2 className="text-sm font-semibold">本机进度带走</h2>
      <p className="mt-1 text-xs leading-6 text-muted">
        练 / 核记录只存在这个浏览器。导出为明文 JSON，换浏览器或清缓存前带走，再导入回来。
        本机文件交换 · 不是云同步 · 与 seed verified 无关。
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {empty ? (
          <span className="text-sm text-muted" aria-disabled="true">
            暂无本机进度可导出
          </span>
        ) : (
          <button
            onClick={onExport}
            disabled={counts == null}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-foreground transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar disabled:opacity-50 motion-reduce:transition-none"
          >
            导出本机进度
            {counts ? (
              <span className="ml-1.5 text-xs text-muted">
                （练 {counts.study} · 核 {counts.heye}）
              </span>
            ) : null}
          </button>
        )}
        <button
          onClick={() => fileRef.current?.click()}
          className="text-sm text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
        >
          导入进度 JSON…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onFileChange}
          aria-label="选择进度 JSON 文件"
        />
      </div>

      {/* 选完文件先解析校验，通过后让用户显式选合并 / 替换（这一步就是确认）。 */}
      {pending ? (
        <div className="mt-3 rounded-md border border-line bg-background px-3 py-2.5">
          <p className="text-xs leading-5 text-foreground/90">
            文件含练 {Object.keys(pending.study).length} 条 · 核 {Object.keys(pending.heye).length} 条记录。
            合并 = 同键 t 较新者胜，本机多出的键保留；替换 = 覆盖本机全部练/核记录。
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <button
              onClick={() => doImport("merge")}
              className="rounded-md bg-cinnabar px-3 py-1.5 text-xs text-white focus-visible:outline-2 focus-visible:outline-cinnabar"
            >
              合并导入
            </button>
            <button
              onClick={() => doImport("replace")}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-status-warn hover:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
            >
              替换导入（覆盖本机{counts ? ` ${counts.study + counts.heye} ` : " "}条）
            </button>
            <button
              onClick={() => setPending(null)}
              className="text-xs text-muted no-underline hover:text-foreground focus-visible:outline-2 focus-visible:outline-cinnabar"
            >
              取消
            </button>
          </div>
        </div>
      ) : null}

      {msg ? (
        <p
          className={`mt-2 text-xs leading-5 ${msg.kind === "warn" ? "text-status-warn" : "text-status-ok"}`}
          role="status"
        >
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
