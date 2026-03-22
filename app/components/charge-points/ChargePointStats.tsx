import { ReactNode } from "react";
import { Battery, CheckCircle, Cloud, RefreshCw, X } from "lucide-react";

import { ChargePoint, ChargePointStatus } from "@/types/charge-point";
import { StatCard } from "../common/StatCard";

export const ChargePointStats = ({
  chargePoints,
}: {
  chargePoints: ChargePoint[];
}) => {
  const stats = {
    total: chargePoints.length,
    available: chargePoints.filter(
      (cp) => cp.status === "Available" && cp.connection.status === "SYNCED",
    ).length,
    offline: chargePoints.filter((cp) => cp.connection.status === "OFFLINE")
      .length,
    notStable: chargePoints.filter(
      (cp) => cp.connection.status === "WARNING" || cp.status === "Faulted",
    ).length,
    synced: chargePoints.filter((cp) => cp.connection.status === "SYNCED")
      .length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<Battery className="h-5 w-5 text-gray-600" />}
        />
        <StatCard
          title="Available"
          value={stats.available}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          title="Offline"
          value={stats.offline}
          icon={<RefreshCw className="h-5 w-5 text-green-600" />}
          subtitle={`${stats.total > 0 ? Math.round((stats.offline / stats.total) * 100) : 0}%`}
        />
        <StatCard
          title="Not stable"
          value={stats.notStable}
          icon={<X className="h-5 w-5 text-red-600" />}
          subtitle={`${stats.total > 0 ? Math.round((stats.notStable / stats.total) * 100) : 0}%`}
        />
      </div>
      <div className="h-full md:col-span-1 [&>div]:h-full">
        <StatCard
          title="Synced"
          value={stats.synced}
          icon={<Cloud className="h-6 w-6 text-green-600" />}
        >
          <div className="flex flex-col content-stretch gap-2 text-sm mt-2">
            {(
              [
                "Available",
                "Preparing",
                "Charging",
                "Finishing",
                "Reserved",
                "Unavailable",
              ] as ChargePointStatus[]
            ).map((status) => (
              <div
                key={status.toLowerCase()}
                className="flex items-center gap-2 justify-between"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <p className="text-md italic">{status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="ml-auto text-sm font-bold text-gray-900">
                    {
                      chargePoints.filter(
                        (cp) =>
                          cp.status === status &&
                          cp.connection.status === "SYNCED",
                      ).length
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    (
                    {stats.total > 0
                      ? Math.round(
                          (chargePoints.filter(
                            (cp) =>
                              cp.status === status &&
                              cp.connection.status === "SYNCED",
                          ).length /
                            stats.total) *
                            100,
                        )
                      : 0}
                    %)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </StatCard>
      </div>
    </div>
  );
};

const getStatusIcon = (status: ChargePointStatus): ReactNode => {
  switch (status) {
    case "Available":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "Preparing":
    case "Finishing":
      return <RefreshCw className="h-5 w-5 text-yellow-600" />;
    case "Charging":
      return <Battery className="h-5 w-5 text-blue-600" />;
    case "SuspendedEV":
    case "SuspendedEVSE":
    case "Reserved":
    case "Unavailable":
      return <Cloud className="h-5 w-5 text-orange-700" />;
    case "Faulted":
      return <X className="h-5 w-5 text-red-600" />;
    default:
      return null;
  }
};
