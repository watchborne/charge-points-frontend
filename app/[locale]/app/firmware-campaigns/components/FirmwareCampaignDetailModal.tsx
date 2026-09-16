"use client";

import { Button, Callout } from "@watchborne/electrons";
import { Ban, UploadCloud } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FirmwareCampaign } from "@/lib/api-firmware-campaigns";

import { FirmwareCampaignStatusBadge } from "./FirmwareCampaignStatusBadge";
import { StatsBreakdown } from "../../components/common/StatsBreakdown";
import { useFirmwareCampaignProgress } from "../../hooks/useFirmwareCampaignProgress";

type FirmwareCampaignDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: FirmwareCampaign | null;
  onCancelCampaign: (id: string) => Promise<void>;
  isCanceling?: boolean;
};

/**
 * Opened from a row in `FirmwareCampaignsList`: the campaign's detail plus
 * live dispatch progress (`GET /api/firmware-campaigns/:id`, fetched by
 * `useFirmwareCampaignProgress` only while this is open) and, for a still
 * `SCHEDULED` campaign, the ability to cancel it.
 */
export const FirmwareCampaignDetailModal = ({
  open,
  onOpenChange,
  campaign,
  onCancelCampaign,
  isCanceling = false,
}: FirmwareCampaignDetailModalProps) => {
  const t = useTranslations("");
  const format = useFormatter();
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const { progress, loading } = useFirmwareCampaignProgress(open ? (campaign?.id ?? null) : null);

  if (!campaign) return null;

  const canCancel = campaign.status === "SCHEDULED";

  const handleCancel = async () => {
    await onCancelCampaign(campaign.id);
    setConfirmCancelOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <UploadCloud className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate">{campaign.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  {t("appPage.firmwareCampaigns.detail.targetLocation", {
                    location: campaign.targetLocation,
                  })}
                </DialogDescription>
              </div>
              <FirmwareCampaignStatusBadge status={campaign.status} />
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("appPage.firmwareCampaigns.detail.targetMode")}
                </span>
                <span className="font-medium">
                  {t(
                    `appPage.firmwareCampaigns.create.fields.targetModeOptions.${campaign.targetMode}`,
                  )}
                </span>
              </div>

              {progress && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("appPage.firmwareCampaigns.detail.targetCount")}
                  </span>
                  <span className="font-medium">{progress.targetCount}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("appPage.firmwareCampaigns.detail.scheduledAt")}
                </span>
                <span className="font-medium">
                  {format.dateTime(new Date(campaign.scheduledAt), {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {campaign.toVersion && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("appPage.firmwareCampaigns.detail.toVersion")}
                  </span>
                  <span className="font-medium">{campaign.toVersion}</span>
                </div>
              )}
            </div>

            {campaign.heterogeneousTargetIds.length > 0 && (
              <Callout
                variant="info"
                description={t("appPage.firmwareCampaigns.detail.heterogeneousTargetsNote", {
                  count: campaign.heterogeneousTargetIds.length,
                })}
              />
            )}

            <div className="border-t pt-4">
              {loading && (
                <span className="text-sm text-muted-foreground">
                  {t("appPage.firmwareCampaigns.detail.progressLoading")}
                </span>
              )}

              {!loading && progress && (
                <StatsBreakdown
                  title={t("appPage.firmwareCampaigns.detail.progressTitle")}
                  buckets={[
                    {
                      label: t("appPage.firmwareCampaigns.detail.progress.attempted"),
                      value: progress.attemptedCount,
                    },
                    {
                      label: t("appPage.firmwareCampaigns.detail.progress.notAttempted"),
                      value: progress.notAttemptedCount,
                    },
                    {
                      label: t("appPage.firmwareCampaigns.detail.progress.inProgress"),
                      value: progress.inProgressCount,
                    },
                    {
                      label: t("appPage.firmwareCampaigns.detail.progress.succeeded"),
                      value: progress.succeededCount,
                    },
                    {
                      label: t("appPage.firmwareCampaigns.detail.progress.failed"),
                      value: progress.failedCount,
                    },
                    {
                      label: t("appPage.firmwareCampaigns.detail.progress.total"),
                      value: progress.targetCount,
                    },
                  ]}
                  columns={3}
                />
              )}
            </div>
          </div>

          {canCancel && (
            <div className="flex flex-col gap-2 border-t pt-6">
              <Button
                variant="destructive"
                disabled={isCanceling}
                onClick={() => setConfirmCancelOpen(true)}
              >
                <Ban className="mr-2 h-4 w-4" />
                {t("appPage.firmwareCampaigns.detail.cancelButton")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("appPage.firmwareCampaigns.detail.cancelConfirm.title", { name: campaign.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("appPage.firmwareCampaigns.detail.cancelConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmCancelOpen(false)}>
              {t("common.actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancel}
            >
              {t("appPage.firmwareCampaigns.detail.cancelConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
