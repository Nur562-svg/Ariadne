import Link from "next/link";
import type { StudyPageScope } from "@/lib/study-page-scope";
import { withQsMode } from "@/lib/qs-mode";
import StudyScopeCounts from "@/components/StudyScopeCounts";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import SessionKeyHint from "@/components/SessionKeyHint";
import DeskSurfaceBridge from "@/components/desk/DeskSurfaceBridge";
import StickyModeGate from "@/components/desk/StickyModeGate";
import StickyPageLoopKeys from "@/components/desk/StickyPageLoopKeys";
import ReturnNav from "@/components/desk/ReturnNav";
import CrossScopeReturnLink from "@/components/desk/CrossScopeReturnLink";
import StickyStudyModeTabs from "@/components/desk/StickyStudyModeTabs";
import LastOpenedTouch from "@/components/LastOpenedTouch";

/**
 * T98 desk-study-page-split-01：/study 页铬——自 app/(desk)/study/page.tsx StudyBody
 * JSX（原 :359–629，外层 max-w-3xl 包装 div 留 page）机械抽出：Clew 薄桥 · sticky 档位
 * 门 · 续开轻触 · 页头（标题/范围说明/坏 QS 琥珀/范围计数/进度条）· sticky 工具带
 * （本页 pill + 清本页 / 章芯片 / 三档 tabs / 回程链 / 键说明）· 原子计数 · 可考覆盖
 * 暗/浅条 · 本页浅旁挂。JSX/文案/className/href 构造逐字搬迁（仅换文件）；RSC，无
 * "use client"。数据一律来自 study-page-scope 模型（禁第二套口径）。
 */
