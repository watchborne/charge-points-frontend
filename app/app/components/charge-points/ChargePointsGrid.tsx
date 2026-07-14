import classNames from "classnames";
import { useTranslations } from "next-intl";

import { ChargePointWithConnectors } from "@/types/charge-point";

import { ChargePointCard } from "./ChargePointCard";
import { useSites } from "../../hooks/useSites";
import { Tag } from "../common/Tag";

export const ChargePointsGrid = ({
  chargePoints,
}: {
  chargePoints: ChargePointWithConnectors[];
}) => {
  const t = useTranslations("");
  const { sites } = useSites();
  const sitesById = new Map(sites.map((site) => [site.id, site]));

  const chargePointsBySite = chargePoints.reduce(
    (acc, chargePoint) => {
      const siteId = chargePoint.siteId;
      if (!acc[siteId]) {
        acc[siteId] = [];
      }
      acc[siteId].push(chargePoint);
      acc[siteId].sort((a, b) => a.name.localeCompare(b.name));
      return acc;
    },
    {} as Record<string, ChargePointWithConnectors[]>,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(chargePointsBySite).map(([siteId, chargePoints]) => (
        <div
          key={siteId}
          className={classNames(
            "rounded-lg border p-4 flex flex-col gap-2",
            siteId.toLowerCase() === "unknown" ? "bg-status-warning-soft" : "bg-muted",
          )}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{t("appPage.chargePoints.card.site")}</h3>
            <Tag>{sitesById.get(siteId)?.name ?? t("appPage.chargePoints.detail.unknownSite")}</Tag>
          </div>
          {chargePoints.map((chargePoint) => (
            <ChargePointCard key={chargePoint.id} chargePoint={chargePoint} />
          ))}
        </div>
      ))}
    </div>
  );
};
