import type {
  ChargePoint,
  ClearDisplayMessageStatusV201,
  MessagePriorityV201,
  SetDisplayMessageStatusV201,
} from "@watchborne/charge-points-types";

import { withErrorLoggingAsync } from "./api-error-wrapper";
import type { CommandOutcome } from "./command-outcome";
import { fetchWithFreshSession } from "./http-client";

export type SetDisplayMessageOutcome = CommandOutcome<{ status: SetDisplayMessageStatusV201 }>;

/**
 * A display message to push. `id` is caller-assigned, and is what
 * `clearDisplayMessage` targets. `format` is fixed to `UTF8`.
 */
export type SetDisplayMessageBody = {
  id: number;
  priority: MessagePriorityV201;
  content: string;
};

export type ClearDisplayMessageOutcome = CommandOutcome<{ status: ClearDisplayMessageStatusV201 }>;

export const displayMessageCommandApis = {
  /** Pushes a message to the station's physical display (OCPP `SetDisplayMessage`, 2.0.1-only). */
  setDisplayMessage: async function (
    chargePointId: ChargePoint["id"],
    body: SetDisplayMessageBody,
  ): Promise<SetDisplayMessageOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(
        `/api/charge-points/${chargePointId}/display-messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: {
              id: body.id,
              priority: body.priority,
              message: { format: "UTF8", content: body.content },
            },
          }),
        },
      );

      if (response.ok) {
        const { status } = (await response.json()) as { status: SetDisplayMessageStatusV201 };
        return { ok: true, status };
      }

      return { ok: false, httpStatus: response.status };
    }, "ChargePoint.setDisplayMessage");
  },
  /** Removes a previously set display message by id (OCPP `ClearDisplayMessage`, 2.0.1-only). */
  clearDisplayMessage: async function (
    chargePointId: ChargePoint["id"],
    messageId: number,
  ): Promise<ClearDisplayMessageOutcome> {
    return withErrorLoggingAsync(async () => {
      const response = await fetchWithFreshSession(
        `/api/charge-points/${chargePointId}/display-messages/${messageId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        const { status } = (await response.json()) as { status: ClearDisplayMessageStatusV201 };
        return { ok: true, status };
      }

      return { ok: false, httpStatus: response.status };
    }, "ChargePoint.clearDisplayMessage");
  },
};
