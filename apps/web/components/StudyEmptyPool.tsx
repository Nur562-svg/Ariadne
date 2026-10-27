"use client";

import Link from "next/link";
import type { StudyMode } from "@/lib/study";
import type { ReturnEntry } from "@/lib/return-stack";
import { StudyModeChips } from "@/components/StudyModeChips";

/**
 * T79 机械抽出：原 StudySession.tsx 内队列空 early-return 整段迁此——
 * ungradedDone 分型 · T58/T60 评完族旁挂 · 档位芯片 · T25 A 一颗主 CTA ·
 * T28 C 放宽链 · T51 I pendingCount 门禁——JSX/文案/class/href 与 tip 逐段一致
 * （仅 props 形参化 / dedent）。
 *
 * 队列空（档位过滤后无原子）：诚实说明 + 一颗主 CTA + 次级文字链 + 档位芯片（本机计数可切档）。
 * T28 C：文案必须报池大小与本档计数——池里有原子但本档为 0 时，禁止说成「这个范围没有原子」。
 * T52 B：标题与 HeYe 空态分型对称——ungraded 且未评归 0 是「评完」不是「没货」，升完成族
 * 标题「本机已全部评过」（对齐 HeYe「本机已全部对过」/本组件「本轮完成」同族）；unknown 空
 * 与 mode=all 防御空（atoms>0 却滤空，理论不可达）保持「这个队列是空的」，只报事实不装「有货」。
 */
