import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { verifyEmail } = vi.hoisted(() => ({ verifyEmail: vi.fn() }));

vi.mock("../../../../lib/api", () => ({
  api: { AccessRequests: { verifyEmail } },
}));

let currentToken: string | null = "a-valid-token";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(currentToken ? { token: currentToken } : {}),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "signupPage.verify.verifying": "Confirming your email…",
      "signupPage.verify.successTitle": "Email confirmed",
      "signupPage.verify.successDescription":
        "Your email has been confirmed. We'll review your request and email you once it's approved.",
      "signupPage.verify.invalidTitle": "Invalid link",
      "signupPage.verify.invalidDescription":
        "This confirmation link is invalid. Please request access again to get a new one.",
      "signupPage.verify.expiredTitle": "Link expired",
      "signupPage.verify.expiredDescription":
        "This confirmation link has expired. Please request access again to get a new one.",
      "signupPage.verify.backToSignup": "Back to sign-up",
    };
    return translations[key] ?? key;
  },
}));

import VerifyEmailPage from "../page";

beforeEach(() => {
  verifyEmail.mockReset();
  currentToken = "a-valid-token";
});

afterEach(() => {
  cleanup();
});

describe("VerifyEmailPage", () => {
  it("SHOULD show the success message WHEN the token is verified", async () => {
    verifyEmail.mockResolvedValue({ verified: true });
    render(<VerifyEmailPage />);

    await waitFor(() => expect(screen.getByText("Email confirmed")).toBeTruthy());
    expect(verifyEmail).toHaveBeenCalledWith("a-valid-token");
  });

  it("SHOULD show the expired message WHEN the token has expired", async () => {
    verifyEmail.mockResolvedValue({ verified: false, code: "EXPIRED_TOKEN" });
    render(<VerifyEmailPage />);

    await waitFor(() => expect(screen.getByText("Link expired")).toBeTruthy());
    expect(screen.getByText("Back to sign-up")).toBeTruthy();
  });

  it("SHOULD show the invalid message WHEN the token is invalid", async () => {
    verifyEmail.mockResolvedValue({ verified: false, code: "INVALID_TOKEN" });
    render(<VerifyEmailPage />);

    await waitFor(() => expect(screen.getByText("Invalid link")).toBeTruthy());
  });

  it("SHOULD show the invalid message WHEN the check itself fails (transport error)", async () => {
    verifyEmail.mockRejectedValue(new Error("network down"));
    render(<VerifyEmailPage />);

    await waitFor(() => expect(screen.getByText("Invalid link")).toBeTruthy());
  });

  it("SHOULD show the invalid message immediately WHEN there is no token in the URL", async () => {
    currentToken = null;
    render(<VerifyEmailPage />);

    await waitFor(() => expect(screen.getByText("Invalid link")).toBeTruthy());
    expect(verifyEmail).not.toHaveBeenCalled();
  });
});
