"use client";

import { useState } from "react";
import {
  applyFieldDraft,
  clearAtomDraft,
  fieldDraftDiffers,
  fieldDraftKey,
  loadAtomDraftStore,
  setAtomDraft,
} from "@/lib/atom-draft";
import { useAtomDraftStore } from "@/lib/use-atom-draft-store";
import {
  DRAFT_DISCLAIMER,
  PersistWarn,
  btnMuted,
  btnQuiet,
  nonBlank,
  textareaCls,
} from "@/components/atom-draft-editor-shared";

/**
 * T82 机械抽出：原 AtomDraftEditor.tsx 内 FieldDraftLine 整段迁此——value overlay /
 * 琥珀「已改草稿」旁挂 / 「编辑字段草稿（本机）」极简编辑器 / lazy 初值 / PersistWarn /
 * 「label 只读」文案——JSX / 文案 / class / aria 与 tip 逐段一致；形参表同 tip。
 */

/**
 * F：字段草稿岛（最小面）——value 可草稿（overlay 显示 + 极简编辑器）；label 只读。
 * 有真改动草稿 → 琥珀「已改草稿」旁挂（与原子区同族样式、同 trim 口径）。0 字段诚实句
 * 由服务端保留（T47），本岛不参与空表 densify、不加第二颗实心主 CTA。
 */
export function FieldDraftLine({
  cardId,
  fieldIndex,
  seedValue,
}: {
  cardId: string;
  fieldIndex: number;
  seedValue: string;
}) {
  const key = fieldDraftKey(cardId, fieldIndex);
  // T71：共享 useSyncExternalStore 口（空仓 entry=undefined → 回落 seed 原文，同旧 ready=false 分支）。
  const store = useAtomDraftStore();
  const entry = store[key];
  const changed = fieldDraftDiffers(seedValue, entry);
  const [open, setOpen] = useState(false);
  // T72：form-seed 改 lazy 初值——草稿非空优先，空/读失败回落 seed。value 只喂
  // 「点开后」的输入框（SSR/水合帧不渲染），lazy 读盘不产生水合错位；用户编辑
  // 中途不再被 effect 冲掉。
  const [value, setValue] = useState(() => {
    const cur = loadAtomDraftStore()[key];
    return cur && nonBlank(cur.value) ? (cur.value as string) : seedValue;
  });
  const [persisted, setPersisted] = useState<boolean | null>(null);

  return (
    <div>
      <p className="text-sm leading-7 text-foreground/90">
        {entry ? applyFieldDraft({ label: "", value: seedValue }, entry).value : seedValue}
        {changed ? (
          <span className="ml-2 rounded border border-amber-300 px-1.5 py-0.5 align-middle text-[11px] text-status-warn">
            已改草稿
          </span>
        ) : null}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={open ? btnQuiet : btnMuted}
          aria-expanded={open}
        >
          {open ? "收起草稿编辑" : "编辑字段草稿（本机）"}
        </button>
        <span className="text-[11px] text-muted">label 只读 · {DRAFT_DISCLAIMER}</span>
      </p>
      {open ? (
        <div className="mt-2 rounded-lg border border-amber-300/60 bg-status-warn-bg/40 px-3 py-2.5">
          <p className="text-xs leading-5 text-status-warn">
            本机草稿 · 未写回 seed · 不等于抽查 verified · 不等于本机已对
          </p>
          <label className="mt-2 block text-xs text-muted">
            value（字段内容）
            <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} className={textareaCls} />
          </label>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const r = setAtomDraft(key, { value });
                setPersisted(r.persisted);
              }}
              className={btnMuted}
            >
              保存本条草稿
            </button>
            <button
              type="button"
              onClick={() => {
                const r = clearAtomDraft(key);
                setPersisted(r.persisted);
                setValue(seedValue);
              }}
              className={btnQuiet}
            >
              放弃本条草稿
            </button>
          </p>
          <PersistWarn persisted={persisted} />
        </div>
      ) : null}
    </div>
  );
}
