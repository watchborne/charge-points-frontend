import { AlertStatus } from "@watchborne/charge-points-types";
import classNames from "classnames";
import { useTranslations } from "next-intl";

import { alertStatusTone, toneBadgeClass, toneDotClass } from "@/lib/status";

const STATUS_LABEL_KEY: Record<AlertStatus, string> = {
  OPEN: "appPage.chargePoints.alerts.status.open",
  RESOLVED: "appPage.chargePoints.alerts.status.resolved",
};

/** Mirrors SiteHealthBadge's pill shape (tinted background + dot), for one
 * alert's lifecycle state rather than a site's aggregated health. */
export const AlertStatusBadge = ({ status }: { status: AlertStatus }) => {
  const t = useTranslations("");
  const tone = alertStatusTone(status);

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
