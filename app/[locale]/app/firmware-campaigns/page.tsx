"use client";

import { Button, Callout } from "@watchborne/electrons";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToastNotification } from "@/app/components/ToastNotification";
import type { FirmwareCampaign } from "@/lib/api-firmware-campaigns";
import {
  getFirmwareCampaignCancelErrorMessageKey,
  getFirmwareCampaignCreateErrorMessageKey,
} from "@/lib/error-messages";
import { HttpError } from "@/lib/http-client";

import type { CreateFirmwareCampaignValues } from "./components/CreateFirmwareCampaignDialog";
import { CreateFirmwareCampaignDialog } from "./components/CreateFirmwareCampaignDialog";
import { FirmwareCampaignDetailModal } from "./components/FirmwareCampaignDetailModal";
import { FirmwareCampaignsList } from "./components/FirmwareCampaignsList";
import { FirmwareCampaignsListSkeleton } from "./components/FirmwareCampaignsListSkeleton";
import { useChargePoints } from "../hooks/useChargePoints";
import { useFirmwareCampaigns } from "../hooks/useFirmwareCampaigns";

export default function FirmwareCampaignsPage() {
  const t = useTranslations("");
  const { pushErrorNotification } = useToastNotification();
  const { campaigns, loading, error, create, isCreating, cancel, isCanceling } =
    useFirmwareCampaigns();
  const { chargePoints } = useChargePoints();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<FirmwareCampaign | null>(null);

  const handleCreate = async (values: CreateFirmwareCampaignValues) => {
    try {
      await create({
        name: values.name,
        targetLocation: values.targetLocation,
        toVersion: values.toVersion?.trim() ? values.toVersion.trim() : undefined,
        retrieveDateTime: new Date(values.retrieveDateTime).toISOString(),
        targetMode: values.targetMode,
        targetSiteId: values.targetMode === "SITE" ? values.targetSiteId : undefined,
        targetChargePointIds:
          values.targetMode === "LIST" ? values.targetChargePointIds : undefined,
        scheduledAt: values.scheduledAt ? values.scheduledAt.toISOString() : undefined,
        staggerMs: values.staggerMs,
      });
      setCreateOpen(false);
    } catch (err) {
      const messageKey =
        err instanceof HttpError
          ? getFirmwareCampaignCreateErrorMessageKey(err.status)
          : "appPage.firmwareCampaigns.errors.genericError";
      pushErrorNotification(t(messageKey));
    }
  };

  const handleCancelCampaign = async (id: string) => {
    try {
      await cancel(id);
    } catch (err) {
      const messageKey =
        err instanceof HttpError
          ? getFirmwareCampaignCancelErrorMessageKey(err.status)
          : "appPage.firmwareCampaigns.errors.genericError";
      pushErrorNotification(t(messageKey));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {error && <Callout variant="error" description={error} />}

      <div className="rounded-xl border bg-card shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold">{t("appPage.firmwareCampaigns.page.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("appPage.firmwareCampaigns.page.subtitle")}
            </p>
          </div>

          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("appPage.firmwareCampaigns.page.buttons.create")}
          </Button>
        </div>

        {loading && <FirmwareCampaignsListSkeleton />}

        {!loading && !error && (
          <FirmwareCampaignsList
            campaigns={campaigns}
            chargePoints={chargePoints}
            onCampaignClicked={setDetailTarget}
          />
        )}
      </div>

      <CreateFirmwareCampaignDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={isCreating}
      />

      <FirmwareCampaignDetailModal
        open={!!detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
        campaign={detailTarget}
        onCancelCampaign={handleCancelCampaign}
        isCanceling={isCanceling}
      />
    </div>
  );
}
