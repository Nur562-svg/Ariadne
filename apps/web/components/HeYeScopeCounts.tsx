"use client";

import { useEffect, useState } from "react";
import type { HeYeItem } from "@/lib/heye";
import {
  countPoolMarks,
  loadHeYeStore,
  subscribeHeYeStore,
  type HeYeStore,
} from "@/lib/heye-store";

/**
 * /review 页头的范围进度面：全池 待核 / 已对 / 存疑（本机 ariadne.heye.v1，跨刷新保留）。
 * 挂载后才读 localStorage（SSR 不读，避免水合不一致）；订阅核页会话的批量/单条打标广播。
 * 绿/琥珀只作状态色（已对 = status-ok，存疑 = status-warn），不作品牌色。
 */
export default function HeYeScopeCounts({ items }: { items: HeYeItem[] }) {
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

  return (
    <span className="text-xs text-muted">
      本机（仅这个浏览器）：待核 {c.open}
      <span className="text-status-ok"> · 已对 {c.checked}</span>
      <span className="text-status-warn"> · 存疑 {c.doubt}</span>
    </span>
  );
}