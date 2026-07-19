import classNames from "classnames";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { PropsWithChildren, ReactNode, useMemo } from "react";

type CalloutProps = PropsWithChildren & {
  variant?: "default" | "error" | "warning" | "success";
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
      if (variant === "error") return <AlertCircle className="h-5 w-5" />;
      if (variant === "warning") return <AlertTriangle className="h-5 w-5" />;
      if (variant === "success") return <CheckCircle className="h-5 w-5" />;
    }

    return undefined;
  }, [icon, variant]);

  return (
    <aside
      className={classNames(
        className,
        "rounded-lg border p-4",
        variant === "success" &&
          "bg-status-available-soft border-status-available/20 text-status-available-foreground",
        variant === "error" &&
          "bg-status-error-soft border-status-error/20 text-status-error-foreground",
        variant === "warning" &&
          "bg-status-warning-soft border-status-warning/20 text-status-warning-foreground",
      )}
    >
      <div className="flex items-center gap-3">
        {calloutIcon}

        {children ?? (
          <div className="flex flex-col gap-1 content-stretch">
            {title && <h4 className="text-l">{title}</h4>}
            {description && <p className="font-medium">{description}</p>}
          </div>
        )}
      </div>
    </aside>
  );
};
