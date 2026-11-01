import type { ReactNode } from "react";

/**
 * T100 desk-first-screen-polish-01：系统诚实说明原生折叠披露。
 * 使用原生 <details>/<summary>：零 JS、天然键盘 Enter/Space 可用、无动画。
 * summary 为一个 ⓘ 符号（text-muted，focus-visible:outline-2 focus-visible:outline-cinnabar，点击区 ≥ 24×24px）。
 * 面板为普通文档流向下展开（无浮层、无绝对定位、不遮挡阅读）。
 */
export default function HonestyDisclosure({
  disclaimer,
  extra,
}: {
  disclaimer: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <details className="inline align-baseline">
      <summary
        className="inline-flex min-h-[24px] min-w-[24px] cursor-pointer list-none select-none items-center justify-center rounded text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-cinnabar [&::-webkit-details-marker]:hidden [&::marker]:hidden"
        aria-label="口径说明"
      >
        ⓘ
      </summary>
      <div className="mt-1 space-y-0.5 text-xs text-muted">
        <div>{disclaimer}</div>
        {extra ? <div>{extra}</div> : null}
      </div>
    </details>
  );
}
