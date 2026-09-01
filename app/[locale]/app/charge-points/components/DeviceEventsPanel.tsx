"use client";

import { Callout } from "@watchborne/electrons";
import { format, formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import { CheckCircle2, Clock, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { DeviceEventEntry, DeviceEventReport } from "@/lib/api-device-events";
import type { ChargePoint } from "@/types/charge-point";

type DeviceEventsPanelProps = {
  chargePointId: ChargePoint["id"];
};

/** How many recent frames the panel fetches — a glance at recent activity,
 * not a full audit log, the same cap `SecurityEventsPanel`/`AlertsPanel` use. */
const VISIBLE_REPORT_COUNT = 5;

type FlatEntry = DeviceEventEntry & { reportId: string; generatedAt: string };

/** Flattens each report's `events[]` into one row per entry, since a frame
 * can bundle several unrelated component/variable reports together. */
const flattenReports = (reports: DeviceEventReport[]): FlatEntry[] =>
  reports.flatMap((report) =>
    report.events.map((event) => ({
      ...event,
      reportId: report.id,
      generatedAt: report.generatedAt,
    })),
  );

const componentLabel = (entry: DeviceEventEntry): string =>
  entry.variable.name ? `${entry.component.name} · ${entry.variable.name}` : entry.component.name;

/**
 * A charge point's `NotifyEvent` history (charge-points-server ADR 0011):
 * fault/variable-change reports a 2.0.1 station sends on its own initiative,
 * store-only — never projected onto `Connector.status` (no reliable
 * Component/Variable mapping exists, per the ADR). Fetch-once and
 * self-contained, the same shape as `SecurityEventsPanel`: there is no
 * dedicated WebSocket broadcast for these yet.
 */
export const DeviceEventsPanel = ({ chargePointId }: DeviceEventsPanelProps) => {
  const t = useTranslations("");

  const [entries, setEntries] = useState<FlatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Reset before refetching so a different station's events are never shown
    // under this one while the request is in flight.
    setEntries([]);
    setLoading(true);
    setFailed(false);

    void (async () => {
      try {
        const result = await api.DeviceEvents.list(chargePointId, VISIBLE_REPORT_COUNT);
        if (!cancelled) setEntries(flattenReports(result));
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

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold">{t("appPage.chargePoints.deviceEvents.title")}</h4>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-pulse" />
          {t("appPage.chargePoints.deviceEvents.loading")}
        </div>
      )}

      {!loading && failed && (
        <Callout description={t("appPage.chargePoints.deviceEvents.loadError")} variant="error" />
      )}

      {!loading && !failed && entries.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.deviceEvents.empty")}
        </span>
      )}

      {!loading && !failed && entries.length > 0 && (
        <div className="divide-y rounded-md border">
          {entries.map((entry, index) => (
            <div
              key={`${entry.reportId}-${entry.eventId}-${index}`}
              className="flex flex-col gap-1.5 px-3 py-2"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {entry.cleared ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Radio className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                {componentLabel(entry)}
              </span>

              <span className="text-xs text-muted-foreground">
                {t("appPage.chargePoints.deviceEvents.trigger")}: {entry.trigger} —{" "}
                {entry.actualValue}
              </span>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>
                  {formatDistanceToNow(new Date(entry.timestamp), {
                    addSuffix: true,
                    locale: enGB,
                  })}
                </span>
                <span>({format(new Date(entry.timestamp), "dd/MM/yyyy HH:mm")})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
