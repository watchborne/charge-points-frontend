import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The /api/me/commissioning-token envelope; not a domain entity.
export type CommissioningTokenStatus = {
  // true only while the token is usable: an expired one reports false, with
  // its past expiresAt, and so does a spent one (useCount reached maxUses),
  // with a future expiresAt (null only when the caller never issued one).
  hasToken: boolean;
  createdAt: string | null;
  expiresAt: string | null;
  // Charge points commissioned with the current token, and the optional
  // ceiling. Null without a token; absent from older backends.
  useCount?: number | null;
  maxUses?: number | null;
  // Last time a station presented the token, refusals included (hourly
  // precision); null when it never was.
  lastUsedAt?: string | null;
};

export const MAX_USES_LIMIT = 1000;

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

  // `maxUses` caps the charge points the new token may commission (1 to
  // 1000); omitted, it is unlimited.
  issueToken: async function (maxUses?: number | null): Promise<IssuedCommissioningToken> {
    return withErrorLogging(
      () =>
        httpClient.post<IssuedCommissioningToken>(
          "/api/me/commissioning-token",
          maxUses == null ? {} : { maxUses },
        ),
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
