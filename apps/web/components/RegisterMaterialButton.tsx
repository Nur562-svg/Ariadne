"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { touchLastOpened } from "@/lib/last-opened";
import { saveReturn } from "@/lib/return-stack";

/**
 * 注册进书库 CTA（T22 C，客户端）：extracted 物料上的一颗朱红实心主按钮。
 * POST /api/ingest/register → 成功 router.refresh()（服务端 deriveMaterialStage 看到 books.json
 * 已含该书 → 物料翻为 ready，页面显示就绪三连）；并轻触 last-opened（让侧栏「在读」/继续上次跟进，
 * 但不抢「继续上次」主视觉）。冲突/非法 4xx → 琥珀错误，不改 seed。
 * T25 E：成功文案不再说「刷新后即可开书桌」（refresh 已发生）——直接给「打开书桌 →」
 * 深链 /desk?book={bookId}，附学习/核页次级文字链（对齐 ready 就绪三连）。
 * T37 D：书级学习/核显式默认档（练 mode=all · 核 mode=open）——刚注册的书无停留页，
 * 书级入口也不被本标签 sticky 非默认档吞成空队列（与 T36 书架 footer 同口径）。
 * T49 B/C：成功三连与就绪三连同真空池（fail-closed，缺省当 0）——0-OCR「打开书桌（尚无 OCR）」
 * 点名降级（对齐 A/T46 书架文案族）；0 原子/0 待核学习环·核页纯文（对齐 T48 门禁族）。
 */
