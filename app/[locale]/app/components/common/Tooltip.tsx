import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipPosition,
  TooltipProvider,
  TooltipTrigger,
} from "@watchborne/electrons";
import type { CSSProperties, ReactNode } from "react";

type TooltipProps = {
  /** The element the tooltip is anchored to. */
  children?: ReactNode;
  content: ReactNode;
  side?: TooltipPosition;
  className?: string;
  style?: CSSProperties;
  /** Makes the anchor focusable, so keyboard users can reveal the bubble. */
  tabIndex?: number;
  "aria-label"?: string;
};

/**
 * An anchor with a hover/focus tooltip, on electrons' Radix `Tooltip`: the
 * bubble is portalled, so no ancestor's `overflow-hidden` clips it.
 */
export const Tooltip = ({
  children,
  content,
  side = "top",
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
      <TooltipContent side={side}>{content}</TooltipContent>
    </TooltipRoot>
  </TooltipProvider>
);
