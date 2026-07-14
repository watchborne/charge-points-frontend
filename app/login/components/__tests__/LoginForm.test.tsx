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

import { LoginForm } from "../LoginForm";

const labels = {
  email: "Email address",
  emailPlaceholder: "you@example.com",
  submit: "Send magic link",
  sentTitle: "Check your inbox",
  sentDescription: "A sign-in link has been sent to the address below.",
  error: "Couldn't send the sign-in link. Please try again.",
  unknownUser: "No account is associated with this email address.",
};

beforeEach(() => {
  signInWithOtp.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("LoginForm", () => {
  it("SHOULD send a magic link and show the confirmation panel WHEN the form is submitted", async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm labels={labels} />);

    fireEvent.change(screen.getByLabelText(labels.email), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    await waitFor(() => expect(screen.getByText(labels.sentTitle)).toBeTruthy());

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    expect(screen.getByText("user@example.com")).toBeTruthy();
  });

  it("SHOULD show the translated error and stay on the form WHEN signInWithOtp fails", async () => {
    signInWithOtp.mockResolvedValue({ error: { message: "boom", code: "unexpected_failure" } });
    render(<LoginForm labels={labels} />);

    fireEvent.change(screen.getByLabelText(labels.email), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    await waitFor(() => expect(screen.getByText(labels.error)).toBeTruthy());
    expect(screen.queryByText(labels.sentTitle)).toBeNull();
  });

  it("SHOULD show the unknown-user message WHEN the email doesn't belong to an existing account", async () => {
    signInWithOtp.mockResolvedValue({
      error: { message: "Signups not allowed for otp", code: "otp_disabled" },
    });
    render(<LoginForm labels={labels} />);

    fireEvent.change(screen.getByLabelText(labels.email), {
      target: { value: "unknown@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    await waitFor(() => expect(screen.getByText(labels.unknownUser)).toBeTruthy());
    expect(screen.queryByText(labels.error)).toBeNull();
    expect(screen.queryByText(labels.sentTitle)).toBeNull();
  });

  it("SHOULD disable the submit button WHILE the request is in flight", async () => {
    let resolveSignIn: (value: { error: null }) => void = () => {};
    signInWithOtp.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    render(<LoginForm labels={labels} />);

    fireEvent.change(screen.getByLabelText(labels.email), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    expect(
      (screen.getByRole("button", { name: labels.submit }) as HTMLButtonElement).disabled,
    ).toBe(true);

    resolveSignIn({ error: null });
    await waitFor(() => expect(screen.getByText(labels.sentTitle)).toBeTruthy());
  });
});
