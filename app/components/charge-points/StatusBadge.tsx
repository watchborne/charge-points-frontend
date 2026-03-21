import classNames from "classnames";

import { ChargePointConnectionStatus } from "@/types/charge-point";

interface StatusBadgeProps {
  status: ChargePointConnectionStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span
      className={classNames(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs capitalize font-medium text-white",
        status === "CONNECTED" && "bg-yellow-500",
        status === "SYNCED" && "bg-green-500",
        status === "OFFLINE" &&
          "bg-white border border-2 border-slate-600 text-slate-600",
        status === "ERROR" && "bg-red-500",
      )}
    >
      {status.toLowerCase()}
    </span>
  );
};
