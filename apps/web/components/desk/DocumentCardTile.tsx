"use client";

import Link from "next/link";
import type { EntityCard } from "@/lib/entities";
import CitePeek from "@/components/CitePeek";
import { deskPageHref } from "@/lib/ocr-page";
import { citeOcrMiss } from "@/lib/cite-ocr-quality";
import { KIND_ZH } from "@/components/desk/document-pane-helpers";

/**
 * T73 机械抽出：原 DocumentPane.tsx 内 CardCard（实体卡瓷砖）整段迁此——
 * 组件体/props/文案/门禁零改，仅换文件；SectionCards 消费。
 */
export function CardCard({
  card,
  bookId,
  rememberReturn,
  pendingCiteCount,
  pendingByPage,
  bookValidPages,
  pageTextByPage,
}: {
  card: EntityCard;
  bookId?: string;
  /**
   * T34 A：瓷砖练/核出发写 return 短链（回当前书桌——章页/分栏有阅读页写书桌 p.N，
   * 实体卡模式写书级；对齐 ChapterPageReader.rememberDeskReturn 口径）。
   */
  rememberReturn?: () => void;
  /**
   * T48 A：本卡待核 cite 数——父从书级 heyePool（collectCiteQueue({bookId}) 轻量项）按 card.id
   * 计数下传，与 CardHubReturnLinks pendingCiteCount / collectCiteQueue({cardId}) 同池族。
   * 缺省当 0（fail-closed）：0 →「核」降 muted 纯文「暂无待核」，不进空 open 池。
   */
  pendingCiteCount?: number;
  /**
   * T49 E：页 → 待核数（服务端 pendingByPage 同表）——瓷砖「摘」浮层「核本页」空池门禁；
   * 缺省（未装配）不传给 CitePeek（D 契约：未传入保持链）。
   */
  pendingByPage?: Record<number, number>;
  /**
   * T53 D/I：该书已解析印刷页[]（DocumentPane bookValidPages[bookId]）——主 cite「对页」
   * 与「摘」浮层 CiteChip/「在书桌打开」的鬼页门禁（共享 helper）；练/核空池门禁不动。
   */
  bookValidPages?: number[];
  /**
   * T54 H/I：该书 page→OCR 原文（DocumentPane 自 pages prop 派生，客户端纯计算）——
   * 主 cite 机检「OCR 未见」点名（citeOcrMiss 同真算法；缺文本不抬假阳）。
   */
  pageTextByPage?: Record<number, string>;
}) {
  /** 主 cite（卡级第一条有页引用）；无页则没有可 Peek 的定位，不渲染。 */
  const primaryCite = card.cites.find((x) => x.page != null);
  const primaryOcrMiss = citeOcrMiss(primaryCite, pageTextByPage);
  return (
    <div className="block h-full rounded-lg border border-line bg-card p-4 transition-shadow hover:shadow-md">
      <Link href={`/desk/card/${card.id}`} className="block no-underline">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">{card.name_zh}</h3>
          <span className="mono shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
            {KIND_ZH[card.kind] ?? card.kind}
          </span>
        </div>
        {card.name_en && <p className="mono mt-0.5 text-xs text-muted">{card.name_en}</p>}
        <p className="mt-2 text-sm leading-6 text-foreground/85">{card.one_liner}</p>
      </Link>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="min-w-0 text-xs text-muted">
          {card.atoms.length} 个原子 · {card.chapterId ?? ""}
          {card.cites.some((x) => x.page == null) ? " · 部分未验证 p.?" : ""}
        </p>
        <span className="flex shrink-0 items-center gap-2">
          {/* 主 cite 旁轻量 Peek（T19 鼓励项）：不新增颜色，不抢「练」主链；无页则不渲染。
              T49 E：下传 T48 同源卡级 pending（「核本卡」门禁）+ 页级 pending
              （primaryCite.page 查 pendingByPage，「核本页」门禁；表未装配不传保持链）。
              T53 D/I：下传该书 validPages——CiteChip 书桌深链 / 浮层「在书桌打开」鬼页门禁。 */}
          {primaryCite ? (
            <CitePeek
              cite={primaryCite}
              deskBookId={bookId}
              cardId={card.id}
              bookValidPages={bookValidPages}
              ocrMiss={primaryOcrMiss}
              pendingCiteCount={pendingCiteCount}
              pendingPageCount={
                pendingByPage != null && primaryCite.page != null
                  ? (pendingByPage[primaryCite.page] ?? 0)
                  : undefined
              }
            />
          ) : null}
          {/* T34 A：主 cite 有页 + 书桌语境 → 次级「对页」直跳（与 EntityCardDetail T33 字段/页脚同族）。
              T53 D：改走共享 deskPageHref——鬼页（该书 OCR 表已装配且不含）降纯文「本页无 OCR」，
              与 EntityCardDetail 对页（T52）同真；有 OCR / 未装配保持链。 */}
          {primaryCite?.page != null && bookId ? (
            deskPageHref(bookId, primaryCite.page, bookValidPages) ? (
              <Link
                href={`/desk?book=${encodeURIComponent(bookId)}&page=${primaryCite.page}`}
                className="text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
              >
                对页 →
              </Link>
            ) : (
              <span
                className="text-xs text-muted"
                title="该印刷页尚未解析 OCR——书桌章页定位不了"
              >
                本页无 OCR
              </span>
            )
          ) : null}
          {/* T35 B：瓷砖「练」显式 mode=all——打开可见池入口写出默认档，挡住 sticky 非默认空档。
              T45 C：零原子卡同族门禁（对齐 CardHubReturnLinks / 章页轨）——「练」降 muted 纯文
              「暂无原子」，不可点 /study?card=；>0 保持练链 + rememberReturn。 */}
          {bookId ? (
            card.atoms.length > 0 ? (
              <Link
                href={`/study?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(bookId)}&mode=all`}
                onClick={rememberReturn}
                className="text-xs text-cinnabar no-underline hover:underline underline-offset-4"
              >
                练 →
              </Link>
            ) : (
              <span className="text-xs text-muted">暂无原子</span>
            )
          ) : null}
          {/* T34 A：练核对称——「核」次级 muted（与本页卡轨轨卡「核」同族，非第二颗实心朱红）；
              与「练」同点前写 return。T35 A：显式 mode=open。
              T48 A：pending 空池门禁（对齐 CardHubReturnLinks「本卡暂无待核 cite」）——
              pendingCiteCount===0 降 muted 纯文「暂无待核」，不可点 /review?card=&mode=open；
              >0 保持链 + rememberReturn。缺省当 0，不假装有待核。 */}
          {bookId ? (
            (pendingCiteCount ?? 0) > 0 ? (
              <Link
                href={`/review?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(bookId)}&mode=open`}
                onClick={rememberReturn}
                className="text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
              >
                核 →
              </Link>
            ) : (
              <span className="text-xs text-muted" title="本卡暂无待核 cite">
                暂无待核
              </span>
            )
          ) : null}
        </span>
      </div>
    </div>
  );
}
