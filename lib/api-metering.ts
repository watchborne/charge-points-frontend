import type {
  ChargePoint,
  ChargePointConsumption as SharedChargePointConsumption,
  MeterSample as SharedMeterSample,
  MeterSampleSummary as SharedMeterSampleSummary,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

// The metering reads' response shapes: the shared `MeterSample`,
// `MeterSampleSummary` and `ChargePointConsumption` (@watchborne/charge-points-types),
// as they look once serialized to JSON — timestamps arrive as ISO strings and are
// parsed where rendered (see `Wire`). charge-points-server ADR 0004.
//
// `min`/`max`/`avg` of a summary are reported without interpretation, deliberately:
// on a cumulative register `max - min` is the energy delivered over the window,
// while on an instantaneous measurand `avg`/`max` are the useful figures. Deciding
// which applies is the caller's job — see `isCumulativeRegister`.

/** One stored measurement, as `GET /api/charge-points/:id/meter-samples` returns it. */
export type MeterSample = Wire<SharedMeterSample>;

/** One `(connector, measurand, unit)` series reduced over the window. */
export type MeterSampleSummary = Wire<SharedMeterSampleSummary>;

/** The window the backend actually reduced (echoed back), with its series. */
export type ChargePointConsumption = Wire<SharedChargePointConsumption>;

export type MeterSamplesQuery = {
  connectorId?: number;
  from?: Date;
  to?: Date;
  /** Repeated as `?measurand=` per entry; an empty list means "every measurand". */
  measurands?: string[];
  limit?: number;
};

export { isCumulativeRegister } from "@watchborne/charge-points-types";

const buildQuery = ({ connectorId, from, to, measurands, limit }: MeterSamplesQuery): string => {
  const params = new URLSearchParams();

  if (connectorId !== undefined) params.set("connectorId", String(connectorId));
  if (from) params.set("from", from.toISOString());
  if (to) params.set("to", to.toISOString());
  if (limit !== undefined) params.set("limit", String(limit));
  // `append`, not `set`: the backend reads a repeated `?measurand=` as the
  // filter list, and the API proxy forwards duplicates (lib/proxy-request.ts).
  measurands?.forEach((measurand) => params.append("measurand", measurand));

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const meteringApis = {
  getMeterSamples: async function (
    chargePointId: ChargePoint["id"],
    query: MeterSamplesQuery = {},
  ): Promise<MeterSample[]> {
    return withErrorLogging(
      () =>
        httpClient.get<MeterSample[]>(
          `/api/charge-points/${chargePointId}/meter-samples${buildQuery(query)}`,
        ),
      `Metering.getMeterSamples(${chargePointId})`,
    );
  },
  getConsumption: async function (
    chargePointId: ChargePoint["id"],
    query: Omit<MeterSamplesQuery, "limit"> = {},
  ): Promise<ChargePointConsumption> {
    return withErrorLogging(
      () =>
        httpClient.get<ChargePointConsumption>(
          `/api/charge-points/${chargePointId}/consumption${buildQuery(query)}`,
        ),
      `Metering.getConsumption(${chargePointId})`,
    );
  },
};
