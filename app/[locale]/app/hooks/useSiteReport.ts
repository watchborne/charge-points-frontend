import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Alert, Site } from "@watchborne/charge-points-types";

import { api } from "@/lib/api";
import type { ChargePointConsumption } from "@/lib/api-metering";
import type { SiteUptime, UptimeQuery } from "@/lib/api-uptime";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePointWithConnectors } from "@/types/charge-point";

/** One charge point's slice of a site report: its consumption summary over
 * the window plus the alerts opened during it. */
export type SiteReportChargePoint = {
  chargePointId: string;
  name: string;
  consumption: ChargePointConsumption;
  alerts: Alert[];
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

          return {
            chargePointId: cp.id,
            name: cp.name,
            consumption,
            alerts: alerts.filter((alert) => {
              const openedAt = new Date(alert.openedAt).getTime();
              return openedAt >= from && openedAt <= to;
            }),
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
