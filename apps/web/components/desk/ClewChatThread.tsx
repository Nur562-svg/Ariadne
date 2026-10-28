"use client";

import Link from "next/link";
import type { RefObject } from "react";
import type { ClewContextData } from "@/components/desk/DeskContext";
import CopyTextButton from "@/components/CopyTextButton";
import { buildSuggestPatchText, buildTakeawayText } from "@/lib/clew-suggest";
import {
  bubbleReturnTo,
  buildSuggestions,
  fireLinkReturn,
  type AssistantMsg,
  type Msg,
} from "@/components/desk/clew-pane-helpers";
import { AuditedProse, AuditFace } from "@/components/desk/ClewAuditView";

/**
 * T94 机械抽出：原 ClewPane.tsx 对话线程整段迁此——空态（有书日用链 / 无书冷启动 +
 * 建议问）+ 气泡四态（note / user / live|stub|pending|error）+ 核账预览/终态
 * （AuditedProse / AuditFace 仍自 ClewAuditView import）+ 补丁建议/复制/填草稿块 + 行动链。
 * JSX/className/文案零改，仅 send/retry/fillDrafts/rememberClewReturn 换 props 接线
 * （onSend/onRetry/onFillDrafts/rememberReturn）；threadRef 由引擎 hook 传入供滚底。
 */
