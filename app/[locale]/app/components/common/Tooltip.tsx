import type { ComponentPropsWithoutRef, ReactNode } from "react";

type TooltipProps = ComponentPropsWithoutRef<"div"> & {
  content: ReactNode;
};

/**
 * A styled `div` (every other prop passes through, so callers can still
 * position/size/focus it as if this were the plain element) that also
 * carries a hover/focus tooltip bubble, shown via CSS
 * (`group-hover`/`group-focus-within`) rather than JS-driven open state — no
 * portal, no dependency, and the bubble stays in the DOM at all times so
 * it's reachable by a screen reader and trivially queryable in tests
 * (Testing Library doesn't gate queries on CSS visibility).
 */
export const Tooltip = ({ content, className, children, ...rest }: TooltipProps) => (
  <div className={`group/tooltip relative ${className ?? ""}`} {...rest}>
    {children}
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-card group-hover/tooltip:block group-focus-within/tooltip:block"
    >
      {content}
    </span>
  </div>
);
