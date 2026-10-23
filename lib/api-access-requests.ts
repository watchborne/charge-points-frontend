import { HttpError, httpClient } from "./http-client";

export type AccessRequestInput = {
  email: string;
  locale?: string;
};

// The login-time access gate: `allowed: true` lets the caller proceed to
// `signInWithOtp`; otherwise `code` says why. `NOT_INVITED` covers both
// "never applied" and "rejected".
export type LoginAccessCheck =
  { allowed: true } | { allowed: false; code: "ACCESS_PENDING" | "NOT_INVITED" };

// The confirmation link's result: `verified: true` once confirmed (now or
// before); otherwise `code` says why.
export type EmailVerificationResult =
  { verified: true } | { verified: false; code: "INVALID_TOKEN" | "EXPIRED_TOKEN" };

export const accessRequestApis = {
  // Records a pending access request; idempotent on email.
  requestAccess: async function (input: AccessRequestInput): Promise<void> {
    await httpClient.post<{ ok: boolean }>("/api/access-requests", input);
  },

  // Whether `email` may sign in. 200 and 202 (pending) both resolve, read from
  // `code`; only 403 throws (HttpError).
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

  // Confirms the /signup email. Every denial is a 400, so a plain try/catch.
  verifyEmail: async function (token: string): Promise<EmailVerificationResult> {
    try {
      await httpClient.post<{ ok: boolean }>("/api/access-requests/verify-email", { token });
      return { verified: true };
    } catch (error) {
      if (error instanceof HttpError && typeof error.body === "object" && error.body !== null) {
        const code = (error.body as { code?: string }).code;
        if (code === "INVALID_TOKEN" || code === "EXPIRED_TOKEN") {
          return { verified: false, code };
        }
      }
      throw error;
    }
  },
};
