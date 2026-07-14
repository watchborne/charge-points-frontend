import classNames from "classnames";
import { formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import {
  Battery,
  CheckCircle,
  CircleEllipsis,
  Clock,
  Loader,
  Pause,
  PlugZap,
  Shield,
  Ticket,
  X,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

import { connectorStatusTone, toneTextClass } from "@/lib/status";
import { ChargePointWithConnectors, ConnectorStatus } from "@/types/charge-point";

import { StatusBadge } from "./StatusBadge";

interface ChargePointCardProps {
  chargePoint: ChargePointWithConnectors;
}

export function ChargePointCard({ chargePoint }: ChargePointCardProps) {
  const t = useTranslations("");
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
              {t("appPage.chargePoints.detail.inactive")}
            </span>
          )}
        </div>
        <StatusBadge status={chargePoint.connection.status} />
      </div>

      {chargePoint.meta && (
        <div className="space-y-1 mb-3">
          {[
            {
              label: t("appPage.chargePoints.card.model"),
              data: chargePoint.meta.vendor && chargePoint.meta.model && (
                <p className="text-muted-foreground font-medium">
                  {`${chargePoint.meta.vendor} ${chargePoint.meta.model}`}
                </p>
              ),
            },
            {
              label: t("appPage.chargePoints.card.firmware"),
              data: chargePoint.meta.firmwareVersion && (
                <p className="text-muted-foreground font-medium">
                  {chargePoint.meta.firmwareVersion}
                </p>
              ),
            },
            {
              label: t("appPage.chargePoints.card.connectors"),
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
        <span>
          {lastSeenText
            ? `${t("appPage.chargePoints.card.lastSeen")} ${lastSeenText}`
            : t("appPage.chargePoints.card.neverSeen")}
        </span>
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

const getConnectorStatusIcon = (status: ConnectorStatus) => {
  const className = classNames("shrink-0", toneTextClass[connectorStatusTone(status)]);

  switch (status) {
    case "Available":
      return <CheckCircle size="18px" className={className} />;
    case "Preparing":
      return <CircleEllipsis size="18px" className={className} />;
    case "Charging":
      return <PlugZap size="18px" className={className} />;
    case "SuspendedEV":
    case "SuspendedEVSE":
      return <Pause size="18px" className={className} />;
    case "Occupied":
      return <PlugZap size="18px" className={className} />;
    case "Finishing":
      return <Loader size="18px" className={className} />;
    case "Reserved":
      return <Ticket size="18px" className={className} />;
    case "Unavailable":
      return <X size="18px" className={className} />;
    case "Faulted":
      return <Shield size="18px" className={className} />;
  }
};
