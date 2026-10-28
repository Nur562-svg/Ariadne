/**
 * T88 机械抽出：原 lib/last-opened.ts types 分区（LAST_OPENED_KEY / RECENT_BOOKS_KEY ·
 * type LastOpened）整段迁此——key 字符串一字不改、LastOpened 形状零改。
 * 本件是三件 DAG 的根：无 import。
 * 无 "use client" / 无 fs / 无 process.env / 无网络 / 无 LLM。
 * 边界铁律 header 与消费者入口仍在 @/lib/last-opened（barrel）。
 */

export const LAST_OPENED_KEY = "ariadne.desk.last-opened.v1";
export const RECENT_BOOKS_KEY = "ariadne.desk.recent-books.v1";

export type LastOpened = {
  bookId: string;
  /** 上次打开时进书桌的深链（缺省可由 bookId 反推 /desk?book=）。 */
  deskHref?: string;
  /** 上次停留的印刷页（深链 /desk?book=&page=）；缺省表示未定位到页。 */
  page?: number;
  /** 写入时刻（epoch ms）。 */
  at: number;
};
