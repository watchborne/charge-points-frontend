import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { ChargePointWithConnectors } from "@/types/charge-point";

type CommissioningChecklistProps = {
  chargePoint: ChargePointWithConnectors;
};

/**
 * A readiness checklist derived from the charge point's live state (site,
 * connection, OCPP version, connectors), asking nothing of the station.
 */
export const CommissioningChecklist = ({ chargePoint }: CommissioningChecklistProps) => {
  const t = useTranslations("");

  const ocppVersionKnown = chargePoint.connection.lastSeenAt !== null;

  const checks = [
    {
      key: "site",
      label: t("appPage.chargePoints.commissioning.selfTest.site"),
      passed: chargePoint.siteId !== null,
    },
    {
      key: "online",
      label: t("appPage.chargePoints.commissioning.selfTest.online"),
      passed:
        chargePoint.connection.status === "CONNECTED" || chargePoint.connection.status === "SYNCED",
    },
    {
      key: "bootAccepted",
      label: t("appPage.chargePoints.commissioning.selfTest.bootAccepted"),
      passed: chargePoint.connection.status === "SYNCED",
    },
    {
      key: "ocppVersionKnown",
      // Name the negotiated dialect only once confirmed: before that,
      // ocppVersion is the "1.6" creation default.
      label: ocppVersionKnown
        ? t("appPage.chargePoints.commissioning.selfTest.ocppVersionKnownWithVersion", {
            version: chargePoint.ocppVersion,
          })
        : t("appPage.chargePoints.commissioning.selfTest.ocppVersionKnown"),
      // The version is reconciled on first connection, when lastSeenAt is set;
      // lastSeenAt never reverts to null, unlike connection.status.
      passed: ocppVersionKnown,
    },
    {
      key: "connectors",
      label: t("appPage.chargePoints.commissioning.selfTest.connectors"),
      passed: chargePoint.connectors.length > 0,
    },
  ];

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {t("appPage.chargePoints.commissioning.selfTest.title")}
      </p>
      <ul className="flex flex-col gap-1.5">
        {checks.map((check) => (
          <li key={check.key} className="flex items-center gap-2 text-sm">
            {check.passed ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-status-available-foreground" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <span className={check.passed ? undefined : "text-muted-foreground"}>
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
