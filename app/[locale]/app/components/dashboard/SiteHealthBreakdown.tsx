import { SiteHealth } from "@watchborne/charge-points-types";
import { StatCard } from "@watchborne/electrons";
import { MapPin, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { useTranslations } from "next-intl";

/** Global roll-up above the per-site watchlist/list: how many sites are in
 * each health bucket, and how many charge points are affected fleet-wide
 * (offline or warning, summed across every site). */
export const SiteHealthBreakdown = ({ sitesHealth }: { sitesHealth: SiteHealth[] }) => {
  const t = useTranslations("");

  const totalSites = sitesHealth.length;
  const healthyCount = sitesHealth.filter((health) => health.status === "HEALTHY").length;
  const degradedCount = sitesHealth.filter((health) => health.status === "DEGRADED").length;
  const criticalCount = sitesHealth.filter((health) => health.status === "CRITICAL").length;
  const affectedChargePoints = sitesHealth.reduce(
    (sum, health) => sum + health.chargePointsOffline + health.chargePointsWarning,
    0,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("appPage.dashboard.siteHealth.sectionTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("appPage.dashboard.siteHealth.affectedChargePoints", { count: affectedChargePoints })}
        </p>
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          title={t("appPage.dashboard.siteHealth.stats.total")}
          value={totalSites}
          icon={<MapPin className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          title={t("appPage.dashboard.siteHealth.stats.healthy")}
          value={healthyCount}
          icon={<ShieldCheck className="h-5 w-5 text-status-available-foreground" />}
        />
        <StatCard
          title={t("appPage.dashboard.siteHealth.stats.degraded")}
          value={degradedCount}
          icon={<ShieldAlert className="h-5 w-5 text-status-warning-foreground" />}
        />
        <StatCard
          title={t("appPage.dashboard.siteHealth.stats.critical")}
          value={criticalCount}
          icon={<ShieldX className="h-5 w-5 text-status-error-foreground" />}
        />
      </div>
    </div>
  );
};
