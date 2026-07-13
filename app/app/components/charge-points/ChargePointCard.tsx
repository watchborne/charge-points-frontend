import classNames from "classnames";
import { formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import { Battery, Clock } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

import { ChargePointWithConnectors } from "@/types/charge-point";

import { StatusBadge } from "./StatusBadge";
import { getConnectorStatusIcon } from "./connector-status-icon";

interface ChargePointCardProps {
  chargePoint: ChargePointWithConnectors;
}

export function ChargePointCard({ chargePoint }: ChargePointCardProps) {
  const lastSeenText =
    chargePoint.connection.lastSeenAt &&
    formatDistanceToNow(new Date(chargePoint.connection.lastSeenAt), {
      addSuffix: true,
      locale: enGB,
    });
  return (
    <Link
      href={`/app/charge-points?id=${chargePoint.id}`}
      className={classNames(
        "block bg-card rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer",
        !chargePoint.isActive && "opacity-50 grayscale",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Battery className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">{chargePoint.name}</h3>
          {!chargePoint.isActive && (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Inactive
            </span>
          )}
        </div>
        <StatusBadge status={chargePoint.connection.status} />
      </div>

      {chargePoint.meta && (
        <div className="space-y-1 mb-3">
          {[
            {
              label: "Model",
              data: chargePoint.meta.vendor && chargePoint.meta.model && (
                <p className="text-muted-foreground font-medium">
                  {`${chargePoint.meta.vendor} ${chargePoint.meta.model}`}
                </p>
              ),
            },
            {
              label: "Firmware",
              data: chargePoint.meta.firmwareVersion && (
                <p className="text-muted-foreground font-medium">
                  {chargePoint.meta.firmwareVersion}
                </p>
              ),
            },
            {
              label: "Connectors",
              data: chargePoint.connectors.length > 0 && (
                <div className="flex flex-col gap-1">
                  {chargePoint.connectors.map((connector) => (
                    <div key={connector.id} className="flex items-center gap-2">
                      <p className="text-muted-foreground font-medium">
                        #{connector.connectorId} {connector.status}
                      </p>
                      {getConnectorStatusIcon(connector.status)}
                    </div>
                  ))}
                </div>
              ),
            },
          ].map(({ label, data }) => (
            <ChargePointDetail key={`cp-details-${label}`} label={label} detail={data} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t">
        <Clock className="h-4 w-4" />
        <span>{lastSeenText ? `Last seen ${lastSeenText}` : "Never seen"}</span>
      </div>
    </Link>
  );
}

const ChargePointDetail = ({ label, detail }: { label: string; detail?: ReactNode }) => {
  if (!detail) return null;

  return (
    <div className="flex items-center gap-1 text-sm">
      <label className="text-foreground font-medium" htmlFor={label}>
        {label}:{" "}
      </label>
      {detail}
    </div>
  );
};
