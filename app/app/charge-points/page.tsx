"use client";

import type { ResetType } from "@watchborne/charge-points-types";
import { Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { ChargePointWithConnectors } from "@/types/charge-point";

import { ChargePointDeletionDialog } from "./components/ChargePointDeletionDialog";
import { ChargePointFleetPanel } from "./components/ChargePointFleetPanel";
import { ChargePointFormDialog, ChargePointFormValues } from "./components/ChargePointFormDialog";
import { ChargePointResetDialog } from "./components/ChargePointResetDialog";
import { ChargePointTableSkeleton } from "./components/ChargePointTableSkeleton";
import { Callout } from "../components/common/Callout";
import { useChargePoints } from "../hooks/useChargePoints";
import { useSites } from "../hooks/useSites";

export default function ChargePointsPage() {
  const t = useTranslations("");
  const { sites, loading: loadingSites, error: errorSites } = useSites();
  const {
    chargePoints,
    loading: loadingChargePoints,
    error: errorChargePoints,
    refetch: refetchChargePoints,
  } = useChargePoints();
  const [search, setSearch] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get("id") ?? undefined;
  const didAutoSwitch = useRef(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<ChargePointWithConnectors | null>(null);
  const [editTarget, setEditTarget] = useState<ChargePointWithConnectors | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChargePointWithConnectors | null>(null);
  const [resetTarget, setResetTarget] = useState<ChargePointWithConnectors | null>(null);
  const [activeTab, setActiveTab] = useState<string>();

  const filteredChargePoints = useMemo(() => {
    if (search.length <= 2) return chargePoints;

    const query = search.toLowerCase();
    return chargePoints.filter(
      (cp) =>
        cp.name.toLowerCase().includes(query) ||
        cp.meta?.vendor?.toLowerCase().includes(query) ||
        cp.meta?.model?.toLowerCase().includes(query) ||
        cp.meta?.serialNumber?.toLowerCase().includes(query),
    );
  }, [chargePoints, search]);

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
    await api.ChargePoints.createChargePoint({
      name: values.name,
      siteId: values.siteId,
      isActive: values.isActive,
      meta: {
        vendor: values.meta?.vendor ?? "",
        model: values.meta?.model ?? "",
        serialNumber: values.meta?.serialNumber ?? "",
        firmwareVersion: values.meta?.firmwareVersion ?? "",
      },
    });
    await refetchChargePoints();
  };

  const handleEdit = async (values: ChargePointFormValues) => {
    if (!editTarget) return;
    await api.ChargePoints.updateChargePoint(editTarget.id, {
      name: values.name,
      siteId: values.siteId,
      meta: {
        vendor: values.meta?.vendor ?? "",
        model: values.meta?.model ?? "",
        serialNumber: values.meta?.serialNumber ?? "",
        firmwareVersion: values.meta?.firmwareVersion ?? "",
      },
    });
    await refetchChargePoints();
    setEditTarget(null);
  };

  const handleToggleActive = async (cp: ChargePointWithConnectors) => {
    await api.ChargePoints.updateChargePoint(cp.id, {
      isActive: !cp.isActive,
    });
    await refetchChargePoints();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await api.ChargePoints.deleteChargePoint(deleteTarget.id);
    await refetchChargePoints();

    if (detailTarget?.id === deleteTarget.id) {
      updateDetailTarget(null);
    }
    setDeleteTarget(null);
  };

  const handleReset = (type: ResetType) => {
    if (!resetTarget) return Promise.resolve({ ok: false, httpStatus: 0 } as const);
    return api.ChargePoints.resetChargePoint(resetTarget.id, type);
  };

  const openCreateForSite = (siteId: string) => {
    setCreateDefaultSiteId(siteId);
    setCreateOpen(true);
  };

  const getCountForSite = (id: string) => {
    return filteredChargePoints.filter((cp) => cp.siteId === id).length;
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
      {errorChargePoints && <Callout error={errorChargePoints} />}
      {errorSites && <Callout error={errorSites} />}

      {loadingChargePoints && (
        <div className="flex flex-col gap-4 content-stretch">
          <div className="flex items-center gap-3 w-full">
            <div className="h-10 bg-muted rounded animate-pulse w-40" />
            <div className="relative max-w-sm ml-auto h-10 bg-muted rounded animate-pulse w-60" />
          </div>
          <div className="rounded-lg border overflow-hidden">
            <ChargePointTableSkeleton />
          </div>
        </div>
      )}

      {!loadingChargePoints && !loadingSites && !errorChargePoints && (
        <div className="flex flex-col gap-4 content-stretch">
          <div className="flex items-center gap-3 w-full">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("appPage.chargePoints.page.buttons.addChargePoint")}
            </Button>

            <div className="relative max-w-sm ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("appPage.chargePoints.page.buttons.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ChargePointFleetPanel
            sites={sites}
            chargePoints={filteredChargePoints}
            selected={detailTarget}
            onSelect={updateDetailTarget}
            onToggleActive={handleToggleActive}
            onEditClicked={(cp) => setEditTarget(cp)}
            onDeleteClicked={(cp) => setDeleteTarget(cp)}
          />

          <ChargePointFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={handleCreate}
            mode="create"
            sites={sites}
            defaultSiteId={detailTarget?.siteId}
          />
          <ChargePointFormDialog
            open={!!editTarget}
            onOpenChange={(open) => !open && setEditTarget(null)}
            initialValues={
              editTarget
                ? {
                    name: editTarget.name,
                    siteId: editTarget.siteId,
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
          <ChargePointResetDialog
            resetTarget={resetTarget}
            onOpenChange={(open) => !open && setResetTarget(null)}
            onConfirm={handleReset}
          />
        </div>
      )}
    </>
  );
}
