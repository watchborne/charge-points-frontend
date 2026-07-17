import classNames from "classnames";
import { AlertCircle } from "lucide-react";

type Props = {
  error: string;
  variant?: "error" | "warning";
  className?: string;
};

export const Callout = ({ error, variant = "error", className }: Props) => {
  return (
    <div
      className={classNames(className, "mb-6 rounded-lg border p-4", {
        "bg-status-error-soft border-status-error/20 text-status-error-foreground":
          variant === "error",
        "bg-status-warning-soft border-status-warning/20 text-status-warning-foreground":
          variant === "warning",
      })}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <p className="font-medium">{error}</p>
      </div>
    </div>
  );
};
