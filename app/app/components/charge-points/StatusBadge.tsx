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
        status === "OFFLINE" && "bg-slate-500",
        status === "WARNING" && "bg-orange-500",
      )}
    >
      {status.toLowerCase()}
    </span>
  );
};
