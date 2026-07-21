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
      if (variant === "error") return <AlertCircle />;
      if (variant === "warning") return <AlertTriangle />;
      if (variant === "success") return <CheckCircle />;
    }

    return undefined;
  }, [icon, variant]);

  return (
    <aside
      className={classNames(
        className,
        "rounded-lg border p-4",
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
      <div className="flex items-center gap-5">
        {calloutIcon && <div className="h-5 w-5">{calloutIcon}</div>}
        {children ?? (
          <div className="flex flex-col gap-1 content-stretch">
            {title && <h4 className="title-m font-bold">{title}</h4>}
            {description && <p className="body-m font-tiny">{description}</p>}
          </div>
        )}
      </div>
    </aside>
  );
};
