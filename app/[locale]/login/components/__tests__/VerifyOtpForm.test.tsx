import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VerifyOtpForm } from "../VerifyOtpForm";

const { createBrowserClient, signInWithOtp, verifyOtp } = vi.hoisted(() => {
  const signInWithOtp = vi.fn();
  const verifyOtp = vi.fn();
  return {
    signInWithOtp,
    verifyOtp,
    createBrowserClient: vi.fn(() => ({ auth: { signInWithOtp, verifyOtp } })),
  };
});

const { push } = vi.hoisted(() => {
  return { push: vi.fn() };
});

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    useRouter: () => ({
      push,
    }),
    Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
      <a href={href}>{children}</a>
    ),
    usePathname: () => "/",
    redirect: vi.fn(),
    getPathname: vi.fn(),
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

const onBack = vi.fn();

const typeCode = (value: string) =>
  fireEvent.change(screen.getByLabelText("loginPage.otp.codeLabel"), { target: { value } });

beforeEach(() => {
  signInWithOtp.mockReset();
  verifyOtp.mockReset();
  onBack.mockReset();
  push.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("VerifyOtpForm", () => {
  it("SHOULD verify the code and hard-redirect to the dashboard WHEN submitted with a valid code", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    typeCode("12345678");
    fireEvent.click(screen.getByRole("button", { name: "loginPage.otp.submit" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/dashboard"));
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      token: "12345678",
      type: "email",
    });
  });

  it("SHOULD auto-submit WHEN rendered with an initialCode (dev-login shortcut)", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    render(<VerifyOtpForm email="dev@example.com" onBack={onBack} initialCode="99988877" />);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/dashboard"));
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "dev@example.com",
      token: "99988877",
      type: "email",
    });
  });

  it("SHOULD strip non-digit characters and cap the code at 6 digits WHILE typing", () => {
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    typeCode("12a3-45–6789");

    expect((screen.getByLabelText("loginPage.otp.codeLabel") as HTMLInputElement).value).toBe(
      "12345678",
    );
  });

  it("SHOULD show the invalid-code error WHEN verifyOtp fails with otp_expired", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "boom", code: "otp_expired" } });
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    typeCode("00000000");
    fireEvent.click(screen.getByRole("button", { name: "loginPage.otp.submit" }));

    await waitFor(() => expect(screen.getByText("loginPage.otp.error.invalid")).toBeTruthy());
    expect(push).not.toHaveBeenCalled();
  });

  it("SHOULD show the generic error WHEN verifyOtp fails for another reason", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "boom", code: "unexpected_failure" } });
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    typeCode("00000000");
    fireEvent.click(screen.getByRole("button", { name: "loginPage.otp.submit" }));

    await waitFor(() => expect(screen.getByText("loginPage.otp.error.generic")).toBeTruthy());
    expect(push).not.toHaveBeenCalled();
  });

  it("SHOULD disable the submit button WHILE verification is in flight", async () => {
    let resolveVerify: (value: { error: null }) => void = () => {};
    verifyOtp.mockReturnValue(
      new Promise((resolve) => {
        resolveVerify = resolve;
      }),
    );
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    typeCode("12345678");
    fireEvent.click(screen.getByRole("button", { name: "loginPage.otp.submit" }));

    expect(
      (screen.getByRole("button", { name: "loginPage.otp.submit" }) as HTMLButtonElement).disabled,
    ).toBe(true);

    resolveVerify({ error: null });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/dashboard"));
  });

  it("SHOULD call onBack WHEN the change-email action is clicked", () => {
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    fireEvent.click(screen.getByText("loginPage.otp.changeEmail"));

    expect(onBack).toHaveBeenCalled();
  });

  it("SHOULD resend the code and start the cooldown WHEN the resend action is clicked", async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    fireEvent.click(screen.getByText("loginPage.otp.resend"));

    await waitFor(() =>
      expect(signInWithOtp).toHaveBeenCalledWith({
        email: "user@example.com",
        options: { shouldCreateUser: false, data: { locale: "fr" } },
      }),
    );

    const resendButton = screen.getByText("loginPage.otp.resendCooldown") as HTMLButtonElement;
    expect(resendButton.disabled).toBe(true);
  });

  it("SHOULD show the generic error WHEN resending fails", async () => {
    signInWithOtp.mockResolvedValue({
      error: { message: "boom", code: "over_email_send_rate_limit" },
    });
    render(<VerifyOtpForm email="user@example.com" onBack={onBack} />);

    fireEvent.click(screen.getByText("loginPage.otp.resend"));

    await waitFor(() => expect(screen.getByText("loginPage.otp.error.generic")).toBeTruthy());
  });
});
