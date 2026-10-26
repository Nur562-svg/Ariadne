"use client";

import Link from "next/link";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import { withQsMode } from "@/lib/qs-mode";

/**
 * T73 机械抽出：原 DocumentPane.tsx 内 QuizPanel（自测面板）整段迁此——
 * 组件体/props/文案/门禁零改，仅换文件（文件名加 Document 前缀避让同名歧义）；
 * DocumentPane 编排消费。
 */
/**
 * 自测面板：学习环本机自评 + 核页本机对页（两者均已可用；均非 FSRS 到期调度）。
 * T31 B：练/核深链吃 Strip 同款章/页 scope（book+chapter 恒在，本页有池才带 page）——
 * 禁止裸 /study?book= / /review?book= 丢章。
 * T35 E densify：① 练/核点前写 return（有阅读页→书桌 p.N，否则书级——TOC 切「自测」时常
 * mode=cards、readingPage 为 null，诚实落书级）；② 嵌 LocalProgressStrip 吃当前 strip* 池/标签/
 * href——静态门户变可见本机数；③ 仍一颗朱红主 CTA，「去核页」次级；href 已含 mode=all/open。
 */
export default function QuizPanel({
  bookId,
  atomCount,
  bookAtomCount,
  studyHref,
  reviewHref,
  atoms,
  items,
  scopeLabel,
  rememberReturn,
  returnTo,
}: {
  bookId: string;
  atomCount: number;
  /**
   * T52 A：本书可练原子数（DocumentPane 与书头统计同一 reduce / collectStudyAtoms({bookId})
   * 同池）——本章 0 且本书 0 时「放宽到本书」降纯文「本书暂无原子」，不链进全书空练池；
   * 本书 >0 保持 T45 A 放宽链语义不动。
   */
  bookAtomCount: number;
  studyHref: string;
  reviewHref: string;
  /** T35 E：当前 strip 池（与书头 Strip / Clew progress* 同源）。 */
  atoms: { cardId: string; atomId: string }[];
  items: { key: string }[];
  scopeLabel: string;
  /** T35 E：练/核点前写 return（DocumentPane 依当前阅读页构造，同 CardCard 口径）。 */
  rememberReturn: () => void;
  /** T39 E：内嵌 Strip 的 returnTo（= 书头 deskReturnPayload 同一份）——条末/分段点前同写。 */
  returnTo: { href: string; label: string };
}) {
  return (
    <section className="mt-8 max-w-xl rounded-lg border border-line bg-card p-6">
      <h2 className="text-sm font-semibold">自测与核对</h2>
      <p className="mt-2 text-sm leading-7 text-foreground/90">
        {atomCount > 0 ? (
          <>
            当前范围（{scopeLabel}）可练 {atomCount} 个知识原子：看问题 → 回想 → 自评「认识 /
            不熟」（进度保存在本浏览器，非到期调度）。
          </>
        ) : (
          <>
            当前范围（{scopeLabel}）暂无可练知识原子——这一范围还没有萃取原子的卡，
            自评入口不装作能进空池。
          </>
        )}
      </p>
      <p className="mt-1 text-sm leading-7 text-muted">
        核页已可用：把卡片引用逐条对着该页 OCR 原文核对，标「本机已对 / 存疑」——只记本机，不回写教材数据。
      </p>
      {/* T35 E：当前范围本机进度（练 认识/不熟/未评 · 核 待核/已对/存疑）——与书头 Strip 同池同口径；
          条末弱链即练/核入口的同范围版本，不另加实心。
          T36 C：分段可点——三档从本面板 studyHref/reviewHref（= strip* 同源）mode-swap 派生。
          T39 E：returnTo 同书头 deskReturnPayload——条末/分段点前写 return，与本面板主 CTA 同真。 */}
      <LocalProgressStrip
        atoms={atoms}
        items={items}
        scopeLabel={scopeLabel}
        studyHref={studyHref}
        reviewHref={reviewHref}
        returnTo={returnTo}
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
      <div className="mt-5 flex flex-wrap items-center gap-4">
        {/* T45 A：atomCount 与内嵌 Strip 同池（stripAtoms.length）——0 原子时主 CTA 降级为
            诚实放宽链（book 级 /study，同一 qs 语义），不装作进空练池；>0 保持章/页范围主 CTA。
            T52 A：放宽链先看本书池——本章 0 且本书 0（整本书都没萃出原子）→ 纯文
            「本书暂无原子」，不可点也不引导「放宽」；本书 >0 才给「放宽到本书」链。 */}
        {atomCount > 0 ? (
          <Link
            href={studyHref}
            onClick={rememberReturn}
            className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
          >
            去学习环自评 →
          </Link>
        ) : bookAtomCount > 0 ? (
          <Link
            href={`/study?book=${encodeURIComponent(bookId)}&mode=all`}
            onClick={rememberReturn}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            本章暂无原子 · 去学习环放宽到本书 →
          </Link>
        ) : (
          <span className="text-sm text-muted" title="本书实体卡均未萃取出知识原子">
            本书暂无原子
          </span>
        )}
        {/* T51 G：「去核页」空池门禁——items（= stripItems，与 reviewHref 同章/页池）===0 降
            muted 纯文「暂无待核」不可点；>0 保持链 + rememberReturn。练侧 atomCount===0 放宽链
            （T45 A）语义不动；内嵌 Strip 条末已由 T51 E 组件级接线。 */}
        {items.length > 0 ? (
          <Link
            href={reviewHref}
            onClick={rememberReturn}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            去核页 →
          </Link>
        ) : (
          <span className="text-sm text-muted" title="当前范围没有待核 cite">
            暂无待核
          </span>
        )}
      </div>
    </section>
  );
}
