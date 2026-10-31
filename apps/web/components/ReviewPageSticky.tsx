import Link from "next/link";
import type { ReviewPageScope } from "@/lib/review-page-scope";
import StickyPageLoopKeys from "@/components/desk/StickyPageLoopKeys";
import StickyHeYeModeTabs from "@/components/desk/StickyHeYeModeTabs";
import ReturnNav from "@/components/desk/ReturnNav";
import CrossScopeReturnLink from "@/components/desk/CrossScopeReturnLink";
import SessionKeyHint from "@/components/SessionKeyHint";

/**
 * T99 desk-review-page-split-01：/review sticky 工具带——自 app/(desk)/review/page.tsx
 * ReviewBody JSX（原 :497–602）机械抽出：StickyPageLoopKeys + sticky div 整块（本页
 * pill · 清本页 / 章芯片 / StickyHeYeModeTabs / ReturnNav + CrossScopeReturnLink / SessionKeyHint）。
 * JSX/文案/className/href 构造逐字搬迁（仅换文件）；RSC，无 "use client"。
 * 数据一律来自 review-page-scope 模型（禁第二套口径）。
 */
export default function ReviewPageSticky({ scope }: { scope: ReviewPageScope }) {
  const {
    card,
    pageNum,
    chipChapters,
    prevChapterHref,
    nextChapterHref,
    clearPageHref,
    effChapter,
    qs,
    mode,
    items,
    scopeBook,
    deskPageHref,
    deskHref,
    cardHref,
    scopeBookValidPages,
    progressStudyHref,
    reviewReturnTo,
    stripAtoms,
    stickyKeys,
  } = scope;

  return (
    <>
      {/* T28 F：sticky 键盘岛——g 聚焦「清本页」，⇧[ / ⇧] 按章芯片顺序切章（切章即离页）；
          题内裸 [ / ] 回看/前进归 HeYeSession 自己的键盘环，本岛不拦截。 */}
      <StickyPageLoopKeys
        clearPageSelector={pageNum != null && !card ? "a[data-sticky-clear-page]" : undefined}
        prevChapterHref={!card && chipChapters.length > 0 ? prevChapterHref : undefined}
        nextChapterHref={!card && chipChapters.length > 0 ? nextChapterHref : undefined}
      />
      {/* T21 D：章芯片行 + 三档 tablist 收进 position:sticky 实底工具带（bg-card + border-b）。
          仅 CSS 钉住——长队列下滚时章芯片/档位仍可见；与 T20 StickyModeGate（URL 档位记忆 replace 补档）
          职责正交，各司其职，勿删 StickyModeGate。 */}
      <div className="sticky top-0 z-10 -mx-8 mt-6 border-b border-line bg-card px-8 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* T28 A：本页范围铬（与 study 同族 pill）+「清本页」（只删 page，留书/章/档；改档留页）。 */}
          {clearPageHref && !card ? (
            <span className="flex items-center gap-2">
              <span
                aria-current="true"
                className="rounded-full border border-cinnabar bg-cinnabar-soft px-3 py-1 text-sm text-cinnabar"
              >
                本页 p.{pageNum}
              </span>
              <Link
                href={clearPageHref}
                data-sticky-clear-page=""
                aria-keyshortcuts="g"
                className="text-xs text-muted no-underline transition-colors hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
              >
                清本页 →
              </Link>
            </span>
          ) : null}
          {/* 章过滤（对齐 study；单卡范围固定，隐藏章芯片）。 */}
          {!card && chipChapters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/review${qs({ chapter: null })}`}
                className={`rounded-full border px-3 py-1 text-sm no-underline ${
                  !effChapter
                    ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                    : "border-line text-muted hover:text-foreground"
                }`}
              >
                全部章节
              </Link>
              {chipChapters.map((c) => (
                <Link
                  key={c.id}
                  href={`/review${qs({ chapter: c.id })}`}
                  className={`rounded-full border px-3 py-1 text-sm no-underline ${
                    effChapter?.id === c.id
                      ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                      : "border-line text-muted hover:text-foreground"
                  }`}
                >
                  {c.id}
                </Link>
              ))}
            </div>
          ) : null}

          {/* 本机三档：待核 | 已对 | 存疑（本机态过滤，非 FSRS；对齐 study 呼吸感）。
              T41 B：抽薄客户端岛 StickyHeYeModeTabs（对称 study）——N=0 且非当前档纯文
              不可点（与 HeYeModeChips/HeYeScopeCounts 同池同口径；当前档恒指示），
              tab chrome 不变。 */}
          <StickyHeYeModeTabs
            mode={mode}
            items={items}
            hrefs={{
              open: `/review${qs({ mode: "open" })}`,
              checked: `/review${qs({ mode: "checked" })}`,
              doubt: `/review${qs({ mode: "doubt" })}`,
            }}
          />

          {/* T23 D + T32 D：sticky 工具带回程（对称 study）改用 ReturnNav——回本卡 / 回书桌
              本页（pageHint 仅 deskPageHref 可解析时给，孤儿不给页 hint）/ lastOpened 回落页
              经该书 validPages 消毒；showReturn=false 与 study sticky 同（「回到刚才」归
              HeYeSession 空/完成态，勿在此重复）。 */}
          <div className="flex items-center gap-3">
            <ReturnNav
              bookId={scopeBook?.id}
              pageHint={deskPageHref ? pageNum : null}
              deskHref={deskHref}
              cardHref={cardHref}
              validPages={scopeBookValidPages}
              showReturn={false}
            />
            {/* T33 A：交叉弱链的 sticky 延伸（对称 study）——长队列滚离页头后仍能去同范围练；
                muted 次级文字（非第二颗实心朱红），href 与页头 Strip 同一 progressStudyHref。
                T40 C：Server 页不能挂 onClick——换薄客户端岛 CrossScopeReturnLink，
                点前 saveReturn（payload=reviewReturnTo，与页头 Strip 同一来源）。
                T51 H：对侧（练）池 0 → 纯文「同范围暂无原子」（stripAtoms 与页头 Strip /
                Bridge progress* 同源，fail-closed）；>0 保持链 + return。 */}
            <CrossScopeReturnLink
              href={progressStudyHref}
              returnTo={reviewReturnTo}
              emptyLabel={stripAtoms.length === 0 ? "同范围暂无原子" : undefined}
            >
              去练同范围 →
            </CrossScopeReturnLink>
          </div>

          {/* T28 F：本页环键说明（与练/核底栏 SessionKeyHint 同族，只列当前实际可用的键）。 */}
          {stickyKeys.length > 0 ? <SessionKeyHint keys={stickyKeys} /> : null}
        </div>
      </div>
    </>
  );
}
