"use client";

import { Button, Input, Callout, Skeleton } from "@watchborne/electrons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@watchborne/electrons";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { CONNECTION_STATUSES } from "@/lib/status";
import { ChargePointConnectionStatus, ChargePointWithConnectors } from "@/types/charge-point";

import { ChargePointDialogs } from "./components/ChargePointDialogs";
import { ChargePointFleetPanel } from "./components/ChargePointFleetPanel";
import { CommissioningQueue } from "./components/CommissioningQueue";
import { FleetChargePointsPanelSkeleton } from "./components/FleetChargePointsPanelSkeleton";
import { useChargePointDeepLink } from "./hooks/useChargePointDeepLink";
import { useChargePointDialogs } from "./hooks/useChargePointDialogs";
import { useChargePointFilters } from "./hooks/useChargePointFilters";
import { useChargePointMutations } from "./hooks/useChargePointMutations";
import { useChargePoints } from "../hooks/useChargePoints";
import { useSites } from "../hooks/useSites";

// useSearchParams() needs a Suspense boundary for the page to stay static.
export default function ChargePointsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 content-stretch">
          <div className="flex items-center gap-3 w-full justify-between">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-64" />
          </div>
          <FleetChargePointsPanelSkeleton />
        </div>
      }
    >
      <ChargePointsPageContent />
    </Suspense>
  );
}

function ChargePointsPageContent() {
  const t = useTranslations("");
  const { sites, loading: loadingSites, error: errorSites } = useSites();
  const {
    chargePoints,
    loading: loadingChargePoints,
    error: errorChargePoints,
  } = useChargePoints();

  const filters = useChargePointFilters(chargePoints);
  const { selected, select, changeTab, initialTab } = useChargePointDeepLink({
    chargePoints,
    loading: loadingChargePoints || loadingSites,
  });
  const mutations = useChargePointMutations();
  const dialogs = useChargePointDialogs();

  // A released or deleted charge point must not stay open in the detail panel.
  const deselectIfSelected = (cp: ChargePointWithConnectors) => {
    if (selected?.id === cp.id) select(null);
  };

  return (
    <>
      {(errorChargePoints || errorSites) && (
        <div className="flex flex-col gap-2 content-stretch mb-4">
          {errorChargePoints && <Callout variant="error" description={errorChargePoints} />}
          {errorSites && <Callout variant="error" description={errorSites} />}
        </div>
      )}

      {loadingChargePoints && (
        <div className="flex flex-col gap-4 content-stretch">
          <div className="flex items-center gap-3 w-full justify-between">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-64" />
          </div>
          <FleetChargePointsPanelSkeleton />
        </div>
      )}

      {!loadingChargePoints && !loadingSites && !errorChargePoints && (
        <>
          <div className="flex flex-col gap-4 content-stretch">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => dialogs.openCreate()}>
                <Plus className="h-4 w-4 mr-2" />
                {t("appPage.chargePoints.page.buttons.addChargePoint")}
              </Button>

              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <Select
                  value={filters.statusFilter}
                  onValueChange={(value) =>
                    filters.setStatusFilter(value as ChargePointConnectionStatus | "all")
                  }
                >
                  <SelectTrigger
                    className="h-9 min-w-[150px] w-max text-sm"
                    aria-label={t("appPage.chargePoints.page.filters.status")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("appPage.chargePoints.page.filters.allStatuses")}
                    </SelectItem>
                    {CONNECTION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.ocppVersionFilter}
                  onValueChange={filters.setOcppVersionFilter}
                >
                  <SelectTrigger
                    className="h-9 min-w-[150px] w-max text-sm"
                    aria-label={t("appPage.chargePoints.page.filters.ocppVersion")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("appPage.chargePoints.page.filters.allVersions")}
                    </SelectItem>
                    {filters.ocppVersionOptions.map((version) => (
                      <SelectItem key={version} value={version}>
                        OCPP {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("appPage.chargePoints.page.buttons.search")}
                    value={filters.search}
                    onChange={(e) => filters.setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <CommissioningQueue
              chargePoints={filters.awaitingCommissioning}
              onCommission={dialogs.openCommission}
            />

            <ChargePointFleetPanel
              sites={sites}
              chargePoints={filters.filteredChargePoints}
              selected={selected}
              onSelect={select}
              onEditClicked={dialogs.openEdit}
              onDeleteClicked={dialogs.openDelete}
              onReleased={deselectIfSelected}
              initialTab={initialTab}
              onTabChange={changeTab}
            />
          </div>

          <ChargePointDialogs
            dialogs={dialogs}
            mutations={mutations}
            sites={sites}
            defaultSiteId={selected?.siteId}
            onDeleted={deselectIfSelected}
          />
        </>
      )}
    </>
  );
}
