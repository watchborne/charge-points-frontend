import { AlertStatus } from "@watchborne/charge-points-types";
import { StatusPill } from "@watchborne/electrons";
import { useTranslations } from "next-intl";

import { alertStatusTone } from "@/lib/status";

const STATUS_LABEL_KEY: Record<AlertStatus, string> = {
  OPEN: "appPage.chargePoints.alerts.status.open",
  RESOLVED: "appPage.chargePoints.alerts.status.resolved",
};

/** Thin domain-to-tone mapper over @watchborne/electrons's StatusPill. */
export const AlertStatusBadge = ({ status }: { status: AlertStatus }) => {
  const t = useTranslations("");
  const tone = alertStatusTone(status);

  return <StatusPill tone={tone}>{t(STATUS_LABEL_KEY[status])}</StatusPill>;
};
