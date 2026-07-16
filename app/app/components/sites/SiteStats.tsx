import { Site } from "@watchborne/charge-points-types";
import { Battery, MapPin, PlugZap, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { ChargePointWithConnectors } from "@/types/charge-point";

import { StatCard } from "../common/StatCard";

export const SiteStats = ({
  sites,
  chargePoints,
}: {
  sites: Site[];
  chargePoints: ChargePointWithConnectors[];
}) => {
  const t = useTranslations("");
  const onlineDevices = chargePoints.filter(({ connection }) =>
    ["SYNCED", "CONNECTED"].includes(connection.status),
  );
  const offlineDevices = chargePoints.filter(({ connection }) => connection.status === "OFFLINE");

  const makePercentage = (count: number) =>
    chargePoints.length > 0 ? `${Math.round((count / chargePoints.length) * 100)}%` : "0%";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      <StatCard
        title={t("appPage.sites.page.stats.totalSites")}
        value={sites.length}
        icon={<MapPin className="h-5 w-5 text-muted-foreground" />}
      />
      <StatCard
        title={t("appPage.sites.page.stats.totalChargePoints")}
        value={chargePoints.length}
        icon={<Battery className="h-5 w-5 text-muted-foreground" />}
      />
      <StatCard
        title={t("appPage.sites.page.stats.online")}
        value={onlineDevices.length}
        icon={<PlugZap className="h-5 w-5 text-status-available-foreground" />}
        subtitle={makePercentage(onlineDevices.length)}
      />
      <StatCard
        title={t("appPage.sites.page.stats.offline")}
        value={offlineDevices.length}
        icon={<RefreshCw className="h-5 w-5 text-status-offline-foreground" />}
        subtitle={makePercentage(offlineDevices.length)}
      />
    </div>
  );
};