export default function RegisterMaterialButton({
  materialId,
  title,
  ocrPageCount,
  atomCount,
  pendingCount,
  qualityWarn,
}: {
  materialId: string;
  title: string;
  /** T49 B：该物料章 ∩ 已解析印刷页数（页面装配；缺省当 0 · fail-closed）。 */
  ocrPageCount?: number;
  /** T49 C：该书/物料章级可练原子数（collectStudyAtoms 同池族；缺省当 0）。 */
  atomCount?: number;
  /** T49 C：该书/物料章级待核 cite 数（collectCiteQueue 同池族；缺省当 0）。 */
  pendingCount?: number;
  /**
   * T54 E/I + T55 E/I：物料章 cite↔OCR 机检汇总（ingest 页实算；缺省 undefined = 无可检章）。
   * missRate≥0.25 或 zeroAtomCards>0（T54）**另加 incompleteAtoms>0**（T55，空 prompt ∨
   * 空 answer）→ 软门禁：琥珀点名 + 首次点击改为「质量偏弱 · 仍要注册 →」二次确认——
   * 只拦人不拦 API（/api/ingest/register 不因质量 4xx）；低风险保持一键「注册进书库 →」。
   */
  qualityWarn?: {
    ocrMiss: number;
    zeroAtomCards: number;
    missRate: number;
    nullPage: number;
    emptyPromptAtoms?: number;
    emptyAnswerAtoms?: number;
    incompleteAtoms?: number;
    /**
     * T56 E/I：parse/OCR 覆盖弱标记（ingest 从 blocks 装载）——有则琥珀点名 OCR 空/稀页，
     * 并计入软二次触发；不阻断 API；不拆既有 missRate/zeroAtom/incomplete 触发。
     */
    parseWeak?: boolean;
    emptyPages?: number;
    sparsePages?: number;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  /** T54 E：弱稿二次确认态——首次点击只布防（按钮改「仍要注册」），再点才提交。 */
  const [confirmWeak, setConfirmWeak] = useState(false);
  const weak =
    qualityWarn != null &&
    (qualityWarn.missRate >= 0.25 ||
      qualityWarn.zeroAtomCards > 0 ||
      (qualityWarn.incompleteAtoms ?? 0) > 0 ||
      (qualityWarn.parseWeak ?? false));

  /**
   * T39 A：注册成功后的三连（打开书桌 / 学习环 / 核页）点前写 return 短链——
   * 练/核完成态「回到刚才」回上传面。key 仍 ariadne.desk.return.v1（与就绪三连
   * IngestReadyLinks / Sidebar / Clew 同桶，覆盖式单条），不另开第二套 return。
   */
  function rememberUploadReturn() {
    saveReturn({ href: "/ingest", label: "上传", at: Date.now() });
  }

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

  function onClickRegister() {
    // T54 E：弱稿软门禁——首次点击只布防并点亮琥珀，不发起注册；二次点击才提交。
    if (weak && !confirmWeak) {
      setConfirmWeak(true);
      return;
    }
    onRegister();
  }

  return (
    <p className="mt-3">
      <span className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onClickRegister}
          disabled={busy}
          className={
            weak && confirmWeak
              ? "rounded-md border border-amber-300 bg-status-warn-bg px-4 py-2 text-sm text-status-warn transition-colors hover:opacity-90 disabled:opacity-50 motion-reduce:transition-none"
              : "rounded-md bg-cinnabar px-4 py-2 text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50 motion-reduce:transition-none"
          }
        >
          {busy
            ? "注册中…"
            : weak && confirmWeak
              ? "质量偏弱 · 仍要注册 →"
              : "注册进书库 →"}
        </button>
        <span className="text-xs text-muted">写入 config · 本机 · 非云同步</span>
      </span>
      {/* T54 E + T55 E：弱稿琥珀点名（missRate≥25% / 零原子卡 / 不完备原子）——机检数字
          与 ingest 章清单 / pnpm cite-check 同真；不阻断 API，只要求二次确认。 */}
      {weak && qualityWarn ? (
        <span
          role="status"
          className="mt-2 block rounded-lg border border-amber-300 bg-status-warn-bg px-3 py-2 text-xs leading-6 text-status-warn"
        >
          抽取质量偏弱：OCR未见 {qualityWarn.ocrMiss} · missRate{" "}
          {(qualityWarn.missRate * 100).toFixed(1)}% · 零原子卡 {qualityWarn.zeroAtomCards} ·
          无页 p.? {qualityWarn.nullPage}
          {(qualityWarn.incompleteAtoms ?? 0) > 0
            ? ` · 不完备原子 ${qualityWarn.incompleteAtoms}（空 prompt ${qualityWarn.emptyPromptAtoms ?? 0} / 空 answer ${qualityWarn.emptyAnswerAtoms ?? 0}）`
            : ""}
          ——注册会把这些一起带进书库（练核池可见同数）。
          {(qualityWarn.parseWeak ?? false)
            ? ` · OCR 覆盖偏弱（空 ${qualityWarn.emptyPages ?? 0} 页 / 稀 ${qualityWarn.sparsePages ?? 0} 页）`
            : ""}
          {confirmWeak ? " 再点一次「仍要注册」确认。" : " 可先 pnpm cite-check 看样例。"}
        </span>
      ) : null}
      {error ? (
        <span role="alert" className="mt-2 block text-sm leading-6 text-status-warn">
          {error}
        </span>
      ) : null}
      {done ? (
        <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm leading-6 text-status-ok">
          已注册进书库（book {done}）。
          {/* T39 A：三连点前 rememberUploadReturn——回到刚才回 /ingest 上传面。
              T49 B：0-OCR / 0 原子 / 0 待核与就绪三连（A）同真降级，注册前后不互谎。 */}
          {(ocrPageCount ?? 0) > 0 ? (
            <Link
              href={`/desk?book=${encodeURIComponent(done)}`}
              onClick={rememberUploadReturn}
              className="text-cinnabar no-underline hover:underline underline-offset-4"
            >
              打开书桌 →
            </Link>
          ) : (
            <Link
              href={`/desk?book=${encodeURIComponent(done)}`}
              onClick={rememberUploadReturn}
              title="尚无 OCR 印刷页——章页/分栏暂读不了；可进桌看概览与实体卡"
              className="text-muted no-underline hover:text-cinnabar"
            >
              打开书桌（尚无 OCR）→
            </Link>
          )}
          {(atomCount ?? 0) > 0 ? (
            <Link
              href={`/study?book=${encodeURIComponent(done)}&mode=all`}
              onClick={rememberUploadReturn}
              className="text-xs text-muted no-underline hover:text-cinnabar"
            >
              学习环 →
            </Link>
          ) : (
            <span className="text-xs text-muted" title="这本书还没有萃取出的知识原子">
              暂无原子
            </span>
          )}
          {(pendingCount ?? 0) > 0 ? (
            <Link
              href={`/review?book=${encodeURIComponent(done)}&mode=open`}
              onClick={rememberUploadReturn}
              className="text-xs text-muted no-underline hover:text-cinnabar"
            >
              核页 →
            </Link>
          ) : (
            <span className="text-xs text-muted" title="这本书还没有待核 cite">
              暂无待核
            </span>
          )}
        </span>
      ) : null}
    </p>
  );
}