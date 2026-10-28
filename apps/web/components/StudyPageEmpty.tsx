import Link from "next/link";
import type { StudyPageScope } from "@/lib/study-page-scope";
import ReturnNav from "@/components/desk/ReturnNav";
import CrossScopeReturnLink from "@/components/desk/CrossScopeReturnLink";

/**
 * T98 desk-study-page-split-01：/study 空态正文——自 app/(desk)/study/page.tsx StudyBody
 * JSX 的 atoms.length === 0 分支（原 :632–755）机械抽出：孤儿页（暗页/普通）/ 卡出界 /
 * 无书全局 / 真无原子四型正文 + 底部 CTA 行（回本卡·核本卡 / 放宽主 CTA / ReturnNav）。
 * 文案/CTA/href 逐字搬迁（仅换文件）；RSC，无 "use client"。禁 empty-CTA densify、
 * 不新增主 CTA；数据一律来自 study-page-scope 模型（禁第二套口径）。
 */
export default function StudyPageEmpty({ scope }: { scope: StudyPageScope }) {
  const {
    activeBook,
    effChapter,
    scopedCard,
    pageNum,
    orphanStudy,
    cardOutOfRange,
    scopeBook,
    heyeItems,
    qs,
    cardHref,
    reviewHref,
    deskHref,
    deskPageHint,
    scopeBookValidPages,
    studyReturnTo,
    pageOwner,
    pageExam,
  } = scope;
  return (
    <div className="mt-8">
      {/* T43 B 空态正文分型：孤儿页/卡出界不把 /ingest 写成主因——各自点名真实原因与放宽，
          真无原子（非孤儿、非出界）才保留 /ingest 说明。 */}
      {orphanStudy ? (
        pageExam?.hint === "dark" ? (
          /* T58 D：暗页 orphan 分型——本页有实质 OCR 却零 cite：不是页上没教材，
             是抽出未覆盖；点名字数 + 放宽/回 /ingest 复核（不新增主 CTA，放宽链保持）。 */
          <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
            本页有实质 OCR（{pageExam.chars} 字）却无任何卡 cite（暗页）——不是页上没教材，
            是抽出未覆盖。可清本页放宽到
            {effChapter ? effChapter.title : (activeBook?.title ?? "全部书目")}
            再练，或回{" "}
            <Link className="text-cinnabar underline underline-offset-4" href="/ingest">
              /ingest
            </Link>{" "}
            看暗页条与重抽命令
            {pageOwner?.chapterId ? (
              <>
                （<span className="mono">pnpm page-check -- --dark {pageOwner.chapterId}</span>）
              </>
            ) : null}
            。
          </p>
        ) : (
          <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
            本页 p.{pageNum} 暂无可练知识原子——不是教材没导入，是这一印刷页没有卡引用它。
            {pageExam?.hint === "sparse"
              ? " 另：本页 OCR 偏稀（不足 40 字），空/稀页常为分隔页或漏扫。"
              : ""}
            清本页放宽到{effChapter ? effChapter.title : (activeBook?.title ?? "全部书目")}
            再练；同范围的核侧计数在上方进度条。
          </p>
        )
      ) : cardOutOfRange ? (
        <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
          卡《{scopedCard?.name_zh}》不在当前 book / chapter
          {pageNum != null ? " / page" : ""} 范围内——这里练不出它的原子。
          回本卡直接练{pageNum != null ? "，或清本页放宽" : "，或换更宽的范围"}。
        </p>
      ) : !scopeBook && !effChapter ? (
        /* T52 F：无书全局空态（/study 裸访问，无 card/book/chapter）——不装「换更宽范围」
           假话（范围已是全部），也不出裸假书链；引导与 Clew 无书冷启动句同真：
           导入 → 书架 → 打开一本书。回程只有下方 ReturnNav 的真实 /desk。 */
        <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
          书库还没有可练的知识原子——先到{" "}
          <Link className="text-cinnabar underline underline-offset-4" href="/ingest">
            /ingest
          </Link>{" "}
          导入并注册教材，再从书架打开一本书。
        </p>
      ) : (
        <p className="border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
          这个范围还没有知识原子。先到{" "}
          <Link className="text-cinnabar underline underline-offset-4" href="/ingest">
            /ingest
          </Link>{" "}
          上传并解析教材，或换一个更宽的范围。
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-5">
        {cardHref ? (
          <>
            <Link
              href={cardHref}
              className="text-sm text-cinnabar no-underline hover:underline underline-offset-4"
            >
              回本卡 →
            </Link>
            {/* T42 B：Server 页不能挂 onClick——「核本卡」换 CrossScopeReturnLink 岛，
                点前 saveReturn（returnTo=studyReturnTo，与页头 Strip/sticky 交叉同一份）；
                className 对齐相邻「回本卡」次级 text-sm 链。
                T51 I：空原子分支同门禁——heyeItems（= reviewHref 同族 card/page 池）
                ===0 → 宿主三元降纯文「本卡暂无待核」，不走岛（纯文无 href 不写 return）。 */}
            {heyeItems.length > 0 ? (
              <CrossScopeReturnLink
                href={reviewHref}
                returnTo={studyReturnTo}
                className="text-sm text-muted no-underline hover:text-cinnabar"
              >
                核本卡 →
              </CrossScopeReturnLink>
            ) : (
              <span className="text-sm text-muted" title="本卡暂无待核 cite">
                本卡暂无待核
              </span>
            )}
          </>
        ) : null}
        {/* T27 C：本页空 → 主 CTA 优先放宽（清 page 留 chapter/book，一颗实心）；
            非本页范围才走 T20 章程恢复主 CTA。T43 A：放宽目标按 effChapter 实口径说。 */}
        {pageNum != null ? (
          <Link
            href={`/study${qs({ clearPage: true })}`}
            className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
          >
            {effChapter ? "换到本章全部 →" : activeBook ? "换到本书全部 →" : "换到全部书目 →"}
          </Link>
        ) : !scopedCard && (effChapter || activeBook) ? (
          effChapter ? (
            <Link
              href={`/study${qs({ chapter: null })}`}
              className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
            >
              换到全部章节 →
            </Link>
          ) : (
            <Link
              href="/study"
              className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
            >
              看全部书目 →
            </Link>
          )
        ) : null}
        {/* T23 A：范围空回书桌本页 / 回书桌 + 回到刚才（次级文字链，主 CTA 已在上面）。*/}
        <ReturnNav
          bookId={scopeBook?.id}
          pageHint={deskPageHint}
          deskHref={deskHref}
          validPages={scopeBookValidPages}
          showReturn
        />
      </div>
    </div>
  );
}
