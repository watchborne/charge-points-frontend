import { SiteHealthStatus } from "@watchborne/charge-points-types";

import { GenericStatusBadge } from "@/app/[locale]/app/components/common/GenericStatusBadge";
import { siteHealthStatusColor } from "@/lib/status";

const STATUS_LABEL_KEY: Record<SiteHealthStatus, string> = {
  HEALTHY: "appPage.dashboard.siteHealth.status.healthy",
  DEGRADED: "appPage.dashboard.siteHealth.status.degraded",
  CRITICAL: "appPage.dashboard.siteHealth.status.critical",
};

export const SiteHealthBadge = ({ status }: { status: SiteHealthStatus }) => (
  <GenericStatusBadge
    status={status}
    getTone={siteHealthStatusColor}
    getLabelKey={(s) => STATUS_LABEL_KEY[s]}
  />
);
