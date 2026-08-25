import { Site } from "@watchborne/charge-points-types";
import { Button } from "@watchborne/electrons";
import classNames from "classnames";
import { formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import { Calendar, ChevronDown, ExternalLink, MapPin, Pencil, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { connectionStatusTone, toneDotClass } from "@/lib/status";
import { ChargePointWithConnectors } from "@/types/charge-point";
import { ConnectorStatusIcon } from "../../components/common/ConnectorStatusIcon";

type SiteDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: Site | null;
  chargePoints: ChargePointWithConnectors[];
  onEditClicked: (site: Site) => void;
  onDeleteClicked: (site: Site) => void;
};

export const SiteDetailModal = ({
  open,
  onOpenChange,
  site,
  chargePoints,
  onEditClicked,
  onDeleteClicked,
}: SiteDetailModalProps) => {
  const t = useTranslations("");
  const format = useFormatter();
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!site) return null;

  const siteChargePoints = chargePoints.filter((cp) => cp.siteId === site.id);

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

  const handleEdit = () => {
    onEditClicked(site);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDeleteClicked(site);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 shrink-0 mt-1 text-primary" />
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate">{site.name}</DialogTitle>
              <DialogDescription className="truncate mt-1">{site.customer}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Site Details */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="text-sm font-semibold text-foreground">
              {t("appPage.sites.detail.information")}
            </h4>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("appPage.sites.page.table.columns.installDate")}
                </span>
                <span className="font-medium">
                  {format.dateTime(new Date(site.installedAt), {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </span>
              </div>

              {site.lastVisitedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("appPage.sites.page.table.columns.lastVisit")}
                  </span>
                  <span className="font-medium">
                    {format.dateTime(new Date(site.lastVisitedAt), {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("appPage.sites.page.card.chargePointsWithCount", {
                    count: siteChargePoints.length,
                  })}
                </span>
                <span className="font-medium">{siteChargePoints.length}</span>
              </div>
            </div>
          </div>

          {/* Charge Points List */}
          {siteChargePoints.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-semibold text-foreground">
                {t("appPage.dashboard.chargePoints")}
              </h4>

              <div className="space-y-2">
                {siteChargePoints.map((chargePoint) => {
                  const tone = connectionStatusTone(chargePoint.connection.status);
                  const isExpanded = expandedIds.has(chargePoint.id);
                  const isOnline = ["SYNCED", "CONNECTED"].includes(
                    chargePoint.connection.status,
                  );
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
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleExpanded(chargePoint.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleExpanded(chargePoint.id);
                          }
                        }}
                        aria-expanded={isExpanded}
                        className="flex w-full flex-wrap cursor-pointer items-center justify-between gap-2 p-4 text-left transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1 truncate font-medium">
                          {chargePoint.name}
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={classNames(
                                "h-2.5 w-2.5 rounded-full",
                                toneDotClass[tone],
                              )}
                            />
                            <span className="text-sm capitalize">
                              {chargePoint.connection.status.toLowerCase()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenChange(false);
                              router.push(`/app/charge-points?id=${chargePoint.id}`);
                            }}
                            aria-label={t("appPage.dashboard.viewChargePoint")}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <ChevronDown
                            className={classNames(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="space-y-3 border-t bg-muted/20 p-4">
                          {vendorModel && (
                            <div className="flex flex-wrap items-center justify-between gap-1 text-sm">
                              <span className="text-muted-foreground">
                                {t("appPage.chargePoints.card.model")}
                              </span>
                              <span className="font-medium">{vendorModel}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-1 text-sm">
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
                                  className="flex flex-wrap items-center justify-between gap-1 px-3 py-2 text-sm"
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
          )}

          {siteChargePoints.length === 0 && (
            <div className="border-t pt-4 text-center text-sm text-muted-foreground">
              {t("appPage.sites.detail.noChargePoints")}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            {t("common.edit")}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
