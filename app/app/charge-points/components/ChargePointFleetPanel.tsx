import { AvailabilityType, ResetType, Site } from "@watchborne/charge-points-types";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChangeAvailabilityOutcome,
  ResetChargePointOutcome,
  UnlockConnectorOutcome,
} from "@/lib/api-charge-points";
import { connectionStatusTone, toneDotClass } from "@/lib/status";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { ChargePointDetailPanel } from "./ChargePointDetailPanel";
import { Tag } from "../../components/common/Tag";
import { useFlipReorder } from "../../hooks/useFlipReorder";

type GroupBy = "site" | "vendor";

interface ChargePointGroup {
  key: string;
  label: string;
  chargePoints: ChargePointWithConnectors[];
}

interface ChargePointFleetPanelProps {
  sites: Site[];
  chargePoints: ChargePointWithConnectors[];
  selected: ChargePointWithConnectors | null;
  onSelect: (chargePoint: ChargePointWithConnectors | null) => void;
  onToggleActive: (chargePoint: ChargePointWithConnectors) => void;
  onEditClicked: (chargePoint: ChargePointWithConnectors) => void;
  onDeleteClicked: (chargePoint: ChargePointWithConnectors) => void;
  onResetClicked: (
    cp: ChargePointWithConnectors,
    type: ResetType,
  ) => Promise<ResetChargePointOutcome>;
  onChangeAvailability: (
    cp: ChargePointWithConnectors,
    connectorId: number,
    type: AvailabilityType,
  ) => Promise<ChangeAvailabilityOutcome>;
  onUnlockConnector: (
    cp: ChargePointWithConnectors,
    connectorId: number,
  ) => Promise<UnlockConnectorOutcome>;
}

export const ChargePointFleetPanel = ({
  sites,
  chargePoints,
  selected,
  onSelect,
  onToggleActive,
  onEditClicked,
  onDeleteClicked,
  onResetClicked,
  onChangeAvailability,
  onUnlockConnector,
}: ChargePointFleetPanelProps) => {
  const t = useTranslations("");
  const [groupBy, setGroupBy] = useState<GroupBy>("site");
  const { registerFlipItem } = useFlipReorder();

  const siteName = (siteId: string) => sites.find((site) => site.id === siteId)?.name;

  const groups: ChargePointGroup[] =
    groupBy === "site"
      ? [
          ...sites.map((site) => ({
            key: `site:${site.id}`,
            label: site.name,
            chargePoints: chargePoints.filter((cp) => cp.siteId === site.id),
          })),
          {
            key: "site:unknown",
            label: t("appPage.chargePoints.detail.unknownSite"),
            chargePoints: chargePoints.filter((cp) => !sites.some((site) => site.id === cp.siteId)),
          },
        ].filter((group) => group.chargePoints.length > 0)
      : [...new Set(chargePoints.map((cp) => cp.meta?.vendor || ""))]
          .sort((a, b) => {
            if (!a) return 1;
            if (!b) return -1;
            return a.localeCompare(b);
          })
          .map((vendor) => ({
            key: `vendor:${vendor}`,
            label: vendor || t("appPage.chargePoints.page.groupBy.unknownVendor"),
            chargePoints: chargePoints.filter((cp) => (cp.meta?.vendor || "") === vendor),
          }));

  return (
    <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <h3 className="text-lg font-semibold">{t("appPage.dashboard.fleetOverview")}</h3>
        <p className="text mt-1">
          {[
            t("misc.chargePointWithCount", {
              count: chargePoints.length,
            }),
            t("misc.siteWithCount", { count: sites.length }),
          ].join(" / ")}
        </p>

        <Tabs value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
          <TabsList aria-label={t("appPage.chargePoints.page.groupBy.label")}>
            <TabsTrigger value="site">{t("appPage.chargePoints.page.groupBy.site")}</TabsTrigger>
            <TabsTrigger value="vendor">
              {t("appPage.chargePoints.page.groupBy.vendor")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid md:grid-cols-3">
        <div className="border-b bg-muted/30 p-4 sm:p-6 md:max-h-[70vh] md:overflow-y-auto md:border-b-0 md:border-r">
          {groups.length === 0 ? (
            <div className="rounded-lg border py-16 text-center text-sm text-muted-foreground">
              {t("appPage.chargePoints.page.empty.noChargePointFound")}
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.key}>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span className="truncate">{group.label}</span>
                    <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-xs">
                      {group.chargePoints.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {group.chargePoints.map((chargePoint) => {
                      const tone = connectionStatusTone(chargePoint.connection.status);
                      const vendorModel = [chargePoint.meta?.vendor, chargePoint.meta?.model]
                        .filter(Boolean)
                        .join(" ");
                      const isSelected = selected?.id === chargePoint.id;

                      return (
                        <button
                          key={chargePoint.id}
                          ref={registerFlipItem(chargePoint.id)}
                          type="button"
                          onClick={() => onSelect(isSelected ? null : chargePoint)}
                          className={classNames(
                            "block w-full rounded-lg border p-3 text-left transition-shadow hover:shadow-md",
                            isSelected
                              ? "border-charge ring-1 ring-charge bg-charge-soft/40"
                              : "bg-background",
                            !chargePoint.isActive && !isSelected && "opacity-60",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate font-medium">{chargePoint.name}</div>
                              {vendorModel && (
                                <div className="truncate text-xs text-muted-foreground">
                                  {vendorModel}
                                </div>
                              )}
                            </div>
                            <span
                              className={classNames(
                                "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                                toneDotClass[tone],
                              )}
                            />
                          </div>

                          <div className="mt-2">
                            <Tag>
                              {siteName(chargePoint.siteId) ??
                                t("appPage.chargePoints.detail.unknownSite")}
                            </Tag>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 md:col-span-2">
          {selected ? (
            <ChargePointDetailPanel
              chargePoint={selected}
              site={sites.find((site) => site.id === selected.siteId)}
              onToggleActive={onToggleActive}
              onEditClicked={onEditClicked}
              onDeleteClicked={onDeleteClicked}
              onResetClicked={onResetClicked}
              onChangeAvailability={onChangeAvailability}
              onUnlockConnector={onUnlockConnector}
            />
          ) : (
            <div className="flex h-full min-h-48 items-center justify-center text-sm text-muted-foreground">
              {t("appPage.chargePoints.page.detail.selectPrompt")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
