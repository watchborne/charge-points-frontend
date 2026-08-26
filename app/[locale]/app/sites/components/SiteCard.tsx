import { Site } from "@watchborne/charge-points-types";
import classNames from "classnames";
import { Battery, Calendar, MapPin } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { toneBadgeClass } from "@/lib/status";
import { ChargePointWithConnectors } from "@/types/charge-point";

type SiteCardProps = {
  site: Site;
  chargePoints: ChargePointWithConnectors[];
  onSiteClicked: (site: Site) => void;
};

export const SiteCard = ({ site, chargePoints, onSiteClicked }: SiteCardProps) => {
  const t = useTranslations("");
  const format = useFormatter();

  const onlineCount = chargePoints.filter(({ connection }) =>
    ["SYNCED", "CONNECTED"].includes(connection.status),
  ).length;
  const offlineCount = chargePoints.length - onlineCount;

  return (
    <button
      type="button"
      onClick={() => onSiteClicked(site)}
      className="flex flex-col rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md text-left cursor-pointer"
    >
      <div className="flex items-start justify-start gap-2 border-b p-4">
        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{site.name}</p>
          <p className="truncate text-sm text-muted-foreground">{site.customer}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Battery className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {t("appPage.sites.page.card.chargePointsWithCount", { count: chargePoints.length })}
          </span>
        </div>

        {chargePoints.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {onlineCount > 0 && (
              <span
                className={classNames(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  toneBadgeClass.available,
                )}
              >
                {t("appPage.sites.page.card.online", { count: onlineCount })}
              </span>
            )}
            {offlineCount > 0 && (
              <span
                className={classNames(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  toneBadgeClass.offline,
                )}
              >
                {t("appPage.sites.page.card.offline", { count: offlineCount })}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {t("appPage.sites.page.table.columns.installDate")}:{" "}
            {format.dateTime(new Date(site.installedAt), {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {t("appPage.sites.page.table.columns.lastVisit")}:{" "}
            {site.lastVisitedAt
              ? format.dateTime(new Date(site.lastVisitedAt), {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
              : "—"}
          </span>
        </div>
      </div>
    </button>
  );
};
