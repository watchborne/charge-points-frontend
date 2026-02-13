import { ChargePoint } from "@/types/charge-point";
import { StatusBadge } from "./StatusBadge";
import { Battery, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ChargePointCardProps {
  chargePoint: ChargePoint;
}

export function ChargePointCard({ chargePoint }: ChargePointCardProps) {
  const lastSeenText =
    chargePoint.connection.lastSeen &&
    formatDistanceToNow(new Date(chargePoint.connection.lastSeen), {
      addSuffix: true,
      locale: fr,
    });
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Battery className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-lg">{chargePoint.id}</h3>
        </div>
        <StatusBadge status={chargePoint.connection.status} />
      </div>

      {chargePoint.meta && (
        <div className="space-y-1 mb-3">
          {[
            {
              label: "Model",
              data:
                chargePoint.meta.chargePointVendor &&
                chargePoint.meta.chargePointModel
                  ? `${chargePoint.meta.chargePointVendor} ${chargePoint.meta.chargePointModel}`
                  : undefined,
            },
            { label: "Firmware", data: chargePoint.meta.firmwareVersion },
          ].map(({ label, data }) => (
            <ChargePointDetail
              key={`cp-details-${label}`}
              label={label}
              detail={data}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-500 pt-3 border-t">
        <Clock className="h-4 w-4" />
        <span>{lastSeenText ? `Vu ${lastSeenText}` : "Never seen"}</span>
      </div>
    </div>
  );
}

const ChargePointDetail = ({
  label,
  detail,
}: {
  label: string;
  detail?: string;
}) => {
  if (!detail) return null;

  return (
    <div className="flex items-center gap-1 text-sm">
      <label className="text-gray-900 font-medium" htmlFor={label}>
        {label}:{" "}
      </label>
      <p className="text-gray-500 font-medium">{detail}</p>
    </div>
  );
};
