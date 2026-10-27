"use client";

import { useMemo, useState } from "react";
import CopyTextButton from "@/components/CopyTextButton";
import type { AtomDraftStore } from "@/lib/atom-draft";
import {
  exportAtomDraftPort,
  importAtomDraftPort,
  parseAtomDraftPort,
} from "@/lib/atom-draft-port";
import { INBOX_DISCLAIMER, btnQuiet, downloadText } from "@/components/draft-inbox-shared";

/**
 * T80 机械抽出：原 DraftInbox.tsx 内 DraftPortBlock 折叠块整段迁此——merge / replace
 * 武装确认 / CopyTextButton / 本地下载 / 「draft-port ≠ progress-port」文案零改；
 * 只动草稿键 ariadne.atom-draft.v1（port.v1 整卡带走）。JSX/文案/class 与 tip 逐段一致
 * （store 经 props，形参表同 tip）。
 *
 * G：草稿 Portability 小节——独立 schema ariadne.atom-draft-port.v1；只动草稿键。
 */
export default function DraftInboxPort({ store }: { store: AtomDraftStore }) {
  const entryCount = Object.keys(store).length;
  const portText = useMemo(
    () => JSON.stringify(exportAtomDraftPort(store), null, 2),
    [store],
  );
  const [paste, setPaste] = useState("");
  const [armReplace, setArmReplace] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importWarn, setImportWarn] = useState<string | null>(null);

  function runImport(mode: "merge" | "replace") {
    const parsed = parseAtomDraftPort(paste);
    if (!parsed.ok) {
      setImportMsg(null);
      setImportWarn(parsed.error);
      return;
    }
    const r = importAtomDraftPort(parsed.doc, mode);
    setArmReplace(false);
    setImportWarn(
      r.persisted ? null : "本浏览器存储不可用——导入仅本会话生效，未持久化（刷新即丢）。",
    );
    setImportMsg(
      r.mode === "replace"
        ? `已替换导入 ${r.added} 条草稿（本机原草稿已被覆盖）。`
        : `已合并导入：新增 ${r.added} 条 · 按时间更新 ${r.updated} 条（其余本机较新或相同，未动）。`,
    );
  }

  return (
    <details className="mt-3 rounded-lg border border-line px-3 py-2">
      <summary className="cursor-pointer select-none text-xs leading-6 text-muted">
        本机草稿带走（独立草稿包 · 与练/核进度包分离）
      </summary>
      <div className="mt-2">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs leading-6">
          {entryCount > 0 ? (
            <>
              <CopyTextButton text={portText} label={`复制草稿包 JSON（${entryCount} 条）`} />
              <button
                type="button"
                onClick={() => downloadText("ariadne-atom-draft-port.json", portText, "application/json")}
                className={btnQuiet}
              >
                下载 .json
              </button>
            </>
          ) : (
            <span className="text-muted">本机暂无草稿可带走</span>
          )}
        </p>
        <p className="mt-2 block text-xs text-muted">
          粘贴草稿包 JSON 导入（schema ariadne.atom-draft-port.v1；非法 JSON 整包拒收，本机草稿保持原样）：
        </p>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={3}
          placeholder='{"schema":"ariadne.atom-draft-port.v1", …}'
          className="mt-1 w-full rounded border border-line bg-card px-2 py-1.5 font-mono text-xs leading-5 text-foreground focus-visible:outline-2 focus-visible:outline-cinnabar"
        />
        <p className="mt-1.5 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => runImport("merge")} className={btnQuiet}>
            合并导入（按时间新者胜）
          </button>
          {armReplace ? (
            <button
              type="button"
              onClick={() => runImport("replace")}
              className="shrink-0 rounded border border-amber-300 px-1.5 py-0.5 text-xs text-status-warn transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
            >
              确认替换（覆盖本机全部草稿）
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setArmReplace(true)}
              className={btnQuiet}
              title="破坏性：用导入包整体覆盖本机草稿库"
            >
              替换导入…
            </button>
          )}
        </p>
        {importMsg ? <p className="mt-1 text-xs leading-5 text-status-ok">{importMsg}</p> : null}
        {importWarn ? (
          <p role="alert" className="mt-1 text-xs leading-5 text-status-warn">
            {importWarn}
          </p>
        ) : null}
        <p className="mt-1.5 text-[11px] leading-5 text-muted">
          draft-port ≠ progress-port：上方「本机进度带走」（练/核）**不包含草稿**，草稿只在
          本节单独带走。{INBOX_DISCLAIMER}
        </p>
      </div>
    </details>
  );
}
