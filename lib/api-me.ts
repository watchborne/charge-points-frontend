import { ChargePoint } from "@watchborne/charge-points-types";

import { httpClient } from "./http-client";

// Mirrors charge-points-server's CommissioningOutcome (src/domain/commissioning-attempt.ts).
// Not part of @watchborne/charge-points-types: server-local audit state, same
// reasoning as `Me` below. `UNKNOWN_TOKEN` never actually appears in `Me.commissioningAttempts`
// (an unresolved token can't be attributed to a caller — see charge-points-server issue #420) but
// is kept in the union for completeness with the shared vocabulary.
export type CommissioningOutcome =
  "CLAIMED" | "UNKNOWN_TOKEN" | "ALREADY_CLAIMED_BY_OTHER" | "ALREADY_CLAIMED_BY_SELF";

// One of the caller's own commissioning attempts (issue #420 /
// charge-points-frontend#278) — a station either claimed successfully with
// their token, refused because it already belongs to someone else, or
// recommissioned with a freshly regenerated token.
export type CommissioningAttempt = {
  id: string;
  chargePointId: string;
  attemptedAt: string;
  outcome: CommissioningOutcome;
};

// The auth envelope charge-points-server's GET /api/me returns — not a
// domain entity, so it isn't part of @watchborne/charge-points-types (see
// that route's schemas.ts for the same reasoning server-side).
export type Me = {
  userId: string;
  chargePoints: ChargePoint[];
  commissioningAttempts: CommissioningAttempt[];
};

export const meApis = {
  getMe: async function (): Promise<Me> {
    try {
      return await httpClient.get<Me>("/api/me");
    } catch (error) {
      console.error("Failed to fetch the current user", error);
      throw error;
    }
  },
};
