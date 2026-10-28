"use client";

import { TIER_IDS, TIER_LABEL, type Capability } from "@/components/desk/clew-pane-helpers";

/**
 * T94 机械抽出：原 ClewPane.tsx 输入区整段迁此——档位芯片（status.tiers 驱动可用/置灰；
 * 选中朱砂 soft）+ textarea（Enter 发送 · Shift+Enter 换行）+ 发送 / 在途「停止」钮。
 * JSX/className/文案零改，仅 setDraft/send/pickTier/abortRef.abort 换 props 接线
 * （onDraftChange/onSend/onPickTier/onStop）；tierAvailable fail-closed 语义由引擎 hook 原样传入。
 */
export function ClewChatComposer({
  draft,
  onDraftChange,
  sending,
  tier,
  cap,
  tierAvailable,
  onPickTier,
  onSend,
  onStop,
}: {
  draft: string;
  onDraftChange: (v: string) => void;
  /** T66 E：在途锁——发送钮置灰、显「发送中…」、出「停止」次级钮。 */
  sending: boolean;
  /** T68 D：当前档（芯片 aria-pressed / 发送钮可用性同源）。 */
  tier: string;
  /** T66 G / T68 B：status 探针（null = 探测中；tiers[] 驱动芯片 title 与置灰）。 */
  cap: Capability | null;
  /** T68 D：档可用性——探针未回不拦；已回按 tiers[].available。 */
  tierAvailable: (id: string) => boolean;
  onPickTier: (id: string) => void;
  onSend: (text: string) => void;
  /** T67 B：只中止读流（服务端 cancel 连带上游 abort），无写副作用。 */
  onStop: () => void;
}) {
  return (
    <div className="border-t border-line p-3">
      {/* T68 D：档位芯片（status.tiers 驱动可用/置灰；选中朱砂 soft，对齐 Changes 筛选芯片
          气质——一种处理一种含义，不引第二品牌色）。上次选择记 sessionStorage 新键
          ariadne.clew.tier.v1（不动任何既有键）。置灰档不可发。 */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Clew 档位">
        {TIER_IDS.map((id) => {
          const info = cap?.tiers?.find((t) => t.id === id);
          const on = tier === id;
          const usable = tierAvailable(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => usable && onPickTier(id)}
              disabled={!usable}
              aria-pressed={on}
              title={
                usable
                  ? info?.model
                    ? `${info.model}${info.provider ? ` · ${info.provider}` : ""}`
                    : "默认档 fast"
                  : "该档未配置可用钥（服务端 env）——不静默换档"
              }
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none ${
                on
                  ? "border-cinnabar bg-cinnabar-soft text-cinnabar"
                  : usable
                    ? "border-line text-muted hover:border-cinnabar hover:text-cinnabar"
                    : "cursor-not-allowed border-line text-muted opacity-40"
              }`}
            >
              {TIER_LABEL[id]}
            </button>
          );
        })}
      </div>
      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend(draft);
            }
          }}
          rows={2}
          placeholder="问点什么…（Enter 发送 · Shift+Enter 换行）"
          aria-label="Clew 输入"
          className="min-h-[2.75rem] w-full resize-y rounded-lg border border-line bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted focus:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
        />
        <button
          onClick={() => onSend(draft)}
          disabled={!draft.trim() || sending || !tierAvailable(tier)}
          aria-busy={sending || undefined}
          className="shrink-0 rounded-lg bg-cinnabar px-4 py-2 text-sm text-white transition-opacity disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
        >
          {sending ? "发送中…" : "发送"}
        </button>
        {/* T67 B：在途「停止」次级钮——只中止读流（服务端 cancel 连带上游 abort），无写副作用；
            停止后气泡转 error 态保留已收文本，可重试。 */}
        {sending ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
          >
            停止
          </button>
        ) : null}
      </div>
    </div>
  );
}
