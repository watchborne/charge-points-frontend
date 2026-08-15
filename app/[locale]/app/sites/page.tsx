"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Site } from "@watchborne/charge-points-types";
import { Button, Input, Callout } from "@watchborne/electrons";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";

import { SiteDeletionDialog } from "./components/SiteDeletionDialog";
import { SiteFormDialog, SiteFormValues } from "./components/SiteFormDialog";
import { SiteGrid } from "./components/SiteGrid";
import { SiteGridSkeleton } from "./components/SiteGridSkeleton";
import { SiteStats } from "../components/sites/SiteStats";
import { useChargePoints } from "../hooks/useChargePoints";
import { useSites } from "../hooks/useSites";

export default function SitesPage() {
  const t = useTranslations("");
  const { sites, loading, error } = useSites();
  const { chargePoints } = useChargePoints();
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const createSiteMutation = useMutation({
    mutationFn: api.Sites.createSite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sites"] }),
  });
  const deleteSiteMutation = useMutation({
    mutationFn: api.Sites.deleteSite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sites"] }),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Site | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Site | null>(null);

  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  useEffect(() => {
    if (!loading && !error) {
      setFilteredSites(sites);
    }

    if (search.length > 2) {
      setFilteredSites(sites.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())));
    }
  }, [sites, search, error, loading]);

  const handleCreate = async (values: SiteFormValues) => {
    await createSiteMutation.mutateAsync(values);
  };

  function handleEdit(values: SiteFormValues) {
    if (!editTarget) return;
    console.log(values);
    setEditTarget(null);
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await deleteSiteMutation.mutateAsync(deleteTarget.id);

    setDeleteTarget(null);
  };

  return (
    <>
      {error && <Callout variant="error" description={error} />}

      {loading && (
        <div className="flex flex-col gap-4 content-stretch">
          <div className="flex items-center gap-3 w-full">
            <div className="h-10 bg-muted rounded animate-pulse w-40" />
            <div className="relative max-w-sm ml-auto h-10 bg-muted rounded animate-pulse w-60" />
          </div>
          <SiteGridSkeleton />
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-8">
          <SiteStats sites={sites} chargePoints={chargePoints} />

          <div className="rounded-xl border bg-card shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-6">
              <h3 className="text-lg font-semibold">{t("appPage.sites.page.title")}</h3>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("appPage.sites.page.buttons.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("appPage.sites.page.buttons.addSite")}
                </Button>
              </div>
            </div>

            <SiteGrid
              sites={filteredSites}
              chargePoints={chargePoints}
              onEditClicked={(site) => setEditTarget(site)}
              onDeleteClicked={(site) => setDeleteTarget(site)}
            />
          </div>

          <SiteFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={handleCreate}
            mode="create"
          />
          <SiteFormDialog
            open={!!editTarget}
            onOpenChange={(open) => !open && setEditTarget(null)}
            initialValues={
              editTarget
                ? { ...editTarget, lastVisitedAt: editTarget.lastVisitedAt ?? undefined }
                : undefined
            }
            onSubmit={handleEdit}
            mode="edit"
          />
          <SiteDeletionDialog
            open={!!deleteTarget}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            deleteTarget={deleteTarget}
            onDeleteClicked={handleDelete}
          />
        </div>
      )}
    </>
  );
}
