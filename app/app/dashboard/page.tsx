"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { CommissioningQueue } from "../charge-points/components/CommissioningQueue";
import { ChargePointStats } from "../components/charge-points/ChargePointStats";
import { ChargePointStatsSkeleton } from "../components/charge-points/ChargePointStatsSkeleton";
import { EmptyStateChargePoints } from "../components/charge-points/EmptyStateChargePoints";
import { Callout } from "../components/common/Callout";
import { FleetOverviewPanel } from "../components/dashboard/FleetOverviewPanel";
import { FleetOverviewPanelSkeleton } from "../components/dashboard/FleetOverviewPanelSkeleton";
import { useChargePoints } from "../hooks/useChargePoints";
import { useSites } from "../hooks/useSites";

export default function DashboardPage() {
  const { chargePoints, loading, error } = useChargePoints();
  const { sites, loading: loadingSites, error: errorSites } = useSites();
  const router = useRouter();

  const unassignedChargePoints = useMemo(
    () => chargePoints.filter((cp) => cp.siteId === null),
    [chargePoints],
  );

  return (
    <>
      {error && <Callout error={error} />}
      {errorSites && <Callout error={errorSites} />}

      {(loading || loadingSites) && (
        <div className="flex flex-col gap-8">
          <ChargePointStatsSkeleton />
          <FleetOverviewPanelSkeleton />
        </div>
      )}

      {!loading && !loadingSites && !error && !errorSites && (
        <div className="flex flex-col gap-8">
          <ChargePointStats chargePoints={chargePoints} />

          <CommissioningQueue
            chargePoints={unassignedChargePoints}
            onCommission={(cp) => router.replace(`/app/charge-points?id=${cp.id}`)}
          />

          {chargePoints.length === 0 ? (
            <EmptyStateChargePoints />
          ) : (
            <FleetOverviewPanel chargePoints={chargePoints} sites={sites} />
          )}
        </div>
      )}
    </>
  );
}
