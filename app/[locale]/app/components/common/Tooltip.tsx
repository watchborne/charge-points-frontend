import type { CSSProperties, ReactNode } from "react";

type TooltipProps = {
  /** The element the tooltip is anchored to. */
  children?: ReactNode;
  content: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Passed through so the anchor can be made keyboard-focusable — hover has
   * no keyboard equivalent, `group-focus-within` is what reveals the bubble
   * for a keyboard user. */
  tabIndex?: number;
  "aria-label"?: string;
};

/**
 * A styled `div` wrapping its `children` that also carries a hover/focus
 * tooltip bubble, shown via CSS (`group-hover`/`group-focus-within`) rather
 * than JS-driven open state — no portal, no dependency, and the bubble stays
 * in the DOM at all times so it's reachable by a screen reader and trivially
 * queryable in tests (Testing Library doesn't gate queries on CSS
 * visibility).
 */
export const Tooltip = ({
  children,
  content,
  className,
  style,
  tabIndex,
  "aria-label": ariaLabel,
}: TooltipProps) => (
  <div
    className={`group/tooltip relative ${className ?? ""}`}
    style={style}
    tabIndex={tabIndex}
    aria-label={ariaLabel}
  >
    {children}
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-card group-hover/tooltip:block group-focus-within/tooltip:block"
    >
      {content}
    </span>
  </div>
);
