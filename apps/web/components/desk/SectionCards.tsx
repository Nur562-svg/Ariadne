"use client";

import type { EntityCard } from "@/lib/entities";
import { SECTIONS, type SectionId } from "@/components/desk/SectionToc";
import { KIND_ZH, groupByKind } from "@/components/desk/document-pane-helpers";
import { CardCard } from "@/components/desk/DocumentCardTile";

/**
 * T73 机械抽出：原 DocumentPane.tsx 内 SectionCards（卡片区）整段迁此——
 * 组件体/props/文案/门禁零改，仅换文件；消费 helpers（过滤分组同一份）与 CardCard 瓷砖。
 */
/** 卡片区：默认网格；实体图谱按 kind 分组；compact 用于分栏窄列。卡瓷砖右上角薄「练/核」链（T34 A 含 return）。 */
export default function SectionCards({
  section,
  cards,
  compact,
  bookId,
  rememberReturn,
  pendingByCard,
  pendingByPage,
  bookValidPages,
  pageTextByPage,
}: {
  section: SectionId;
  cards: EntityCard[];
  compact?: boolean;
  bookId?: string;
  /** T34 A：卡瓷砖练/核点前写 return（DocumentPane 依当前阅读页构造）。 */
  rememberReturn?: () => void;
  /** T48 A：cardId → 本书待核 cite 数（DocumentPane heyePool 派生）——瓷砖「核」空池门禁。 */
  pendingByCard?: Record<string, number>;
  /** T49 E：页 → 待核数（服务端 pendingByPage）——瓷砖「摘」浮层「核本页」门禁。 */
  pendingByPage?: Record<number, number>;
  /** T53 D/I：该书已解析印刷页[]——瓷砖「对页」/摘浮层鬼页门禁（共享 helper）。 */
  bookValidPages?: number[];
  /** T54 H/I：该书 page→OCR 原文——瓷砖主 cite 机检点名（透传 CardCard）。 */
  pageTextByPage?: Record<number, string>;
}) {
  if (cards.length === 0) {
    return (
      <p className="mt-8 border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
        当前段「{SECTIONS.find((s) => s.id === section)?.label}」没有匹配的实体卡（过滤规则见六段目录说明）。
      </p>
    );
  }
  if (section === "map" && !compact) {
    return (
      <div className="mt-8 space-y-8">
        {groupByKind(cards).map(({ kind, items }) => (
          <section key={kind} aria-label={`${KIND_ZH[kind] ?? kind}类实体卡`}>
            <h2 className="text-sm font-semibold text-muted">
              {KIND_ZH[kind] ?? kind}（{items.length}）
            </h2>
            <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((c) => (
                <li key={c.id}>
                  <CardCard
                    card={c}
                    bookId={bookId}
                    rememberReturn={rememberReturn}
                    pendingCiteCount={pendingByCard?.[c.id] ?? 0}
                    pendingByPage={pendingByPage}
                    bookValidPages={bookValidPages}
                    pageTextByPage={pageTextByPage}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }
  return (
    <section className="mt-8" aria-label={`${SECTIONS.find((s) => s.id === section)?.label}实体卡`}>
      <h2 className="text-sm font-semibold text-muted">
        {SECTIONS.find((s) => s.id === section)?.label}（{cards.length} 张）
      </h2>
      <ul className={`mt-3 grid grid-cols-1 gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
        {cards.map((c) => (
          <li key={c.id}>
            <CardCard
              card={c}
              bookId={bookId}
              rememberReturn={rememberReturn}
              pendingCiteCount={pendingByCard?.[c.id] ?? 0}
              pendingByPage={pendingByPage}
              bookValidPages={bookValidPages}
              pageTextByPage={pageTextByPage}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
