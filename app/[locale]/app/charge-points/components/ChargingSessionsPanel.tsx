"use client";

import type { ChargingSession } from "@watchborne/charge-points-types";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@watchborne/electrons";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Fragment, useState, type ReactNode } from "react";

import type { ChargingSessionCost } from "@/lib/api-charging-sessions";
import { useDateFormat } from "@/lib/date-format";
import { formatDurationShort } from "@/lib/status-history";
import type { ChargePoint } from "@/types/charge-point";

import { SessionConsumptionChartContainer } from "./SessionConsumptionChartContainer";

/**
 * The fields this panel reads off `ChargingSession`, narrow enough for both the
 * container's fetch and the marketing preview's literals. Timestamps accept
 * `Date | string` (only passed to `new Date`).
 */
export type ChargingSessionListEntry = Pick<
  ChargingSession,
  "id" | "connectorId" | "status" | "stoppedReason" | "meterStart" | "meterStop"
> & {
  startedAt: Date | string;
  endedAt: Date | string | null;
  /**
   * The estimated cost, for callers that already hold it (the marketing
   * preview); the dashboard uses `renderCost`. `undefined` means no estimate,
   * unlike an envelope whose `amountCents` is null.
   */
  cost?: ChargingSessionCost;
};

type ChargingSessionsPanelProps = {
  chargePointId: ChargePoint["id"];
  sessions: ChargingSessionListEntry[];
  /**
   * Overrides the expanded row's chart: the marketing preview passes a
   * fixture-fed chart instead of `SessionConsumptionChartContainer`.
   */
  renderSessionDetail?: (session: ChargingSessionListEntry) => ReactNode;
  /**
   * Overrides the cost cell: the dashboard fetches per row
   * (`ChargingSessionCostCell`); unset, `session.cost` is rendered.
   */
  renderCost?: (session: ChargingSessionListEntry) => ReactNode;
};

/** Wh when the wire carried both bounds (1.6 only); never guessed. */
const energyDelivered = (session: ChargingSessionListEntry): number | null =>
  session.meterStart !== undefined && session.meterStop !== undefined
    ? session.meterStop - session.meterStart
    : null;

/**
 * Only `NO_TARIFF_CONFIGURED` gets a label, being actionable; the other
 * reasons render a dash.
 */
export const CostCell = ({
  cost,
  intlFormat,
  t,
}: {
  cost: ChargingSessionCost | undefined;
  intlFormat: ReturnType<typeof useFormatter>;
  t: ReturnType<typeof useTranslations>;
}) => {
  if (!cost || cost.amountCents === null || cost.currency === null) {
    const label =
      cost?.reason === "NO_TARIFF_CONFIGURED"
        ? t("appPage.chargePoints.chargingSessions.costReasons.NO_TARIFF_CONFIGURED")
        : "—";
    return <span className="text-muted-foreground">{label}</span>;
  }

  return (
    <>{intlFormat.number(cost.amountCents / 100, { style: "currency", currency: cost.currency })}</>
  );
};

/**
 * A charge point's charging sessions across every connector: one row per
 * `StartTransaction`/`StopTransaction` pair (1.6) or `TransactionEvent`
 * sequence (2.0.1).
 *
 * Presentational: `ChargingSessionsPanelContainer` owns the fetch and the
 * loading/error states. `chargePointId` only scopes the per-session chart.
 */
export const ChargingSessionsPanel = ({
  chargePointId,
  sessions,
  renderSessionDetail,
  renderCost,
}: ChargingSessionsPanelProps) => {
  const t = useTranslations("");
  const { formatDateTime } = useDateFormat();
  const intlFormat = useFormatter();

  // Expanded sessions; several can be open, each fetching on its own.
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (sessionId: string) => {
    setExpandedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  return (
    // No padding: the tab body provides it, as for the sibling panels.
    <div className="flex flex-col gap-3">
      <span className="text-sm text-muted-foreground">
        {t("appPage.chargePoints.chargingSessions.title")}
      </span>

      {sessions.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.chargingSessions.empty")}
        </span>
      )}

      {sessions.length > 0 && (
        <div className="overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 text-xs" />
                <TableHead className="text-xs">
                  {t("appPage.chargePoints.chargingSessions.connector")}
                </TableHead>
                <TableHead className="text-xs">
                  {t("appPage.chargePoints.chargingSessions.status")}
                </TableHead>
                <TableHead className="text-xs">
                  {t("appPage.chargePoints.chargingSessions.startedAt")}
                </TableHead>
                <TableHead className="text-xs">
                  {t("appPage.chargePoints.chargingSessions.duration")}
                </TableHead>
                <TableHead className="text-right text-xs">
                  {t("appPage.chargePoints.chargingSessions.energy")}
                </TableHead>
                <TableHead className="text-right text-xs">
                  {t("appPage.chargePoints.chargingSessions.cost")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const energy = energyDelivered(session);
                const endedAt = session.endedAt ? new Date(session.endedAt) : null;
                const durationMs =
                  (endedAt ?? new Date()).getTime() - new Date(session.startedAt).getTime();
                const expanded = expandedSessionIds.has(session.id);

                return (
                  <Fragment key={session.id}>
                    <TableRow>
                      <TableCell className="text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          aria-label={t(
                            expanded
                              ? "appPage.chargePoints.chargingSessions.consumption.hide"
                              : "appPage.chargePoints.chargingSessions.consumption.show",
                          )}
                          onClick={() => toggleExpanded(session.id)}
                        >
                          {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs">{session.connectorId}</TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          variant={session.status === "ACTIVE" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {t(`appPage.chargePoints.chargingSessions.statuses.${session.status}`)}
                        </Badge>
                        {session.status === "ENDED" && session.stoppedReason && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground">
                            {t(
                              `appPage.chargePoints.chargingSessions.stoppedReasons.${session.stoppedReason}`,
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{formatDateTime(session.startedAt)}</TableCell>
                      <TableCell className="text-xs">{formatDurationShort(durationMs)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {energy === null ? "—" : `${energy.toLocaleString()} Wh`}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {renderCost ? (
                          renderCost(session)
                        ) : (
                          <CostCell cost={session.cost} intlFormat={intlFormat} t={t} />
                        )}
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          {renderSessionDetail ? (
                            renderSessionDetail(session)
                          ) : (
                            <SessionConsumptionChartContainer
                              chargePointId={chargePointId}
                              connectorId={session.connectorId}
                              startedAt={session.startedAt}
                              endedAt={session.endedAt}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
