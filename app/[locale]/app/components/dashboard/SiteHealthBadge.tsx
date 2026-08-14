import { SiteHealthStatus } from "@watchborne/charge-points-types";
import classNames from "classnames";
import { useTranslations } from "next-intl";

import { siteHealthStatusTone, toneBadgeClass, toneDotClass } from "@/lib/status";

const STATUS_LABEL_KEY: Record<SiteHealthStatus, string> = {
  HEALTHY: "appPage.dashboard.siteHealth.status.healthy",
  DEGRADED: "appPage.dashboard.siteHealth.status.degraded",
  CRITICAL: "appPage.dashboard.siteHealth.status.critical",
};

/** Mirrors StatusBadge's pill shape (tinted background + dot), for a site's
 * aggregated health status rather than a charge point's connection status. */
export const SiteHealthBadge = ({ status }: { status: SiteHealthStatus }) => {
  const t = useTranslations("");
  const tone = siteHealthStatusTone(status);

  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        toneBadgeClass[tone],
      )}
    >
      <span className={classNames("h-2 w-2 rounded-full", toneDotClass[tone])} />
      {t(STATUS_LABEL_KEY[status])}
    </span>
  );
};
