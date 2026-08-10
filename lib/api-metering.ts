import type { ChargePoint } from "@watchborne/charge-points-types";

import { httpClient } from "./http-client";

// The metering reads' response shapes. Not part of
// @watchborne/charge-points-types on purpose: the backend keeps `MeterSample` as
// a server-local domain type (ADR 0004) because no client consumes it as a
// domain entity — the dashboard codes against these response contracts, the same
// arrangement as `Me` in api-me.ts. Timestamps arrive as ISO strings over JSON
// and are parsed where they are rendered, never widened to `Date` here.

/** One stored measurement, as `GET /api/charge-points/:id/meter-samples` returns it. */
export type MeterSample = {
  id: string;
  chargePointId: string;
  /** The OCPP connector ordinal, as on `Connector.connectorId` — not a UUID. */
  connectorId: number;
  /** ISO string: the station's own reading time, not when the supervisor stored it. */
  measuredAt: string;
  measurand: string;
  phase?: string;
  unit?: string;
  context?: string;
  /** The measurement in `unit`. No conversion is applied server-side. */
  value: number;
  createdAt: string;
};

/**
 * One `(connector, measurand, unit)` series reduced over the window.
 *
 * `min`/`max`/`avg` are reported without interpretation, deliberately: on a
 * cumulative register (`Energy.Active.Import.Register`) `max - min` is the energy
 * delivered over the window, while on an instantaneous measurand
 * (`Power.Active.Import`) `avg`/`max` are the useful figures and the difference
 * means nothing. Deciding which reading applies is the caller's job — see
 * `isCumulativeRegister`.
 */
export type MeterSampleSummary = {
  connectorId: number;
  measurand: string;
  unit?: string;
  min: number;
  max: number;
  avg: number;
  sampleCount: number;
  firstMeasuredAt: string;
  lastMeasuredAt: string;
};

export type ChargePointConsumption = {
  chargePointId: string;
  /** The window the backend actually reduced — echoed back, so a caller that passed no bounds knows. */
  from: string;
  to: string;
  series: MeterSampleSummary[];
};

export type MeterSamplesQuery = {
  connectorId?: number;
  from?: Date;
  to?: Date;
  /** Repeated as `?measurand=` per entry; an empty list means "every measurand". */
  measurands?: string[];
  limit?: number;
};

/**
 * OCPP's `measurand` is an open vocabulary, so this is a suffix test rather than
 * a list: anything ending in `.Register` is a meter register that only ever
 * counts up, which is what makes `max - min` its energy over the window. Every
 * other measurand is a spot reading.
 */
export const isCumulativeRegister = (measurand: string): boolean => measurand.endsWith(".Register");

const buildQuery = ({ connectorId, from, to, measurands, limit }: MeterSamplesQuery): string => {
  const params = new URLSearchParams();

  if (connectorId !== undefined) params.set("connectorId", String(connectorId));
  if (from) params.set("from", from.toISOString());
  if (to) params.set("to", to.toISOString());
  if (limit !== undefined) params.set("limit", String(limit));
  // `append`, not `set`: the backend reads a repeated `?measurand=` as the filter
  // list, and the API proxy forwards duplicates (see lib/proxy-request.ts).
  measurands?.forEach((measurand) => params.append("measurand", measurand));

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const meteringApis = {
  getMeterSamples: async function (
    chargePointId: ChargePoint["id"],
    query: MeterSamplesQuery = {},
  ): Promise<MeterSample[]> {
    try {
      return await httpClient.get<MeterSample[]>(
        `/api/charge-points/${chargePointId}/meter-samples${buildQuery(query)}`,
      );
    } catch (error) {
      console.error(`Failed to fetch meter samples of charge point ${chargePointId}`, error);
      throw error;
    }
  },
  getConsumption: async function (
    chargePointId: ChargePoint["id"],
    query: Omit<MeterSamplesQuery, "limit"> = {},
  ): Promise<ChargePointConsumption> {
    try {
      return await httpClient.get<ChargePointConsumption>(
        `/api/charge-points/${chargePointId}/consumption${buildQuery(query)}`,
      );
    } catch (error) {
      console.error(`Failed to fetch consumption of charge point ${chargePointId}`, error);
      throw error;
    }
  },
};
