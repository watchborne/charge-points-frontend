import { ChargePoint } from "@/types/charge-point";
import { ChargePointCard } from "./ChargePointCard";
import { Tag } from "../common/Tag";

export const ChargePointsGrid = ({
  chargePoints,
}: {
  chargePoints: ChargePoint[];
}) => {
  const chargePointsBySite = chargePoints.reduce(
    (acc, chargePoint) => {
      const siteId = chargePoint.siteId;
      if (!acc[siteId]) {
        acc[siteId] = [];
      }
      acc[siteId].push(chargePoint);
      acc[siteId].sort((a, b) => a.id.localeCompare(b.id));
      return acc;
    },
    {} as Record<string, ChargePoint[]>,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(chargePointsBySite).map(([siteId, chargePoints]) => (
        <div
          key={siteId}
          className="bg-gray-100 rounded-lg p-4 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Site:</h3>
            <Tag>{siteId}</Tag>
          </div>
          {chargePoints.map((chargePoint) => (
            <ChargePointCard key={chargePoint.id} chargePoint={chargePoint} />
          ))}
        </div>
      ))}
    </div>
  );
};
