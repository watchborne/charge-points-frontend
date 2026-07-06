import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const { createBrowserClient, signUp } = vi.hoisted(() => {
  const signUp = vi.fn();
  return {
    signUp,
    createBrowserClient: vi.fn(() => ({ auth: { signUp } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

import { SignupForm } from "../SignupForm";

const labels = {
  email: "Email address",
  emailPlaceholder: "you@example.com",
  submit: "Sign up",
  sentTitle: "Check your inbox",
  sentDescription: "A confirmation email has been sent to the address below.",
  error: "Couldn't create your account. Please try again.",
};

beforeEach(() => {
  signUp.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("SignupForm", () => {
  it("signs the user up and shows the confirmation panel with the submitted email", async () => {
    signUp.mockResolvedValue({ error: null });
    render(<SignupForm labels={labels} />);

    fireEvent.change(screen.getByLabelText(labels.email), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    await waitFor(() => expect(screen.getByText(labels.sentTitle)).toBeTruthy());

    expect(signUp).toHaveBeenCalledTimes(1);
    const call = signUp.mock.calls[0][0];
    expect(call.email).toBe("user@example.com");
    expect(typeof call.password).toBe("string");
    expect(call.password.length).toBeGreaterThan(0);
    expect(call.options).toEqual({ emailRedirectTo: `${window.location.origin}/auth/callback` });
    expect(screen.getByText("user@example.com")).toBeTruthy();
  });

  it("shows the translated error and stays on the form when signUp fails", async () => {
    signUp.mockResolvedValue({ error: { message: "boom" } });
    render(<SignupForm labels={labels} />);

    fireEvent.change(screen.getByLabelText(labels.email), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    await waitFor(() => expect(screen.getByText(labels.error)).toBeTruthy());
    expect(screen.queryByText(labels.sentTitle)).toBeNull();
  });

  it("disables the submit button while the request is in flight", async () => {
    let resolveSignUp: (value: { error: null }) => void = () => {};
    signUp.mockReturnValue(
      new Promise((resolve) => {
        resolveSignUp = resolve;
      }),
    );
    render(<SignupForm labels={labels} />);

    fireEvent.change(screen.getByLabelText(labels.email), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    expect(
      (screen.getByRole("button", { name: labels.submit }) as HTMLButtonElement).disabled,
    ).toBe(true);

    resolveSignUp({ error: null });
    await waitFor(() => expect(screen.getByText(labels.sentTitle)).toBeTruthy());
  });
});