export default function StudyEmptyPool({
  mode,
  pool,
  atomTotal,
  allHref,
  unknownHref,
  ungradedHref,
  widenPageHref,
  cardHref,
  pendingCount,
  reviewHref,
  deskBackHref,
  deskBackLabel,
  ret,
  rememberLeave,
  leaveReturnTo,
  examinableWeak,
  darkCount,
  densityWeak,
  shallowCount,
}: {
  /** 队列档位：all 全部｜ungraded 未评｜unknown 不熟再练。 */
  mode: StudyMode;
  /** 本范围本机三档计数（countPoolGrades）。 */
  pool: { known: number; unknown: number; ungraded: number };
  /** 当前范围全池大小（atoms.length）——T28 C 诚实文案报池大小用。 */
  atomTotal: number;
  /** 同范围切档 URL（主 CTA「切到「全部」」+ 档位芯片）。 */
  allHref: string;
  unknownHref: string;
  /** 档位芯片「未评」目标：同范围 ?mode=ungraded（T25 A）。 */
  ungradedHref: string;
  /** T28 C：本页档空的放宽链（清 page + mode=all）——次级文字链；仅有效 pageNum 时传入。 */
  widenPageHref?: string;
  /** 单卡范围（/study?card=）：空态改为「回本卡」「核本卡」。 */
  cardHref?: string;
  /** T51 I：对侧真池（父传，编排器已套缺省 0）——===0 时核链降 muted 纯文不可点、不写 leaveReturnTo。 */
  pendingCount: number;
  reviewHref: string;
  /** 回书桌本页 / 回书桌（编排器按 T53 F 页源优先级 + pageInOcr 消毒算好）。 */
  deskBackHref: string;
  deskBackLabel: string;
  /** 「回到刚才」return 短链（T72：noop-uSES 一次性采纳）。 */
  ret: ReturnEntry | null;
  /** T42 B：离面进核链点前写 return payload；缺省不写。 */
  rememberLeave: () => void;
  leaveReturnTo?: { href: string; label: string };
  /** T58 E：scope 可考覆盖旁挂（池非空且本档评完时出一句琥珀；只提示不改主 CTA）。 */
  examinableWeak?: boolean;
  darkCount?: number;
  /** T60 E：scope 浅密度旁挂（与 T58 暗句并列不互吞；只提示不改主 CTA）。 */
  densityWeak?: boolean;
  shallowCount?: number;
}) {
  const ungradedDone = mode === "ungraded" && pool.ungraded === 0;
  return (
    <section className="mt-10 rounded-lg border border-line bg-card p-6">
      <h2 className="text-xl font-semibold">{ungradedDone ? "本机已全部评过" : "这个队列是空的"}</h2>
      <p className="mt-3 text-sm leading-7 text-foreground/90">
        {mode === "ungraded"
          ? `本范围有 ${atomTotal} 个原子，未评的是 ${pool.ungraded}——都评过了，没有未评的原子可练。`
          : mode === "unknown"
            ? `本范围有 ${atomTotal} 个原子，标「不熟」的是 ${pool.unknown}。先在「全部」或「未评」里标几张不熟，再回来只练它们。`
            : "当前范围没有可练的原子。"}
      </p>
      {/* T58 E：评完族旁挂（池非空且本档评完）——「评完池」≠「材料可考完」。 */}
      {ungradedDone && examinableWeak && (darkCount ?? 0) > 0 ? (
        <p className="mt-2 text-xs leading-6 text-status-warn">
          本机已评完池内原子 · 本范围仍有暗页未覆盖进原子（暗{darkCount}）——材料未全覆盖，
          pnpm page-check 可复核。
        </p>
      ) : null}
      {/* T60 E：评完族浅旁挂（与 T58 暗句并列不互吞）——浅页已 cite 但原子极稀，
          评完池 ≠ 可考够；主 CTA 不改「去补浅」，只给次级 /ingest 文字链。 */}
      {ungradedDone && densityWeak && (shallowCount ?? 0) > 0 ? (
        <p className="mt-2 text-xs leading-6 text-status-warn">
          本机已评完池内原子 · 本范围仍有浅页可考密度不足（浅{shallowCount}）——池内原子 ≠
          可考够，可回{" "}
          <Link className="underline underline-offset-4" href="/ingest">
            /ingest
          </Link>{" "}
          或 pnpm density-check 复核。
        </p>
      ) : null}
      <StudyModeChips
        pool={pool}
        mode={mode}
        hrefs={{ all: allHref, unknown: unknownHref, ungraded: ungradedHref }}
      />
      {/* T25 A densify：一颗朱红主 CTA，其余一律次级文字链（勿一排多颗实心按钮）。 */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        {mode !== "all" ? (
          <Link
            href={allHref}
            className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white no-underline transition-opacity hover:opacity-90"
          >
            切到「全部」
          </Link>
        ) : null}
        {/* T28 C：本页过滤时并列放宽链（清 page 落全部档；次级文字，不加第二颗实心）。 */}
        {widenPageHref ? (
          <Link
            href={widenPageHref}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            清本页，看本章全部 →
          </Link>
        ) : null}
        {cardHref ? (
          <>
            <Link
              href={cardHref}
              className="text-sm text-muted no-underline hover:text-cinnabar"
            >
              回本卡 →
            </Link>
            {/* T42 B：交叉进核点前写 leaveReturnTo（回本学习环），与 sticky CrossScope 同真。
                T51 I：pendingCount（父传对侧真池，缺省 0）===0 降纯文「本卡暂无待核」；
                >0 保持链 + leaveReturnTo。 */}
            {pendingCount > 0 ? (
              <Link
                href={reviewHref}
                onClick={leaveReturnTo ? rememberLeave : undefined}
                className="text-sm text-muted no-underline hover:text-cinnabar"
              >
                核本卡 →
              </Link>
            ) : (
              <span className="text-sm text-muted" title="本卡暂无待核 cite">
                本卡暂无待核
              </span>
            )}
          </>
        ) : pendingCount > 0 ? (
          <Link
            href={reviewHref}
            onClick={leaveReturnTo ? rememberLeave : undefined}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            去核页 →
          </Link>
        ) : (
          <span className="text-sm text-muted" title="当前范围没有待核 cite">
            暂无待核
          </span>
        )}
        <Link href={deskBackHref} className="text-sm text-muted no-underline hover:text-cinnabar">
          {deskBackLabel}
        </Link>
        {ret ? (
          <Link href={ret.href} title={ret.label} className="text-sm text-muted no-underline hover:text-cinnabar">
            回到刚才 →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
