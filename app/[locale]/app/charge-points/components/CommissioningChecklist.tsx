import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { ChargePointWithConnectors } from "@/types/charge-point";

type CommissioningChecklistProps = {
  chargePoint: ChargePointWithConnectors;
};

/**
 * Passive commissioning self-test: a readiness checklist derived purely from the
 * charge point's live state (connection status + reported connectors). It asks
 * no new question of the station — it reflects what the supervisor already knows
 * — so it confirms, before an installer finishes, that the station is actually
 * talking and its connectors are reporting.
 */
export const CommissioningChecklist = ({ chargePoint }: CommissioningChecklistProps) => {
  const t = useTranslations("");

  const checks = [
    {
      key: "online",
      label: t("appPage.chargePoints.commissioning.selfTest.online"),
      passed:
        chargePoint.connection.status === "CONNECTED" || chargePoint.connection.status === "SYNCED",
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
