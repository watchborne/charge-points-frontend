import { Battery } from "lucide-react";
import { useTranslations } from "next-intl";

export const EmptyStateChargePoints = () => {
  const t = useTranslations("");

  return (
    <div className="bg-card rounded-lg border p-12 text-center">
      <Battery className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
      <p className="text-muted-foreground font-medium">
        {t("appPage.chargePoints.emptyState.noDetected")}
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        {t("appPage.chargePoints.emptyState.description")}
      </p>
    </div>
  );
};
