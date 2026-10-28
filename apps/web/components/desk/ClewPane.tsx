"use client";

import Link from "next/link";
import { useState } from "react";
import { useDeskContext } from "@/components/desk/DeskContext";
import { saveReturn } from "@/lib/return-stack";
import { CLEW_HONESTY_FOOTNOTE } from "@/lib/clew-suggest";
import {
  SURFACE_ZH,
  clewCtaHrefs,
  clewReturnPayload,
  type Tab,
} from "@/components/desk/clew-pane-helpers";
import { useClewChatEngine } from "@/components/desk/use-clew-chat-engine";
import { ClewChatThread } from "@/components/desk/ClewChatThread";
import { ClewChatComposer } from "@/components/desk/ClewChatComposer";
import { ChangesPanel } from "@/components/desk/ClewChangesPanel";
import { QueuePanel } from "@/components/desk/ClewQueuePanel";

/**
 * T75 → T94 机械抽出后编排器：只留 tab 态 + 头部/tabs/会话条 + 引擎接线（T94
 * use-clew-chat-engine：messages/draft/sending/abort/fillStates/cap/tier + status 探针 +
 * send/stream/retry/stop/fillDrafts）+ 线程（T94 ClewChatThread：空态/气泡四态/核账/
 * 补丁块/行动链）+ 输入区（T94 ClewChatComposer：档位芯片/textarea/发送/停止）+
 * Changes/Queue 两面板 + 诚实脚注。模块层类型/纯函数仍在 clew-pane-helpers；
 * 核账视图仍在 ClewAuditView。export default 路径与零 props 契约不变（DeskShellClient <ClewPane />）。
 */

/**
 * Clew 右栏（~400）：会话条 + 三 tab（对话 | 本轮变更 | 复习队列）+ 对话。
 * 上下文来自 DeskContext（书/章/当前页/卡/表面）；
 * T66：对话经 POST /api/clew/suggest 取只读 live 答（单问 + 当前上下文；服务端缺钥 503 →
 * 诚实降 stubReply；上游/网络错 → 失败条保留原问可重试）。无假写入：永不写 entities /
 * verified / atom-draft 仓；带走只靠剪贴板。
 * 「本轮变更」只读本浏览器 session 开始以来的 study/heye 标记。「复习队列」只诚实跳转。
 * 底部常驻诚实脚注（CLEW_HONESTY_FOOTNOTE）。
 */
