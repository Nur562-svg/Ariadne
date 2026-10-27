/**
 * T80 机械抽出：原 DraftInbox.tsx 顶部三件主条 + 两折叠块共用常量/工具整段迁此——
 * 字符串 / class / download 行为零改（仅加 export）。
 */

/** 四分列短句（H）：草稿 ≠ seed；收件箱/补丁包 ≠ 已落盘；草稿 ≠ heye；草稿 ≠ study；draft-port ≠ progress-port。 */
export const INBOX_DISCLAIMER =
  "草稿 ≠ seed 已核 · 收件箱/补丁包 ≠ 已落盘 · 草稿 ≠ heye 本机已对 · 草稿 ≠ study 练分";

export const btnQuiet =
  "shrink-0 rounded border border-line px-1.5 py-0.5 text-xs text-muted transition-colors hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none";

/** 浏览器本地下载（本地文件，不是写仓库；文件名固定，不碰任何 seed 路径）。 */
export function downloadText(filename: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
