"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Site } from "@watchborne/charge-points-types";
import { Callout } from "@watchborne/electrons";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToastNotification } from "@/app/components/ToastNotification";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

import { useChargePoints } from "../../hooks/useChargePoints";
import { useSites } from "../../hooks/useSites";
import { SiteDeletionDialog } from "../components/SiteDeletionDialog";
import { SiteDetail } from "../components/SiteDetail";
import { SiteFormDialog, SiteFormValues } from "../components/SiteFormDialog";

export default function SiteDetailPage() {
  const t = useTranslations("");
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { sites, loading, error } = useSites();
  const { chargePoints } = useChargePoints();
  const queryClient = useQueryClient();
  const { pushErrorNotification } = useToastNotification();

  const [editTarget, setEditTarget] = useState<Site | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Site | null>(null);

  const updateSiteMutation = useMutation({
    mutationFn: ({ id, values }: { id: Site["id"]; values: SiteFormValues }) =>
      api.Sites.updateSite(id, { id, ...values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sites.all() }),
  });
  const deleteSiteMutation = useMutation({
    mutationFn: api.Sites.deleteSite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sites.all() }),
  });

  const site = sites.find((s) => s.id === id);

  const handleEdit = async (values: SiteFormValues) => {
    if (!editTarget) return;

    try {
      await updateSiteMutation.mutateAsync({ id: editTarget.id, values });
      setEditTarget(null);
    } catch {
      pushErrorNotification(t("appPage.sites.errors.updateFailed"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await deleteSiteMutation.mutateAsync(deleteTarget.id);

    setDeleteTarget(null);
    router.push("/app/sites");
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error) return <Callout variant="error" description={error} />;

  if (!site) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Callout variant="error" description={t("appPage.sites.detail.notFound")} />
        <Link href="/app/sites" className="text-sm text-primary hover:underline">
          {t("appPage.sites.detail.backToSites")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <SiteDetail
        site={site}
        chargePoints={chargePoints}
        onEditClicked={setEditTarget}
        onDeleteClicked={setDeleteTarget}
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
    </>
  );
}
