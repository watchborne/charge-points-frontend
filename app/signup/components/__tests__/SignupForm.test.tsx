import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClient, signUp } = vi.hoisted(() => {
  const signUp = vi.fn();
  return {
    signUp,
    createBrowserClient: vi.fn(() => ({ auth: { signUp } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "signupPage.form.email": "Email address",
      "signupPage.form.emailPlaceholder": "you@example.com",
      "signupPage.form.submit": "Sign up",
      "signupPage.confirmation.error": "Couldn't create your account. Please try again.",
    };
    return translations[key] ?? key;
  },
}));

import { SignupForm } from "../SignupForm";

const onFormSubmitted = vi.fn();

beforeEach(() => {
  signUp.mockReset();
  onFormSubmitted.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("SignupForm", () => {
  it("SHOULD sign the user up and notify the parent WHEN the form is submitted", async () => {
    signUp.mockResolvedValue({ error: null });
    render(<SignupForm onFormSubmitted={onFormSubmitted} />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => expect(onFormSubmitted).toHaveBeenCalledWith("user@example.com"));

    expect(signUp).toHaveBeenCalledTimes(1);
    const call = signUp.mock.calls[0][0];
    expect(call.email).toBe("user@example.com");
    expect(typeof call.password).toBe("string");
    expect(call.password.length).toBeGreaterThan(0);
    expect(call.options).toEqual({ emailRedirectTo: `${window.location.origin}/auth/callback` });
  });

  it("SHOULD show the translated error and stay on the form WHEN signUp fails", async () => {
    signUp.mockResolvedValue({ error: { message: "boom" } });
    render(<SignupForm onFormSubmitted={onFormSubmitted} />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() =>
      expect(screen.getByText("Couldn't create your account. Please try again.")).toBeTruthy(),
    );
    expect(onFormSubmitted).not.toHaveBeenCalled();
  });

  it("SHOULD disable the submit button WHILE the request is in flight", async () => {
    let resolveSignUp: (value: { error: null }) => void = () => {};
    signUp.mockReturnValue(
      new Promise((resolve) => {
        resolveSignUp = resolve;
      }),
    );
    render(<SignupForm onFormSubmitted={onFormSubmitted} />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect((screen.getByRole("button", { name: "Sign up" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    resolveSignUp({ error: null });
    await waitFor(() => expect(onFormSubmitted).toHaveBeenCalledWith("user@example.com"));
  });
});
