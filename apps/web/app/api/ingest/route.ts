import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { repoRoot, snapshotArtifactBaseline, type Material } from "@/lib/entities";

export const runtime = "nodejs";

const MAX_PDF_BYTES = 200 * 1024 * 1024; // 扫描版 PDF 上限（诚实限制，避免无界写盘）

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
 * 上传教材 PDF：落盘 data/uploads/（gitignore），写 data/materials/<id>.material.json，
 * 状态只写 uploaded（或 failed）——parsed/extracted/ready 一律由「本物料」磁盘事实推导
 * （artifactBaseline 绑定：seed 同名章产物不算本 job），本接口不做任何 OCR / 抽取，不存在"假云端成功"。
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "请求不是有效的 multipart 表单" }, { status: 400 });
  }

  const title = String(form.get("title") ?? "").trim();
  const pageOffset = Number(form.get("pageOffset"));
  if (!title) return NextResponse.json({ error: "缺少书名 title" }, { status: 400 });
  if (!Number.isInteger(pageOffset) || pageOffset < 0) {
    return NextResponse.json({ error: "pageOffset 必须是非负整数（书页 = PDF 物理页 − pageOffset）" }, { status: 400 });
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
  if (!pdfLike || typeof pdfLike.arrayBuffer !== "function" || pdfLike.size === 0) {
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

  const buf = Buffer.from(await pdfLike.arrayBuffer());
  if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return NextResponse.json({ error: "文件不是有效 PDF（缺少 %PDF 头）" }, { status: 400 });
  }
  fs.writeFileSync(path.join(repoRoot(), material.pdfFile), buf);
  fs.writeFileSync(
    path.join(materialsDir, `${id}.material.json`),
    JSON.stringify(material, null, 2) + "\n",
  );

  return NextResponse.json(
    {
      ok: true,
      material,
      stage: "uploaded",
      next: `在本机（macOS）跑：.venv/bin/python scripts/parse_chapter.py ${chapters.map((c) => c.id).join(" ")}（Apple Vision OCR），再 pnpm extract -- <ch>。Ariadne 目前没有云端 OCR，未跑解析不会标记 parsed。`,
    },
    { status: 201 },
  );
}