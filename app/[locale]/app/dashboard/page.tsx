"use client";

import { Button, Callout } from "@watchborne/electrons";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useMemo, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { isAwaitingCommissioning } from "@/lib/commissioning";
import { DashboardWidgetId } from "@/lib/dashboard-layout";
import { deriveSitesHealth } from "@/lib/derive-site-health";

import { CommissioningQueue } from "../charge-points/components/CommissioningQueue";
import { ChargePointStatsSkeleton } from "../components/charge-points/ChargePointStatsSkeleton";
import { ChargePointsBreakdown } from "../components/charge-points/ChargePointsBreakdown";
import { DashboardLayoutDialog } from "../components/dashboard/DashboardLayoutDialog";
import { DashboardOnboarding } from "../components/dashboard/DashboardOnboarding";
import { FleetOverviewPanel } from "../components/dashboard/FleetOverviewPanel";
import { FleetOverviewPanelSkeleton } from "../components/dashboard/FleetOverviewPanelSkeleton";
import { FleetReliabilityPanel } from "../components/dashboard/FleetReliabilityPanel";
import { SiteHealthSection } from "../components/dashboard/SiteHealthSection";
import { useChargePoints } from "../hooks/useChargePoints";
import { useDashboardLayout } from "../hooks/useDashboardLayout";
import { useSites } from "../hooks/useSites";

export default function DashboardPage() {
  const t = useTranslations("");
  const { chargePoints, loading, error } = useChargePoints();
  const { sites, loading: loadingSites, error: errorSites } = useSites();
  const router = useRouter();
  const { layout, toggleVisibility, moveWidget, resetLayout } = useDashboardLayout();
  const [isCustomizing, setIsCustomizing] = useState(false);

  const unassignedChargePoints = useMemo(
    () => chargePoints.filter(isAwaitingCommissioning),
    [chargePoints],
  );

  // Derived from chargePoints, which the WebSocket keeps live, so it updates
  // in real time without its own request.
  const sitesHealth = useMemo(() => deriveSitesHealth(sites, chargePoints), [sites, chargePoints]);

  const isLoading = loading || loadingSites;
  const hasError = error || errorSites;

  // The widgets the layout preferences (order/visibility) apply to, keyed by
  // id; the error/loading/commissioning sections around them are always shown.
  const widgets: Record<DashboardWidgetId, ReactNode> = {
    siteHealth: <SiteHealthSection sites={sites} sitesHealth={sitesHealth} />,
    chargePointsBreakdown: <ChargePointsBreakdown chargePoints={chargePoints} />,
    fleetOverview:
      chargePoints.length === 0 ? (
        <DashboardOnboarding hasSites={sites.length > 0} />
      ) : (
        <FleetOverviewPanel chargePoints={chargePoints} sites={sites} />
      ),
    // Hidden for an empty fleet: fleetOverview already shows onboarding.
    fleetReliability: chargePoints.length === 0 ? null : <FleetReliabilityPanel />,
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsCustomizing(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("appPage.dashboard.layout.customize")}
        </Button>
      </div>

      <DashboardLayoutDialog
        open={isCustomizing}
        onOpenChange={setIsCustomizing}
        layout={layout}
        onToggleVisibility={toggleVisibility}
        onMove={moveWidget}
        onReset={resetLayout}
      />

      {hasError && (
        <div className="flex flex-col gap-2 content-stretch mb-4">
          {error && <Callout variant="error" description={error} />}
          {errorSites && <Callout variant="error" description={errorSites} />}
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
          <CommissioningQueue
            chargePoints={unassignedChargePoints}
            onCommission={(cp) => router.replace(`/app/charge-points?id=${cp.id}`)}
          />

          {layout
            .filter((widget) => widget.visible)
            .map((widget) => (
              <div key={widget.id}>{widgets[widget.id]}</div>
            ))}
        </div>
      )}
    </>
  );
}
