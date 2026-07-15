import { Battery, PlugZap, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ChargePointWithConnectors } from "@/types/charge-point";

import { StatCard } from "../common/StatCard";

export const ChargePointStats = ({
  chargePoints,
}: {
  chargePoints: ChargePointWithConnectors[];
}) => {
  const t = useTranslations("");
  const connectedDevices = chargePoints.filter(({ connection }) =>
    ["SYNCED", "CONNECTED"].includes(connection.status),
  );
  const errorDevices = chargePoints.filter(
    (cp) => cp.connection.status === "WARNING" || cp.connectors.some((c) => c.status === "Faulted"),
  );
  const offlineDevices = chargePoints.filter(({ connection }) => connection.status === "OFFLINE");

  const makePercentage = (count: number) =>
    chargePoints.length > 0 ? `${Math.round((count / chargePoints.length) * 100)}%` : "0%";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      <StatCard
        title={t("appPage.chargePoints.stats.total")}
        value={chargePoints.length}
        icon={<Battery className="h-5 w-5 text-muted-foreground" />}
      />
      <StatCard
        title={t("appPage.chargePoints.stats.connected")}
        value={connectedDevices.length}
        icon={<PlugZap className="h-5 w-5 text-status-pending-foreground" />}
        subtitle={makePercentage(connectedDevices.length)}
      />
      <StatCard
        title={t("appPage.chargePoints.stats.error")}
        value={errorDevices.length}
        icon={<X className="h-5 w-5 text-status-error-foreground" />}
        subtitle={makePercentage(errorDevices.length)}
      />
      <StatCard
        title={t("appPage.chargePoints.stats.offline")}
        value={offlineDevices.length}
        icon={<RefreshCw className="h-5 w-5 text-status-offline-foreground" />}
        subtitle={makePercentage(offlineDevices.length)}
      />
    </div>
  );
};
