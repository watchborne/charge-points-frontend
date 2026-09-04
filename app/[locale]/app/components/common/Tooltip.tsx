import type { CSSProperties, ReactNode } from "react";

import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TooltipProps = {
  /** The element the tooltip is anchored to. */
  children?: ReactNode;
  content: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Passed through so the anchor can be made keyboard-focusable — hover has
   * no keyboard equivalent, focus is what reveals the bubble for a keyboard
   * user. */
  tabIndex?: number;
  "aria-label"?: string;
};

/**
 * A styled anchor wrapping `children` with a hover/focus tooltip bubble,
 * built on shadcn/ui's Radix `Tooltip` primitive (`components/ui/tooltip.tsx`)
 * rather than a hand-rolled CSS `group-hover` bubble — Radix positions the
 * bubble in a portal via floating-ui, so it's never clipped by an ancestor's
 * `overflow-hidden`, and it manages open state itself instead of relying on
 * a CSS pseudo-class.
 */
export const Tooltip = ({
  children,
  content,
  className,
  style,
  tabIndex,
  "aria-label": ariaLabel,
}: TooltipProps) => (
  <TooltipProvider delayDuration={200}>
    <TooltipRoot>
      <TooltipTrigger asChild>
        <div className={className} style={style} tabIndex={tabIndex} aria-label={ariaLabel}>
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </TooltipRoot>
  </TooltipProvider>
);
