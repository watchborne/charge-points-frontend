import { HttpError, httpClient } from "./http-client";

export type AccessRequestInput = {
  email: string;
  locale?: string;
};

// The login-time access gate (charge-points-server ADR 0006): `allowed: true`
// means the caller may proceed to `signInWithOtp`; otherwise `code` says why
// not, for LoginForm to show the right copy. `NOT_INVITED` covers both
// "never applied" and "rejected" — the backend deliberately doesn't
// distinguish the two in its response.
export type LoginAccessCheck =
  { allowed: true } | { allowed: false; code: "ACCESS_PENDING" | "NOT_INVITED" };

export const accessRequestApis = {
  // Records a pending alpha access request. The backend is idempotent on the
  // email (a repeat request is a success, not an error), so callers only need
  // to distinguish success from a transport/validation failure.
  requestAccess: async function (input: AccessRequestInput): Promise<void> {
    await httpClient.post<{ ok: boolean }>("/api/access-requests", input);
  },

  // Checks whether `email` may sign in, per its access_requests.status
  // (pending/approved/rejected/never-applied). A 200 doesn't throw and
  // carries no `code`; a 202 (pending) also doesn't throw — fetch treats
  // every 2xx as `ok` — so both are read from the parsed body's `code`
  // rather than from success/failure. Only 403 (rejected/never-applied)
  // throws, as an HttpError.
  checkLoginAccess: async function (email: string): Promise<LoginAccessCheck> {
    try {
      const body = await httpClient.post<{ code?: "ACCESS_PENDING" | "NOT_INVITED" }>(
        "/api/access-requests/check-login",
        { email },
      );
      if (body.code) return { allowed: false, code: body.code };
      return { allowed: true };
    } catch (error) {
      if (error instanceof HttpError && error.status === 403) {
        return { allowed: false, code: "NOT_INVITED" };
      }
      throw error;
    }
  },
};
