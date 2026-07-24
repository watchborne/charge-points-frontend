import { Customer } from "@watchborne/charge-points-types";

import { httpClient } from "./http-client";

// The auth envelope charge-points-server's GET /api/me returns — not a
// domain entity, so it isn't part of @watchborne/charge-points-types (see
// that route's schemas.ts for the same reasoning server-side).
export type Me = {
  userId: string;
  customers: Customer[];
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
