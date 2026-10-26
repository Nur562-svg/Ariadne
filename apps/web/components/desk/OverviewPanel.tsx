"use client";

import Link from "next/link";
import type { BookConfig, ChapterConfig, EntityCard, PageDoc } from "@/lib/entities";
import { scoreParseChapter } from "@/lib/parse-ocr-coverage";
import { scoreExtractPageCoverage } from "@/lib/extract-page-coverage";
import { scoreExtractPageDensity } from "@/lib/extract-page-density";

/**
 * T73 机械抽出：原 DocumentPane.tsx 内 OverviewPanel（概览面板）整段迁此——
 * 组件体/props/文案/门禁零改，仅换文件；DocumentPane 编排消费。
 */
/**
 * 概览面板：书头统计 + 章列表（主按钮点章 → 章页 OCR）。
 * T37 A/B：每章行补旁路次级「练本章 →」「核本章 →」——/study?book=&chapter=&mode=all ·
 * /review?book=&chapter=&mode=open（章池 + 默认可见档，不被本标签 sticky 非默认档吞成空队列）；
 * 点前写 return 短链（rememberReturn = rememberDeskCardReturn 口径：有阅读页→书桌 p.N，
 * 否则书级；不另开第二套 return key）。0 卡章练/核纯文不可点（不进空池）；
 * 「N 页 · M 卡」meta 保留；次级 text-xs muted + hover cinnabar，不抢主按钮、不加实心。
 * T48 F：章行练/核不再只看 cardCount——有卡章再按章内原子总数（cards.reduce atoms）与
 * 章内 pending（pendingByCard 对该章卡 id 集合求和，与卡瓷砖/轨同一张表）各自门禁：
 * 原子===0 →「本章暂无原子」纯文；pending===0 →「本章暂无待核」纯文；二者 >0 保持链。
 */
