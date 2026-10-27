"use client";

import Link from "next/link";
import type { HeYeMode } from "@/lib/heye-store";
import type { ReturnEntry } from "@/lib/return-stack";
import { HeYeModeChips } from "@/components/HeYeModeChips";

/**
 * T78 机械抽出：原 HeYeSession.tsx 内服务端池空 early-return 整段迁此——
 * emptyKind 三分型（orphan / card-out / true-empty）· orphan×dark 旁挂 · T29 C
 * orphan CTA 优先级（清本页升主）· T51 J atomCount 池门禁 · T28 A 清本页次级 ·
 * 档位芯片——JSX/文案/class/href 与 tip 逐段一致（仅 props 形参化 / dedent）。
 */
export default function HeYeEmptyPool({
  emptyKind,
  scopeLabel,
  orphanDark,
  counts,
  mode,
  modeChipHrefs,
  cardHref,
  studyHref,
  atomCount,
  deskPageHref,
  clearChapterHref,
  clearPageHref,
  orphanPage,
  ret,
  rememberLeave,
  leaveReturnTo,
}: {
  /** T52 C/E：服务端池空分型（review 页推导）——orphan / card-out / true-empty；缺省 null 通用句。 */
  emptyKind: "orphan" | "card-out" | "true-empty" | null | undefined;
  /** 范围说明（全书库 / 某书书名 / 单卡卡名 / 章），用于副文。 */
  scopeLabel: string;
  /** T58 F/I：孤儿核旁挂暗页判定——只补一句琥珀，不改 orphan 主 CTA 契约。 */
  orphanDark?: boolean;
  /** 全池累计（本范围，本机态）。 */
  counts: { open: number; checked: number; doubt: number };
  mode: HeYeMode;
  /** 档位芯片目标（T25 A）：缺 href 退化为纯计数 chip。 */
  modeChipHrefs: Record<HeYeMode, string | undefined>;
  /** 单卡范围（/review?card=）：空队列/全部对过时链回本卡。 */
  cardHref?: string;
  /** 跨环学习链（有卡带 ?card=，否则 /study）。 */
  studyHref?: string;
  /** T51 J：对侧真池——===0 时练链降 muted 纯文不可点、不写 leaveReturnTo。 */
  atomCount: number;
  /** 单页范围（/review?page=）：优先链回书桌本页。 */
  deskPageHref?: string;
  /** 章范围清章回全书核页——池空时限宽范围。 */
  clearChapterHref?: string;
  /** T28 A：本页过滤放宽链；T29 C：孤儿时升主 CTA 不再重复列次级。 */
  clearPageHref?: string;
  /** T29 C：孤儿核标志（合法 pageNum · 非单卡 · 池空）——主 CTA 换「清本页，换到本章核」。 */
  orphanPage?: boolean;
  /** 「回到刚才」return 短链（T72：noop-uSES 一次性采纳）。 */
  ret: ReturnEntry | null;
  /** T42 C/D：离面进练链点前写 return payload；缺省不写。 */
  rememberLeave: () => void;
  leaveReturnTo?: { href: string; label: string };
}) {
  return (
    <section className="mt-10 rounded-lg border border-line bg-card p-6">
      <h2 className="text-xl font-semibold">这个范围是空的</h2>
      <p className="mt-3 text-sm leading-7 text-foreground/90">
        {emptyKind === "orphan" ? (
          <>
            本页没有待核 cite——没有「有页码但未抽查」的引用落在这一印刷页，或该页尚未解析
            OCR；清本页可放宽到本章 / 本书。
            {/* T58 F：旁挂一句（勿吞 orphan 分型 / 主 CTA 契约）——页有实质 OCR
                却零抽出 cite 时点破「不是页上没教材」。 */}
            {orphanDark ? (
              <span className="text-status-warn">
                （旁挂）本页为暗页：实质 OCR 未抽出 cite——不是页上没教材，是抽出未覆盖。
              </span>
            ) : null}
          </>
        ) : emptyKind === "card-out" ? (
          <>
            本卡在更宽范围还有待核 cite，但当前 book / chapter / page 过滤把交集滤空了（越界）——
            这里核不出它的引用；回本卡直接核，或清本页 / 换更宽范围。
          </>
        ) : (
          <>
            这个范围（{scopeLabel}）还没有待核 cite。先到{" "}
            <Link className="text-cinnabar underline underline-offset-4" href="/ingest">
              /ingest
            </Link>{" "}
            上传并解析教材，或换一个更宽的范围。
          </>
        )}
      </p>
      <HeYeModeChips counts={counts} mode={mode} hrefs={modeChipHrefs} />
      {/* T25 A densify：每分支只留一颗朱红主 CTA，其余次级文字链。
          T29 C：孤儿核（合法 page · 非单卡 · 池空）且有清本页链 → 主 CTA = 清本页
          （放宽到本章核，只删 page 留书/章/档）；「去学习环」降次级，用父页消毒过的
          studyHref（无 page，不送回孤儿 URL）。非孤儿保持既有优先级。
          T51 J：主/次「去学习环」「去学习本卡」吃 atomCount（父传 studyHref 同范围真池，
          缺省 0）——===0 降 muted 纯文（同范围/本卡暂无原子）不可点、不写 leaveReturnTo；
          回本卡 / 清本页 / 回书桌是回程或放宽链，不受池门禁。 */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        {cardHref ? (
          <Link
            href={cardHref}
            className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
          >
            回本卡 →
          </Link>
        ) : orphanPage && clearPageHref ? (
          <Link
            href={clearPageHref}
            className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
          >
            清本页，换到本章核 →
          </Link>
        ) : deskPageHref ? (
          atomCount > 0 ? (
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
          )
        ) : (
          <Link
            href="/desk"
            className="rounded-md bg-cinnabar px-5 py-2.5 text-sm text-white no-underline"
          >
            回书桌 →
          </Link>
        )}
        {cardHref ? (
          <>
            {atomCount > 0 ? (
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
            )}
            {deskPageHref ? (
              <Link
                href={deskPageHref}
                className="text-sm text-muted no-underline hover:text-cinnabar"
              >
                回书桌本页 →
              </Link>
            ) : null}
          </>
        ) : orphanPage ? (
          atomCount > 0 ? (
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
        ) : deskPageHref ? (
          <Link
            href={deskPageHref}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            回书桌本页 →
          </Link>
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
        )}
        {clearChapterHref ? (
          <Link
            href={clearChapterHref}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            清章看全章节 →
          </Link>
        ) : null}
        {/* T28 A：本页过滤放宽（次级文字链，不加第二颗实心）。
            T29 C：孤儿时已升主 CTA，不再重复列这条次级。 */}
        {clearPageHref && !orphanPage ? (
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
