"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Callout, Skeleton } from "@watchborne/electrons";
import { Plus, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { isAwaitingCommissioning } from "@/lib/commissioning";
import { queryKeys } from "@/lib/queryKeys";
import { CONNECTION_STATUSES } from "@/lib/status";
import {
  ChargePointConnectionStatus,
  ChargePointWithConnectors,
  CreatedChargePoint,
} from "@/types/charge-point";

import { ChargePointConnectionUrlDialog } from "./components/ChargePointConnectionUrlDialog";
import { ChargePointDeletionDialog } from "./components/ChargePointDeletionDialog";
import { ChargePointFleetPanel } from "./components/ChargePointFleetPanel";
import { ChargePointFormDialog, ChargePointFormValues } from "./components/ChargePointFormDialog";
import { CommissioningDialog } from "./components/CommissioningDialog";
import { CommissioningQueue } from "./components/CommissioningQueue";
import { useChargePoints } from "../hooks/useChargePoints";
import { useSites } from "../hooks/useSites";
import { FleetChargePointsPanelSkeleton } from "./components/FleetChargePointsPanelSkeleton";

// useSearchParams() requires a Suspense boundary for this page to be
// statically rendered (see i18n/routing.ts for why static generation matters
// here) — Next.js can't know the search params at build time, so it needs
// somewhere to bail out to client-side rendering for just this part.
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
    refetch: refetchChargePoints,
  } = useChargePoints();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChargePointConnectionStatus | "all">("all");
  const [ocppVersionFilter, setOcppVersionFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const invalidateChargePoints = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });

  const createChargePointMutation = useMutation({
    mutationFn: api.ChargePoints.createChargePoint,
    onSuccess: invalidateChargePoints,
  });
  const updateChargePointMutation = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Parameters<typeof api.ChargePoints.updateChargePoint>[1];
    }) => api.ChargePoints.updateChargePoint(id, patch),
    onSuccess: invalidateChargePoints,
  });
  const deleteChargePointMutation = useMutation({
    mutationFn: api.ChargePoints.deleteChargePoint,
    onSuccess: invalidateChargePoints,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get("id") ?? undefined;
  const didAutoSwitch = useRef(false);

  const [createOpen, setCreateOpen] = useState(false);
  // Set right after a successful create (ADR 0010, charge-points-server):
  // opens ChargePointConnectionUrlDialog with the ready-to-paste connection
  // URL, the pre-provisioning flow's one remaining installer step.
  const [createdChargePoint, setCreatedChargePoint] = useState<CreatedChargePoint | null>(null);
  const [detailTarget, setDetailTarget] = useState<ChargePointWithConnectors | null>(null);
  const [editTarget, setEditTarget] = useState<ChargePointWithConnectors | null>(null);
  const [commissionTarget, setCommissionTarget] = useState<ChargePointWithConnectors | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChargePointWithConnectors | null>(null);

  // Charge points that have never been through commissioning form the
  // backlog. Computed from the full list (not the search-filtered one) so
  // the queue is always complete regardless of the current search.
  const unassignedChargePoints = useMemo(
    () => chargePoints.filter(isAwaitingCommissioning),
    [chargePoints],
  );

  // Every OCPP version currently present in the fleet, offered as filter
  // options — not the package's static "1.6" | "2.0.1" union, so a future
  // version shows up here without a frontend change.
  const ocppVersionOptions = useMemo(
    () => [...new Set(chargePoints.map((cp) => cp.ocppVersion))].sort(),
    [chargePoints],
  );

  const filteredChargePoints = useMemo(() => {
    let result = chargePoints;

    if (statusFilter !== "all") {
      result = result.filter((cp) => cp.connection.status === statusFilter);
    }

    if (ocppVersionFilter !== "all") {
      result = result.filter((cp) => cp.ocppVersion === ocppVersionFilter);
    }

    if (search.length > 2) {
      const query = search.toLowerCase();
      result = result.filter(
        (cp) =>
          cp.name.toLowerCase().includes(query) ||
          cp.meta?.vendor?.toLowerCase().includes(query) ||
          cp.meta?.model?.toLowerCase().includes(query) ||
          cp.meta?.serialNumber?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [chargePoints, search, statusFilter, ocppVersionFilter]);

  useEffect(() => {
    if (detailTarget) {
      const updated = chargePoints.find((cp) => cp.id === detailTarget.id);
      if (updated) setDetailTarget(updated);
    }
  }, [chargePoints, detailTarget]);

  useEffect(() => {
    if (highlightedId && !loadingChargePoints && !loadingSites && !didAutoSwitch.current) {
      const target = chargePoints.find((cp) => cp.id === highlightedId);
      if (target) {
        didAutoSwitch.current = true;
        setDetailTarget(target);
      }
    }
  }, [highlightedId, chargePoints, loadingChargePoints, loadingSites]);

  const handleCreate = async (values: ChargePointFormValues) => {
    const created = await createChargePointMutation.mutateAsync({
      name: values.name,
      // Empty selection means "unassigned" — send null, not "".
      siteId: values.siteId || null,
      isActive: values.isActive,
      meta: {
        vendor: values.meta?.vendor ?? "",
        model: values.meta?.model ?? "",
        serialNumber: values.meta?.serialNumber ?? "",
        firmwareVersion: values.meta?.firmwareVersion ?? "",
      },
    });
    setCreatedChargePoint(created);
  };

  const handleEdit = async (values: ChargePointFormValues) => {
    if (!editTarget) return;
    await updateChargePointMutation.mutateAsync({
      id: editTarget.id,
      patch: {
        name: values.name,
        // Empty selection detaches the charge point from its site.
        siteId: values.siteId || null,
        meta: {
          vendor: values.meta?.vendor ?? "",
          model: values.meta?.model ?? "",
          serialNumber: values.meta?.serialNumber ?? "",
          firmwareVersion: values.meta?.firmwareVersion ?? "",
        },
      },
    });
    setEditTarget(null);
  };

  const handleCommission = async (values: { name: string; siteId: string | null }) => {
    if (!commissionTarget) return;
    await updateChargePointMutation.mutateAsync({
      id: commissionTarget.id,
      patch: {
        name: values.name,
        siteId: values.siteId,
      },
    });
    setCommissionTarget(null);
  };

  const handleToggleActive = async (cp: ChargePointWithConnectors) => {
    await updateChargePointMutation.mutateAsync({
      id: cp.id,
      patch: { isActive: !cp.isActive },
    });
  };

  const handleToggleRealtimeAlerts = async (cp: ChargePointWithConnectors) => {
    await api.ChargePoints.updateChargePoint(cp.id, {
      realtimeAlertsEnabled: !cp.realtimeAlertsEnabled,
    });
    await refetchChargePoints();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await deleteChargePointMutation.mutateAsync(deleteTarget.id);

    if (detailTarget?.id === deleteTarget.id) {
      updateDetailTarget(null);
    }
    setDeleteTarget(null);
  };

  const updateDetailTarget = (cp: ChargePointWithConnectors | null) => {
    setDetailTarget(cp);
    if (cp) {
      router.replace(`/app/charge-points?id=${cp.id}`);
    } else {
      router.replace(`/app/charge-points`);
    }
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
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("appPage.chargePoints.page.buttons.addChargePoint")}
              </Button>

              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as ChargePointConnectionStatus | "all")
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

                <Select value={ocppVersionFilter} onValueChange={setOcppVersionFilter}>
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
                    {ocppVersionOptions.map((version) => (
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
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <CommissioningQueue
              chargePoints={unassignedChargePoints}
              onCommission={(cp) => setCommissionTarget(cp)}
            />

            <ChargePointFleetPanel
              sites={sites}
              chargePoints={filteredChargePoints}
              selected={detailTarget}
              onSelect={updateDetailTarget}
              onToggleActive={handleToggleActive}
              onToggleRealtimeAlerts={handleToggleRealtimeAlerts}
              onEditClicked={(cp) => setEditTarget(cp)}
              onDeleteClicked={(cp) => setDeleteTarget(cp)}
              onResetClicked={(cp, type) => api.ChargePoints.resetChargePoint(cp.id, type)}
              onChangeAvailability={(cp, connectorId, type) =>
                api.ChargePoints.changeAvailability(cp.id, connectorId, type)
              }
              onUnlockConnector={(cp, connectorId) =>
                api.ChargePoints.unlockConnector(cp.id, connectorId)
              }
            />
          </div>

          <CommissioningDialog
            open={!!commissionTarget}
            onOpenChange={(open) => !open && setCommissionTarget(null)}
            chargePoint={commissionTarget}
            sites={sites}
            onCommission={handleCommission}
          />

          <ChargePointFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={handleCreate}
            mode="create"
            sites={sites}
            defaultSiteId={detailTarget?.siteId}
          />
          <ChargePointConnectionUrlDialog
            open={!!createdChargePoint}
            onOpenChange={(open) => !open && setCreatedChargePoint(null)}
            chargePoint={createdChargePoint}
          />
          <ChargePointFormDialog
            open={!!editTarget}
            onOpenChange={(open) => !open && setEditTarget(null)}
            initialValues={
              editTarget
                ? {
                    name: editTarget.name,
                    siteId: editTarget.siteId ?? "",
                    meta: {
                      vendor: editTarget.meta?.vendor ?? "",
                      model: editTarget.meta?.model ?? "",
                      serialNumber: editTarget.meta?.serialNumber ?? "",
                      firmwareVersion: editTarget.meta?.firmwareVersion ?? "",
                    },
                  }
                : undefined
            }
            onSubmit={handleEdit}
            mode="edit"
            sites={sites}
          />
          <ChargePointDeletionDialog
            open={!!deleteTarget}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            deleteTarget={deleteTarget}
            onDeleteClicked={handleDelete}
          />
        </>
      )}
    </>
  );
}