export default function OverviewPanel({
  book,
  chapters,
  cards,
  pages,
  pendingByCard,
  onOpenChapter,
  rememberReturn,
}: {
  book: BookConfig;
  chapters: ChapterConfig[];
  cards: EntityCard[];
  pages: PageDoc[];
  /** T48 F：cardId → 本书待核 cite 数（DocumentPane heyePool 派生）——章行「核本章」空池门禁。 */
  pendingByCard?: Record<string, number>;
  onOpenChapter: (chId: string) => void;
  /** T37 A：练本章/核本章点前写 return（DocumentPane 依当前阅读页构造，同 CardCard 口径）。 */
  rememberReturn?: () => void;
}) {
  return (
    <section className="mt-8">
      {/* T45 B：书级四格补「OCR 印刷页」= pages.length——与章行「N 页 / 无 OCR 页」同一事实源；
          0 页写「无 OCR 页」，不造「0 页」假计数感。 */}
      <dl className="grid grid-cols-2 gap-4 sm:max-w-lg sm:grid-cols-4">
        {(
          [
            ["章节", book.chapterIds.length],
            ["实体卡", cards.length],
            ["知识原子", cards.reduce((n, c) => n + c.atoms.length, 0)],
            ["OCR 印刷页", pages.length > 0 ? pages.length : "无 OCR 页"],
          ] as [string, string | number][]
        ).map(([k, v]) => (
          <div key={String(k)} className="rounded-lg border border-line bg-card p-4 text-center">
            <dt className="text-xs text-muted">{k}</dt>
            <dd
              className={`mt-0.5 font-semibold ${
                typeof v === "number" ? "text-lg" : "text-base leading-7"
              }`}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-8 text-sm font-semibold text-muted">章节（点击进入章页 OCR）</h2>
      <ul className="mt-3 space-y-2">
        {chapters.map((c) => {
          const count = pages.filter((p) => p.chapterId === c.id).length;
          /* T26 D：章行如实报「页 + 卡」；0 页章写「无 OCR 页」，不造「0 页」假计数感。 */
          const chCards = cards.filter((k) => k.chapterId === c.id);
          const cardCount = chCards.length;
          /* T48 F：章内原子总数 / 章内待核数（pendingByCard 对该章卡求和，与瓷砖/轨同表）——
             练/核章行各自按真池门禁，不再凭 cardCount>0 就装两条都能进。 */
          const chAtoms = chCards.reduce((n, k) => n + k.atoms.length, 0);
          const chPending = chCards.reduce((n, k) => n + (pendingByCard?.[k.id] ?? 0), 0);
          /* T58 H：章级抽出页覆盖（scoreExtractPageCoverage 与 pnpm page-check 同真）——
             提升**一次计算**两处消费：T57 暗徽（F）+ 练本章 title 旁挂（H）。无卡/无页章
             null（未检不装暗假 0）。 */
          const chExaminable =
            count > 0 && cardCount > 0
              ? scoreExtractPageCoverage({
                  pages: pages.filter((p) => p.chapterId === c.id),
                  cards: chCards,
                })
              : null;
          /* T59 F：章级抽出密度（scoreExtractPageDensity 与 pnpm density-check 同真）——
             有 cards 且有 OCR 页才实算；shallowCount>0 → 下方琥珀短徽「浅S」。无卡/无页章
             null（未检不装浅假 0）；与暗徽分列并列（暗+浅可同章）。 */
          const chDensity =
            count > 0 && cardCount > 0
              ? scoreExtractPageDensity({
                  pages: pages.filter((p) => p.chapterId === c.id),
                  cards: chCards,
                })
              : null;
          /* T58 H + T60 H：练本章 title 旁挂——章 weak（T57 暗页）点名暗 D、章
             shallowCount>0（T59 浅密度）点名浅 S（练本章 ≠ 覆盖暗页 / ≠ 可考密度够）；
             两句可兼（"；"连接）；好章不加 title 不吵。次级链语义不动，行尾 T56/T57/T59
             生产徽（空稀/暗/浅）保留——练入口与生产面同真不同位，不重复铺徽。 */
          const chShallowCount = chDensity?.shallowCount ?? 0;
          const chPracticeTitle =
            [
              chExaminable?.weak
                ? `本章还有 ${chExaminable.darkCount} 个暗页（实质 OCR 未抽出原子）——练本章不覆盖暗页；pnpm page-check 可复核`
                : null,
              chShallowCount > 0
                ? `本章 ${chShallowCount} 个已 cite 实质页原子极稀（浅S）——练本章不等于可考密度够；pnpm density-check -- --shallow ${c.id} 可复核`
                : null,
            ]
              .filter((x): x is string => x != null)
              .join("；") || undefined;
          return (
            <li key={c.id}>
              {/* 章行卡片容器（对齐 CardCard 容器模式）：主按钮（开章 OCR）占满左区，
                  练/核为行尾旁路次级链——<a> 不嵌 <button>，键盘/读屏各自可达。
                  T46 E：无 OCR 章（count===0）开章降级为纯文（「无 OCR 页」如实展示，
                  不可 onOpenChapter）；有页保持既有开章与 T37 练/核章行。 */}
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg border border-line bg-card px-4 py-3 transition-colors hover:border-cinnabar motion-reduce:transition-none">
                {count > 0 ? (
                  <button
                    onClick={() => onOpenChapter(c.id)}
                    className="flex min-w-0 flex-1 items-baseline justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-cinnabar"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {c.id} · {c.title}
                    </span>
                    <span className="mono shrink-0 text-xs text-muted">
                      {count} 页 · {cardCount} 卡 →
                    </span>
                  </button>
                ) : (
                  <span
                    className="flex min-w-0 flex-1 items-baseline justify-between gap-3 text-left"
                    title="本章尚无 OCR 印刷页——暂不能开章页"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {c.id} · {c.title}
                    </span>
                    <span className="mono shrink-0 text-xs text-muted">
                      无 OCR 页 · {cardCount} 卡
                    </span>
                  </span>
                )}
                {/* T37 B：0 卡章练/核纯文（muted 提示，不点进空池）；有卡两链章池 + 默认档。
                    T48 F：有卡章再按章内原子/待核各自门禁——0 原子「本章暂无原子」、0 待核
                    「本章暂无待核」纯文；>0 保持链 + rememberReturn。 */}
                {cardCount > 0 ? (
                  <span className="flex shrink-0 items-baseline gap-3 text-xs">
                    {chAtoms > 0 ? (
                      <Link
                        href={`/study?book=${encodeURIComponent(book.id)}&chapter=${encodeURIComponent(c.id)}&mode=all`}
                        onClick={rememberReturn}
                        /* T58 H + T60 H：练入口 title 旁挂（暗D / 浅S 可兼，见
                           chPracticeTitle 构造点）；好章不加 title 不吵。
                           次级链语义不动。 */
                        title={chPracticeTitle}
                        className="text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                      >
                        练本章 →
                      </Link>
                    ) : (
                      <span className="text-muted" title="本章实体卡均未萃取出知识原子">
                        本章暂无原子
                      </span>
                    )}
                    {chPending > 0 ? (
                      <Link
                        href={`/review?book=${encodeURIComponent(book.id)}&chapter=${encodeURIComponent(c.id)}&mode=open`}
                        onClick={rememberReturn}
                        className="text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                      >
                        核本章 →
                      </Link>
                    ) : (
                      <span className="text-muted" title="本章暂无待核 cite">
                        本章暂无待核
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-muted">本章暂无卡</span>
                )}
                {/* T56 F：章行 parse 覆盖徽（与书架 bookParse / pnpm parse-check 同真）——
                    空页/稀页任一 > 0 → 琥珀短徽「空E · 稀S」（只列 >0 项）；好章不吵；
                    无 OCR 章沿用上方「无 OCR 页」文案，此处不出徽（无 pages 可评）。 */}
                {(() => {
                  if (count === 0) return null; // 无 OCR 页章走既有「无 OCR 页」
                  const cov = scoreParseChapter({
                    pages: pages.filter((p) => p.chapterId === c.id),
                  });
                  if (cov.emptyPages === 0 && cov.sparsePages === 0) return null;
                  const parts: string[] = [];
                  if (cov.emptyPages > 0) parts.push(`空 ${cov.emptyPages}`);
                  if (cov.sparsePages > 0) parts.push(`稀 ${cov.sparsePages}`);
                  return (
                    <span
                      title="本章有空页/稀页（OCR 正文 0 字或 <40 字）——pnpm parse-check 可复核"
                      className="mono shrink-0 rounded border border-amber-300 bg-status-warn-bg px-1.5 py-0.5 text-[10px] text-status-warn"
                    >
                      {parts.join(" · ")}
                    </span>
                  );
                })()}
                {/* T57 F：章行暗页徽（与 T56 空/稀徽、T55 cite 徽三分列）——有 cards 且有
                    OCR 页才实算（chExaminable，T58 H 提升的同一份——与 pnpm page-check
                    同真：暗页 = chars≥40 实质页零 cite）；darkCount>0 → 琥珀短徽「暗D」；
                    好章不吵；无 cards（未抽出）不装暗徽（未检 ≠ 零暗）。无掌握% / Due。 */}
                {(() => {
                  const epc = chExaminable;
                  if (!epc || epc.darkCount === 0) return null;
                  return (
                    <span
                      title={`本章 ${epc.darkCount} 个实质 OCR 页未被任何卡 cite（暗页：${epc.darkPages
                        .slice(0, 6)
                        .map((d) => `p.${d.page}`)
                        .join(" ")}）——扉页/小结可能合理暗；pnpm page-check -- --dark ${c.id} 可复核`}
                      className="mono shrink-0 rounded border border-amber-300 bg-status-warn-bg px-1.5 py-0.5 text-[10px] text-status-warn"
                    >
                      暗{epc.darkCount}
                    </span>
                  );
                })()}
                {/* T59 F：章行浅页徽（与 T56 空/稀徽、T57 暗徽并列的第四信号——同为琥珀
                    短徽族，非新独立列）——有 cards 且有 OCR 页才实算（chDensity，与
                    pnpm density-check 同真：浅页 = chars≥40 实质页 ∧ 1≤原子数≤2 ∧
                    均摊≥400 字，原子只计 atoms[].cite.page）；shallowCount>0 → 琥珀短徽
                    「浅S」；好章不吵；无 cards（未抽出）不装浅徽（未检 ≠ 零浅）。
                    无掌握% / Due；不改写 cite/parse/暗徽文案。 */}
                {(() => {
                  const den = chDensity;
                  if (!den || den.shallowCount === 0) return null;
                  return (
                    <span
                      title={`本章 ${den.shallowCount} 个已 cite 实质页原子极稀（浅页：${den.shallowPages
                        .slice(0, 6)
                        .map((s) => `p.${s.page}(${s.atomCount}原子/${s.chars}字)`)
                        .join(" ")}）——可考密度不足；pnpm density-check -- --shallow ${c.id} 可复核`}
                      className="mono shrink-0 rounded border border-amber-300 bg-status-warn-bg px-1.5 py-0.5 text-[10px] text-status-warn"
                    >
                      浅{den.shallowCount}
                    </span>
                  );
                })()}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
