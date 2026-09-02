import type { ChargePoint } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The uptime reads' response shapes. Not part of @watchborne/charge-points-types
// on purpose, like ChargePointConsumption in api-metering.ts: the backend keeps
// this server-local (charge-points-server ADR 0008's derived summary) since no
// client consumes it as a domain entity — the dashboard codes against these
// response contracts. Timestamps arrive as ISO strings and are parsed where
// rendered, never widened to `Date` here.

export type UptimeQuery = { from?: Date; to?: Date };

/**
 * A charge point's connection-state history (ADR 0008) reduced to time spent
 * in any status other than OFFLINE, over the window `from`..`to`. Left as two
 * durations rather than a single percentage, same reason `MeterSampleSummary`
 * leaves `min`/`max`/`avg` uninterpreted — the caller divides.
 */
export type ChargePointUptime = {
  chargePointId: string;
  /** The window the backend actually reduced — echoed back, so a caller that passed no bounds knows. */
  from: string;
  to: string;
  onlineMs: number;
  totalMs: number;
};

export const buildUptimeQuery = ({ from, to }: UptimeQuery): string => {
  const params = new URLSearchParams();
  if (from) params.set("from", from.toISOString());
  if (to) params.set("to", to.toISOString());

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const uptimeApis = {
  getChargePointUptime: async function (
    chargePointId: ChargePoint["id"],
    query: UptimeQuery = {},
  ): Promise<ChargePointUptime> {
    return withErrorLogging(
      () =>
        httpClient.get<ChargePointUptime>(
          `/api/charge-points/${chargePointId}/uptime${buildUptimeQuery(query)}`,
        ),
      `Uptime.getChargePointUptime(${chargePointId})`,
    );
  },
};
