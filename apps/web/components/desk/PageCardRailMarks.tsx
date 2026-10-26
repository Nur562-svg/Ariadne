"use client";

import Link from "next/link";
import { useStudyGrades } from "@/lib/use-study-grades";
import { useHeYeStore } from "@/lib/use-heye-store";

/**
 * 本页卡轨「本机态」客户岛（Task 24 B）：每张卡只读 ariadne.study.v1 / ariadne.heye.v1，
 * 按卡汇总一行薄文案——练：认识/不熟/未评；核：已对/存疑；某类无本机记录诚实标「—」
 * （待核数需服务端池子，这里不编）。键前缀匹配：练 = `<cardId>/<atomId>`；核 citeKey 以
 * `<cardId>|` 打头（lib/heye.ts push 规则），因此无需原子 id 即可按卡聚合。
 * 禁止掌握 %、色环、Due 角标、假「本页已全核」绿条；仅本浏览器记录，与 seed verified 无关。
 * T34 E：分段计数可点——有 bookId 且 N>0 时进该卡对应档（练 mode=all/unknown/ungraded ·
 * 核 mode=checked/doubt，本机态过滤非 Due）；「—」与 N=0 分段保持纯文不可点，不编行动。
 */
export default function PageCardRailMarks({
  cardId,
  atomCount,
  bookId,
  rememberReturn,
}: {
  cardId: string;
  /** 卡内原子总数（未评 = 总数 − 已评，只作减法展示，不编数据）。 */
  atomCount: number;
  /** T34 E：有 bookId 时各分段计数可点进该卡练/核对应档。 */
  bookId?: string;
  /** 点链前写 return（与轨「练」「核」同 rememberDeskReturn 口径——回书桌本页）。 */
  rememberReturn?: () => void;
}) {
  // T71：双仓共享 useSyncExternalStore 口——SSR/首帧空仓 → 各类「—」（诚实空读数，
  // 不造假正数）；落盘后微任务内切真值。无 effect 无 ready 门。
  const grades = useStudyGrades();
  const heye = useHeYeStore();

  const studyPrefix = `${cardId}/`;
  let known = 0;
  let unknown = 0;
  for (const [k, g] of Object.entries(grades)) {
    if (!k.startsWith(studyPrefix)) continue;
    if (g.k === 1) known++;
    else unknown++;
  }
  const ungraded = Math.max(0, atomCount - known - unknown);

  const heyePrefix = `${cardId}|`;
  let checked = 0;
  let doubt = 0;
  for (const [k, m] of Object.entries(heye)) {
    if (!k.startsWith(heyePrefix)) continue;
    if (m.s === "checked") checked++;
    else doubt++;
  }

  const hasStudy = known + unknown > 0;
  const hasHeye = checked + doubt > 0;

  const cardQ = `card=${encodeURIComponent(cardId)}`;
  const studyHref = (mode: "all" | "unknown" | "ungraded") =>
    bookId ? `/study?${cardQ}&book=${encodeURIComponent(bookId)}&mode=${mode}` : null;
  const reviewHref = (mode: "checked" | "doubt") =>
    bookId ? `/review?${cardQ}&book=${encodeURIComponent(bookId)}&mode=${mode}` : null;

  /**
   * 分段计数：N>0 且有 href → 可点（同色数字 + hover 下划线，muted 不抢主链）；
   * N=0 或无 bookId → 纯文。「—」整段纯文（见下方 JSX）。
   */
  function seg(n: number, label: string, href: string | null, tone?: "ok" | "warn") {
    const toneCls = tone === "ok" ? "text-status-ok" : tone === "warn" ? "text-status-warn" : "";
    const text = (
      <>
        {label} <span className={toneCls}>{n}</span>
      </>
    );
    if (href && n > 0) {
      return (
        <Link
          href={href}
          onClick={rememberReturn}
          className="no-underline hover:underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-cinnabar"
        >
          {text}
        </Link>
      );
    }
    return <span>{text}</span>;
  }

  return (
    <p className="mt-0.5 text-[11px] leading-4 text-muted" aria-label={`${cardId} 的本机练/核标记`}>
      练{" "}
      {hasStudy ? (
        <>
          {/* 认识无独立档 → mode=all 进本卡全部（T34 E 优先可点；无 bookId 纯文）。 */}
          {seg(known, "认识", studyHref("all"), "ok")}
          <span className="text-status-warn"> · </span>
          {seg(unknown, "不熟", studyHref("unknown"), "warn")}
          {ungraded > 0 ? (
            <>
              <span> · </span>
              {seg(ungraded, "未评", studyHref("ungraded"))}
            </>
          ) : null}
        </>
      ) : (
        "—"
      )}
      <span className="mx-1.5 text-line">|</span>
      核{" "}
      {hasHeye ? (
        <>
          {seg(checked, "已对", reviewHref("checked"), "ok")}
          <span className="text-status-warn"> · </span>
          {seg(doubt, "存疑", reviewHref("doubt"), "warn")}
        </>
      ) : (
        "—"
      )}
    </p>
  );
}
