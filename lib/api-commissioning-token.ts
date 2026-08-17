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
    try {
      return await httpClient.get<CommissioningTokenStatus>("/api/me/commissioning-token");
    } catch (error) {
      console.error("Failed to fetch the commissioning token status", error);
      throw error;
    }
  },

  // Issues a new commissioning token, replacing any previous one. The
  // plaintext token is only ever returned here, once, by the backend — it is
  // never persisted client-side and can't be retrieved again afterward.
  issueToken: async function (): Promise<IssuedCommissioningToken> {
    try {
      return await httpClient.post<IssuedCommissioningToken>("/api/me/commissioning-token", {});
    } catch (error) {
      console.error("Failed to issue a commissioning token", error);
      throw error;
    }
  },

  // Revokes the caller's token without replacing it. Idempotent (revoking
  // with no token succeeds) and non-destructive to charge points already
  // claimed with it — only auto-commissioning a *new* one with the old value
  // stops working.
  revoke: async function (): Promise<void> {
    try {
      await httpClient.delete("/api/me/commissioning-token");
    } catch (error) {
      console.error("Failed to revoke the commissioning token", error);
      throw error;
    }
  },
};
