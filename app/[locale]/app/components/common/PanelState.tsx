import { Callout } from "@watchborne/electrons";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export interface PanelStateProps {
  /** Shows the loading line and nothing else; takes precedence over `isError`. */
  isLoading?: boolean;
  /** Shows the error callout in place of the content. */
  isError?: boolean;
  /** Shows the empty message in place of the content. */
  isEmpty?: boolean;
  /** Icon of the loading line. Defaults to a spinner. */
  loadingIcon?: ReactNode;
  /** Text next to the icon while loading (already translated by the caller). */
  loadingMessage?: string;
  errorMessage?: string;
  /** With no message, an empty panel renders nothing. */
  emptyMessage?: string;
  /** The loaded content, rendered only when not loading, failed or empty. */
  children?: ReactNode;
}

/**
 * The loading / error / empty / content switch the charge point detail panels
 * share. Texts are props because the caller owns the translation. Renders no
 * wrapper of its own, so it sits directly in the panel's flex column.
 */
export const PanelState = ({
  isLoading = false,
  isError = false,
  isEmpty = false,
  loadingIcon = <Loader2 className="h-4 w-4 animate-spin" />,
  loadingMessage,
  errorMessage,
  emptyMessage,
  children,
}: PanelStateProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {loadingIcon}
        {loadingMessage}
      </div>
    );
  }

  if (isError) {
    return <Callout description={errorMessage} variant="error" />;
  }

  if (isEmpty) {
    return emptyMessage ? (
      <span className="text-sm text-muted-foreground">{emptyMessage}</span>
    ) : null;
  }

  return <>{children}</>;
};
