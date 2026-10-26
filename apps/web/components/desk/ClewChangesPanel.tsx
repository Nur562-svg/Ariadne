"use client";

import Link from "next/link";
import { useState } from "react";
import type { ClewContextData } from "@/components/desk/DeskContext";
import { useStudyGrades } from "@/lib/use-study-grades";
import { useHeYeStore } from "@/lib/use-heye-store";
import LocalProgressStrip from "@/components/LocalProgressStrip";
import { withQsMode } from "@/lib/qs-mode";
import { clewReturnPayload, type Act } from "@/components/desk/clew-pane-helpers";

/**
 * T75 机械抽出：原 ClewPane.tsx 内 ChangesPanel 整段迁此——useStudyGrades +
 * useHeYeStore（T71 uSES 口）、筛选芯片 / 空池门禁 / 截断诚实 / rememberReturn
 * 接线零改，仅换文件。
 */

/** 本轮变更：未接模型诚实空心——只读本浏览器 session 开始以来的 study/heye 标记。 */
export function ChangesPanel({
  since,
  clew,
  studyHref,
  reviewHref,
  rememberReturn,
}: {
  since: number;
  /** T19：Clew compact 进度条接上下文池（书桌 DocumentPane 随章/页写）；无池 → 全局计数。 */
  clew: ClewContextData;
  studyHref: string;
  reviewHref: string;
  /** T31 B：练/核 CTA 点前写 return 短链（回当前上下文）。 */
  rememberReturn: () => void;
}) {
  // T71：双仓共享 useSyncExternalStore 口（原 setTick 强制重渲染随订阅 effect 一并退役——
  // 原串变化即新快照引用，时间戳行自动重排；原串不变本就无事可刷）。答面核账 / 流式 /
  // 补丁 UI（T66–T70）不在本迁移职责内。
  const grades = useStudyGrades();
  const heye = useHeYeStore();
  /** T43 D：本地面 kind 筛选（全部｜练｜核）——只影响展示，不改本机记录、不新建 storage。 */
  const [kindFilter, setKindFilter] = useState<"all" | "study" | "heye">("all");

  const acts: Act[] = [];
  /**
   * T51 C：空态双链 / 筛空单侧 CTA 的池门禁——与 stub 气泡 / chat 空态 / Queue 主 CTA
   * 同一 progress* 口径（fail-closed 缺省 0）；===0 降 muted 纯文不可点，>0 保持 +
   * rememberReturn。只门禁 CTA，不动 T43 筛选芯片 /「还有 N」截断 / 本轮标记模型。
   */
  const atomN = clew.progressAtoms?.length ?? 0;
  const pendingN = clew.progressItems?.length ?? 0;
  for (const [key, g] of Object.entries(grades)) {
    if (typeof g?.t !== "number" || g.t < since) continue;
    // T33 B：`${cardId}/${atomId}` 取首段 cardId（fail-closed：无斜杠/空段 → 无链纯文行）。
    const slash = key.indexOf("/");
    acts.push({
      t: g.t,
      kind: "study",
      cardId: slash > 0 ? key.slice(0, slash) : undefined,
      text: `自评 · ${g.k === 1 ? "认识" : "不熟"}`,
    });
  }
  for (const [key, m] of Object.entries(heye)) {
    if (typeof m?.t !== "number" || m.t < since) continue;
    // T33 B：`${cardId}|${page}|…` 取 cardId + page（页段正整数才采信）+ 标记档。
    const seg = key.split("|");
    const pageStr = /^\d+$/.test(seg[1] ?? "") ? seg[1] : undefined;
    acts.push({
      t: m.t,
      kind: "heye",
      cardId: seg[0] ? seg[0] : undefined,
      page: pageStr != null ? Number(pageStr) : undefined,
      mark: m.s,
      text: `核页${pageStr != null ? ` p.${pageStr}` : ""} · ${
        m.s === "checked" ? "本机已对" : "本机存疑"
      }`,
    });
  }
  acts.sort((a, b) => b.t - a.t);
  /**
   * T43 D：筛选先于截断——按 kind 过滤后再 slice(0, 20)；筛后超过 20 条如实报「还有 N 条」
   * （本机标记，非 Due）。练/核分计数随 acts 全量算，筛前就能看出核是不是 0。
   */
  const studyCount = acts.filter((a) => a.kind === "study").length;
  const heyeCount = acts.length - studyCount;
  const filtered = kindFilter === "all" ? acts : acts.filter((a) => a.kind === kindFilter);
  const shown = filtered.slice(0, 20);
  const hiddenCount = filtered.length - shown.length;

  /**
   * T33 B：条目深链（fail-closed）：解析不出 cardId → 空数组（纯文行，不编造）。
   * - study：主链开卡 /desk/card/<id>；有当前书 → 次级 /study?card=&book=&mode=all（点前 rememberReturn）。
   * - heye：核链 /review?card=&page=&book=&mode=按标记档（checked/doubt，无标记态回落 open）；
   *   无书时省 book=（review 面按 card+page 交集过滤）；开卡互补始终给。
   * T41 C：「开卡 →」同样 remember: true——与「练该卡 →」「核该* →」同真回程（渲染侧
   * onClick={l.remember ? rememberReturn : undefined} 已就绪，只改数据）。
   * 客户端无卡表：只展示 mono cardId，不编造中文卡名；card 与当前书不匹配时 review 面自己诚实警告。
   */
  function actLinks(a: Act): { label: string; href: string; remember?: boolean }[] {
    if (!a.cardId) return [];
    const cardQ = `card=${encodeURIComponent(a.cardId)}`;
    const bookQ = clew.book ? `&book=${encodeURIComponent(clew.book.id)}` : "";
    if (a.kind === "study") {
      const links: { label: string; href: string; remember?: boolean }[] = [
        { label: "开卡 →", href: `/desk/card/${encodeURIComponent(a.cardId)}`, remember: true },
      ];
      if (clew.book) {
        links.push({ label: "练该卡 →", href: `/study?${cardQ}${bookQ}&mode=all`, remember: true });
      }
      return links;
    }
    const mode = a.mark === "checked" || a.mark === "doubt" ? a.mark : "open";
    return [
      {
        label: a.page != null ? "核该页 →" : "核该卡 →",
        href: `/review?${cardQ}${a.page != null ? `&page=${a.page}` : ""}${bookQ}&mode=${mode}`,
        remember: true,
      },
      { label: "开卡 →", href: `/desk/card/${encodeURIComponent(a.cardId)}`, remember: true },
    ];
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <p className="rounded-lg border border-line bg-background px-3 py-2 text-xs leading-6 text-muted">
        <span className="font-medium text-foreground/80">未接模型。</span>
        这里没有可确认的写入提议；下列只读本浏览器本轮自评/核页标记。
      </p>

      {/* T19 Clew compact 章作用域：有池（DocumentPane 随章/页写）按池收窄，数字应明显小于全书；
          无池保持全局计数并给一句诚实说明。scopeLabel/href 与中栏 Strip 同一来源。
          T36 E：有 progress* href 时下传 mode 分段——有池分段 N>0 可点进同范围档；
          无 progress*（未定位章）不下传，全局计数保持纯文。
          T40 D：returnTo=clewReturnPayload——条末练/核与 N>0 分段点前写 return，与空态
          CTA / stub 气泡链同一 payload（有页→书桌 p.N；卡面→卡枢纽；仅书→书级；
          书架/无上下文 null 不传不写，行为与前同）。 */}
      <LocalProgressStrip
        compact
        atoms={clew.progressAtoms}
        items={clew.progressItems}
        scopeLabel={clew.progressScopeLabel}
        studyHref={clew.progressStudyHref}
        reviewHref={clew.progressReviewHref}
        returnTo={clewReturnPayload(clew) ?? undefined}
        studyModeHrefs={
          clew.progressStudyHref
            ? {
                all: withQsMode(clew.progressStudyHref, "all"),
                unknown: withQsMode(clew.progressStudyHref, "unknown"),
                ungraded: withQsMode(clew.progressStudyHref, "ungraded"),
              }
            : undefined
        }
        heyeModeHrefs={
          clew.progressReviewHref
            ? {
                open: withQsMode(clew.progressReviewHref, "open"),
                checked: withQsMode(clew.progressReviewHref, "checked"),
                doubt: withQsMode(clew.progressReviewHref, "doubt"),
              }
            : undefined
        }
      />
      {!clew.progressAtoms && !clew.progressItems ? (
        <p className="mt-1 text-[11px] leading-5 text-muted">
          未定位章 · 全书本机记录；到书桌打开书目后按章/页收窄。
        </p>
      ) : null}

      {/* T43 D：本地面 kind 筛选芯片（全部｜练｜核）——当前档朱红 soft（对齐 ModeChips/章芯片
          气质，勿第二品牌色）；只筛展示不改记录，右侧如实给本轮练/核分计数。 */}
      {acts.length > 0 ? (
        <div
          className="mt-3 flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="按练/核筛选本轮标记"
        >
          {(
            [
              ["all", "全部"],
              ["study", "练"],
              ["heye", "核"],
            ] as ["all" | "study" | "heye", string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              aria-pressed={kindFilter === k}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                kindFilter === k
                  ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                  : "border-line text-muted hover:border-cinnabar hover:text-cinnabar"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-1 text-[11px] leading-5 text-muted">
            本轮 练 {studyCount} · 核 {heyeCount}
          </span>
        </div>
      ) : null}

      {acts.length === 0 ? (
        <div className="mt-6 border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
          本轮还没有本机标记——去学习环自评或核页对页后回到这里。
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {atomN > 0 ? (
              <Link
                href={studyHref}
                onClick={rememberReturn}
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                去学习环自评 →
              </Link>
            ) : (
              <span className="text-muted" title="当前范围没有可练原子">
                暂无原子
              </span>
            )}
            {pendingN > 0 ? (
              <Link
                href={reviewHref}
                onClick={rememberReturn}
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                去核页对页 →
              </Link>
            ) : (
              <span className="text-muted" title="当前范围没有待核 cite">
                暂无待核
              </span>
            )}
          </p>
        </div>
      ) : shown.length === 0 ? (
        /* T43 D 筛空诚实句：本轮只有另一侧写入了本机标记，不假装空无一物；
           CTA 随筛给对应侧（return 接线沿用 rememberReturn，不拆 T40/T41）。 */
        <div className="mt-6 border-l-2 border-cinnabar/40 pl-4 text-sm leading-7 text-foreground/90">
          本轮暂无「{kindFilter === "study" ? "练" : "核"}」标记——
          {kindFilter === "study"
            ? `只有核页标记（${heyeCount} 条）写入了本机记录。`
            : `只有学习环自评（${studyCount} 条）写入了本机记录。`}
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {/* T43 D 筛空只给对应侧 CTA；T51 C 同池门禁——===0 纯文（不装能进空环），
                >0 保持 + rememberReturn（T40/T41 接线不拆）。 */}
            {kindFilter === "study" ? (
              atomN > 0 ? (
                <Link
                  href={studyHref}
                  onClick={rememberReturn}
                  className="text-cinnabar no-underline hover:underline underline-offset-4"
                >
                  去学习环自评 →
                </Link>
              ) : (
                <span className="text-muted" title="当前范围没有可练原子">
                  暂无原子
                </span>
              )
            ) : pendingN > 0 ? (
              <Link
                href={reviewHref}
                onClick={rememberReturn}
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                去核页对页 →
              </Link>
            ) : (
              <span className="text-muted" title="当前范围没有待核 cite">
                暂无待核
              </span>
            )}
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {shown.map((a, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border border-line bg-background px-3 py-2 text-sm leading-6"
              >
                <span
                  className={`mono shrink-0 text-[10px] ${a.kind === "study" ? "text-cinnabar" : "text-status-warn"}`}
                >
                  {a.kind === "study" ? "练" : "核"}
                </span>
                {/* T33 B densify：mono 短 id 替代「自评「生 cardId」」整串引号文案；无卡表不编中文名。 */}
                {a.cardId ? (
                  <span className="mono shrink-0 text-[11px] text-muted">{a.cardId}</span>
                ) : null}
                <span className="min-w-0 flex-1 text-foreground/90">{a.text}</span>
                {/* T33 B：可点回——开卡（次级 muted）；练/核链点前 rememberReturn（与空态 CTA 同）。 */}
                {actLinks(a).map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={l.remember ? rememberReturn : undefined}
                    className="shrink-0 text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                  >
                    {l.label}
                  </Link>
                ))}
                <span className="mono shrink-0 text-[10px] text-muted">
                  {new Date(a.t).toLocaleTimeString("zh-CN", { hour12: false })}
                </span>
              </li>
            ))}
          </ul>
          {/* T43 D 截断诚实：筛选后超过 20 条——只列前 20，余下如实报数（本机标记，非 Due）。 */}
          {hiddenCount > 0 ? (
            <p className="mt-2 text-[11px] leading-5 text-muted">
              还有 {hiddenCount} 条本轮未列——只读本机标记，非 Due。
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
