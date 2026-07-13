import classNames from "classnames";
import { AlertCircle } from "lucide-react";

type Props = {
  error: string;
  variant?: "error" | "warning";
};

export const Callout = ({ error, variant = "error" }: Props) => {
  return (
    <div
      className={classNames("mb-6 rounded-lg p-4", {
        "bg-st-error-100 border border-st-error-500 text-st-error-700": variant === "error",
        "bg-st-maint-100 border border-st-maint-500 text-st-maint-700": variant === "warning",
      })}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <p className="font-medium">{error}</p>
      </div>
    </div>
  );
};
