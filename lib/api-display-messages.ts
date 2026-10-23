import type {
  ChargePoint,
  GetDisplayMessagesStatusV201,
  MessageContentV201,
  MessageInfoV201,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import type { CommandOutcome } from "./command-outcome";
import { fetchWithFreshSession, httpClient } from "./http-client";
import type { Wire } from "./wire";

// The NotifyDisplayMessages history: the report row is declared locally, but
// each message is the shared OCPP 2.0.1 `MessageInfo`, seen through `Wire`.

export type DisplayMessageContent = Wire<MessageContentV201>;

/** One message a station is (or was) showing, as a NotifyDisplayMessages frame carries it. */
export type DisplayMessageInfo = Wire<MessageInfoV201>;

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
 * One outstanding GetDisplayMessages request, returned inline by the POST
 * below; there is no GET for it.
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

export type GetDisplayMessagesStatus = GetDisplayMessagesStatusV201;

export type GetDisplayMessagesOutcome = CommandOutcome<{
  status: GetDisplayMessagesStatus;
  displayMessageRequest: DisplayMessageRequest;
}>;

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
   * Requests every display message on a station (`GetDisplayMessages`, 2.0.1),
   * unfiltered. The station only acknowledges; the messages arrive as
   * `NotifyDisplayMessages` frames picked up on the panel's next fetch.
   */
  requestAll: async function (
    chargePointId: ChargePoint["id"],
  ): Promise<GetDisplayMessagesOutcome> {
    try {
      const response = await fetchWithFreshSession(
        `/api/charge-points/${chargePointId}/display-message-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

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
