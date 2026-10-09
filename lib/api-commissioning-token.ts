import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The auth envelope charge-points-server's /api/me/commissioning-token routes
// return — not a domain entity, so it isn't part of
// @watchborne/charge-points-types (same reasoning as lib/api-me.ts's `Me`).
export type CommissioningTokenStatus = {
  // true only while the token is usable: an expired one reports false, with
  // its past expiresAt (null only when the caller never issued one).
  hasToken: boolean;
  createdAt: string | null;
  expiresAt: string | null;
  // Charge points commissioned with the current token (a use is a claim that
  // succeeded) and the optional ceiling on them. Null when the caller has no
  // token; absent from backends predating charge-points-server ADR 0029.
  useCount?: number | null;
  maxUses?: number | null;
  lastUsedAt?: string | null;
};

export type IssuedCommissioningToken = {
  token: string;
  createdAt: string;
  expiresAt: string;
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
