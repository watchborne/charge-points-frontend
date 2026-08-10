import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClient, signInWithOtp, verifyOtp } = vi.hoisted(() => {
  const signInWithOtp = vi.fn();
  const verifyOtp = vi.fn();
  return {
    signInWithOtp,
    verifyOtp,
    createBrowserClient: vi.fn(() => ({ auth: { signInWithOtp, verifyOtp } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "loginPage.otp.description": "A 6-digit code has been sent to {email}.",
      "loginPage.otp.codeLabel": "Verification code",
      "loginPage.otp.codePlaceholder": "123456",
      "loginPage.otp.submit": "Verify",
      "loginPage.otp.changeEmail": "Use a different address",
      "loginPage.otp.resend": "Resend code",
      "loginPage.otp.resendCooldown": "Resend code (wait)",
      "loginPage.otp.error.invalid": "This code is invalid or has expired.",
      "loginPage.otp.error.generic": "Verification failed. Please try again.",
    };
    return translations[key] ?? key;
  },
}));

import { VerifyOtpForm } from "../VerifyOtpForm";

const onBack = vi.fn();
const assign = vi.fn();
const originalLocation = window.location;

const typeCode = (value: string) =>
  fireEvent.change(screen.getByLabelText("Verification code"), { target: { value } });

beforeEach(() => {
  signInWithOtp.mockReset();
  verifyOtp.mockReset();
  onBack.mockReset();
  assign.mockReset();
  // jsdom's window.location.assign can't be spied on directly, so swap in a
  // stub that records the navigation target (same technique as LogoutButton.test.tsx).
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, assign },
  });
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

describe("VerifyOtpForm", () => {
  it("SHOULD verify the code and hard-redirect to the dashboard WHEN submitted with a valid code", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    typeCode("123456");
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/app/dashboard"));
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      token: "123456",
      type: "email",
    });
  });

  it("SHOULD auto-submit WHEN rendered with an initialCode (dev-login shortcut)", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    render(<VerifyOtpForm email="dev@example.com" onBack={onBack} initialCode="999888" />);

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/app/dashboard"));
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "dev@example.com",
      token: "999888",
      type: "email",
    });
  });

  it("SHOULD strip non-digit characters and cap the code at 6 digits WHILE typing", () => {
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    typeCode("12a3-45–6789");

    expect((screen.getByLabelText("Verification code") as HTMLInputElement).value).toBe("123456");
  });

  it("SHOULD show the invalid-code error WHEN verifyOtp fails with otp_expired", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "boom", code: "otp_expired" } });
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    typeCode("000000");
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() =>
      expect(screen.getByText("This code is invalid or has expired.")).toBeTruthy(),
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it("SHOULD show the generic error WHEN verifyOtp fails for another reason", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "boom", code: "unexpected_failure" } });
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    typeCode("000000");
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() =>
      expect(screen.getByText("Verification failed. Please try again.")).toBeTruthy(),
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it("SHOULD disable the submit button WHILE verification is in flight", async () => {
    let resolveVerify: (value: { error: null }) => void = () => {};
    verifyOtp.mockReturnValue(
      new Promise((resolve) => {
        resolveVerify = resolve;
      }),
    );
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    typeCode("123456");
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect((screen.getByRole("button", { name: "Verify" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    resolveVerify({ error: null });
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/app/dashboard"));
  });

  it("SHOULD call onBack WHEN the change-email action is clicked", () => {
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    fireEvent.click(screen.getByText("Use a different address"));

    expect(onBack).toHaveBeenCalled();
  });

  it("SHOULD resend the code and start the cooldown WHEN the resend action is clicked", async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    fireEvent.click(screen.getByText("Resend code"));

    await waitFor(() =>
      expect(signInWithOtp).toHaveBeenCalledWith({
        email: "user@example.com",
        options: { shouldCreateUser: false, data: { locale: "fr" } },
      }),
    );

    const resendButton = screen.getByText("Resend code (wait)") as HTMLButtonElement;
    expect(resendButton.disabled).toBe(true);
  });

  it("SHOULD show the generic error WHEN resending fails", async () => {
    signInWithOtp.mockResolvedValue({
      error: { message: "boom", code: "over_email_send_rate_limit" },
    });
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    fireEvent.click(screen.getByText("Resend code"));

    await waitFor(() =>
      expect(screen.getByText("Verification failed. Please try again.")).toBeTruthy(),
    );
  });
});
