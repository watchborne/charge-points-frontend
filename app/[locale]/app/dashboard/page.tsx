"use client";

import { Callout } from "@watchborne/electrons";
import { useMemo } from "react";

import { useRouter } from "@/i18n/navigation";
import { isAwaitingCommissioning } from "@/lib/commissioning";

import { CommissioningQueue } from "../charge-points/components/CommissioningQueue";
import { ChargePointStatsSkeleton } from "../components/charge-points/ChargePointStatsSkeleton";
import { ChargePointsBreakdown } from "../components/charge-points/ChargePointsBreakdown";
import { DashboardOnboarding } from "../components/dashboard/DashboardOnboarding";
import { FleetOverviewPanel } from "../components/dashboard/FleetOverviewPanel";
import { FleetOverviewPanelSkeleton } from "../components/dashboard/FleetOverviewPanelSkeleton";
import { SiteHealthSection } from "../components/dashboard/SiteHealthSection";
import { useChargePoints } from "../hooks/useChargePoints";
import { useSites } from "../hooks/useSites";
import { useSitesHealth } from "../hooks/useSitesHealth";

export default function DashboardPage() {
  const { chargePoints, loading, error } = useChargePoints();
  const { sites, loading: loadingSites, error: errorSites } = useSites();
  const { sitesHealth, loading: loadingSitesHealth, error: errorSitesHealth } = useSitesHealth();
  const router = useRouter();

  const unassignedChargePoints = useMemo(
    () => chargePoints.filter(isAwaitingCommissioning),
    [chargePoints],
  );

  const isLoading = loading || loadingSites || loadingSitesHealth;
  const hasError = error || errorSites || errorSitesHealth;

  return (
    <>
      {hasError && (
        <div className="flex flex-col gap-2 content-stretch mb-4">
          {error && <Callout variant="error" description={error} />}
          {errorSites && <Callout variant="error" description={errorSites} />}
          {errorSitesHealth && <Callout variant="error" description={errorSitesHealth} />}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-8">
          <ChargePointStatsSkeleton />
          <FleetOverviewPanelSkeleton />
        </div>
      )}

      {!isLoading && !hasError && (
        <div className="flex flex-col gap-8">
          <SiteHealthSection sites={sites} sitesHealth={sitesHealth} />

          <ChargePointsBreakdown chargePoints={chargePoints} />

          <CommissioningQueue
            chargePoints={unassignedChargePoints}
            onCommission={(cp) => router.replace(`/app/charge-points?id=${cp.id}`)}
          />

          {chargePoints.length === 0 ? (
            <DashboardOnboarding hasSites={sites.length > 0} />
          ) : (
            <FleetOverviewPanel chargePoints={chargePoints} sites={sites} />
          )}
        </div>
      )}
    </>
  );
}
