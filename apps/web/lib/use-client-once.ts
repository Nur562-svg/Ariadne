"use client";

import { useSyncExternalStore } from "react";

/**
 * T72：永不触发的订阅——一次性读没有广播源。水合完成后 React 的 uSES 快照一致性
 * 检查会调一次 getSnapshot（与 T71 三仓 hook 的首帧翻转同机制），此后组件每次
 * 重渲染也会以最新闭包再读（getSnapshot 逐渲染求值），props 变化即自动重采。
 */
export function subscribeNever(): () => void {
  return () => {};
}

/**
 * T72：SSR 安全的「挂载一次读」——替「mount effect 里 setState 采纳」的经典
 * set-state-in-effect 形（one-shot nav / return / viewMode 续住）。
 *
 * - SSR 与水合首帧恒 server 值（getServerSnapshot）：不读 window、不水合错位（合同 #5）。
 * - read 必须值稳定：原始值（number/string/null/boolean），或自备引用缓存的快照
 *  （如 return-stack 的 loadReturnOnce）——同盘同值，否则触发 uSES 快照不稳警告/循环。
 * - 读失败回落 server 值：read 内部自兜（fail-closed，不抛）。
 * - 语义 = 一次性采纳，不是订阅：盘面后续变化不主动推送；仅在组件因 props/state
 *   变化重渲染时以新闭包重读（等价旧 effect 的 deps 重跑，且更即时）。
 */
export function useClientOnce<T>(read: () => T, server: T): T {
  return useSyncExternalStore(subscribeNever, read, () => server);
}
