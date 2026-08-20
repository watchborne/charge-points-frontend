import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { ChargePointWithConnectors } from "@/types/charge-point";

type CommissioningChecklistProps = {
  chargePoint: ChargePointWithConnectors;
};

/**
 * Passive commissioning self-test: a readiness checklist derived purely from the
 * charge point's live state (site assignment, connection status, negotiated OCPP
 * version, reported connectors). It asks no new question of the station — it
 * reflects what the supervisor already knows — so it confirms, before an
 * installer finishes, that the dialog's own purpose (attaching the station to a
 * site) is actually done and the station is talking with its connectors
 * reporting.
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
      // Once confirmed, name the actual negotiated dialect rather than just
      // saying "confirmed" — chargePoint.ocppVersion is otherwise just the
      // "1.6" default a never-connected station is created with (see below),
      // so showing it before it's confirmed would read as a real answer.
      label: ocppVersionKnown
        ? t("appPage.chargePoints.commissioning.selfTest.ocppVersionKnownWithVersion", {
            version: chargePoint.ocppVersion,
          })
        : t("appPage.chargePoints.commissioning.selfTest.ocppVersionKnown"),
      // The negotiated OCPP version is reconciled server-side the moment a
      // station first connects (protocol/server.ts) — lastSeenAt is set at
      // that same moment and, unlike connection.status, never reverts to
      // null afterward, so it stays a reliable "we've heard from this
      // station" signal even once it has since gone offline.
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
