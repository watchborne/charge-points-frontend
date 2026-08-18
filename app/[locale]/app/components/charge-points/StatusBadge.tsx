import { StatusPill } from "@watchborne/electrons";

import { connectionStatusTone } from "@/lib/status";
import { ChargePointConnectionStatus } from "@/types/charge-point";

interface StatusBadgeProps {
  status: ChargePointConnectionStatus;
}

/** Thin domain-to-tone mapper over @watchborne/electrons's StatusPill (issue #7). */
export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const tone = connectionStatusTone(status);

  return (
    <StatusPill tone={tone} className="capitalize">
      {status.toLowerCase()}
    </StatusPill>
  );
};
