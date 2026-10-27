"use client";

import Link from "next/link";
import type { StudyMode } from "@/lib/study";
import type { ReturnEntry } from "@/lib/return-stack";
import { StudyModeChips } from "@/components/StudyModeChips";

/**
 * T79 机械抽出：原 StudySession.tsx 内本轮完成 early-return 整段迁此——
 * 「本轮完成」+ run 计数 · T58/T60 完成态旁挂 · 续位提示 · 「再来一轮」主 CTA ·
 * 「只练不熟」次级 · T51 I pendingCount 门禁 · 档位芯片——JSX/文案/class/href
 * 与 tip 逐段一致（仅 props 形参化 / dedent）。
 */
export default function StudyEmptyMode({
  mode,
  pool,
  orderLength,
  run,
  resumed,
  restart,
  allHref,
  unknownHref,
  ungradedHref,
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
  /** 本轮冻结队列长度（order.length）——完成态 run 汇总报队列总数。 */
  orderLength: number;
  /** 本轮 run 计数（不持久化，重开/续位从 0 起）。 */
  run: { known: number; unknown: number };
  /** 本标签续位标记（恢复游标 >0 时置位）——完成态诚实续练文案。 */
  resumed: boolean;
  /** 「再来一轮」重置（编排器持有 clearCursor + 重过滤 + 各 state 复位，经 props 下传）。 */
  restart: () => void;
  /** 同范围切档 URL（「只练不熟」次级链 + 档位芯片）。 */
  allHref: string;
  unknownHref: string;
  /** 档位芯片「未评」目标：同范围 ?mode=ungraded（T25 A）。 */
  ungradedHref: string;
  /** 单卡范围（/study?card=）：完成态改为「回本卡」「核本卡」。 */
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
  /** T58 E：完成态旁挂（父传 scope 可考覆盖；weak 才出）——评完的是池，不等于材料已考完。 */
  examinableWeak?: boolean;
  darkCount?: number;
  /** T60 E：完成态浅旁挂（densityWeak 且浅页>0 才出；与 T58 暗句并列不互吞）。 */
  densityWeak?: boolean;
  shallowCount?: number;
}) {
  return (
    <section className="mt-10 rounded-lg border border-line bg-card p-6">
      <h2 className="text-xl font-semibold">本轮完成</h2>
      <p className="mt-3 text-sm leading-7 text-foreground/90">
        共 {orderLength} 个原子 · 本轮 认识 {run.known} · 不熟 {run.unknown}。
      </p>
      {/* T58 E：完成态旁挂（父传 scope 可考覆盖；weak 才出）——评完的是池，
          不等于材料已考完；不改「再来一轮」主 CTA，不新增大红。 */}
      {examinableWeak && (darkCount ?? 0) > 0 ? (
        <p className="mt-2 text-xs leading-6 text-status-warn">
          本机已评完池内原子 · 本范围仍有暗页未覆盖进原子（暗{darkCount}）——材料未全覆盖，
          pnpm page-check 可复核。
        </p>
      ) : null}
      {/* T60 E：完成态浅旁挂（densityWeak 且浅页>0 才出；与 T58 暗句并列不互吞）——
          评完的是池内原子，浅页（已 cite 原子极稀）仍是可考密度缺口。 */}
      {densityWeak && (shallowCount ?? 0) > 0 ? (
        <p className="mt-2 text-xs leading-6 text-status-warn">
          本机已评完池内原子 · 本范围仍有浅页可考密度不足（浅{shallowCount}）——池内原子 ≠
          可考够，可回{" "}
          <Link className="underline underline-offset-4" href="/ingest">
            /ingest
          </Link>{" "}
          或 pnpm density-check 复核。
        </p>
      ) : null}
      {resumed ? (
        <p aria-live="polite" className="mt-2 text-xs leading-5 text-muted">
          已从本标签续上（完成态）；本轮 run 计数不持久化，从 0 起。
        </p>
      ) : null}
      <StudyModeChips
        pool={pool}
        mode={mode}
        hrefs={{ all: allHref, unknown: unknownHref, ungraded: ungradedHref }}
      />
      {/* T25 A densify：一颗朱红主 CTA（再来一轮），其余一律次级文字链。 */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          onClick={restart}
          className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 motion-reduce:transition-none"
        >
          再来一轮
        </button>
        {mode !== "unknown" ? (
          <Link
            href={unknownHref}
            className="text-sm text-muted no-underline hover:text-cinnabar"
          >
            只练不熟 →
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
                T51 I：完成态同门禁——pendingCount===0 纯文「本卡暂无待核」；>0 保持链。 */}
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
