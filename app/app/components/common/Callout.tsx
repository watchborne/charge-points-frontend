import { AlertCircle } from "lucide-react";
import classNames from "classnames";

type Props = {
  error: string;
  variant?: "error" | "warning";
};

export const Callout = ({ error, variant = "error" }: Props) => {
  return (
    <div
      className={classNames("mb-6 rounded-lg p-4", {
        "bg-red-50 border border-red-200 text-red-800": variant === "error",
        "bg-orange-100 border border-orange-300 text-orange-500": variant === "warning",
      })}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <p className="font-medium">{error}</p>
      </div>
    </div>
  );
};
