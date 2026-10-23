import { Button } from "@watchborne/electrons";
import { BellRing, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { ChargePoint } from "@/types/charge-point";

import { AlertThresholdsDialog } from "../../components/alert-thresholds/AlertThresholdsDialog";
import { AlertThresholdsSummary } from "../../components/alert-thresholds/AlertThresholdsSummary";
import { useChargePointAlertThresholds } from "../../hooks/useChargePointAlertThresholds";

type ChargePointAlertThresholdsSectionProps = {
  chargePointId: ChargePoint["id"];
};

/**
 * A charge point's alert thresholds on its "alerts" tab: the values the alert
 * sweep applies, where each comes from (own override, site, default), and
 * editing or resetting its own overrides (resetting falls back to the site's).
 */
export const ChargePointAlertThresholdsSection = ({
  chargePointId,
}: ChargePointAlertThresholdsSectionProps) => {
  const t = useTranslations("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { thresholds, effective, loading, error, updateThresholds, resetThresholds, isSaving } =
    useChargePointAlertThresholds(chargePointId);

  const handleSubmit = async (patch: Parameters<typeof updateThresholds>[0]) => {
    await updateThresholds(patch);
    setDialogOpen(false);
  };

  return (
    <section className="space-y-3 rounded-lg border bg-card p-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("appPage.chargePoints.detail.alertThresholds.title")}
      </h3>

      {loading && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.detail.alertThresholds.loading")}
        </span>
      )}

      {!loading && error && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.detail.alertThresholds.loadError")}
        </span>
      )}

      {!loading && !error && effective && (
        <>
          <p className="text-xs text-muted-foreground">
            {t("appPage.chargePoints.detail.alertThresholds.intro")}
          </p>
          <AlertThresholdsSummary effective={effective} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <BellRing className="mr-2 h-4 w-4" />
              {t("appPage.chargePoints.detail.alertThresholds.editButton")}
            </Button>
            {thresholds && (
              <Button variant="ghost" loading={isSaving} onClick={() => void resetThresholds()}>
                {!isSaving && <RotateCcw className="mr-2 h-4 w-4" />}
                {t("appPage.chargePoints.detail.alertThresholds.resetButton")}
              </Button>
            )}
          </div>
        </>
      )}

      <AlertThresholdsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={t("appPage.chargePoints.detail.alertThresholds.dialog.title")}
        description={t("appPage.chargePoints.detail.alertThresholds.dialog.description")}
        overrides={thresholds}
        effective={effective}
        onSubmit={handleSubmit}
        isSubmitting={isSaving}
      />
    </section>
  );
};
