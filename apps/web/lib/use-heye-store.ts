"use client";

import { useSyncExternalStore } from "react";
import {
  HEYE_STORE_KEY,
  loadHeYeStore,
  subscribeHeYeStore,
  type HeYeStore,
} from "@/lib/heye-store";

/**
 * T71：共享 useSyncExternalStore 口（订阅 ariadne.heye.v1，键名与写 API 一概不动）。
 * - 快照稳定：按 localStorage 原串缓存——同串同引用（照搬 ChapterQualityCockpit 的
 *   draftSnap 模式），绝不每次 loadHeYeStore() 新对象触发重渲染环。
 * - SSR fail-closed：getServerSnapshot 恒空对象（同引用）；首帧空仓是合法口径
 *   （计数如实 0，不造假正数，不永挂「读取中」）。
 * - 订阅延一拍：heye-store 写路径是「先广播后落盘」（setHeYeMark 等先 emit 再
 *   save），而 React 的 uSES 在订阅回调里同步核快照——emit 瞬间读旧串会漏更新。
 *   延到微任务后落盘必已完成；progress-port 的 notifyHeYeExternalChange 本就
 *   写完才广播，微任务同样正确。getSnapshot 永不抛（隐私模式读失败 = 空仓）。
 */

const EMPTY_HEYE_STORE: HeYeStore = {};
let snapRaw: string | null | undefined;
let snapStore: HeYeStore = EMPTY_HEYE_STORE;

function getHeYeSnapshot(): HeYeStore {
  if (typeof window === "undefined") return EMPTY_HEYE_STORE;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(HEYE_STORE_KEY);
  } catch {
    raw = null; // 隐私模式读失败 = 空仓（fail-closed，不抛）
  }
  if (raw !== snapRaw) {
    snapRaw = raw;
    snapStore = loadHeYeStore();
  }
  return snapStore;
}

function subscribeHeYeAfterWrite(notify: () => void): () => void {
  return subscribeHeYeStore(() => {
    queueMicrotask(notify);
  });
}

export function useHeYeStore(): HeYeStore {
  return useSyncExternalStore(
    subscribeHeYeAfterWrite,
    getHeYeSnapshot,
    () => EMPTY_HEYE_STORE,
  );
}
