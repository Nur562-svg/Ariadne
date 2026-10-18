import Link from "next/link";
import type { Material, MaterialStage } from "@/lib/entities";
import { deriveMaterialStage, loadBooks, loadMaterials } from "@/lib/entities";
import IngestUpload from "@/components/IngestUpload";

export const dynamic = "force-dynamic";

/** 反查包含该物料全部章的已注册书目（用于 ready → 书桌 CTA）；未注册返回 undefined。 */
function findDeskBook(m: Material) {
  return loadBooks().find((b) => m.chapters.every((c) => b.chapterIds.includes(c.id)));
}

const STAGE_UI: Record<MaterialStage, { label: string; badge: string; hint: (m: Material) => string }> = {
  uploaded: {
    label: "已上传 · 待本机 OCR",
    badge: "border-amber-300 bg-status-warn-bg text-status-warn",
    hint: (m) =>
      `下一步：在本机（macOS）运行 \`pnpm parse ${m.chapters.map((c) => c.id).join(" ")}\`（Apple Vision OCR）。没有云端 OCR；未跑解析不会标记 parsed。`,
  },
  parsed: {
    label: "已解析 · 待 LLM 抽取",
    badge: "border-line bg-card text-foreground",
    hint: (m) =>
      `blocks 就绪。下一步：\`DEEPSEEK_API_KEY=… pnpm extract -- ${m.chapters.map((c) => c.id).join(" ")}\`（LLM 直连，产出 data/cards/<ch>.entities.json）。`,
  },
  extracted: {
    label: "已抽取 · 未注册书库",
    badge: "border-line bg-card text-foreground",
    hint: () =>
      "实体卡已生成。把章节注册进 config/chapter.json + config/books.json 后即为 ready（注册后可在书桌打开）。",
  },
  ready: {
    label: "就绪 · 已在书库",
    badge: "border-status-ok/40 bg-status-ok-bg text-status-ok",
    hint: () => "就绪。可在书桌（三栏学习面）打开阅读，或进入卡浏览器与学习环。",
  },
  failed: {
    label: "失败",
    badge: "border-status-error/40 bg-status-error-bg text-status-error",
    hint: (m) => m.failure ?? "见 material 记录 failure 字段。",
  },
};

export default function IngestPage() {
  const materials = loadMaterials();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="brand-rule pb-2 text-3xl font-bold">导入教材</h1>
      <p className="mt-2 text-sm leading-7 text-foreground/90">
        顾客自带材料是目标模型。上传 PDF 只落盘与建档，<span className="font-semibold">不会</span>触发任何云端
        OCR / 抽取——状态机器完全由本机文件事实推导，没有「假解析成功」。
      </p>

      <ol className="mt-6 space-y-2 border-l-2 border-line pl-5 text-sm leading-7 text-foreground/90">
        <li><span className="mono mr-1 text-cinnabar">1</span>上传 PDF + 填写 pageOffset 与章物理页范围（此处）→ 状态 <span className="mono">uploaded</span>，PDF 落盘 data/uploads/（已 gitignore）。</li>
        <li><span className="mono mr-1 text-cinnabar">2</span>本机（macOS）跑 <span className="mono">pnpm parse &lt;ch&gt;</span> —— Apple Vision OCR，产出 data/chapters/&lt;ch&gt;.blocks.json → <span className="mono">parsed</span>。</li>
        <li><span className="mono mr-1 text-cinnabar">3</span>本机跑 <span className="mono">pnpm extract -- &lt;ch&gt;</span> —— LLM 直连抽取实体卡 → <span className="mono">extracted</span>。</li>
        <li><span className="mono mr-1 text-cinnabar">4</span>把章注册进 config/chapter.json 与 config/books.json → <span className="mono">ready</span>，书库 / 卡浏览器 / 学习环直接可用（无需改 React 代码）。</li>
      </ol>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-muted">上传 PDF</h2>
        <IngestUpload />
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-semibold text-muted">物料记录（{materials.length}）</h2>
        {materials.length === 0 ? (
          <p className="mt-3 text-sm text-muted">还没有上传记录。</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {materials.map((m) => {
              const stage = deriveMaterialStage(m);
              const ui = STAGE_UI[stage];
              return (
                <li key={m.id} className="rounded-lg border border-line bg-card p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold">{m.title}</h3>
                    <span className={`mono shrink-0 rounded border px-2 py-0.5 text-xs ${ui.badge}`}>
                      {ui.label}
                    </span>
                  </div>
                  <p className="mono mt-1 text-xs text-muted">
                    {m.id} · pageOffset {m.pageOffset} · {m.chapters.map((c) => c.id).join(", ")}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    章范围：{m.chapters.map((c) => `${c.id} 物理页 ${c.physicalStart}–${c.physicalEnd}`).join(" · ")}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-foreground/90">{ui.hint(m)}</p>
                  {stage === "ready" || stage === "extracted" ? (
                    (() => {
                      // extracted 按状态机语义 = 尚未全部注册进书库，恒链书库并说明先注册
                      const book = stage === "ready" ? findDeskBook(m) : undefined;
                      return (
                        <p className="mt-3">
                          {book ? (
                            <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                              <Link
                                href={`/desk?book=${encodeURIComponent(book.id)}`}
                                className="inline-block rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline"
                              >
                                打开书桌 →
                              </Link>
                              {/* 就绪三连（T18）：书桌主 CTA + 学习/核页次级文字链。 */}
                              <Link
                                href={`/study?book=${encodeURIComponent(book.id)}`}
                                className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
                              >
                                学习环 →
                              </Link>
                              <Link
                                href={`/review?book=${encodeURIComponent(book.id)}&mode=open`}
                                className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
                              >
                                核页 →
                              </Link>
                            </span>
                          ) : (
                            <>
                              <Link
                                href="/"
                                className="inline-block rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline"
                              >
                                去书库 →
                              </Link>
                              <span className="ml-3 text-xs text-muted">
                                先注册进 config/books.json，书桌才能打开这本书。
                              </span>
                            </>
                          )}
                        </p>
                      );
                    })()
                  ) : null}
                  <p className="mt-2 text-xs text-muted">
                    创建于 {m.createdAt} · PDF：<span className="mono">{m.pdfFile}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-10 text-sm leading-7 text-muted">
        诚实说明：状态由「本物料」磁盘事实推导（上传时快照 artifactBaseline；blocks/cards 相对基线变化且有正文/卡才算 parsed/extracted）——同名 seed 章不会让新上传显示 ready。
        尚无云端 OCR / MinerU 生产管线。
        回 <Link className="text-cinnabar no-underline hover:underline underline-offset-4" href="/">书库</Link> 查看已注册书目。
      </p>
    </main>
  );
}