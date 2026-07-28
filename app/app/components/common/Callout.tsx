import classNames from "classnames";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { PropsWithChildren, ReactNode, useMemo } from "react";

export type CalloutVariant = "default" | "info" | "error" | "warning" | "success";

type CalloutProps = PropsWithChildren & {
  variant?: CalloutVariant;
  title?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
};

export const Callout = ({
  variant = "default",
  title,
  description,
  icon,
  className,
  children,
}: CalloutProps) => {
  const calloutIcon = useMemo(() => {
    if (icon) return icon;

    if (variant !== "default") {
      if (variant === "error") return <AlertCircle className="h-full w-full" />;
      if (variant === "warning") return <AlertTriangle className="h-full w-full" />;
      if (variant === "success") return <CheckCircle className="h-full w-full" />;
    }

    return undefined;
  }, [icon, variant]);

  return (
    <aside
      className={classNames(
        className,
        "rounded-lg border px-3 py-2",
        variant === "info" &&
          "bg-status-charging-soft border-status-charging/20 text-status-charging-foreground",
        variant === "success" &&
          "bg-status-available-soft border-status-available/20 text-status-available-foreground",
        variant === "error" &&
          "bg-status-error-soft border-status-error/20 text-status-error-foreground",
        variant === "warning" &&
          "bg-status-warning-soft border-status-warning/20 text-status-warning-foreground",
      )}
    >
      <div className="flex items-center gap-3">
        {calloutIcon && <div className="h-4 w-4">{calloutIcon}</div>}
        {children ?? (
          <div className="flex flex-col gap-0.5 content-stretch">
            {title && <h4 className="text-m font-bold">{title}</h4>}
            {description && <p className="text-sm">{description}</p>}
          </div>
        )}
      </div>
    </aside>
  );
};
