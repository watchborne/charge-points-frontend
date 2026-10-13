import type { Site } from "@watchborne/charge-points-types";
import { Button } from "@watchborne/electrons";
import { BellRing, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AlertThresholdsDialog } from "../../components/alert-thresholds/AlertThresholdsDialog";
import { AlertThresholdsSummary } from "../../components/alert-thresholds/AlertThresholdsSummary";
import { useSiteAlertThresholds } from "../../hooks/useSiteAlertThresholds";

type SiteAlertThresholdsSectionProps = {
  siteId: Site["id"];
  className?: string;
};

/**
 * A site's alert thresholds on its detail page (charge-points-server issue #577):
 * what its charge points are judged by today, where each value comes from, and the
 * way to change or reset it. Self-contained, like the tariff's data flow: it owns
 * its query, its dialog and its mutations.
 */
export const SiteAlertThresholdsSection = ({
  siteId,
  className,
}: SiteAlertThresholdsSectionProps) => {
  const t = useTranslations("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { thresholds, effective, loading, error, updateThresholds, resetThresholds, isSaving } =
    useSiteAlertThresholds(siteId);

  const handleSubmit = async (patch: Parameters<typeof updateThresholds>[0]) => {
    await updateThresholds(patch);
    setDialogOpen(false);
  };

  return (
    <section className={className}>
      <h2 className="text-sm font-semibold text-foreground">
        {t("appPage.sites.detail.alertThresholds.title")}
      </h2>

      {loading && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.sites.detail.alertThresholds.loading")}
        </span>
      )}

      {!loading && error && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.sites.detail.alertThresholds.loadError")}
        </span>
      )}

      {!loading && !error && effective && (
        <>
          <p className="text-xs text-muted-foreground">
            {t("appPage.sites.detail.alertThresholds.intro")}
          </p>
          <AlertThresholdsSummary effective={effective} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <BellRing className="mr-2 h-4 w-4" />
              {t("appPage.sites.detail.alertThresholds.editButton")}
            </Button>
            {thresholds && (
              <Button variant="ghost" loading={isSaving} onClick={() => void resetThresholds()}>
                {!isSaving && <RotateCcw className="mr-2 h-4 w-4" />}
                {t("appPage.sites.detail.alertThresholds.resetButton")}
              </Button>
            )}
          </div>
        </>
      )}

      <AlertThresholdsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={t("appPage.sites.detail.alertThresholds.dialog.title")}
        description={t("appPage.sites.detail.alertThresholds.dialog.description")}
        overrides={thresholds}
        effective={effective}
        onSubmit={handleSubmit}
        isSubmitting={isSaving}
      />
    </section>
  );
};
