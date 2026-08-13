"use client";

import { Callout } from "@watchborne/electrons";
import { useMemo } from "react";

import { useRouter } from "@/i18n/navigation";

import { CommissioningQueue } from "../charge-points/components/CommissioningQueue";
import { ChargePointStats } from "../components/charge-points/ChargePointStats";
import { ChargePointStatsSkeleton } from "../components/charge-points/ChargePointStatsSkeleton";
import { DashboardOnboarding } from "../components/dashboard/DashboardOnboarding";
import { FleetOverviewPanel } from "../components/dashboard/FleetOverviewPanel";
import { FleetOverviewPanelSkeleton } from "../components/dashboard/FleetOverviewPanelSkeleton";
import { SiteHealthOverview } from "../components/dashboard/SiteHealthOverview";
import { useChargePoints } from "../hooks/useChargePoints";
import { useSites } from "../hooks/useSites";
import { useSitesHealth } from "../hooks/useSitesHealth";

export default function DashboardPage() {
  const { chargePoints, loading, error } = useChargePoints();
  const { sites, loading: loadingSites, error: errorSites } = useSites();
  // Independent of the loading/error gate below on purpose: this tile is a
  // supplementary fleet-wide indicator, not core dashboard content, so a slow
  // or failed health read must not hold up (or blank out) everything else —
  // it simply doesn't render until it has something to show.
  const { sitesHealth, loading: loadingSitesHealth } = useSitesHealth();
  const router = useRouter();

  const unassignedChargePoints = useMemo(
    () => chargePoints.filter((cp) => cp.siteId === null),
    [chargePoints],
  );

  return (
    <>
      {(error || errorSites) && (
        <div className="flex flex-col gap-2 content-stretch mb-4">
          {error && <Callout variant="error" description={error} />}
          {errorSites && <Callout variant="error" description={errorSites} />}
        </div>
      )}

      {(loading || loadingSites) && (
        <div className="flex flex-col gap-8">
          <ChargePointStatsSkeleton />
          <FleetOverviewPanelSkeleton />
        </div>
      )}

      {!loading && !loadingSites && !error && !errorSites && (
        <div className="flex flex-col gap-8">
          {!loadingSitesHealth && sitesHealth.length > 0 && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <SiteHealthOverview sitesHealth={sitesHealth} />
            </div>
          )}

          <ChargePointStats chargePoints={chargePoints} />

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
