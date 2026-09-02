"use client";

import { Callout } from "@watchborne/electrons";
import { format, formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";
import { Clock, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type {
  DeviceVariableReport,
  DeviceVariableReportEntry,
} from "@/lib/api-device-variable-reports";
import type { ChargePoint } from "@/types/charge-point";

type DeviceVariableReportsPanelProps = {
  chargePointId: ChargePoint["id"];
};

/** How many recent frames the panel fetches — a glance at the latest
 * inventory, not a full audit log, the same cap `SecurityEventsPanel`/
 * `DeviceEventsPanel` use. */
const VISIBLE_REPORT_COUNT = 5;

type FlatEntry = DeviceVariableReportEntry & { reportId: string; generatedAt: string };

/** Flattens each report's `entries[]` into one row per component/variable
 * pair, since a frame can bundle an entire inventory in one report. */
const flattenReports = (reports: DeviceVariableReport[]): FlatEntry[] =>
  reports.flatMap((report) =>
    report.entries.map((entry) => ({
      ...entry,
      reportId: report.id,
      generatedAt: report.generatedAt,
    })),
  );

const componentLabel = (entry: DeviceVariableReportEntry): string =>
  entry.variable.name ? `${entry.component.name} · ${entry.variable.name}` : entry.component.name;

/** "Actual: 30 · Target: 32" — only attributes carrying a value are shown. */
const attributesLabel = (entry: DeviceVariableReportEntry): string =>
  entry.attributes
    .filter((attribute) => attribute.value !== undefined)
    .map((attribute) => `${attribute.type ?? "Actual"}: ${attribute.value}`)
    .join(" · ");

/**
 * A charge point's `NotifyReport` history (charge-points-server ADR 0011):
 * variable-inventory reports a 2.0.1 station sends, unsolicited from this
 * supervisor's perspective (no `GetBaseReport`/`GetReport` is implemented),
 * store-only. Fetch-once and self-contained, the same shape as
 * `DeviceEventsPanel`.
 */
export const DeviceVariableReportsPanel = ({ chargePointId }: DeviceVariableReportsPanelProps) => {
  const t = useTranslations("");

  const [entries, setEntries] = useState<FlatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Reset before refetching so a different station's entries are never
    // shown under this one while the request is in flight.
    setEntries([]);
    setLoading(true);
    setFailed(false);

    void (async () => {
      try {
        const result = await api.DeviceVariableReports.list(chargePointId, VISIBLE_REPORT_COUNT);
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
      <h4 className="text-sm font-semibold">
        {t("appPage.chargePoints.deviceVariableReports.title")}
      </h4>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-pulse" />
          {t("appPage.chargePoints.deviceVariableReports.loading")}
        </div>
      )}

      {!loading && failed && (
        <Callout
          description={t("appPage.chargePoints.deviceVariableReports.loadError")}
          variant="error"
        />
      )}

      {!loading && !failed && entries.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t("appPage.chargePoints.deviceVariableReports.empty")}
        </span>
      )}

      {!loading && !failed && entries.length > 0 && (
        <div className="divide-y rounded-md border">
          {entries.map((entry, index) => (
            <div
              key={`${entry.reportId}-${entry.component.name}-${entry.variable.name}-${index}`}
              className="flex flex-col gap-1.5 px-3 py-2"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                {componentLabel(entry)}
              </span>

              {attributesLabel(entry) && (
                <span className="text-xs text-muted-foreground">{attributesLabel(entry)}</span>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>
                  {formatDistanceToNow(new Date(entry.generatedAt), {
                    addSuffix: true,
                    locale: enGB,
                  })}
                </span>
                <span>({format(new Date(entry.generatedAt), "dd/MM/yyyy HH:mm")})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
