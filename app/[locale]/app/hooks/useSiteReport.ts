import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Alert, Site } from "@watchborne/charge-points-types";

import { api } from "@/lib/api";
import {
  isCumulativeRegister,
  type ChargePointConsumption,
  type MeterSample,
} from "@/lib/api-metering";
import type { SiteUptime, UptimeQuery } from "@/lib/api-uptime";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePointWithConnectors } from "@/types/charge-point";

import { MAX_CHART_SAMPLES } from "./useConsumption";
import { CHARTABLE_CONNECTORS } from "../charge-points/components/ConsumptionChart";

/**
 * One charge point's slice of a site report: its consumption summary over
 * the window, the alerts opened during it, and the raw readings behind its
 * printable chart.
 *
 * The charted measurand/connectors follow the exact same default rule as
 * `ChargePointConsumptionPanelContainer` (the energy register if the
 * station reports one, else alphabetically first) — a report shouldn't pick
 * a different "the" consumption figure than the dashboard the installer
 * already reads. `chartMeasurand` is `null` when the station reported no
 * consumption at all in the window, in which case `chartSamples` is empty.
 */
export type SiteReportChargePoint = {
  chargePointId: string;
  name: string;
  consumption: ChargePointConsumption;
  alerts: Alert[];
  chartMeasurand: string | null;
  /** Connector ordinals plotted, capped at `CHARTABLE_CONNECTORS` — same cap `ConsumptionChart` enforces everywhere else. */
  chartConnectorIds: number[];
  /** Oldest first, for `chartMeasurand` only — the backend returns newest first. */
  chartSamples: MeterSample[];
};

/**
 * A printable site report's assembled data (issue charge-points-server#532):
 * the site's aggregated uptime (`GetSiteUptimeQueryHandler`) plus, per
 * charge point on the site, its consumption summary and the alerts opened
 * during the window. `from`/`to` are the uptime read's own echoed window —
 * the backend independently defaults every unwindowed read to the same
 * "seven days ending now" rule, so this is representative of the whole
 * report without forcing every call onto one client-computed instant.
 */
export type SiteReport = {
  siteId: string;
  from: string;
  to: string;
  uptime: SiteUptime;
  chargePoints: SiteReportChargePoint[];
};

export type UseSiteReportReturn = {
  report: SiteReport | null;
  loading: boolean;
  failed: boolean;
};

/**
 * Assembles one site's printable report: fans out a consumption + alerts
 * read per charge point on the site, alongside one site-scoped uptime read,
 * and reduces them into a single report-shaped object. Kept separate from
 * rendering (per the issue's own delivery slicing) so it is unit-testable
 * against mocked API calls without touching PDF generation.
 *
 * `GET .../alerts` has no date-range filter (unlike consumption/uptime), so
 * alerts are filtered here to those opened within the resolved window — an
 * alert still open from before the window, or opened after it, isn't part
 * of "what happened in this window".
 */
export const useSiteReport = (
  site: Site | null,
  chargePoints: ChargePointWithConnectors[],
  window: UptimeQuery = {},
): UseSiteReportReturn => {
  const siteId = site?.id ?? null;
  const chargePointIds = chargePoints.map((cp) => cp.id);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.siteReport.site(siteId ?? "", {
      chargePointIds,
      from: window.from?.toISOString(),
      to: window.to?.toISOString(),
    }),
    queryFn: async (): Promise<SiteReport> => {
      const uptime = await api.Uptime.getSiteUptime(siteId!, window);
      const from = new Date(uptime.from).getTime();
      const to = new Date(uptime.to).getTime();

      const perChargePoint = await Promise.all(
        chargePoints.map(async (cp): Promise<SiteReportChargePoint> => {
          const [consumption, alerts] = await Promise.all([
            api.Metering.getConsumption(cp.id, window),
            api.ChargePoints.getAlerts(cp.id),
          ]);

          const measurands = Array.from(
            new Set(consumption.series.map((series) => series.measurand)),
          ).sort((a, b) => a.localeCompare(b));
          const chartMeasurand = measurands.find(isCumulativeRegister) ?? measurands[0] ?? null;

          const chartConnectorIds = chartMeasurand
            ? consumption.series
                .filter((series) => series.measurand === chartMeasurand)
                .sort((a, b) => a.connectorId - b.connectorId)
                .slice(0, CHARTABLE_CONNECTORS)
                .map((series) => series.connectorId)
            : [];

          const chartSamples = chartMeasurand
            ? await api.Metering.getMeterSamples(cp.id, {
                ...window,
                measurands: [chartMeasurand],
                limit: MAX_CHART_SAMPLES,
              })
            : [];

          return {
            chargePointId: cp.id,
            name: cp.name,
            consumption,
            alerts: alerts.filter((alert) => {
              const openedAt = new Date(alert.openedAt).getTime();
              return openedAt >= from && openedAt <= to;
            }),
            chartMeasurand,
            chartConnectorIds,
            chartSamples: [...chartSamples].sort(
              (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
            ),
          };
        }),
      );

      return {
        siteId: siteId!,
        from: uptime.from,
        to: uptime.to,
        uptime,
        chargePoints: perChargePoint,
      };
    },
    enabled: siteId !== null,
    placeholderData: keepPreviousData,
  });

  return {
    report: data ?? null,
    loading: isLoading,
    failed: isError,
  };
};
