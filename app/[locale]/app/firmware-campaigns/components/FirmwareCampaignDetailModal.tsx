"use client";

import {
  Button,
  Callout,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  StatsBreakdown,
} from "@watchborne/electrons";
import { Ban, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { FirmwareCampaign } from "@/lib/api-firmware-campaigns";
import { useDateFormat } from "@/lib/date-format";

import { FirmwareCampaignStatusBadge } from "./FirmwareCampaignStatusBadge";
import { useFirmwareCampaignProgress } from "../../hooks/useFirmwareCampaignProgress";

type FirmwareCampaignDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: FirmwareCampaign | null;
  onCancelCampaign: (id: string) => Promise<void>;
  isCanceling?: boolean;
};

/**
 * A campaign's detail and live dispatch progress (fetched only while open),
 * with a cancel action while it is `SCHEDULED`.
 */
export const FirmwareCampaignDetailModal = ({
  open,
  onOpenChange,
  campaign,
  onCancelCampaign,
  isCanceling = false,
}: FirmwareCampaignDetailModalProps) => {
  const t = useTranslations("");
  const { formatDateTime } = useDateFormat();
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
        <DialogContent closeLabel={t("common.close")} className="max-w-lg">
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
                <span className="font-medium">{formatDateTime(campaign.scheduledAt)}</span>
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
