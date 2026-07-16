import { Site } from "@watchborne/charge-points-types";
import classNames from "classnames";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { connectionStatusTone, toneDotClass } from "@/lib/status";
import { ChargePointWithConnectors } from "@/types/charge-point";

/** Sentinel id for charge points whose site is not in the sites list. */
export const UNGROUPED_SITE_ID = "__ungrouped__";

interface ChargePointFleetPanelProps {
  sites: Site[];
  chargePoints: ChargePointWithConnectors[];
  highlightedId?: string;
  selectedSiteId: string | null;
  onSelectSite: (siteId: string | null) => void;
  onRowClicked: (chargePoint: ChargePointWithConnectors) => void;
  onToggleActive: (chargePoint: ChargePointWithConnectors) => void;
  onAddForSite: (siteId: string) => void;
}

const isOnline = (chargePoint: ChargePointWithConnectors) =>
  ["SYNCED", "CONNECTED"].includes(chargePoint.connection.status);

export const ChargePointFleetPanel = ({
  sites,
  chargePoints,
  highlightedId,
  selectedSiteId,
  onSelectSite,
  onRowClicked,
  onToggleActive,
  onAddForSite,
}: ChargePointFleetPanelProps) => {
  const t = useTranslations("");

  const chargePointsForSite = (siteId: string) =>
    siteId === UNGROUPED_SITE_ID
      ? chargePoints.filter((chargePoint) => !sites.some((site) => site.id === chargePoint.siteId))
      : chargePoints.filter((chargePoint) => chargePoint.siteId === siteId);

  const ungrouped = chargePointsForSite(UNGROUPED_SITE_ID);

  const sidebarEntries = [
    ...sites.map((site) => ({ id: site.id, name: site.name })),
    ...(ungrouped.length > 0
      ? [{ id: UNGROUPED_SITE_ID, name: t("appPage.chargePoints.detail.unknownSite") }]
      : []),
  ];

  const displayedChargePoints = selectedSiteId ? chargePointsForSite(selectedSiteId) : chargePoints;

  const selectedSiteName =
    selectedSiteId === UNGROUPED_SITE_ID
      ? t("appPage.chargePoints.detail.unknownSite")
      : sites.find((site) => site.id === selectedSiteId)?.name;

  const panelTitle = selectedSiteName
    ? t("appPage.dashboard.fleetOverviewForSite", { site: selectedSiteName })
    : t("appPage.dashboard.fleetOverview");

  const canAddForSelectedSite = !!selectedSiteId && selectedSiteId !== UNGROUPED_SITE_ID;

  return (
    <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
      <div className="grid md:grid-cols-3">
        <div className="border-b bg-muted/30 p-4 sm:p-6 md:border-b-0 md:border-r">
          <div className="text-sm font-medium text-muted-foreground">
            {t("appPage.dashboard.sites")}
          </div>

          <div className="mt-6 space-y-4">
            {sidebarEntries.map((entry) => {
              const entryChargePoints = chargePointsForSite(entry.id);
              const online = entryChargePoints.filter(isOnline).length;
              const offline = entryChargePoints.filter(
                ({ connection }) => connection.status === "OFFLINE",
              ).length;
              const isSelected = selectedSiteId === entry.id;

              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelectSite(isSelected ? null : entry.id)}
                  className={classNames(
                    "block w-full rounded-lg border p-4 text-left transition-shadow hover:shadow-md",
                    isSelected
                      ? "border-charge ring-1 ring-charge bg-charge-soft/40"
                      : "bg-background",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{entry.name}</span>
                    <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-xs">
                      {entryChargePoints.length}
                    </Badge>
                  </div>

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

        <div className="p-4 sm:p-6 md:col-span-2">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">{panelTitle}</h3>

            {canAddForSelectedSite && (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => onAddForSite(selectedSiteId as string)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("appPage.chargePoints.page.buttons.addForThisSite")}
              </Button>
            )}
          </div>

          {displayedChargePoints.length === 0 ? (
            <div className="rounded-lg border py-16 text-center text-muted-foreground">
              {t("appPage.chargePoints.page.empty.noChargePointFound")}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedChargePoints.map((chargePoint) => {
                const tone = connectionStatusTone(chargePoint.connection.status);
                const vendorModel = [chargePoint.meta?.vendor, chargePoint.meta?.model]
                  .filter(Boolean)
                  .join(" ");
                const isHighlighted = chargePoint.id === highlightedId;

                return (
                  <div
                    key={chargePoint.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onRowClicked(chargePoint)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onRowClicked(chargePoint);
                      }
                    }}
                    className={classNames(
                      "flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40",
                      isHighlighted
                        ? "border-charge bg-charge-soft/40 ring-1 ring-inset ring-charge/30"
                        : !chargePoint.isActive && "opacity-60",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{chargePoint.name}</div>
                      {vendorModel && (
                        <div className="truncate text-sm text-muted-foreground">{vendorModel}</div>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={classNames("h-2.5 w-2.5 rounded-full", toneDotClass[tone])}
                        />
                        <span className="text-sm capitalize">
                          {chargePoint.connection.status.toLowerCase()}
                        </span>
                      </div>

                      <div onClick={(event) => event.stopPropagation()}>
                        <Switch
                          checked={chargePoint.isActive}
                          onCheckedChange={() => onToggleActive(chargePoint)}
                          aria-label={`Toggle ${chargePoint.name} active state`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
