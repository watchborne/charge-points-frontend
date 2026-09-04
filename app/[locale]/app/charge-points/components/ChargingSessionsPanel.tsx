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
import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, useState } from "react";

import { formatDurationShort } from "@/lib/status-history";
import type { ChargePoint } from "@/types/charge-point";

import { SessionConsumptionChart } from "./SessionConsumptionChart";

/**
 * The fields this panel actually reads off `ChargingSession` — narrow enough
 * that `ChargingSessionsPanelContainer`'s real fetch and a caller supplying
 * plain literals (the marketing site's product preview) both satisfy it
 * without either one fabricating the full shared-package shape.
 * `startedAt`/`endedAt` accept `Date | string` since this panel only ever
 * wraps them in `new Date(...)`, which accepts both.
 */
export type ChargingSessionListEntry = Pick<
  ChargingSession,
  "id" | "connectorId" | "status" | "stoppedReason" | "meterStart" | "meterStop"
> & {
  startedAt: Date | string;
  endedAt: Date | string | null;
};

type ChargingSessionsPanelProps = {
  chargePointId: ChargePoint["id"];
  sessions: ChargingSessionListEntry[];
};

/** Wh when the wire actually carried both bounds — 1.6-only (ADR 0012 in
 * charge-points-server); a 2.0.1 session has neither, and this is never
 * guessed from anything else. */
const energyDelivered = (session: ChargingSessionListEntry): number | null =>
  session.meterStart !== undefined && session.meterStop !== undefined
    ? session.meterStop - session.meterStart
    : null;

/**
 * The charging-session history section of a charge point's detail panel:
 * one row per `StartTransaction`/`StopTransaction` pair (OCPP 1.6) or
 * `Started`/.../`Ended` `TransactionEvent` sequence (OCPP 2.0.1), across
 * every connector — the `charge-points-server` ADR 0012 REST read
 * (`GET /api/charge-points/:id/charging-sessions`) surfaced directly.
 *
 * Purely presentational — `ChargingSessionsPanelContainer` owns the fetch
 * and renders its own loading/error state in place of this component, so
 * `sessions` here is always the loaded list; the marketing site's product
 * preview can render this directly with static data instead of duplicating
 * the markup. `chargePointId` is only used to scope the expandable
 * per-session `SessionConsumptionChart` fetch — it plays no part in the
 * table itself.
 */
export const ChargingSessionsPanel = ({ chargePointId, sessions }: ChargingSessionsPanelProps) => {
  const t = useTranslations("");

  // Which sessions have their consumption chart expanded — several can be
  // open at once, each fetching independently.
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
    <div className="flex flex-col gap-3 p-3">
      <span className="text-sm text-muted-foreground">
        {t("appPage.chargePoints.chargingSessions.title")}
      </span>

      {sessions.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.chargingSessions.empty")}
        </span>
      )}

      {sessions.length > 0 && (
        <div className="max-h-[420px] overflow-auto rounded-md border">
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
                      <TableCell className="text-xs">
                        {format(new Date(session.startedAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs">{formatDurationShort(durationMs)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {energy === null ? "—" : `${energy.toLocaleString()} Wh`}
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <SessionConsumptionChart
                            chargePointId={chargePointId}
                            connectorId={session.connectorId}
                            startedAt={session.startedAt}
                            endedAt={session.endedAt}
                          />
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
