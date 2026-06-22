import classNames from "classnames";

import { ChargePoint } from "@/types/charge-point";
import { ChargePointCard } from "./ChargePointCard";
import { Tag } from "../common/Tag";

import { useSites } from "../../hooks/useSites";

export const ChargePointsGrid = ({ chargePoints }: { chargePoints: ChargePoint[] }) => {
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
    {} as Record<string, ChargePoint[]>,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(chargePointsBySite).map(([siteId, chargePoints]) => (
        <div
          key={siteId}
          className={classNames(
            "rounded-lg p-4 flex flex-col gap-2",
            siteId.toLowerCase() === "unknown" ? "bg-orange-300" : "bg-gray-300",
          )}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Site:</h3>
            <Tag>{sitesById.get(siteId)?.name ?? "Unknown site"}</Tag>
          </div>
          {chargePoints.map((chargePoint) => (
            <ChargePointCard key={chargePoint.uuid} chargePoint={chargePoint} />
          ))}
        </div>
      ))}
    </div>
  );
};
