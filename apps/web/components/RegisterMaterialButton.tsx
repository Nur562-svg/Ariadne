"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { touchLastOpened } from "@/lib/last-opened";

/**
 * 注册进书库 CTA（T22 C，客户端）：extracted 物料上的一颗朱红实心主按钮。
 * POST /api/ingest/register → 成功 router.refresh()（服务端 deriveMaterialStage 看到 books.json
 * 已含该书 → 物料翻为 ready，页面显示就绪三连）；并轻触 last-opened（让侧栏「在读」/继续上次跟进，
 * 但不抢「继续上次」主视觉）。冲突/非法 4xx → 琥珀错误，不改 seed。
 * T25 E：成功文案不再说「刷新后即可开书桌」（refresh 已发生）——直接给「打开书桌 →」
 * 深链 /desk?book={bookId}，附学习/核页次级文字链（对齐 ready 就绪三连）。
 * T37 D：书级学习/核显式默认档（练 mode=all · 核 mode=open）——刚注册的书无停留页，
 * 书级入口也不被本标签 sticky 非默认档吞成空队列（与 T36 书架 footer 同口径）。
 */
export default function RegisterMaterialButton({
  materialId,
  title,
}: {
  materialId: string;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function onRegister() {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/ingest/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, title }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; bookId?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `注册失败（HTTP ${res.status}）`);
        return;
      }
      if (data.bookId) touchLastOpened(data.bookId);
      setDone(data.bookId ?? "");
      router.refresh();
    } catch {
      setError("网络错误，注册未完成");
    } finally {
      setBusy(false);
    }
  }

  return (
    <p className="mt-3">
      <span className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onRegister}
          disabled={busy}
          className="rounded-md bg-cinnabar px-4 py-2 text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50 motion-reduce:transition-none"
        >
          {busy ? "注册中…" : "注册进书库 →"}
        </button>
        <span className="text-xs text-muted">写入 config · 本机 · 非云同步</span>
      </span>
      {error ? (
        <span role="alert" className="mt-2 block text-sm leading-6 text-status-warn">
          {error}
        </span>
      ) : null}
      {done ? (
        <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm leading-6 text-status-ok">
          已注册进书库（book {done}）。
          <Link
            href={`/desk?book=${encodeURIComponent(done)}`}
            className="text-cinnabar no-underline hover:underline underline-offset-4"
          >
            打开书桌 →
          </Link>
          <Link
            href={`/study?book=${encodeURIComponent(done)}&mode=all`}
            className="text-xs text-muted no-underline hover:text-cinnabar"
          >
            学习环 →
          </Link>
          <Link
            href={`/review?book=${encodeURIComponent(done)}&mode=open`}
            className="text-xs text-muted no-underline hover:text-cinnabar"
          >
            核页 →
          </Link>
        </span>
      ) : null}
    </p>
  );
}