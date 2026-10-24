"use client";

import Link from "next/link";
import { saveReturn } from "@/lib/return-stack";

/**
 * ingest 就绪三连薄客户端岛（T39 B）：ready 物料上的「打开书桌 / 学习环 / 核页」。
 * ingest 页是 Server Component——Server 渲染的 <Link> 挂 onClick 会 500（函数 props
 * 不能跨 RSC 边界），故抽成本岛，next/link 的 onClick 才合法（与 CardHubReturnLinks
 * 同一手法）。三条链点前写 return 短链 → /ingest（label 上传）——练/核完成态
 * 「回到刚才」回上传面；key 仍 ariadne.desk.return.v1，不另开第二套。
 * 视觉与提取前一致：书桌仍是唯一朱红实心主 CTA，学习/核为 cinnabar 文字链；
 * 练 mode=all · 核 mode=open（T37 D 口径只回归）。extracted 分支仍走
 * RegisterMaterialButton（其自带同款 return，见 T39 A）。
 * T49 A/C：三连对空池与书架同真（fail-closed，缺省当 0）——
 * - ocrPageCount===0：主 CTA 降 outline/muted「打开书桌（尚无 OCR）→」+ title 点名
 *   章页/分栏暂读不了（对齐 T46 书架 0-OCR 文案族），旁补次级「去解析 →」/ingest
 *   （不阻断进桌、勿第二颗大红）；>0 保持朱红实心。
 * - atomCount===0：「学习环」muted 纯文「暂无原子」不可点 /study?book=；
 *   pendingCount===0：「核页」muted 纯文「暂无待核」——与卡瓷砖/轨/枢纽 T48 门禁同族。
 */
export default function IngestReadyLinks({
  bookId,
  ocrPageCount,
  atomCount,
  pendingCount,
  darkCount,
}: {
  bookId: string;
  /** T49 A：该书已解析 OCR 印刷页数（loadBookValidPages；缺省当 0 · fail-closed）。 */
  ocrPageCount?: number;
  /** T49 C：书级可练原子数（collectStudyAtoms({bookId}).length 同池族；缺省当 0）。 */
  atomCount?: number;
  /** T49 C：书级待核 cite 数（collectCiteQueue({bookId}) 同池族；缺省当 0）。 */
  pendingCount?: number;
  /**
   * T58 G/I：书级暗页数（宿主消费 T57 装配，与 ingest 暗页条/书架暗徽同数）——>0 时
   * 「学习环」旁琥珀短徽「抽出偏稀 · 暗D」。只旁挂信号：不影响 T49 OCR/原子/待核
   * 三门禁（atomCount===0 仍纯文不可点），不阻断打开书桌，无 Register 硬 4xx。
   */
  darkCount?: number;
}) {
  function rememberUploadReturn() {
    saveReturn({ href: "/ingest", label: "上传", at: Date.now() });
  }
  const bookQ = encodeURIComponent(bookId);
  return (
    <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      {(ocrPageCount ?? 0) > 0 ? (
        <Link
          href={`/desk?book=${bookQ}`}
          onClick={rememberUploadReturn}
          className="inline-block rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline"
        >
          打开书桌 →
        </Link>
      ) : (
        <>
          <Link
            href={`/desk?book=${bookQ}`}
            onClick={rememberUploadReturn}
            title="尚无 OCR 印刷页——章页/分栏暂读不了；可进桌看概览与实体卡"
            className="inline-block rounded-md border border-line px-4 py-2 text-sm text-muted no-underline hover:border-cinnabar hover:text-cinnabar"
          >
            打开书桌（尚无 OCR）→
          </Link>
          <Link
            href="/ingest"
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            去解析 →
          </Link>
        </>
      )}
      {(atomCount ?? 0) > 0 ? (
        <Link
          href={`/study?book=${bookQ}&mode=all`}
          onClick={rememberUploadReturn}
          className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
        >
          学习环 →
        </Link>
      ) : (
        <span className="text-sm text-muted" title="这本书还没有萃取出的知识原子">
          暂无原子
        </span>
      )}
      {/* T58 G：学习环旁暗页短徽（书级 D；好书/未检不吵）——池内原子 ≠ 材料已覆盖。 */}
      {(darkCount ?? 0) > 0 ? (
        <span
          title={`实质 OCR 页未被抽出 cite（暗页）${darkCount} 页——学习环练的是池内原子，不等于材料已覆盖；/ingest 暗页条与 pnpm page-check 可复核`}
          className="mono rounded border border-amber-300 bg-status-warn-bg px-1.5 py-0.5 text-[10px] text-status-warn"
        >
          抽出偏稀 · 暗{darkCount}
        </span>
      ) : null}
      {(pendingCount ?? 0) > 0 ? (
        <Link
          href={`/review?book=${bookQ}&mode=open`}
          onClick={rememberUploadReturn}
          className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
        >
          核页 →
        </Link>
      ) : (
        <span className="text-sm text-muted" title="这本书还没有待核 cite">
          暂无待核
        </span>
      )}
    </span>
  );
}
