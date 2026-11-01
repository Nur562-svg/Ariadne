import Link from "next/link";
import {
  collectStudyAtoms,
  loadAllChapterPages,
  loadBookValidPages,
  loadMaterials,
} from "@/lib/entities";
import { collectCiteQueue } from "@/lib/heye";
import IngestUpload from "@/components/IngestUpload";
import IngestMaterialCard from "@/components/IngestMaterialCard";
import { buildIngestMaterialModel } from "@/lib/ingest-material-model";

export const dynamic = "force-dynamic";

export default function IngestPage() {
  const materials = loadMaterials();
  /**
   * T49 C：就绪/注册三连空池计数装配（只在有物料时读，空页不扫盘）——
   * - bookValidPages：ready 书「打开书桌」0-OCR 门禁（与 T46 书架四格/CTA 同表）；
   * - allOcrPages/allAtoms/allQueue：全库一次读出，按书或物料章集合过滤——与
   *   collectStudyAtoms({bookId}) / collectCiteQueue({bookId}) 同池族（loadCards 按
   *   chapterIds 文件归属，章间无重复卡，过滤结果与 scoped 调用等值，不造第二套定义）。
   */
  const bookValidPages = materials.length > 0 ? loadBookValidPages() : {};
  const allOcrPages = materials.length > 0 ? loadAllChapterPages() : [];
  const allAtoms = materials.length > 0 ? collectStudyAtoms() : [];
  const allQueue = materials.length > 0 ? collectCiteQueue() : [];
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
              const model = buildIngestMaterialModel(m);
              return (
                <IngestMaterialCard
                  key={m.id}
                  model={model}
                  bookValidPages={bookValidPages}
                  allOcrPages={allOcrPages}
                  allAtoms={allAtoms}
                  allQueue={allQueue}
                />
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