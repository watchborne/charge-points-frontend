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

  // Derived, not fetched: this used to be its own GET /api/sites/health call,
  // redoing the same sites -> charge points -> connectors read /api/sites had
  // just made for the same caller (charge-points-server#503 P4). chargePoints
  // is already kept live over the dashboard WebSocket by useChargePoints, so
  // this now updates in real time too, which the polling-only fetch never did.
  const sitesHealth = useMemo(() => deriveSitesHealth(sites, chargePoints), [sites, chargePoints]);

  const isLoading = loading || loadingSites;
  const hasError = error || errorSites;

  // The panels #393's layout preferences (order/visibility) apply to. Keyed
  // by widget id rather than inlined below, so reordering/hiding one doesn't
  // touch the always-shown error/loading/commissioning sections around them.
  const widgets: Record<DashboardWidgetId, ReactNode> = {
    siteHealth: <SiteHealthSection sites={sites} sitesHealth={sitesHealth} />,
    chargePointsBreakdown: <ChargePointsBreakdown chargePoints={chargePoints} />,
    fleetOverview:
      chargePoints.length === 0 ? (
        <DashboardOnboarding hasSites={sites.length > 0} />
      ) : (
        <FleetOverviewPanel chargePoints={chargePoints} sites={sites} />
      ),
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
