"use client";

import { useSites } from "../hooks/useSites";

import { Header } from "../components/layout/Header";
import { Callout } from "../components/common/Callout";
import { Loader } from "../components/common/Loader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Site } from "@watchborne/charge-points-types";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import { SiteTable } from "./components/SiteTable";
import { SiteFormDialog, SiteFormValues } from "./components/SiteFormDialog";
import { SiteDeletionDialog } from "./components/SiteDeletionDialog";
import { api } from "@/lib/api";

export default function SitesPage() {
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <Callout error={error} />}

        {loading && <Loader label="Loading sites..." />}

        {!loading && !error && (
          <div className="flex flex-col gap-4 content-stretch">
            <div className="flex items-center gap-3 w-full">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add a site
              </Button>

              <div className="relative max-w-sm ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search a site by name..."
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
              initialValues={editTarget ?? undefined}
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
      </main>
    </div>
  );
}
