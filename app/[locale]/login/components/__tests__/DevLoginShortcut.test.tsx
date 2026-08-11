import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Shallow-rendered: this file owns fetch orchestration only. VerifyOtpForm's
// own behavior (verifyOtp, auto-submit on initialCode, ...) is covered by
// VerifyOtpForm.test.tsx.
vi.mock("../VerifyOtpForm", () => ({
  VerifyOtpForm: ({ email, initialCode }: { email: string; initialCode: string }) => (
    <div data-testid="verify-otp-form">
      {email} / {initialCode}
    </div>
  ),
}));

import { DevLoginShortcut } from "../DevLoginShortcut";

const mockFetch = vi.fn();

function okResponse(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
}

function errorResponse(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 400 }));
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DevLoginShortcut", () => {
  it("SHOULD render a required email input and a submit button", () => {
    render(<DevLoginShortcut />);

    const input = screen.getByPlaceholderText("you@example.com") as HTMLInputElement;

    expect(input.type).toBe("email");
    expect(input.required).toBe(true);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });

  it("SHOULD fetch a code and render VerifyOtpForm with it WHEN submitted successfully", async () => {
    mockFetch.mockReturnValue(okResponse({ code: "111222" }));
    render(<DevLoginShortcut />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "dev@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(screen.getByTestId("verify-otp-form")).toBeTruthy());
    expect(mockFetch).toHaveBeenCalledWith("/auth/dev-login?email=dev%40example.com");
    expect(screen.getByTestId("verify-otp-form").textContent).toBe("dev@example.com / 111222");
  });

  it("SHOULD show the error and stay on the form WHEN the fetch fails", async () => {
    mockFetch.mockReturnValue(errorResponse({ error: "boom" }));
    render(<DevLoginShortcut />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "dev@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(screen.getByText("boom")).toBeTruthy());
    expect(screen.queryByTestId("verify-otp-form")).toBeNull();
  });
});
