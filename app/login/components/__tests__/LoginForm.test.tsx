import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

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
  it("sends a magic link and shows the confirmation panel with the submitted email", async () => {
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

  it("shows the translated error and stays on the form when signInWithOtp fails", async () => {
    signInWithOtp.mockResolvedValue({ error: { message: "boom", code: "unexpected_failure" } });
    render(<LoginForm labels={labels} />);

    fireEvent.change(screen.getByLabelText(labels.email), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    await waitFor(() => expect(screen.getByText(labels.error)).toBeTruthy());
    expect(screen.queryByText(labels.sentTitle)).toBeNull();
  });

  it("shows the unknown-user message when the email doesn't belong to an existing account", async () => {
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

  it("disables the submit button while the request is in flight", async () => {
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
