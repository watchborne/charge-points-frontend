import { SiteHealth } from "@watchborne/charge-points-types";
import { StatCard } from "@watchborne/electrons";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

const STATUS_ICON_CLASS: Record<SiteHealth["status"], string> = {
  HEALTHY: "text-status-available-foreground",
  DEGRADED: "text-status-warning-foreground",
  CRITICAL: "text-status-error-foreground",
};

/**
 * The single fleet-wide tile on the dashboard: how many of the caller's sites
 * are HEALTHY right now, out of how many. The icon colour reflects the worst
 * status across all sites (CRITICAL > DEGRADED > HEALTHY), so a fleet with
 * even one troubled site reads as more than just a number.
 */
export const SiteHealthOverview = ({ sitesHealth }: { sitesHealth: SiteHealth[] }) => {
  const t = useTranslations("");

  const total = sitesHealth.length;
  const healthyCount = sitesHealth.filter((site) => site.status === "HEALTHY").length;
  const worstStatus: SiteHealth["status"] = sitesHealth.some((site) => site.status === "CRITICAL")
    ? "CRITICAL"
    : sitesHealth.some((site) => site.status === "DEGRADED")
      ? "DEGRADED"
      : "HEALTHY";
  const subtitle = total > 0 ? `${Math.round((healthyCount / total) * 100)}%` : "0%";

  return (
    <StatCard
      title={t("appPage.dashboard.siteHealth.title")}
      value={healthyCount}
      icon={<ShieldCheck className={`h-5 w-5 ${STATUS_ICON_CLASS[worstStatus]}`} />}
      subtitle={subtitle}
    />
  );
};
