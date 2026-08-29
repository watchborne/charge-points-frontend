import { StatusPill } from "@watchborne/electrons";

import { connectionStatusColor } from "@/lib/status";
import { ChargePointConnectionStatus } from "@/types/charge-point";

interface StatusBadgeProps {
  status: ChargePointConnectionStatus;
}

/** Thin domain-to-color mapper over @watchborne/electrons's StatusPill. */
export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const color = connectionStatusColor(status);

  return (
    <StatusPill tone={color} className="capitalize">
      {status.toLowerCase()}
    </StatusPill>
  );
};
