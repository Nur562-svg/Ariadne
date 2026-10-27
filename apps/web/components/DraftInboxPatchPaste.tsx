"use client";

import { useState } from "react";
import { applyAtomDraftPatch, parseAtomDraftPatch } from "@/lib/atom-draft";
import type { EntityCard } from "@/lib/entities";
import { INBOX_DISCLAIMER, btnQuiet } from "@/components/draft-inbox-shared";

/**
 * T80 机械抽出：原 DraftInbox.tsx 内 PatchPasteBlock 折叠块整段迁此——schema 校验 /
 * 整包拒收 / 未知 target / 只写本机 ariadne.atom-draft.v1 / 不写 seed 语义零改；
 * JSX/文案/class 与 tip 逐段一致（seeds / fetchState 经 props，形参表同 tip）。
 *
 * T67 G：粘贴 ariadne.atom-draft-patch.v1（Clew「复制为草稿补丁」/ 卡详导出同形）→
 * 校验（parseAtomDraftPatch 整包严格形）→ 取该卡 seed（已有快照或只读 GET /api/entities/<id>）
 * → validateAtomDraftPatch（仅既有 target）→ applyAtomDraftPatch 合并进 ariadne.atom-draft.v1。
 * 只在用户点击「校验并合并」时写；永不 entities / verified / 自动触发。与 port.v1 分列文案。
 */
export default function DraftInboxPatchPaste({
  seeds,
  fetchState,
}: {
  seeds: Record<string, EntityCard | null>;
  fetchState: "idle" | "loading" | "done";
}) {
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  async function runImport() {
    setMsg(null);
    setWarn(null);
    const parsed = parseAtomDraftPatch(paste);
    if (!parsed.ok) {
      setWarn(parsed.error);
      return;
    }
    const doc = parsed.doc;
    if (doc.entries.length === 0) {
      setWarn("entries 为空——无可合并条目（Clew 未建议填空时会给空补丁，本机草稿保持原样）。");
      return;
    }
    setBusy(true);
    try {
      // 卡 seed：已有快照优先；没有则只读 GET 自家 API（卡详同款；不触任何写路径）。
      let card = seeds[doc.cardId] ?? null;
      if (card == null) {
        try {
          const res = await fetch(`/api/entities/${encodeURIComponent(doc.cardId)}`);
          card = res.ok ? ((await res.json()) as EntityCard) : null;
        } catch {
          card = null;
        }
      }
      if (card == null) {
        setWarn(
          `卡 ${doc.cardId} 取不到（可能未注册/已被重抽）——无法核 target，整包拒收，本机草稿保持原样。`,
        );
        return;
      }
      const r = applyAtomDraftPatch(card, doc);
      if (!r.ok) {
        setWarn(r.error);
        return;
      }
      setMsg(
        `已合并 ${r.merged} 条建议进本机草稿（卡 ${card.name_zh} · 未核 · 未写回 seed）——到卡详核后再考虑落盘。`,
      );
      if (!r.persisted) {
        setWarn("本浏览器存储不可用——导入仅本会话生效，未持久化（刷新即丢）。");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="mt-3 rounded-lg border border-line px-3 py-2">
      <summary className="cursor-pointer select-none text-xs leading-6 text-muted">
        粘贴 Clew 草稿补丁导入（建议 · 未核 · schema ariadne.atom-draft-patch.v1）
      </summary>
      <div className="mt-2">
        <p className="block text-xs leading-6 text-muted">
          粘贴 Clew 答面「复制为草稿补丁」的 JSON：只合并进本机草稿（既有原子/字段空位），
          非法/错 schema/未知 target 整包拒收；与上方「草稿包带走」（port.v1 · 整卡草稿）**分列**——
          这里是单卡建议填空，不是整库替换。永不写 seed、永不翻 verified。
        </p>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={4}
          placeholder='{"schema":"ariadne.atom-draft-patch.v1","cardId":"…","entries":[{"target":"atom:<既有id>","field":"prompt","after":"…"}]}'
          className="mt-1 w-full rounded border border-line bg-card px-2 py-1.5 font-mono text-xs leading-5 text-foreground focus-visible:outline-2 focus-visible:outline-cinnabar"
        />
        <p className="mt-1.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void runImport()}
            disabled={busy || !paste.trim()}
            className={btnQuiet}
            title="只写本机草稿（ariadne.atom-draft.v1）；人核前不落盘"
          >
            {busy ? "校验中…" : "校验并合并导入本机草稿"}
          </button>
          {fetchState === "loading" ? (
            <span className="text-[11px] text-muted">（草稿卡 seed 快照在取——不影响本面校验）</span>
          ) : null}
        </p>
        {msg ? <p className="mt-1 text-xs leading-5 text-status-ok">{msg}</p> : null}
        {warn ? (
          <p role="alert" className="mt-1 text-xs leading-5 text-status-warn">
            {warn}
          </p>
        ) : null}
        <p className="mt-1.5 text-[11px] leading-5 text-muted">
          建议 ≠ 已核 · 草稿 ≠ seed——合并后到卡详核对再考虑落盘。{INBOX_DISCLAIMER}
        </p>
      </div>
    </details>
  );
}
