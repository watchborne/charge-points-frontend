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
import { ReactNode } from "react";

import { ChargePoint } from "@/types/charge-point";

import { StatusBadge } from "./StatusBadge";

interface ChargePointCardProps {
  chargePoint: ChargePoint;
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
        "block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer",
        !chargePoint.isActive && "opacity-50 grayscale",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Battery className="h-5 w-5 text-gray-600" />
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
                <p className="text-gray-500 font-medium">
                  {`${chargePoint.meta.vendor} ${chargePoint.meta.model}`}
                </p>
              ),
            },
            {
              label: "Firmware",
              data: chargePoint.meta.firmwareVersion && (
                <p className="text-gray-500 font-medium">{chargePoint.meta.firmwareVersion}</p>
              ),
            },
            {
              label: "Status",
              data: chargePoint.status && (
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 font-medium">{chargePoint.status}</p>
                  {getChargePointStatusIcon(chargePoint.status)}
                </div>
              ),
            },
          ].map(({ label, data }) => (
            <ChargePointDetail key={`cp-details-${label}`} label={label} detail={data} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-500 pt-3 border-t">
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
      <label className="text-gray-900 font-medium" htmlFor={label}>
        {label}:{" "}
      </label>
      {detail}
    </div>
  );
};

const getChargePointStatusIcon = (status: ChargePoint["status"]) => {
  switch (status) {
    case "Available":
      return <CheckCircle size="18px" className="text-green-800" />;
    case "Preparing":
      return <CircleEllipsis size="18px" className="text-yellow-800" />;
    case "Charging":
      return <PlugZap size="18px" className="text-blue-800" />;
    case "SuspendedEV":
      return <Pause size="18px" className="text-yellow-800" />;
    case "SuspendedEVSE":
      return <Pause size="18px" className="text-yellow-800" />;
    case "Finishing":
      return <Loader size="18px" className="text-blue-600" />;
    case "Reserved":
      return <Ticket size="18px" className="text-pink-800" />;
    case "Unavailable":
      return <X size="18px" className="text-red-800" />;
    case "Faulted":
      return <Shield size="18px" className="text-red-800" />;
  }
};
