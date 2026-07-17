import { useTranslations } from "next-intl";

import { Skeleton } from "../../components/common/Skeleton";

export const FleetChargePointsPanelSkeleton = () => {
  const t = useTranslations("");

  return (
    <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <h3 className="text-lg font-semibold">{t("appPage.dashboard.fleetOverview")}</h3>

        <Skeleton className="w-56 h-6" />

        <Skeleton className="w-40 h-9" />
      </div>

      <div className="grid md:grid-cols-3">
        {/* Left sidebar - sites list */}
        <div className="border-b bg-muted/30 p-4 sm:p-6 md:border-b-0 md:border-r">
          <Skeleton className="h-5 w-32 mb-2" />

          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border p-3 bg-background overflow-hidden">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-20 mt-2" />
              </div>
            ))}
          </div>

          <Skeleton className="h-5 w-32 mb-2 mt-6" />

          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-lg border p-3 bg-background overflow-hidden">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-20 mt-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Right content - charge points list */}
        <div className="p-4 sm:p-6 md:col-span-2"></div>
      </div>
    </div>
  );
};
