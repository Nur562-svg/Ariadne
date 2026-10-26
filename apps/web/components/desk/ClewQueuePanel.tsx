"use client";

import Link from "next/link";
import type { ClewContextData } from "@/components/desk/DeskContext";
import { countPoolMarks } from "@/lib/heye-store";
import { useStudyGrades } from "@/lib/use-study-grades";
import { useHeYeStore } from "@/lib/use-heye-store";
import { poolGrades } from "@/components/LocalProgressStrip";
import { withQsMode } from "@/lib/qs-mode";

/**
 * T75 机械抽出：原 ClewPane.tsx 内 QueuePanel 整段迁此——uSES 双仓口 + 分段点击 +
 * 清完分写诚实零改，仅换文件。
 */

/**
 * 复习队列：诚实跳转 + 当前 progress* 池本机计数（T33 C densify，非 Due）。
 * 口径与 LocalProgressStrip / countPoolMarks / poolGrades 同一——不另写分叉计数；
 * 无池（书架等未定位章）→ 全局已记录条数 + 诚实说明，与 Changes 空池文案同族。
 * 不做成 Due 列表：不显示到期日、不引入 FSRS、不新建 storage。
 * T36 E：有池分段 N>0 可点进档——mode-swap 自 progress*（props studyHref/reviewHref 即
 * progress* 优先的回落链，withQsMode 只换 mode 不另解析 scope）；N=0 纯文、无池全局
 * 计数保持纯文。CTA 与 rememberReturn 不动；文案继续明示非 Due / 非 FSRS。
 */
