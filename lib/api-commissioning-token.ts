import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The auth envelope charge-points-server's /api/me/commissioning-token routes
// return — not a domain entity, so it isn't part of
// @watchborne/charge-points-types (same reasoning as lib/api-me.ts's `Me`).
export type CommissioningTokenStatus = {
  hasToken: boolean;
  createdAt: string | null;
};

export type IssuedCommissioningToken = {
  token: string;
  createdAt: string;
};

export const commissioningTokenApis = {
  getStatus: async function (): Promise<CommissioningTokenStatus> {
    return withErrorLogging(
      () => httpClient.get<CommissioningTokenStatus>("/api/me/commissioning-token"),
      "CommissioningToken.getStatus",
    );
  },

  issueToken: async function (): Promise<IssuedCommissioningToken> {
    return withErrorLogging(
      () => httpClient.post<IssuedCommissioningToken>("/api/me/commissioning-token", {}),
      "CommissioningToken.issueToken",
    );
  },

  revoke: async function (): Promise<void> {
    return withErrorLogging(
      () => httpClient.delete("/api/me/commissioning-token"),
      "CommissioningToken.revoke",
    );
  },
};
