"use client";

import Link from "next/link";
import type { HeYeMode } from "@/lib/heye-store";
import type { ReturnEntry } from "@/lib/return-stack";
import { HeYeModeChips } from "@/components/HeYeModeChips";

/**
 * T78 机械抽出：原 HeYeSession.tsx 内档内空/完成 early-return 整段迁此——
 * open 空 = 完成族标题 + 诚实绿条（清除本机核页记录 resetStore 经 props）；
 * checked/doubt 空 = 独立短标题「这个档还没有本机记录」（T52 D）；
 * T51 J atomCount 池门禁 · T28 A 清本页次级 · 档位芯片——JSX/文案/class/href
 * 与 tip 逐段一致（仅 props 形参化 / dedent）。
 */
export default function HeYeEmptyMode({
  mode,
  counts,
  scopeLabel,
  modeChipHrefs,
  resetStore,
  openHref,
  cardHref,
  studyHref,
  atomCount,
  deskPageHref,
  clearChapterHref,
  clearPageHref,
  ret,
  rememberLeave,
  leaveReturnTo,
}: {
  mode: HeYeMode;
  /** 全池累计（本范围，本机态）。 */
  counts: { open: number; checked: number; doubt: number };
  /** 范围说明（全书库 / 某书书名 / 单卡卡名 / 章），用于副文。 */
  scopeLabel: string;
  /** 档位芯片目标（T25 A）：缺 href 退化为纯计数 chip。 */
  modeChipHrefs: Record<HeYeMode, string | undefined>;
  /** 清除本范围本机核页记录（编排器持有 confirm + 范围裁剪逻辑，经 props 下传）。 */
  resetStore: () => void;
  /** 空档「回待核」链（同范围 ?mode=open）。 */
  openHref?: string;
  /** 单卡范围（/review?card=）：空队列/全部对过时链回本卡。 */
  cardHref?: string;
  /** 跨环学习链（有卡带 ?card=，否则 /study）。 */
  studyHref?: string;
  /** T51 J：对侧真池——===0 时练链降 muted 纯文不可点、不写 leaveReturnTo。 */
  atomCount: number;
  /** 单页范围（/review?page=）：优先链回书桌本页。 */
  deskPageHref?: string;
  /** 章范围清章回全书核页——档空时限宽范围。 */
  clearChapterHref?: string;
  /** T28 A：本页过滤放宽（档内空同款次级链）。 */
  clearPageHref?: string;
  /** 「回到刚才」return 短链（T72：noop-uSES 一次性采纳）。 */
  ret: ReturnEntry | null;
  /** T42 C/D：离面进练链点前写 return payload；缺省不写。 */
  rememberLeave: () => void;
  leaveReturnTo?: { href: string; label: string };
}) {
  const backToOpen = mode !== "open" && openHref;
  return (
    <section className="mt-10 rounded-lg border border-line bg-card p-6">
      {mode === "open" ? (
        <>
          <h2 className="text-xl font-semibold">本机已全部对过</h2>
          <p className="mt-3 rounded-lg border border-line bg-status-ok-bg px-4 py-3 text-sm leading-7 text-status-ok">
            已对 {counts.checked} · 存疑 {counts.doubt}。这只影响本浏览器记录，
            seed 的「抽查 verified」状态没有变。{" "}
            <button onClick={resetStore} className="underline underline-offset-4 hover:text-foreground">
              清除本机核页记录
            </button>
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            这个范围（{scopeLabel}）没有待核（本机未标）的 cite。想复查的可在「已对 / 存疑」档里看。
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold">这个档还没有本机记录</h2>
          <p className="mt-3 border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
            这个范围还没有本机「{mode === "checked" ? "已对" : "存疑"}」记录。
            先在「待核」档里逐条核对，标过的项会出现在这里。
          </p>
        </>
      )}
      <HeYeModeChips counts={counts} mode={mode} hrefs={modeChipHrefs} />
      {/* T25 A densify：一颗主 CTA（回待核档 / 去学习环），其余次级文字链。
          T51 J：档空/完成态练链同门禁——atomCount===0 主·次练链均降纯文
          （本卡/同范围暂无原子），>0 保持 + leaveReturnTo；回程链不受池门禁。 */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        {backToOpen ? (
          <Link
            href={openHref}
            className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
          >
            回待核档 →
          </Link>
        ) : atomCount > 0 ? (
          <Link
            href={studyHref ?? "/study"}
            onClick={leaveReturnTo ? rememberLeave : undefined}
            className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
          >
            去学习环 →
          </Link>
        ) : (
          <span className="text-sm text-muted" title="同范围暂无可练原子">
            同范围暂无原子
          </span>
        )}
        {backToOpen ? (
          cardHref ? (
            atomCount > 0 ? (
              <Link
                href={studyHref ?? "/study"}
                onClick={leaveReturnTo ? rememberLeave : undefined}
                className="text-sm text-muted no-underline hover:text-cinnabar"
              >
                去学习本卡 →
              </Link>
            ) : (
              <span className="text-sm text-muted" title="本卡暂无可练原子">
                本卡暂无原子
              </span>
            )
          ) : atomCount > 0 ? (
            <Link
              href={studyHref ?? "/study"}
              onClick={leaveReturnTo ? rememberLeave : undefined}
              className="text-sm text-muted no-underline hover:text-cinnabar"
            >
              去学习环 →
            </Link>
          ) : (
            <span className="text-sm text-muted" title="同范围暂无可练原子">
              同范围暂无原子
            </span>
          )
        ) : null}
        {cardHref ? (
          <Link href={cardHref} className="text-sm text-muted no-underline hover:text-cinnabar">
            回本卡 →
          </Link>
        ) : null}
        {deskPageHref ? (
          <Link
            href={deskPageHref}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            回书桌本页 →
          </Link>
        ) : (
          <Link href="/desk" className="text-sm text-muted no-underline hover:text-cinnabar">
            回书桌 →
          </Link>
        )}
        {clearChapterHref ? (
          <Link
            href={clearChapterHref}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            清章看全章节 →
          </Link>
        ) : null}
        {/* T28 A：本页过滤放宽（档内空同款次级链）。 */}
        {clearPageHref ? (
          <Link
            href={clearPageHref}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            清本页 →
          </Link>
        ) : null}
        {ret ? (
          <Link
            href={ret.href}
            title={ret.label}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            回到刚才 →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