export default function StudyPageChrome({ scope }: { scope: StudyPageScope }) {
  const {
    bookId,
    chapterId,
    modeParam,
    cardId,
    pageParam,
    activeBook,
    activeChapter,
    invalidBook,
    scopedCard,
    invalidCard,
    pageNum,
    invalidPage,
    mode,
    invalidMode,
    invalidChapter,
    chapterOutsideBook,
    effChapter,
    scopeBook,
    chipChapters,
    atoms,
    orphanStudy,
    cardOutOfRange,
    studyStickyScope,
    deskPageHint,
    deskPageHrefForTouch,
    qs,
    prevChapterHref,
    nextChapterHref,
    stickyKeys,
    scopeLabel,
    deskHref,
    cardHref,
    scopeBookValidPages,
    stripAtoms,
    stripItemKeys,
    stripScopeLabel,
    progressStudyHref,
    progressReviewHref,
    studyReturnTo,
    pageOwner,
    examCoverage,
    pageExam,
  } = scope;
  return (
    <>
      {/* 学习面薄桥：Clew 会话条显示学习范围。
          T29 B：progress* 与页内 Strip 同一套池/标签/深链——Clew「本轮变化」compact 在练页
          也显示本章/本页收窄数字，不再掉「未定位章 · 全书本机记录」。
          T29 F：孤儿页不给 Clew 残留幽灵 p.N（头栏/建议问/stub 不提，会话条不深链书桌幽灵页）。 */}
      <DeskSurfaceBridge
        data={{
          surface: "study",
          book: scopeBook ? { id: scopeBook.id, title: scopeBook.title } : undefined,
          chapter: effChapter ? { id: effChapter.id, title: effChapter.title } : undefined,
          card: scopedCard ? { id: scopedCard.id, name_zh: scopedCard.name_zh } : undefined,
          page: orphanStudy ? null : (pageNum ?? undefined),
          citePages: [],
          progressAtoms: stripAtoms,
          progressItems: stripItemKeys,
          progressScopeLabel: stripScopeLabel,
          progressStudyHref: progressStudyHref,
          progressReviewHref: progressReviewHref,
        }}
      />
      {/* T20 sticky 档位：无 ?mode= 时读本标签记忆补档（replace，不整页刷新）；有合法 ?mode= 时胜出并写回。 */}
      <StickyModeGate
        kind="study"
        scopeKey={studyStickyScope}
        defaultMode="all"
        nonDefaultModes={["ungraded", "unknown"]}
      />
      {/* T21 续开指针轻触：有效范围（?book= 或 ?card= 反查书）才写同 bookId；不写非法书。
          有页（本卡 cite）则写精确页；无页保持「同书保留原页」，禁止空 page 擦掉书桌精确页。 */}
      {scopeBook ? (
        <LastOpenedTouch bookId={scopeBook.id} deskHref={deskPageHrefForTouch} page={deskPageHint} />
      ) : null}
      <header>
        <h1 className="brand-rule pb-2 text-3xl font-bold">学习 · 本机自评</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {scopeLabel} · 看问题 → 回想 → 自评「认识 / 不熟」。FSRS 到期调度未接入，这里不做到期复习；
          进度只保存在这个浏览器（localStorage），跨刷新保留。
        </p>
        {invalidBook ? (
          <p className="mt-2 text-sm text-status-warn">
            书库中没有 book id「{bookId}」——已按全部已注册书目出题。可从书架打开正确书目。
          </p>
        ) : null}
        {invalidCard ? (
          <p className="mt-2 text-sm text-status-warn">
            没有卡 id「{cardId}」——已按{activeBook?.title ?? "全部已注册书目"}出题，卡范围未生效。
          </p>
        ) : null}
        {invalidPage ? (
          <p className="mt-2 text-sm text-status-warn">
            page 参数「{pageParam}」需为正整数——页过滤未生效，已按
            {effChapter ? effChapter.title : (activeBook?.title ?? "全部已注册书目")}出题。
          </p>
        ) : null}
        {/* T28 E：合法孤儿页（零知识原子）琥珀点名本页 + 放宽（下方空态主 CTA「换到本章全部」即放宽链），
            与 review 同族，不静默落到通用「这个范围还没有」空态。T43 A：放宽范围说 effChapter 实口径。 */}
        {orphanStudy ? (
          <p className="mt-2 text-sm text-status-warn">
            本页 p.{pageNum} 暂无可练知识原子——这一印刷页没有卡引用它；可清本页放宽到
            {effChapter ? effChapter.title : (activeBook?.title ?? "全部书目")}。
          </p>
        ) : null}
        {cardOutOfRange ? (
          <p className="mt-2 text-sm text-status-warn">
            卡「{scopedCard?.name_zh}」不在当前 book / chapter
            {pageNum != null ? " / page" : ""} 范围内——按空队列处理。
          </p>
        ) : null}
        {/* T43 A：坏章/坏档不静默（对齐 review invalid* 句式）——回落口径与上方池实算一致。 */}
        {invalidChapter ? (
          <p className="mt-2 text-sm text-status-warn">
            没有章 id「{chapterId}」——章过滤未生效，已按{scopeLabel}出题。
          </p>
        ) : null}
        {!invalidChapter && chapterOutsideBook ? (
          <p className="mt-2 text-sm text-status-warn">
            章「{activeChapter?.id}」不在《{activeBook?.title}》范围内——已按全书出题。
          </p>
        ) : null}
        {invalidMode ? (
          <p className="mt-2 text-sm text-status-warn">
            mode 参数「{modeParam}」未识别——已回落「全部」档。
          </p>
        ) : null}
        {/* T35 C：页头范围计数可点——与 sticky 三档 tablist / StudySession allHref·unknownHref·
            ungradedHref 同一 qs({ mode }) 口径（保留 card/book/chapter/page）；N=0 纯文。
            T60 C：scope densityWeak 时行尾旁挂「浅S 页可考密度不足」（单卡/未检不吵）——
            与 B 页头浅条同真同源（examCoverage 同一份），N=0 段逻辑不动。 */}
        <StudyScopeCounts
          atoms={atoms}
          hrefs={{
            all: `/study${qs({ mode: "all" })}`,
            unknown: `/study${qs({ mode: "unknown" })}`,
            ungraded: `/study${qs({ mode: "ungraded" })}`,
          }}
          densityWeak={examCoverage?.densityWeak ?? false}
          shallowCount={examCoverage?.shallowCount ?? 0}
        />
        {/* 作用域进度（T18：同范围练+核分列；本页即练环，不重复练链）。
            T27 C：有效页时练/核两列都是本页池（collectCiteQueue 同样带 page），标签「本页 p.N」。
            T29 B/F：对齐 T28 B 口径——练/核各自判本页，单侧空回落章/书池、标签分写，
            与书桌/核页同页打开时不互谎；孤儿页不再把空池标成「本页」。
            T33 A：交叉弱链——练面只传 reviewHref（progressReviewHref，与 Clew/Bridge 同源），
            不传本面 studyHref（「练此范围」自指无意义）；孤儿页不带幽灵 page= 沿用 progress* 口径。
            T36 B：池分段可点——练侧三档与 StudyScopeCounts/sticky 同一 qs({ mode })（保留
            card/book/chapter/page）；核侧三档从 progressReviewHref mode-swap（withQsMode 只换
            mode，不另写 scope 解析）；N=0 / 无池分段纯文。交叉弱链口径不变。
            T40 A：returnTo=studyReturnTo——条末「核此范围」与核侧 N>0 分段点前写 return，
            进核完成态「回到刚才」回本学习环范围。 */}
        <LocalProgressStrip
          atoms={stripAtoms}
          items={stripItemKeys}
          scopeLabel={stripScopeLabel}
          reviewHref={progressReviewHref}
          returnTo={studyReturnTo}
          studyModeHrefs={{
            all: `/study${qs({ mode: "all" })}`,
            unknown: `/study${qs({ mode: "unknown" })}`,
            ungraded: `/study${qs({ mode: "ungraded" })}`,
          }}
          heyeModeHrefs={{
            open: withQsMode(progressReviewHref, "open"),
            checked: withQsMode(progressReviewHref, "checked"),
            doubt: withQsMode(progressReviewHref, "doubt"),
          }}
        />
      </header>

      {/* T28 F：sticky 键盘岛——g 聚焦「清本页」，⇧[ / ⇧] 按章芯片顺序切章（切章即离页）；
          题内裸 [ / ] 回看/前进归 StudySession 自己的键盘环，本岛只认 Shift 组合不拦截。 */}
      <StickyPageLoopKeys
        clearPageSelector={pageNum != null ? "a[data-sticky-clear-page]" : undefined}
        prevChapterHref={!scopedCard && chipChapters.length > 0 ? prevChapterHref : undefined}
        nextChapterHref={!scopedCard && chipChapters.length > 0 ? nextChapterHref : undefined}
      />
      {/* T21 D：章芯片行 + 三档 tablist 收进 position:sticky 实底工具带（bg-card + border-b）。
          仅 CSS 钉住——长队列下滚时章芯片/档位仍可见；与 T20 StickyModeGate（URL 档位记忆 replace 补档）
          职责正交，各司其职，勿删 StickyModeGate。 */}
      <div className="sticky top-0 z-10 -mx-8 mt-6 border-b border-line bg-card px-8 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* T27 C：本页范围铬——有效页 pill 标注（与章芯片同族）+「清本页」（清 page，留书/章/档）。 */}
          {pageNum != null ? (
            <span className="flex items-center gap-2">
              <span
                aria-current="true"
                className="rounded-full border border-cinnabar bg-cinnabar-soft px-3 py-1 text-sm text-cinnabar"
              >
                本页 p.{pageNum}
              </span>
              <Link
                href={`/study${qs({ clearPage: true })}`}
                data-sticky-clear-page=""
                aria-keyshortcuts="g"
                className="text-xs text-muted no-underline transition-colors hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
              >
                清本页 →
              </Link>
            </span>
          ) : null}
          {/* 章过滤（config 派生；有书时以上下文书为准；保留当前队列档；切章即离页）。单卡范围固定，隐藏章芯片。
              T43 A：当前态走 effChapter——无效/越界章不高亮任何芯片（与池同口径，不装有效章）。 */}
          {!scopedCard && chipChapters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/study${qs({ chapter: null })}`}
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
                  href={`/study${qs({ chapter: c.id })}`}
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

          {/* 队列三档：全部 | 未评 | 不熟再练（本机态过滤，非 FSRS）。
              T41 A：抽薄客户端岛 StickyStudyModeTabs——本机 N=0 且非当前档纯文不可点
              （与页头 StudyScopeCounts 同源池/同计数；当前档恒指示），tab chrome 不变；
              Server 页原裸 MODES.map Link 恒可点进空池的谎言面消除。 */}
          <StickyStudyModeTabs
            mode={mode}
            atoms={atoms}
            hrefs={{
              all: `/study${qs({ mode: "all" })}`,
              unknown: `/study${qs({ mode: "unknown" })}`,
              ungraded: `/study${qs({ mode: "ungraded" })}`,
            }}
          />

          {/* T23 D：sticky 工具带回程薄链（次级文字，非第三颗大红）：?card= 回本卡；可解析本页回书桌本页。*/}
          <div className="flex items-center gap-3">
            <ReturnNav
              bookId={scopeBook?.id}
              pageHint={deskPageHint}
              deskHref={deskHref}
              cardHref={cardHref}
              validPages={scopeBookValidPages}
              showReturn={false}
            />
            {/* T33 A：交叉弱链的 sticky 延伸——长队列滚离页头后仍能去同范围核；
                muted 次级文字（非第二颗实心朱红），href 与页头 Strip 同一 progressReviewHref。
                T40 C：Server 页不能挂 onClick——换薄客户端岛 CrossScopeReturnLink，
                点前 saveReturn（payload=studyReturnTo，与页头 Strip 同一来源）。
                T51 H：对侧（核）池 0 → 纯文「同范围暂无待核」（stripItemKeys 与页头 Strip /
                Bridge progress* 同源，fail-closed）；>0 保持链 + return。 */}
            <CrossScopeReturnLink
              href={progressReviewHref}
              returnTo={studyReturnTo}
              emptyLabel={stripItemKeys.length === 0 ? "同范围暂无待核" : undefined}
            >
              去核同范围 →
            </CrossScopeReturnLink>
          </div>

          {/* T28 F：本页环键说明（与练/核底栏 SessionKeyHint 同族，只列当前实际可用的键）。 */}
          {stickyKeys.length > 0 ? <SessionKeyHint keys={stickyKeys} /> : null}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted">{atoms.length} 个知识原子</p>
      {/* T58 B+C：页头可考覆盖条（消费 T57）——scope weak 才出，好范围/未检不吵；
          一行同时说两件事：覆盖偏稀（B）+ 暗页未进可练池（C）。无掌握% / Due；
          N=0 段逻辑与三档芯片不动。 */}
      {examCoverage?.weak ? (
        <p className="mt-1 text-xs leading-6 text-status-warn">
          可考覆盖偏稀 · 暗{examCoverage.darkCount} 页未进可练池（实质页{" "}
          {examCoverage.substantialPages} · 已cite {examCoverage.citedPages}）——池内原子 ≠
          材料已覆盖；扉页/小结/跨章扉可能合理暗，pnpm page-check 可复核。
        </p>
      ) : null}
      {/* T60 B：页头浅密度条（消费 T59，与暗条并列可同真）——scope densityWeak 才出：
          已 cite 实质页原子极稀（浅 ≠ 暗：浅是练得出但题太少，暗是零 cite 零题）。
          缺 density 章 = 浅未检跳过（fold 不装 0 完美）；单卡/未检不吵；无掌握% / Due。 */}
      {examCoverage?.densityWeak ? (
        <p className="mt-1 text-xs leading-6 text-status-warn">
          可考密度偏稀 · 浅{examCoverage.shallowCount} 页已 cite 但原子极少（实质页{" "}
          {examCoverage.substantialPages} · 有原子 {examCoverage.atomPages}）——池内原子 ≠
          可考够；pnpm density-check 可复核。
        </p>
      ) : null}
      {/* T60 D：本页有原子 × 浅（非 orphan——浅页有 cite，练得出但原子极稀）——琥珀一行
          点名原子/字数（atoms[].cite.page 口径）+ 复核链；不新增主 CTA、不改 orphan 暗正文
          （orphan × dark 走下方空态 T58 D 分支），sparse 由优先序保证不与浅双吵。 */}
      {!orphanStudy && pageExam?.hint === "shallow" ? (
        <p className="mt-1 text-xs leading-6 text-status-warn">
          本页已抽出但原子偏稀（{pageExam.atomCount} 原子 · {pageExam.chars} 字）·
          可考密度不足——练完本页 ≠ 本页可考够；可回{" "}
          <Link className="underline underline-offset-4" href="/ingest">
            /ingest
          </Link>
          {pageOwner?.chapterId ? (
            <>
              {" "}· <span className="mono">pnpm density-check -- --shallow {pageOwner.chapterId}</span>
            </>
          ) : null}
          。
        </p>
      ) : null}
    </>
  );
}
