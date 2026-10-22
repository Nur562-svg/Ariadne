"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import CopyCommand from "@/components/CopyCommand";

type ChapterRow = { id: string; title: string; physicalStart: string; physicalEnd: string };

const EMPTY_ROW: ChapterRow = { id: "", title: "", physicalStart: "", physicalEnd: "" };

/**
 * 上传表单（对应 POST /api/ingest）：
 * 只落盘 + 建档（状态 uploaded）。parse/extract 由本机 CLI 完成，本表单不做、也不假装做。
 */
export default function IngestUpload() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState("");
  const [pageOffset, setPageOffset] = useState("16");
  const [rows, setRows] = useState<ChapterRow[]>([{ ...EMPTY_ROW }]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; next: string } | null>(null);

  function setRow(i: number, patch: Partial<ChapterRow>) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, { ...EMPTY_ROW }]);
  }
  function removeRow(i: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : rs));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);

    const chapters = rows
      .map((r) => ({
        id: r.id.trim(),
        title: r.title.trim(),
        physicalStart: Number(r.physicalStart),
        physicalEnd: Number(r.physicalEnd),
      }))
      .filter((r) => r.id || r.title || r.physicalStart || r.physicalEnd);

    if (!file) {
      setError("先选一个 PDF 文件");
      return;
    }
    if (!title.trim()) {
      setError("填写书名");
      return;
    }
    if (chapters.length === 0) {
      setError("至少填写一条章范围（id / 标题 / physicalStart / physicalEnd）");
      return;
    }
    if (chapters.some((c) => !c.id || !c.title || !Number.isInteger(c.physicalStart) || !Number.isInteger(c.physicalEnd) || c.physicalStart < 1 || c.physicalEnd < c.physicalStart)) {
      setError("每条章都要有合法 id、标题与 physicalStart ≤ physicalEnd（正整数）");
      return;
    }

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("pageOffset", String(pageOffset || "0"));
    fd.set("chapters", JSON.stringify(chapters));
    fd.set("pdf", file);

    setBusy(true);
    try {
      const res = await fetch("/api/ingest", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; error?: string; material?: { id: string }; next?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `上传失败（HTTP ${res.status}）`);
        return;
      }
      setDone({ id: data.material?.id ?? "", next: data.next ?? "" });
      router.refresh();
    } catch {
      setError("网络错误，上传未完成");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "h-9 w-full rounded-md border border-line bg-background px-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-3 space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <label className="block">
          <span className="text-xs text-muted">书名（必填，进书库的标题）</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：中药学（第×版）"
            className={`mt-1 ${inputCls}`}
            required
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">pageOffset（书页 = 物理页 − 此值）</span>
          <input
            type="number"
            min={0}
            step={1}
            value={pageOffset}
            onChange={(e) => setPageOffset(e.target.value)}
            className={`mt-1 ${inputCls}`}
          />
        </label>
      </div>

      <div>
        <span className="text-xs text-muted">
          章范围（与 config/chapter.json 对齐；physicalStart / physicalEnd 为 PDF 物理页）
        </span>
        <div className="mt-2 space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[7rem_1fr_6rem_6rem_2rem] gap-2">
              <input
                type="text"
                value={r.id}
                onChange={(e) => setRow(i, { id: e.target.value })}
                placeholder="章 id（如 ch08）"
                aria-label={`第 ${i + 1} 条章 id`}
                className={inputCls}
              />
              <input
                type="text"
                value={r.title}
                onChange={(e) => setRow(i, { title: e.target.value })}
                placeholder="章标题"
                aria-label={`第 ${i + 1} 条章标题`}
                className={inputCls}
              />
              <input
                type="number"
                min={1}
                step={1}
                value={r.physicalStart}
                onChange={(e) => setRow(i, { physicalStart: e.target.value })}
                placeholder="起"
                aria-label={`第 ${i + 1} 条物理页起始`}
                className={inputCls}
              />
              <input
                type="number"
                min={1}
                step={1}
                value={r.physicalEnd}
                onChange={(e) => setRow(i, { physicalEnd: e.target.value })}
                placeholder="止"
                aria-label={`第 ${i + 1} 条物理页结束`}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                aria-label={`删除第 ${i + 1} 条章`}
                className="text-muted transition-colors hover:text-cinnabar disabled:opacity-40"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-2 text-sm text-cinnabar no-underline hover:underline underline-offset-4"
        >
          + 添加一章
        </button>
      </div>

      <label className="block">
        <span className="text-xs text-muted">PDF 文件（落盘 data/uploads/，gitignore；≤200MB）</span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line file:bg-card file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:border-cinnabar"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-cinnabar px-5 py-2 text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50 motion-reduce:transition-none"
        >
          {busy ? "上传中…" : "上传并建档"}
        </button>
        {error ? (
          <p role="alert" className="text-sm text-status-error">
            {error}
          </p>
        ) : null}
        {done ? (
          <div className="w-full">
            <p className="text-sm text-status-ok">
              已建档 <span className="mono">{done.id}</span>（状态 uploaded）。
            </p>
            {/* T45 E：API 的 next 不再 inline 长句——整句进可复制 mono 块（与 API next 同真，
                不客户端改写命令）。 */}
            {done.next ? <CopyCommand command={done.next} /> : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}