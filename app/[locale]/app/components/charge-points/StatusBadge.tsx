import classNames from "classnames";

import { connectionStatusTone, toneBadgeClass, toneDotClass } from "@/lib/status";
import { ChargePointConnectionStatus } from "@/types/charge-point";

interface StatusBadgeProps {
  status: ChargePointConnectionStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const tone = connectionStatusTone(status);

  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs capitalize font-medium",
        toneBadgeClass[tone],
      )}
    >
      <div className={classNames("h-2 w-2 rounded-full", toneDotClass[tone])} />
      {status.toLowerCase()}
    </span>
  );
};
