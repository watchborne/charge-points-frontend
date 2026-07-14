"use client";

import { Site } from "@watchborne/charge-points-types";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

import { SiteDeletionDialog } from "./components/SiteDeletionDialog";
import { SiteFormDialog, SiteFormValues } from "./components/SiteFormDialog";
import { SiteTable } from "./components/SiteTable";
import { Callout } from "../components/common/Callout";
import { Loader } from "../components/common/Loader";
import { useSites } from "../hooks/useSites";

export default function SitesPage() {
  const t = useTranslations("");
  const { sites, loading, error, refetch: refetchSites } = useSites();
  const [search, setSearch] = useState("");

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
    await api.Sites.createSite(values);
    await refetchSites();
  };

  function handleEdit(values: SiteFormValues) {
    if (!editTarget) return;
    console.log(values);
    setEditTarget(null);
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await api.Sites.deleteSite(deleteTarget.id);
    await refetchSites();

    setDeleteTarget(null);
  };

  return (
    <>
      {error && <Callout error={error} />}

      {loading && <Loader label={t("appPage.loading.sites")} />}

      {!loading && !error && (
        <div className="flex flex-col gap-4 content-stretch">
          <div className="flex items-center gap-3 w-full">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("appPage.sites.page.buttons.addSite")}
            </Button>

            <div className="relative max-w-sm ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("appPage.sites.page.buttons.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <SiteTable
            sites={filteredSites}
            onEditClicked={(site) => setEditTarget(site)}
            onDeleteClicked={(site) => setDeleteTarget(site)}
          />

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
