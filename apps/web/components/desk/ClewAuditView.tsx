"use client";

import Link from "next/link";
import { saveReturn } from "@/lib/return-stack";
import {
  clewCitedPageHref,
  existingStudyHrefForCard,
  isAuditUnavailable,
  relatedCardAtoms,
  segmentAnswerRefs,
  type ClewAnswerAudit,
  type ClewAuditUnavailable,
  type ClewCardAtomRef,
} from "@/lib/clew-answer-audit";

/**
 * T75 机械抽出：原 ClewPane.tsx 内 AuditedProse / AuditFace 整段迁此——
 * 组件体/props/文案/class 零改，仅换文件；auditPreview 灰 / 终态覆盖 / warn 色 /
 * 不可用不出芯片语义原样（T70 E）。
 */

/**
 * 答文页码就地标注。text 段与页码段拼接后等于原文；⚠ 是下标，不替换字符。
 * 越窗不可点，title「本次未给模型此页」。预览全程用 muted，终态越窗才上琥珀。
 */
export function AuditedProse({
  text,
  audit,
  bookId,
  preview,
}: {
  text: string;
  audit?: ClewAnswerAudit | ClewAuditUnavailable;
  bookId?: string;
  preview?: boolean;
}) {
  if (!audit || isAuditUnavailable(audit)) return <>{text}</>;
  const segs = segmentAnswerRefs(text, audit);
  return (
    <>
      {segs.map((s, i) => {
        if (s.type === "text") return <span key={i}>{s.text}</span>;
        if (!s.linkable) {
          return (
            <span key={i} title="本次未给模型此页" className={preview ? undefined : "cite-unverified"}>
              {s.text}
              <sub className={preview ? "text-muted" : "text-status-warn"} aria-hidden="true">
                ⚠
              </sub>
            </span>
          );
        }
        return (
          <Link
            key={i}
            href={clewCitedPageHref(bookId, s.page)}
            className={
              preview
                ? "text-muted underline decoration-dotted underline-offset-4"
                : "text-cinnabar no-underline hover:underline underline-offset-4"
            }
          >
            {s.text}
          </Link>
        );
      })}
    </>
  );
}

/** 答下一行：终态 clean 一句；否则五段计数。越窗未标 / 无此原子用琥珀，不用红、不用圆环。 */
export function AuditFace({
  audit,
  preview,
  cardAtoms,
  cardId,
  bookId,
  returnTo,
}: {
  audit?: ClewAnswerAudit | ClewAuditUnavailable;
  preview?: boolean;
  cardAtoms?: ClewCardAtomRef[];
  cardId?: string;
  bookId?: string;
  returnTo?: { href: string; label: string };
}) {
  if (!audit) return null;
  if (isAuditUnavailable(audit)) {
    return <span className="mt-1 block text-[11px] leading-5 text-muted">核账不可用</span>;
  }
  const c = audit.counts;
  const showClean = !preview && audit.clean && c.self_marked === 0 && c.range_too_wide === 0;
  const related = preview ? [] : relatedCardAtoms(cardAtoms ?? [], audit, 6);
  const studyHref = existingStudyHrefForCard(cardId, bookId);
  const warn = (n: number) => (!preview && n > 0 ? "text-status-warn" : undefined);
  return (
    <span className="mt-1 flex w-full flex-col gap-0.5">
      {showClean ? (
        <span
          className="text-[11px] leading-5 text-muted"
          title={`接地 ${c.grounded} · 上下文 ${c.context} · 自标未核验 0 · 越窗未标 0 · 无此原子 0`}
        >
          页码均在本次窗/上下文内（≠ 内容已核）
        </span>
      ) : (
        <span className={`text-[11px] leading-5 ${preview ? "text-muted" : "text-foreground/80"}`}>
          接地 {c.grounded}
          <span className="text-muted"> · </span>
          上下文 {c.context}
          <span className="text-muted"> · </span>
          自标未核验 {c.self_marked}
          <span className="text-muted"> · </span>
          <span className={warn(c.unmarked_out)}>越窗未标 {c.unmarked_out}</span>
          <span className="text-muted"> · </span>
          <span className={warn(c.unknown)}>无此原子 {c.unknown}</span>
        </span>
      )}
      {related.length > 0 ? (
        <span className="text-[11px] leading-5 text-muted">
          答涉及的当前卡原子
          {related.map((a) =>
            studyHref ? (
              <Link
                key={a.id}
                href={studyHref}
                onClick={() => {
                  if (returnTo) saveReturn({ ...returnTo, at: Date.now() });
                }}
                className="mono ml-2 text-cinnabar no-underline hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-cinnabar"
              >
                {a.id}
              </Link>
            ) : (
              <span key={a.id} className="mono ml-2">
                {a.id}
              </span>
            ),
          )}
        </span>
      ) : null}
    </span>
  );
}
