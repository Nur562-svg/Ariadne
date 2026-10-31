import { Suspense } from "react";
import { loadBooks, loadChapters } from "@/lib/entities";
import {
  buildReviewPageScope,
  type ReviewPageSearchParams,
} from "@/lib/review-page-scope";
import HeYeSession from "@/components/HeYeSession";
import ReviewPageChrome from "@/components/ReviewPageChrome";
import ReviewPageSticky from "@/components/ReviewPageSticky";

export const dynamic = "force-dynamic";

/**
 * /review 核页 · 本机对页（desk-heye-01）。
 * 这里不做 FSRS 到期调度：队列是「有页码但 seed 未抽查 verified」的 cite，
 * 「本机已对 / 存疑」只写浏览器 localStorage（ariadne.heye.v1），绝不回写 seed JSON。
 * ?book= / ?card= / ?page= 范围过滤；无参 = 全部已解析卡（核页是数据质量工具，范围宁宽）。
 * desk-heye-batch-filter-01（T16）：?chapter= 章芯片 + ?mode= 本机三档（待核｜已对｜存疑）；
 * 服务端 collect 出全池，本机态过滤在客户端（HeYeSession）。
 *
 * T99 desk-review-page-split-01：本文件收口为编排器——服务端装配（T16–T60 全部派生
 * 口径逐字）→ lib/review-page-scope 的 buildReviewPageScope；页铬 → ReviewPageChrome；
 * sticky 工具带 → ReviewPageSticky。default export 路径、ReviewBody、force-dynamic 与
 * HeYeSession 消费 props 语义守恒（HeYeSession.tsx 零触）。
 */
export default function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<ReviewPageSearchParams>;
}) {
  const chapters = loadChapters();
  const books = loadBooks();
  return (
    <Suspense fallback={<p className="px-8 py-10 text-muted">加载中…</p>}>
      <ReviewBody searchParams={searchParams} chapters={chapters} books={books} />
    </Suspense>
  );
}

async function ReviewBody({
  searchParams,
  chapters,
  books,
}: {
  searchParams: Promise<ReviewPageSearchParams>;
  chapters: ReturnType<typeof loadChapters>;
  books: ReturnType<typeof loadBooks>;
}) {
  /** T99：装配单点——scope 模型供 Chrome / Sticky / HeYeSession 三方同源消费。 */
  const scope = buildReviewPageScope(await searchParams, chapters, books);
  const {
    heyeScopeKey,
    items,
    pages,
    scopeLabel,
    mode,
    cardHref,
    studyHref,
    emptyKind,
    crossStudyAtomCount,
    deskPageHref,
    qs,
    clearChapterHref,
    clearPageHref,
    orphanReview,
    orphanDark,
    pageShallow,
    stickyKeys,
    reviewReturnTo,
  } = scope;

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      <ReviewPageChrome scope={scope} />
      <ReviewPageSticky scope={scope} />
      <HeYeSession
        key={heyeScopeKey}
        scopeKey={heyeScopeKey}
        items={items}
        pages={pages}
        scopeLabel={scopeLabel}
        mode={mode}
        cardHref={cardHref}
        studyHref={studyHref}
        /* T52 E：池空分型（见 emptyKind 构造点）；池非空时 null 走会话主流程。 */
        emptyKind={emptyKind}
        /* T51 J：交叉练链对侧真池（见 crossStudyAtomCount 构造点），fail-closed。 */
        atomCount={crossStudyAtomCount}
        deskPageHref={deskPageHref}
        openHref={`/review${qs({ mode: "open" })}`}
        checkedHref={`/review${qs({ mode: "checked" })}`}
        doubtHref={`/review${qs({ mode: "doubt" })}`}
        clearChapterHref={clearChapterHref}
        clearPageHref={clearPageHref}
        orphanPage={orphanReview}
        /* T58 F：orphan 旁挂暗页（hint==='dark' 才 true）；分型三态与 CTA 不动。 */
        orphanDark={orphanDark}
        /* T60 F：匹配中本页浅旁挂（hint==='shallow' 才 true；非 orphan 主题）；
           无 emptyKind:'shallow'，orphan/card-out/true-empty 分型不动。 */
        pageShallow={pageShallow}
        loopKeys={stickyKeys}
        leaveReturnTo={reviewReturnTo}
      />
    </div>
  );
}