export function QueuePanel({
  clew,
  reviewHref,
  studyHref,
  rememberReturn,
}: {
  /** T33 C：读 progress* 池（各面 Bridge 写入）报当前范围本机数。 */
  clew: ClewContextData;
  reviewHref: string;
  studyHref: string;
  /** T31 B：练/核 CTA 点前写 return 短链（回当前上下文）。 */
  rememberReturn: () => void;
}) {
  // T71：双仓共享 useSyncExternalStore 口——空仓即合法首帧（计数如实 0，不造假正数）；
  // getSnapshot 永不抛，T65「不永挂读取中」结构性成立（无 effect、无 ready 门）。
  const grades = useStudyGrades();
  const heye = useHeYeStore();

  const hasPool = (clew.progressAtoms?.length ?? 0) + (clew.progressItems?.length ?? 0) > 0;
  /**
   * T51 D：主 CTA / 去学习环的池门禁（fail-closed 缺省 0）——待核池===0 时「打开核页工作台」
   * 降 muted 纯文（无池 →「未定位章 · 暂无范围池」，与上方同句族；有池 0 →「暂无待核」）；
   * 原子池===0 时「去学习环」同理「暂无原子」。>0 保持朱红主钮 / 次级链 + rememberReturn。
   * 分段 seg N>0/N=0（T36/T40）只回归；非 Due、非 FSRS。
   */
  const atomN = clew.progressAtoms?.length ?? 0;
  const pendingN = clew.progressItems?.length ?? 0;
  const pool = clew.progressAtoms ? poolGrades(clew.progressAtoms, grades) : null;
  const marks = clew.progressItems ? countPoolMarks(clew.progressItems, heye) : null;
  const globalKnown = Object.values(grades).filter((g) => g.k === 1).length;
  const globalUnknown = Object.values(grades).filter((g) => g.k === 0).length;
  const globalChecked = Object.values(heye).filter((m) => m.s === "checked").length;
  const globalDoubt = Object.values(heye).filter((m) => m.s === "doubt").length;

  /** T36 E 分段：N>0 且有 href → 文字链（同色 + hover 下划线，对齐 Strip/ScopeCounts seg 族）。
      T40 E：N>0 可点段是进练/核档的出发点——点前 rememberReturn（与主 CTA 同函数，
      父级已传入，payload=clewReturnPayload 同一来源）；N=0 纯文、无池全局计数保持纯文。 */
  function seg(n: number, label: string, href: string, toneCls: string) {
    const text = (
      <>
        {label} {n}
      </>
    );
    if (n > 0) {
      return (
        <Link
          href={href}
          onClick={rememberReturn}
          className={`${toneCls} no-underline hover:underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-cinnabar`}
        >
          {text}
        </Link>
      );
    }
    return <span className={toneCls}>{text}</span>;
  }
  /** 三档深链：progress*（或回落链）mode-swap——范围与计数池同源，不另写解析。 */
  const studyModes = {
    all: withQsMode(studyHref, "all"),
    unknown: withQsMode(studyHref, "unknown"),
    ungraded: withQsMode(studyHref, "ungraded"),
  };
  const heyeModes = {
    open: withQsMode(reviewHref, "open"),
    checked: withQsMode(reviewHref, "checked"),
    doubt: withQsMode(reviewHref, "doubt"),
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <p className="text-sm leading-7 text-foreground/90">
        复习队列 = 核页工作台（章过滤 + 本机三档：待核｜已对｜存疑）与学习环三档（全部｜未评｜不熟）。
        两者都是本机态过滤，不是到期调度——这里不显示 Due / FSRS。
      </p>

      {/* T33 C：当前 progress* 池本机计数（与 Changes 内 compact Strip 同池同口径）；无池 → 全局。
          T36 E：有池分段 N>0 可点进对应档（见 seg/studyModes/heyeModes）；N=0 纯文。
          T71：uSES 口空仓即合法首帧（0 是真实空读数），ready 门与「读取中」瞬时态退役。 */}
      {hasPool ? (
        <>
          <p className="mt-3 text-xs leading-6 text-muted" aria-label="当前范围本机标记计数">
            {clew.progressScopeLabel ? (
              <span className="mr-2 text-foreground/80">{clew.progressScopeLabel}</span>
            ) : null}
            {marks ? (
              <>
                核 {seg(marks.open, "待核", heyeModes.open, "")}
                <span className="text-status-ok"> · </span>
                {seg(marks.checked, "已对", heyeModes.checked, "text-status-ok")}
                <span className="text-status-warn"> · </span>
                {seg(marks.doubt, "存疑", heyeModes.doubt, "text-status-warn")}
              </>
            ) : null}
            {marks && pool ? <span className="mx-2 text-line">|</span> : null}
            {pool ? (
              <>
                练 {seg(pool.known, "认识", studyModes.all, "text-status-ok")}
                <span className="text-status-warn"> · </span>
                {seg(pool.unknown, "不熟", studyModes.unknown, "text-status-warn")}
                <span> · </span>
                {seg(pool.ungraded, "未评", studyModes.ungraded, "")}
              </>
            ) : null}
            <span className="ml-2">· 仅这个浏览器 · 非 Due</span>
          </p>
          {/* T43 E 有池清完分写：待核与未评都为 0 才说「已清」——与下方「未定位章」分支两句不互拷；
              明示本机记录、非 Due / 非 FSRS，不做掌握%绿条。 */}
          {marks && pool && marks.open === 0 && pool.ungraded === 0 ? (
            <p className="mt-1 text-xs leading-6 text-muted">
              本范围待核与未评已清——可到「已对 · 存疑」或「认识 · 不熟」档复查改动；仅本机记录，非 Due、非 FSRS。
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-xs leading-6 text-muted">
          未定位章 · 全书本机记录：练 认识 {globalKnown} · 不熟 {globalUnknown}；
          核 已对 {globalChecked} · 存疑 {globalDoubt}。到书桌打开书目后按章/页收窄。
        </p>
      )}

      <p className="mt-3 text-xs leading-6 text-muted">
        本面板不存自己的队列；打开工作台看实时池数与本机标记。
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        {pendingN > 0 ? (
          <Link
            href={reviewHref}
            onClick={rememberReturn}
            className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
          >
            打开核页工作台 →
          </Link>
        ) : (
          <span
            className="text-sm text-muted"
            title={hasPool ? "当前范围没有待核 cite" : "未定位章，无章/页范围池可开"}
          >
            {hasPool ? "暂无待核" : "未定位章 · 暂无范围池"}
          </span>
        )}
        {atomN > 0 ? (
          <Link
            href={studyHref}
            onClick={rememberReturn}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            去学习环 →
          </Link>
        ) : (
          <span className="text-sm text-muted" title="当前范围没有可练原子">
            暂无原子
          </span>
        )}
      </div>
    </div>
  );
}
