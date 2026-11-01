import Link from "next/link";
import CopyCommand from "@/components/CopyCommand";
import type { IngestMaterialModel } from "@/lib/ingest-material-model";

interface IngestMaterialQualityPanelsProps {
  model: IngestMaterialModel;
}

export default function IngestMaterialQualityPanels({
  model,
}: IngestMaterialQualityPanelsProps) {
  const {
    weakParseChapters,
    covEmpty,
    covSparse,
    darkChapters,
    darkTotal,
    shallowChapters,
    shallowTotal,
    weakChapters,
  } = model;

  return (
    <>
      {/* T56 D：parse 覆盖偏弱块（任 weak 章才渲）——琥珀点名 + 补扫命令可复制
          （弱章子集，区别于 T55 抽取弱章命令）；与 T55 cite 补救面板分列。 */}
      {weakParseChapters.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-300/60 px-3 py-2">
          <p className="text-xs leading-6 text-status-warn">
            OCR 覆盖偏弱 · 空 {covEmpty} 页 · 稀 {covSparse} 页（弱章：
            {weakParseChapters.map(([id]) => id).join(" ")}）——稀页/空页常为
            分隔页或漏扫，补扫后重跑 parse-check 复核；不阻断抽出/注册。
          </p>
          <div className="mt-2">
            <CopyCommand
              command={`pnpm parse ${weakParseChapters.map(([id]) => id).join(" ")}`}
            />
          </div>
        </div>
      ) : null}
      {/* T57 D：抽出页覆盖偏弱块（任暗页章才渲；与 T56 parse 覆盖块 / T55 补救
          面板**分列**）——琥珀点名 + 顶层暗页样例 ≤6（页码 mono + chars）+ 重抽
          命令可复制（弱章子集）。只展示 + 剪贴板——不自动 PATCH entities /
          不发明 cite 填暗页；扉页/小结/跨章扉可能合理暗，不阻断注册。 */}
      {darkChapters.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-300/60 px-3 py-2">
          <p className="text-xs leading-6 text-status-warn">
            抽出页覆盖偏稀 · 暗页未成原子（暗 {darkTotal} 页 · 弱章：
            {darkChapters.map(([id]) => id).join(" ")}）——实质 OCR 页没有任何卡
            cite；扉页/小结/跨章扉可能合理暗，重抽或人工补 seed 后 pnpm page-check
            复核；不阻断注册。
          </p>
          {(() => {
            const darkSamples = darkChapters
              .flatMap(([id, cov]) =>
                (cov?.darkPages ?? []).map((d) => ({ ch: id, ...d })),
              )
              .slice(0, 6);
            if (darkSamples.length === 0) return null;
            return (
              <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs leading-5 text-muted">
                <span>暗页样例：</span>
                {darkSamples.map((s) => (
                  <span key={`${s.ch}:${s.page}`} className="mono">
                    {s.ch} p.{s.page}（{s.chars}字）
                  </span>
                ))}
              </p>
            );
          })()}
          <div className="mt-2">
            <CopyCommand
              command={`pnpm extract -- ${darkChapters.map(([id]) => id).join(" ")}`}
            />
          </div>
        </div>
      ) : null}
      {/* T59 D：抽出密度偏稀块（任浅页章才渲；与 T57 暗页块 / T56 parse 覆盖块 /
          T55 补救面板**分列**）——琥珀点名 + 顶层浅页样例 ≤6（页码 mono + 原子数 +
          字数）+ 重抽命令可复制（弱章子集）。浅 ≠ 暗：浅是已 cite 实质页原子极稀
          （可考密度不足），暗是零 cite。只展示 + 剪贴板——不自动 PATCH entities /
          不发明原子「补浅」；浅不伪装成暗/稀/cite miss，不阻断注册。 */}
      {shallowChapters.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-300/60 px-3 py-2">
          <p className="text-xs leading-6 text-status-warn">
            抽出密度偏稀 · 已 cite 页原子极少（浅 {shallowTotal} 页 · 弱章：
            {shallowChapters.map(([id]) => id).join(" ")}）——这些实质页已被
            cite 但每页只扛 1–2 个原子，可考密度不足；重抽或人工补 seed 后
            pnpm density-check 复核；不阻断注册。
          </p>
          {(() => {
            const shallowSamples = shallowChapters
              .flatMap(([id, den]) =>
                (den?.shallowPages ?? []).map((s) => ({ ch: id, ...s })),
              )
              .slice(0, 6);
            if (shallowSamples.length === 0) return null;
            return (
              <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs leading-5 text-muted">
                <span>浅页样例：</span>
                {shallowSamples.map((s) => (
                  <span key={`${s.ch}:${s.page}`} className="mono">
                    {s.ch} p.{s.page}（{s.atomCount}原子·{s.chars}字）
                  </span>
                ))}
              </p>
            );
          })()}
          <div className="mt-2">
            <CopyCommand
              command={`pnpm extract -- ${shallowChapters.map(([id]) => id).join(" ")}`}
            />
          </div>
        </div>
      ) : null}
      {/* T55 D：补救面板（extracted/ready 且有弱章才渲；uploaded/parsed 不装假表）——
          每弱章 <details> 展开 miss 样例（≤8，链卡 + p.N + cov + OCR 附近 mono）+
          零原子卡 id 链 + 不完备原子点名；重抽命令可复制（多章按弱章子集拼）。
          只展示 + 剪贴板——不自动 PATCH entities / 不写 verified。 */}
      {weakChapters.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-300/60 px-3 py-2">
          {weakChapters.map(([chId, ck]) => (
            <details key={chId} className="py-1">
              <summary className="cursor-pointer select-none text-xs leading-6 text-status-warn">
                补救 · {chId}：OCR未见 {ck.quality.ocrMiss} · 零原子卡{" "}
                {ck.quality.zeroAtomCards} · 不完备原子 {ck.quality.incompleteAtoms}
              </summary>
              {ck.misses.length > 0 ? (
                <ul className="mt-1.5 space-y-1.5">
                  {ck.misses.map((mm, i) => (
                    <li key={`${mm.cardId}:${mm.page}:${i}`} className="text-xs leading-5 text-muted">
                      <Link
                        href={`/desk/card/${encodeURIComponent(mm.cardId)}`}
                        className="mono mr-1 text-cinnabar no-underline hover:underline underline-offset-4"
                      >
                        {mm.cardId}
                      </Link>
                      · p.{mm.page} · cov {mm.coverage} · “{mm.quote}”
                      {mm.ocrSnippet ? (
                        <span className="mono mt-0.5 block text-[11px] leading-5 text-foreground/80">
                          OCR附近：{mm.ocrSnippet}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-xs leading-5 text-muted">
                  （本章无 OCR 未见样例——弱项为零原子卡 / 不完备原子，见下）
                </p>
              )}
              {ck.zeroAtomCardIds.length > 0 ? (
                <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs leading-5 text-muted">
                  <span>零原子卡（练不出题）：</span>
                  {ck.zeroAtomCardIds.map((id) => (
                    <Link
                      key={id}
                      href={`/desk/card/${encodeURIComponent(id)}`}
                      className="mono text-cinnabar no-underline hover:underline underline-offset-4"
                    >
                      {id}
                    </Link>
                  ))}
                </p>
              ) : null}
              {ck.quality.incompleteAtoms > 0 ? (
                <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs leading-5 text-status-warn">
                  <span>
                    不完备原子 {ck.quality.incompleteAtoms}（空 prompt{" "}
                    {ck.quality.emptyPromptAtoms} / 空 answer{" "}
                    {ck.quality.emptyAnswerAtoms}）——重抽或人工补 seed 后再注册；
                  </span>
                  {/* T61 G：不完备卡次级链「到卡详开草稿」——本机草稿补空字段、
                      导出补丁自行落盘（草稿 ≠ seed，不阻断 register）。 */}
                  {ck.incompleteCardIds.length > 0 ? (
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span>或到卡详开本机草稿：</span>
                      {ck.incompleteCardIds.slice(0, 6).map((id) => (
                        <Link
                          key={id}
                          href={`/desk/card/${encodeURIComponent(id)}`}
                          className="mono text-cinnabar no-underline hover:underline underline-offset-4"
                        >
                          {id}
                        </Link>
                      ))}
                      {ck.incompleteCardIds.length > 6 ? (
                        <span className="text-muted">等 {ck.incompleteCardIds.length} 张卡</span>
                      ) : null}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </details>
          ))}
          <div className="mt-2">
            <CopyCommand
              command={`pnpm extract -- ${weakChapters.map(([id]) => id).join(" ")}`}
            />
          </div>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            补救 = 展示 + 剪贴板：建议摘录 / 重抽命令由人核后手动执行，不自动写 entities。
          </p>
        </div>
      ) : null}
    </>
  );
}
