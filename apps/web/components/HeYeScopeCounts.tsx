"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HeYeItem } from "@/lib/heye";
import {
  countPoolMarks,
  loadHeYeStore,
  subscribeHeYeStore,
  type HeYeStore,
} from "@/lib/heye-store";

/** T35 D：三档深链（与 sticky 三档 / HeYeModeChips 同一 qs({ mode }) 口径，由 review/page 下传）。 */
export type HeYeScopeHrefs = { open?: string; checked?: string; doubt?: string };

/**
 * /review 页头的范围进度面：全池 待核 / 已对 / 存疑（本机 ariadne.heye.v1，跨刷新保留）。
 * 挂载后才读 localStorage（SSR 不读，避免水合不一致）；订阅核页会话的批量/单条打标广播。
 * 绿/琥珀只作状态色（已对 = status-ok，存疑 = status-warn），不作品牌色。
 * T35 D：分段计数可点——有 hrefs 且 N>0 时切到对应档（待核→open · 已对→checked · 存疑→doubt）；
 * N=0 或无 href 纯文。不做 Due，不加假「全核」绿条。
 */
export default function HeYeScopeCounts({
  items,
  hrefs,
}: {
  items: HeYeItem[];
  hrefs?: HeYeScopeHrefs;
}) {
  const [store, setStore] = useState<HeYeStore>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStore(loadHeYeStore());
    setReady(true);
    return subscribeHeYeStore(() => setStore(loadHeYeStore()));
  }, []);

  if (!ready) {
    return <span className="text-xs text-muted">本机进度读取中…</span>;
  }

  const c = countPoolMarks(items, store);

  /** 分段：N>0 且有 href → 文字链（同色 + hover 下划线）；否则纯文（不编行动）。 */
  function seg(n: number, label: string, href: string | undefined, toneCls: string) {
    const text = (
      <>
        {label} {n}
      </>
    );
    if (href && n > 0) {
      return (
        <Link
          href={href}
          className={`${toneCls} no-underline hover:underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-cinnabar`}
        >
          {text}
        </Link>
      );
    }
    return <span className={toneCls}>{text}</span>;
  }

  return (
    <span className="text-xs text-muted">
      本机（仅这个浏览器）：{seg(c.open, "待核", hrefs?.open, "")}
      <span className="text-status-ok"> · </span>
      {seg(c.checked, "已对", hrefs?.checked, "text-status-ok")}
      <span className="text-status-warn"> · </span>
      {seg(c.doubt, "存疑", hrefs?.doubt, "text-status-warn")}
    </span>
  );
}
