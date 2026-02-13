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
          <p className="text-sm text-gray-600">
            <span className="font-medium">Model: </span>
            {chargePoint.meta.chargePointVendor}{" "}
            {chargePoint.meta.chargePointModel}
          </p>
          {chargePoint.meta.firmwareVersion && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Firmware: </span>
              {chargePoint.meta.firmwareVersion}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-500 pt-3 border-t">
        <Clock className="h-4 w-4" />
        <span>{lastSeenText ? `Vu ${lastSeenText}` : "Never seen"}</span>
      </div>
    </div>
  );
}
