"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CopyCommand from "@/components/CopyCommand";
import CopyTextButton from "@/components/CopyTextButton";
import {
  buildAtomDraftPack,
  buildSeedApplyGuide,
  cardDraftCount,
  listDraftedCardIds,
  loadAtomDraftStore,
  subscribeAtomDraftStore,
  summarizeDraftStore,
  type AtomDraftStore,
} from "@/lib/atom-draft";
import {
  exportAtomDraftPort,
  importAtomDraftPort,
  parseAtomDraftPort,
} from "@/lib/atom-draft-port";
import type { EntityCard } from "@/lib/entities";

/** 四分列短句（H）：草稿 ≠ seed；收件箱/补丁包 ≠ 已落盘；草稿 ≠ heye；草稿 ≠ study；draft-port ≠ progress-port。 */
const INBOX_DISCLAIMER =
  "草稿 ≠ seed 已核 · 收件箱/补丁包 ≠ 已落盘 · 草稿 ≠ heye 本机已对 · 草稿 ≠ study 练分";

const btnQuiet =
  "shrink-0 rounded border border-line px-1.5 py-0.5 text-xs text-muted transition-colors hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none";

/** 浏览器本地下载（本地文件，不是写仓库；文件名固定，不碰任何 seed 路径）。 */
function downloadText(filename: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * T62 D/E/F/G/H：书桌草稿收件箱（客户端岛；挂书库效用区，近 ProgressPortability，独立区块）。
 * Server 只下传 slim 卡索引 + seed 口径 incomplete 摘要；Client 读 ariadne.atom-draft.v1，
 * 对**有草稿的卡**按需只读 GET /api/entities/<id> 拉 seed 组统一补丁包与人核清单——
 * 不整库下传 1.4MB entities。收件箱只展示 + 剪贴板/本地下载：
 * 永不 auto PATCH entities / 不写 verified / 不 Clew 真写 / 不并进 progress-port。
 * 0 真草稿不吵（仅 seed 口径不完备且无草稿的卡给次级 muted 引导 + 草稿带走折叠区）。
 */
export default function DraftInbox({
  cardIndex,
  incompleteCardSummaries,
}: {
  /** slim 卡索引（Server loadCards 派生：id/名/章——列表显示与回卡详链用）。 */
  cardIndex: { id: string; nameZh: string; chapterId?: string }[];
  /** E：seed 口径 incompleteAtoms>0 的卡摘要（Server T55 同口径实算；Client 交叉草稿态）。 */
  incompleteCardSummaries?: { id: string; name: string; incompleteAtoms: number; chapterId?: string }[];
}) {
  const [store, setStore] = useState<AtomDraftStore>({});
  const [ready, setReady] = useState(false);
  /** 草稿卡 seed 按需快照：id → card（null = 取不到）；fetchState 驱动按钮诚实态。 */
  const [seeds, setSeeds] = useState<Record<string, EntityCard | null>>({});
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    setStore(loadAtomDraftStore());
    setReady(true);
    const un = subscribeAtomDraftStore(() => setStore(loadAtomDraftStore()));
    return un;
  }, []);

  const draftedIds = ready ? listDraftedCardIds(store) : [];
  const draftedKey = draftedIds.join("\u0000");

  // 有草稿的卡才取 seed（只读 GET 自家 API；不触任何写路径）。集合变化才重取。
  useEffect(() => {
    if (!ready) return;
    const ids = draftedKey ? (draftedKey.split("\u0000") as string[]) : [];
    if (ids.length === 0) {
      setSeeds({});
      setFetchState("idle");
      return;
    }
    let alive = true;
    setFetchState("loading");
    Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/entities/${encodeURIComponent(id)}`)
          .then((res) => (res.ok ? (res.json() as Promise<EntityCard>) : null))
          .catch(() => null)
          .then((card) => [id, card] as const),
      ),
    ).then((rows) => {
      if (!alive) return;
      const next: Record<string, EntityCard | null> = {};
      for (const r of rows) {
        if (r.status !== "fulfilled") continue;
        const [id, card] = r.value;
        next[id] = card;
      }
      setSeeds(next);
      setFetchState("done");
    });
    return () => {
      alive = false;
    };
  }, [ready, draftedKey]);

  // 草稿卡 seed 快照（只对有草稿的卡；fetch 完成前 summaries 为空 → 按钮诚实等待态）。
  const seedCards = draftedIds
    .map((id) => seeds[id])
    .filter((c): c is EntityCard => c != null);
  const summaries = ready ? summarizeDraftStore(seedCards, store) : [];
  const packText =
    fetchState === "done" && seedCards.length > 0
      ? JSON.stringify(buildAtomDraftPack(seedCards, store), null, 2)
      : "";
  const guideText =
    fetchState === "done" && seedCards.length > 0
      ? buildSeedApplyGuide(seedCards, store)
      : "";

  const packableCount = summaries.filter((s) => s.realEntryCount > 0).length;
  const realTotal = summaries.reduce((n, s) => n + s.realEntryCount, 0);
  // 只在 seed 拉取完成后判缺失（加载中不算「取不到」——不抬假错）。
  const missingSeedIds =
    fetchState === "done" ? draftedIds.filter((id) => seeds[id] == null) : [];
  const incompleteNoDraft = ready
    ? (incompleteCardSummaries ?? []).filter((s) => cardDraftCount(store, s.id) === 0)
    : [];

  if (!ready) return null;

  return (
    <section aria-label="本机草稿收件箱" className="mt-6">
      {/* D：有跨卡真草稿 → 琥珀收件箱条 + 多卡列表 + 复制包/清单（F）。 */}
      {draftedIds.length > 0 ? (
        <div className="rounded-lg border border-amber-300/60 bg-card px-4 py-3">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm leading-6">
            <span className="text-status-warn">
              本机草稿收件箱 · 草稿卡 {draftedIds.length} · 条目 {Object.keys(store).length} · 未写回 seed
            </span>
            <span className="text-xs text-muted">收件箱/补丁包 ≠ 已落盘</span>
          </p>
          <ul className="mt-2 space-y-1.5">
            {summaries.map((s) => (
              <li key={s.cardId} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs leading-6">
                <span className="text-foreground/90">{s.nameZh ?? s.cardId}</span>
                <span className="mono text-muted">{s.cardId}</span>
                <span className={s.realEntryCount > 0 ? "text-status-warn" : "text-muted"}>
                  草稿 {s.draftCount}
                  {s.realEntryCount > 0 ? ` · 真改动 ${s.realEntryCount}` : " · 空转（与 seed 无差异）"}
                </span>
                {s.incompleteNoDraft > 0 ? (
                  <span className="text-muted">待补原子 {s.incompleteNoDraft}</span>
                ) : null}
                <Link
                  href={`/desk/card/${encodeURIComponent(s.cardId)}`}
                  className="text-cinnabar no-underline hover:underline underline-offset-4"
                >
                  回卡详 →
                </Link>
              </li>
            ))}
            {missingSeedIds.map((id) => (
              <li key={id} className="text-xs leading-6 text-muted">
                <span className="mono">{id}</span> · seed 取不到（卡可能已被重抽/删除）——补丁包与清单不含它
              </li>
            ))}
          </ul>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {fetchState === "loading" ? (
              <span className="text-xs text-muted">正在取草稿卡 seed（只读）…</span>
            ) : packableCount > 0 ? (
              <>
                <CopyTextButton text={packText} label={`复制统一补丁包（${realTotal} 条）`} />
                <CopyTextButton text={guideText} label="复制人核落盘清单" />
                <button
                  type="button"
                  onClick={() => downloadText("ariadne-atom-draft-pack.json", packText, "application/json")}
                  className={btnQuiet}
                >
                  下载 .json
                </button>
                <button
                  type="button"
                  onClick={() => downloadText("ariadne-atom-draft-apply-guide.md", guideText, "text/markdown")}
                  className={btnQuiet}
                >
                  下载 .md
                </button>
              </>
            ) : (
              <span className="text-xs text-muted">无草稿可导出（草稿与 seed 无差异）</span>
            )}
          </p>
          {/* T64 E：次级 CLI 面——本机干跑只读对照命令（无「一键写回」；步骤见仓库 docs/seed-apply-mac-pr.md）。 */}
          <div className="mt-2">
            <p className="text-[11px] leading-4 text-muted">
              本机干跑对照（DRY-RUN ONLY · 永不写 entities · dry-run ≠ 已落盘）· Mac
              Draft→PR 步骤见仓库 docs/seed-apply-mac-pr.md
            </p>
            <CopyCommand command="pnpm seed-apply-check -- --pack ariadne-atom-draft-pack.json" />
          </div>
          <p className="mt-1 text-xs leading-6 text-muted">
            人核清单按 data/cards/&lt;章&gt;.entities.json 逐条列 before → after——人核后自行改 seed /
            开 PR · 本浏览器不会写回仓库 · 不含 verified 翻改。{INBOX_DISCLAIMER}
          </p>
        </div>
      ) : null}

      {/* E：seed 口径不完备且无草稿的卡 → 次级 muted 引导（非大红 CTA；好书/无不完备不吵）。 */}
      {incompleteNoDraft.length > 0 ? (
        <div
          className={
            draftedIds.length > 0
              ? "mt-3 rounded-lg border border-line bg-card px-4 py-3"
              : "rounded-lg border border-line bg-card px-4 py-3"
          }
        >
          <p className="text-xs leading-6 text-muted">
            可开本机草稿补空字段（seed 口径不完备原子）· {incompleteNoDraft.length} 张卡：
          </p>
          <ul className="mt-1.5 space-y-1">
            {incompleteNoDraft.map((s) => (
              <li key={s.id} className="flex flex-wrap items-baseline gap-x-3 text-xs leading-6 text-muted">
                <span className="text-foreground/80">{s.name}</span>
                <span className="mono">{s.id}</span>
                <span>
                  空字段原子 {s.incompleteAtoms}
                </span>
                <Link
                  href={`/desk/card/${encodeURIComponent(s.id)}`}
                  className="text-cinnabar no-underline hover:underline underline-offset-4"
                >
                  到卡详开草稿 →
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs leading-5 text-muted">{INBOX_DISCLAIMER}</p>
        </div>
      ) : null}

      {/* T65 D：空岛常显静默壳——无草稿且无不完备待补时仍保留可发现的效用区（标题 + 免责 +
          空态短句 + 下方 DraftPortBlock 折叠），对齐 ProgressPortability 常显壳节奏；
          静默 border-line，禁大红 empty-CTA。上方两条非空路径（琥珀卡 / muted 引导）
          形状不变——T62/T64 收件箱主路径不 redo。 */}
      {draftedIds.length === 0 && incompleteNoDraft.length === 0 ? (
        <div className="rounded-lg border border-line bg-card px-4 py-3">
          <h2 className="text-sm font-semibold">本机草稿收件箱</h2>
          <p className="mt-1 text-xs leading-6 text-muted">
            暂无本机草稿 · 无不完备待补——草稿在卡详的原子行 / 字段行就地编辑，有真改动才会在此点名。
          </p>
          {/* F：空壳次级说明——草稿 ≠ 进度包（练/核带走在上方「本机进度带走」；草稿只在下方折叠区单独带走）。 */}
          <p className="mt-1 text-[11px] leading-5 text-muted">
            草稿 ≠ 练/核进度包——进度带走见上方「本机进度带走」；草稿单独带走见下方折叠区。{INBOX_DISCLAIMER}
          </p>
        </div>
      ) : null}

      {/* G：草稿单独带走（与练/核进度包分离；draft-port ≠ progress-port）。折叠区默认不吵。 */}
      <DraftPortBlock store={store} />
    </section>
  );
}

/** G：草稿 Portability 小节——独立 schema ariadne.atom-draft-port.v1；只动草稿键。 */
function DraftPortBlock({ store }: { store: AtomDraftStore }) {
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
