import Link from "next/link";
import type { EntityCard } from "@/lib/entities";
import CitePeek from "@/components/CitePeek";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import CardHubReturnLinks from "@/components/CardHubReturnLinks";
import CardVsStudyLink from "@/components/CardVsStudyLink";
import DeskOpenReturnLink from "@/components/DeskOpenReturnLink";
import { withQsMode } from "@/lib/qs-mode";
import { deskPageHref as buildDeskPageHref, pageInOcr } from "@/lib/ocr-page";

const DIFF_ZH = { what: "识记", why: "机制", case: "应用" } as const;

/** 本卡全部 cite 来源的诚实汇总（cites + fields[].cite + atoms[].cite，按 page|verified|quote 去重）。 */
function citeStats(card: EntityCard): {
  total: number;
  paged: number;
  nullPage: number;
  unverified: number;
} {
  const seen = new Set<string>();
  let paged = 0;
  let nullPage = 0;
  let unverified = 0;
  const all = [
    ...card.cites,
    ...card.fields.map((f) => f.cite),
    ...card.atoms.map((a) => a.cite),
  ];
  for (const c of all) {
    if (!c) continue;
    const qk = (c.quote ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
    const key = `${c.page ?? "?"}|${c.verified ? 1 : 0}|${qk}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (c.page == null) nullPage++;
    else paged++;
    if (c.verified === false) unverified++;
  }
  return { total: paged + nullPage, paged, nullPage, unverified };
}

/** 本卡首个有页 cite 页码（cites → fields → atoms；全无页 → null）：「在书桌打开本页」定位用。 */
function firstPagedCitePage(card: EntityCard): number | null {
  for (const c of card.cites) if (c.page != null) return c.page;
  for (const f of card.fields) if (f.cite?.page != null) return f.cite.page;
  for (const a of card.atoms) if (a.cite?.page != null) return a.cite.page;
  return null;
}

/**
 * 实体卡详情正文：/entities/[id]（shell-01）与 /desk/card/[id]（书桌 DocumentPane）共用。
 * CiteChip 语义不变：有 page → p.N（verified:false 仍琥珀虚线）；page:null → p.?。
 * desk-card-hub-01：上方加「练 / 核」枢纽动作条与 cite 诚实条——本卡不是死胡同详情，
 * 而是能练、能核、能回章页的连续面单元；诚实条只汇总 seed 自带 verified 标记，
 * 绝不把「本机核页 localStorage 态」伪造成教材抽查结论。
 */
export function EntityCardDetail({
  card,
  backHref,
  backLabel,
  deskBookId,
  deskCardHref,
  pendingCiteCount,
  confusionLinks,
  confusionAtomCounts,
  heyePoolKeys,
  bookValidPages,
  openDeskReturnTo,
  returnTo,
}: {
  card: EntityCard;
  backHref: string;
  backLabel: string;
  /** 书桌语境书 id（/desk/card/[id] 与 shell /entities 反查书都传）：CiteChip 有页时深链
   *  /desk?book=&page=、CitePeek 全套书桌链、易混 vs 深链 /desk/card/、练/核带 book=。 */
  deskBookId?: string;
  /** T30 B：shell /entities 传入「在书桌打开本卡 →」（/desk/card/<id>）——次级文字链，
   *  不加第二颗实心（主 CTA 仍是「练这张卡」）；desk 卡页自身不传（已在卡面）。 */
  deskCardHref?: string;
  /** 本卡待核 cite 数（服务端 collectCiteQueue({cardId}) 计数）：0 → 诚实文案，undefined → 不预检直接可点。 */
  pendingCiteCount?: number;
  /** 易混对象名（归一化）→ 卡 id：有 deskBookId 时 vs 命中则链 /desk/card/[id]，否则纯文。 */
  confusionLinks?: Record<string, string>;
  /**
   * T48 D：卡 id → 原子数（装配侧与 confusionLinks 同一 loadCards 遍历）——「练易混卡」对
   * vs 卡 0 原子门禁：纯文「易混卡暂无原子」不进空练池；缺省当 0（fail-closed）。
   */
  confusionAtomCounts?: Record<string, number>;
  /** 本卡核池键（服务端 collectCiteQueue({cardId}) 的 {key}）：LocalProgressStrip 按池计数。 */
  heyePoolKeys?: { key: string }[];
  /**
   * T52 H/I：该书已解析印刷页[]（服务端 loadBookValidPages()[bookId] 装配）——
   * 三处「对页」与「在书桌打开本页」的 OCR 有效性门禁：已提供且不含该页 → 纯文
   * 「本页无 OCR」（书桌章页定位不了，不装链）；含该页或缺省（未装配）→ 保持链。
   * 只做有效性，不给「对页」加 return（soft OUT）。
   */
  bookValidPages?: number[];
  /**
   * T41 D：「在书桌打开本卡 / 本页」点前 saveReturn 的回程 payload（desk 卡页=本卡枢纽；
   * shell 详情=实体列表）。Server 组件不能挂 onClick——两链换 DeskOpenReturnLink 岛消费。
   */
  openDeskReturnTo?: { href: string; label: string };
  /**
   * T41 E：透传给 CardHubReturnLinks 的可选 returnTo（shell 详情=实体列表；desk 卡页
   * 不传 → 默认本卡枢纽，既有口径不回退）。
   */
  returnTo?: { href: string; label: string };
}) {
  const stats = citeStats(card);
  /**
   * T35 A/B：卡枢纽练/核显式默认档（练 mode=all · 核 mode=open）——CardHubReturnLinks /
   * 本卡 Strip 消费同一对 href；本标签 sticky 停在非默认空档时从卡面进练/核仍落可见池。
   */
  const studyHref = deskBookId
    ? `/study?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(deskBookId)}&mode=all`
    : `/study?card=${encodeURIComponent(card.id)}&mode=all`;
  const reviewHref = deskBookId
    ? `/review?card=${encodeURIComponent(card.id)}&book=${encodeURIComponent(deskBookId)}&mode=open`
    : `/review?card=${encodeURIComponent(card.id)}&mode=open`;
  const normName = (s: string) => s.trim().toLowerCase();
  /** 「在书桌打开本页」（仅书桌语境 + 首个有页 cite）：/desk?book=&page= 章页定位。 */
  const firstPage = firstPagedCitePage(card);
  /**
   * T52 H → T53 I：迁移共享 helper（lib/ocr-page 的 pageInOcr / deskPageHref）——契约不变：
   * bookValidPages 未装配（缺省）不门禁（保持链）；已装配且不含该页 → 该页定位不了，
   * 纯文不装链。三处「对页」继续经 ocrHas（= pageInOcr 薄别名），不出现第二套判定。
   */
  const ocrHas = (p: number) => pageInOcr(bookValidPages, p);
  const deskPageKnown = firstPage != null && ocrHas(firstPage);
  const deskPageHref = buildDeskPageHref(deskBookId, firstPage, bookValidPages);

  return (
    <>
      <Link href={backHref} className="text-sm text-muted no-underline hover:text-cinnabar">
        {backLabel}
      </Link>

      <header className="brand-rule mt-4 pb-4">
        <h1 className="text-3xl font-bold">{card.name_zh}</h1>
        {card.name_en && <p className="mono mt-1 text-sm text-muted">{card.name_en}</p>}
        {card.aliases?.length ? (
          <p className="mt-1 text-sm text-muted">又称：{card.aliases.join(" · ")}</p>
        ) : null}
        <p className="mt-3 text-lg leading-7">{card.one_liner}</p>
      </header>

      {/* 枢纽动作条：练这张卡 → /study?card= · 核本卡 → /review?card=（朱红主 CTA 只给「练」）。 */}
      <section
        aria-label="本卡操作"
        className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-card px-4 py-3"
      >
        <CardHubReturnLinks
          studyHref={studyHref}
          reviewHref={reviewHref}
          cardId={card.id}
          cardName={card.name_zh}
          atomCount={card.atoms.length}
          pendingCiteCount={pendingCiteCount}
          deskBookId={deskBookId}
          returnTo={returnTo}
        />
        {/* T41 D：Server 组件不能挂 onClick——「在书桌打开本卡/本页」换 DeskOpenReturnLink
            岛，点前 saveReturn（openDeskReturnTo 父传：desk 卡页=本卡 · shell=实体列表；
            缺省不写，行为与前同）。 */}
        {deskCardHref ? (
          <DeskOpenReturnLink href={deskCardHref} returnTo={openDeskReturnTo}>
            在书桌打开本卡 →
          </DeskOpenReturnLink>
        ) : null}
        {deskPageHref ? (
          <DeskOpenReturnLink href={deskPageHref} returnTo={openDeskReturnTo}>
            在书桌打开本页 →
          </DeskOpenReturnLink>
        ) : null}
        {/* T52 H：首个有页 cite 落在未解析 OCR 页（bookValidPages 已装配且不含）→
            「在书桌打开本页」降纯文「本页无 OCR」，不链进定位不了的章页。 */}
        {deskBookId && firstPage != null && !deskPageKnown ? (
          <span className="text-xs text-muted" title="该印刷页尚未解析 OCR——书桌章页定位不了">
            本页无 OCR
          </span>
        ) : null}
        <p className="w-full text-xs leading-6 text-muted">
          练：本卡 {card.atoms.length} 个原子逐个自评；核：把引用对着该页 OCR 原文核对。
          两者的进度都只记本机浏览器，不回写教材数据。
        </p>
      </section>

      {/* cite 诚实条：有页 / p.? / seed 抽查未核计数；明确 seed verified ≠ 本机核页 localStorage 态。 */}
      <section
        aria-label="引用状态"
        className="mt-4 rounded-lg border border-line bg-card px-4 py-3 text-sm leading-7"
      >
        {stats.total > 0 ? (
          <>
            <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-muted">引用 {stats.total} 处</span>
              <span className="text-muted">
                有页 <span className="mono font-medium text-foreground">{stats.paged}</span>
              </span>
              <span className={stats.nullPage > 0 ? "text-status-warn" : "text-muted"}>
                无页 p.?{" "}
                <span className={`mono font-medium ${stats.nullPage > 0 ? "text-status-warn" : "text-foreground"}`}>
                  {stats.nullPage}
                </span>
              </span>
              <span className={stats.unverified > 0 ? "text-status-warn" : "text-muted"}>
                教材抽查未核{" "}
                <span className={`mono font-medium ${stats.unverified > 0 ? "text-status-warn" : "text-foreground"}`}>
                  {stats.unverified}
                </span>
              </span>
            </p>
            <p className="mt-1 text-xs leading-6 text-muted">
              「抽查未核」是教材数据（seed）自带的 verified 标记，未经本机对页——不计为已核；
              你在核页标「本机已对」只存本浏览器，与这里的数字互不写入。本卡核页状态不在此条伪造。
            </p>
          </>
        ) : (
          <p className="text-muted">本卡暂无引用记录（卡引用 / 字段 / 原子均无 cite）。</p>
        )}
      </section>

      {/* 跨面本机进度：本卡原子（练）+ 本卡核池（核）；条末弱链进同范围练/核（不重复动作条主 CTA）。
          T36 C：本卡池分段可点——三档从条末 studyHref/reviewHref（?card=&book=&mode=* 同族）
          mode-swap 派生，N=0 / 无池分段纯文。
          T39 E：returnTo 回本卡枢纽（有 deskBookId 时 /desk/card/<id> · label 卡《name》，
          与主条 CardHubReturnLinks / 练易混卡岛同口径）——条末练/核与 N>0 分段点前写 return；
          shell 无书语境不写，行为与前同。 */}
      <LocalProgressStrip
        atoms={card.atoms.map((a) => ({ cardId: card.id, atomId: a.id }))}
        items={heyePoolKeys}
        scopeLabel="本卡"
        studyHref={studyHref}
        reviewHref={reviewHref}
        returnTo={
          deskBookId
            ? { href: `/desk/card/${encodeURIComponent(card.id)}`, label: `卡《${card.name_zh}》` }
            : undefined
        }
        studyModeHrefs={{
          all: withQsMode(studyHref, "all"),
          unknown: withQsMode(studyHref, "unknown"),
          ungraded: withQsMode(studyHref, "ungraded"),
        }}
        heyeModeHrefs={{
          open: withQsMode(reviewHref, "open"),
          checked: withQsMode(reviewHref, "checked"),
          doubt: withQsMode(reviewHref, "doubt"),
        }}
      />

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
                  />
                  {/* T33 E：字段 cite 有页 + 书桌语境 → 次级「对页」直跳书桌该页（与原子 T30 C 同族
                      muted 文字链，非实心；与 CitePeek 浮层内「在书桌打开」同目标，免开浮层一步）。
                      T52 H：页落在未解析 OCR（bookValidPages 已装配且不含）→ 纯文「本页无 OCR」。 */}
                  {f.cite?.page != null && deskBookId ? (
                    ocrHas(f.cite.page) ? (
                      <Link
                        href={`/desk?book=${encodeURIComponent(deskBookId)}&page=${f.cite.page}`}
                        className="text-xs text-muted no-underline hover:text-cinnabar"
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
              <dd className="mt-1.5 text-sm leading-7 text-foreground/90">{f.value}</dd>
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
                        className="text-cinnabar no-underline hover:underline underline-offset-4"
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
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-medium leading-7">
                  <span className="mono mr-2 align-middle text-[11px] text-muted">{a.id}</span>
                  {a.prompt}
                </p>
                <span className="mono shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
                  {DIFF_ZH[a.difficulty]}
                </span>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer select-none text-sm text-muted hover:text-cinnabar">
                  显示答案
                </summary>
                <p className="mt-2 border-l-2 border-cinnabar/40 pl-3 text-sm leading-7">
                  {a.answer}
                </p>
              </details>
              {a.cite ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <CitePeek
                    cite={a.cite}
                    q={a.answer.slice(0, 24)}
                    deskBookId={deskBookId}
                    cardId={card.id}
                    pendingCiteCount={pendingCiteCount}
                  />
                  {/* T30 C：原子 cite 有页 + 书桌语境 → 次级「对页」直跳书桌该页（muted 文字链，
                      非实心；与 CitePeek 浮层内「在书桌打开」同目标，这里免开浮层一步）。
                      T52 H：页落在未解析 OCR → 纯文「本页无 OCR」（同字段/页脚三处同真）。 */}
                  {a.cite.page != null && deskBookId ? (
                    ocrHas(a.cite.page) ? (
                      <Link
                        href={`/desk?book=${encodeURIComponent(deskBookId)}&page=${a.cite.page}`}
                        className="text-xs text-muted no-underline hover:text-cinnabar"
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

      <footer className="mt-10 border-t border-line pt-4 text-sm text-muted">
        引用：{" "}
        {card.cites.map((c, i) => (
          <span key={i} className="mr-2 inline-flex items-center gap-1">
            <CitePeek
              cite={c}
              deskBookId={deskBookId}
              cardId={card.id}
              pendingCiteCount={pendingCiteCount}
            />
            {/* T33 E：页脚 cite 有页 + 书桌语境 → 次级「对页」（字段/原子同真，同卡不互谎）。
                T52 H：页落在未解析 OCR → 纯文「本页无 OCR」（三处对页同一判定）。 */}
            {c.page != null && deskBookId ? (
              ocrHas(c.page) ? (
                <Link
                  href={`/desk?book=${encodeURIComponent(deskBookId)}&page=${c.page}`}
                  className="text-xs text-muted no-underline hover:text-cinnabar"
                >
                  对页 →
                </Link>
              ) : (
                <span className="text-xs text-muted" title="该印刷页尚未解析 OCR——书桌章页定位不了">
                  本页无 OCR
                </span>
              )
            ) : null}
            {c.quote ? <span className="text-xs">“{c.quote}”</span> : null}
          </span>
        ))}
      </footer>
    </>
  );
}
