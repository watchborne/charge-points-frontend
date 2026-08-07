import { Site } from "@watchborne/charge-points-types";
import { Button } from "@watchborne/electrons";
import classNames from "classnames";
import { Battery, Calendar, MapPin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toneBadgeClass } from "@/lib/status";
import { ChargePointWithConnectors } from "@/types/charge-point";

type SiteCardProps = {
  site: Site;
  chargePoints: ChargePointWithConnectors[];
  onEditClicked: (site: Site) => void;
  onDeleteClicked: (site: Site) => void;
};

export const SiteCard = ({ site, chargePoints, onEditClicked, onDeleteClicked }: SiteCardProps) => {
  const t = useTranslations("");

  const onlineCount = chargePoints.filter(({ connection }) =>
    ["SYNCED", "CONNECTED"].includes(connection.status),
  ).length;
  const offlineCount = chargePoints.length - onlineCount;

  return (
    <div className="flex flex-col rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="flex min-w-0 items-start gap-2">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{site.name}</p>
            <p className="truncate text-sm text-muted-foreground">{site.customer}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t("appPage.sites.page.table.columns.actions")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditClicked(site)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDeleteClicked(site)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            {new Date(site.installedAt).toLocaleDateString("fr-FR")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {t("appPage.sites.page.table.columns.lastVisit")}:{" "}
            {site.lastVisitedAt ? new Date(site.lastVisitedAt).toLocaleDateString("fr-FR") : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};
