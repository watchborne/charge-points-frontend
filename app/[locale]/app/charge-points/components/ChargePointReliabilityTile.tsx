"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { ChargePointUptime } from "@/lib/api-uptime";
import type { ChargePoint } from "@/types/charge-point";

type ChargePointReliabilityTileProps = {
  chargePointId: ChargePoint["id"];
};

/**
 * Formats `onlineMs`/`totalMs` into a percentage string. `null` for a
 * zero-length window — division by zero is not "0%", it's "no window was
 * actually reduced" (charge-points-server's own `UptimeSummary` leaves this
 * undivided for exactly this reason).
 */
const formatPercentage = (uptime: ChargePointUptime): string | null =>
  uptime.totalMs > 0 ? `${((uptime.onlineMs / uptime.totalMs) * 100).toFixed(1)}%` : null;

/**
 * A charge point's reliability over the last 7 days — the % of the window it
 * spent in any status other than OFFLINE, reduced server-side from its
 * connection-state history (charge-points-server ADR 0008) rather than
 * shipped as raw transitions. Deliberately named "reliability", not
 * "availability" or "uptime": both words are already taken by other UI
 * elements on this page — `appPage.chargePoints.availability` is the
 * ChangeAvailability (Operative/Inoperative) command, and
 * `appPage.dashboard.uptime` is "how long since the last status change," a
 * different, instantaneous fact. This is a historical reliability rate, not
 * either of those.
 *
 * A single headline figure, not a chart: the backend endpoint reduces one
 * window to one summary, no daily breakdown exists (yet) to plot. Fetch-once
 * and self-contained, the same shape as `SecurityEventsPanel` — no dedicated
 * WebSocket broadcast for this exists either.
 */
export const ChargePointReliabilityTile = ({ chargePointId }: ChargePointReliabilityTileProps) => {
  const t = useTranslations("");

  const [uptime, setUptime] = useState<ChargePointUptime | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Reset before refetching so a different station's figure is never shown
    // under this one while the request is in flight.
    setUptime(null);
    setLoading(true);
    setFailed(false);

    void (async () => {
      try {
        const result = await api.Uptime.getChargePointUptime(chargePointId);
        if (!cancelled) setUptime(result);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chargePointId]);

  const percentage = uptime ? formatPercentage(uptime) : null;

  return (
    <div className="flex flex-col rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t("appPage.chargePoints.reliability.title")}
        </p>
        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <p className="text-lg font-bold text-foreground">
        {loading
          ? "—"
          : failed
            ? t("common.error")
            : (percentage ?? t("appPage.chargePoints.reliability.noData"))}
      </p>

      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {t("appPage.chargePoints.reliability.window")}
      </p>
    </div>
  );
};
