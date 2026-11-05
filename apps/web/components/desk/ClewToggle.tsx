"use client";

import { useSyncExternalStore, useCallback } from "react";
import {
  CLEW_DEFAULT_OPEN,
  loadClewFold,
  saveClewFold,
  subscribeClewFold,
} from "@/lib/clew-fold-persist";

export function useClewFold(): { open: boolean; setOpen: (v: boolean) => void } {
  const choice = useSyncExternalStore(subscribeClewFold, loadClewFold, () => null);
  const open = choice == null ? CLEW_DEFAULT_OPEN : choice === "open";
  const setOpen = useCallback((v: boolean) => {
    saveClewFold(v ? "open" : "folded");
  }, []);

  return { open, setOpen };
}

export default function ClewToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="desk-clew-slot"
      className="inline-flex min-h-8 items-center gap-2 rounded-md border border-line bg-card px-3 text-sm text-foreground no-underline transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-cinnabar motion-reduce:transition-none"
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        className="text-muted"
      >
        <rect x="2" y="3" width="12" height="10" rx="1.5" />
        <path d="M10 3v10" />
      </svg>
      <span>Clew</span>
      {open ? <span className="text-xs text-muted">收起</span> : null}
    </button>
  );
}