export default function ClewPane() {
  const { clew, sessionStartedAt } = useDeskContext();
  const [tab, setTab] = useState<Tab>("chat");

  // T75：bookHref/pageHref/studyHref/reviewHref 四链推导整体迁 clew-pane-helpers.clewCtaHrefs
  //（progress* 优先 / 卡作用域 / 本页书级 / 书级回落与 mode 默认档零改），此处只解构。
  // T94：send 行动链快照经 hook 参数吃后三条；header / Thread / Changes / Queue 吃全四条。
  const { bookHref, pageHref, studyHref, reviewHref } = clewCtaHrefs(clew);

  // 审计结论（review-fix-integrity G）：外层曾同时订阅 study/heye 两 store 打 tick，
  // 但 ClewPane 自身渲染只消费 clew context（书/章/页/卡/表面），不读任何本机 store——
  // 那两路订阅只会让整个右栏（含三 tab 与 stub 对话）每评一题/每标一条全量重渲染。
  // 订阅的合法消费者是**自带订阅+读盘的面板**（ChangesPanel；T33 C 起 QueuePanel 计数同模式），
  // 故外层仍不订阅，收敛为单路。

  const {
    messages,
    draft,
    setDraft,
    sending,
    fillStates,
    cap,
    tier,
    threadRef,
    pickTier,
    tierAvailable,
    send,
    retry,
    fillDrafts,
    stop,
  } = useClewChatEngine(clew, { pageHref, studyHref, reviewHref });

  /**
   * T31 B：Clew 练/核 CTA 点前写 return 短链——练/核完成态「回到刚才」能回当前上下文
   * （对齐 ChapterPageReader / CardHubReturnLinks 口径：有页回书桌本页，卡表面回卡枢纽，
   * 仅书回书级；书架/无上下文不写）。key 不变（ariadne.desk.return.v1）。
   * T33 D：payload 逻辑抽 clewReturnPayload（stub 气泡链发送时快照同一份）。
   */
  function rememberClewReturn() {
    const p = clewReturnPayload(clew);
    if (p) saveReturn({ ...p, at: Date.now() });
  }

  /** T66 G：头部短标——探测中 | live · provider | stub · 未接模型（探针失败即 stub，fail-closed）。 */
  const capLabel =
    cap == null ? "探测模型…" : cap.mode === "live" ? `live · ${cap.provider ?? "模型"}` : "stub · 未接模型";
  /** T66 G：空态首句按探针说真话——已接只读小能力 / 还没接模型；两种空态（有书/无书）共用。 */
  const capIntro = cap?.mode === "live" ? "已接小能力模型（只读 · 不写 seed）。" : "还没接模型（stub）。";

  return (
    <aside
      className="flex h-full w-[400px] shrink-0 flex-col border-l border-line bg-card"
      aria-label="Clew 问答面板"
    >
      <header className="border-b border-line px-4 pb-2 pt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Clew</h2>
          <span className="text-xs text-muted">
            {capLabel}
            {clew.page != null ? ` · p.${clew.page}` : ""}
          </span>
        </div>
        <nav className="mt-2 flex gap-4 text-sm" aria-label="Clew 标签页">
          {(
            [
              ["chat", "对话"],
              ["changes", "本轮变更"],
              ["queue", "复习队列"],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-selected={tab === t}
              role="tab"
              className={`pb-1.5 focus-visible:outline-2 focus-visible:outline-cinnabar ${
                tab === t
                  ? "border-b-2 border-cinnabar font-medium text-cinnabar"
                  : "border-b-2 border-transparent text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* 会话条：书 · 章 · p.N · 卡（可点回跳）+ 本地上下文免责。 */}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-t border-line pt-2 text-xs text-muted">
          {clew.book ? (
            <Link
              href={bookHref}
              className="text-foreground/90 no-underline hover:text-cinnabar"
            >
              《{clew.book.title}》
            </Link>
          ) : null}
          {clew.chapter ? <span>{clew.chapter.title}</span> : null}
          {clew.page != null ? (
            <Link href={pageHref} className="mono text-cinnabar no-underline hover:underline underline-offset-4">
              p.{clew.page}
            </Link>
          ) : null}
          {clew.card ? (
            <Link
              href={`/desk/card/${encodeURIComponent(clew.card.id)}`}
              className="font-medium text-cinnabar no-underline hover:underline underline-offset-4"
            >
              {clew.card.name_zh}
            </Link>
          ) : null}
          {clew.surface ? (
            <span className="mono text-[10px]">面：{SURFACE_ZH[clew.surface] ?? clew.surface}</span>
          ) : null}
          <span className="ml-auto text-[11px] text-muted">
            本地上下文 · {cap?.mode === "live" ? "小能力只读" : "未接模型"}
          </span>
        </div>
      </header>

      {tab === "chat" ? (
        <>
          <ClewChatThread
            threadRef={threadRef}
            messages={messages}
            sending={sending}
            fillStates={fillStates}
            clew={clew}
            capIntro={capIntro}
            bookHref={bookHref}
            pageHref={pageHref}
            studyHref={studyHref}
            reviewHref={reviewHref}
            rememberReturn={rememberClewReturn}
            onSend={send}
            onRetry={retry}
            onFillDrafts={fillDrafts}
          />
          <ClewChatComposer
            draft={draft}
            onDraftChange={setDraft}
            sending={sending}
            tier={tier}
            cap={cap}
            tierAvailable={tierAvailable}
            onPickTier={pickTier}
            onSend={send}
            onStop={stop}
          />
        </>
      ) : tab === "changes" ? (
        <ChangesPanel
          since={sessionStartedAt}
          clew={clew}
          studyHref={studyHref}
          reviewHref={reviewHref}
          rememberReturn={rememberClewReturn}
        />
      ) : (
        <QueuePanel
          clew={clew}
          reviewHref={reviewHref}
          studyHref={studyHref}
          rememberReturn={rememberClewReturn}
        />
      )}

      {/* T66 G：诚实脚注同源常量（lib/clew-suggest.ts）——不做诊断 · 回答≠已核 · 永不写 seed ·
          页码以印刷页为准 · 小能力只读。禁掌握% / Due。
          T68 F / T69 F：本机今日用量次级行（status.usage 计数 + 本会话增量）——有 byTier 时给
          分档括注（快 a · 推 b · 长 c），无则退回总数形；非云账单 · 非掌握度。 */}
      <p className="border-t border-line px-4 py-2 text-xs text-muted">
        {CLEW_HONESTY_FOOTNOTE}
        {cap?.usageToday != null ? (
          <span className="ml-2 text-[11px]">
            本机今日 {cap.usageToday} 次
            {cap.usageByTier
              ? `（快 ${cap.usageByTier.fast ?? 0} · 推 ${cap.usageByTier.reasoning ?? 0} · 长 ${cap.usageByTier["long-context"] ?? 0}）`
              : ""}
            {" · 非云账单 · 非掌握度"}
          </span>
        ) : null}
      </p>
    </aside>
  );
}
