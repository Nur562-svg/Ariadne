/**
 * T82 机械抽出：原 AtomDraftEditor.tsx 顶部 DIFF_ZH / DRAFT_DISCLAIMER / PersistWarn /
 * btnMuted·btnQuiet·textareaCls / nonBlank 整段迁此——字符串 / class / PersistWarn 行为零改
 * （仅加 export）；内联编辑器与 AtomDraftLine / FieldDraftLine / FillAtomQuoteDraft 共用。
 * 后缀 .tsx 而非 .ts：PersistWarn 含 JSX。
 */

export const DIFF_ZH = { what: "识记", why: "机制", case: "应用" } as const;

/** 三分列短句（H）：草稿 ≠ seed · ≠ heye 本机已对 · ≠ study 练分（多处复用，不另造措辞）。 */
export const DRAFT_DISCLAIMER = "草稿 ≠ seed 已核 · 草稿 ≠ heye 本机已对 · 草稿 ≠ study 练分";

/** 隐私模式写失败的可感错误行（H）：不装已持久化。 */
export function PersistWarn({ persisted }: { persisted: boolean | null }) {
  if (persisted !== false) return null;
  return (
    <p role="alert" className="mt-2 text-xs leading-5 text-status-warn">
      本浏览器存储不可用——草稿仅本次会话可见，未持久化（刷新即丢）。
    </p>
  );
}

export const btnMuted =
  "shrink-0 rounded border border-line px-1.5 py-0.5 text-xs text-cinnabar transition-colors hover:border-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none";
export const btnQuiet =
  "shrink-0 rounded border border-line px-1.5 py-0.5 text-xs text-muted transition-colors hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none";

export const textareaCls =
  "mt-1 w-full rounded border border-line bg-card px-2 py-1.5 text-sm leading-6 text-foreground focus-visible:outline-2 focus-visible:outline-cinnabar";

export function nonBlank(s: string | undefined): boolean {
  return s != null && s.trim().length > 0;
}
