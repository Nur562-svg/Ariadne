import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { repoRoot, snapshotArtifactBaseline, type Material } from "@/lib/entities";

export const runtime = "nodejs";

const MAX_PDF_BYTES = 200 * 1024 * 1024; // 扫描版 PDF 上限（诚实限制，避免无界写盘）

/**
 * 单并发护栏（review-fix-integrity C）：同一时刻只接受一个上传在途，
 * 第二个请求 429「忙」——本地单用户工具，不做队列。auth 仍 OUT（产品决策）。
 */
let ingestInflight = false;

type ChapterRow = { id: string; title: string; physicalStart: number; physicalEnd: number };

function validateChapters(raw: unknown): ChapterRow[] | string {
  if (!Array.isArray(raw) || raw.length === 0) {
    return "chapters 必须是至少一条 {id,title,physicalStart,physicalEnd} 的数组";
  }
  const ids = new Set<string>();
  const rows: ChapterRow[] = [];
  for (const c of raw) {
    const o = c as Record<string, unknown>;
    const id = String(o?.id ?? "").trim();
    const title = String(o?.title ?? "").trim();
    const start = Number(o?.physicalStart);
    const end = Number(o?.physicalEnd);
    if (!/^[\w-]{2,32}$/.test(id)) return `章 id 不合法：${id || "（空）"}`;
    if (ids.has(id)) return `章 id 重复：${id}`;
    if (!title) return `章 ${id} 缺少标题`;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
      return `章 ${id} physicalStart/physicalEnd 必须是正整数且 start ≤ end`;
    }
    ids.add(id);
    rows.push({ id, title, physicalStart: start, physicalEnd: end });
  }
  return rows;
}

/**
 * 流式落盘（review-fix-integrity C）：不把整份 PDF `arrayBuffer()` 进内存，
 * 边读边写 createWriteStream（带 backpressure）；%PDF- 魔数用首 5 字节检一次，
 * 流中累计字节超上限即中止。失败时由调用方清理半截文件。
 */
async function streamPdfToFile(pdfLike: File, dest: string): Promise<void> {
  const reader = pdfLike.stream().getReader();
  const out = fs.createWriteStream(dest);
  let writeError: Error | null = null;
  out.on("error", (e) => {
    writeError = e;
  });
  try {
    let header = Buffer.alloc(0);
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;
      if (header.length < 5) {
        header = Buffer.concat([header, Buffer.from(value.subarray(0, 5 - header.length))]);
        if (header.length >= 5 && header.toString("latin1") !== "%PDF-") {
          throw new Error("文件不是有效 PDF（缺少 %PDF- 头）");
        }
      }
      received += value.byteLength;
      if (received > MAX_PDF_BYTES) {
        throw new Error(`PDF 超过 ${Math.round(MAX_PDF_BYTES / 1024 / 1024)}MB 上限`);
      }
      if (writeError) throw writeError;
      if (!out.write(Buffer.from(value))) {
        await new Promise<void>((resolve) => out.once("drain", () => resolve()));
      }
    }
    if (writeError) throw writeError;
    await new Promise<void>((resolve) => out.end(() => resolve()));
    if (writeError) throw writeError;
  } catch (e) {
    out.destroy();
    await reader.cancel().catch(() => {});
    throw e instanceof Error ? e : new Error(String(e));
  }
}

/**
 * 上传教材 PDF：落盘 data/uploads/（gitignore），写 data/materials/<id>.material.json，
 * 状态只写 uploaded（或 failed）——parsed/extracted/ready 一律由「本物料」磁盘事实推导
 * （artifactBaseline 绑定：seed 同名章产物不算本 job），本接口不做任何 OCR / 抽取，不存在"假云端成功"。
 */
export async function POST(req: Request) {
  if (ingestInflight) {
    return NextResponse.json(
      { error: "已有一个上传在进行中，请等它完成再试（本服务单并发上传）" },
      { status: 429 },
    );
  }
  ingestInflight = true;
  try {
    return await handleUpload(req);
  } finally {
    ingestInflight = false;
  }
}

async function handleUpload(req: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "请求不是有效的 multipart 表单" }, { status: 400 });
  }

  const title = String(form.get("title") ?? "").trim();
  const pageOffsetRaw = form.get("pageOffset");
  const pageOffset = Number(pageOffsetRaw);
  if (!title) return NextResponse.json({ error: "缺少书名 title" }, { status: 400 });
  if (pageOffsetRaw == null || !Number.isInteger(pageOffset) || pageOffset < 0) {
    return NextResponse.json(
      { error: "pageOffset 必须是非负整数（书页 = PDF 物理页 − pageOffset）" },
      { status: 400 },
    );
  }

  let chapters: ChapterRow[];
  try {
    const parsed = validateChapters(JSON.parse(String(form.get("chapters") ?? "")));
    if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 });
    chapters = parsed;
  } catch {
    return NextResponse.json({ error: "chapters 不是合法 JSON" }, { status: 400 });
  }

  const pdf = form.get("pdf");
  const pdfLike = pdf as File | null;
  if (!pdfLike || typeof pdfLike.stream !== "function" || pdfLike.size === 0) {
    return NextResponse.json({ error: "缺少 PDF 文件" }, { status: 400 });
  }
  if (!pdfLike.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "只接受 .pdf 文件" }, { status: 400 });
  }
  if (pdfLike.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: `PDF 超过 ${Math.round(MAX_PDF_BYTES / 1024 / 1024)}MB 上限` }, { status: 400 });
  }

  const id = `m-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  // 快照上传瞬间各章产物指纹：后续 stage 只在相对此基线变化时推进（防 seed 归因）。
  const artifactBaseline = snapshotArtifactBaseline(chapters.map((c) => c.id));
  const material: Material = {
    id,
    title,
    pageOffset,
    pdfFile: path.join("data", "uploads", `${id}.pdf`),
    chapters,
    status: "uploaded",
    artifactBaseline,
    createdAt: now,
    updatedAt: now,
  };

  const uploadsDir = path.join(repoRoot(), "data", "uploads");
  const materialsDir = path.join(repoRoot(), "data", "materials");
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(materialsDir, { recursive: true });

  const pdfDest = path.join(repoRoot(), material.pdfFile);
  const materialDest = path.join(materialsDir, `${id}.material.json`);
  try {
    await streamPdfToFile(pdfLike, pdfDest);
    fs.writeFileSync(materialDest, JSON.stringify(material, null, 2) + "\n");
  } catch (e) {
    // 失败清理：不留半截 PDF / 孤儿物料档案。
    for (const f of [pdfDest, materialDest]) {
      try {
        fs.unlinkSync(f);
      } catch {
        /* 可能尚未创建 */
      }
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PDF 落盘失败" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      material,
      stage: "uploaded",
      // next 说真话：本机解析用的是这份上传的 PDF（--pdf 指到实际落盘路径），不是 seed 那本。
      next: `在本机（macOS）对这份上传的 PDF 跑：.venv/bin/python scripts/parse_chapter.py --pdf ${material.pdfFile} ${chapters.map((c) => c.id).join(" ")}（Apple Vision OCR），再 pnpm extract -- <ch>。Ariadne 目前没有云端 OCR，未跑解析不会标记 parsed。`,
    },
    { status: 201 },
  );
}
