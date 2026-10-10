import classNames from "classnames";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useDateFormat } from "@/lib/date-format";
import { connectionStatusColor, colorDotClass } from "@/lib/status";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { ConnectorStatusIcon } from "../../components/common/ConnectorStatusIcon";

type SiteChargePointsListProps = {
  chargePoints: ChargePointWithConnectors[];
  onViewChargePoint: (chargePointId: ChargePointWithConnectors["id"]) => void;
};

/**
 * The charge points of one site as an expandable list (status, model, uptime,
 * connectors), with a jump to each one's detail page. Owns which rows are
 * expanded; navigation is the caller's.
 */
export const SiteChargePointsList = ({
  chargePoints,
  onViewChargePoint,
}: SiteChargePointsListProps) => {
  const t = useTranslations("");
  const { formatRelative } = useDateFormat();
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

  return (
    <>
      {chargePoints.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            {t("appPage.dashboard.chargePoints.sectionTitle")}
          </h2>

          <div className="space-y-2">
            {chargePoints.map((chargePoint) => {
              const color = connectionStatusColor(chargePoint.connection.status);
              const isExpanded = expandedIds.has(chargePoint.id);
              const isOnline = ["SYNCED", "CONNECTED"].includes(chargePoint.connection.status);
              const lastSeenText = chargePoint.connection.lastSeenAt
                ? formatRelative(chargePoint.connection.lastSeenAt)
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
                    <div className="min-w-0 flex-1 truncate font-medium">{chargePoint.name}</div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={classNames("h-2.5 w-2.5 rounded-full", colorDotClass[color])}
                        />
                        <span className="text-sm capitalize">
                          {chargePoint.connection.status.toLowerCase()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewChargePoint(chargePoint.id);
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

      {chargePoints.length === 0 && (
        <div className="border-t pt-4 text-center text-sm text-muted-foreground">
          {t("appPage.sites.detail.noChargePoints")}
        </div>
      )}
    </>
  );
};
