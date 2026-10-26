"use client";

import { useSyncExternalStore } from "react";
import {
  ATOM_DRAFT_STORE_KEY,
  loadAtomDraftStore,
  subscribeAtomDraftStore,
  type AtomDraftStore,
} from "@/lib/atom-draft";

/**
 * T71：共享 useSyncExternalStore 口（订阅 ariadne.atom-draft.v1，键名与写 API 一概
 * 不动）。抽自 ChapterQualityCockpit 的 draftSnap 私货——三仓（heye / study /
 * atom-draft）同一模式。
 * - 快照稳定：按 localStorage 原串缓存——同串同引用，绝不每次 loadAtomDraftStore()
 *   新对象触发重渲染环。
 * - SSR fail-closed：getServerSnapshot 恒空对象（同引用）；首帧空仓是合法口径
 *   （草稿计数如实 0，不造假正数）。
 * - 订阅延一拍：atom-draft 写路径是「先广播后落盘」（setAtomDraft 等先 emit 再
 *   persist），而 React 的 uSES 在订阅回调里同步核快照——emit 瞬间读旧串会漏更新
 *   （T71 前的 Cockpit 直连订阅就带这个隐性陈旧）。延到微任务后落盘必已完成；
 *   atom-draft-port 导入（saveWholeAtomDraftStore）与 notify 外部整包写入同样正确。
 *   getSnapshot 永不抛（隐私模式读失败 = 空仓）。
 */

const EMPTY_DRAFT_STORE: AtomDraftStore = {};
let snapRaw: string | null | undefined;
let snapStore: AtomDraftStore = EMPTY_DRAFT_STORE;

function getAtomDraftSnapshot(): AtomDraftStore {
  if (typeof window === "undefined") return EMPTY_DRAFT_STORE;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(ATOM_DRAFT_STORE_KEY);
  } catch {
    raw = null; // 隐私模式读失败 = 空仓（fail-closed，不抛）
  }
  if (raw !== snapRaw) {
    snapRaw = raw;
    snapStore = loadAtomDraftStore();
  }
  return snapStore;
}

function subscribeAtomDraftAfterWrite(notify: () => void): () => void {
  return subscribeAtomDraftStore(() => {
    queueMicrotask(notify);
  });
}

export function useAtomDraftStore(): AtomDraftStore {
  return useSyncExternalStore(
    subscribeAtomDraftAfterWrite,
    getAtomDraftSnapshot,
    () => EMPTY_DRAFT_STORE,
  );
}
