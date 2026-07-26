import { httpClient } from "./http-client";

export type AccessRequestInput = {
  email: string;
  locale?: string;
};

export const accessRequestApis = {
  // Records a pending alpha access request. The backend is idempotent on the
  // email (a repeat request is a success, not an error), so callers only need
  // to distinguish success from a transport/validation failure.
  requestAccess: async function (input: AccessRequestInput): Promise<void> {
    await httpClient.post<{ ok: boolean }>("/api/access-requests", input);
  },
};
