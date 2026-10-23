/**
 * T53 A：OCR 印刷页有效性 / 书桌章页深链共享 helper。
 * 无 "use client"——server 页面与 client 岛共用（与 lib/qs-mode.ts 同手法）。
 * 契约对齐 T52 EntityCardDetail 内联 ocrHas：validPages 未装配（undefined/null）→
 * 不门禁（保持既有链，宿主能取到才传，fail-open-on-missing、fail-closed-on-known-ghost）；
 * 已装配且不含该页 → 该页无 OCR，书桌章页定位不了——调用方降纯文 / 回落书级，不拼鬼 &page=。
 * 禁止第二套 OCR 判定：各面（CiteChip / CitePeek / CardCard 对页 / EntityCardDetail /
 * StudySession deskBack）一律经这两个函数，不各自 includes。
 */

/** 页是否在该书已解析 OCR 印刷页表内；表未装配 → true（不门禁，对齐 T52）。 */
export function pageInOcr(validPages: number[] | null | undefined, page: number): boolean {
  if (validPages == null) return true;
  return validPages.includes(page);
}

/**
 * 书桌章页深链：缺 book / 缺 page / 页不在已解析 OCR 表内 → null（调用方降纯文
 * 「本页无 OCR」或回落书级，不装能定位）；页有效 → /desk?book=&page=。
 */
export function deskPageHref(
  bookId: string | null | undefined,
  page: number | null | undefined,
  validPages?: number[],
): string | null {
  if (bookId == null || bookId === "" || page == null) return null;
  if (!pageInOcr(validPages, page)) return null;
  return `/desk?book=${encodeURIComponent(bookId)}&page=${page}`;
}
