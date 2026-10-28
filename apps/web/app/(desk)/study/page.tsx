import { Suspense } from "react";
import { loadBooks, loadChapters } from "@/lib/entities";
import {
  buildStudyPageScope,
  type StudyPageSearchParams,
} from "@/lib/study-page-scope";
import StudySession from "@/components/StudySession";
import StudyPageChrome from "@/components/StudyPageChrome";
import StudyPageEmpty from "@/components/StudyPageEmpty";

export const dynamic = "force-dynamic";

const DIFF_ZH = { what: "识记", why: "机制", case: "应用" } as const;

/**
 * /study 学习 · 本机自评（desk-study-01，DeskShell 内）。
 * 这里不做 FSRS 到期调度：队列是「全部｜未评｜不熟再练」的本机态过滤，
 * 评分只写浏览器 localStorage（ariadne.study.v1），跨刷新保留，绝不回写 seed。
 * desk-card-hub-01：支持 ?card= 收窄到单卡（卡枢纽「练这张卡」入口）；
 * 页头显示卡名，完成/空态可回本卡、核本卡。
 *
 * T98 desk-study-page-split-01：本文件收口为编排器——服务端装配（T20–T60 全部派生
 * 口径逐字）→ lib/study-page-scope 的 buildStudyPageScope；页铬 → StudyPageChrome；
 * 空态正文 → StudyPageEmpty。default export 路径、StudyBody、force-dynamic 与
 * StudySession 消费 props 语义守恒（StudySession.tsx 零触）。
 */
export default function StudyPage({
  searchParams,
}: {
  searchParams: Promise<StudyPageSearchParams>;
}) {
  const chapters = loadChapters();
  const books = loadBooks();
  return (
    <Suspense fallback={<p className="px-8 py-10 text-muted">加载中…</p>}>
      <StudyBody searchParams={searchParams} chapters={chapters} books={books} />
    </Suspense>
  );
}

async function StudyBody({
  searchParams,
  chapters,
  books,
}: {
  searchParams: Promise<StudyPageSearchParams>;
  chapters: ReturnType<typeof loadChapters>;
  books: ReturnType<typeof loadBooks>;
}) {
  /** T98：装配单点——scope 模型供 Chrome / Empty / StudySession 三方同源消费。 */
  const scope = buildStudyPageScope(await searchParams, chapters, books);
  const {
    atoms,
    mode,
    activeBook,
    bookByChapter,
    scopeBook,
    heyeItems,
    studyScopeKey,
    scopeLabel,
    deskHref,
    reviewHref,
    cardHref,
    qs,
    widenPageHref,
    deskPageHint,
    stickyKeys,
    scopeBookValidPages,
    studyReturnTo,
    examCoverage,
  } = scope;
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <StudyPageChrome scope={scope} />
      {atoms.length === 0 ? (
        <StudyPageEmpty scope={scope} />
      ) : (
        <StudySession
          key={studyScopeKey}
          scopeKey={studyScopeKey}
          atoms={atoms}
          scopeLabel={scopeLabel}
          diffLabel={DIFF_ZH}
          mode={mode}
          activeBookId={activeBook?.id}
          bookByChapter={bookByChapter}
          deskHref={deskHref}
          reviewHref={reviewHref}
          /* T51 I：交叉核链对侧真池——heyeItems（card/page 过滤的 collectCiteQueue，与
             reviewHref / progressReview 同族同范围；无页时即 stripItemKeys 同池）；
             缺省/解析不出当 0 fail-closed，不造假正数。 */
          pendingCount={heyeItems.length}
          cardHref={cardHref}
          allHref={`/study${qs({ mode: "all" })}`}
          unknownHref={`/study${qs({ mode: "unknown" })}`}
          ungradedHref={`/study${qs({ mode: "ungraded" })}`}
          widenPageHref={widenPageHref}
          deskPageHint={deskPageHint}
          deskBookId={scopeBook?.id}
          loopKeys={stickyKeys}
          validPages={scopeBookValidPages}
          leaveReturnTo={studyReturnTo}
          /* T58 E/I：scope 可考覆盖旁挂（单卡/未检 → weak=false 不吵）——完成态琥珀
             一行「评完池 ≠ 材料可考完」；不改完成主 CTA，不写 verified。 */
          examinableWeak={examCoverage?.weak ?? false}
          darkCount={examCoverage?.darkCount ?? 0}
          /* T60 E/I：scope 浅密度旁挂（densityWeak 且 shallowCount>0 才出）——完成态
             另一句琥珀「评完池 ≠ 可考够」；与 T58 暗句并列不互吞；不 PATCH entities。 */
          densityWeak={examCoverage?.densityWeak ?? false}
          shallowCount={examCoverage?.shallowCount ?? 0}
        />
      )}
    </div>
  );
}
