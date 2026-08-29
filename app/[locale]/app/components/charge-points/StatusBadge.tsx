import { ColorPill } from "@watchborne/electrons";

import { connectionStatusColor } from "@/lib/status";
import { ChargePointConnectionStatus } from "@/types/charge-point";

interface StatusBadgeProps {
  status: ChargePointConnectionStatus;
}

/** Thin domain-to-color mapper over @watchborne/electrons's ColorPill. */
export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const color = connectionStatusColor(status);

  return (
    <ColorPill color={color} className="capitalize">
      {status.toLowerCase()}
    </ColorPill>
  );
};
