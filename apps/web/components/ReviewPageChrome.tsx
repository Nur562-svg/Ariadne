import Link from "next/link";
import type { ReviewPageScope } from "@/lib/review-page-scope";
import { withQsMode } from "@/lib/qs-mode";
import HeYeScopeCounts from "@/components/HeYeScopeCounts";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import DeskSurfaceBridge from "@/components/desk/DeskSurfaceBridge";
import StickyModeGate from "@/components/desk/StickyModeGate";
import LastOpenedTouch from "@/components/LastOpenedTouch";

/**
 * T99 desk-review-page-split-01：/review 页铬——自 app/(desk)/review/page.tsx ReviewBody
 * JSX（原 :327–495，外层 max-w-5xl 包装 div 留 page）机械抽出：Clew 薄桥 · sticky 档位
 * 门 · 续开轻触 · 页头（标题/说明/坏 QS 琥珀/范围计数/进度条）。
 * JSX/文案/className/href 构造逐字搬迁（仅换文件）；RSC，无 "use client"。
 * 数据一律来自 review-page-scope 模型（禁第二套口径）。
 */
export default function ReviewPageChrome({ scope }: { scope: ReviewPageScope }) {
  const {
    bookId,
    cardId,
    pageParam,
    chapterParam,
    modeParam,
    book,
    invalidBook,
    card,
    invalidCard,
    pageNum,
    invalidPage,
    invalidMode,
    activeChapter,
    invalidChapter,
    chapterOutsideBook,
    effChapter,
    heyeStickyScope,
    items,
    scopeBook,
    orphanReview,
    scopeLabel,
    cardHref,
    deskPageHref,
    deskHref,
    qs,
    sideScopeLabel,
    stripScopeLabel,
    stripAtoms,
    stripItemKeys,
    progressStudyHref,
    progressReviewHref,
    reviewReturnTo,
  } = scope;

  return (
    <>
      {/* 核页面薄桥：Clew 会话条显示核页范围（书/章/页/卡）。
          T29 B：progress* 与页内 Strip 同一套池/标签/深链——Clew「本轮变化」compact 在核页
          也显示本章/本页收窄数字，不再掉「未定位章 · 全书本机记录」。
          T29 F：孤儿页不给 Clew 残留幽灵 p.N（头栏/建议问/stub 不提 999，会话条不深链书桌幽灵页）。 */}
      <DeskSurfaceBridge
        data={{
          surface: "review",
          book: scopeBook ? { id: scopeBook.id, title: scopeBook.title } : undefined,
          chapter: effChapter
            ? { id: effChapter.id, title: effChapter.title }
            : undefined,
          page: orphanReview ? null : pageNum,
          card: card ? { id: card.id, name_zh: card.name_zh } : undefined,
          citePages: [],
          progressAtoms: stripAtoms,
          progressItems: stripItemKeys,
          progressScopeLabel: stripScopeLabel,
          progressStudyHref: progressStudyHref,
          progressReviewHref: progressReviewHref,
        }}
      />
      {/* T20 sticky 档位：无 ?mode= 时读本标签记忆补档（replace）；有合法 ?mode= 时胜出并写回。 */}
      <StickyModeGate
        kind="heye"
        scopeKey={heyeStickyScope}
        defaultMode="open"
        nonDefaultModes={["checked", "doubt"]}
      />
      {/* T21/T23 续开指针轻触：有效范围（?book= 或 ?card= 反查书）才写同 bookId；不写非法书。
          page 合法且本页池非空时写带 page 的 deskHref，否则回落不带 page 的兜底
          （T29 F：孤儿页不把幽灵 page=999 写进续开指针，同书保留原页）。 */}
      {scopeBook ? (
        <LastOpenedTouch
          bookId={scopeBook.id}
          deskHref={deskPageHref ?? deskHref}
          page={deskPageHref ? pageNum : undefined}
        />
      ) : null}
      <header>
        <h1 className="brand-rule pb-2 text-3xl font-bold">核页 · 本机对页</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          把每条引用的 quote 对着该印刷页的 OCR 原文看一遍，标「本机已对」或「存疑」。
          进度只保存在这个浏览器；FSRS 到期调度未接入，这里不做到期复习。
        </p>
        {invalidBook ? (
          <p className="mt-2 text-sm text-status-warn">
            书库中没有 book id「{bookId}」——已按全部已解析卡统计。可从书架打开正确书目。
          </p>
        ) : null}
        {invalidCard ? (
          <p className="mt-2 text-sm text-status-warn">
            没有卡 id「{cardId}」——卡范围未生效，已按{book ? `《${book.title}》` : "全部已解析卡"}统计。
          </p>
        ) : null}
        {invalidPage ? (
          <p className="mt-2 text-sm text-status-warn">
            page 参数「{pageParam}」需为正整数——页过滤未生效，已按{scopeLabel}统计。
          </p>
        ) : null}
        {/* T28 E：合法孤儿页（零待核 cite）琥珀点名本页 + 放宽（T29 C：空态主 CTA 升「清本页」），
            不静默落到通用「这个范围没有」空态。 */}
        {orphanReview ? (
          <p className="mt-2 text-sm text-status-warn">
            本页 p.{pageNum} 暂无待核 cite——没有「有页码但未抽查」的引用落在这一印刷页；
            可清本页放宽到{sideScopeLabel}，或换到更宽的范围。
          </p>
        ) : null}
        {invalidChapter ? (
          <p className="mt-2 text-sm text-status-warn">
            没有章 id「{chapterParam}」——章过滤未生效，已按{scopeLabel}统计。
          </p>
        ) : null}
        {!invalidChapter && chapterOutsideBook ? (
          <p className="mt-2 text-sm text-status-warn">
            章「{activeChapter?.id}」不在《{book?.title}》范围内——已按全书过滤。
          </p>
        ) : null}
        {invalidMode ? (
          <p className="mt-2 text-sm text-status-warn">
            mode 参数「{modeParam}」未识别——已回落「待核」档。
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted">
          范围：{scopeLabel}
          {pageNum != null ? (
            <>
              {" "}
              · 印刷页 <span className="mono font-medium text-foreground">p.{pageNum}</span>
              {deskPageHref ? (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    href={deskPageHref}
                    className="text-cinnabar no-underline hover:underline underline-offset-4"
                  >
                    回书桌本页 →
                  </Link>
                </>
              ) : null}
            </>
          ) : null}
          {" "}· 待核 {items.length} 条
          {book || effChapter ? (
            <>
              {" "}
              ·{" "}
              <Link
                href="/review"
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                看全部 →
              </Link>
            </>
          ) : null}
          {cardHref ? (
            <>
              {" "}
              ·{" "}
              <Link
                href={cardHref}
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                回本卡 →
              </Link>
            </>
          ) : null}
          {" "}
          {/* T35 D：页头范围计数可点——与 sticky 三档 tablist / HeYeSession openHref·checkedHref·
              doubtHref 同一 qs({ mode }) 口径（保留 book/card/chapter/page）；N=0 纯文。 */}
          <HeYeScopeCounts
            items={items}
            hrefs={{
              open: `/review${qs({ mode: "open" })}`,
              checked: `/review${qs({ mode: "checked" })}`,
              doubt: `/review${qs({ mode: "doubt" })}`,
            }}
          />
        </p>
      </header>

      {/* 作用域进度（T18：同范围练+核分列；本页即核环，不重复核链）。
          T27 soft：有效 page 时练侧与 collectStudyAtoms({page}) / study Strip 同池。
          T28 B：练/核各自判本页——heye-only 页练侧回落章/书池，标签分写，与书桌同页不互谎。
          T29 B：池选择收进 stripAtoms/stripItemKeys，与 Bridge progress* 同源。
          T33 A：交叉弱链——核面只传 studyHref（progressStudyHref，与 Clew/Bridge 同源），
          不传本面 reviewHref（「核此范围」自指无意义）；孤儿页不带幽灵 page= 沿用 progress* 口径。
          T36 B（对称 study）：池分段可点——核侧三档与 HeYeScopeCounts/sticky 同一 qs({ mode })
          （保留 book/card/chapter/page）；练侧三档从 progressStudyHref mode-swap（单卡时
          progressStudyHref 即卡作用域 studyHref，withQsMode 补 mode 同族）；N=0 / 无池纯文。
          T40 B：returnTo=reviewReturnTo——条末「练此范围」与练侧 N>0 分段点前写 return，
          进练完成态「回到刚才」回本核页范围。 */}
      <LocalProgressStrip
        atoms={stripAtoms}
        items={stripItemKeys}
        scopeLabel={stripScopeLabel}
        studyHref={progressStudyHref}
        returnTo={reviewReturnTo}
        heyeModeHrefs={{
          open: `/review${qs({ mode: "open" })}`,
          checked: `/review${qs({ mode: "checked" })}`,
          doubt: `/review${qs({ mode: "doubt" })}`,
        }}
        studyModeHrefs={{
          all: withQsMode(progressStudyHref, "all"),
          unknown: withQsMode(progressStudyHref, "unknown"),
          ungraded: withQsMode(progressStudyHref, "ungraded"),
        }}
      />
    </>
  );
}
