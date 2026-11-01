/**
 * T103 desk-entity-card-detail-split-01 · Seam C
 *
 * 实体卡详情正文三段（字段 · 易混点 · 知识原子）（RSC · 无 "use client"）。
 * 从 apps/web/components/EntityCardDetail.tsx :354–517 抽出。
 * CitePeek / FieldDraftLine / AtomDraftLine / CardVsStudyLink / 对页 Link 随迁；
 * 契约与 props 语义 ≡ tip。
 */

import Link from "next/link";
import type { Cite, EntityCard } from "@/lib/entities";
import CitePeek from "@/components/CitePeek";
import CardVsStudyLink from "@/components/CardVsStudyLink";
import { AtomDraftLine, FieldDraftLine } from "@/components/AtomDraftEditor";
import { atomIncomplete } from "@/lib/atom-draft";

export function EntityCardDetailBody({
  card,
  deskBookId,
  pendingCiteCount,
  confusionLinks,
  confusionAtomCounts,
  ocrMissOf,
  ocrHas,
}: {
  card: EntityCard;
  /** 书桌语境书 id（/desk/card/[id] 与 shell /entities 反查书都传）：CiteChip 有页时深链
   *  /desk?book=&page=、CitePeek 全套书桌链、易混 vs 深链 /desk/card/、练/核带 book=。 */
  deskBookId?: string;
  /** 本卡待核 cite 数（服务端 collectCiteQueue({cardId}) 计数）：0 → 诚实文案，undefined → 不预检直接可点。 */
  pendingCiteCount?: number;
  /** 易混对象名（归一化）→ 卡 id：有 deskBookId 时 vs 命中则链 /desk/card/[id]，否则纯文。 */
  confusionLinks?: Record<string, string>;
  /**
   * T48 D：卡 id → 原子数（装配侧与 confusionLinks 同一 loadCards 遍历）——「练易混卡」对
   * vs 卡 0 原子门禁：纯文「易混卡暂无原子」不进空练池；缺省当 0（fail-closed）。
   */
  confusionAtomCounts?: Record<string, number>;
  ocrMissOf: (c?: Cite) => boolean;
  ocrHas: (p: number) => boolean;
}) {
  const normName = (s: string) => s.trim().toLowerCase();

  return (
    <>
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-muted">字段</h2>
        {/* T47 F：0 字段诚实句——抽取未产出字段级信息，不渲空 dl 空壳。 */}
        {card.fields.length === 0 ? (
          <p className="mt-3 text-sm leading-7 text-muted">
            本卡暂无字段——抽取未产出字段级信息，不伪造空表。
          </p>
        ) : (
          <dl className="mt-3 space-y-3">
            {card.fields.map((f, i) => (
            <div key={i} className="rounded-lg border border-line bg-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-semibold">{f.label}</dt>
                <span className="flex shrink-0 items-baseline gap-3">
                  {/* T49 E：三处 CitePeek（字段/原子/页脚）下传本卡 pendingCiteCount（服务端
                      collectCiteQueue({cardId}) 同数）——浮层「核本卡」与主条 CardHubReturnLinks
                      同真：0 待核纯文不进空池；未装配（undefined）保持链。卡原子数无对应
                      浮层 CTA，不传假数。 */}
                  <CitePeek
                    cite={f.cite}
                    q={f.value.slice(0, 24)}
                    deskBookId={deskBookId}
                    cardId={card.id}
                    pendingCiteCount={pendingCiteCount}
                    ocrMiss={ocrMissOf(f.cite)}
                  />
                  {/* T33 E：字段 cite 有页 + 书桌语境 → 次级「对页」直跳书桌该页（与原子 T30 C 同族
                      muted 文字链，非实心；与 CitePeek 浮层内「在书桌打开」同目标，免开浮层一步）。
                      T52 H：页落在未解析 OCR（bookValidPages 已装配且不含）→ 纯文「本页无 OCR」。 */}
                  {f.cite?.page != null && deskBookId ? (
                    ocrHas(f.cite.page) ? (
                      <Link
                        href={`/desk?book=${encodeURIComponent(deskBookId)}&page=${f.cite.page}`}
                        className="text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                      >
                        对页 →
                      </Link>
                    ) : (
                      <span className="text-xs text-muted" title="该印刷页尚未解析 OCR——书桌章页定位不了">
                        本页无 OCR
                      </span>
                    )
                  ) : null}
                </span>
              </div>
              {/* T61 F：字段 value 草稿岛（最小面）——label 只读、CitePeek/对页行不动；
                  overlay 显示 + 极简编辑器只进本机草稿。 */}
              <dd className="mt-1.5">
                <FieldDraftLine cardId={card.id} fieldIndex={i} seedValue={f.value} />
              </dd>
            </div>
          ))}
          </dl>
        )}
      </section>

      {card.confusions?.length ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-muted">易混点</h2>
          <ul className="mt-3 space-y-2">
            {card.confusions.map((c, i) => {
              const vsId =
                deskBookId && confusionLinks ? confusionLinks[normName(c.vs)] : undefined;
              return (
                <li
                  key={i}
                  className="rounded-lg border border-cinnabar/30 bg-cinnabar-soft/60 p-4 text-sm leading-7"
                >
                  <span className="font-semibold text-cinnabar">
                    vs{" "}
                    {vsId ? (
                      <Link
                        href={`/desk/card/${encodeURIComponent(vsId)}`}
                        className="text-cinnabar no-underline hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-cinnabar"
                      >
                        {c.vs}
                      </Link>
                    ) : (
                      c.vs
                    )}
                  </span>
                  <span className="mx-2 text-line">|</span>
                  {c.tip}
                  {/* T33 E 可选：易混对象已可深链 + 书桌语境 → muted「练易混卡」直跳该卡练面
                      （次级文字，非第二颗实心；与卡枢纽「练这张卡」同目标，免绕卡页一步）。
                      T35 B：显式 mode=all。
                      T39 D：Server 组件不能挂 onClick——换薄客户端岛 CardVsStudyLink，
                      点前 saveReturn 回**当前卡**枢纽（/desk/card/<本卡 id>，与主条
                      CardHubReturnLinks 同口径）；href 由这里拼好原样传入，语义不变。
                      T48 D：atomCount 由 confusionAtomCounts 查表（vs 卡 id）——0 原子岛内降纯文。 */}
                  {vsId && deskBookId ? (
                    <CardVsStudyLink
                      href={`/study?card=${encodeURIComponent(vsId)}&book=${encodeURIComponent(deskBookId)}&mode=all`}
                      fromCardId={card.id}
                      fromCardName={card.name_zh}
                      atomCount={confusionAtomCounts?.[vsId] ?? 0}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-muted">知识原子（{card.atoms.length}）</h2>
        {/* T47 F：零原子诚实句——对齐卡枢纽/瓷砖「暂无原子」语义（练不进空池），不渲空 ol 空壳。 */}
        {card.atoms.length === 0 ? (
          <p className="mt-3 text-sm leading-7 text-muted">
            本卡暂无知识原子——学习环不会为它出题（卡枢纽/瓷砖的「练」同为「暂无原子」不可点）。
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {card.atoms.map((a) => (
            <li key={a.id} className="rounded-lg border border-line p-4">
              {/* T61 E：原子行草稿岛（客户端）——显示 seed ⊕ draft overlay 的 prompt/answer；
                  有真改动草稿 → 琥珀「已改草稿」旁挂；seed 口径空 prompt/answer → 「待补草稿」
                  入口；「编辑草稿」展开编辑器（prompt/answer/cite.quote 可编，id/difficulty/
                  cite.page 只读）。下方 cite 行（CitePeek + 对页）保持服务端渲染，契约不变。 */}
              <AtomDraftLine
                cardId={card.id}
                atomId={a.id}
                seedPrompt={a.prompt}
                seedAnswer={a.answer}
                seedDifficulty={a.difficulty}
                seedCitePage={a.cite?.page ?? null}
                seedCiteQuote={a.cite?.quote}
                incomplete={atomIncomplete(a)}
              />
              {a.cite ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <CitePeek
                    cite={a.cite}
                    q={a.answer.slice(0, 24)}
                    deskBookId={deskBookId}
                    cardId={card.id}
                    pendingCiteCount={pendingCiteCount}
                    ocrMiss={ocrMissOf(a.cite)}
                  />
                  {/* T30 C：原子 cite 有页 + 书桌语境 → 次级「对页」直跳书桌该页（muted 文字链，
                      非实心；与 CitePeek 浮层内「在书桌打开」同目标，这里免开浮层一步）。
                      T52 H：页落在未解析 OCR → 纯文「本页无 OCR」（同字段/页脚三处同真）。 */}
                  {a.cite.page != null && deskBookId ? (
                    ocrHas(a.cite.page) ? (
                      <Link
                        href={`/desk?book=${encodeURIComponent(deskBookId)}&page=${a.cite.page}`}
                        className="text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                      >
                        对页 →
                      </Link>
                    ) : (
                      <span className="text-xs text-muted" title="该印刷页尚未解析 OCR——书桌章页定位不了">
                        本页无 OCR
                      </span>
                    )
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
          </ol>
        )}
      </section>
    </>
  );
}
