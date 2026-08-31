"use client";

import type { ChargingSession } from "@watchborne/charge-points-types";
import {
  Badge,
  Callout,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@watchborne/electrons";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import { formatDurationShort } from "@/lib/status-history";
import type { ChargePoint } from "@/types/charge-point";

type ChargingSessionsPanelProps = {
  chargePointId: ChargePoint["id"];
};

/** A glance at recent activity, not a full audit log — same role
 * `VISIBLE_HISTORY_COUNT` plays for `LogUploadPanel`, scaled up: a session
 * opens on every plug-in, far more often than a log upload. */
const VISIBLE_HISTORY_COUNT = 20;

/** Wh when the wire actually carried both bounds — 1.6-only (ADR 0012 in
 * charge-points-server); a 2.0.1 session has neither, and this is never
 * guessed from anything else. */
const energyDelivered = (session: ChargingSession): number | null =>
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
 * Self-contained and fetch-once, like `AlertsPanel`/`SecurityEventsPanel`/
 * `LogUploadPanel`: there is no dedicated WebSocket broadcast for this yet.
 */
export const ChargingSessionsPanel = ({ chargePointId }: ChargingSessionsPanelProps) => {
  const t = useTranslations("");

  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      const recent = await api.ChargePoints.listChargingSessions(
        chargePointId,
        VISIBLE_HISTORY_COUNT,
      );
      setSessions(recent);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [chargePointId]);

  useEffect(() => {
    // Reset before refetching so a different station's sessions are never
    // shown under this one while the request is in flight.
    setSessions([]);
    setLoading(true);
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <span className="text-sm text-muted-foreground">
        {t("appPage.chargePoints.chargingSessions.title")}
      </span>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("appPage.chargePoints.chargingSessions.loading")}
        </div>
      )}

      {!loading && failed && (
        <Callout
          description={t("appPage.chargePoints.chargingSessions.loadError")}
          variant="error"
        />
      )}

      {!loading && !failed && sessions.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.chargingSessions.empty")}
        </span>
      )}

      {!loading && !failed && sessions.length > 0 && (
        <div className="max-h-[420px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
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

                return (
                  <TableRow key={session.id}>
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
