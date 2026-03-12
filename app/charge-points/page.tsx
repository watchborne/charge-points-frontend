"use client";

import { Plus, Search, Server, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  ChargePointFormDialog,
  ChargePointFormValues,
} from "./components/ChargePointFormDialog";
import { Badge } from "@/components/ui/badge";
import { ChargePointTable } from "./components/ChargePointTable";
import { Button } from "@/components/ui/button";
import { ChargePoint } from "@/types/charge-point";
import { useSites } from "../hooks/useSites";
import { useChargePoints } from "../hooks/useChargePoints";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "../components/layout/Header";
import { ErrorCallout } from "../components/common/ErrorCallout";
import { Loader } from "../components/common/Loader";
import { ChargePointDeletionDialog } from "./components/ChargePointDeletionDialog";
import { ChargePointDetailDialog } from "./components/ChargePointDetailDialog";

export default function ChargePointsPage() {
  const {
    sites,
    loading: loadingSites,
    error: errorSites,
    refetch: refetchSites,
  } = useSites();
  const {
    chargePoints,
    loading: loadingChargePoints,
    error: errorChargePoints,
    refetch: refetchChargePoints,
  } = useChargePoints();
  const [search, setSearch] = useState("");

  const searchParams = useSearchParams();
  const highlightedUuid = searchParams.get("uuid") ?? undefined;
  const didAutoSwitch = useRef(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultSiteId, setCreateDefaultSiteId] = useState<
    string | undefined
  >();
  const [detailTarget, setDetailTarget] = useState<ChargePoint | null>(null);
  const [editTarget, setEditTarget] = useState<ChargePoint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChargePoint | null>(null);
  const [activeTab, setActiveTab] = useState<string>();

  const [filteredChargePoints, setFilteredChargePoints] = useState<
    ChargePoint[]
  >([]);

  useEffect(() => {
    if (!loadingChargePoints && !errorChargePoints) {
      setFilteredChargePoints(chargePoints);
    }

    if (search.length > 2) {
      setFilteredChargePoints(
        chargePoints.filter(
          (cp) =>
            cp.name.toLowerCase().includes(search.toLowerCase()) ||
            cp.meta?.chargePointVendor
              ?.toLowerCase()
              .includes(search.toLowerCase()) ||
            cp.meta?.chargePointModel
              ?.toLowerCase()
              .includes(search.toLowerCase()) ||
            cp.meta?.serialNumber?.toLowerCase().includes(search.toLowerCase()),
        ),
      );
    }
  }, [chargePoints, search]);

  useEffect(() => {
    if (!loadingSites && !errorSites && sites.length > 0 && !highlightedUuid) {
      setActiveTab(sites[0].id);
    }
  }, [sites]);

  useEffect(() => {
    if (
      highlightedUuid &&
      !loadingChargePoints &&
      !loadingSites &&
      !didAutoSwitch.current
    ) {
      const target = chargePoints.find((cp) => cp.uuid === highlightedUuid);
      if (target) {
        setActiveTab(target.siteId);
        didAutoSwitch.current = true;
      }
    }
  }, [highlightedUuid, chargePoints, loadingChargePoints, loadingSites]);

  const groupedChargePoints = sites
    .map((site) => ({
      site,
      chargePoints: filteredChargePoints.filter((cp) => cp.siteId === site.id),
    }))
    .filter((g) => g.chargePoints.length > 0);

  const ungroupedChargePoints = filteredChargePoints.filter(
    (cp) => !sites.find((s) => s.id === cp.siteId),
  );

  const handleCreate = async (values: ChargePointFormValues) => {
    await api.ChargePoints.createChargePoint({
      name: values.name,
      siteId: values.siteId,
      isActive: values.isActive,
      meta: values.meta
        ? {
            chargePointVendor: values.meta.chargePointVendor ?? "",
            chargePointModel: values.meta.chargePointModel ?? "",
            serialNumber: values.meta.serialNumber,
            firmwareVersion: values.meta.firmwareVersion,
          }
        : undefined,
    });
    await refetchChargePoints();
  };

  const handleEdit = async (values: ChargePointFormValues) => {
    if (!editTarget) return;
    await api.ChargePoints.updateChargePoint(editTarget.uuid, {
      name: values.name,
      siteId: values.siteId,
      meta: values.meta
        ? {
            chargePointVendor: values.meta.chargePointVendor ?? "",
            chargePointModel: values.meta.chargePointModel ?? "",
            serialNumber: values.meta.serialNumber,
            firmwareVersion: values.meta.firmwareVersion,
          }
        : undefined,
    });
    await refetchChargePoints();
    setEditTarget(null);
  };

  const handleToggleActive = async (cp: ChargePoint) => {
    await api.ChargePoints.updateChargePoint(cp.uuid, {
      isActive: !cp.isActive,
    });
    await refetchChargePoints();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await api.ChargePoints.deleteChargePoint(deleteTarget.uuid);
    await refetchChargePoints();

    setDeleteTarget(null);
  };

  const openCreateForSite = (siteId: string) => {
    setCreateDefaultSiteId(siteId);
    setCreateOpen(true);
  };

  const getCountForSite = (id: string) => {
    return filteredChargePoints.filter((cp) => cp.siteId === id).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errorChargePoints && <ErrorCallout error={errorChargePoints} />}

        {loadingChargePoints && <Loader label="Loading charge points..." />}

        {!loadingChargePoints && !errorChargePoints && (
          <div className="flex flex-col gap-4 content-stretch">
            <div className="flex items-center gap-3 w-full">
              <Button
                onClick={() => {
                  setCreateDefaultSiteId(undefined);
                  setCreateOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add a charge point
              </Button>

              <div className="relative max-w-sm ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <p className="text mt-1">
              {chargePoints.length} charge point
              {chargePoints.length > 1 ? "s" : ""} on {sites.length} site
              {sites.length > 1 ? "s" : ""}
            </p>

            {groupedChargePoints.length === 0 &&
              ungroupedChargePoints.length === 0 && (
                <div className="rounded-lg border py-16 text-center text-muted-foreground">
                  No charge point found.
                </div>
              )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between">
                <TabsList>
                  {sites.map((site) => (
                    <TabsTrigger
                      key={site.id}
                      value={site.id}
                      className="gap-2"
                    >
                      {site.name}
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {getCountForSite(site.id)}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => activeTab && openCreateForSite(activeTab)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add for this site
                </Button>
              </div>

              {sites.map((site) => (
                <TabsContent key={site.id} value={site.id} className="mt-4">
                  <div className="rounded-lg border">
                    <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{site.name}</span>
                    </div>
                    <ChargePointTable
                      items={filteredChargePoints.filter(
                        (cp) => cp.siteId === site.id,
                      )}
                      highlightedUuid={highlightedUuid}
                      onRowClicked={(cp) => setDetailTarget(cp)}
                      onToggleActive={handleToggleActive}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {ungroupedChargePoints.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-muted/40 border-b flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Unknown site
                  </span>
                  <Badge variant="secondary">
                    {ungroupedChargePoints.length}
                  </Badge>
                </div>
                <ChargePointTable
                  items={ungroupedChargePoints}
                  highlightedUuid={highlightedUuid}
                  onRowClicked={(cp) => setDetailTarget(cp)}
                  onToggleActive={handleToggleActive}
                />
              </div>
            )}

            <ChargePointFormDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              onSubmit={handleCreate}
              mode="create"
              sites={sites}
              defaultSiteId={createDefaultSiteId}
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
                        chargePointVendor:
                          editTarget.meta?.chargePointVendor ?? "",
                        chargePointModel:
                          editTarget.meta?.chargePointModel ?? "",
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
            <ChargePointDetailDialog
              chargePoint={detailTarget}
              site={sites.find((s) => s.id === detailTarget?.siteId)}
              onOpenChange={(open) => !open && setDetailTarget(null)}
              onEditClicked={(cp) => setEditTarget(cp)}
              onDeleteClicked={(cp) => setDeleteTarget(cp)}
            />
            <ChargePointDeletionDialog
              open={!!deleteTarget}
              onOpenChange={(open) => !open && setDeleteTarget(null)}
              deleteTarget={deleteTarget}
              onDeleteClicked={handleDelete}
            />
          </div>
        )}
      </main>
    </div>
  );
}
