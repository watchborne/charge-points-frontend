"use client";

import { useTranslations } from "next-intl";

import { ChargePointStats } from "../components/charge-points/ChargePointStats";
import { ChargePointStatsSkeleton } from "../components/charge-points/ChargePointStatsSkeleton";
import { EmptyStateChargePoints } from "../components/charge-points/EmptyStateChargePoints";
import { Callout } from "../components/common/Callout";
import { FleetOverviewPanel } from "../components/dashboard/FleetOverviewPanel";
import { FleetOverviewPanelSkeleton } from "../components/dashboard/FleetOverviewPanelSkeleton";
import { useChargePoints } from "../hooks/useChargePoints";
import { useSites } from "../hooks/useSites";

export default function DashboardPage() {
  const t = useTranslations("");
  const { chargePoints, loading, error } = useChargePoints();
  const { sites, loading: loadingSites, error: errorSites } = useSites();

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