export function ClewChatThread({
  threadRef,
  messages,
  sending,
  fillStates,
  clew,
  capIntro,
  bookHref,
  pageHref,
  studyHref,
  reviewHref,
  rememberReturn,
  onSend,
  onRetry,
  onFillDrafts,
}: {
  threadRef: RefObject<HTMLDivElement | null>;
  messages: Msg[];
  /** T66 E：在途锁——重试钮 / 填草稿钮随之置灰。 */
  sending: boolean;
  /** T67 F：「填入本机草稿」显式反馈（气泡下标 → done|unpersisted）。 */
  fillStates: Record<number, "done" | "unpersisted">;
  clew: ClewContextData;
  /** T66 G：空态首句（已接只读小能力 / 还没接模型），编排器按探针算好传入。 */
  capIntro: string;
  bookHref: string;
  pageHref: string;
  studyHref: string;
  reviewHref: string;
  /** T31 B：练/核 CTA 点前写 return 短链（回当前上下文）。 */
  rememberReturn: () => void;
  onSend: (text: string) => void;
  onRetry: (index: number) => void;
  onFillDrafts: (i: number, m: AssistantMsg) => void;
}) {
  const suggestions = buildSuggestions(clew);

  /**
   * T51：Clew 右栏四处练核 CTA（stub 气泡 / chat 空态 / Changes / Queue）共用同一池口径——
   * progress* 缺 key / 缺省当 0（fail-closed），===0 不装能进空环；不造假正数。
   */
  const atomN = clew.progressAtoms?.length ?? 0;
  const pendingN = clew.progressItems?.length ?? 0;

  return (
    <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.length === 0 ? (
        <div>
          {clew.book ? (
            /* T44 C：有书空态不主推「导入教材」——点名当前书的日用链（桌/练/核）；
               自测/核页点前 rememberReturn（T42/T31 接线不拆）；「另导入」只作次级 muted。 */
            <>
              <p className="text-xs leading-6 text-muted">
                {capIntro}当前书《{clew.book.title}
                》——日用路径：
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted">
                <Link
                  href={pageHref}
                  className="text-cinnabar no-underline hover:underline underline-offset-4"
                >
                  回书桌{clew.page != null ? `本页` : "读实体卡/章页"}
                </Link>
                <span>→</span>
                {/* T42 E：stub 空态路径的「学习环自测」点前 rememberReturn——与空态 CTA /
                    stub 气泡链同一函数，离面即记回程（回当前 Clew 上下文）。
                    T51 B：双链吃 progress* 池（fail-closed 0）——===0 降 muted 纯文
                    「暂无原子/暂无待核」不可点；>0 保持 Link + return 接线。 */}
                {atomN > 0 ? (
                  <Link
                    href={studyHref}
                    onClick={rememberReturn}
                    className="text-cinnabar no-underline hover:underline underline-offset-4"
                  >
                    学习环自测
                  </Link>
                ) : (
                  <span title="当前范围没有可练原子">暂无原子</span>
                )}
                <span>→</span>
                {pendingN > 0 ? (
                  <Link
                    href={reviewHref}
                    onClick={rememberReturn}
                    className="text-cinnabar no-underline hover:underline underline-offset-4"
                  >
                    核页对页
                  </Link>
                ) : (
                  <span title="当前范围没有待核 cite">暂无待核</span>
                )}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                另导入其他教材：
                <Link
                  href="/ingest"
                  className="ml-1 text-muted no-underline hover:text-cinnabar hover:underline underline-offset-4"
                >
                  /ingest →
                </Link>
              </p>
            </>
          ) : (
            /* T44 C：无书才走 ingest 冷启动首环（与 buildSuggestions 无书句同真）。
               T51 B：撤掉尾环「学习环自测」——无书时 studyHref 回落裸 /study（全书空池），
               朱红链装作能练是谎言；冷启动止于「导入→书架→书桌」，练核等有书有池再给。 */
            <>
              <p className="text-xs leading-6 text-muted">
                {capIntro}书库为空——请带着页码对照的问题发问；先按这条路径走通：
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted">
                <Link href="/ingest" className="text-cinnabar no-underline hover:underline underline-offset-4">导入教材</Link>
                <span>→</span>
                <Link href="/" className="text-cinnabar no-underline hover:underline underline-offset-4">书架打开</Link>
                <span>→</span>
                <Link href={bookHref} className="text-cinnabar no-underline hover:underline underline-offset-4">书桌读实体卡/章页</Link>
              </p>
            </>
          )}
          <ul className="mt-4 space-y-2">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  onClick={() => onSend(s)}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-left text-sm leading-6 text-foreground/90 transition-colors hover:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        messages.map((m, i) =>
          m.role === "note" ? (
            // T29 D：上下文切换 muted 小字——不占气泡位、无新强调色，历史气泡不重写。
            <p key={i} className="text-center text-[11px] leading-5 text-muted">
              — {m.text} —
            </p>
          ) : m.role === "user" ? (
            <div
              key={i}
              className="rounded-lg border border-line bg-background px-3 py-2 text-sm leading-6"
            >
              {m.text}
            </div>
          ) : (
            /* T66 D/E/F：助手气泡四态——live（模型只读答，pre-wrap 保留分点）| stub（缺钥诚实占位）|
               pending（在途 aria-busy）| error（status-error 左线 + 可见短讯 + 重试：保留原问，不装成功）。
               live 答面次级复制（纯文本 / 补丁形）只写剪贴板——永不 setAtomDraft / PATCH。
               mono 短标区分 live·provider / stub / 失败；朱砂仍只做动作与状态强调。 */
            <div
              key={i}
              aria-busy={m.mode === "pending" || undefined}
              className={`border-l-2 pl-3 text-sm leading-6 text-foreground/90 ${
                m.mode === "error" ? "border-status-error/60" : "border-cinnabar/40"
              }`}
            >
              <span
                className={`mono mr-1 text-[10px] ${m.mode === "error" ? "text-status-error" : "text-muted"}`}
              >
                {m.mode === "live"
                  ? `live · ${m.tier ?? "fast"} · ${m.meta?.provider ?? "模型"}`
                  : m.mode === "pending"
                    ? "…"
                    : m.mode === "error"
                      ? "失败"
                      : "stub"}
              </span>
              {m.mode === "pending" ? (
                <span className="whitespace-pre-wrap text-muted">
                  {m.text ? (
                    <AuditedProse text={m.text} audit={m.audit} bookId={m.ctx.book?.id} preview />
                  ) : (
                    "正在问模型（只读）…"
                  )}
                </span>
              ) : m.mode === "error" ? (
                <span>
                  {/* T67 B：中断/停止时已收的部分文本如实保留（live 前缀的流式草稿），不装成功答。 */}
                  {m.text ? <span className="whitespace-pre-wrap">{m.text}</span> : null}
                  <span className="text-muted">
                    {m.text ? " …" : ""}
                    {m.errorText ?? "请求失败"}
                    <button
                      type="button"
                      onClick={() => onRetry(i)}
                      disabled={sending}
                      className="ml-2 rounded border border-line px-1.5 py-0.5 text-xs text-cinnabar transition-colors hover:border-cinnabar disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                    >
                      重试
                    </button>
                  </span>
                </span>
              ) : (
                <span className={m.mode === "live" ? "whitespace-pre-wrap" : undefined}>
                  <AuditedProse text={m.text} audit={m.audit} bookId={m.ctx.book?.id} />
                </span>
              )}
              {/* T70 E：流式灰预览；live/stub 终态以服务端（stub 为同源纯函数）为准。失败条不装核账。 */}
              {m.mode === "pending" && m.meta?.pagesOmitted ? (
                <span className="mt-1 block text-[11px] leading-5 text-muted">
                  另有 {m.meta.pagesOmitted} 页因总字顶未装
                </span>
              ) : null}
              {m.mode === "pending" || m.mode === "live" || m.mode === "stub" ? (
                <AuditFace
                  audit={m.audit}
                  preview={m.mode === "pending" || m.auditPreview === true}
                  cardAtoms={m.cardAtoms}
                  cardId={m.ctx.card?.id}
                  bookId={m.ctx.book?.id}
                  returnTo={bubbleReturnTo(m)}
                />
              ) : null}
              {/* T66 F/G + T67 E/F + T69 C·E：live 答底——对照小窗来源（>1 页标注同章有界）+
                  「未核」+ 剪贴板带走（纯文本恒有；补丁恒有卡时给；entries 非空=模型建议填空）。
                  T69 D：补丁条目逐条 before→after 一行（before=当前卡 seed 现值，空=（空））——
                  人核面：是「填空」还是「改既有」一眼可比，全文在复制出的补丁 JSON 里。
                  「填入本机草稿（未核）」只认用户点击（mergeAtomDraft 同族 T55），永不静默写。 */}
              {m.mode === "live" && m.meta ? (
                <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px] text-muted">
                  <span>
                    {m.meta.pageWindow
                      ? `对照 p.${m.meta.pageWindow.page} 小窗${m.meta.pageWindow.truncated ? "（已截断）" : ""}`
                      : "无页小窗"}
                    {m.meta.groundPages?.length
                      ? ` · 接地 p.${m.meta.groundPages.join("、p.")}（同章有界）`
                      : ""}
                    {m.meta.pagesOmitted ? ` · 另有 ${m.meta.pagesOmitted} 页因总字顶未装` : ""}
                    {" · 未核"}
                    {m.patchEntries?.length ? ` · 补丁建议 ${m.patchEntries.length} 条` : ""}
                  </span>
                  <CopyTextButton
                    text={buildTakeawayText(m.question, m.text, m.ctx, m.meta)}
                    label="复制纯文本"
                    className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                  />
                  {m.ctx.card ? (
                    <CopyTextButton
                      text={buildSuggestPatchText(m.question, m.text, m.ctx, m.meta, m.patchEntries) ?? ""}
                      label={`复制为草稿补丁${m.patchEntries?.length ? `（${m.patchEntries.length} 条）` : ""}`}
                      className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:border-cinnabar hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                    />
                  ) : null}
                  {m.ctx.card && m.patchEntries?.length ? (
                    <button
                      type="button"
                      onClick={() => onFillDrafts(i, m)}
                      disabled={sending || fillStates[i] != null}
                      title={`只写本机草稿（卡 ${m.ctx.card.id} 的既有原子/字段空位）；不写回 seed、不翻 verified`}
                      className="rounded border border-line px-1.5 py-0.5 text-[11px] text-cinnabar transition-colors hover:border-cinnabar disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
                    >
                      填入本机草稿（未核）
                    </button>
                  ) : null}
                  {fillStates[i] === "done" ? (
                    <span className="text-status-ok">已填入 {m.patchEntries?.length ?? 0} 条（未写回 seed）</span>
                  ) : null}
                  {fillStates[i] === "unpersisted" ? (
                    <span role="alert" className="text-status-warn">
                      本浏览器存储不可用——草稿仅本次会话生效
                    </span>
                  ) : null}
                </span>
              ) : null}
              {/* T69 E：补丁建议人核明细——每条一行 before→after（before=seed 现值截显，
                  空=（空）；全文见 title 与「复制为草稿补丁」JSON）。muted mono，不抢答面。 */}
              {m.mode === "live" && m.patchEntries?.length ? (
                <span className="mt-1 flex w-full flex-col gap-0.5 text-[11px] leading-5 text-muted">
                  {m.patchEntries.map((e, k) => (
                    <span
                      key={`${e.target}|${e.field}|${k}`}
                      className="mono break-all"
                      title={`${e.target} · ${e.field}：${e.before ?? "（空）"} → ${e.after}`}
                    >
                      {e.target} · {e.field}：
                      {e.before
                        ? `${e.before.slice(0, 48)}${e.before.length > 48 ? "…" : ""} → `
                        : "（空）→ "}
                      {e.after.slice(0, 80)}
                      {e.after.length > 80 ? "…" : ""}
                    </span>
                  ))}
                </span>
              ) : null}
              {/* T33 D：行动链 muted 文字（非实心、非裸 URL）——对页/练/核可点；点练/核前兑现快照 return。
                  T51 A：PlainLink（空池占位）渲染 muted 纯文——无 href 不可点、不写 return。
                  T66：pending 态不挂链（在途噪音）；live/stub/error 都挂（发送时快照）。 */}
              {m.links?.length && m.mode !== "pending" ? (
                <span className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  {m.links.map((l) =>
                    "plain" in l ? (
                      <span key={l.label} className="text-xs text-muted">
                        {l.label}
                      </span>
                    ) : (
                      <Link
                        key={`${l.label}|${l.href}`}
                        href={l.href}
                        onClick={() => fireLinkReturn(l)}
                        className="text-xs text-muted no-underline hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
                      >
                        {l.label}
                      </Link>
                    ),
                  )}
                </span>
              ) : null}
            </div>
          ),
        )
      )}
    </div>
  );
}
