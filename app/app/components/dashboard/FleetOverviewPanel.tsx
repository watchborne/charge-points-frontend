import { Site } from "@watchborne/charge-points-types";
import classNames from "classnames";
import { formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { WS_URL } from "@/lib/constants";
import { connectionStatusTone, toneDotClass } from "@/lib/status";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { useWebSocket } from "../../hooks/useWebSocket";
import { ConnectorStatusIcon } from "../common/ConnectorStatusIcon";
import { WsStatusBadge } from "../common/WsStatusBadge";

interface FleetOverviewPanelProps {
  chargePoints: ChargePointWithConnectors[];
  sites: Site[];
}

export const FleetOverviewPanel = ({ chargePoints, sites }: FleetOverviewPanelProps) => {
  const t = useTranslations("");
  const { status } = useWebSocket(WS_URL);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const chargePointsForSite = (siteId: string) =>
    chargePoints.filter((chargePoint) => chargePoint.siteId === siteId);

  const onlineCount = (siteId: string) =>
    chargePointsForSite(siteId).filter(({ connection }) =>
      ["SYNCED", "CONNECTED"].includes(connection.status),
    ).length;

  const offlineCount = (siteId: string) =>
    chargePointsForSite(siteId).filter(({ connection }) => connection.status === "OFFLINE").length;

  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? null;
  const displayedChargePoints = selectedSite ? chargePointsForSite(selectedSite.id) : chargePoints;

  const panelTitle = selectedSite
    ? t("appPage.dashboard.fleetOverviewForSite", { site: selectedSite.name })
    : t("appPage.dashboard.fleetOverview");

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
              const isSelected = selectedSiteId === site.id;

              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => setSelectedSiteId(isSelected ? null : site.id)}
                  className={classNames(
                    "block w-full rounded-lg border p-4 text-left transition-shadow hover:shadow-md",
                    isSelected
                      ? "border-charge ring-1 ring-charge bg-charge-soft/40"
                      : "bg-background",
                  )}
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
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2 p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">{panelTitle}</h3>

            <WsStatusBadge status={status} />
          </div>

          <div className="space-y-4">
            {displayedChargePoints.map((chargePoint) => {
              const tone = connectionStatusTone(chargePoint.connection.status);
              const isExpanded = expandedIds.has(chargePoint.id);
              const isOnline = ["SYNCED", "CONNECTED"].includes(chargePoint.connection.status);
              const lastSeenText = chargePoint.connection.lastSeenAt
                ? formatDistanceToNow(new Date(chargePoint.connection.lastSeenAt), {
                    locale: enGB,
                  })
                : null;
              const vendorModel = [chargePoint.meta?.vendor, chargePoint.meta?.model]
                .filter(Boolean)
                .join(" ");

              return (
                <div key={chargePoint.id} className="rounded-lg border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(chargePoint.id)}
                    aria-expanded={isExpanded}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="font-medium">{chargePoint.name}</div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={classNames("h-2.5 w-2.5 rounded-full", toneDotClass[tone])}
                        />
                        <span className="text-sm capitalize">
                          {chargePoint.connection.status.toLowerCase()}
                        </span>
                      </div>
                      <ChevronDown
                        className={classNames(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 border-t bg-muted/20 p-4">
                      {vendorModel && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {t("appPage.chargePoints.card.model")}
                          </span>
                          <span className="font-medium">{vendorModel}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("appPage.dashboard.uptime")}
                        </span>
                        <span className="font-medium">
                          {lastSeenText
                            ? t(
                                isOnline
                                  ? "appPage.dashboard.uptimeOnline"
                                  : "appPage.dashboard.uptimeOffline",
                                { time: lastSeenText },
                              )
                            : t("appPage.chargePoints.card.neverSeen")}
                        </span>
                      </div>

                      {chargePoint.connectors.length > 0 && (
                        <div className="divide-y rounded-md border">
                          {chargePoint.connectors.map((connector) => (
                            <div
                              key={connector.id}
                              className="flex items-center justify-between px-3 py-2 text-sm"
                            >
                              <span className="text-muted-foreground">
                                {t("appPage.chargePoints.detail.connector", {
                                  connectorId: connector.connectorId,
                                })}
                              </span>
                              <div className="flex items-center gap-1.5 font-medium">
                                <ConnectorStatusIcon status={connector.status} />
                                {connector.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
