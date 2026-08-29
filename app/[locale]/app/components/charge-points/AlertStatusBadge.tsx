import { AlertStatus } from "@watchborne/charge-points-types";

import { GenericStatusBadge } from "@/app/[locale]/app/components/common/GenericStatusBadge";
import { alertStatusColor } from "@/lib/status";

const STATUS_LABEL_KEY: Record<AlertStatus, string> = {
  OPEN: "appPage.chargePoints.alerts.status.open",
  RESOLVED: "appPage.chargePoints.alerts.status.resolved",
};

export const AlertStatusBadge = ({ status }: { status: AlertStatus }) => (
  <GenericStatusBadge
    status={status}
    getTone={alertStatusColor}
    getLabelKey={(s) => STATUS_LABEL_KEY[s]}
  />
);
