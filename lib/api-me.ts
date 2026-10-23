import { ChargePoint } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// Mirrors the backend's CommissioningOutcome. `UNKNOWN_TOKEN` never appears in
// `Me.commissioningAttempts` (it can't be attributed to a caller).
export type CommissioningOutcome =
  "CLAIMED" | "UNKNOWN_TOKEN" | "ALREADY_CLAIMED_BY_OTHER" | "ALREADY_CLAIMED_BY_SELF";

// One of the caller's commissioning attempts: claimed, refused (owned by
// someone else) or recommissioned with a new token.
export type CommissioningAttempt = {
  id: string;
  chargePointId: string;
  attemptedAt: string;
  outcome: CommissioningOutcome;
};

// GET /api/me's envelope; not a domain entity.
export type Me = {
  userId: string;
  chargePoints: ChargePoint[];
  commissioningAttempts: CommissioningAttempt[];
};

export const meApis = {
  getMe: async function (): Promise<Me> {
    return withErrorLogging(() => httpClient.get<Me>("/api/me"), "Me.getMe");
  },
};
