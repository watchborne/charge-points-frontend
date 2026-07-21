import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClient, signInWithOtp } = vi.hoisted(() => {
  const signInWithOtp = vi.fn();
  return {
    signInWithOtp,
    createBrowserClient: vi.fn(() => ({ auth: { signInWithOtp } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "loginPage.form.email": "Email address",
      "loginPage.form.emailPlaceholder": "you@example.com",
      "loginPage.form.submit": "Send magic link",
      "loginPage.magicLink.error": "Couldn't send the sign-in link. Please try again.",
      "loginPage.magicLink.unknownUser":
        "No account is associated with this email address. Request Alpha access to create one.",
    };
    return translations[key] ?? key;
  },
}));

import { LoginForm } from "../LoginForm";

const onFormSubmitted = vi.fn();

beforeEach(() => {
  signInWithOtp.mockReset();
  onFormSubmitted.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("LoginForm", () => {
  it("SHOULD send a magic link and notify the parent WHEN the form is submitted", async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm onFormSubmitted={onFormSubmitted} />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    await waitFor(() => expect(onFormSubmitted).toHaveBeenCalledWith("user@example.com"));

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  });

  it("SHOULD show the translated error and stay on the form WHEN signInWithOtp fails", async () => {
    signInWithOtp.mockResolvedValue({ error: { message: "boom", code: "unexpected_failure" } });
    render(<LoginForm onFormSubmitted={onFormSubmitted} />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    await waitFor(() =>
      expect(screen.getByText("Couldn't send the sign-in link. Please try again.")).toBeTruthy(),
    );
    expect(onFormSubmitted).not.toHaveBeenCalled();
  });

  it("SHOULD show the unknown-user message WHEN the email doesn't belong to an existing account", async () => {
    signInWithOtp.mockResolvedValue({
      error: { message: "Signups not allowed for otp", code: "otp_disabled" },
    });
    render(<LoginForm onFormSubmitted={onFormSubmitted} />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "unknown@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "No account is associated with this email address. Request Alpha access to create one.",
        ),
      ).toBeTruthy(),
    );
    expect(screen.queryByText("Couldn't send the sign-in link. Please try again.")).toBeNull();
    expect(onFormSubmitted).not.toHaveBeenCalled();
  });

  it("SHOULD disable the submit button WHILE the request is in flight", async () => {
    let resolveSignIn: (value: { error: null }) => void = () => {};
    signInWithOtp.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    render(<LoginForm onFormSubmitted={onFormSubmitted} />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    expect(
      (screen.getByRole("button", { name: "Send magic link" }) as HTMLButtonElement).disabled,
    ).toBe(true);

    resolveSignIn({ error: null });
    await waitFor(() => expect(onFormSubmitted).toHaveBeenCalledWith("user@example.com"));
  });
});
