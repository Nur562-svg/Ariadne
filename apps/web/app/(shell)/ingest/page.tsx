import Link from "next/link";
import type { Material, MaterialStage } from "@/lib/entities";
import {
  deriveMaterialStage,
  loadBooks,
  loadMaterials,
  materialChapterHasBlocks,
  materialChapterHasCards,
} from "@/lib/entities";
import IngestUpload from "@/components/IngestUpload";
import RegisterMaterialButton from "@/components/RegisterMaterialButton";
import IngestReadyLinks from "@/components/IngestReadyLinks";
import CopyCommand from "@/components/CopyCommand";

export const dynamic = "force-dynamic";

/** 反查包含该物料全部章的已注册书目（用于 ready → 书桌 CTA）；未注册返回 undefined。 */
function findDeskBook(m: Material) {
  return loadBooks().find((b) => m.chapters.every((c) => b.chapterIds.includes(c.id)));
}

/**
 * T45 E：hint 拆 { text, command }——命令进可复制 mono 块（CopyCommand 岛）；
 * uploaded/parsed 只列**仍缺**的章 id（缺 blocks → parse 子集；全 blocks 缺 cards → extract
 * 子集；全缺时即全部），不再恒铺全章。不假进度条、不改 deriveMaterialStage。
 */
function missingChapterIds(m: Material, kind: "blocks" | "cards"): string[] {
  const has = kind === "blocks" ? materialChapterHasBlocks : materialChapterHasCards;
  const missing = m.chapters.filter((c) => !has(m, c.id)).map((c) => c.id);
  return missing.length > 0 ? missing : m.chapters.map((c) => c.id);
}

const STAGE_UI: Record<
  MaterialStage,
  { label: string; badge: string; hint: (m: Material) => { text: string; command?: string } }
> = {
  uploaded: {
    label: "已上传 · 待本机 OCR",
    badge: "border-amber-300 bg-status-warn-bg text-status-warn",
    hint: (m) => {
      const ids = missingChapterIds(m, "blocks");
      return {
        text: `下一步：在本机（macOS）对仍缺 blocks 的 ${ids.length} 章跑 Apple Vision OCR（命令可复制）。没有云端 OCR；未跑解析不会标记 parsed。`,
        command: `pnpm parse ${ids.join(" ")}`,
      };
    },
  },
  parsed: {
    label: "已解析 · 待 LLM 抽取",
    badge: "border-line bg-card text-foreground",
    hint: (m) => {
      const ids = missingChapterIds(m, "cards");
      return {
        text: `blocks 就绪。下一步：对仍缺 cards 的 ${ids.length} 章跑 LLM 直连抽取，产出 data/cards/<ch>.entities.json（命令可复制）。`,
        command: `DEEPSEEK_API_KEY=… pnpm extract -- ${ids.join(" ")}`,
      };
    },
  },
  extracted: {
    label: "已抽取 · 未注册书库",
    badge: "border-line bg-card text-foreground",
    hint: () => ({
      text: "实体卡已生成。点下方「注册进书库 →」一键把章写入 config/chapter.json + config/books.json（本机落盘）；注册成功后这里直接给出「打开书桌 →」，即可开章页读页、练卡、核 cite——无需刷新等待。",
    }),
  },
  ready: {
    label: "就绪 · 已在书库",
    badge: "border-status-ok/40 bg-status-ok-bg text-status-ok",
    hint: () => ({ text: "就绪。可在书桌（三栏学习面）打开阅读，或进入卡浏览器与学习环。" }),
  },
  failed: {
    label: "失败",
    badge: "border-status-error/40 bg-status-error-bg text-status-error",
    hint: (m) => ({ text: m.failure ?? "见 material 记录 failure 字段。" }),
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
        <li><span className="mono mr-1 text-cinnabar">4</span>在 extracted 物料上点「注册进书库 →」，一键写入 config/chapter.json 与 config/books.json → <span className="mono">ready</span>，书库 / 卡浏览器 / 学习环直接可用（无需改 React 代码）。</li>
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
              const hint = ui.hint(m);
              /** T45 E：分章就绪 N/M（磁盘事实推导；纯文本计数，不做假进度条）。 */
              const blocksN = m.chapters.filter((c) => materialChapterHasBlocks(m, c.id)).length;
              const cardsN = m.chapters.filter((c) => materialChapterHasCards(m, c.id)).length;
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
                  <p className="mt-1 text-xs text-muted">
                    blocks {blocksN}/{m.chapters.length} · cards {cardsN}/{m.chapters.length}
                    {blocksN < m.chapters.length || cardsN < m.chapters.length
                      ? "——未全就绪，见下方仍缺章命令"
                      : ""}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    章范围：{m.chapters.map((c) => `${c.id} 物理页 ${c.physicalStart}–${c.physicalEnd}`).join(" · ")}
                  </p>
                  {/* T22 A：每章清单（id · 标题 · 物理页起止 · blocks/有 无 · cards 有/无）。
                      blocks/cards 均由「本物料」磁盘事实推导（fail-closed，禁止假进度条 / 假 OCR 动画）。 */}
                  <ul className="mt-3 space-y-1 border-l-2 border-line pl-4">
                    {m.chapters.map((c) => {
                      const hasBlocks = materialChapterHasBlocks(m, c.id);
                      const hasCards = materialChapterHasCards(m, c.id);
                      return (
                        <li
                          key={c.id}
                          className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted"
                        >
                          <span className="mono text-foreground/80">{c.id}</span>
                          <span className="text-foreground/80">{c.title}</span>
                          <span className="mono">页 {c.physicalStart}–{c.physicalEnd}</span>
                          <span>blocks {hasBlocks ? "有" : "无"}</span>
                          <span>cards {hasCards ? "有" : "无"}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-sm leading-7 text-foreground/90">{hint.text}</p>
                  {/* T45 E：下一步命令进可复制 mono 块（CopyCommand 客户端岛，朱红只强调复制动作）。 */}
                  {hint.command ? <CopyCommand command={hint.command} /> : null}
                  {stage === "ready" || stage === "extracted" ? (
                    (() => {
                      // ready → 显示就绪三连（反查该书）；extracted → 一键注册进书库（T22 C）。
                      const book = stage === "ready" ? findDeskBook(m) : undefined;
                      return (
                        <p className="mt-3">
                          {/* T39 B：就绪三连抽薄客户端岛 IngestReadyLinks——Server 页的 <Link>
                              不能挂 onClick（RSC 边界函数 props 即 500）；岛内三条链点前
                              saveReturn → /ingest（label 上传），完成态「回到刚才」回上传面。
                              书桌仍唯一朱红实心；学习/核次级；练 mode=all · 核 mode=open（T37 D 只回归）。 */}
                          {book ? (
                            <IngestReadyLinks bookId={book.id} />
                          ) : (
                            <RegisterMaterialButton materialId={m.id} title={m.title} />
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