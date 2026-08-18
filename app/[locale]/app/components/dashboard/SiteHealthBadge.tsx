import { SiteHealthStatus } from "@watchborne/charge-points-types";
import { StatusPill } from "@watchborne/electrons";
import { useTranslations } from "next-intl";

import { siteHealthStatusTone } from "@/lib/status";

const STATUS_LABEL_KEY: Record<SiteHealthStatus, string> = {
  HEALTHY: "appPage.dashboard.siteHealth.status.healthy",
  DEGRADED: "appPage.dashboard.siteHealth.status.degraded",
  CRITICAL: "appPage.dashboard.siteHealth.status.critical",
};

/** Thin domain-to-tone mapper over @watchborne/electrons's StatusPill (issue #7). */
export const SiteHealthBadge = ({ status }: { status: SiteHealthStatus }) => {
  const t = useTranslations("");
  const tone = siteHealthStatusTone(status);

  return <StatusPill tone={tone}>{t(STATUS_LABEL_KEY[status])}</StatusPill>;
};
