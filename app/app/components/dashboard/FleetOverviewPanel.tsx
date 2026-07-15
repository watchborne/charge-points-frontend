import { Site } from "@watchborne/charge-points-types";
import classNames from "classnames";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { connectionStatusTone, toneDotClass } from "@/lib/status";
import { ChargePointWithConnectors } from "@/types/charge-point";

interface FleetOverviewPanelProps {
  chargePoints: ChargePointWithConnectors[];
  sites: Site[];
}

export const FleetOverviewPanel = ({ chargePoints, sites }: FleetOverviewPanelProps) => {
  const t = useTranslations("");

  const chargePointsForSite = (siteId: string) =>
    chargePoints.filter((chargePoint) => chargePoint.siteId === siteId);

  const onlineCount = (siteId: string) =>
    chargePointsForSite(siteId).filter(({ connection }) =>
      ["SYNCED", "CONNECTED"].includes(connection.status),
    ).length;

  const offlineCount = (siteId: string) =>
    chargePointsForSite(siteId).filter(({ connection }) => connection.status === "OFFLINE").length;

  return (
    <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
      <div className="grid md:grid-cols-3">
        <div className="border-r bg-muted/30 p-6">
          <div className="text-sm font-medium text-muted-foreground">
            {t("appPage.dashboard.sites")}
          </div>

          <div className="mt-6 space-y-4">
            {sites.map((site) => {
              const online = onlineCount(site.id);
              const offline = offlineCount(site.id);

              return (
                <Link
                  key={site.id}
                  href="/app/charge-points"
                  className="block rounded-lg border bg-background p-4 hover:shadow-md transition-shadow"
                >
                  <div className="font-medium">{site.name}</div>

                  {online > 0 && (
                    <div className="mt-2 text-sm text-status-available-foreground">
                      {online} {t("appPage.dashboard.online")}
                    </div>
                  )}

                  {offline > 0 && (
                    <div className="mt-1 text-sm text-status-offline-foreground">
                      {offline} {t("appPage.dashboard.offline")}
                    </div>
                  )}

                  {online === 0 && offline === 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {t("appPage.dashboard.noChargePoints")}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t("appPage.dashboard.fleetOverview")}</h3>

            <Badge>{t("appPage.dashboard.live")}</Badge>
          </div>

          <div className="space-y-4">
            {chargePoints.map((chargePoint) => {
              const tone = connectionStatusTone(chargePoint.connection.status);

              return (
                <Link
                  key={chargePoint.id}
                  href={`/app/charge-points?id=${chargePoint.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 hover:shadow-md transition-shadow"
                >
                  <div className="font-medium">{chargePoint.name}</div>

                  <div className="flex items-center gap-2">
                    <div className={classNames("h-2.5 w-2.5 rounded-full", toneDotClass[tone])} />
                    <span className="text-sm capitalize">
                      {chargePoint.connection.status.toLowerCase()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
