"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HeYeItem } from "@/lib/heye";
import type { Cite, PageDoc } from "@/lib/entities";
import CitePeek from "@/components/CitePeek";
import {
  clearHeYeMarks,
  countPoolMarks,
  filterItemsByMode,
  loadHeYeStore,
  setHeYeMark,
  setHeYeMarks,
  type HeYeMark,
  type HeYeMode,
  type HeYeStore,
} from "@/lib/heye-store";
import { clearCursor, loadCursor, saveCursor } from "@/lib/session-continuity";
import { loadReturn, saveReturn, type ReturnEntry } from "@/lib/return-stack";
import { isEditableTarget, isPeekOpen } from "@/lib/keyboard";
import SessionKeyHint from "@/components/SessionKeyHint";

/**
 * 档位芯片（T25 A）：待核/已对/存疑 本机计数，可点切档（URL 规则与 sticky 三档一致）；
 * 当前档高亮。扫视控件，非掌握色环；仅在池空/档内空态出现，核中不插队。
 * T38 E：本档 N=0 且非当前档 → 纯文 span（边框保留、无 hover，不假装能点进空池）；
 * N>0 且有 href 仍 Link；当前档无论计数保持指示（有 href 为 Link + 当前样式，无则
 * 当前样式 span）。空/完成态主 CTA「回待核档 / 去学习环」是切档主路径，不受影响。
 */
function HeYeModeChips({
  counts,
  mode,
  hrefs,
}: {
  counts: { open: number; checked: number; doubt: number };
  mode: HeYeMode;
  hrefs: Record<HeYeMode, string | undefined>;
}) {
  const rows: [HeYeMode, string, number][] = [
    ["open", "待核", counts.open],
    ["checked", "已对", counts.checked],
    ["doubt", "存疑", counts.doubt],
  ];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {rows.map(([m, label, n]) => {
        const text = `${label} ${n}`;
        if (n === 0 && mode !== m) {
          return (
            <span
              key={m}
              aria-disabled="true"
              title="本档暂无记录"
              className="cursor-default rounded-full border border-line px-3 py-1 text-xs text-muted"
            >
              {text}
            </span>
          );
        }
        const cls = `rounded-full border px-3 py-1 text-xs no-underline transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
          mode === m
            ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
            : "border-line text-muted hover:border-cinnabar hover:text-cinnabar"
        }`;
        return hrefs[m] ? (
          <Link key={m} href={hrefs[m] as string} className={cls}>
            {text}
          </Link>
        ) : (
          <span key={m} className={cls}>
            {text}
          </span>
        );
      })}
    </div>
  );
}

/**
 * 核页对页会话（/review 中栏，客户端）：
 * 左 quote/上下文 ↔ 右该印刷页 OCR 原文（loadAllChapterPages 真页，服务端过滤后传入）。
 * 「本机已对 / 存疑」只写浏览器 localStorage（ariadne.heye.v1，lib/heye-store）——与 seed 抽查
 * verified 完全分离，绝不回写 data/cards（禁止 verified:true 过关）。
 * desk-heye-batch-filter-01（T16）：本机态三档（待核｜已对｜存疑）在客户端过滤可见队列；
 * 待核档提供同页批量「本机已对」（次级加速器，仍只写本浏览器）。
 */
