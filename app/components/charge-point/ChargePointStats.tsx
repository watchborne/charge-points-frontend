import { ChargePoint } from "@/types";
import { StatCard } from "../common/StatCard";
import { Battery, PlugZap, RefreshCw, X } from "lucide-react";

export const ChargePointStats = ({
  chargePoints,
}: {
  chargePoints: ChargePoint[];
}) => {
  const stats = {
    total: chargePoints.length,
    connected: chargePoints.filter((cp) => cp.lifecycle === "CONNECTED").length,
    synced: chargePoints.filter((cp) => cp.lifecycle === "SYNCED").length,
    offline: chargePoints.filter((cp) => cp.lifecycle === "OFFLINE").length,
    // available: chargePoints.filter(
    //   (cp) => cp.status === "Available" && cp.lifecycle === "SYNCED",
    // ).length,
    // charging: chargePoints.filter((cp) => cp.status === "Charging").length,
    // faulted: chargePoints.filter(
    //   (cp) => cp.status === "Faulted" || cp.lifecycle === "OFFLINE",
    // ).length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Total"
        value={stats.total}
        icon={<Battery className="h-5 w-5 text-gray-600" />}
      />
      <StatCard
        title="Connected"
        value={stats.connected}
        icon={<PlugZap className="h-5 w-5 text-yellow-600" />}
        subtitle={`${stats.total > 0 ? Math.round((stats.connected / stats.total) * 100) : 0}%`}
      />
      <StatCard
        title="Synced"
        value={stats.synced}
        icon={<RefreshCw className="h-5 w-5 text-green-600" />}
        subtitle={`${stats.total > 0 ? Math.round((stats.synced / stats.total) * 100) : 0}%`}
      />
      <StatCard
        title="Offline"
        value={stats.offline}
        icon={<X className="h-5 w-5 text-red-600" />}
        subtitle={`${stats.total > 0 ? Math.round((stats.offline / stats.total) * 100) : 0}%`}
      />
      {/* <StatCard
        title="Available"
        value={stats.available}
        icon={<CheckCircle className="h-5 w-5 text-green-600" />}
      />
      <StatCard
        title="Charging"
        value={stats.charging}
        icon={<Loader className="h-5 w-5 text-blue-600" />}
      />
      <StatCard
        title="Faulted"
        value={stats.faulted}
        icon={<AlertCircle className="h-5 w-5 text-red-600" />}
      /> */}
    </div>
  );
};
