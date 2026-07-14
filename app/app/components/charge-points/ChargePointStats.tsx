import classNames from "classnames";
import { Battery, CheckCircle, Cloud, PlugZap, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

import { connectorStatusTone, toneTextClass } from "@/lib/status";
import { ChargePointWithConnectors, ConnectorStatus } from "@/types/charge-point";

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
  const offlineDevices = chargePoints.filter(({ connection }) =>
    ["OFFLINE"].includes(connection.status),
  );
  const notStableDevices = chargePoints.filter(
    (cp) => cp.connection.status === "WARNING" || cp.connectors.some((c) => c.status === "Faulted"),
  );
  const syncedDevices = chargePoints.filter((cp) => cp.connection.status === "SYNCED");

  const makePercentage = (count: number) =>
    chargePoints.length > 0 ? `${Math.round((count / chargePoints.length) * 100)}%` : "0%";

  const makeStat = (count: number) => ({
    value: count,
    percentage: makePercentage(count),
  });

  const stats = {
    total: chargePoints.length,
    connected: makeStat(connectedDevices.length),
    offline: makeStat(offlineDevices.length),
    notStable: makeStat(notStableDevices.length),
    synced: makeStat(syncedDevices.length),
  };

  const syncedConnectors = syncedDevices.flatMap((cp) => cp.connectors);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
        <StatCard
          title={t("appPage.chargePoints.stats.total")}
          value={stats.total}
          icon={<Battery className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          title={t("appPage.chargePoints.stats.connected")}
          value={stats.connected.value}
          icon={<PlugZap className="h-5 w-5 text-status-pending-foreground" />}
          subtitle={stats.connected.percentage}
        />
        <StatCard
          title={t("appPage.chargePoints.stats.offline")}
          value={stats.offline.value}
          icon={<RefreshCw className="h-5 w-5 text-status-offline-foreground" />}
          subtitle={stats.offline.percentage}
        />
        <StatCard
          title={t("appPage.chargePoints.stats.notStable")}
          value={stats.notStable.value}
          icon={<X className="h-5 w-5 text-status-error-foreground" />}
          subtitle={stats.notStable.percentage}
        />
      </div>
      <div className="h-full md:col-span-1 [&>div]:h-full">
        <StatCard
          title={t("appPage.chargePoints.stats.synced")}
          value={stats.synced.value}
          icon={<Cloud className="h-6 w-6 text-status-available-foreground" />}
        >
          <div className="flex flex-col content-stretch gap-2 text-sm mt-2">
            {(
              [
                "Available",
                "Preparing",
                "Charging",
                "Finishing",
                "Reserved",
                "Unavailable",
                "Occupied",
              ] as ConnectorStatus[]
            ).map((status) => {
              const countForStatus = syncedConnectors.filter(
                (connector) => connector.status === status,
              ).length;

              return (
                <div key={status.toLowerCase()} className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <p className="text-md italic">{status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="ml-auto text-sm font-bold text-foreground">{countForStatus}</p>
                    <p className="text-sm text-muted-foreground">
                      ({makePercentage(countForStatus)})
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </StatCard>
      </div>
    </div>
  );
};

const getStatusIcon = (status: ConnectorStatus): ReactNode => {
  const className = classNames("h-5 w-5", toneTextClass[connectorStatusTone(status)]);

  switch (status) {
    case "Available":
      return <CheckCircle className={className} />;
    case "Preparing":
    case "Finishing":
      return <RefreshCw className={className} />;
    case "Charging":
    case "Occupied":
      return <Battery className={className} />;
    case "SuspendedEV":
    case "SuspendedEVSE":
    case "Reserved":
    case "Unavailable":
      return <Cloud className={className} />;
    case "Faulted":
      return <X className={className} />;
    default:
      return null;
  }
};