export default function HeYeSession({
  items,
  pages,
  scopeLabel,
  mode,
  cardHref,
  studyHref,
  emptyKind = null,
  atomCount = 0,
  deskPageHref,
  openHref,
  checkedHref,
  doubtHref,
  clearChapterHref,
  clearPageHref,
  orphanPage,
  loopKeys,
  scopeKey,
  leaveReturnTo,
}: {
  /** 全池待核队列（服务端 collectCiteQueue，已按页码排序；本机态过滤在客户端）。 */
  items: HeYeItem[];
  /** 队列涉及的 OCR 页（真 loadAllChapterPages 子集，按 page 索引）。 */
  pages: PageDoc[];
  /** 范围说明（全书库 / 某书书名 / 单卡卡名 / 章），用于副文。 */
  scopeLabel: string;
  /** 档位：待核｜已对｜存疑（本机态，非到期调度）。 */
  mode: HeYeMode;
  /** 单卡范围（/review?card=）：空队列/全部对过时链回本卡。 */
  cardHref?: string;
  /** 跨环学习链（有卡带 ?card=，否则 /study）。 */
  studyHref?: string;
  /**
   * T52 C/E：服务端池空分型（review 页推导，对齐 study 的 orphan / cardOutOfRange / 真空
   * 三型）——'orphan'=合法 pageNum · 非单卡 · 池空（页无 cite 或未解析 OCR）；
   * 'card-out'=单卡在宽范围有待核、当前 book/chapter/page 过滤交集为空（越界）；
   * 'true-empty'=真无待核数据（引导 /ingest · 书架，不装假池）。缺省 null → 通用句。
   */
  emptyKind?: "orphan" | "card-out" | "true-empty" | null;
  /**
   * T51 J：交叉练链（去学习环 / 去学习本卡）的对侧真池——父页按 studyHref 同范围
   * collectStudyAtoms 装配（review 页：单卡=卡池、有效页非孤儿=页池、无页=章/书池）；
   * 缺省 0（fail-closed）。===0 时空/完成态练链降 muted 纯文不可点、不写
   * leaveReturnTo；>0 保持链 + leaveReturnTo（T42 接线不拆）。
   */
  atomCount?: number;
  /** 单页范围（/review?page=）：空队列/全部对过时优先链回书桌本页（/desk?book=&page=）。 */
  deskPageHref?: string;
  /** 空档「回待核」链（同范围 ?mode=open）。 */
  openHref?: string;
  /** 档位芯片「已对」目标：同范围 ?mode=checked（T25 A）。 */
  checkedHref?: string;
  /** 档位芯片「存疑」目标：同范围 ?mode=doubt（T25 A）。 */
  doubtHref?: string;
  /** 章范围清章回全书核页（/review?chapter=null 等价）——池空/档空时限宽范围。 */
  clearChapterHref?: string;
  /**
   * T28 A：本页过滤放宽链（/review?book=&chapter= 只删 page，留书/章/档）——
   * 池空/档内空两处次级「清本页 →」；仅有效 pageNum 时由父页传入，不新增第二颗实心主按钮。
   * T29 C：孤儿核（合法 page · 非单卡 · 池空）时它升为唯一朱红主 CTA，不再重复列次级。
   */
  clearPageHref?: string;
  /**
   * T29 C：孤儿核标志（父页服务端判定：合法 pageNum · 非单卡 · items.length===0）——
   * 池空态主 CTA 换「清本页，换到本章核」，「去学习环」降次级（studyHref 父页已消毒无 page）。
   */
  orphanPage?: boolean;
  /**
   * T29 E：父页算好的本页环键（g 清本页 / ⇧[ ⇧] 切章；与 sticky 键岛同源 stickyKeys）——
   * 仅当前真可用时传入；无本页过滤不列 g，无章芯片不列 ⇧[]，题内键恒保留。
   */
  loopKeys?: [string, string][];
  /** 续位作用域（与父级 remount key 一致）：`${book|all}:${card|all}:${page|all}:${chapter|all}:${mode}`。 */
  scopeKey: string;
  /**
   * T42 C/D：离面进练链（去学习环 / 去学习本卡 + 核中卡名开卡 / 在书桌打开 p.N）点前的
   * return payload——父传 reviewReturnTo（与页头 Strip / sticky CrossScope 同一份，禁第二套）；
   * 缺省不写。回本卡 / 回书桌本页 / 回书桌**不写**（那是回程不是进环，避免互谎）。
   * key 仍 ariadne.desk.return.v1。
   */
  leaveReturnTo?: { href: string; label: string };
}) {
  const [store, setStore] = useState<HeYeStore>({});
  const [index, setIndex] = useState(0);
  /** 本标签续位标记（恢复游标时置位），用于诚实续练文案。 */
  const [resumed, setResumed] = useState(false);
  /**
   * 本轮撤销栈（T53 G，对齐 StudySession T25 B；薄组件态不持久化，refresh / 换范围重挂载即清）：
   * 每次标记压一条 { keys, prevMarks, idx }——单标 keys=1；同页批量 b 的全部 keys 进**同一条**
   * entry（整批一次可回滚）；prevMarks=写标前盘面各 key 旧档（undefined=原未标）。
   * u/z 弹栈按 prev 写回或删 key、游标回 idx；无栈 no-op。
   */
  const [undoStack, setUndoStack] = useState<
    { keys: string[]; prevMarks: (HeYeMark | undefined)[]; idx: number }[]
  >([]);
  /** 「回到刚才」return 短链（出发写于书桌章页 / 卡枢纽）。 */
  const [ret, setRet] = useState<ReturnEntry | null>(null);
  const citeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setRet(loadReturn());
  }, []);

  // 挂载后读本机态（SSR 不读 localStorage，避免水合不一致）；换范围/档位由父级 key 重挂载。
  // 同时恢复本标签会话游标并 clamp 到可见队列（filterItemsByMode 同步可用）。
  useEffect(() => {
    const s = loadHeYeStore();
    setStore(s);
    const saved = loadCursor("heye", scopeKey);
    if (saved != null) {
      const nv = filterItemsByMode(items, s, mode);
      if (nv.length > 0) {
        setIndex(Math.max(0, Math.min(saved, nv.length - 1)));
        // 仅当恢复到 >0 的推进位置才提示「续上」（对称 StudySession），避免「仅刷新」误显。
        if (saved > 0) setResumed(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 游标写回：index 每次变化写 sessionStorage（续位用；go/mark 都经 index 变化触发）。 */
  useEffect(() => {
    saveCursor("heye", scopeKey, index);
  }, [index, scopeKey]);

  /** 当前档可见队列（本机态过滤，保持全池顺序）。 */
  const visible = useMemo(() => filterItemsByMode(items, store, mode), [items, store, mode]);
  /** 全池累计（本范围，本机态）：待核 / 已对 / 存疑。 */
  const counts = useMemo(() => countPoolMarks(items, store), [items, store]);
  /** 档位芯片目标（T25 A）：池空/档内空态渲染，缺 href 退化为纯计数 chip。 */
  const modeChipHrefs: Record<HeYeMode, string | undefined> = useMemo(
    () => ({ open: openHref, checked: checkedHref, doubt: doubtHref }),
    [openHref, checkedHref, doubtHref],
  );
  /** key → 全池下标（标完跳下一条用）。 */
  const posOf = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((it, j) => m.set(it.key, j));
    return m;
  }, [items]);

  const pageByNo = useMemo(() => {
    const m = new Map<number, PageDoc>();
    for (const p of pages) if (p.page != null) m.set(p.page, p);
    return m;
  }, [pages]);

  /** 可编辑目标（输入框/文本域/下拉/富文本）不拦截键盘（含 activeElement 兜底）。 */
  function silentKeyTarget(target: EventTarget | null): boolean {
    return isEditableTarget(target);
  }

  /**
   * 键盘环（T18）：1 本机已对 · 2 存疑 · ←/j 上一条 · →/k 下一条 · b 同页批量（仅待核档）。
   * T53 H：u/z 撤销本轮最后一标（对齐 Study；放在 visible 空档守卫**之前**——标完最后一条
   * 跳「全部对过」完成态后仍可 u/z 回退误标，Study 完成态因队列守卫不可退是既有差异，不回改）。
   * 挂在 window；可编辑目标 / 「摘」浮层静默；undo 声明在后（函数声明提升）。
   */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (silentKeyTarget(e.target)) return;
      // 「摘」浮层开着：让路（不打标、不切条）——关掉浮层即恢复（review-fix-integrity E）。
      if (isPeekOpen()) return;
      if (e.key === "u" || e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (visible.length === 0) return;
      if (e.key === "1") {
        e.preventDefault();
        markOne("checked");
      } else if (e.key === "2") {
        e.preventDefault();
        markOne("doubt");
      } else if (e.key === "ArrowLeft" || e.key === "j") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "ArrowRight" || e.key === "k") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "b" && mode === "open") {
        if (samePageOpen.length >= 1) {
          e.preventDefault();
          markSamePage();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length, index, mode, store, undoStack]);

  /** 焦点跟当前条：续位后 / 每次 jump，焦点落到左「待核引用」容器（tabIndex=-1）。 */
  useEffect(() => {
    if (visible.length > 0 && index < visible.length) {
      citeRef.current?.focus({ preventScroll: true });
    }
  }, [index, visible.length]);

  /** 标完跳到下一条仍属本档的项（按全池顺序；没有则停在最后一条，空档由空态分支接管）。 */
  function advance(nextStore: HeYeStore, fromKey: string) {
    const fromPos = posOf.get(fromKey) ?? -1;
    if (fromPos < 0) return;
    const nv = filterItemsByMode(items, nextStore, mode);
    const nextIdx = nv.findIndex((it) => (posOf.get(it.key) ?? -1) > fromPos);
    if (nextIdx >= 0) setIndex(nextIdx);
    else setIndex(Math.min(index, nv.length - 1));
  }

  /**
   * 清除本机核页记录（review-fix-integrity G）：先 confirm（原生浏览器确认，勿新模态皮），
   * 只清**当前范围**（items 池内 keys）——其它书/范围的记录不动；文案如实说明范围与
   * 「只清本浏览器 localStorage，不影响 seed 抽查 verified」。无可清项则 no-op。
   */
  function resetStore() {
    const scopedKeys = items.filter((it) => store[it.key]).map((it) => it.key);
    if (scopedKeys.length === 0) return;
    const total = Object.keys(store).length;
    const outside = total - scopedKeys.length;
    const ok = window.confirm(
      outside > 0
        ? `清除本范围（${scopeLabel}）的 ${scopedKeys.length} 条本机核页记录？其它书/范围的 ${outside} 条保留。只清本浏览器（localStorage），不影响教材侧「抽查 verified」。`
        : `清除本范围（${scopeLabel}）的 ${scopedKeys.length} 条本机核页记录？本浏览器的全部核页记录都在此范围内。只清本浏览器（localStorage），不影响教材侧「抽查 verified」。`,
    );
    if (!ok) return;
    setStore(clearHeYeMarks(scopedKeys));
    clearCursor("heye", scopeKey);
    setIndex(0);
    setResumed(false);
    // T53 G：整范围清空是显式确认过的重置——撤销栈随之清空（prev 已不可信，不装可回滚）。
    setUndoStack([]);
  }

  /** T42 C/D：离面进练/开卡/开书桌前写 leaveReturnTo（父传 reviewReturnTo，与 Strip/CrossScope 同源）；缺省 no-op。 */
  function rememberLeave() {
    if (leaveReturnTo) saveReturn({ ...leaveReturnTo, at: Date.now() });
  }

  // ---- 空态分支 ----

  /**
   * 服务端池空：本范围没有「有页码但未抽查」的引用。一颗主 CTA + 次级文字链 + 档位芯片。
   * T52 C：chrome 对齐 Study 空态（卡片 section + h2「这个范围是空的」）——body 按
   * emptyKind 分型说真话（orphan=页无 cite / 未解析 OCR · card-out=单卡被 book/chapter/page
   * 滤空越界 · true-empty=真无数据引导 /ingest，不装假池）；CTA 行（含 T51 atomCount
   * 门禁）与档位芯片原样，「去学习环 /study →」丑标签修正为「去学习环 →」（href 不变）。
   */
  if (items.length === 0) {
    return (
      <section className="mt-10 rounded-lg border border-line bg-card p-6">
        <h2 className="text-xl font-semibold">这个范围是空的</h2>
        <p className="mt-3 text-sm leading-7 text-foreground/90">
          {emptyKind === "orphan" ? (
            <>
              本页没有待核 cite——没有「有页码但未抽查」的引用落在这一印刷页，或该页尚未解析
              OCR；清本页可放宽到本章 / 本书。
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

  /**
   * 档内空：open 空 = 本范围全标完（完成族标题 + 诚实绿条保留）；checked/doubt 空 =
   * 独立短标题「这个档还没有本机记录」（T52 D：与池真空「这个范围是空的」不同句）。
   * chrome 对齐 Study 空/完成卡片（section + h2）；CTA 行（含 T51 atomCount 门禁）原样。
   */
  if (visible.length === 0) {
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

  // ---- 会话主流程 ----

  const i = Math.min(index, visible.length - 1);
  const cur = visible[i];
  const mark = store[cur.key];
  const pg = pageByNo.get(cur.page);
  const deskHref = `/desk?${cur.bookId ? `book=${encodeURIComponent(cur.bookId)}&` : ""}page=${cur.page}`;

  /** 同页其余待核（全池，同一印刷页、未标、不含当前条）——批量清同页 / 可点跳条。 */
  const samePageOpen = items.filter(
    (it) => it.page === cur.page && !store[it.key] && it.key !== cur.key,
  );
  /**
   * 当前条的 Cite 快照：队列定义即 seed verified===false。
   * 禁止改写成 true——「本机已对」只进 localStorage，与 seed 抽查态无关。
   */
  const curCite: Cite = { page: cur.page, quote: cur.quote, verified: false };

  function go(nextIdx: number) {
    setIndex(Math.max(0, Math.min(visible.length - 1, nextIdx)));
  }

  function markOne(s: "checked" | "doubt") {
    // T53 G：写标前压撤销栈（读盘面最新值当 prev，避免闭包陈旧；idx 记写标时游标）。
    const prev = loadHeYeStore();
    setUndoStack((st) => [...st, { keys: [cur.key], prevMarks: [prev[cur.key]], idx: i }]);
    const next = setHeYeMark(cur.key, s);
    setStore(next);
    advance(next, cur.key);
  }

  function markSamePage() {
    const keys = samePageOpen.map((it) => it.key);
    // T53 G：同页批量 = 单条栈 entry（整批一次 u/z 回滚；prevMarks 逐 key 记写标前旧档）。
    const prev = loadHeYeStore();
    setUndoStack((st) => [...st, { keys, prevMarks: keys.map((k) => prev[k]), idx: i }]);
    const next = setHeYeMarks(keys, "checked");
    setStore(next);
    advance(next, cur.key);
  }

  /**
   * 撤销本轮最后一标（T53 G，u/z）：按 prevMarks 写回旧档（undefined = 原未标 → 删 key）、
   * 游标回到写标时位置；无栈 no-op。栈是组件态不持久化（refresh / 换范围重挂载即清）；
   * 只回退本浏览器 localStorage 的本轮标记，不动 seed / verified。
   */
  function undo() {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    let next = loadHeYeStore();
    const toClear: string[] = [];
    for (let j = 0; j < last.keys.length; j++) {
      const k = last.keys[j];
      const prev = last.prevMarks[j];
      if (prev) next = setHeYeMark(k, prev.s);
      else toClear.push(k);
    }
    if (toClear.length > 0) next = clearHeYeMarks(toClear);
    setStore(next);
    setUndoStack((st) => st.slice(0, -1));
    setIndex(last.idx);
  }

  return (
    <div className="mt-6">
      {/* 进度行：队列位置按「本档」，计数按「本范围」全池。 */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-muted">
          第 <span className="font-semibold text-foreground">{i + 1}</span> / {visible.length} 条
          <span className="ml-1">（本档）</span>
          <span className="ml-3">本范围</span>
          <span className="ml-1 text-status-ok">已对 {counts.checked}</span>
          <span className="ml-2 text-status-warn">存疑 {counts.doubt}</span>
          <span className="ml-2">待核 {counts.open}</span>
        </p>
        <nav className="flex gap-3 text-sm" aria-label="队列翻页">
          <button
            onClick={() => go(i - 1)}
            disabled={i === 0}
            className="text-muted hover:text-cinnabar disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar"
          >
            ← 上一条
          </button>
          <button
            onClick={() => go(i + 1)}
            disabled={i >= visible.length - 1}
            className="text-muted hover:text-cinnabar disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar"
          >
            下一条 →
          </button>
        </nav>
      </div>
      {/* T25 B：键说明与 study 对齐一族风格（muted 小字 + mono 键帽）；b 仅待核档。
          T28 F→T29 E：本页环键（g 清本页 / ⇧[] 切章）由父页按当前真可用性传入 loopKeys
          （与 sticky 键岛同源）——无本页过滤不列 g，无章芯片不列 ⇧[]，题内键恒保留。
          T44 B：键帽与 onKey 同真——上下条拆两行列出 j 与 k（核侧导航，非练侧 j/k 评分）。
          T53 H：u/z 撤销本轮最后一标（onKey 同真；b 批量整条回滚）。 */}
      <SessionKeyHint
        className="mt-1"
        keys={[
          ["1", "已对"],
          ["2", "存疑"],
          ["←/j", "上条"],
          ["→/k", "下条"],
          ["u/z", "撤销本轮最后一标"],
          ...(mode === "open" && samePageOpen.length >= 1
            ? ([["b", "同页批量"]] as [string, string][])
            : []),
          ...(loopKeys ?? []),
        ]}
      />

      {resumed ? (
        <p
          aria-live="polite"
          className="mt-2 border-l-2 border-line pl-3 text-xs leading-5 text-muted"
        >
          已从本标签续上：第 {i + 1} / {visible.length} 条（仅当前标签会话，非跨设备同步）。
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* 左：cite 上下文 */}
        <section
          ref={citeRef}
          tabIndex={-1}
          aria-label="待核引用"
          className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-cinnabar/40"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-muted">待核引用</h2>
            {mark ? (
              <span
                className={`mono rounded border px-1.5 py-0.5 text-[11px] ${
                  mark.s === "checked"
                    ? "border-status-ok/40 bg-status-ok-bg text-status-ok"
                    : "border-amber-300 bg-status-warn-bg text-status-warn"
                }`}
              >
                {mark.s === "checked" ? "本机已对" : "本机存疑"}
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm">
            {/* T42 D：核中开卡旁路点前写 leaveReturnTo——回当前核页（与进练链同一 payload）。 */}
            <Link
              href={`/desk/card/${encodeURIComponent(cur.cardId)}`}
              onClick={leaveReturnTo ? rememberLeave : undefined}
              className="font-semibold text-cinnabar no-underline hover:underline underline-offset-4"
            >
              {cur.cardName}
            </Link>
            <span className="ml-2 text-muted">
              {cur.sourceLabel}
              {cur.chapterId ? ` · ${cur.chapterId}` : ""} · 引
            </span>
            {/* Peek 为旁路深链：quote 正文仍在下方 blockquote；verified 恒 false（见 curCite 注释）。
                T49 F：从全池 items（collectCiteQueue 同源，非档位过滤）下传真计数——本卡待核
                （cardId 计数，与卡枢纽 collectCiteQueue({cardId}) 同族）· 本页待核（page 计数，
                与书桌 pendingByPage 同族）。会话内 cur 自身即队列项，两数恒 ≥1（真数非造假），
                「核本卡/核本页」浮层 CTA 与枢纽/轨顶同真不进空池。 */}
            <span className="ml-1">
              <CitePeek
                cite={curCite}
                deskBookId={cur.bookId}
                cardId={cur.cardId}
                pendingCiteCount={items.filter((it) => it.cardId === cur.cardId).length}
                pendingPageCount={items.filter((it) => it.page === cur.page).length}
              />
            </span>
          </p>

          {cur.quote ? (
            <blockquote className="mt-3 rounded-lg border border-line bg-card p-4 text-sm leading-7 text-foreground/90">
              “{cur.quote}”
            </blockquote>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-line p-4 text-sm text-muted">
              这条引用没有记录引文片段——按上下文到右页找对应位置。
            </p>
          )}

          {cur.context && cur.context !== cur.quote ? (
            <p className="mt-3 text-sm leading-7 text-muted">
              <span className="text-foreground/80">上下文：</span>
              {cur.context.length > 160 ? `${cur.context.slice(0, 160)}…` : cur.context}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => markOne("checked")}
              className={`rounded-md px-4 py-2 text-sm transition-opacity focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                mark?.s === "checked"
                  ? "bg-status-ok text-white"
                  : "border border-status-ok/50 text-status-ok hover:bg-status-ok-bg"
              }`}
            >
              本机已对
            </button>
            <button
              onClick={() => markOne("doubt")}
              className={`rounded-md px-4 py-2 text-sm transition-opacity focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                mark?.s === "doubt"
                  ? "bg-status-warn text-white"
                  : "border border-amber-300 text-status-warn hover:bg-status-warn-bg"
              }`}
            >
              存疑
            </button>
            <button
              onClick={() => go(i + 1)}
              disabled={i >= visible.length - 1}
              className="rounded-md border border-line px-4 py-2 text-sm text-muted hover:text-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar"
            >
              跳过 →
            </button>
          </div>

          {/* 同页批量 + 同页跳核列表（次级加速器，仅待核档；只写本浏览器，不等同 seed verified）。
              T19：samePageOpen 条可点跳（open 档下均在本档可见；点击只 go 定位、不写任何本机态）。 */}
          {mode === "open" && samePageOpen.length >= 1 ? (
            <div className="mt-4 border-t border-line pt-3">
              <button
                onClick={markSamePage}
                className="rounded-md border border-line px-4 py-2 text-sm text-muted no-underline transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
              >
                本页其余 {samePageOpen.length} 条一并「本机已对」→
              </button>
              <p className="mt-2 text-xs font-medium text-muted">本页其余待核条目（点击定位，不批量打标）：</p>
              <ul className="mt-1 space-y-0.5">
                {samePageOpen.map((it) => (
                  <li key={it.key}>
                    <button
                      onClick={() => {
                        // 跳转到该项在本档中的下标；不在本档（如已切档）则忽略——open 档下恒可跳。
                        const vi = visible.findIndex((v) => v.key === it.key);
                        if (vi >= 0) go(vi);
                      }}
                      className="max-w-full truncate text-left text-xs leading-5 text-muted transition-colors hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                    >
                      <span className="font-medium text-foreground/75">{it.cardName}</span>
                      <span className="ml-1">· {it.sourceLabel}</span>
                      {it.quote ? (
                        <span className="ml-1">
                          · “{it.quote.length > 36 ? `${it.quote.slice(0, 36)}…` : it.quote}”
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-xs leading-6 text-muted">
                点击条目只跳定位，不改本机态；批量只写本浏览器（localStorage），表示你拿 quote
                对着 OCR 页看过；它不等于教材侧「抽查 verified」，也不显示「本页已全核」。
              </p>
            </div>
          ) : null}

          <p className="mt-4 text-xs leading-6 text-muted">
            「本机已对」只存在这个浏览器（localStorage），表示你拿 quote 对着 OCR 页看过；
            它不等于教材侧「抽查 verified」，也不会改写 seed 数据。
          </p>
          <p className="mt-2 text-xs">
            {/* T42 D：核中「在书桌打开 p.N」离面点前写 leaveReturnTo——回到刚才回当前核页。
                T53 E：右栏 OCR 映射无此页（!pg）→ 左侧不再装能定位——降纯文「本页无 OCR」
                不 Link 不写 return；有 pg 保持链 + leaveReturnTo。右栏琥珀警告保留。 */}
            {pg ? (
              <Link
                href={deskHref}
                onClick={leaveReturnTo ? rememberLeave : undefined}
                className="text-cinnabar no-underline hover:underline underline-offset-4"
              >
                在书桌打开 p.{cur.page} →
              </Link>
            ) : (
              <span className="text-muted" title="该印刷页尚未解析 OCR——书桌章页定位不了">
                p.{cur.page} · 本页无 OCR
              </span>
            )}
          </p>
        </section>

        {/* 右：OCR 原文 */}
        <section aria-label="印刷页 OCR" className="min-w-0 max-xl:border-t max-xl:pt-6 xl:border-l xl:border-line xl:pl-6">
          <h2 className="text-sm font-semibold text-muted">印刷页 OCR（原文）</h2>
          {pg ? (
            <>
              <h3 className="mt-3 text-lg font-bold">
                p.{pg.page}
                <span className="ml-2 text-sm font-normal text-muted">
                  PDF 物理页 {pg.physicalPage}
                  {pg.chapterId ? ` · ${pg.chapterId}` : ""}
                </span>
              </h3>
              <article className="mt-3 max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-card p-5 text-sm leading-7">
                {pg.text}
              </article>
            </>
          ) : (
            <p className="mt-3 rounded-lg border border-amber-300 bg-status-warn-bg p-4 text-sm leading-7 text-status-warn">
              已解析的 OCR 里找不到印刷页 p.{cur.page}——可能该页还没解析或页码映射有误。
              请标「存疑」或跳过；不要凭记忆判对。
            </p>
          )}
        </section>
      </div>
    </div>
  );
}