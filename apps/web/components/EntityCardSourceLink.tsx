"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useWideDesk, useClewFold } from "@/components/desk/ClewToggle";
import type { FieldCiteLite } from "@/lib/entity-card-source-model";

type CardSourceCtx = {
  wide: boolean;
  pages: number[];
  page: number;
  activeField: number | null;
  fieldCites: (FieldCiteLite | null)[];
  selectField: (i: number) => void;
  goPage: (p: number) => void;
  selectable: (i: number) => boolean;
};

const CardSourceContext = createContext<CardSourceCtx | null>(null);

export function useCardSource(): CardSourceCtx | null {
  return useContext(CardSourceContext);
}

export function CardSourceProvider({
  fieldCites,
  pages,
  initialPage,
  initialField,
  children,
}: {
  fieldCites: (FieldCiteLite | null)[];
  pages: number[];
  initialPage: number;
  initialField: number | null;
  children: ReactNode;
}) {
  const [page, setPage] = useState<number>(initialPage);
  const [activeField, setActiveField] = useState<number | null>(initialField);
  const wide = useWideDesk();

  const selectable = useCallback(
    (i: number): boolean => {
      const p = fieldCites[i]?.page;
      return p != null && pages.includes(p);
    },
    [fieldCites, pages],
  );

  const selectField = useCallback(
    (i: number) => {
      if (!selectable(i)) return;
      setActiveField(i);
      const p = fieldCites[i]?.page;
      if (p != null && pages.includes(p)) {
        setPage(p);
      }
    },
    [fieldCites, pages, selectable],
  );

  const goPage = useCallback(
    (p: number) => {
      if (pages.includes(p)) {
        setPage(p);
      }
    },
    [pages],
  );

  return (
    <CardSourceContext.Provider
      value={{
        wide,
        pages,
        page,
        activeField,
        fieldCites,
        selectField,
        goPage,
        selectable,
      }}
    >
      {children}
    </CardSourceContext.Provider>
  );
}

export function FieldRowSelect({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const ctx = useCardSource();
  if (!ctx) {
    return <div className="rounded-lg border border-line bg-card p-4">{children}</div>;
  }

  const { wide, activeField, selectable, selectField } = ctx;
  const isSelectable = wide && selectable(index);
  const isSelected = wide && activeField === index;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a,button,summary,input,textarea,select,label")) return;
    if (isSelectable) {
      selectField(index);
    }
  };

  const baseClasses = "rounded-lg border border-line p-4";
  const stateClasses = isSelected
    ? "bg-cinnabar-soft shadow-[inset_2px_0_0_0_var(--cinnabar)] [--muted:#5f5a51] cursor-pointer transition-colors motion-reduce:transition-none"
    : isSelectable
    ? "bg-card cursor-pointer transition-colors hover:bg-background motion-reduce:transition-none"
    : "bg-card";

  return (
    <div
      data-card-field-row={index}
      data-selected={isSelected ? "true" : undefined}
      onClick={handleClick}
      className={`${baseClasses} ${stateClasses}`}
    >
      {children}
    </div>
  );
}

export function FieldSelectLabel({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const ctx = useCardSource();
  if (!ctx || !(ctx.wide && ctx.selectable(index))) {
    return <>{children}</>;
  }

  const isSelected = ctx.activeField === index;

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => ctx.selectField(index)}
      className="min-h-7 text-left font-semibold hover:text-cinnabar focus-visible:outline-2 focus-visible:outline-cinnabar"
    >
      {children}
    </button>
  );
}

export function CardSourceConnector() {
  const ctx = useCardSource();
  const { open: clewOpen } = useClewFold();
  const pathRef = useRef<SVGPathElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);

  const page = ctx?.page;
  const activeField = ctx?.activeField;
  const wide = ctx?.wide;

  useEffect(() => {
    const path = pathRef.current;
    const circle = circleRef.current;
    if (!path || !circle) return;

    const hide = () => {
      path.setAttribute("d", "");
      circle.style.display = "none";
    };

    const updateLine = () => {
      if (!wide || clewOpen || activeField == null) {
        hide();
        return;
      }

      const textContainer = document.querySelector("[data-card-src-text]");
      const pane = document.querySelector("[data-card-src-pane]");
      const selectedRow = document.querySelector(
        `[data-card-field-row="${activeField}"][data-selected="true"]`,
      );
      const main = document.querySelector("main");
      const marks = document.querySelectorAll("[data-card-src-mark]");

      if (!textContainer || !pane || !selectedRow || !main || marks.length === 0) {
        hide();
        return;
      }

      const textRect = textContainer.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const paneRect = pane.getBoundingClientRect();
      const rowRect = selectedRow.getBoundingClientRect();

      let minTop = Infinity;
      let maxBottom = -Infinity;
      for (let i = 0; i < marks.length; i++) {
        const m = marks[i];
        const rects = m.getClientRects();
        for (let j = 0; j < rects.length; j++) {
          const r = rects[j];
          if (r.top < textRect.top - 1 || r.bottom > textRect.bottom + 1) {
            hide();
            return;
          }
          if (r.top < minTop) minTop = r.top;
          if (r.bottom > maxBottom) maxBottom = r.bottom;
        }
      }

      if (minTop === Infinity || maxBottom === -Infinity) {
        hide();
        return;
      }

      const rowCenterY = (rowRect.top + rowRect.bottom) / 2;
      if (rowCenterY < mainRect.top - 4 || rowCenterY > mainRect.bottom + 4) {
        hide();
        return;
      }

      const xb = paneRect.right - 14;
      const yTop = minTop;
      const yBot = maxBottom;
      const ym = (yTop + yBot) / 2;
      const xm = paneRect.right + (rowRect.left - paneRect.right) / 2;
      const yr = Math.max(rowRect.top + 8, Math.min(rowRect.bottom - 8, rowCenterY));
      const xEnd = rowRect.left;

      const d = `M ${xb - 5} ${yTop} H ${xb} V ${yBot} H ${xb - 5} M ${xb} ${ym} H ${xm} V ${yr} H ${xEnd}`;
      path.setAttribute("d", d);
      circle.setAttribute("cx", String(xEnd));
      circle.setAttribute("cy", String(yr));
      circle.style.display = "block";
    };

    let rafId: number | null = null;
    const onRaf = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateLine();
      });
    };

    onRaf();

    const main = document.querySelector("main");
    const textContainer = document.querySelector("[data-card-src-text]");
    const selectedRow = document.querySelector(
      `[data-card-field-row="${activeField}"][data-selected="true"]`,
    );

    window.addEventListener("resize", onRaf);
    main?.addEventListener("scroll", onRaf, { passive: true });
    textContainer?.addEventListener("scroll", onRaf, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(onRaf);
      if (textContainer) ro.observe(textContainer);
      if (selectedRow) ro.observe(selectedRow);
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(onRaf).catch(() => {});
    }

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onRaf);
      main?.removeEventListener("scroll", onRaf);
      textContainer?.removeEventListener("scroll", onRaf);
      ro?.disconnect();
    };
  }, [page, activeField, wide, clewOpen]);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 h-dvh w-screen"
    >
      <path ref={pathRef} stroke="var(--cinnabar)" strokeWidth="1" fill="none" d="" />
      <circle
        ref={circleRef}
        r="2.5"
        fill="var(--cinnabar)"
        cx="0"
        cy="0"
        style={{ display: "none" }}
      />
    </svg>
  );
}
