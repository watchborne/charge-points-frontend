import type {
  ChargePoint,
  MessagePriorityV201,
  MessageStateV201,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The NotifyDisplayMessages history's response shape. Not part of
// @watchborne/charge-points-types on purpose, same reasoning as
// DeviceVariableReport: the backend keeps DisplayMessageReport server-local
// (charge-points-server, issue #536) since no client consumes it as a
// domain entity. Timestamps arrive as ISO strings and are parsed where
// rendered, never widened to `Date` here.

export type DisplayMessageContent = {
  format: string;
  content: string;
  language?: string;
};

/** One message a station is (or was) showing, as a NotifyDisplayMessages frame carries it. */
export type DisplayMessageInfo = {
  id: number;
  priority: MessagePriorityV201;
  state?: MessageStateV201;
  /** ISO string. */
  startDateTime?: string;
  /** ISO string. */
  endDateTime?: string;
  message: DisplayMessageContent;
};

/** One NotifyDisplayMessages frame, as `GET /api/charge-points/:id/display-message-reports` returns it. */
export type DisplayMessageReport = {
  id: string;
  chargePointId: string;
  requestId: number;
  tbc: boolean;
  messageInfo: DisplayMessageInfo[];
  /** ISO string. */
  createdAt: string;
};

/**
 * One outstanding GetDisplayMessages request (charge-points-server, same
 * ADR 0014 shape as ReportRequest). Not part of @watchborne/charge-points-types
 * either — the POST endpoint below returns it inline; there is no GET route
 * for it on its own.
 */
export type DisplayMessageRequest = {
  id: string;
  chargePointId: string;
  requestId: number;
  /** ISO string. */
  startedAt: string;
  /** ISO string, or `null` while still awaiting NotifyDisplayMessages frame(s). */
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GetDisplayMessagesStatus = "Accepted" | "Unknown";

/**
 * Same discriminated-result shape as `RequestDeviceReportOutcome`: the
 * caller needs the specific HTTP outcome, not just success/failure.
 */
export type GetDisplayMessagesOutcome =
  | { ok: true; status: GetDisplayMessagesStatus; displayMessageRequest: DisplayMessageRequest }
  | { ok: false; httpStatus: number };

export const displayMessageApis = {
  list: async function (
    chargePointId: ChargePoint["id"],
    limit?: number,
  ): Promise<DisplayMessageReport[]> {
    return withErrorLogging(() => {
      const query = limit === undefined ? "" : `?limit=${limit}`;
      return httpClient.get<DisplayMessageReport[]>(
        `/api/charge-points/${chargePointId}/display-message-reports${query}`,
      );
    }, `DisplayMessageReport.list(${chargePointId})`);
  },
  /**
   * Requests every display message currently set on a station (OCPP
   * `GetDisplayMessages`, 2.0.1 only) — always unfiltered: id/priority/state
   * filtering isn't exposed, this reads the full set every time, never a
   * slice of it. Acknowledgment-only: the actual messages arrive later as
   * one or more `NotifyDisplayMessages` frames, which `DisplayMessagesPanel`'s
   * history picks up on its next fetch.
   */
  requestAll: async function (
    chargePointId: ChargePoint["id"],
  ): Promise<GetDisplayMessagesOutcome> {
    try {
      const response = await fetch(`/api/charge-points/${chargePointId}/display-message-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const { status, displayMessageRequest } = (await response.json()) as {
          status: GetDisplayMessagesStatus;
          displayMessageRequest: DisplayMessageRequest;
        };
        return { ok: true, status, displayMessageRequest };
      }

      return { ok: false, httpStatus: response.status };
    } catch (error) {
      console.error(`Failed to request display messages on charge point ${chargePointId}`, error);
      return { ok: false, httpStatus: 0 };
    }
  },
};
